import ProductCard from './ProductCard';

const FeaturedProducts = () => {
  const products = [
    {
      name: 'ACI Godrej Cattle Feed (50kg)',
      price: 2400,
      category: 'Farm' as const,
      image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=400&fit=crop',
      discount: 10,
    },
    {
      name: 'Whiskas Ocean Fish (1.2kg)',
      price: 850,
      category: 'Pet' as const,
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop',
    },
    {
      name: 'Renamycin-100 Antibiotic',
      price: 120,
      category: 'Farm' as const,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
      badge: 'Rx Required',
    },
    {
      name: 'Royal Canin Adult Dog Food',
      price: 4500,
      category: 'Pet' as const,
      image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&h=400&fit=crop',
      discount: 15,
    },
    {
      name: 'Premium Poultry Feed (25kg)',
      price: 1200,
      category: 'Farm' as const,
      image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=400&fit=crop',
    },
    {
      name: 'Cat Scratching Post Tower',
      price: 2800,
      category: 'Pet' as const,
      image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&h=400&fit=crop',
    },
    {
      name: 'Calcium Supplement for Cattle',
      price: 350,
      category: 'Farm' as const,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=400&fit=crop',
    },
    {
      name: 'Dog Collar with LED Light',
      price: 650,
      category: 'Pet' as const,
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
      discount: 20,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Best sellers for your pets and farm animals
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground">
              All
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-full bg-card text-foreground border border-border hover:border-primary transition-colors">
              Pet
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-full bg-card text-foreground border border-border hover:border-primary transition-colors">
              Farm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
