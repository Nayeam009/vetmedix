import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Stethoscope, Mail, Phone, Edit, Trash2, GraduationCap, BadgeDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import DoctorFormWizard, { DoctorFormData, initialDoctorFormData } from '@/components/clinic/DoctorFormWizard';
import logo from '@/assets/logo.jpeg';

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
  const [formData, setFormData] = useState<DoctorFormData>(initialDoctorFormData);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

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
    setFormData(initialDoctorFormData);
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
    setFormData(initialDoctorFormData);
    setEditingDoctorId(null);
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
                formData={formData}
                onFormDataChange={setFormData}
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
            setFormData(initialDoctorFormData);
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
              formData={formData}
              onFormDataChange={setFormData}
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