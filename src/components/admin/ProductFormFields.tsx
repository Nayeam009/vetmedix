import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/ImageUpload';

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: 'Pet' | 'Farm';
  product_type: string;
  image_url: string;
  stock: string;
  badge: string;
  discount: string;
}

interface ProductFormFieldsProps {
  formData: ProductFormData;
  onChange: (data: ProductFormData) => void;
}

export function ProductFormFields({ formData, onChange }: ProductFormFieldsProps) {
  const update = (field: keyof ProductFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4 py-2 sm:py-4">
      <div>
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product Image</Label>
        <ImageUpload
          value={formData.image_url}
          onChange={(url) => update('image_url', url)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="col-span-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Product name"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Brief product description"
            className="mt-1.5 rounded-xl min-h-[80px]"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Price (৳) *</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder="0"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock</Label>
          <Input
            type="number"
            value={formData.stock}
            onChange={(e) => update('stock', e.target.value)}
            placeholder="0"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</Label>
          <Select value={formData.category} onValueChange={(v: 'Pet' | 'Farm') => update('category', v)}>
            <SelectTrigger className="mt-1.5 h-11 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pet">Pet</SelectItem>
              <SelectItem value="Farm">Farm</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product Type</Label>
          <Input
            value={formData.product_type}
            onChange={(e) => update('product_type', e.target.value)}
            placeholder="e.g., Food, Toys"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Badge</Label>
          <Input
            value={formData.badge}
            onChange={(e) => update('badge', e.target.value)}
            placeholder="e.g., New, Sale"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Discount %</Label>
          <Input
            type="number"
            value={formData.discount}
            onChange={(e) => update('discount', e.target.value)}
            placeholder="0"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
