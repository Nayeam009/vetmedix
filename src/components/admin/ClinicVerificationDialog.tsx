import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  verification_status: string | null;
  bvc_certificate_url: string | null;
  trade_license_url: string | null;
  rejection_reason: string | null;
  verification_submitted_at: string | null;
  owner_name: string | null;
  owner_nid: string | null;
  created_at: string;
}

interface ClinicVerificationDialogProps {
  clinic: Clinic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClinicVerificationDialog({
  clinic,
  open,
  onOpenChange,
}: ClinicVerificationDialogProps) {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!clinic) throw new Error('No clinic selected');

      const { error } = await supabase
        .from('clinics')
        .update({
          verification_status: 'approved',
          is_verified: true,
          verification_reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', clinic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
      toast.success('Clinic approved successfully!');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to approve clinic');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!clinic) throw new Error('No clinic selected');
      if (!rejectionReason.trim()) throw new Error('Rejection reason is required');

      const { error } = await supabase
        .from('clinics')
        .update({
          verification_status: 'rejected',
          is_verified: false,
          verification_reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', clinic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinic-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
      toast.success('Clinic verification rejected');
      setRejectionReason('');
      setShowRejectDialog(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject clinic');
    },
  });

  if (!clinic) return null;

  const isPending = clinic.verification_status === 'pending';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {clinic.name}
              {isPending && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Pending Review
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Review clinic verification request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Submission Info */}
            {clinic.verification_submitted_at && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">Submitted: </span>
                <span className="font-medium">
                  {format(new Date(clinic.verification_submitted_at), 'PPpp')}
                </span>
              </div>
            )}

            {/* Owner Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Owner Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Owner Name</p>
                  <p className="font-medium">{clinic.owner_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NID Number</p>
                  <p className="font-medium">{clinic.owner_nid || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Clinic Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Clinic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{clinic.address || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{clinic.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{clinic.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              {clinic.description && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium">{clinic.description}</p>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Verification Documents
              </h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">BVC Certificate</span>
                  </div>
                  {clinic.bvc_certificate_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(clinic.bvc_certificate_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  ) : (
                    <Badge variant="secondary">Not uploaded</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">Trade License</span>
                  </div>
                  {clinic.trade_license_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(clinic.trade_license_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  ) : (
                    <Badge variant="secondary">Not uploaded</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Previous Rejection Reason */}
            {clinic.rejection_reason && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Previous Rejection Reason
                </p>
                <p className="text-sm text-destructive/80">{clinic.rejection_reason}</p>
              </div>
            )}
          </div>

          {isPending && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                disabled={rejectMutation.isPending || approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Clinic Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will grant {clinic.name} full access to the clinic management system.
              Make sure you have reviewed all documents carefully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog with Reason */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Clinic Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejection. The clinic owner will see this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Rejection Reason *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., BVC Certificate is unclear, please upload a clearer image..."
              rows={3}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
