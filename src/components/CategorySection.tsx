import { ArrowRight, PawPrint, Wheat, Dog, Cat, Bird, Beef } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import categoryPets from '@/assets/category-pets.jpg';
import categoryFarm from '@/assets/category-farm.jpg';

const CategorySection = () => {
  const mainCategories = [
    {
      title: 'Pet Zone',
      subtitle: 'Dogs, Cats & More',
      description: 'Premium food, medicine, and accessories for your beloved pets',
      image: categoryPets,
      icon: PawPrint,
      link: '/shop?category=Pet',
      buttonText: 'Shop Pet Products',
    },
    {
      title: 'Farm Zone',
      subtitle: 'Cattle, Poultry & Livestock',
      description: 'Quality feed, veterinary supplies for healthy livestock',
      image: categoryFarm,
      icon: Wheat,
      link: '/shop?category=Farm',
      buttonText: 'Shop Farm Products',
    },
  ];

  const subCategories = [
    { icon: Dog, label: 'Dogs', count: '250+', link: '/shop?type=dog' },
    { icon: Cat, label: 'Cats', count: '180+', link: '/shop?type=cat' },
    { icon: Bird, label: 'Birds', count: '80+', link: '/shop?type=bird' },
    { icon: Beef, label: 'Cattle', count: '150+', link: '/shop?type=cattle' },
  ];

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Choose Your Zone
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're caring for pets at home or managing a farm, we have everything you need
          </p>
        </div>

        {/* Main Categories */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {mainCategories.map((category, index) => (
            <Link
              key={index}
              to={category.link}
              className="group relative overflow-hidden rounded-3xl h-[350px] md:h-[400px] card-hover cursor-pointer"
            >
              <img
                src={category.image}
                alt={category.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent"></div>
              
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/20 backdrop-blur-sm text-card text-sm w-fit">
                    <category.icon className="h-4 w-4" />
                    {category.subtitle}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-display font-bold text-card">
                    {category.title}
                  </h3>
                  <p className="text-card/80 max-w-sm">
                    {category.description}
                  </p>
                  <Button 
                    variant="default" 
                    className="group/btn bg-card text-foreground hover:bg-card/90 mt-2"
                  >
                    {category.buttonText}
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Sub Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subCategories.map((cat, index) => (
            <Link 
              key={index}
              to={cat.link}
              className="group p-6 bg-card rounded-2xl border border-border hover:border-primary/50 hover:shadow-hover transition-all duration-300 text-center"
            >
              <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <cat.icon className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">{cat.label}</h4>
              <p className="text-sm text-muted-foreground">{cat.count} Products</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;