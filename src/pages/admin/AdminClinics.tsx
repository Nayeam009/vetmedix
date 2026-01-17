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
  Clock,
  FileText,
  Ban,
  Trash2,
  Shield,
  MoreVertical,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ClinicVerificationDialog } from '@/components/admin/ClinicVerificationDialog';
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
  is_blocked: boolean | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  verification_status: string | null;
  bvc_certificate_url: string | null;
  trade_license_url: string | null;
  rejection_reason: string | null;
  verification_submitted_at: string | null;
  owner_name: string | null;
  owner_nid: string | null;
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
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionClinic, setActionClinic] = useState<Clinic | null>(null);
  const [blockReason, setBlockReason] = useState('');

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

  // Block/Unblock mutation
  const blockMutation = useMutation({
    mutationFn: async ({ clinic, reason }: { clinic: Clinic; reason?: string }) => {
      const isCurrentlyBlocked = clinic.is_blocked;

      const { error } = await supabase
        .from('clinics')
        .update({
          is_blocked: !isCurrentlyBlocked,
          blocked_at: isCurrentlyBlocked ? null : new Date().toISOString(),
          blocked_reason: isCurrentlyBlocked ? null : reason || 'Blocked by admin',
        })
        .eq('id', clinic.id);

      if (error) throw error;
      return !isCurrentlyBlocked;
    },
    onSuccess: (wasBlocked) => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success(wasBlocked ? 'Clinic blocked successfully' : 'Clinic unblocked successfully');
      setBlockDialogOpen(false);
      setBlockReason('');
      setActionClinic(null);
    },
    onError: () => {
      toast.error('Failed to update clinic block status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', clinicId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      toast.success('Clinic deleted permanently');
      setDeleteDialogOpen(false);
      setActionClinic(null);
    },
    onError: () => {
      toast.error('Failed to delete clinic');
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
    if (filterStatus === 'pending') return matchesSearch && clinic.verification_status === 'pending';
    if (filterStatus === 'blocked') return matchesSearch && clinic.is_blocked;
    if (filterStatus === 'open') return matchesSearch && clinic.is_open;
    if (filterStatus === 'closed') return matchesSearch && !clinic.is_open;
    return matchesSearch;
  });

  const pendingCount = clinics?.filter(c => c.verification_status === 'pending').length || 0;
  const blockedCount = clinics?.filter(c => c.is_blocked).length || 0;

  return (
    <AdminLayout title="Clinics Management" subtitle="Manage and verify veterinary clinics">
      {/* Stats - Clickable Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group",
            filterStatus === 'all' && "ring-2 ring-primary shadow-md"
          )}
          onClick={() => setFilterStatus('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clinicStats?.totalClinics || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Clinics</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group",
            filterStatus === 'verified' && "ring-2 ring-green-500 shadow-md"
          )}
          onClick={() => setFilterStatus('verified')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clinicStats?.verifiedClinics || 0}</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
          )}
          onClick={() => navigate('/admin/customers')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clinicStats?.totalDoctors || 0}</p>
                  <p className="text-sm text-muted-foreground">Doctors</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
          )}
          onClick={() => navigate('/admin/dashboard')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clinicStats?.totalAppointments || 0}</p>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <SelectItem value="pending">
              Pending Verification {pendingCount > 0 && `(${pendingCount})`}
            </SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
            <SelectItem value="blocked">
              Blocked {blockedCount > 0 && `(${blockedCount})`}
            </SelectItem>
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
                        {clinic.verification_status === 'pending' && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Review
                          </Badge>
                        )}
                        {clinic.is_blocked && (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Blocked
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
                    
                    {/* Block/Unblock Button */}
                    <Button
                      variant={clinic.is_blocked ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (clinic.is_blocked) {
                          blockMutation.mutate({ clinic, reason: '' });
                        } else {
                          setActionClinic(clinic);
                          setBlockDialogOpen(true);
                        }
                      }}
                      disabled={blockMutation.isPending}
                      className={clinic.is_blocked ? '' : 'text-amber-600 hover:bg-amber-50 border-amber-300'}
                    >
                      {clinic.is_blocked ? (
                        <>
                          <Shield className="h-4 w-4 mr-1" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Block
                        </>
                      )}
                    </Button>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {clinic.verification_status === 'pending' ? (
                          <DropdownMenuItem onClick={() => {
                            setSelectedClinic(clinic);
                            setDetailsOpen(true);
                          }}>
                            <FileText className="h-4 w-4 mr-2" />
                            Review Verification
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => toggleVerification.mutate({ id: clinic.id, isVerified: clinic.is_verified })}
                          >
                            {clinic.is_verified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Unverify Clinic
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify Clinic
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => toggleOpenStatus.mutate({ id: clinic.id, isOpen: clinic.is_open })}
                        >
                          {clinic.is_open ? 'Close Clinic' : 'Open Clinic'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setActionClinic(clinic);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Clinic
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* Clinic Verification Dialog */}
      <ClinicVerificationDialog
        clinic={selectedClinic}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Block Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Clinic?</AlertDialogTitle>
            <AlertDialogDescription>
              Blocking "{actionClinic?.name}" will prevent them from receiving new appointments.
              The clinic profile will remain visible but will be marked as blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="blockReason">Block Reason (optional)</Label>
            <Textarea
              id="blockReason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Violation of terms, Fraudulent activity..."
              rows={2}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionClinic && blockMutation.mutate({ clinic: actionClinic, reason: blockReason })}
              disabled={blockMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {blockMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Ban className="h-4 w-4 mr-1" />
              )}
              Block Clinic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clinic Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{actionClinic?.name}"
              and all associated data including appointments, doctors, and services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => actionClinic && deleteMutation.mutate(actionClinic.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminClinics;
