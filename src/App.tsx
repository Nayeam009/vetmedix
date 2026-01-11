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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <PetProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/feed" element={<FeedPage />} />
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