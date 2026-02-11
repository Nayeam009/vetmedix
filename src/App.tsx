import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { PetProvider } from "@/contexts/PetContext";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useFocusManagement } from "@/hooks/useFocusManagement";
import OfflineIndicator from "@/components/OfflineIndicator";

// Critical routes - loaded immediately
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ShopPage from "./pages/ShopPage";
import ClinicsPage from "./pages/ClinicsPage";
import DoctorsPage from "./pages/DoctorsPage";

// Lazy load non-critical routes for better performance
const FeedPage = lazy(() => import("./pages/FeedPage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const ClinicDetailPage = lazy(() => import("./pages/ClinicDetailPage"));
const BookAppointmentPage = lazy(() => import("./pages/BookAppointmentPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PetProfilePage = lazy(() => import("./pages/PetProfilePage"));
const CreatePetPage = lazy(() => import("./pages/CreatePetPage"));
const EditPetPage = lazy(() => import("./pages/EditPetPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const SelectRolePage = lazy(() => import("./pages/SelectRolePage"));
const DoctorDetailPage = lazy(() => import("./pages/DoctorDetailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));

// Admin routes - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminClinics = lazy(() => import("./pages/admin/AdminClinics"));
const AdminSocial = lazy(() => import("./pages/admin/AdminSocial"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));

// Doctor routes - lazy loaded
const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard"));
const DoctorProfile = lazy(() => import("./pages/doctor/DoctorProfile"));
const DoctorVerificationPage = lazy(() => import("./pages/doctor/DoctorVerificationPage"));

// Clinic owner routes - lazy loaded
const ClinicDashboard = lazy(() => import("./pages/clinic/ClinicDashboard"));
const ClinicProfile = lazy(() => import("./pages/clinic/ClinicProfile"));
const ClinicServices = lazy(() => import("./pages/clinic/ClinicServices"));
const ClinicDoctors = lazy(() => import("./pages/clinic/ClinicDoctors"));
const ClinicVerificationPage = lazy(() => import("./pages/clinic/ClinicVerificationPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes - reduce redundant refetches
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    },
  },
});

// Scroll restoration and focus management component
const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  // Focus management for accessibility
  useFocusManagement();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
      <p className="text-muted-foreground text-sm font-medium">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider queryClient={queryClient}>
      <CartProvider>
        <WishlistProvider>
          <PetProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <ScrollToTop />
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes - critical paths loaded immediately */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/clinics" element={<ClinicsPage />} />
                     {/* Backward-compatible alias (some links use plural) */}
                     <Route path="/clinics/:id" element={<ClinicDetailPage />} />
                    <Route path="/doctors" element={<DoctorsPage />} />
                    <Route path="/doctor/:id" element={<DoctorDetailPage />} />
                    
                    {/* Public routes - lazy loaded */}
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/chat/:conversationId" element={<ChatPage />} />
                    <Route path="/pet/:id" element={<PetProfilePage />} />
                    <Route path="/pets/new" element={<CreatePetPage />} />
                    <Route path="/pets/:id/edit" element={<EditPetPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                     <Route path="/clinic/:id" element={<ClinicDetailPage />} />
                    <Route path="/book-appointment/:clinicId" element={<BookAppointmentPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/track-order" element={<TrackOrderPage />} />
                    
                    {/* Admin routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/clinics" element={<AdminClinics />} />
                    <Route path="/admin/social" element={<AdminSocial />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/doctors" element={<AdminDoctors />} />
                    <Route path="/admin/messages" element={<AdminContactMessages />} />
                    <Route path="/admin/coupons" element={<AdminCoupons />} />
                    
                    {/* OAuth Role Selection */}
                    <Route path="/select-role" element={<SelectRolePage />} />
                    
                    {/* Doctor routes */}
                    <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                    <Route path="/doctor/profile" element={<DoctorProfile />} />
                    <Route path="/doctor/verification" element={<DoctorVerificationPage />} />
                    
                    {/* Clinic owner routes */}
                    <Route path="/clinic/verification" element={<ClinicVerificationPage />} />
                    <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
                    <Route path="/clinic/profile" element={<ClinicProfile />} />
                    <Route path="/clinic/owner-profile" element={<Navigate to="/clinic/profile?tab=owner" replace />} />
                    <Route path="/clinic/services" element={<ClinicServices />} />
                    <Route path="/clinic/doctors" element={<ClinicDoctors />} />
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
          </PetProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
