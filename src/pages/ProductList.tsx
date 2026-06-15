import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { ProductCard } from '../components/product/ProductCard';
import { Filter, ChevronDown, Search as SearchIcon } from 'lucide-react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { PaginatedProducts, ProductListing } from '../types';

const PAGE_SIZE = 24;

const expandCategoryTree = (categories: { id: string; name: string; parentId?: string | null }[], selected: string[]) => {
  const expanded = new Set(selected);
  selected.forEach(name => {
    const parent = categories.find(c => c.name === name);
    if (!parent) return;
    categories.filter(c => c.parentId === parent.id).forEach(child => expanded.add(child.name));
  });
  return [...expanded];
};

const getSortValue = (value: string) => {
  if (['newest', 'low-to-high', 'high-to-low', 'rating'].includes(value)) return value;
  return 'newest';
};

export const ProductList: React.FC = () => {
  const { categories, fetchProductListings } = useAdmin();
  const { categoryName } = useParams();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const initialCat = searchParams.get('categories') || searchParams.get('category') || categoryName || 'all';
  const initialCategories = initialCat === 'all' ? [] : initialCat.split(',');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minPriceInput, setMinPriceInput] = useState('0');
  const [maxPriceInput, setMaxPriceInput] = useState('100000');
  const [sortOrder, setSortOrder] = useState<string>(getSortValue(searchParams.get('sort') || 'newest'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<PaginatedProducts>({ items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0, minPrice: 0, maxPrice: 100000 });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  useEffect(() => {
    const cat = searchParams.get('categories') || searchParams.get('category') || categoryName || 'all';
    setSelectedCategories(cat === 'all' ? [] : cat.split(','));
  }, [searchParams.get('categories'), searchParams.get('category'), categoryName]);

  useEffect(() => {
    if (listings.minPrice || listings.maxPrice) {
      const urlMin = searchParams.get('minPrice');
      const urlMax = searchParams.get('maxPrice');
      const min = urlMin ? Number(urlMin) : listings.minPrice;
      const max = urlMax ? Number(urlMax) : listings.maxPrice;
      setPriceRange([Math.max(min, listings.minPrice), Math.min(max, listings.maxPrice)]);
      setMinPriceInput(String(Math.max(min, listings.minPrice)));
      setMaxPriceInput(String(Math.min(max, listings.maxPrice)));
    }
  }, [listings.minPrice, listings.maxPrice, searchParams]);

  const query = useMemo(() => ({
    search: searchTerm.trim(),
    categories: expandCategoryTree(categories, selectedCategories).join(','),
    minPrice: String(priceRange[0]),
    maxPrice: String(priceRange[1]),
    sort: sortOrder
  }), [categories, selectedCategories, priceRange, sortOrder, searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (priceRange[0] > (listings.minPrice || 0)) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < (listings.maxPrice || 100000)) params.set('maxPrice', priceRange[1].toString());
    if (sortOrder !== 'newest') params.set('sort', sortOrder);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    setSearchParams(params, { replace: true });
  }, [selectedCategories, priceRange, sortOrder, searchTerm, setSearchParams, listings.minPrice, listings.maxPrice]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchProductListings({ ...query, page: 1, limit: PAGE_SIZE });
        if (cancelled) return;
        setListings(response);
        setPage(response.page);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load products');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [query, fetchProductListings]);

  const loadMore = () => {
    if (isFetchingMore || listings.page >= listings.totalPages) return;
    setPage(prev => {
      const nextPage = prev + 1;
      fetchProductListings({ ...query, page: nextPage, limit: PAGE_SIZE })
        .then(response => setListings(current => ({ ...response, items: [...current.items, ...response.items] })))
        .catch(e => setError(e.message || 'Failed to load more products'));
      return nextPage;
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '500px' });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev => prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]);
  };

  const handlePriceChange = () => {
    const min = Number(minPriceInput) || listings.minPrice;
    const max = Number(maxPriceInput) || listings.maxPrice;
    const clampedMin = Math.max(listings.minPrice, Math.min(min, max));
    const clampedMax = Math.min(listings.maxPrice, Math.max(max, min));
    setPriceRange([clampedMin, clampedMax]);
    setMinPriceInput(clampedMin.toString());
    setMaxPriceInput(clampedMax.toString());
  };

  const filteredProducts: ProductListing[] = listings.items;
  const rangeDiff = (listings.maxPrice || 100000) - (listings.minPrice || 0);
  const leftPct = rangeDiff > 0 ? ((priceRange[0] - (listings.minPrice || 0)) / rangeDiff) * 100 : 0;
  const rightPct = rangeDiff > 0 ? 100 - ((priceRange[1] - (listings.minPrice || 0)) / rangeDiff) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className={`w-full md:w-64 space-y-8 shrink-0 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Filter size={18} className="text-primary" /> Filters</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3">Search</h4>
                <div className="relative">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setPage(1)}
                    placeholder="Search products..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3">Price Range</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Min Price (৳)</label>
                      <input type="number" value={minPriceInput} onChange={e => { setMinPriceInput(e.target.value); setPriceRange([Number(e.target.value) || listings.minPrice, priceRange[1]]); }} onBlur={handlePriceChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-sm outline-none focus:border-primary font-mono" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Max Price (৳)</label>
                      <input type="number" value={maxPriceInput} onChange={e => { setMaxPriceInput(e.target.value); setPriceRange([priceRange[0], Number(e.target.value) || listings.maxPrice]); }} onBlur={handlePriceChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-sm outline-none focus:border-primary font-mono" />
                    </div>
                  </div>
                  <div className="relative h-6 flex items-center select-none mt-2 dual-slider mb-2">
                    <style>{`
                      .dual-slider{position:relative;width:100%}.dual-slider input[type=range]{-webkit-appearance:none;appearance:none;position:absolute;width:100%;height:0;background:transparent;pointer-events:none;outline:none;margin:0;padding:0}.dual-slider input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--color-primary,#ef4444);cursor:pointer;pointer-events:auto;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}.dual-slider input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--color-primary,#ef4444);cursor:pointer;pointer-events:auto;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}
                    `}</style>
                    <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-lg pointer-events-none" />
                    <div className="absolute h-1 bg-primary rounded-lg pointer-events-none" style={{ left: `${Math.min(100, Math.max(0, leftPct))}%`, right: `${Math.min(100, Math.max(0, rightPct))}%` }} />
                    <input type="range" min={listings.minPrice || 0} max={listings.maxPrice || 100000} step="1" value={priceRange[0]} onChange={e => { const val = Math.min(Number(e.target.value), priceRange[1] - 1); setMinPriceInput(String(val)); setPriceRange([val, priceRange[1]]); }} className="w-full accent-primary pointer-events-none appearance-none bg-transparent" style={{ zIndex: priceRange[0] > ((listings.maxPrice || 100000) - rangeDiff * 0.1) ? 5 : 3 }} />
                    <input type="range" min={listings.minPrice || 0} max={listings.maxPrice || 100000} step="1" value={priceRange[1]} onChange={e => { const val = Math.max(Number(e.target.value), priceRange[0] + 1); setMaxPriceInput(String(val)); setPriceRange([priceRange[0], val]); }} className="w-full accent-primary pointer-events-none appearance-none bg-transparent" style={{ zIndex: 4 }} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3 mt-4">Categories</h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                    <input type="checkbox" checked={selectedCategories.length === 0} onChange={() => setSelectedCategories([])} className="w-4 h-4 accent-primary rounded cursor-pointer" />
                    <span className={selectedCategories.length === 0 ? 'font-bold text-primary' : 'text-gray-700'}>All Categories</span>
                  </label>
                  {categories.filter(c => !c.parentId).map(cat => {
                    const subs = categories.filter(c => c.parentId === cat.id);
                    const isExpanded = expandedParents[cat.id] !== false;
                    return (
                      <div key={cat.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between group">
                          <div className="flex items-center">
                            <input type="checkbox" checked={selectedCategories.includes(cat.name)} onChange={() => toggleCategory(cat.name)} className="w-4 h-4 accent-primary rounded cursor-pointer" />
                          </div>
                          <button type="button" onClick={() => setExpandedParents(prev => ({ ...prev, [cat.id]: prev[cat.id] === false ? true : false }))} className={`flex-1 text-left pl-2 py-1 text-sm cursor-pointer select-none font-medium ${selectedCategories.includes(cat.name) ? 'font-bold text-primary' : 'text-gray-700 hover:text-primary transition-colors'}`}>{cat.name}</button>
                          {subs.length > 0 && <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setExpandedParents(prev => ({ ...prev, [cat.id]: prev[cat.id] === false ? true : false })); }} className="p-2 text-gray-400 hover:text-primary transition-colors cursor-pointer"><ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} /></button>}
                        </div>
                        {subs.length > 0 && isExpanded && <div className="flex flex-col gap-2 pl-6 mt-1 border-l-2 border-gray-100 ml-2">{subs.map(sub => <label key={sub.id} className="flex items-center gap-2 text-sm cursor-pointer group"><input type="checkbox" checked={selectedCategories.includes(sub.name)} onChange={() => toggleCategory(sub.name)} className="w-3.5 h-3.5 accent-primary rounded cursor-pointer" /><span className={selectedCategories.includes(sub.name) ? 'font-bold text-primary text-xs' : 'text-gray-600 text-xs group-hover:text-primary transition-colors'}>{sub.name}</span></label>)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">{listings.total} Products Found</span>
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-sm cursor-pointer"><Filter size={16} /> Filter</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">Sort By:</span>
              <select value={sortOrder} onChange={e => setSortOrder(getSortValue(e.target.value))} className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-primary outline-none cursor-pointer">
                <option value="newest">Newest</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"><div className="aspect-square bg-gray-100 rounded-xl mb-3" /><div className="h-4 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-8 bg-gray-100 rounded w-1/2" /></div>)}
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4"><div className="text-6xl">⚠️</div><h2 className="text-xl font-bold">Could not load products</h2><p className="text-gray-400 italic">{error}</p></div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <div ref={loadMoreRef} className="py-8 text-center text-sm text-gray-500">{isFetchingMore ? 'Loading more products...' : listings.page < listings.totalPages ? 'Scroll to load more' : 'End of products'}</div>
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="text-6xl">🔍</div>
              <h2 className="text-xl font-bold">No Products Found</h2>
              <p className="text-gray-400 italic font-medium">Try adjusting your search or filters</p>
              <button onClick={() => { setSelectedCategories([]); setPriceRange([listings.minPrice || 0, listings.maxPrice || 100000]); setMinPriceInput(String(listings.minPrice || 0)); setMaxPriceInput(String(listings.maxPrice || 100000)); setSearchTerm(''); }} className="text-primary font-bold underline cursor-pointer">Reset All Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
