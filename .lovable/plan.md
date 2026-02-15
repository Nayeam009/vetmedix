
# Incomplete Order Recovery - Editable Admin Convert Form

## Problem
Currently when the admin clicks "Convert" on an incomplete order, they see a **read-only summary** with no way to fill in missing details. The admin needs to call the customer, get their info, and enter it before converting.

Additionally, orders that are successfully placed by customers (100% complete, order placed) already get marked as "recovered" via the `markRecovered` call in `CheckoutPage.tsx` (line 292). This logic is correct and working. However, we should also filter out any 100% complete orders that somehow remain with status "incomplete" (edge case where the user filled everything but the `markRecovered` call didn't fire).

## Changes

### 1. Upgrade the Convert Dialog to an Editable Form
**File**: `src/pages/admin/AdminIncompleteOrders.tsx`

Replace the static `<p><strong>Customer:</strong> ...` display with editable `Input` fields pre-filled with whatever data the customer already provided. The admin can then fill in missing fields (name, phone, address, division) before converting.

Fields in the form:
- Customer Name (Input, pre-filled or empty)
- Phone Number (Input, pre-filled or empty) 
- Email (Input, pre-filled or empty)
- Shipping Address (Input, pre-filled or empty)
- Division (Input, pre-filled or empty)
- Cart Total (display only, not editable)
- Items list (display only)
- Payment Method (default COD)

The form will validate that at minimum **Name**, **Phone**, and **Address** are filled before allowing conversion.

### 2. Update the Convert Mutation to Use Edited Data
**File**: `src/hooks/useIncompleteOrders.ts`

Change `convertMutation` to accept an object with the edited form data (not just the raw IncompleteOrder). The mutation will:
1. Update the incomplete_orders record with the admin-entered details first
2. Create the real order using the completed data
3. Mark the incomplete order as "recovered"

### 3. Filter Out 100% Complete + Recovered Orders
**File**: `src/pages/admin/AdminIncompleteOrders.tsx`

In the `filtered` logic, also exclude orders where `completeness === 100 AND status === 'recovered'`. The existing filter already hides recovered orders from the default view. We just need to ensure no 100% complete orders that were actually placed show up as "incomplete".

### 4. Add Trash Confirmation Dialog
**File**: `src/pages/admin/AdminIncompleteOrders.tsx`

Add a confirmation dialog before deleting (moving to trash) so the admin doesn't accidentally delete an incomplete order.

---

## Technical Details

### Convert Dialog Form State
```tsx
const [convertFormData, setConvertFormData] = useState({
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  shipping_address: '',
  division: '',
});

// Pre-fill when dialog opens
useEffect(() => {
  if (convertDialog) {
    setConvertFormData({
      customer_name: convertDialog.customer_name || '',
      customer_phone: convertDialog.customer_phone || '',
      customer_email: convertDialog.customer_email || '',
      shipping_address: convertDialog.shipping_address || '',
      division: convertDialog.division || '',
    });
  }
}, [convertDialog]);
```

### Updated Convert Mutation Signature
```tsx
const convertMutation = useMutation({
  mutationFn: async ({ order, editedData }: { 
    order: IncompleteOrder; 
    editedData: { 
      customer_name: string; 
      customer_phone: string; 
      customer_email: string; 
      shipping_address: string; 
      division: string; 
    } 
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
      editedData.shipping_address
    ].filter(Boolean).join(', ');

    const { data: newOrder, error } = await supabase
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

    if (error) throw error;

    // Mark as recovered
    await supabase.from('incomplete_orders')
      .update({ status: 'recovered', recovered_order_id: newOrder.id })
      .eq('id', order.id);

    return newOrder;
  },
});
```

### Validation Before Convert
The "Convert to Order" button will be disabled until Name, Phone, and Address are all filled. A helper text will show which fields are missing.

### Files to Edit (2 files)
1. `src/pages/admin/AdminIncompleteOrders.tsx` - Editable convert form, trash confirmation, filtering
2. `src/hooks/useIncompleteOrders.ts` - Updated convert mutation to accept edited data
