import React from 'react';
import { useAdmin } from '../AdminContext';
import { ProductCard } from '../components/product/ProductCard';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { products, banners, categories } = useAdmin();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let intervalId: any;
    let isMouseDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let userInteracted = false;
    let interactionTimeout: any;

    const tick = () => {
      if (isMouseDown || userInteracted) return;
      
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      if (el.scrollLeft >= maxScroll - 1) {
        el.scrollLeft = 0; // wrap around smoothly
      } else {
        el.scrollLeft += 0.8; // extremely smooth, slow movement
      }
    };

    const startAutoScroll = () => {
      intervalId = setInterval(tick, 30);
    };

    const stopAutoScroll = () => {
      clearInterval(intervalId);
    };

    const resetInteractionFlag = () => {
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        userInteracted = false;
      }, 3000); // Resume auto-scroll 3 seconds after touch/drag ends
    };

    // Desktop Mouse Drag to Scroll
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      userInteracted = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      resetInteractionFlag();
    };

    const handleMouseLeave = () => {
      isMouseDown = false;
    };

    // Mobile Touch Events
    const handleTouchStart = () => {
      userInteracted = true;
      clearTimeout(interactionTimeout);
    };

    const handleTouchEnd = () => {
      resetInteractionFlag();
    };

    // Pause on desktop hover
    const handleMouseEnter = () => {
      userInteracted = true;
    };

    const handleMouseOverLeave = () => {
      userInteracted = false;
    };

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseOverLeave);

    startAutoScroll();

    return () => {
      stopAutoScroll();
      clearTimeout(interactionTimeout);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseOverLeave);
    };
  }, [categories]);

  const featuredProducts = [...products].reverse().slice(0, 8); // Limit to 2 rows (4 per row = 8)
  const newArrivals = [...products].slice(-8).reverse(); // Limit to 2 rows (4 per row = 8)

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Slider */}
      {banners.length > 0 && (
        <section className="container mx-auto px-4 mt-4">
          <div className="rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1] relative group shadow-lg">
            <img src={banners[0].image} alt={banners[0].title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center p-8 md:p-16">
              <div className="max-w-xl text-white space-y-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className="text-3xl md:text-5xl font-bold leading-tight"
                >
                  {banners[0].title}
                </motion.h1>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link to={banners[0].link} className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover-primary-dark transition-all">
                    Shop Now
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Access Categories */}
      <section className="container mx-auto px-4 overflow-hidden">
        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto no-scrollbar gap-4 pb-4 flex-nowrap cursor-grab active:cursor-grabbing select-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Duplicated categories list for perfect seamless horizontal scrolling on mobile viewports */}
            {[...categories, ...categories, ...categories].map((cat, idx) => (
              <Link 
                key={`${cat.id}-${idx}`} 
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="flex-none w-[28%] sm:w-[20%] md:w-[15%] lg:w-[12%]"
                draggable={false}
              >
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white p-2 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 transition-all cursor-pointer group w-full h-full justify-between"
                  draggable={false}
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden" draggable={false}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                    ) : (
                      <div className="scale-110">📦</div>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-center line-clamp-1 select-none pointer-events-none">{cat.name}</span>
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
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase italic tracking-tighter">Eid Flash Sale</h2>
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
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
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
