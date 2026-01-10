import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Clock, Phone, Stethoscope, User, 
  Calendar, ChevronRight, Award, Heart, Shield, Loader2,
  MessageSquare, ThumbsUp
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import gopalganjLogo from '@/assets/gopalganj-vet-care-logo.png';

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  distance: string | null;
  services: string[] | null;
  image_url: string | null;
  is_open: boolean | null;
  opening_hours: string | null;
}

const ClinicDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots] = useState([
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM'
  ]);

  const isGopalganj = clinic?.name?.toLowerCase().includes('gopalganj');

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      author: 'Rahima Begum',
      rating: 5,
      date: '2 days ago',
      comment: 'Excellent service! Dr. Mohsin is very caring and professional. My cat recovered quickly after treatment.',
      helpful: 12
    },
    {
      id: 2,
      author: 'Kamal Hossain',
      rating: 5,
      date: '1 week ago',
      comment: 'Best vet clinic in Gopalganj. They treated my dog with great care. Highly recommended!',
      helpful: 8
    },
    {
      id: 3,
      author: 'Fatema Akter',
      rating: 4,
      date: '2 weeks ago',
      comment: 'Good facilities and friendly staff. Vaccination was done professionally.',
      helpful: 5
    }
  ];

  // Doctor info for Gopalganj Vet Care
  const doctorInfo = {
    name: 'Dr. Md. Mohsin Hossain',
    title: 'Pet Consultant & Surgeon',
    qualifications: [
      'B.Sc. Vet. Sci. & A.H. (GSTU)',
      'MS in Theriogenology (BAU)',
      'CT (Ultra), PGT (Japan)',
      'BVC Reg. No: 9562'
    ],
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400'
  };

  useEffect(() => {
    if (id) fetchClinic();
  }, [id]);

  const fetchClinic = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setClinic(data);
    } catch (error) {
      console.error('Error fetching clinic:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate next 7 days
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Clinic not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/clinics')}>Clinics</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{clinic.name}</span>
        </div>

        {/* Header Section */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border mb-8">
          <div className="relative h-48 md:h-64 bg-gradient-warm">
            <img 
              src={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800'}
              alt={clinic.name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          </div>
          
          <div className="relative px-6 pb-6 -mt-16">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="w-28 h-28 rounded-2xl bg-card shadow-lg border-4 border-background overflow-hidden flex-shrink-0">
                {isGopalganj ? (
                  <img src={gopalganjLogo} alt={clinic.name} className="w-full h-full object-cover" />
                ) : (
                  <img 
                    src={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200'}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                      {clinic.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <span className="font-semibold text-foreground">{clinic.rating || 4.5}</span>
                        <span>(48 reviews)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {clinic.distance || '2 km'}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        clinic.is_open ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {clinic.is_open ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="warm" 
                      onClick={() => navigate(`/book-appointment/${clinic.id}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                About This Clinic
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {isGopalganj 
                  ? "Gopalganj Vet Care is the first and only dedicated pet clinic in Gopalganj, offering comprehensive veterinary services for cats, dogs, and birds. Starting January 1, 2026, we provide compassionate care for your beloved pets under one roof. Our commitment is to ensure the health and safety of your pets with professional treatment and care."
                  : `${clinic.name} provides comprehensive veterinary services for your beloved pets. Our team of experienced veterinarians is dedicated to ensuring the health and well-being of your furry friends.`
                }
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Certified Vets</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Emergency Care</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Pet Friendly</span>
                </div>
              </div>
            </section>

            {/* Doctor Information */}
            {isGopalganj && (
              <section className="bg-card rounded-2xl p-6 shadow-card border border-border">
                <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Our Doctor
                </h2>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 bg-secondary">
                    <img 
                      src={doctorInfo.image} 
                      alt={doctorInfo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{doctorInfo.name}</h3>
                    <p className="text-primary font-medium mb-3">{doctorInfo.title}</p>
                    <div className="space-y-1">
                      {doctorInfo.qualifications.map((qual, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <Award className="h-3 w-3 text-accent" />
                          {qual}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Services */}
            <section className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Services Offered
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(clinic.services || ['Consultation', 'Vaccination', 'Surgery']).map((service, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{service}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Reviews
                </h2>
                <Button variant="outline" size="sm">Write a Review</Button>
              </div>
              
              {/* Rating Summary */}
              <div className="flex items-center gap-6 p-4 bg-secondary/50 rounded-xl mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">{clinic.rating || 4.5}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-4 w-4 ${i <= Math.floor(clinic.rating || 4.5) ? 'text-primary fill-primary' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">48 reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5,4,3,2,1].map(star => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs w-3">{star}</span>
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: star === 5 ? '70%' : star === 4 ? '20%' : star === 3 ? '10%' : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="p-4 bg-secondary/30 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{review.author}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3 w-3 ${i <= review.rating ? 'text-primary fill-primary' : 'text-muted'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <ThumbsUp className="h-3 w-3" />
                      Helpful ({review.helpful})
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact & Location */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-display font-bold text-foreground mb-4">Contact & Location</h3>
              
              {clinic.address && (
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Address</p>
                    <p className="text-sm text-muted-foreground">{clinic.address}</p>
                  </div>
                </div>
              )}
              
              {clinic.phone && (
                <div className="flex items-start gap-3 mb-4">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">{clinic.phone}</p>
                  </div>
                </div>
              )}
              
              {clinic.opening_hours && (
                <div className="flex items-start gap-3 mb-4">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Opening Hours</p>
                    <p className="text-sm text-muted-foreground">{clinic.opening_hours}</p>
                  </div>
                </div>
              )}

              {/* Map Placeholder */}
              <div className="mt-4 rounded-xl overflow-hidden h-40 bg-secondary">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(clinic.address || clinic.name + ' Bangladesh')}`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Quick Book */}
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border">
              <h3 className="font-display font-bold text-foreground mb-4">Quick Book</h3>
              
              {/* Date Selection */}
              <p className="text-sm text-muted-foreground mb-3">Select a date</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {getNext7Days().slice(0, 4).map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`p-2 rounded-xl text-center transition-all ${
                      selectedDate === day.date 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <p className="text-xs">{day.day}</p>
                    <p className="text-lg font-semibold">{day.dayNum}</p>
                    <p className="text-xs">{day.month}</p>
                  </button>
                ))}
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <>
                  <p className="text-sm text-muted-foreground mb-3">Available slots</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {availableSlots.slice(0, 6).map(slot => (
                      <button
                        key={slot}
                        className="px-2 py-2 text-xs rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <Button 
                variant="warm" 
                className="w-full"
                onClick={() => navigate(`/book-appointment/${clinic.id}`)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View All Slots
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default ClinicDetailPage;
