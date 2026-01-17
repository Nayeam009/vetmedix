import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Building2,
  User,
  CreditCard,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpeg';
import { notifyAdminsOfNewVerification } from '@/lib/notifications';

const ClinicVerificationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();

  const [formData, setFormData] = useState({
    ownerName: '',
    ownerNid: '',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    clinicDescription: '',
  });
  const [bvcFile, setBvcFile] = useState<File | null>(null);
  const [tradeLicenseFile, setTradeLicenseFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch clinic data
  const { data: clinic, isLoading: clinicLoading } = useQuery({
    queryKey: ['my-clinic-verification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id && isClinicOwner,
  });

  // Pre-fill form with existing data
  useEffect(() => {
    if (clinic) {
      setFormData({
        ownerName: clinic.owner_name || '',
        ownerNid: clinic.owner_nid || '',
        clinicName: clinic.name || '',
        clinicAddress: clinic.address || '',
        clinicPhone: clinic.phone || '',
        clinicEmail: clinic.email || '',
        clinicDescription: clinic.description || '',
      });
    }
  }, [clinic]);

  // Upload file to storage
  const uploadFile = async (file: File, type: 'bvc' | 'trade_license'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}/${type}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('clinic-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('clinic-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Submit verification mutation
  const submitVerification = useMutation({
    mutationFn: async () => {
      if (!user?.id || !clinic?.id) throw new Error('User or clinic not found');
      if (!bvcFile && !clinic.bvc_certificate_url) throw new Error('BVC Certificate is required');
      if (!tradeLicenseFile && !clinic.trade_license_url) throw new Error('Trade License is required');

      setUploading(true);

      let bvcUrl = clinic.bvc_certificate_url;
      let tradeLicenseUrl = clinic.trade_license_url;

      // Upload files if new ones are selected
      if (bvcFile) {
        bvcUrl = await uploadFile(bvcFile, 'bvc');
      }
      if (tradeLicenseFile) {
        tradeLicenseUrl = await uploadFile(tradeLicenseFile, 'trade_license');
      }

      // Update clinic with verification data
      const { error } = await supabase
        .from('clinics')
        .update({
          name: formData.clinicName,
          address: formData.clinicAddress,
          phone: formData.clinicPhone,
          email: formData.clinicEmail,
          description: formData.clinicDescription,
          owner_name: formData.ownerName,
          owner_nid: formData.ownerNid,
          bvc_certificate_url: bvcUrl,
          trade_license_url: tradeLicenseUrl,
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', clinic.id);

      if (error) throw error;

      // Notify all admins about new verification request
      await notifyAdminsOfNewVerification({
        clinicId: clinic.id,
        clinicName: formData.clinicName,
        ownerName: formData.ownerName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-clinic-verification'] });
      toast.success('Verification request submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit verification');
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ownerName.trim()) {
      toast.error('Owner name is required');
      return;
    }
    if (!formData.clinicName.trim()) {
      toast.error('Clinic name is required');
      return;
    }
    if (!formData.clinicAddress.trim()) {
      toast.error('Clinic address is required');
      return;
    }
    if (!bvcFile && !clinic?.bvc_certificate_url) {
      toast.error('BVC Certificate is required');
      return;
    }
    if (!tradeLicenseFile && !clinic?.trade_license_url) {
      toast.error('Trade License is required');
      return;
    }

    submitVerification.mutate();
  };

  const handleFileChange = (type: 'bvc' | 'trade_license', file: File | null) => {
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF or image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
    }
    if (type === 'bvc') {
      setBvcFile(file);
    } else {
      setTradeLicenseFile(file);
    }
  };

  // Loading states
  if (authLoading || roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated or not a clinic owner
  if (!user || !isClinicOwner) {
    navigate('/auth');
    return null;
  }

  // If approved, redirect to dashboard
  if (clinic?.verification_status === 'approved' || clinic?.is_verified) {
    navigate('/clinic/dashboard');
    return null;
  }

  // Pending status - show waiting screen
  if (clinic?.verification_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-amber-500/10">
                <Clock className="h-12 w-12 text-amber-500" />
              </div>
            </div>
            <CardTitle className="text-2xl">Verification Pending</CardTitle>
            <CardDescription className="text-base">
              Your clinic verification request is being reviewed by our admin team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Submitted on {clinic.verification_submitted_at 
                  ? new Date(clinic.verification_submitted_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Unknown'}
              </p>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>What happens next?</AlertTitle>
              <AlertDescription className="text-sm">
                Our team will review your BVC Certificate and Trade License. 
                You'll receive a notification once your clinic is verified. 
                This usually takes 1-3 business days.
              </AlertDescription>
            </Alert>
            <div className="pt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                While waiting, you can explore our pet community features:
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => navigate('/')}>
                  Browse Pet Shop
                </Button>
                <Button variant="outline" onClick={() => navigate('/feed')}>
                  Explore Pet Social
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected status - show rejection reason and allow resubmission
  const isRejected = clinic?.verification_status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="VET-MEDIX" 
            className="h-16 w-16 rounded-xl object-cover mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">Clinic Verification</h1>
          <p className="text-muted-foreground mt-1">
            Complete your clinic verification to access the clinic management system
          </p>
        </div>

        {isRejected && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Verification Rejected</AlertTitle>
            <AlertDescription>
              {clinic?.rejection_reason || 'Your verification request was rejected. Please review your documents and try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {isRejected ? 'Resubmit Verification' : 'Submit Verification'}
            </CardTitle>
            <CardDescription>
              Provide your clinic details and upload required documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Owner Information */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Full Name *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerNid">NID Number</Label>
                    <Input
                      id="ownerNid"
                      value={formData.ownerNid}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerNid: e.target.value }))}
                      placeholder="National ID number"
                    />
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Clinic Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic Name *</Label>
                    <Input
                      id="clinicName"
                      value={formData.clinicName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
                      placeholder="Your clinic's name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicAddress">Clinic Address *</Label>
                    <Input
                      id="clinicAddress"
                      value={formData.clinicAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinicAddress: e.target.value }))}
                      placeholder="Full address of your clinic"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clinicPhone">Phone Number</Label>
                      <Input
                        id="clinicPhone"
                        type="tel"
                        value={formData.clinicPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, clinicPhone: e.target.value }))}
                        placeholder="Contact number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinicEmail">Email</Label>
                      <Input
                        id="clinicEmail"
                        type="email"
                        value={formData.clinicEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, clinicEmail: e.target.value }))}
                        placeholder="clinic@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicDescription">Description</Label>
                    <Textarea
                      id="clinicDescription"
                      value={formData.clinicDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, clinicDescription: e.target.value }))}
                      placeholder="Brief description of your clinic and services"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Required Documents
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload clear images or PDF files of your certificates (max 5MB each)
                </p>

                {/* BVC Certificate */}
                <div className="space-y-2">
                  <Label>BVC Certificate (Bangladesh Veterinary Council) *</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 transition-colors hover:border-primary/50">
                    <input
                      type="file"
                      id="bvcFile"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileChange('bvc', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="bvcFile"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      {bvcFile ? (
                        <div className="flex items-center gap-2 text-primary">
                          <FileText className="h-5 w-5" />
                          <span className="font-medium">{bvcFile.name}</span>
                        </div>
                      ) : clinic?.bvc_certificate_url ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Document uploaded (click to replace)</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload BVC Certificate
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Trade License */}
                <div className="space-y-2">
                  <Label>Trade License *</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 transition-colors hover:border-primary/50">
                    <input
                      type="file"
                      id="tradeLicenseFile"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileChange('trade_license', e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <label
                      htmlFor="tradeLicenseFile"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      {tradeLicenseFile ? (
                        <div className="flex items-center gap-2 text-primary">
                          <FileText className="h-5 w-5" />
                          <span className="font-medium">{tradeLicenseFile.name}</span>
                        </div>
                      ) : clinic?.trade_license_url ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Document uploaded (click to replace)</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload Trade License
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={uploading || submitVerification.isPending}
              >
                {uploading || submitVerification.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : isRejected ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resubmit Verification
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit for Verification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClinicVerificationPage;
