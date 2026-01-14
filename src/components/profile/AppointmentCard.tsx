import { Calendar, Clock, MapPin, Phone, CheckCircle, XCircle, AlertCircle, PawPrint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface AppointmentCardProps {
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    pet_name: string | null;
    pet_type: string | null;
    reason: string | null;
    status: string;
    clinic_id: string;
    clinic?: {
      name: string;
      address: string | null;
      phone: string | null;
    };
  };
}

const AppointmentCard = ({ appointment }: AppointmentCardProps) => {
  const navigate = useNavigate();
  const appointmentDate = new Date(appointment.appointment_date);
  const isAppointmentPast = isPast(appointmentDate) && !isToday(appointmentDate);

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          icon: CheckCircle,
        };
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          icon: CheckCircle,
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: AlertCircle,
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
          icon: XCircle,
        };
      default:
        return {
          color: 'bg-muted text-muted-foreground',
          icon: AlertCircle,
        };
    }
  };

  const getDateLabel = () => {
    if (isToday(appointmentDate)) return 'Today';
    if (isTomorrow(appointmentDate)) return 'Tomorrow';
    return format(appointmentDate, 'EEE, MMM d');
  };

  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;

  const getPetEmoji = (petType: string | null) => {
    switch (petType?.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      case 'fish': return '🐠';
      default: return '🐾';
    }
  };

  return (
    <div className={`border rounded-2xl p-5 transition-all duration-300 bg-card ${
      isAppointmentPast ? 'opacity-60' : 'hover:border-primary/30 hover:shadow-md'
    }`}>
      {/* Date & Status Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {/* Date Box */}
          <div className={`flex flex-col items-center justify-center h-16 w-16 rounded-xl ${
            isToday(appointmentDate) 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <span className="text-2xl font-bold leading-none">
              {format(appointmentDate, 'd')}
            </span>
            <span className="text-xs uppercase">
              {format(appointmentDate, 'MMM')}
            </span>
          </div>
          
          <div>
            <p className="font-semibold text-foreground">
              {getDateLabel()}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {appointment.appointment_time}
            </p>
          </div>
        </div>

        <Badge className={`${statusConfig.color} gap-1`}>
          <StatusIcon className="h-3 w-3" />
          {appointment.status || 'Pending'}
        </Badge>
      </div>

      {/* Clinic Info */}
      <div className="mb-4 p-3 bg-muted/50 rounded-xl">
        <h4 className="font-semibold text-foreground mb-2">
          {appointment.clinic?.name || 'Unknown Clinic'}
        </h4>
        {appointment.clinic?.address && (
          <p className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {appointment.clinic.address}
          </p>
        )}
        {appointment.clinic?.phone && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {appointment.clinic.phone}
          </p>
        )}
      </div>

      {/* Pet & Reason Info */}
      <div className="mb-4 space-y-2">
        {appointment.pet_name && (
          <div className="flex items-center gap-2">
            <span className="text-xl">{getPetEmoji(appointment.pet_type)}</span>
            <span className="font-medium text-foreground">{appointment.pet_name}</span>
            {appointment.pet_type && (
              <span className="text-sm text-muted-foreground">({appointment.pet_type})</span>
            )}
          </div>
        )}
        {appointment.reason && (
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <PawPrint className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {appointment.reason}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {!isAppointmentPast && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/book-appointment/${appointment.clinic_id}`)}
          >
            Reschedule
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Book Again for Past Appointments */}
      {(isAppointmentPast || appointment.status === 'completed') && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/book-appointment/${appointment.clinic_id}`)}
        >
          Book Again
        </Button>
      )}
    </div>
  );
};

export default AppointmentCard;
