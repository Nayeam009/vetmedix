import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Stethoscope, Mail, Phone, Edit, Trash2, GraduationCap, BadgeDollarSign, ChevronRight, ChevronLeft, User, Briefcase, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/useUserRole';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.jpeg';

interface DoctorFormData {
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

const initialFormData: DoctorFormData = {
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

const ClinicDoctors = () => {
  const navigate = useNavigate();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const { 
    ownedClinic,
    clinicLoading, 
    clinicDoctors, 
    doctorsLoading,
    updateDoctorStatus,
    addDoctor,
    updateDoctor,
    removeDoctor,
  } = useClinicOwner();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>(initialFormData);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (!isAddOpen) {
      setCurrentStep(0);
      setSelectedQualifications([]);
    }
  }, [isAddOpen]);

  useEffect(() => {
    if (!isEditOpen) {
      setCurrentStep(0);
      setSelectedQualifications([]);
    }
  }, [isEditOpen]);

  // Sync qualifications with form data
  useEffect(() => {
    if (formData.qualifications) {
      const quals = formData.qualifications.split(',').map(q => q.trim()).filter(Boolean);
      setSelectedQualifications(quals);
    }
  }, [formData.qualifications]);

  const handleInputChange = (field: keyof DoctorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleQualification = (qual: string) => {
    setSelectedQualifications(prev => {
      const newQuals = prev.includes(qual) 
        ? prev.filter(q => q !== qual)
        : [...prev, qual];
      setFormData(p => ({ ...p, qualifications: newQuals.join(', ') }));
      return newQuals;
    });
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Format as Bangladesh phone number
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const qualificationsArray = formData.qualifications
      .split(',')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    await addDoctor.mutateAsync({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      specialization: formData.specialization || null,
      license_number: formData.license_number || null,
      qualifications: qualificationsArray.length > 0 ? qualificationsArray : null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
      bio: formData.bio || null,
    });

    setIsAddOpen(false);
    setFormData(initialFormData);
    setCurrentStep(0);
  };

  const handleEditDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctorId) return;

    const qualificationsArray = formData.qualifications
      .split(',')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    await updateDoctor.mutateAsync({
      doctorId: editingDoctorId,
      updates: {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        specialization: formData.specialization || null,
        license_number: formData.license_number || null,
        qualifications: qualificationsArray.length > 0 ? qualificationsArray : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
        bio: formData.bio || null,
      },
    });

    setIsEditOpen(false);
    setFormData(initialFormData);
    setEditingDoctorId(null);
    setCurrentStep(0);
  };

  const openEditDialog = (doctor: any) => {
    setEditingDoctorId(doctor.id);
    setFormData({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || '',
      license_number: doctor.license_number || '',
      qualifications: doctor.qualifications?.join(', ') || '',
      experience_years: doctor.experience_years?.toString() || '',
      consultation_fee: doctor.consultation_fee?.toString() || '',
      bio: doctor.bio || '',
    });
    setIsEditOpen(true);
  };

  const handleDeleteDoctor = async () => {
    if (!deleteConfirm) return;
    await removeDoctor.mutateAsync(deleteConfirm);
    setDeleteConfirm(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateDoctorStatus.mutateAsync({ id, status });
  };

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isClinicOwner) {
    navigate('/');
    return null;
  }

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

  const DoctorFormWizard = ({ onSubmit, submitLabel, isPending }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string; isPending: boolean }) => (
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
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">Doctor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="Enter full name (e.g., Dr. Rahman Ahmed)"
                className="h-12 text-base"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">This will be displayed on appointments and public profiles</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization" className="text-base font-medium">Specialization</Label>
              <Select value={formData.specialization} onValueChange={(v) => handleInputChange('specialization', v)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select area of expertise" />
                </SelectTrigger>
                <SelectContent>
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
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license" className="text-base font-medium">License Number</Label>
                <Input
                  id="license"
                  value={formData.license_number}
                  onChange={(e) => handleInputChange('license_number', e.target.value.toUpperCase())}
                  placeholder="VET-XXXX-XXXX"
                  className="h-12 uppercase"
                  autoFocus
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
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                onChange={(e) => handleInputChange('qualifications', e.target.value)}
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
                autoFocus
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clinic/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="VET-MEDIX" className="h-10 w-10 rounded-lg object-cover" />
              <span className="font-bold text-lg hidden sm:block">VET-MEDIX</span>
            </Link>
          </div>
          <Badge variant="secondary">
            <Stethoscope className="h-3 w-3 mr-1" />
            Doctors
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Doctors</h1>
            <p className="text-muted-foreground">Add and manage doctors at your clinic</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
                <DialogDescription>
                  Create a doctor profile for your clinic. The doctor will be associated with {ownedClinic?.name}.
                </DialogDescription>
              </DialogHeader>
              <DoctorFormWizard 
                onSubmit={handleAddDoctor} 
                submitLabel="Add Doctor" 
                isPending={addDoctor.isPending} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setFormData(initialFormData);
            setEditingDoctorId(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Doctor</DialogTitle>
              <DialogDescription>
                Update doctor information
              </DialogDescription>
            </DialogHeader>
            <DoctorFormWizard 
              onSubmit={handleEditDoctor} 
              submitLabel="Save Changes" 
              isPending={updateDoctor.isPending} 
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Doctor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the doctor from your clinic. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDoctor} className="bg-destructive text-destructive-foreground">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {doctorsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clinicDoctors && clinicDoctors.length > 0 ? (
          <div className="grid gap-4">
            {clinicDoctors.map((cd) => (
              <Card key={cd.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={cd.doctor?.avatar_url || ''} />
                          <AvatarFallback>
                            <Stethoscope className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{cd.doctor?.name}</h3>
                          <p className="text-muted-foreground">
                            {cd.doctor?.specialization || 'General Veterinarian'}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            {cd.doctor?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {cd.doctor.email}
                              </span>
                            )}
                            {cd.doctor?.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {cd.doctor.phone}
                              </span>
                            )}
                          </div>
                          {(cd.doctor as any)?.qualifications?.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {(cd.doctor as any).qualifications.join(', ')}
                              </span>
                            </div>
                          )}
                          {(cd.doctor as any)?.consultation_fee && (
                            <div className="flex items-center gap-1 mt-1">
                              <BadgeDollarSign className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                ৳{(cd.doctor as any).consultation_fee} consultation fee
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-20 sm:ml-0">
                        <Badge 
                          variant={cd.doctor?.is_available ? 'default' : 'secondary'}
                        >
                          {cd.doctor?.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Select
                          value={cd.status}
                          onValueChange={(value) => handleStatusChange(cd.id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t pt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(cd.doctor)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(cd.doctor?.id || '')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No doctors yet</h3>
              <p className="text-muted-foreground mb-4">
                Add veterinary doctors to your clinic to start accepting appointments
              </p>
              <Button onClick={() => setIsAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Doctor
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ClinicDoctors;