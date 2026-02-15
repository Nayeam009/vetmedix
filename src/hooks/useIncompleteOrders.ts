import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IncompleteOrder {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  items: any;
  cart_total: number;
  shipping_address: string | null;
  division: string | null;
  completeness: number;
  status: string;
  recovered_order_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const useIncompleteOrders = () => {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-incomplete-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incomplete_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as IncompleteOrder[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('incomplete-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incomplete_orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomplete_orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] }),
  });

  const convertMutation = useMutation({
    mutationFn: async ({ order, editedData }: {
      order: IncompleteOrder;
      editedData: {
        customer_name: string;
        customer_phone: string;
        customer_email: string;
        shipping_address: string;
        division: string;
      };
    }) => {
      // Update incomplete order with admin-entered data
      await supabase.from('incomplete_orders').update({
        customer_name: editedData.customer_name,
        customer_phone: editedData.customer_phone,
        customer_email: editedData.customer_email,
        shipping_address: editedData.shipping_address,
        division: editedData.division,
        completeness: 100,
      }).eq('id', order.id);

      // Create real order with complete data
      const shippingAddress = [
        editedData.customer_name,
        editedData.customer_phone,
        editedData.shipping_address,
      ].filter(Boolean).join(', ');

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: order.user_id || '00000000-0000-0000-0000-000000000000',
          items: order.items,
          total_amount: order.cart_total,
          shipping_address: shippingAddress,
          payment_method: 'cod',
          status: 'pending',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Mark as recovered
      await supabase
        .from('incomplete_orders')
        .update({ status: 'recovered', recovered_order_id: newOrder.id })
        .eq('id', order.id);

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-incomplete-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  // Stats
  const incomplete = orders.filter(o => o.status === 'incomplete');
  const recovered = orders.filter(o => o.status === 'recovered');
  const totalIncomplete = incomplete.length;
  const totalRecovered = recovered.length;
  const recoveryRate = orders.length > 0 ? Math.round((totalRecovered / orders.length) * 100) : 0;
  const lostRevenue = incomplete.reduce((sum, o) => sum + (o.cart_total || 0), 0);
  const recoveredRevenue = recovered.reduce((sum, o) => sum + (o.cart_total || 0), 0);

  return {
    orders,
    isLoading,
    incomplete,
    recovered,
    totalIncomplete,
    totalRecovered,
    recoveryRate,
    lostRevenue,
    recoveredRevenue,
    deleteOrder: deleteMutation.mutateAsync,
    convertOrder: convertMutation.mutateAsync,
    isConverting: convertMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
