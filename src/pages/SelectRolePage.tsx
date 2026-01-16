import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.jpeg';
import { cn } from '@/lib/utils';

type SelectableRole = 'user' | 'clinic_owner';

const roles = [
  {
    id: 'user' as SelectableRole,
    title: 'Pet Parent',
    description: 'I have pets and want to connect, shop, and book appointments',
    icon: User,
  },
  {
    id: 'clinic_owner' as SelectableRole,
    title: 'Clinic Owner',
    description: 'I own or manage a veterinary clinic',
    icon: Building2,
  },
];

const SelectRolePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState<SelectableRole>('user');
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // Clinic owner fields
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

  // Check if user already has a role
  useEffect(() => {
    const checkExistingRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData?.role) {
          // User already has a role, redirect
          redirectBasedOnRole(roleData.role);
        } else {
          setCheckingRole(false);
        }
      } catch (error) {
        setCheckingRole(false);
      }
    };

    if (!authLoading) {
      checkExistingRole();
    }
  }, [user, authLoading]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'clinic_owner':
        navigate('/clinic/dashboard');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Check if user already has a role (prevent duplicate)
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRole?.role) {
        // User already has a role, just redirect
        redirectBasedOnRole(existingRole.role);
        return;
      }

      // Create role entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole,
        });

      if (roleError) {
        console.error('Failed to assign role:', roleError);
        
        // Check if it's a unique constraint violation (role already exists)
        if (roleError.code === '23505') {
          // Role already exists, fetch it and redirect
          const { data: currentRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (currentRole?.role) {
            redirectBasedOnRole(currentRole.role);
            return;
          }
        }
        
        throw new Error('Failed to set up your account. Please try again.');
      }

      // If clinic owner, create the clinic
      if (selectedRole === 'clinic_owner') {
        if (!clinicName.trim()) {
          throw new Error('Clinic name is required');
        }

        const { error: clinicError } = await supabase
          .from('clinics')
          .insert({
            name: clinicName,
            address: clinicAddress || null,
            phone: clinicPhone || null,
            owner_user_id: user.id,
            is_open: true,
            rating: 0,
          });

        if (clinicError) {
          console.error('Failed to create clinic:', clinicError);
          toast({
            title: 'Account created',
            description: 'However, there was an issue creating your clinic. Please set it up in your dashboard.',
          });
        }
      }

      toast({
        title: 'Welcome to VET-MEDIX!',
        description: selectedRole === 'clinic_owner' 
          ? 'Your clinic has been registered successfully.' 
          : 'Your account is ready. Start exploring!',
      });

      redirectBasedOnRole(selectedRole);
    } catch (error: unknown) {
      console.error('Setup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete setup';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logo} 
              alt="VET-MEDIX" 
              className="h-16 w-16 rounded-xl object-cover"
            />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I am a...</Label>
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left',
                      'hover:border-primary/50 hover:bg-primary/5',
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border bg-card'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}>
                        {role.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {role.description}
                      </p>
                    </div>
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                    )}>
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clinic Owner Fields */}
            {selectedRole === 'clinic_owner' && (
              <div className="space-y-4 pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground pt-2">
                  Enter your clinic details to get started
                </p>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    type="text"
                    placeholder="Your clinic's name"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Clinic Address</Label>
                  <Input
                    id="clinicAddress"
                    type="text"
                    placeholder="Full address of your clinic"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Clinic Phone</Label>
                  <Input
                    id="clinicPhone"
                    type="tel"
                    placeholder="Contact number"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRolePage;
