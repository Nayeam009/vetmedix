import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, Clock, Users, Star, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Settings,
  Building2, Stethoscope, Package, Plus, Edit, 
  MapPin, User, Filter, Search, Menu
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
import { useClinicOwner, ClinicService } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import AppointmentDetailsDialog from '@/components/clinic/AppointmentDetailsDialog';
import ServiceQuickActions from '@/components/clinic/ServiceQuickActions';
import DoctorQuickActions from '@/components/clinic/DoctorQuickActions';
import logo from '@/assets/logo.jpeg';

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const { 
    ownedClinic, 
    clinicLoading, 
    clinicServices,
    clinicDoctors,
    clinicAppointments,
    updateAppointmentStatus,
    updateService,
    deleteService,
    updateDoctorStatus,
    removeDoctor,
  } = useClinicOwner();

  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);

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


  // Handle service toggle
  const handleServiceToggle = (serviceId: string, isActive: boolean) => {
    updateService.mutate({ 
      id: serviceId, 
      updates: { is_active: isActive } 
    });
  };

  // Handle service edit - navigate to services page for editing
  const handleServiceEdit = (service: ClinicService) => {
    navigate('/clinic/services');
  };

  // Handle service delete
  const handleServiceDelete = (serviceId: string) => {
    deleteService.mutate(serviceId);
  };

  // Handle appointment status update
  const handleAppointmentStatusUpdate = (id: string, status: string) => {
    updateAppointmentStatus.mutate({ id, status });
    setSelectedAppointment(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left side - Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="VET-MEDIX" 
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all" 
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg tracking-tight">VET-MEDIX</span>
                <p className="text-[10px] text-muted-foreground -mt-0.5">Clinic Portal</p>
              </div>
            </Link>
          </div>

          {/* Center - Nav tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Link 
              to="/clinic/dashboard"
              className="px-4 py-1.5 rounded-md text-sm font-medium bg-background shadow-sm text-foreground"
            >
              Dashboard
            </Link>
            <Link 
              to="/clinic/doctors"
              className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              Doctors
            </Link>
            <Link 
              to="/clinic/services"
              className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              Services
            </Link>
            <Link 
              to="/clinic/profile"
              className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
            >
              Settings
            </Link>
          </nav>
          
          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden lg:flex gap-2">
              <Link to="/profile">
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </Button>
            
            {/* Mobile dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to="/clinic/dashboard" className="flex items-center font-medium">
                    <Building2 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/clinic/doctors" className="flex items-center">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Doctors
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/clinic/services" className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Services
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/clinic/profile" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Personal Profile
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
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 md:flex-col md:gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none bg-background/80 hover:bg-background">
                  <Link to="/clinic/profile">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Clinic
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none bg-background/80 hover:bg-background">
                  <Link to="/clinic/doctors">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Doctors
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1 md:flex-none bg-background/80 hover:bg-background">
                  <Link to="/clinic/services">
                    <Package className="h-4 w-4 mr-2" />
                    Services
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAppointments.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredAppointments.slice(0, 20).map((apt: any) => (
                      <div 
                        key={apt.id} 
                        className="flex flex-col gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-md cursor-pointer"
                        onClick={() => setSelectedAppointment(apt)}
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
                            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAppointmentStatus.mutate({ 
                                  id: apt.id, 
                                  status: 'completed' 
                                });
                              }}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Clinic Doctors</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage doctors at your clinic</p>
              </div>
              <Button asChild size="sm">
                <Link to="/clinic/doctors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Doctor
                </Link>
              </Button>
            </div>
            {clinicDoctors && clinicDoctors.length > 0 ? (
              <DoctorQuickActions
                doctors={clinicDoctors}
                onStatusChange={(id, status) => updateDoctorStatus.mutate({ id, status })}
                onEdit={(doctor) => navigate('/clinic/doctors')}
                onDelete={(doctorId) => removeDoctor.mutate(doctorId)}
                isUpdating={updateDoctorStatus.isPending || removeDoctor.isPending}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No doctors added yet</p>
                  <Button asChild size="sm">
                    <Link to="/clinic/doctors">Add Your First Doctor</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Services Tab - Now using ServiceQuickActions */}
          <TabsContent value="services" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Clinic Services</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Services offered at your clinic</p>
              </div>
              <Button asChild size="sm">
                <Link to="/clinic/services">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Link>
              </Button>
            </div>
            {clinicServices && clinicServices.length > 0 ? (
              <ServiceQuickActions
                services={clinicServices}
                onToggleActive={handleServiceToggle}
                onEdit={handleServiceEdit}
                onDelete={handleServiceDelete}
                isUpdating={updateService.isPending || deleteService.isPending}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No services added yet</p>
                  <Button asChild size="sm">
                    <Link to="/clinic/services">Add Your First Service</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
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

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 rounded-lg bg-green-500/10">
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{todayAppointments.length}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Today's Appointments</p>
                      </div>
                      <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-500/10">
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {clinicAppointments?.filter((a: any) => a.status === 'completed').length || 0}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Total Completed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Stats Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  This Month's Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {(() => {
                    const thisMonth = new Date().getMonth();
                    const thisYear = new Date().getFullYear();
                    const monthlyAppointments = clinicAppointments?.filter((a: any) => {
                      const date = new Date(a.appointment_date);
                      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
                    }) || [];

                    return (
                      <>
                        <div className="text-center p-4 rounded-lg bg-primary/10">
                          <p className="text-2xl sm:text-3xl font-bold text-primary">{monthlyAppointments.length}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Total This Month</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-green-500/10">
                          <p className="text-2xl sm:text-3xl font-bold text-green-600">
                            {monthlyAppointments.filter((a: any) => a.status === 'completed').length}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-amber-500/10">
                          <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                            {monthlyAppointments.filter((a: any) => a.status === 'pending').length}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-red-500/10">
                          <p className="text-2xl sm:text-3xl font-bold text-red-600">
                            {monthlyAppointments.filter((a: any) => a.status === 'cancelled').length}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Cancelled</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onUpdateStatus={handleAppointmentStatusUpdate}
        isUpdating={updateAppointmentStatus.isPending}
        clinicPhone={ownedClinic?.phone || undefined}
      />
    </div>
  );
};

export default ClinicDashboard;
