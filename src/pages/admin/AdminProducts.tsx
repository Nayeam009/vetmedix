import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Package,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdmin, useAdminProducts } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { CSVImportDialog } from '@/components/admin/CSVImportDialog';
import { productFormSchema } from '@/lib/validations';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { downloadCSV } from '@/lib/csvParser';

const AdminProducts = () => {
  useDocumentTitle('Products - Admin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();
  const { data: products, isLoading } = useAdminProducts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pet' as 'Pet' | 'Farm',
    product_type: '',
    image_url: '',
    stock: '',
    badge: '',
    discount: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && !roleLoading && !isAdmin) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Pet',
      product_type: '',
      image_url: '',
      stock: '',
      badge: '',
      discount: '',
    });
  };

  const handleAdd = async () => {
    // Validate with Zod schema
    const validationResult = productFormSchema.safeParse({
      name: formData.name,
      description: formData.description || null,
      price: formData.price ? parseFloat(formData.price) : 0,
      category: formData.category,
      product_type: formData.product_type || null,
      image_url: formData.image_url || null,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      badge: formData.badge || null,
      discount: formData.discount ? parseFloat(formData.discount) : null,
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation Error', description: errorMessage, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('products').insert({
        name: validationResult.data.name,
        description: validationResult.data.description || null,
        price: validationResult.data.price,
        category: validationResult.data.category,
        product_type: validationResult.data.product_type || null,
        image_url: validationResult.data.image_url || null,
        stock: validationResult.data.stock,
        badge: validationResult.data.badge || null,
        discount: validationResult.data.discount,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Product added successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsAddOpen(false);
      resetForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add product';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;

    // Validate with Zod schema
    const validationResult = productFormSchema.safeParse({
      name: formData.name,
      description: formData.description || null,
      price: formData.price ? parseFloat(formData.price) : 0,
      category: formData.category,
      product_type: formData.product_type || null,
      image_url: formData.image_url || null,
      stock: formData.stock ? parseInt(formData.stock) : 0,
      badge: formData.badge || null,
      discount: formData.discount ? parseFloat(formData.discount) : null,
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      toast({ title: 'Validation Error', description: errorMessage, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('products').update({
        name: validationResult.data.name,
        description: validationResult.data.description || null,
        price: validationResult.data.price,
        category: validationResult.data.category,
        product_type: validationResult.data.product_type || null,
        image_url: validationResult.data.image_url || null,
        stock: validationResult.data.stock,
        badge: validationResult.data.badge || null,
        discount: validationResult.data.discount,
      }).eq('id', selectedProduct.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Product updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsEditOpen(false);
      setSelectedProduct(null);
      resetForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', selectedProduct.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Product deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      product_type: product.product_type || '',
      image_url: product.image_url || '',
      stock: product.stock.toString(),
      badge: product.badge || '',
      discount: product.discount?.toString() || '',
    });
    setIsEditOpen(true);
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleExportCSV = () => {
    if (!filteredProducts.length) return;
    
    const headers = ['Name', 'Description', 'Price', 'Category', 'Product Type', 'Stock', 'Badge', 'Discount', 'Created'];
    const rows = filteredProducts.map(product => [
      product.name,
      product.description || '',
      product.price,
      product.category,
      product.product_type || '',
      product.stock,
      product.badge || '',
      product.discount || '',
      product.created_at ? new Date(product.created_at).toISOString().split('T')[0] : ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCSV(csvContent, `products-${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: 'Success', description: 'Products exported to CSV' });
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Products" subtitle="Manage your product catalog">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11 rounded-xl text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            disabled={!filteredProducts.length}
            className="h-10 sm:h-11 rounded-xl text-sm"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="h-10 sm:h-11 rounded-xl text-sm">
            <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Import CSV</span>
          </Button>
          <Button onClick={() => { resetForm(); setIsAddOpen(true); }} className="h-10 sm:h-11 rounded-xl text-sm flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Products - Mobile Cards / Desktop Table */}
      <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-3 flex gap-3">
                  <div className="h-16 w-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.product_type}</p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{product.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary">৳{product.price}</span>
                      <Badge className={product.stock > 0 ? 'bg-green-100 text-green-800 text-xs' : 'bg-red-100 text-red-800 text-xs'}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-9 rounded-xl text-xs"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 rounded-xl text-xs text-destructive"
                        onClick={() => { setSelectedProduct(product); setIsDeleteOpen(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-secondary overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.product_type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>৳{product.price}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge className={product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(product)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => { setSelectedProduct(product); setIsDeleteOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add New Product</DialogTitle>
            <DialogDescription className="text-sm">Fill in the details to add a new product.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            {/* Image Upload */}
            <div>
              <Label>Product Image</Label>
              <ImageUpload 
                value={formData.image_url} 
                onChange={(url) => setFormData({ ...formData, image_url: url })} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Price *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v: 'Pet' | 'Farm') => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pet">Pet</SelectItem>
                    <SelectItem value="Farm">Farm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product Type</Label>
                <Input value={formData.product_type} onChange={(e) => setFormData({ ...formData, product_type: e.target.value })} placeholder="e.g., Food, Toys" />
              </div>
              <div>
                <Label>Badge</Label>
                <Input value={formData.badge} onChange={(e) => setFormData({ ...formData, badge: e.target.value })} placeholder="e.g., New, Sale" />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl h-11 sm:h-10">Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="rounded-xl h-11 sm:h-10">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Product</DialogTitle>
            <DialogDescription className="text-sm">Update the product details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            {/* Image Upload */}
            <div>
              <Label>Product Image</Label>
              <ImageUpload 
                value={formData.image_url} 
                onChange={(url) => setFormData({ ...formData, image_url: url })} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Price *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v: 'Pet' | 'Farm') => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pet">Pet</SelectItem>
                    <SelectItem value="Farm">Farm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product Type</Label>
                <Input value={formData.product_type} onChange={(e) => setFormData({ ...formData, product_type: e.target.value })} />
              </div>
              <div>
                <Label>Badge</Label>
                <Input value={formData.badge} onChange={(e) => setFormData({ ...formData, badge: e.target.value })} />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CSVImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
    </AdminLayout>
  );
};

export default AdminProducts;
