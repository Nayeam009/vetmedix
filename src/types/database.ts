export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: 'Pet' | 'Farm';
  product_type: string | null;
  image_url: string | null;
  images: string[] | null;
  badge: string | null;
  discount: number | null;
  stock: number;
  created_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  rating: number;
  distance: string | null;
  services: string[] | null;
  image_url: string | null;
  cover_photo_url: string | null;
  is_open: boolean;
  opening_hours: string | null;
  is_verified: boolean;
  verification_status: string | null;
  owner_user_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  division: string | null;
  district: string | null;
  thana: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string | null;
  pet_type: string | null;
  reason: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  clinic?: Clinic;
}

export interface Order {
  id: string;
  user_id: string;
  items: any;
  total_amount: number;
  shipping_address: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
