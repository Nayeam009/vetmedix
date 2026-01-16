import { useState, useEffect } from 'react';
import { Loader2, ChevronRight, ChevronLeft, User, Briefcase, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

export interface DoctorFormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  license_number: string;
  qualifications: string;
  experience_years: string;
  consultation_fee: string;
  bio: string;
}

export const initialDoctorFormData: DoctorFormData = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  license_number: '',
  qualifications: '',
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
];

const COMMON_QUALIFICATIONS = ['DVM', 'BVSc', 'MVSc', 'PhD', 'DACVS', 'DACVIM'];

interface DoctorFormWizardProps {
  formData: DoctorFormData;
  onFormDataChange: (data: DoctorFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  isPending: boolean;
}

const DoctorFormWizard = ({ 
  formData, 
  onFormDataChange, 
  onSubmit, 
  submitLabel, 
  isPending 
}: DoctorFormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);

  // Sync qualifications with form data on mount and when formData changes
  useEffect(() => {
    if (formData.qualifications) {
      const quals = formData.qualifications.split(',').map(q => q.trim()).filter(Boolean);
      setSelectedQualifications(quals);
    } else {
      setSelectedQualifications([]);
    }
  }, []);

  const handleInputChange = (field: keyof DoctorFormData, value: string) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const toggleQualification = (qual: string) => {
    const newQuals = selectedQualifications.includes(qual)
      ? selectedQualifications.filter(q => q !== qual)
      : [...selectedQualifications, qual];
    
    setSelectedQualifications(newQuals);
    onFormDataChange({ ...formData, qualifications: newQuals.join(', ') });
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  const steps = [
    { title: 'Basic Info', icon: User, description: 'Name & contact' },
    { title: 'Professional', icon: Briefcase, description: 'Credentials & fee' },
    { title: 'Details', icon: FileText, description: 'Bio & qualifications' },
  ];

  const canProceedToStep = (step: number) => {
    if (step === 0) return true;
    if (step === 1) return formData.name.trim().length > 0;
    if (step === 2) return formData.name.trim().length > 0;
    return true;
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => canProceedToStep(index) && setCurrentStep(index)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                currentStep === index ? "opacity-100" : "opacity-60 hover:opacity-80",
                !canProceedToStep(index) && "cursor-not-allowed opacity-40"
              )}
              disabled={!canProceedToStep(index)}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                currentStep === index 
                  ? "bg-primary text-primary-foreground" 
                  : currentStep > index 
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}>
                {currentStep > index ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium hidden sm:block">{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                currentStep > index ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {currentStep === 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">Doctor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="Enter full name (e.g., Dr. Rahman Ahmed)"
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">This will be displayed on appointments and public profiles</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization" className="text-base font-medium">Specialization</Label>
              <Select value={formData.specialization} onValueChange={(v) => handleInputChange('specialization', v)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select area of expertise" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  {SPECIALIZATIONS.map(spec => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-medium">Phone</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+880</span>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="1XXX-XXXXXXX"
                    className="h-12 pl-14"
                    maxLength={12}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license" className="text-base font-medium">License Number</Label>
                <Input
                  id="license"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value.toUpperCase())}
                  placeholder="VET-XXXX-XXXX"
                  className="h-12 uppercase"
                />
                <p className="text-xs text-muted-foreground">Veterinary council registration number</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience" className="text-base font-medium">Experience</Label>
                <div className="relative">
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience_years}
                    onChange={(e) => handleInputChange('experience_years', e.target.value)}
                    placeholder="5"
                    className="h-12 pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">years</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee" className="text-base font-medium">Consultation Fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  step="50"
                  value={formData.consultation_fee}
                  onChange={(e) => handleInputChange('consultation_fee', e.target.value)}
                  placeholder="500"
                  className="h-12 pl-8 text-lg"
                />
              </div>
              <p className="text-xs text-muted-foreground">Standard fee for appointments</p>
            </div>

            {/* Quick fee buttons */}
            <div className="flex flex-wrap gap-2">
              {[300, 500, 700, 1000, 1500].map(fee => (
                <Button
                  key={fee}
                  type="button"
                  variant={formData.consultation_fee === String(fee) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('consultation_fee', String(fee))}
                >
                  ৳{fee}
                </Button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-2">
              <Label className="text-base font-medium">Qualifications</Label>
              <div className="flex flex-wrap gap-2">
                {COMMON_QUALIFICATIONS.map(qual => (
                  <Button
                    key={qual}
                    type="button"
                    variant={selectedQualifications.includes(qual) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleQualification(qual)}
                  >
                    {selectedQualifications.includes(qual) && <Check className="h-3 w-3 mr-1" />}
                    {qual}
                  </Button>
                ))}
              </div>
              <Input
                value={formData.qualifications}
                onChange={(e) => {
                  handleInputChange('qualifications', e.target.value);
                  // Update selectedQualifications based on manual input
                  const quals = e.target.value.split(',').map(q => q.trim()).filter(Boolean);
                  setSelectedQualifications(quals);
                }}
                placeholder="Add more (comma-separated)"
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Brief description about the doctor's experience, approach to care, and specialties..."
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceedToStep(currentStep + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="submit" disabled={isPending || !formData.name.trim()}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
};

export default DoctorFormWizard;
