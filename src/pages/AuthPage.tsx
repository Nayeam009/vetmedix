import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { RoleSelector, SignupRole } from '@/components/auth/RoleSelector';
import logo from '@/assets/logo.jpeg';
import { Separator } from '@/components/ui/separator';
import { loginSchema, signupSchema, clinicOwnerSignupSchema } from '@/lib/validations';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const AuthPage = () => {
  useDocumentTitle('Sign In');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SignupRole>('user');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Clinic owner fields
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const { user, signIn, signUp, loading: authLoading } = useAuth();
  
  const navigate = useNavigate();

  // Priority order for role-based redirects
  const ROLE_PRIORITY = ['admin', 'clinic_owner', 'doctor', 'moderator', 'user'];

  const redirectBasedOnRoles = (roles: string[]) => {
    const primaryRole = ROLE_PRIORITY.find(r => roles.includes(r)) || 'user';
    
    switch (primaryRole) {
      case 'admin':
        navigate('/admin');
        break;
      case 'clinic_owner':
        navigate('/clinic/dashboard');
        break;
      case 'doctor':
        navigate('/doctor/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  // Handle OAuth callback and check if user needs role selection
  useEffect(() => {
    const handleAuthCallback = async () => {
      if (authLoading) return;
      
      if (user) {
        try {
          // User is logged in, check if they have any roles
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (roleError) {
            console.error('Error checking roles:', roleError);
            // Still allow access but set checkingAuth to false
            setCheckingAuth(false);
            return;
          }

          const roles = roleData?.map(r => r.role) || [];

          if (roles.length === 0) {
            // New user (likely OAuth), redirect to role selection
            navigate('/select-role');
          } else {
            // Existing user with role(s), redirect based on priority
            redirectBasedOnRoles(roles);
          }
        } catch (error) {
          console.error('Error in auth callback:', error);
          setCheckingAuth(false);
        }
      } else {
        setCheckingAuth(false);
      }
    };

    handleAuthCallback();
  }, [user, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Google";
      toast.error(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign in with Apple";
      toast.error(errorMessage);
      setAppleLoading(false);
    }
  };

  const validateForm = (): boolean => {
    setValidationErrors({});
    
    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
      } else if (selectedRole === 'clinic_owner') {
        clinicOwnerSignupSchema.parse({
          email,
          password,
          fullName,
          clinicName,
          clinicAddress,
          clinicPhone,
        });
      } else {
        signupSchema.parse({ email, password, fullName });
      }
      return true;
    } catch (error: any) {
      if (error.errors) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const path = err.path[0];
          if (path && !errors[path]) {
            errors[path] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        // Wait for auth state to update
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id);
          
          const roles = roleData?.map(r => r.role) || [];
          
          toast.success("Welcome back!");
          
          redirectBasedOnRoles(roles);
        }
      } else {
        // Sign up
        const { error, user: newUser } = await signUp(email, password, fullName);
        if (error) throw error;

        if (!newUser) {
          throw new Error('Failed to create account. Please try again.');
        }

        // Create role entry with error handling
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: newUser.id, 
            role: selectedRole 
          });

        if (roleError) {
          // Check if it's a duplicate error
          if (roleError.code === '23505') {
            // Role already exists, continue
            // Role already exists, continue silently
          } else {
            console.error('Failed to assign role:', roleError);
            toast.error("Issue setting up your profile. Please try logging in again.");
            navigate('/auth');
            return;
          }
        }

        // Create clinic for clinic owner
        if (selectedRole === 'clinic_owner') {
          const { error: clinicError } = await supabase
            .from('clinics')
            .insert({
              name: clinicName,
              address: clinicAddress || null,
              phone: clinicPhone || null,
              owner_user_id: newUser.id,
              is_open: true,
              rating: 0,
            });

          if (clinicError) {
            console.error('Failed to create clinic:', clinicError);
            toast.warning("Account created, but there was an issue creating your clinic. Please set it up in your dashboard.");
          }
        }

        // Create doctor profile for doctor role with retry mechanism
        if (selectedRole === 'doctor') {
          let doctorCreated = false;
          let retryCount = 0;
          const maxRetries = 2;

          while (!doctorCreated && retryCount <= maxRetries) {
            const { error: doctorError } = await supabase
              .from('doctors')
              .insert({
                name: fullName,
                user_id: newUser.id,
                is_available: true,
                is_verified: false,
                verification_status: 'not_submitted',
              });

            if (!doctorError) {
              doctorCreated = true;
            } else if (doctorError.code === '23505') {
              // Duplicate key - profile already exists, which is fine
              doctorCreated = true;
            } else {
              retryCount++;
              if (retryCount <= maxRetries) {
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }

          if (!doctorCreated) {
            console.error('Failed to create doctor profile after retries');
            toast.warning("Account created, but we couldn't set up your doctor profile. Complete this on the verification page.");
            // Still navigate to verification page - they can create profile there
          }
        }

        toast.success("Account created! Welcome to VET-MEDIX.");

        // Redirect based on role
        if (selectedRole === 'clinic_owner') {
          navigate('/clinic/verification');
        } else if (selectedRole === 'doctor') {
          navigate('/doctor/verification');
        } else {
          navigate('/');
        }
      }
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : "Something went wrong";
      const friendlyMessages: Record<string, string> = {
        'User already registered': 'An account with this email already exists. Please sign in instead.',
        'Invalid login credentials': 'Incorrect email or password. Please try again.',
        'Email not confirmed': 'Please verify your email address before signing in.',
        'Too many requests': 'Too many attempts. Please wait a moment and try again.',
        'Signup disabled': 'New registrations are currently disabled. Please contact support.',
      };
      const friendlyMessage = Object.entries(friendlyMessages).find(
        ([key]) => rawMessage.toLowerCase().includes(key.toLowerCase())
      )?.[1] || rawMessage;
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setClinicName('');
    setClinicAddress('');
    setClinicPhone('');
    setSelectedRole('user');
    setValidationErrors({});
  };

  // Show loading while checking auth state
  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main id="main-content" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src={logo} 
                alt="VET-MEDIX" 
                className="h-16 w-16 rounded-xl object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">VET-MEDIX</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your Complete Pet Care Platform
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); resetForm(); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isLogin 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); resetForm(); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                !isLogin 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector - Only for signup */}
            {!isLogin && (
              <RoleSelector 
                selectedRole={selectedRole} 
                onRoleSelect={setSelectedRole} 
              />
            )}

            {/* Full Name - Only for signup */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  aria-invalid={!!validationErrors.fullName}
                  aria-describedby={validationErrors.fullName ? 'fullName-error' : undefined}
                  className={`h-11 ${validationErrors.fullName ? 'border-destructive' : ''}`}
                />
                {validationErrors.fullName && (
                  <p id="fullName-error" className="text-xs text-destructive" role="alert">{validationErrors.fullName}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={!!validationErrors.email}
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
                className={`h-11 ${validationErrors.email ? 'border-destructive' : ''}`}
              />
              {validationErrors.email && (
                <p id="email-error" className="text-xs text-destructive" role="alert">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  aria-invalid={!!validationErrors.password}
                  aria-describedby={validationErrors.password ? 'password-error' : undefined}
                  className={`h-11 pr-10 ${validationErrors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-3"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p id="password-error" className="text-xs text-destructive" role="alert">{validationErrors.password}</p>
              )}
              {isLogin && (
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            {/* Clinic owner fields */}
            {!isLogin && selectedRole === 'clinic_owner' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic Name *</Label>
                  <Input
                    id="clinicName"
                    type="text"
                    placeholder="Your clinic's name"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    className={`h-11 ${validationErrors.clinicName ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.clinicName && (
                    <p className="text-xs text-destructive">{validationErrors.clinicName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Clinic Address</Label>
                  <Input
                    id="clinicAddress"
                    type="text"
                    placeholder="Full address of your clinic"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className={`h-11 ${validationErrors.clinicAddress ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.clinicAddress && (
                    <p className="text-xs text-destructive">{validationErrors.clinicAddress}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clinicPhone">Clinic Phone</Label>
                  <Input
                    id="clinicPhone"
                    type="tel"
                    placeholder="Contact number"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className={`h-11 ${validationErrors.clinicPhone ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.clinicPhone && (
                    <p className="text-xs text-destructive">{validationErrors.clinicPhone}</p>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11 mt-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              or continue with
            </span>
          </div>

          {/* Google Sign In */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-3"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || appleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Apple Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 gap-3 bg-black text-white hover:bg-black/90 hover:text-white border-black"
              onClick={handleAppleSignIn}
              disabled={appleLoading || googleLoading || loading}
            >
              {appleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              Continue with Apple
            </Button>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;
