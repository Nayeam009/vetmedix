import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Clock, Phone, Stethoscope, User, 
  Calendar, ChevronRight, Award, Heart, Shield, Loader2,
  MessageSquare, ThumbsUp, Mail, Share2, ChevronLeft,
  CheckCircle, Building2, AlertCircle, ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import gopalganjLogo from '@/assets/gopalganj-vet-care-logo.png';

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  distance: string | null;
  services: string[] | null;
  image_url: string | null;
  is_open: boolean | null;
  is_verified: boolean | null;
  opening_hours: string | null;
  description: string | null;
}

const ClinicDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState(false);

  const isGopalganj = clinic?.name?.toLowerCase().includes('gopalganj');

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      author: 'Rahima Begum',
      avatar: null,
      rating: 5,
      date: '2 days ago',
      comment: 'Excellent service! Dr. Mohsin is very caring and professional. My cat recovered quickly after treatment.',
      helpful: 12
    },
    {
      id: 2,
      author: 'Kamal Hossain',
      avatar: null,
      rating: 5,
      date: '1 week ago',
      comment: 'Best vet clinic in Gopalganj. They treated my dog with great care. Highly recommended!',
      helpful: 8
    },
    {
      id: 3,
      author: 'Fatema Akter',
      avatar: null,
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
    experience: '10+ years',
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
      if (import.meta.env.DEV) {
        console.error('Error fetching clinic:', error);
      }
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
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0
      });
    }
    return days;
  };

  const ratingDistribution = [
    { stars: 5, percentage: 70, count: 34 },
    { stars: 4, percentage: 20, count: 10 },
    { stars: 3, percentage: 7, count: 3 },
    { stars: 2, percentage: 2, count: 1 },
    { stars: 1, percentage: 1, count: 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading clinic details...</p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Clinic Not Found</h2>
          <p className="text-muted-foreground mb-6">The clinic you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/clinics')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Clinics
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-background to-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 sm:mb-6">
          <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/')}>Home</span>
          <ChevronRight className="h-4 w-4" />
          <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/clinics')}>Clinics</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-[150px] sm:max-w-none">{clinic.name}</span>
        </nav>

        {/* Hero Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-black/5 border border-border/50 mb-6 sm:mb-8">
          {/* Cover Image */}
          <div className="relative h-40 sm:h-56 md:h-72 bg-gradient-to-r from-primary/20 via-orange-100 to-amber-50">
            <img 
              src={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200'}
              alt={clinic.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg">
                <Share2 className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>

            {/* Back Button */}
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute top-4 left-4 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              onClick={() => navigate('/clinics')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Clinic Info */}
          <div className="relative px-4 sm:px-6 lg:px-8 pb-6 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Logo */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-2xl bg-white shadow-xl border-4 border-white overflow-hidden flex-shrink-0">
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
              <div className="flex-1 pt-4 sm:pt-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">
                        {clinic.name}
                      </h1>
                      {clinic.is_verified && (
                        <Badge className="bg-primary text-primary-foreground gap-1">
                          <Shield className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-amber-700">{clinic.rating || 4.5}</span>
                        <span className="text-amber-600/70">(48 reviews)</span>
                      </div>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {clinic.distance || '2 km away'}
                      </span>
                      <Badge 
                        variant={clinic.is_open ? 'default' : 'secondary'}
                        className={clinic.is_open ? 'bg-emerald-500 hover:bg-emerald-500' : ''}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${clinic.is_open ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
                        {clinic.is_open ? 'Open Now' : 'Closed'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      size="lg"
                      className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                      onClick={() => navigate(`/book-appointment/${clinic.id}`)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-white border border-border/50 rounded-xl p-1 h-auto flex-wrap">
                <TabsTrigger value="about" className="rounded-lg data-[state=active]:shadow-sm">About</TabsTrigger>
                <TabsTrigger value="services" className="rounded-lg data-[state=active]:shadow-sm">Services</TabsTrigger>
                <TabsTrigger value="doctors" className="rounded-lg data-[state=active]:shadow-sm">Doctors</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:shadow-sm">Reviews</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    About This Clinic
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {clinic.description || (isGopalganj 
                      ? "Gopalganj Vet Care is the first and only dedicated pet clinic in Gopalganj, offering comprehensive veterinary services for cats, dogs, and birds. Starting January 1, 2026, we provide compassionate care for your beloved pets under one roof. Our commitment is to ensure the health and safety of your pets with professional treatment and care."
                      : `${clinic.name} provides comprehensive veterinary services for your beloved pets. Our team of experienced veterinarians is dedicated to ensuring the health and well-being of your furry friends.`
                    )}
                  </p>
                  
                  {/* Trust Badges */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary/5 to-orange-50 rounded-xl border border-primary/10">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Certified Vets</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                      <Shield className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm font-medium">Emergency Care</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                      <Heart className="h-5 w-5 text-rose-500" />
                      <span className="text-sm font-medium">Pet Friendly</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="mt-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Services Offered
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(clinic.services || ['Consultation', 'Vaccination', 'Surgery', 'Dental Care', 'Grooming', 'Emergency Care']).map((service, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-primary/5 hover:to-orange-50 border border-border/50 hover:border-primary/20 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{service}</span>
                        </div>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Doctors Tab */}
              <TabsContent value="doctors" className="mt-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50">
                  <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Our Doctors
                  </h2>
                  
                  {isGopalganj ? (
                    <div className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6 bg-gradient-to-r from-primary/5 via-orange-50/50 to-amber-50/50 rounded-2xl border border-primary/10">
                      <Avatar className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-lg flex-shrink-0">
                        <AvatarImage src={doctorInfo.image} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">DM</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground">{doctorInfo.name}</h3>
                          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Verified</Badge>
                        </div>
                        <p className="text-primary font-semibold mb-3">{doctorInfo.title}</p>
                        <div className="space-y-1.5 mb-4">
                          {doctorInfo.qualifications.map((qual, idx) => (
                            <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <Award className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              {qual}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="bg-white">
                            <Clock className="h-3 w-3 mr-1" />
                            {doctorInfo.experience}
                          </Badge>
                          <Badge className="bg-emerald-500 hover:bg-emerald-500">Available</Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">Doctor information coming soon</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg sm:text-xl font-display font-bold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Customer Reviews
                    </h2>
                    <Button variant="outline" size="sm">Write a Review</Button>
                  </div>
                  
                  {/* Rating Summary */}
                  <div className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-2xl border border-amber-100 mb-6">
                    <div className="text-center sm:text-left">
                      <div className="text-4xl sm:text-5xl font-bold text-foreground">{clinic.rating || 4.5}</div>
                      <div className="flex items-center justify-center sm:justify-start gap-1 my-2">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-5 w-5 ${i <= Math.floor(clinic.rating || 4.5) ? 'text-amber-500 fill-amber-500' : 'text-muted/40'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">Based on 48 reviews</p>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {ratingDistribution.map(({ stars, percentage, count }) => (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm w-4 text-muted-foreground">{stars}</span>
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <Progress value={percentage} className="flex-1 h-2.5" />
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review List */}
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="p-4 sm:p-5 bg-muted/30 rounded-xl border border-border/50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {review.author.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{review.author}</p>
                              <p className="text-xs text-muted-foreground">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`h-4 w-4 ${i <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted/40'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
                          <ThumbsUp className="h-4 w-4" />
                          Helpful ({review.helpful})
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Book Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50 sticky top-4">
              <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Quick Book
              </h3>
              
              {/* Date Selection */}
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Select Date</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {getNext7Days().map((day) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`p-2 sm:p-2.5 rounded-xl text-center transition-all ${
                        selectedDate === day.date
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                          : 'bg-muted/50 hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="text-[10px] sm:text-xs font-medium opacity-70">{day.day}</div>
                      <div className="text-sm sm:text-lg font-bold">{day.dayNum}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full shadow-lg shadow-primary/25"
                size="lg"
                onClick={() => navigate(`/book-appointment/${clinic.id}`)}
              >
                View All Slots
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-border/50">
              <h3 className="font-display font-bold text-foreground mb-4">Contact & Location</h3>
              
              <div className="space-y-4">
                {clinic.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Address</p>
                      <p className="text-sm text-muted-foreground">{clinic.address}</p>
                    </div>
                  </div>
                )}
                
                {clinic.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Phone</p>
                      <a href={`tel:${clinic.phone}`} className="text-sm text-primary hover:underline">{clinic.phone}</a>
                    </div>
                  </div>
                )}
                
                {clinic.opening_hours && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Hours</p>
                      <p className="text-sm text-muted-foreground">{clinic.opening_hours}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Preview */}
              <div className="mt-4 rounded-xl overflow-hidden h-32 bg-muted border border-border/50">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=89.5,22.5,92,26&layer=mapnik`}
                  className="w-full h-full"
                  title="Map"
                />
              </div>
              
              <Button variant="outline" className="w-full mt-3" asChild>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address || clinic.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Maps
                </a>
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
