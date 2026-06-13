import React from 'react';
import { useAdmin } from '../AdminContext';
import { ProductCard } from '../components/product/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { products, banners, categories } = useAdmin();
  const [currentBanner, setCurrentBanner] = React.useState(0);

  React.useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);



  const featuredProducts = [...products].reverse().slice(0, 8); // Limit to 2 rows (4 per row = 8)
  const newArrivals = [...products].slice(-8).reverse(); // Limit to 2 rows (4 per row = 8)

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Slider */}
      {banners.length > 0 && (
        <section className="container mx-auto px-4 mt-4">
          <div className="rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1] relative group shadow-lg bg-gray-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img src={banners[currentBanner].image} alt={banners[currentBanner].title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center p-8 md:p-16">
                  <div className="max-w-xl text-white space-y-4">
                    {banners[currentBanner].title && (
                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-bold leading-tight"
                        style={{ color: banners[currentBanner].titleColor || '#FFFFFF' }}
                      >
                        {banners[currentBanner].title}
                      </motion.h1>
                    )}
                    {Boolean(banners[currentBanner].showButton) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        {(banners[currentBanner].buttonLink || banners[currentBanner].link) ? (
                          <Link 
                            to={(banners[currentBanner].buttonLink || banners[currentBanner].link) as string} 
                            className="inline-block px-8 py-3 rounded-full font-bold hover:opacity-90 transition-all shadow-lg"
                            style={{
                              backgroundColor: banners[currentBanner].buttonBgColor || '#EF4444',
                              color: banners[currentBanner].buttonTextColor || '#FFFFFF'
                            }}
                          >
                            {banners[currentBanner].buttonText || 'Shop Now'}
                          </Link>
                        ) : (
                          <span
                            className="inline-block px-8 py-3 rounded-full font-bold shadow-lg"
                            style={{
                              backgroundColor: banners[currentBanner].buttonBgColor || '#EF4444',
                              color: banners[currentBanner].buttonTextColor || '#FFFFFF'
                            }}
                          >
                            {banners[currentBanner].buttonText || 'Shop Now'}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Slider Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBanner(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === currentBanner ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Quick Access Categories */}
      <section className="container mx-auto px-4 overflow-hidden">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-3">Featured Categories</h2>
            <p className="text-sm text-gray-500 mt-1">Explore our collections</p>
          </div>
        </div>
        <div className="relative">
          {/* Mobile View — horizontal scroll carousel, no duplication */}
          <div
            className="flex md:hidden overflow-x-auto no-scrollbar gap-3 pb-2 flex-nowrap cursor-grab active:cursor-grabbing select-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="flex-none w-[22vw] min-w-[72px] max-w-[96px]"
                draggable={false}
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all cursor-pointer group w-full h-full justify-between"
                  draggable={false}
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden" draggable={false}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                    ) : (
                      <div className="scale-110">📦</div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-center line-clamp-1 select-none pointer-events-none w-full">{cat.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:flex flex-wrap justify-center gap-6 pb-4">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="w-32"
                draggable={false}
              >
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 transition-all cursor-pointer group h-full justify-between"
                  draggable={false}
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden" draggable={false}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                    ) : (
                      <div className="scale-150">📦</div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-center line-clamp-2 select-none pointer-events-none">{cat.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-3">Popular Products</h2>
            <p className="text-sm text-gray-500 mt-1">Our most popular products across all categories</p>
          </div>
          <Link to="/products" className="text-primary font-bold flex items-center gap-1 hover:underline text-sm md:text-base">
            View All <ArrowRight size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 [&>*:nth-child(n+5)]:hidden md:[&>*:nth-child(n+5)]:block md:[&>*:nth-child(n+9)]:hidden">
          {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Campaign Banner */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden flex items-center justify-between">
          <div className="relative z-10 space-y-4 max-w-lg">
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase italic tracking-tighter">Flash Sale</h2>
            <p className="text-lg opacity-90">Enjoy special discounts on our collection for a limited time!</p>
            <button className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:scale-105 transition-all">
              Grab the Offer
            </button>
          </div>
          <div className="hidden md:block relative z-10">
            <div className="text-[120px] font-black opacity-20 select-none pointer-events-none -rotate-12 translate-x-10">
              OFFER
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-3">New Collections</h2>
            <p className="text-sm text-gray-500 mt-1">Browse our recently added trendy items</p>
          </div>
          <Link to="/products" className="text-primary font-bold flex items-center gap-1 hover:underline">
            View All <ArrowRight size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 [&>*:nth-child(n+5)]:hidden md:[&>*:nth-child(n+5)]:block md:[&>*:nth-child(n+9)]:hidden">
          {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Electronics section removed */}

      {/* Store Advantage Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Why Shop With Us?</h2>
            <p className="opacity-80">We prioritize customer satisfaction and guarantee high-quality product reliability.</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">🚚</div>
              <div>
                <h3 className="font-bold text-lg">Super Fast Delivery</h3>
                <p className="text-sm opacity-70">Get fast and reliable delivery straight to your doorstep right after order confirmation.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">🛡️</div>
              <div>
                <h3 className="font-bold text-lg">Secure Payments</h3>
                <p className="text-sm opacity-70">Check out securely using bKash, Nagad, bank transfers, or Cash on Delivery.</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">✨</div>
              <div>
                <h3 className="font-bold text-lg">Premium Quality</h3>
                <p className="text-sm opacity-70">Every item undergoes rigorous quality inspections before being dispatched.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">💬</div>
              <div>
                <h3 className="font-bold text-lg">24/7 Support</h3>
                <p className="text-sm opacity-70">Our dedicated customer service team is always here to assist with any questions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
