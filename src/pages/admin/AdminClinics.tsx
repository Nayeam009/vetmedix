import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Star,
  Users,
  Calendar,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  image_url: string | null;
  is_open: boolean;
  is_verified: boolean;
  rating: number;
  created_at: string;
  owner_user_id: string | null;
  services: string[] | null;
  opening_hours: string | null;
}

const AdminClinics = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roleLoading } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch all clinics
  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: ['admin-clinics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Clinic[];
    },
    enabled: isAdmin,
  });

  // Fetch clinic stats
  const { data: clinicStats } = useQuery({
    queryKey: ['admin-clinic-stats'],
    queryFn: async () => {
      const [
        { count: totalClinics },
        { count: verifiedClinics },
        { count: totalDoctors },
        { count: totalAppointments },
      ] = await Promise.all([
        supabase.from('clinics').select('*', { count: 'exact', head: true }),
        supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('clinic_doctors').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
      ]);

      return {
        totalClinics: totalClinics || 0,
        verifiedClinics: verifiedClinics || 0,
        totalDoctors: totalDoctors || 0,
        totalAppointments: totalAppointments || 0,
      };
    },
    enabled: isAdmin,
  });

  // Toggle verification mutation
  const toggleVerification = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from('clinics')
        .update({ is_verified: !isVerified })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success('Clinic verification status updated');
    },
    onError: () => {
      toast.error('Failed to update verification status');
    },
  });

  // Toggle open/closed mutation
  const toggleOpenStatus = useMutation({
    mutationFn: async ({ id, isOpen }: { id: string; isOpen: boolean }) => {
      const { error } = await supabase
        .from('clinics')
        .update({ is_open: !isOpen })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success('Clinic status updated');
    },
    onError: () => {
      toast.error('Failed to update clinic status');
    },
  });

  // Redirect if not admin
  if (!authLoading && !roleLoading && !isAdmin) {
    navigate('/');
    return null;
  }

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter clinics
  const filteredClinics = clinics?.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'verified') return matchesSearch && clinic.is_verified;
    if (filterStatus === 'unverified') return matchesSearch && !clinic.is_verified;
    if (filterStatus === 'open') return matchesSearch && clinic.is_open;
    if (filterStatus === 'closed') return matchesSearch && !clinic.is_open;
    return matchesSearch;
  });

  return (
    <AdminLayout title="Clinics Management" subtitle="Manage and verify veterinary clinics">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clinicStats?.totalClinics || 0}</p>
                <p className="text-sm text-muted-foreground">Total Clinics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clinicStats?.verifiedClinics || 0}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clinicStats?.totalDoctors || 0}</p>
                <p className="text-sm text-muted-foreground">Doctors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clinicStats?.totalAppointments || 0}</p>
                <p className="text-sm text-muted-foreground">Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clinics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clinics List */}
      {clinicsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredClinics && filteredClinics.length > 0 ? (
        <div className="grid gap-4">
          {filteredClinics.map((clinic) => (
            <Card key={clinic.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14 rounded-lg">
                      <AvatarImage src={clinic.image_url || ''} />
                      <AvatarFallback className="rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{clinic.name}</h3>
                        {clinic.is_verified && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant={clinic.is_open ? 'outline' : 'secondary'}>
                          {clinic.is_open ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        {clinic.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {clinic.address}
                          </span>
                        )}
                        {clinic.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {clinic.phone}
                          </span>
                        )}
                        {clinic.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {clinic.email}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{clinic.rating || 0}</span>
                        <span className="text-sm text-muted-foreground">
                          · Joined {format(new Date(clinic.created_at), 'PP')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-18 md:ml-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClinic(clinic);
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant={clinic.is_verified ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => toggleVerification.mutate({ id: clinic.id, isVerified: clinic.is_verified })}
                      disabled={toggleVerification.isPending}
                    >
                      {clinic.is_verified ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Unverify
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleOpenStatus.mutate({ id: clinic.id, isOpen: clinic.is_open })}
                      disabled={toggleOpenStatus.isPending}
                    >
                      {clinic.is_open ? 'Close' : 'Open'}
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
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No clinics found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'No clinics have registered yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Clinic Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedClinic?.name}
              {selectedClinic?.is_verified && (
                <Badge variant="default" className="bg-green-500">Verified</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Clinic details and management
            </DialogDescription>
          </DialogHeader>
          {selectedClinic && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedClinic.address || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedClinic.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedClinic.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="font-medium flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    {selectedClinic.rating || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedClinic.is_open ? 'default' : 'secondary'}>
                    {selectedClinic.is_open ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opening Hours</p>
                  <p className="font-medium">{selectedClinic.opening_hours || 'Not set'}</p>
                </div>
              </div>
              {selectedClinic.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedClinic.description}</p>
                </div>
              )}
              {selectedClinic.services && selectedClinic.services.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Services</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClinic.services.map((service, i) => (
                      <Badge key={i} variant="outline">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant={selectedClinic.is_verified ? 'destructive' : 'default'}
                  onClick={() => {
                    toggleVerification.mutate({ id: selectedClinic.id, isVerified: selectedClinic.is_verified });
                    setDetailsOpen(false);
                  }}
                >
                  {selectedClinic.is_verified ? 'Remove Verification' : 'Verify Clinic'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminClinics;
