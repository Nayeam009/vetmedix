import { useState } from 'react';
import { Loader2, Package, DollarSign, Clock, FileText, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DialogFooter } from '@/components/ui/dialog';

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  is_active: boolean;
  category: string;
}

const initialFormData: ServiceFormData = {
  name: '',
  description: '',
  price: '',
  duration_minutes: '',
  is_active: true,
  category: '',
};

const SERVICE_CATEGORIES = [
  'General Checkup',
  'Vaccination',
  'Surgery',
  'Dental Care',
  'Grooming',
  'Emergency Care',
  'X-Ray & Imaging',
  'Laboratory Tests',
  'Pet Boarding',
  'Deworming',
  'Microchipping',
  'Spay/Neuter',
  'Consultation',
  'Follow-up',
];

const DURATION_PRESETS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
];

interface AddServiceWizardProps {
  onSubmit: (data: {
    name: string;
    description: string | null;
    price: number | null;
    duration_minutes: number | null;
    is_active: boolean;
  }) => Promise<void>;
  isPending: boolean;
  onCancel?: () => void;
  initialData?: ServiceFormData;
  isEditing?: boolean;
}

const AddServiceWizard = ({ onSubmit, isPending, onCancel, initialData, isEditing = false }: AddServiceWizardProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<ServiceFormData>(initialData || initialFormData);

  const steps = [
    { 
      title: 'Service Info', 
      description: 'Name and category',
      icon: Package,
      fields: ['name', 'category']
    },
    { 
      title: 'Details', 
      description: 'Description and settings',
      icon: FileText,
      fields: ['description', 'is_active']
    },
    { 
      title: 'Pricing', 
      description: 'Cost and duration',
      icon: DollarSign,
      fields: ['price', 'duration_minutes']
    },
  ];

  const handleInputChange = (field: keyof ServiceFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.name.trim().length >= 2;
      case 1:
        return true; // Optional fields
      case 2:
        return true; // Optional fields
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    await onSubmit({
      name: formData.name,
      description: formData.description || null,
      price: formData.price ? parseFloat(formData.price) : null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      is_active: formData.is_active,
    });
  };

  const goNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = index === step;
          const isCompleted = index < step;
          
          return (
            <div key={index} className="flex items-center flex-1">
              <button
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={cn(
                  "flex flex-col items-center gap-1.5 relative group transition-all",
                  index <= step ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2",
                  index < step ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., General Health Checkup"
                className="h-12 text-base"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Choose a clear, descriptive name for your service
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-base">Category</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select a category that best describes this service
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {SERVICE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleInputChange('category', formData.category === category ? '' : category)}
                    className={cn(
                      "px-3 py-2.5 rounded-lg border text-sm text-left transition-all active:scale-95",
                      formData.category === category
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe what this service includes, what pet owners can expect..."
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Help pet owners understand what's included in this service
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  formData.is_active ? "bg-emerald-500/10" : "bg-muted"
                )}>
                  <Sparkles className={cn(
                    "h-5 w-5",
                    formData.is_active ? "text-emerald-600" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <Label htmlFor="active" className="text-base font-medium cursor-pointer">
                    {formData.is_active ? 'Service Active' : 'Service Inactive'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active 
                      ? 'This service is visible to customers' 
                      : 'This service is hidden from customers'}
                  </p>
                </div>
              </div>
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-base">Service Price (৳)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="Enter price in BDT"
                className="h-12 text-lg font-semibold"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty if price varies or is negotiable
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-base">Estimated Duration</Label>
              <p className="text-sm text-muted-foreground mb-3">
                How long does this service typically take?
              </p>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <Badge
                    key={preset.value}
                    variant={formData.duration_minutes === preset.value ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-4 py-2 text-sm transition-all active:scale-95",
                      formData.duration_minutes === preset.value
                        ? "bg-primary hover:bg-primary/90"
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleInputChange('duration_minutes', 
                      formData.duration_minutes === preset.value ? '' : preset.value
                    )}
                  >
                    <Clock className="h-3 w-3 mr-1.5" />
                    {preset.label}
                  </Badge>
                ))}
              </div>
              <div className="pt-2">
                <Label htmlFor="custom-duration" className="text-sm text-muted-foreground">
                  Or enter custom duration (minutes)
                </Label>
                <Input
                  id="custom-duration"
                  type="number"
                  min="0"
                  max="480"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                  placeholder="Custom minutes"
                  className="h-10 mt-1 max-w-[150px]"
                />
              </div>
            </div>

            {/* Summary Preview */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 mt-4">
              <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
              <div className="space-y-1">
                <p className="font-semibold text-lg">{formData.name || 'Service Name'}</p>
                {formData.category && (
                  <Badge variant="secondary" className="text-xs">
                    {formData.category}
                  </Badge>
                )}
                <div className="flex items-center gap-4 mt-2">
                  {formData.price && (
                    <p className="text-primary font-bold">৳{parseFloat(formData.price).toLocaleString()}</p>
                  )}
                  {formData.duration_minutes && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formData.duration_minutes} mins
                    </p>
                  )}
                </div>
                <Badge variant={formData.is_active ? "default" : "secondary"} className={cn(
                  "mt-2",
                  formData.is_active && "bg-emerald-500 hover:bg-emerald-500"
                )}>
                  {formData.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
        <div className="flex gap-2 w-full sm:w-auto">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {onCancel && step === 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
          )}
        </div>
        
        {step < steps.length - 1 ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-1 sm:flex-none"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canProceed()}
            className="flex-1 sm:flex-none min-w-[140px]"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Service' : 'Add Service'}
              </>
            )}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
};

export default AddServiceWizard;
