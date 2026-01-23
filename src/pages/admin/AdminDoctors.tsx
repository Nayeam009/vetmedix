import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Stethoscope, Search, CheckCircle, XCircle, Clock, 
  Eye, AlertCircle, Ban, Loader2, ExternalLink, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  bio: string | null;
  avatar_url: string | null;
  license_number: string | null;
  is_available: boolean;
  is_verified: boolean;
  verification_status: string | null;
  verification_submitted_at: string | null;
  bvc_certificate_url: string | null;
  nid_number: string | null;
  rejection_reason: string | null;
  created_by_clinic_id: string | null;
  created_at: string;
}

const AdminDoctors = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all doctors
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Doctor[];
    },
  });

  // Approve doctor mutation
  const approveMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const { error } = await supabase
        .from('doctors')
        .update({
          is_verified: true,
          verification_status: 'approved',
          verification_reviewed_at: new Date().toISOString(),
        })
        .eq('id', doctorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('Doctor approved successfully');
      setIsDetailsOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to approve doctor');
      console.error(error);
    },
  });

  // Reject doctor mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ doctorId, reason }: { doctorId: string; reason: string }) => {
      const { error } = await supabase
        .from('doctors')
        .update({
          is_verified: false,
          verification_status: 'rejected',
          verification_reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', doctorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('Doctor verification rejected');
      setIsRejectOpen(false);
      setIsDetailsOpen(false);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Failed to reject doctor');
      console.error(error);
    },
  });

  // Filter doctors
  const filteredDoctors = doctors?.filter(doctor => {
    const matchesSearch = 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && doctor.verification_status === 'pending';
    if (statusFilter === 'verified') return matchesSearch && doctor.is_verified;
    if (statusFilter === 'rejected') return matchesSearch && doctor.verification_status === 'rejected';
    if (statusFilter === 'not_submitted') return matchesSearch && (!doctor.verification_status || doctor.verification_status === 'not_submitted');
    return matchesSearch;
  }) || [];

  const pendingCount = doctors?.filter(d => d.verification_status === 'pending').length || 0;
  const verifiedCount = doctors?.filter(d => d.is_verified).length || 0;

  const getStatusBadge = (doctor: Doctor) => {
    if (doctor.is_verified) {
      return <Badge className="bg-green-500/10 text-green-600">Verified</Badge>;
    }
    if (doctor.verification_status === 'pending') {
      return <Badge className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
    }
    if (doctor.verification_status === 'rejected') {
      return <Badge className="bg-red-500/10 text-red-600">Rejected</Badge>;
    }
    return <Badge variant="outline">Not Submitted</Badge>;
  };

  const handleViewDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDetailsOpen(true);
  };

  return (
    <AdminLayout title="Doctor Management" subtitle="Review and manage doctor verifications">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Doctors</p>
                <p className="text-2xl font-bold">{doctors?.length || 0}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clinic Doctors</p>
                <p className="text-2xl font-bold">{doctors?.filter(d => d.created_by_clinic_id).length || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="not_submitted">Not Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Doctors List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No doctors found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={doctor.avatar_url || ''} />
                      <AvatarFallback>
                        <Stethoscope className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doctor.name}</h3>
                        {getStatusBadge(doctor)}
                        {doctor.created_by_clinic_id && (
                          <Badge variant="outline" className="text-xs">Clinic Doctor</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {doctor.specialization || 'General Veterinarian'} • {doctor.experience_years || 0} yrs exp
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registered: {format(new Date(doctor.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(doctor)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {doctor.verification_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveMutation.mutate(doctor.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setIsRejectOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Doctor Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedDoctor?.avatar_url || ''} />
                <AvatarFallback>
                  <Stethoscope className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              {selectedDoctor?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDoctor?.specialization || 'General Veterinarian'}
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedDoctor)}
                {selectedDoctor.verification_submitted_at && (
                  <span className="text-sm text-muted-foreground">
                    Submitted: {format(new Date(selectedDoctor.verification_submitted_at), 'MMM d, yyyy')}
                  </span>
                )}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedDoctor.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedDoctor.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">License Number</Label>
                  <p className="font-medium">{selectedDoctor.license_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">NID Number</Label>
                  <p className="font-medium">{selectedDoctor.nid_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Experience</Label>
                  <p className="font-medium">{selectedDoctor.experience_years || 0} years</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Consultation Fee</Label>
                  <p className="font-medium">৳{selectedDoctor.consultation_fee || 0}</p>
                </div>
              </div>

              {/* Qualifications */}
              {selectedDoctor.qualifications && selectedDoctor.qualifications.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Qualifications</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDoctor.qualifications.map((q, i) => (
                      <Badge key={i} variant="secondary">{q}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              {selectedDoctor.bio && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <p className="text-sm mt-1">{selectedDoctor.bio}</p>
                </div>
              )}

              {/* BVC Certificate */}
              {selectedDoctor.bvc_certificate_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">BVC Certificate</Label>
                  <Button variant="outline" size="sm" className="mt-1" asChild>
                    <a href={selectedDoctor.bvc_certificate_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Document
                    </a>
                  </Button>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedDoctor.rejection_reason && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <Label className="text-xs text-red-600">Rejection Reason</Label>
                  <p className="text-sm text-red-700 mt-1">{selectedDoctor.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDoctor?.verification_status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setIsRejectOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => approveMutation.mutate(selectedDoctor.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Doctor
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Doctor Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this doctor's verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedDoctor && rejectMutation.mutate({ 
                doctorId: selectedDoctor.id, 
                reason: rejectionReason 
              })}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDoctors;
