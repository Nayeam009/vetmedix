import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Users, Star, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Settings,
  Building2, ArrowLeft, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctor } from '@/hooks/useDoctor';
import { useUserRole } from '@/hooks/useUserRole';
import logo from '@/assets/logo.jpeg';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const { 
    doctorProfile, 
    profileLoading, 
    clinicAffiliations,
    doctorAppointments,
    updateAppointmentStatus 
  } = useDoctor();

  if (roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isDoctor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This page is only accessible to veterinary doctors.
            </p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayAppointments = doctorAppointments?.filter(
    apt => apt.appointment_date === format(new Date(), 'yyyy-MM-dd')
  ) || [];

  const pendingAppointments = doctorAppointments?.filter(
    apt => apt.status === 'pending'
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome, Dr. {doctorProfile?.name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <p className="text-2xl font-bold mt-1">{todayAppointments.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold mt-1">{doctorAppointments?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Affiliations</p>
                  <p className="text-2xl font-bold mt-1">{clinicAffiliations?.length || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Manage your patient appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {doctorAppointments && doctorAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {doctorAppointments.slice(0, 10).map((apt: any) => (
                      <div 
                        key={apt.id} 
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{apt.pet_name || 'Unknown Pet'}</p>
                            <p className="text-sm text-muted-foreground">
                              {apt.pet_type} • {apt.reason || 'General Checkup'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.appointment_date), 'MMM d, yyyy')} at {apt.appointment_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                                  appointmentId: apt.id, 
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
                                  appointmentId: apt.id, 
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

          {/* Clinics Tab */}
          <TabsContent value="clinics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Affiliated Clinics</CardTitle>
                <CardDescription>Clinics where you practice</CardDescription>
              </CardHeader>
              <CardContent>
                {clinicAffiliations && clinicAffiliations.length > 0 ? (
                  <div className="space-y-4">
                    {clinicAffiliations.map((affiliation) => (
                      <div 
                        key={affiliation.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={affiliation.clinic?.image_url || ''} />
                            <AvatarFallback>
                              <Building2 className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{affiliation.clinic?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {affiliation.clinic?.address}
                            </p>
                          </div>
                        </div>
                        <Badge variant={affiliation.status === 'active' ? 'default' : 'secondary'}>
                          {affiliation.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Not affiliated with any clinic yet</p>
                    <Button variant="outline">Browse Clinics</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>Manage your working hours and availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Schedule management coming soon
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/doctor/profile">Update Profile</Link>
                  </Button>
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

export default DoctorDashboard;
