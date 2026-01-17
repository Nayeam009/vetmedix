import { useState } from 'react';
import { format, isToday, isPast, isFuture, parseISO } from 'date-fns';
import { 
  Calendar, Clock, Users, CheckCircle, XCircle, 
  AlertCircle, Eye, Filter, Search, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string | null;
  pet_type: string | null;
  reason: string | null;
  status: string | null;
  doctor?: {
    id: string;
    name: string;
    avatar_url?: string;
    specialization?: string;
  } | null;
}

interface ClinicAppointmentsListProps {
  appointments: Appointment[];
  onStatusChange: (id: string, status: string) => void;
  isUpdating?: boolean;
}

const ClinicAppointmentsList = ({ 
  appointments, 
  onStatusChange,
  isUpdating 
}: ClinicAppointmentsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { 
          color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', 
          icon: CheckCircle,
          label: 'Confirmed'
        };
      case 'pending':
        return { 
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', 
          icon: Clock,
          label: 'Pending'
        };
      case 'cancelled':
        return { 
          color: 'bg-red-500/10 text-red-600 border-red-500/20', 
          icon: XCircle,
          label: 'Cancelled'
        };
      case 'completed':
        return { 
          color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', 
          icon: CheckCircle,
          label: 'Completed'
        };
      default:
        return { 
          color: 'bg-muted text-muted-foreground', 
          icon: AlertCircle,
          label: status 
        };
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isPast(date)) return format(date, 'MMM d, yyyy');
    return format(date, 'MMM d, yyyy');
  };

  const filteredAppointments = appointments
    .filter(apt => {
      const matchesSearch = 
        apt.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by date, then by time
      const dateCompare = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.appointment_time.localeCompare(b.appointment_time);
    });

  // Group by date
  const groupedAppointments = filteredAppointments.reduce((acc, apt) => {
    const date = apt.appointment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by pet name, reason, or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {filterStatus === 'all' ? 'All Status' : filterStatus}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(statusCounts).map(([status, count]) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(filterStatus === status && "bg-muted")}
              >
                <span className="capitalize">{status}</span>
                <Badge variant="secondary" className="ml-auto">{count}</Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            <span className="capitalize">{status}</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-xs",
              filterStatus === status ? "bg-primary-foreground/20" : "bg-background"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {Object.keys(groupedAppointments).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedAppointments).map(([date, apts]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  isToday(parseISO(date)) 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {getDateLabel(date)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {apts.length} appointment{apts.length !== 1 && 's'}
                </span>
              </div>
              
              <div className="space-y-3">
                {apts.map((apt) => {
                  const statusInfo = getStatusInfo(apt.status || 'pending');
                  const StatusIcon = statusInfo.icon;
                  const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
                  const isPastAppointment = isPast(appointmentDateTime);
                  
                  return (
                    <Card 
                      key={apt.id}
                      className={cn(
                        "transition-all hover:shadow-md",
                        isPastAppointment && apt.status === 'pending' && "border-amber-500/50"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Time & Pet Info */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-2 min-w-[60px]">
                              <span className="text-lg font-bold">{apt.appointment_time}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold truncate">
                                  {apt.pet_name || 'Unknown Pet'}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {apt.pet_type || 'Pet'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {apt.reason || 'General Checkup'}
                              </p>
                              {apt.doctor && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={apt.doctor.avatar_url} />
                                    <AvatarFallback className="text-[10px]">
                                      {apt.doctor.name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm text-muted-foreground">
                                    Dr. {apt.doctor.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex items-center gap-2 ml-[72px] sm:ml-0">
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setSelectedAppointment(apt)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {apt.status === 'pending' && (
                                <>
                                  <Button 
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => onStatusChange(apt.id, 'confirmed')}
                                    disabled={isUpdating}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => onStatusChange(apt.id, 'cancelled')}
                                    disabled={isUpdating}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {apt.status === 'confirmed' && !isPastAppointment && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-blue-600 hover:bg-blue-50"
                                  onClick={() => onStatusChange(apt.id, 'completed')}
                                  disabled={isUpdating}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No appointments found</h3>
          <p className="text-muted-foreground text-sm">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Appointments will appear here when booked'}
          </p>
        </div>
      )}

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedAppointment.appointment_date), 'EEEE, MMMM d, yyyy')} at {selectedAppointment.appointment_time}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-primary/10">
                      {selectedAppointment.pet_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAppointment.pet_name}</h3>
                    <p className="text-muted-foreground">{selectedAppointment.pet_type}</p>
                    <Badge className={getStatusInfo(selectedAppointment.status || 'pending').color}>
                      {selectedAppointment.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(parseISO(selectedAppointment.appointment_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedAppointment.appointment_time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason for Visit</p>
                  <p>{selectedAppointment.reason || 'General Checkup'}</p>
                </div>

                {selectedAppointment.doctor && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarImage src={selectedAppointment.doctor.avatar_url} />
                      <AvatarFallback>
                        {selectedAppointment.doctor.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Dr. {selectedAppointment.doctor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.doctor.specialization || 'General Veterinarian'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {selectedAppointment.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        onStatusChange(selectedAppointment.id, 'confirmed');
                        setSelectedAppointment(null);
                      }}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        onStatusChange(selectedAppointment.id, 'cancelled');
                        setSelectedAppointment(null);
                      }}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicAppointmentsList;
