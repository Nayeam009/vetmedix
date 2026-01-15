import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Users, Star, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Settings,
  Building2, Stethoscope, Package, Plus, Edit, 
  Phone, MapPin, Eye, User, Filter, Search, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.jpeg';

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
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

  const handleViewPublicPage = () => {
    if (ownedClinic?.id) {
      navigate(`/clinic/${ownedClinic.id}`);
    } else {
      toast({ title: 'Clinic not found', description: 'Please complete your clinic profile first.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src={logo} alt="VET-MEDIX" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover shrink-0" />
              <span className="font-bold text-base sm:text-lg hidden sm:block truncate">VET-MEDIX</span>
            </Link>
            <Badge variant="secondary" className="hidden sm:flex shrink-0">
              <Building2 className="h-3 w-3 mr-1" />
              Clinic Owner
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Desktop buttons */}
            <Button variant="ghost" size="sm" asChild className="hidden lg:flex">
              <Link to="/clinic/profile?tab=owner">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link to="/clinic/profile">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => signOut()} className="hidden sm:flex">
              Sign Out
            </Button>
            
            {/* Mobile dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/clinic/profile?tab=owner" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/clinic/profile" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Clinic Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/clinic/profile?tab=schedules" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Doctor Schedules
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
        {/* Clinic Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary mb-6 sm:mb-8">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-accent rounded-full blur-3xl" />
          </div>
          
          <div className="relative p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-5">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 border-4 border-background shadow-xl shrink-0">
                  <AvatarImage src={ownedClinic?.image_url || ''} />
                  <AvatarFallback className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                    <Building2 className="h-8 w-8 sm:h-10 sm:w-10" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
                      {ownedClinic?.name || 'My Clinic'}
                    </h1>
                    {ownedClinic?.is_verified && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 shrink-0">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{ownedClinic?.address || 'No address set'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge variant={ownedClinic?.is_open ? 'default' : 'secondary'} className="gap-1">
                      <span className={`h-2 w-2 rounded-full ${ownedClinic?.is_open ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                      {ownedClinic?.is_open ? 'Open Now' : 'Closed'}
                    </Badge>
                    {ownedClinic?.rating !== undefined && ownedClinic.rating > 0 && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-semibold text-sm">{ownedClinic.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="bg-background/80">
                  <Link to="/clinic/profile?tab=owner">
                    <User className="h-4 w-4 mr-1.5" />
                    <span className="hidden xs:inline">Owner</span> Profile
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/clinic/profile">
                    <Edit className="h-4 w-4 mr-1.5" />
                    <span className="hidden xs:inline">Edit</span> Clinic
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" onClick={handleViewPublicPage}>
                  <Eye className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">View</span> Public
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-4 sm:pt-6 relative">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Today's Appointments</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 text-primary">{todayAppointments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {format(new Date(), 'EEEE, MMM d')}
                  </p>
                </div>
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shrink-0">
                  <Calendar className="h-5 w-5 sm:h-7 sm:w-7 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-4 sm:pt-6 relative">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Pending Review</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 text-amber-600">{pendingAppointments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Awaiting confirmation</p>
                </div>
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shrink-0">
                  <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-4 sm:pt-6 relative">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Active Doctors</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 text-green-600">{activeDoctors.length}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Available for appointments</p>
                </div>
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shrink-0">
                  <Stethoscope className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="pt-4 sm:pt-6 relative">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Active Services</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 text-blue-600">{activeServices.length}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Currently offered</p>
                </div>
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
                  <Package className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="space-y-4 sm:space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="w-full inline-flex h-auto p-1 gap-1">
              <TabsTrigger value="appointments" className="flex-1 px-3 py-2 text-xs sm:text-sm">
                <Calendar className="h-4 w-4 mr-1.5 hidden xs:inline" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="doctors" className="flex-1 px-3 py-2 text-xs sm:text-sm">
                <Stethoscope className="h-4 w-4 mr-1.5 hidden xs:inline" />
                Doctors
              </TabsTrigger>
              <TabsTrigger value="services" className="flex-1 px-3 py-2 text-xs sm:text-sm">
                <Package className="h-4 w-4 mr-1.5 hidden xs:inline" />
                Services
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 px-3 py-2 text-xs sm:text-sm">
                <TrendingUp className="h-4 w-4 mr-1.5 hidden xs:inline" />
                Analytics
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Clinic Appointments</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Manage and review all appointments</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search appointments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={appointmentFilter} onValueChange={setAppointmentFilter}>
                      <SelectTrigger className="w-full sm:w-[140px]">
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
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAppointments.slice(0, 10).map((apt: any) => (
                      <div 
                        key={apt.id} 
                        className="flex flex-col gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-semibold text-sm sm:text-lg">{apt.pet_name || 'Unknown Pet'}</p>
                              <Badge variant="outline" className="text-xs">
                                {apt.pet_type || 'Pet'}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                              {apt.reason || 'General Checkup'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {format(new Date(apt.appointment_date), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                {apt.appointment_time}
                              </span>
                            </div>
                            {apt.doctor && (
                              <p className="text-xs sm:text-sm text-primary mt-1 flex items-center gap-1">
                                <Stethoscope className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                Dr. {apt.doctor.name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                          <Badge className={getStatusColor(apt.status)}>
                            {apt.status}
                          </Badge>
                          {apt.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm h-8"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: apt.id, 
                                  status: 'confirmed' 
                                })}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 hover:border-red-300 text-xs sm:text-sm h-8"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: apt.id, 
                                  status: 'cancelled' 
                                })}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {apt.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-blue-600 hover:bg-blue-50 text-xs sm:text-sm h-8"
                              onClick={() => updateAppointmentStatus.mutate({ 
                                id: apt.id, 
                                status: 'completed' 
                              })}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Clinic Doctors</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Manage doctors at your clinic</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link to="/clinic/doctors">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Doctor
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {clinicDoctors && clinicDoctors.length > 0 ? (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {clinicDoctors.map((cd) => (
                      <div 
                        key={cd.id}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-gradient-to-br from-card to-secondary/20 hover:shadow-lg transition-all duration-300"
                      >
                        <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20 shrink-0">
                          <AvatarImage src={cd.doctor?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10">
                            <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-lg truncate">{cd.doctor?.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {cd.doctor?.specialization || 'General Veterinary'}
                          </p>
                          {cd.doctor?.consultation_fee && (
                            <p className="text-xs sm:text-sm font-medium text-primary mt-1">
                              ৳{cd.doctor.consultation_fee} / visit
                            </p>
                          )}
                          <Badge 
                            variant={cd.doctor?.is_available ? 'default' : 'secondary'}
                            className="mt-2 text-xs"
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
                    <Button asChild size="sm">
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div>
                  <CardTitle className="text-base sm:text-lg">Clinic Services</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Services offered at your clinic</CardDescription>
                </div>
                <Button asChild size="sm">
                  <Link to="/clinic/services">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Service
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {clinicServices && clinicServices.length > 0 ? (
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    {clinicServices.map((service) => (
                      <div 
                        key={service.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-all"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm sm:text-base truncate">{service.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                              {service.description || 'No description'}
                            </p>
                            {service.duration_minutes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                ⏱️ {service.duration_minutes} mins
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                          {service.price && (
                            <p className="font-bold text-base sm:text-lg text-primary">৳{service.price}</p>
                          )}
                          <Badge variant={service.is_active ? 'default' : 'secondary'} className="text-xs">
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
                    <Button asChild size="sm">
                      <Link to="/clinic/services">Add Your First Service</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Appointment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-secondary/50">
                      <span className="text-xs sm:text-sm text-muted-foreground">Total Appointments</span>
                      <span className="font-bold text-base sm:text-lg">{clinicAppointments?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-green-500/10">
                      <span className="text-xs sm:text-sm text-green-600">Completed</span>
                      <span className="font-bold text-base sm:text-lg text-green-600">
                        {clinicAppointments?.filter((a: any) => a.status === 'completed').length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-blue-500/10">
                      <span className="text-xs sm:text-sm text-blue-600">Confirmed</span>
                      <span className="font-bold text-base sm:text-lg text-blue-600">
                        {clinicAppointments?.filter((a: any) => a.status === 'confirmed').length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-amber-500/10">
                      <span className="text-xs sm:text-sm text-amber-600">Pending</span>
                      <span className="font-bold text-base sm:text-lg text-amber-600">
                        {pendingAppointments.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-red-500/10">
                      <span className="text-xs sm:text-sm text-red-600">Cancelled</span>
                      <span className="font-bold text-base sm:text-lg text-red-600">
                        {clinicAppointments?.filter((a: any) => a.status === 'cancelled').length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    Clinic Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center p-4 sm:p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 fill-amber-500" />
                        <span className="text-3xl sm:text-4xl font-bold">{ownedClinic?.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Clinic Rating</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 rounded-lg bg-secondary/50">
                        <p className="text-xl sm:text-2xl font-bold text-primary">{activeDoctors.length}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Active Doctors</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 rounded-lg bg-secondary/50">
                        <p className="text-xl sm:text-2xl font-bold text-primary">{activeServices.length}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Active Services</p>
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