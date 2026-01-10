import { ArrowRight, PawPrint, Wheat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import categoryPets from '@/assets/category-pets.jpg';
import categoryFarm from '@/assets/category-farm.jpg';

const CategorySection = () => {
  const categories = [
    {
      title: 'Pet Zone',
      subtitle: 'Dogs, Cats & More',
      description: 'Premium food, medicine, and accessories for your beloved pets',
      image: categoryPets,
      icon: PawPrint,
      color: 'from-primary/80 to-emerald-light/80',
      buttonText: 'Shop Pet Products',
    },
    {
      title: 'Farm Zone',
      subtitle: 'Cattle, Poultry & Livestock',
      description: 'Quality feed, veterinary supplies for healthy livestock',
      image: categoryFarm,
      icon: Wheat,
      color: 'from-secondary/80 to-royal-light/80',
      buttonText: 'Shop Farm Products',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Zone
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're caring for pets at home or managing a farm, we have everything you need
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl h-[400px] md:h-[450px] card-hover cursor-pointer"
            >
              <img
                src={category.image}
                alt={category.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-60`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent"></div>
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/20 backdrop-blur-sm text-primary-foreground text-sm">
                    <category.icon className="h-4 w-4" />
                    {category.subtitle}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                    {category.title}
                  </h3>
                  <p className="text-primary-foreground/80 max-w-sm">
                    {category.description}
                  </p>
                  <Button 
                    variant="hero" 
                    className="group/btn bg-card text-foreground hover:bg-card/90"
                  >
                    {category.buttonText}
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
