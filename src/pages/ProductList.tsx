import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../AdminContext';
import { ProductCard } from '../components/product/ProductCard';
import { Filter, SlidersHorizontal, ChevronDown, LayoutGrid, List, Search as SearchIcon } from 'lucide-react';
import { DISTRICTS } from '../constants';
import { useLocation, useParams } from 'react-router-dom';

export const ProductList: React.FC = () => {
  const { products, categories } = useAdmin();
  const { categoryName } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || categoryName || 'all';
  
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minPriceInput, setMinPriceInput] = useState('0');
  const [maxPriceInput, setMaxPriceInput] = useState('100000');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParam);

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const handlePriceChange = () => {
    const min = parseInt(minPriceInput) || 0;
    const max = parseInt(maxPriceInput) || 100000;
    setPriceRange([min, max]);
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    result = result.filter(p => {
      const price = p.discountPrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (sortOrder === 'low-to-high') {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortOrder === 'high-to-low') {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortOrder === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, selectedCategory, priceRange, sortOrder, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filter */}
        <aside className={`w-full md:w-64 space-y-8 shrink-0 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Filter size={18} className="text-primary" /> Category
            </h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`text-left px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${selectedCategory === 'all' ? 'bg-primary text-white font-bold' : 'bg-white hover:bg-gray-100 border border-gray-100'}`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`text-left px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${selectedCategory === cat.name ? 'bg-primary text-white font-bold' : 'bg-white hover:bg-gray-100 border border-gray-100'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Price Range</h3>
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Min Price (৳)</label>
                    <input 
                     type="number" 
                     value={minPriceInput}
                     onChange={e => {
                       setMinPriceInput(e.target.value);
                       const min = parseInt(e.target.value) || 0;
                       setPriceRange([min, priceRange[1]]);
                     }}
                     onBlur={handlePriceChange}
                     className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-sm outline-none focus:border-primary transition-colors font-mono"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Max Price (৳)</label>
                    <input 
                     type="number" 
                     value={maxPriceInput}
                     onChange={e => {
                       setMaxPriceInput(e.target.value);
                       const max = parseInt(e.target.value) || 100000;
                       setPriceRange([priceRange[0], max]);
                     }}
                     onBlur={handlePriceChange}
                     className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-sm outline-none focus:border-primary transition-colors font-mono"
                    />
                  </div>
               </div>

               {/* Dual Range Thumb Slider */}
               <div className="relative h-6 flex items-center select-none mt-2 dual-slider mb-2">
                 <style>{`
                   .dual-slider {
                     position: relative;
                     width: 100%;
                   }
                   .dual-slider input[type="range"] {
                     -webkit-appearance: none;
                     appearance: none;
                     position: absolute;
                     width: 100%;
                     height: 0;
                     background: transparent;
                     pointer-events: none;
                     outline: none;
                     margin: 0;
                     padding: 0;
                   }
                   .dual-slider input[type="range"]::-webkit-slider-thumb {
                     -webkit-appearance: none;
                     appearance: none;
                     width: 16px;
                     height: 16px;
                     border-radius: 50%;
                     background: var(--color-primary, #ef4444);
                     cursor: pointer;
                     pointer-events: auto;
                     border: 2px solid white;
                     box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                   }
                   .dual-slider input[type="range"]::-moz-range-thumb {
                     width: 16px;
                     height: 16px;
                     border-radius: 50%;
                     background: var(--color-primary, #ef4444);
                     cursor: pointer;
                     pointer-events: auto;
                     border: 2px solid white;
                     box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                   }
                 `}</style>
                 <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-lg pointer-events-none" />
                 <div 
                   className="absolute h-1 bg-primary rounded-lg pointer-events-none" 
                   style={{ 
                     left: `${Math.min(100, Math.max(0, (priceRange[0] / 100000) * 100))}%`, 
                     right: `${Math.min(100, Math.max(0, 100 - (priceRange[1] / 100000) * 100))}%` 
                   }}
                 />
                 <input 
                   type="range" 
                   min="0" 
                   max="100000" 
                   step="500"
                   value={priceRange[0]}
                   onChange={e => {
                     const val = Math.min(parseInt(e.target.value), priceRange[1] - 500);
                     setMinPriceInput(val.toString());
                     setPriceRange([val, priceRange[1]]);
                   }}
                   className="w-full accent-primary pointer-events-none appearance-none bg-transparent"
                   style={{ zIndex: priceRange[0] > 90000 ? 5 : 3 }}
                 />
                 <input 
                   type="range" 
                   min="0" 
                   max="100000" 
                   step="500"
                   value={priceRange[1]}
                   onChange={e => {
                     const val = Math.max(parseInt(e.target.value), priceRange[0] + 500);
                     setMaxPriceInput(val.toString());
                     setPriceRange([priceRange[0], val]);
                   }}
                   className="w-full accent-primary pointer-events-none appearance-none bg-transparent"
                   style={{ zIndex: 4 }}
                 />
               </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <h3 className="font-bold text-sm mb-2 font-black uppercase text-gray-400 text-xs">Delivery Zone</h3>
            <select className="w-full bg-white border-2 border-gray-100 focus:border-primary rounded-lg text-sm px-2 py-2 outline-none">
               <option>Select delivery zone...</option>
               {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
               <span className="text-sm text-gray-500 hidden sm:block">{filteredProducts.length} Products Found</span>
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-sm cursor-pointer">
                 <Filter size={16} /> Filter
               </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">Sort By:</span>
              <select 
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-primary outline-none cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
               <div className="text-6xl">🔍</div>
               <h2 className="text-xl font-bold">No Products Found</h2>
               <p className="text-gray-400 italic font-medium">Try adjusting your search or filters</p>
               <button onClick={() => {setSelectedCategory('all'); setPriceRange([0, 100000]); setMinPriceInput('0'); setMaxPriceInput('100000');}} className="text-primary font-bold underline cursor-pointer">Reset All Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
