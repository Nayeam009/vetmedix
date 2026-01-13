import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RoleSelector, SignupRole } from '@/components/auth/RoleSelector';
import logo from '@/assets/logo.jpeg';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SignupRole>('user');
  
  // Doctor-specific fields
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  // Clinic owner fields
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        // Check user role and redirect accordingly
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          
          const role = roleData?.role || 'user';
          
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          
          // Redirect based on role
          switch (role) {
            case 'doctor':
              navigate('/doctor/dashboard');
              break;
            case 'clinic_owner':
              navigate('/clinic/dashboard');
              break;
            case 'admin':
              navigate('/admin');
              break;
            default:
              navigate('/');
          }
        }
      } else {
        // Sign up
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        // Get the new user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Create role entry
          await supabase
            .from('user_roles')
            .insert({ 
              user_id: user.id, 
              role: selectedRole 
            });

          // Create role-specific profile
          if (selectedRole === 'doctor') {
            await supabase
              .from('doctors')
              .insert({
                user_id: user.id,
                name: fullName,
                specialization: specialization || null,
                license_number: licenseNumber || null,
                email: email,
              });
          } else if (selectedRole === 'clinic_owner') {
            // Create clinic for owner
            await supabase
              .from('clinics')
              .insert({
                name: clinicName,
                address: clinicAddress || null,
                phone: clinicPhone || null,
                owner_user_id: user.id,
                is_open: true,
                rating: 0,
              });
          }

          toast({
            title: "Account created!",
            description: "Welcome to VET-MEDIX. Let's get you started.",
          });

          // Redirect based on role
          switch (selectedRole) {
            case 'doctor':
              navigate('/doctor/dashboard');
              break;
            case 'clinic_owner':
              navigate('/clinic/dashboard');
              break;
            default:
              navigate('/');
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setSpecialization('');
    setLicenseNumber('');
    setClinicName('');
    setClinicAddress('');
    setClinicPhone('');
    setSelectedRole('user');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
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
                  className="h-11"
                />
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
                className="h-11"
              />
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
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Doctor-specific fields */}
            {!isLogin && selectedRole === 'doctor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    type="text"
                    placeholder="e.g., Small Animals, Surgery, Dermatology"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    type="text"
                    placeholder="Your veterinary license number"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="h-11"
                  />
                </div>
              </>
            )}

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
    </div>
  );
};

export default AuthPage;
