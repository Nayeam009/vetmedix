import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Loader2, Package, ChevronLeft,
  Clock, DollarSign, CheckCircle, XCircle, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner, ClinicService } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import AddServiceWizard from '@/components/clinic/AddServiceWizard';

const ClinicServices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const { 
    ownedClinic,
    clinicLoading, 
    clinicServices, 
    servicesLoading,
    addService,
    updateService,
    deleteService 
  } = useClinicOwner();

  // Set document title
  useDocumentTitle('Manage Services');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);

  const openAddDialog = () => {
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: ClinicService) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: {
    name: string;
    description: string | null;
    price: number | null;
    duration_minutes: number | null;
    is_active: boolean;
  }) => {
    if (editingService) {
      await updateService.mutateAsync({ id: editingService.id, updates: data });
    } else {
      await addService.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingService(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteService.mutateAsync(deleteConfirm);
    setDeleteConfirm(null);
  };

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/30 via-background to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (!user || !isClinicOwner) {
    navigate(user ? '/' : '/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-background to-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-xl"
              onClick={() => navigate('/clinic/dashboard')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Manage Services</h1>
              <p className="text-sm text-muted-foreground">Add and manage services offered at your clinic</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingService(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="rounded-xl shadow-lg shadow-primary/25">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </DialogTitle>
                <DialogDescription>
                  {editingService 
                    ? 'Update the service details below' 
                    : `Add a new service to ${ownedClinic?.name || 'your clinic'}`}
                </DialogDescription>
              </DialogHeader>
              <AddServiceWizard 
                onSubmit={handleSubmit}
                isPending={addService.isPending || updateService.isPending}
                onCancel={() => setIsDialogOpen(false)}
                isEditing={!!editingService}
                initialData={editingService ? {
                  name: editingService.name,
                  description: editingService.description || '',
                  price: editingService.price?.toString() || '',
                  duration_minutes: editingService.duration_minutes?.toString() || '',
                  is_active: editingService.is_active,
                  category: '',
                } : undefined}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this service. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive text-destructive-foreground rounded-xl"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {servicesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          </div>
        ) : clinicServices && clinicServices.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {clinicServices.map((service) => (
              <Card key={service.id} className="bg-white border-border/50 shadow-sm hover:shadow-lg transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-orange-100 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-foreground truncate">{service.name}</h3>
                          <Badge 
                            variant={service.is_active ? 'default' : 'secondary'}
                            className={service.is_active ? 'bg-emerald-500 hover:bg-emerald-500' : ''}
                          >
                            {service.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {service.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          {service.price && (
                            <span className="flex items-center gap-1.5 font-semibold text-primary">
                              <DollarSign className="h-4 w-4" />
                              ৳{service.price}
                            </span>
                          )}
                          {service.duration_minutes && (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {service.duration_minutes} mins
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 rounded-lg h-10 sm:h-9 text-sm active:scale-[0.98]"
                      onClick={() => openEditDialog(service)}
                    >
                      <Edit className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-lg h-10 sm:h-9 text-sm text-destructive hover:bg-destructive/10 hover:border-destructive/50 active:bg-destructive/20 active:scale-[0.98]"
                      onClick={() => setDeleteConfirm(service.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border-border/50 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No services yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add services to let patients know what you offer
              </p>
              <Button onClick={openAddDialog} className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
};

export default ClinicServices;
