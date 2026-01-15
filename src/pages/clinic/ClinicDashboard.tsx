import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Users, Star, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Settings,
  Building2, Stethoscope, Package, Plus, Edit, 
  Phone, MapPin, Eye, User, Filter, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import logo from '@/assets/logo.jpeg';

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const { 
    ownedClinic, 
    clinicLoading, 
    clinicServices,
    clinicDoctors,
    clinicAppointments,
    updateAppointmentStatus 
  } = useClinicOwner();

  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isClinicOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This page is only accessible to clinic owners.
            </p>
            <Button onClick={() => navigate('/')}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
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

  const activeServices = clinicServices?.filter(s => s.is_active) || [];

  const filteredAppointments = clinicAppointments?.filter((apt: any) => {
    const matchesFilter = appointmentFilter === 'all' || 
      (appointmentFilter === 'today' && apt.appointment_date === format(new Date(), 'yyyy-MM-dd')) ||
      apt.status === appointmentFilter;
    const matchesSearch = !searchQuery || 
      apt.pet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="VET-MEDIX" className="h-10 w-10 rounded-lg object-cover" />
              <span className="font-bold text-lg hidden sm:block">VET-MEDIX</span>
            </Link>
            <Badge variant="secondary" className="hidden sm:flex">
              <Building2 className="h-3 w-3 mr-1" />
              Clinic Owner
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link to="/clinic/owner-profile">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/clinic/profile">
                <Settings className="h-4 w-4 mr-2" />
                Clinic Settings
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="sm:hidden">
              <Link to="/clinic/profile">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Clinic Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary mb-8">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
          </div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-xl">
                  <AvatarImage src={ownedClinic?.image_url || ''} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                    <Building2 className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      {ownedClinic?.name || 'My Clinic'}
                    </h1>
                    {ownedClinic?.is_verified && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{ownedClinic?.address || 'No address set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ownedClinic?.is_open ? 'default' : 'secondary'} className="gap-1">
                      <span className={`h-2 w-2 rounded-full ${ownedClinic?.is_open ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                      {ownedClinic?.is_open ? 'Open Now' : 'Closed'}
                    </Badge>
                    {ownedClinic?.rating !== undefined && ownedClinic.rating > 0 && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-semibold">{ownedClinic.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" className="bg-background/80">
                  <Link to="/clinic/owner-profile">
                    <User className="h-4 w-4 mr-2" />
                    Owner Profile
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/clinic/profile">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Clinic
                  </Link>
                </Button>
                {ownedClinic?.id && (
                  <Button variant="secondary" asChild>
                    <Link to={`/clinic/${ownedClinic.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Public Page
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Today's Appointments</p>
                  <p className="text-3xl font-bold mt-1 text-primary">{todayAppointments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(), 'EEEE, MMM d')}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Pending Review</p>
                  <p className="text-3xl font-bold mt-1 text-amber-600">{pendingAppointments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Doctors</p>
                  <p className="text-3xl font-bold mt-1 text-green-600">{activeDoctors.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Available for appointments</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Active Services</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600">{activeServices.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Currently offered</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Package className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="doctors">Doctors</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Clinic Appointments</CardTitle>
                    <CardDescription>Manage and review all appointments</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search appointments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAppointments.slice(0, 10).map((apt: any) => (
                      <div 
                        key={apt.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-7 w-7 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-lg">{apt.pet_name || 'Unknown Pet'}</p>
                              <Badge variant="outline" className="text-xs">
                                {apt.pet_type || 'Pet'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {apt.reason || 'General Checkup'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(apt.appointment_date), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {apt.appointment_time}
                              </span>
                            </div>
                            {apt.doctor && (
                              <p className="text-sm text-primary mt-1 flex items-center gap-1">
                                <Stethoscope className="h-3.5 w-3.5" />
                                Dr. {apt.doctor.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                          {apt.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 hover:bg-green-50 hover:border-green-300"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: apt.id, 
                                  status: 'confirmed' 
                                })}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 hover:border-red-300"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: apt.id, 
                                  status: 'cancelled' 
                                })}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {apt.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-blue-600 hover:bg-blue-50"
                              onClick={() => updateAppointmentStatus.mutate({ 
                                id: apt.id, 
                                status: 'completed' 
                              })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No appointments found</p>
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
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-gradient-to-br from-card to-secondary/20 hover:shadow-lg transition-all duration-300"
                      >
                        <Avatar className="h-16 w-16 border-2 border-primary/20">
                          <AvatarImage src={cd.doctor?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10">
                            <Stethoscope className="h-6 w-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg truncate">{cd.doctor?.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {cd.doctor?.specialization || 'General Veterinary'}
                          </p>
                          {cd.doctor?.consultation_fee && (
                            <p className="text-sm font-medium text-primary mt-1">
                              ৳{cd.doctor.consultation_fee} / visit
                            </p>
                          )}
                          <Badge 
                            variant={cd.doctor?.is_available ? 'default' : 'secondary'}
                            className="mt-2"
                          >
                            {cd.doctor?.is_available ? '🟢 Available' : '🔴 Unavailable'}
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    {clinicServices.map((service) => (
                      <div 
                        key={service.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{service.name}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {service.description || 'No description'}
                            </p>
                            {service.duration_minutes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ⏱️ {service.duration_minutes} mins
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {service.price && (
                            <p className="font-bold text-lg text-primary">৳{service.price}</p>
                          )}
                          <Badge variant={service.is_active ? 'default' : 'secondary'} className="mt-1">
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
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Appointment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="text-muted-foreground">Total Appointments</span>
                      <span className="font-bold text-lg">{clinicAppointments?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                      <span className="text-green-600">Completed</span>
                      <span className="font-bold text-lg text-green-600">
                        {clinicAppointments?.filter((a: any) => a.status === 'completed').length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                      <span className="text-blue-600">Confirmed</span>
                      <span className="font-bold text-lg text-blue-600">
                        {clinicAppointments?.filter((a: any) => a.status === 'confirmed').length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                      <span className="text-amber-600">Pending</span>
                      <span className="font-bold text-lg text-amber-600">
                        {pendingAppointments.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                      <span className="text-red-600">Cancelled</span>
                      <span className="font-bold text-lg text-red-600">
                        {clinicAppointments?.filter((a: any) => a.status === 'cancelled').length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    Clinic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
                        <span className="text-4xl font-bold">{ownedClinic?.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-muted-foreground">Clinic Rating</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-secondary/50">
                        <p className="text-2xl font-bold text-primary">{activeDoctors.length}</p>
                        <p className="text-sm text-muted-foreground">Active Doctors</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-secondary/50">
                        <p className="text-2xl font-bold text-primary">{activeServices.length}</p>
                        <p className="text-sm text-muted-foreground">Active Services</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClinicDashboard;