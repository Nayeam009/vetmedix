import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Users, Star, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Settings,
  Building2, Stethoscope, Package, Plus, Edit,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import logo from '@/assets/logo.jpeg';
import { cn } from '@/lib/utils';

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('appointments');
  const { 
    ownedClinic, 
    clinicLoading, 
    clinicServices,
    clinicDoctors,
    clinicAppointments,
    updateAppointmentStatus 
  } = useClinicOwner();

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isClinicOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              {!user ? 'Please sign in to access this page.' : 'This page is only accessible to clinic owners.'}
            </p>
            <Button onClick={() => navigate(user ? '/' : '/auth')}>
              {user ? 'Go to Home' : 'Sign In'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to verification page if not verified
  if (ownedClinic && !ownedClinic.is_verified && ownedClinic.verification_status !== 'approved') {
    navigate('/clinic/verification');
    return null;
  }

  const todayAppointments = clinicAppointments?.filter(
    (apt: any) => apt.appointment_date === format(new Date(), 'yyyy-MM-dd')
  ) || [];

  const pendingAppointments = clinicAppointments?.filter(
    (apt: any) => apt.status === 'pending'
  ) || [];

  const activeDoctors = clinicDoctors?.filter(
    d => d.status === 'active'
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Clinic Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={ownedClinic?.image_url || ''} />
              <AvatarFallback>
                <Building2 className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {ownedClinic?.name || 'My Clinic'}
              </h1>
              <p className="text-muted-foreground">{ownedClinic?.address}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={ownedClinic?.is_open ? 'default' : 'secondary'}>
                  {ownedClinic?.is_open ? 'Open' : 'Closed'}
                </Badge>
                {ownedClinic?.is_verified && (
                  <Badge variant="outline" className="text-green-600">Verified</Badge>
                )}
              </div>
            </div>
          </div>
          <Button asChild>
            <Link to="/clinic/profile">
              <Edit className="h-4 w-4 mr-2" />
              Edit Clinic
            </Link>
          </Button>
        </div>

        {/* Stats Grid - Clickable Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            onClick={() => setActiveTab('appointments')}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
              activeTab === 'appointments' && "ring-2 ring-primary shadow-lg"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold mt-1">{todayAppointments.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">View appointments</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveTab('appointments')}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
              activeTab === 'appointments' && pendingAppointments.length > 0 && "ring-2 ring-yellow-500 shadow-lg"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold mt-1">{pendingAppointments.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">View pending</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveTab('doctors')}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
              activeTab === 'doctors' && "ring-2 ring-green-500 shadow-lg"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Doctors</p>
                  <p className="text-2xl font-bold mt-1">{activeDoctors.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Manage doctors</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => setActiveTab('services')}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
              activeTab === 'services' && "ring-2 ring-blue-500 shadow-lg"
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-bold mt-1">{clinicServices?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Manage services</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clinic Appointments</CardTitle>
                  <CardDescription>All appointments at your clinic</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {clinicAppointments && clinicAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {clinicAppointments.slice(0, 10).map((apt: any) => (
                      <div 
                        key={apt.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{apt.pet_name || 'Unknown Pet'}</p>
                            <p className="text-sm text-muted-foreground">
                              {apt.pet_type} • {apt.reason || 'General Checkup'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.appointment_date), 'MMM d, yyyy')} at {apt.appointment_time}
                            </p>
                            {apt.doctor && (
                              <p className="text-sm text-primary mt-1">
                                Dr. {apt.doctor.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-16 sm:ml-0">
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                          {apt.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: apt.id, 
                                  status: 'confirmed' 
                                })}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: apt.id, 
                                  status: 'cancelled' 
                                })}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No appointments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doctors Tab */}
          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clinic Doctors</CardTitle>
                  <CardDescription>Manage doctors at your clinic</CardDescription>
                </div>
                <Button asChild>
                  <Link to="/clinic/doctors">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doctor
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {clinicDoctors && clinicDoctors.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {clinicDoctors.map((cd) => (
                      <div 
                        key={cd.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={cd.doctor?.avatar_url || ''} />
                          <AvatarFallback>
                            <Stethoscope className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{cd.doctor?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {cd.doctor?.specialization || 'General'}
                          </p>
                          <Badge 
                            variant={cd.doctor?.is_available ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {cd.doctor?.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No doctors added yet</p>
                    <Button asChild>
                      <Link to="/clinic/doctors">Add Your First Doctor</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clinic Services</CardTitle>
                  <CardDescription>Services offered at your clinic</CardDescription>
                </div>
                <Button asChild>
                  <Link to="/clinic/services">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {clinicServices && clinicServices.length > 0 ? (
                  <div className="space-y-3">
                    {clinicServices.map((service) => (
                      <div 
                        key={service.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border"
                      >
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.description || 'No description'}
                          </p>
                          {service.duration_minutes && (
                            <p className="text-sm text-muted-foreground">
                              Duration: {service.duration_minutes} mins
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {service.price && (
                            <p className="font-semibold text-primary">৳{service.price}</p>
                          )}
                          <Badge variant={service.is_active ? 'default' : 'secondary'}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No services added yet</p>
                    <Button asChild>
                      <Link to="/clinic/services">Add Your First Service</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{clinicAppointments?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time appointments
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Appointments</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {clinicAppointments?.filter(apt => apt.status === 'completed').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳0</div>
                  <p className="text-xs text-muted-foreground">
                    Total earnings
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Appointment Status Overview</CardTitle>
                <CardDescription>Breakdown of appointment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="text-sm font-medium">
                      {clinicAppointments?.filter(apt => apt.status === 'pending').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confirmed</span>
                    <span className="text-sm font-medium">
                      {clinicAppointments?.filter(apt => apt.status === 'confirmed').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="text-sm font-medium">
                      {clinicAppointments?.filter(apt => apt.status === 'completed').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cancelled</span>
                    <span className="text-sm font-medium">
                      {clinicAppointments?.filter(apt => apt.status === 'cancelled').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default ClinicDashboard;
