import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../AdminContext';
import { ProductCard } from '../components/product/ProductCard';
import { Filter, SlidersHorizontal, ChevronDown, LayoutGrid, List, Search as SearchIcon } from 'lucide-react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';

export const ProductList: React.FC = () => {
  const { products, categories } = useAdmin();
  const { categoryName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const searchParam = searchParams.get('search') || '';
  const initialCat = searchParams.get('categories') || searchParams.get('category') || categoryName || 'all';
  const initialCategories = initialCat === 'all' ? [] : initialCat.split(',');

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  
  // Calculate dynamic min/max product prices
  const { minProductPrice, maxProductPrice } = useMemo(() => {
    if (!products || products.length === 0) {
      return { minProductPrice: 0, maxProductPrice: 100000 };
    }
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    products.forEach(p => {
      const price = p.discountPrice || p.price;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    });
    if (minPrice === Infinity) minPrice = 0;
    if (maxPrice === -Infinity) maxPrice = 100000;
    if (minPrice === maxPrice) {
      maxPrice = minPrice + 100;
    }
    return { minProductPrice: minPrice, maxProductPrice: maxPrice };
  }, [products]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minPriceInput, setMinPriceInput] = useState('0');
  const [maxPriceInput, setMaxPriceInput] = useState('100000');
  const [hasInitializedPrice, setHasInitializedPrice] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>(searchParams.get('sort') || 'newest');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  useEffect(() => {
    const cat = searchParams.get('categories') || searchParams.get('category') || categoryName || 'all';
    setSelectedCategories(cat === 'all' ? [] : cat.split(','));
  }, [searchParams.get('categories'), searchParams.get('category'), categoryName]);

  // Sync initial price range once products are loaded
  useEffect(() => {
    if (products.length > 0 && !hasInitializedPrice) {
      const urlMin = searchParams.get('minPrice');
      const urlMax = searchParams.get('maxPrice');
      
      const min = urlMin ? parseInt(urlMin) : minProductPrice;
      const max = urlMax ? parseInt(urlMax) : maxProductPrice;
      
      setPriceRange([min, max]);
      setMinPriceInput(min.toString());
      setMaxPriceInput(max.toString());
      setHasInitializedPrice(true);
    }
  }, [products, minProductPrice, maxProductPrice, searchParams, hasInitializedPrice]);

  useEffect(() => {
    if (!hasInitializedPrice) return;

    const params = new URLSearchParams(searchParams);
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
      params.delete('category');
    } else {
      params.delete('categories');
      params.delete('category');
    }
    
    if (priceRange[0] > minProductPrice) params.set('minPrice', priceRange[0].toString());
    else params.delete('minPrice');
    
    if (priceRange[1] < maxProductPrice) params.set('maxPrice', priceRange[1].toString());
    else params.delete('maxPrice');
    
    if (sortOrder !== 'newest') params.set('sort', sortOrder);
    else params.delete('sort');
    
    setSearchParams(params, { replace: true });
  }, [selectedCategories, priceRange, sortOrder, hasInitializedPrice, minProductPrice, maxProductPrice]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const handlePriceChange = () => {
    const min = parseInt(minPriceInput) || minProductPrice;
    const max = parseInt(maxPriceInput) || maxProductPrice;
    const clampedMin = Math.max(minProductPrice, Math.min(min, max));
    const clampedMax = Math.min(maxProductPrice, Math.max(max, min));
    setPriceRange([clampedMin, clampedMax]);
    setMinPriceInput(clampedMin.toString());
    setMaxPriceInput(clampedMax.toString());
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategories.length > 0) {
      // Include child categories if a parent category is selected
      const targetCategories = [...selectedCategories];
      selectedCategories.forEach(catName => {
        const parentCat = categories.find(c => c.name === catName);
        if (parentCat) {
          const subs = categories.filter(c => c.parentId === parentCat.id);
          subs.forEach(sub => {
            if (!targetCategories.includes(sub.name)) {
              targetCategories.push(sub.name);
            }
          });
        }
      });
      result = result.filter(p => targetCategories.includes(p.category));
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
  }, [products, selectedCategories, priceRange, sortOrder, searchTerm]);

  const rangeDiff = maxProductPrice - minProductPrice;
  const leftPct = rangeDiff > 0 ? ((priceRange[0] - minProductPrice) / rangeDiff) * 100 : 0;
  const rightPct = rangeDiff > 0 ? 100 - ((priceRange[1] - minProductPrice) / rangeDiff) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filter */}
        {/* Sidebar Filter */}
        <aside className={`w-full md:w-64 space-y-8 shrink-0 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Filter size={18} className="text-primary" /> Filters
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3">Price Range</h4>
                <div className="space-y-4">
                   <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Min Price (৳)</label>
                        <input 
                         type="number" 
                         value={minPriceInput}
                         onChange={e => {
                           setMinPriceInput(e.target.value);
                           const min = parseInt(e.target.value) || minProductPrice;
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
                           const max = parseInt(e.target.value) || maxProductPrice;
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
                         left: `${Math.min(100, Math.max(0, leftPct))}%`, 
                         right: `${Math.min(100, Math.max(0, rightPct))}%` 
                       }}
                     />
                     <input 
                       type="range" 
                       min={minProductPrice} 
                       max={maxProductPrice} 
                       step="1"
                       value={priceRange[0]}
                       onChange={e => {
                         const val = Math.min(parseInt(e.target.value), priceRange[1] - 1);
                         setMinPriceInput(val.toString());
                         setPriceRange([val, priceRange[1]]);
                       }}
                       className="w-full accent-primary pointer-events-none appearance-none bg-transparent"
                       style={{ zIndex: priceRange[0] > (maxProductPrice - rangeDiff * 0.1) ? 5 : 3 }}
                     />
                     <input 
                       type="range" 
                       min={minProductPrice} 
                       max={maxProductPrice} 
                       step="1"
                       value={priceRange[1]}
                       onChange={e => {
                         const val = Math.max(parseInt(e.target.value), priceRange[0] + 1);
                         setMaxPriceInput(val.toString());
                         setPriceRange([priceRange[0], val]);
                       }}
                       className="w-full accent-primary pointer-events-none appearance-none bg-transparent"
                       style={{ zIndex: 4 }}
                     />
                   </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3 mt-4">Categories</h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.length === 0}
                      onChange={() => setSelectedCategories([])}
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                    <span className={selectedCategories.length === 0 ? 'font-bold text-primary' : 'text-gray-700'}>All Categories</span>
                  </label>

                  {categories.filter(c => !c.parentId).map(cat => {
                    const subs = categories.filter(c => c.parentId === cat.id);
                    // By default, if not explicitly collapsed (false), parent categories are expanded
                    const isExpanded = expandedParents[cat.id] !== false;
                    return (
                      <div key={cat.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between group">
                          {/* Standalone Checkbox */}
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={selectedCategories.includes(cat.name)}
                              onChange={() => toggleCategory(cat.name)}
                              className="w-4 h-4 accent-primary rounded cursor-pointer"
                            />
                          </div>

                          {/* Category Name - Clickable to expand/close subcategories */}
                          <button
                            type="button"
                            onClick={() => setExpandedParents(prev => ({ ...prev, [cat.id]: prev[cat.id] === false ? true : false }))}
                            className={`flex-1 text-left pl-2 py-1 text-sm cursor-pointer select-none font-medium ${selectedCategories.includes(cat.name) ? 'font-bold text-primary' : 'text-gray-700 hover:text-primary transition-colors'}`}
                          >
                            {cat.name}
                          </button>

                          {/* Chevron Icon button */}
                          {subs.length > 0 && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setExpandedParents(prev => ({ ...prev, [cat.id]: prev[cat.id] === false ? true : false }));
                              }}
                              className="p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                            >
                              <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                        {subs.length > 0 && isExpanded && (
                          <div className="flex flex-col gap-2 pl-6 mt-1 border-l-2 border-gray-100 ml-2">
                            {subs.map(sub => (
                              <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer group">
                                <input 
                                  type="checkbox" 
                                  checked={selectedCategories.includes(sub.name)}
                                  onChange={() => toggleCategory(sub.name)}
                                  className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
                                />
                                <span className={selectedCategories.includes(sub.name) ? 'font-bold text-primary text-xs' : 'text-gray-600 text-xs group-hover:text-primary transition-colors'}>
                                  {sub.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Zone section removed */}
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
               <button onClick={() => {
                 setSelectedCategories([]); 
                 setPriceRange([minProductPrice, maxProductPrice]); 
                 setMinPriceInput(minProductPrice.toString()); 
                 setMaxPriceInput(maxProductPrice.toString());
               }} className="text-primary font-bold underline cursor-pointer">Reset All Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
