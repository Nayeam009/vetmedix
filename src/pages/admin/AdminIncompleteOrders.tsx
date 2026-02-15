import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useIncompleteOrders, IncompleteOrder } from '@/hooks/useIncompleteOrders';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  ShoppingCart, TrendingUp, DollarSign, AlertTriangle,
  Search, Trash2, ArrowUpRight, Phone, Mail, MapPin, Clock, Package
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, active, onClick }: { icon: React.ElementType; label: string; value: string | number; color: string; active?: boolean; onClick?: () => void }) => (
  <Card 
    className={`border-border/50 cursor-pointer transition-all hover:shadow-md active:scale-95 ${active ? 'ring-2 ring-primary shadow-md' : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
  >
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const CompletenessBadge = ({ value }: { value: number }) => {
  const color = value >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
    : value >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{value}%</span>;
};

const AdminIncompleteOrders = () => {
  useDocumentTitle('Incomplete Orders');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { orders, isLoading, totalIncomplete, totalRecovered, recoveryRate, lostRevenue, deleteOrder, convertOrder, isConverting } = useIncompleteOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'recovered'>('all');
  const [convertDialog, setConvertDialog] = useState<IncompleteOrder | null>(null);

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (o.customer_name?.toLowerCase().includes(q)) ||
      (o.customer_phone?.toLowerCase().includes(q)) ||
      (o.customer_email?.toLowerCase().includes(q));
  });

  const handleConvert = async () => {
    if (!convertDialog) return;
    try {
      await convertOrder(convertDialog);
      toast.success('Order converted successfully!');
      setConvertDialog(null);
    } catch {
      toast.error('Failed to convert order');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder(id);
      toast.success('Incomplete order deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Incomplete Orders">
        <div className="p-4 sm:p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Incomplete Orders">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Incomplete Orders</h1>
          <p className="text-sm text-muted-foreground">Track and recover abandoned checkouts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={ShoppingCart} label="Incomplete" value={totalIncomplete} color="bg-amber-500/10 text-amber-600" active={statusFilter === 'incomplete'} onClick={() => setStatusFilter(f => f === 'incomplete' ? 'all' : 'incomplete')} />
          <StatCard icon={TrendingUp} label="Recovered" value={totalRecovered} color="bg-green-500/10 text-green-600" active={statusFilter === 'recovered'} onClick={() => setStatusFilter(f => f === 'recovered' ? 'all' : 'recovered')} />
          <StatCard icon={AlertTriangle} label="Recovery Rate" value={`${recoveryRate}%`} color="bg-blue-500/10 text-blue-600" onClick={() => navigate('/admin/recovery-analytics')} />
          <StatCard icon={DollarSign} label="Lost Revenue" value={`৳${lostRevenue.toLocaleString()}`} color="bg-red-500/10 text-red-600" active={statusFilter === 'incomplete'} onClick={() => setStatusFilter(f => f === 'incomplete' ? 'all' : 'incomplete')} />
        </div>

        {/* Revenue Banner */}
        {lostRevenue > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="font-semibold text-red-700 dark:text-red-300">৳{lostRevenue.toLocaleString()}</span>
              <span className="text-sm text-red-600/80 dark:text-red-400/80">potential revenue from {totalIncomplete} incomplete orders</span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>

        {/* Table / Cards */}
        {isMobile ? (
          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No incomplete orders</p>}
            {filtered.map(order => (
              <Card key={order.id} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{order.customer_name || 'Unknown'}</p>
                      {order.customer_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{order.customer_phone}</p>}
                      {order.customer_email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{order.customer_email}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <CompletenessBadge value={order.completeness} />
                      {order.status === 'recovered' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Recovered</Badge>}
                    </div>
                  </div>
                  {order.shipping_address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{order.shipping_address}</p>}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">৳{(order.cart_total || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'incomplete' && (
                        <Button size="sm" variant="default" className="h-8 text-xs" onClick={() => setConvertDialog(order)}>
                          <ArrowUpRight className="h-3 w-3 mr-1" />Convert
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => handleDelete(order.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Cart Value</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No incomplete orders</TableCell></TableRow>
                )}
                {filtered.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.customer_name || 'Unknown'}</p>
                        {order.customer_email && <p className="text-xs text-muted-foreground">{order.customer_email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{order.customer_phone || '—'}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{order.shipping_address || '—'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">৳{(order.cart_total || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{Array.isArray(order.items) ? order.items.length : 0} items</p>
                      </div>
                    </TableCell>
                    <TableCell><CompletenessBadge value={order.completeness} /></TableCell>
                    <TableCell>
                      {order.status === 'recovered' 
                        ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Recovered</Badge>
                        : <Badge variant="outline">Incomplete</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {order.status === 'incomplete' && (
                          <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setConvertDialog(order)}>
                            <ArrowUpRight className="h-3 w-3 mr-1" />Convert
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(order.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Convert Dialog */}
        <Dialog open={!!convertDialog} onOpenChange={() => setConvertDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Convert to Order</DialogTitle>
              <DialogDescription>This will create a real order from this incomplete checkout.</DialogDescription>
            </DialogHeader>
            {convertDialog && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                  <p><strong>Customer:</strong> {convertDialog.customer_name || 'Unknown'}</p>
                  <p><strong>Phone:</strong> {convertDialog.customer_phone || '—'}</p>
                  <p><strong>Email:</strong> {convertDialog.customer_email || '—'}</p>
                  <p><strong>Address:</strong> {convertDialog.shipping_address || '—'}</p>
                  <p><strong>Cart Total:</strong> ৳{(convertDialog.cart_total || 0).toLocaleString()}</p>
                  <p><strong>Items:</strong> {Array.isArray(convertDialog.items) ? convertDialog.items.length : 0} items</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConvertDialog(null)}>Cancel</Button>
              <Button onClick={handleConvert} disabled={isConverting}>
                {isConverting ? 'Converting...' : 'Convert to Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminIncompleteOrders;
