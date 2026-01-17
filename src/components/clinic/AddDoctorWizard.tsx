import { useState } from 'react';
import { Loader2, User, Stethoscope, GraduationCap, FileText, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogFooter,
} from '@/components/ui/dialog';

interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  license_number: string;
  qualifications: string[];
  experience_years: string;
  consultation_fee: string;
  bio: string;
}

const initialFormData: DoctorFormData = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  license_number: '',
  qualifications: [],
  experience_years: '',
  consultation_fee: '',
  bio: '',
};

const SPECIALIZATIONS = [
  'General Veterinarian',
  'Surgery',
  'Dermatology',
  'Cardiology',
  'Orthopedics',
  'Dentistry',
  'Oncology',
  'Neurology',
  'Emergency Care',
  'Exotic Animals',
  'Farm Animals',
  'Internal Medicine',
  'Ophthalmology',
  'Radiology',
];

const COMMON_QUALIFICATIONS = [
  'DVM',
  'BVSc',
  'MVSc',
  'PhD',
  'MS',
  'DACVS',
  'DACVIM',
  'DECVS',
];

interface AddDoctorWizardProps {
  onSubmit: (data: {
    name: string;
    email: string | null;
    phone: string | null;
    specialization: string | null;
    license_number: string | null;
    qualifications: string[] | null;
    experience_years: number | null;
    consultation_fee: number | null;
    bio: string | null;
  }) => Promise<void>;
  isPending: boolean;
  clinicName?: string;
  onCancel?: () => void;
}

const AddDoctorWizard = ({ onSubmit, isPending, clinicName, onCancel }: AddDoctorWizardProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<DoctorFormData>(initialFormData);

  const steps = [
    { 
      title: 'Basic Info', 
      description: 'Doctor name and contact',
      icon: User,
      fields: ['name', 'email', 'phone']
    },
    { 
      title: 'Specialization', 
      description: 'Area of expertise',
      icon: Stethoscope,
      fields: ['specialization', 'experience_years', 'consultation_fee']
    },
    { 
      title: 'Credentials', 
      description: 'License and qualifications',
      icon: GraduationCap,
      fields: ['license_number', 'qualifications']
    },
    { 
      title: 'Bio', 
      description: 'Professional summary',
      icon: FileText,
      fields: ['bio']
    },
  ];

  const handleInputChange = (field: keyof DoctorFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleQualification = (qual: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.includes(qual)
        ? prev.qualifications.filter(q => q !== qual)
        : [...prev.qualifications, qual]
    }));
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('880')) {
      return '+' + digits;
    } else if (digits.startsWith('0')) {
      return '+88' + digits;
    } else if (digits.length > 0 && !digits.startsWith('880')) {
      return '+880' + digits;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleInputChange('phone', formatted);
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.name.trim().length >= 2;
      case 1:
        return true; // Optional fields
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Optional fields
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    await onSubmit({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      specialization: formData.specialization || null,
      license_number: formData.license_number || null,
      qualifications: formData.qualifications.length > 0 ? formData.qualifications : null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
      bio: formData.bio || null,
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
                Doctor Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Dr. John Doe"
                className="h-12 text-base"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Full name as it will appear on the profile
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="doctor@example.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+880 1XXX-XXXXXX"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label className="text-base">Specialization</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPECIALIZATIONS.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleInputChange('specialization', formData.specialization === spec ? '' : spec)}
                    className={cn(
                      "px-3 py-2.5 rounded-lg border text-sm text-left transition-all",
                      formData.specialization === spec
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-base">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => handleInputChange('experience_years', e.target.value)}
                  placeholder="5"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee" className="text-base">Consultation Fee (৳)</Label>
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  value={formData.consultation_fee}
                  onChange={(e) => handleInputChange('consultation_fee', e.target.value)}
                  placeholder="500"
                  className="h-11"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="license" className="text-base">License Number</Label>
              <Input
                id="license"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                placeholder="VET-XXXX-XXXX"
                className="h-11"
              />
              <p className="text-sm text-muted-foreground">
                Bangladesh Veterinary Council registration number
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-base">Qualifications</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select all that apply or add custom ones
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_QUALIFICATIONS.map((qual) => (
                  <Badge
                    key={qual}
                    variant={formData.qualifications.includes(qual) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-sm transition-all",
                      formData.qualifications.includes(qual)
                        ? "bg-primary hover:bg-primary/90"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleQualification(qual)}
                  >
                    {formData.qualifications.includes(qual) && (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    {qual}
                  </Badge>
                ))}
              </div>
              {formData.qualifications.length > 0 && (
                <p className="text-sm text-primary mt-2">
                  Selected: {formData.qualifications.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base">Professional Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="A brief description about the doctor's experience, expertise, and approach to veterinary care..."
                rows={5}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                This will be displayed on the doctor's profile (optional)
              </p>
            </div>

            {/* Summary Preview */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Summary</h4>
              <div className="space-y-1">
                <p className="font-semibold">{formData.name || 'Doctor Name'}</p>
                <p className="text-sm text-muted-foreground">
                  {formData.specialization || 'General Veterinarian'}
                  {formData.experience_years && ` • ${formData.experience_years} years exp.`}
                </p>
                {formData.consultation_fee && (
                  <p className="text-sm text-primary font-medium">৳{formData.consultation_fee} per consultation</p>
                )}
                {formData.qualifications.length > 0 && (
                  <p className="text-sm text-muted-foreground">{formData.qualifications.join(', ')}</p>
                )}
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
                Adding...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Add Doctor
              </>
            )}
          </Button>
        )}
      </DialogFooter>
    </div>
  );
};

export default AddDoctorWizard;
