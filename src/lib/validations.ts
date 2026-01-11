import { z } from 'zod';

// Appointment validation schema
export const appointmentSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  petName: z.string().min(1, 'Pet name is required').max(100, 'Pet name must be less than 100 characters'),
  petType: z.enum(['Dog', 'Cat', 'Bird', 'Cattle'], { required_error: 'Pet type is required' }),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

// Checkout/Order validation schema
export const checkoutSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters'),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number must be less than 20 characters'),
  address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters'),
  division: z.string().min(1, 'Division is required').max(50, 'Division must be less than 50 characters'),
  district: z.string().min(1, 'District is required').max(50, 'District must be less than 50 characters'),
  thana: z.string().min(1, 'Thana is required').max(50, 'Thana must be less than 50 characters'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string().max(100, 'Full name must be less than 100 characters').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  division: z.string().max(50, 'Division must be less than 50 characters').optional(),
  district: z.string().max(50, 'District must be less than 50 characters').optional(),
  thana: z.string().max(50, 'Thana must be less than 50 characters').optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Review validation schema
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
