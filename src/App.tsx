import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PetProvider } from "@/contexts/PetContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ShopPage from "./pages/ShopPage";
import ClinicsPage from "./pages/ClinicsPage";
import ClinicDetailPage from "./pages/ClinicDetailPage";
import BookAppointmentPage from "./pages/BookAppointmentPage";
import ProfilePage from "./pages/ProfilePage";
import FeedPage from "./pages/FeedPage";
import PetProfilePage from "./pages/PetProfilePage";
import CreatePetPage from "./pages/CreatePetPage";
import EditPetPage from "./pages/EditPetPage";
import ExplorePage from "./pages/ExplorePage";
import MessagesPage from "./pages/MessagesPage";
import ChatPage from "./pages/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminClinics from "./pages/admin/AdminClinics";
import AdminSocial from "./pages/admin/AdminSocial";
// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorProfile from "./pages/doctor/DoctorProfile";
// Clinic owner pages
import ClinicDashboard from "./pages/clinic/ClinicDashboard";
import ClinicProfile from "./pages/clinic/ClinicProfile";
import ClinicServices from "./pages/clinic/ClinicServices";
import ClinicDoctors from "./pages/clinic/ClinicDoctors";
// OAuth role selection
import SelectRolePage from "./pages/SelectRolePage";
import { Navigate, useSearchParams } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider queryClient={queryClient}>
      <CartProvider>
        <PetProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/chat/:conversationId" element={<ChatPage />} />
                <Route path="/pet/:id" element={<PetProfilePage />} />
                <Route path="/pets/new" element={<CreatePetPage />} />
                <Route path="/pets/:id/edit" element={<EditPetPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/clinics" element={<ClinicsPage />} />
                <Route path="/clinic/:id" element={<ClinicDetailPage />} />
                <Route path="/book-appointment/:clinicId" element={<BookAppointmentPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* Admin routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/clinics" element={<AdminClinics />} />
                <Route path="/admin/social" element={<AdminSocial />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                
                {/* OAuth Role Selection */}
                <Route path="/select-role" element={<SelectRolePage />} />
                
                {/* Doctor routes */}
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor/profile" element={<DoctorProfile />} />
                
                {/* Clinic owner routes */}
                <Route path="/clinic/dashboard" element={<ClinicDashboard />} />
                <Route path="/clinic/profile" element={<ClinicProfile />} />
                <Route path="/clinic/owner-profile" element={<Navigate to="/clinic/profile?tab=owner" replace />} />
                <Route path="/clinic/services" element={<ClinicServices />} />
                <Route path="/clinic/doctors" element={<ClinicDoctors />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PetProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
