import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import CategorySection from '@/components/CategorySection';
import FeaturedProducts from '@/components/FeaturedProducts';
import ClinicSection from '@/components/ClinicSection';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedProducts />
        <ClinicSection />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Index;
