import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { ProductCard } from '../components/product/ProductCard';
import { Filter, ChevronDown, Search as SearchIcon } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
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

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

export const ProductList: React.FC = () => {
  const { categories, fetchProductListings } = useAdmin();
  const { categoryName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();

  // ── Derived State from URL (Single Source of Truth) ───────────────────────
  const selectedCategories = useMemo(() => {
    const cat = searchParams.get('categories') || searchParams.get('category') || categoryName || 'all';
    return cat === 'all' ? [] : cat.split(',');
  }, [searchParams, categoryName]);

  const sortOrder = useMemo(() => {
    return getSortValue(searchParams.get('sort') || 'newest');
  }, [searchParams]);

  // ── Product / pagination state ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<PaginatedProducts>({
    items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0, minPrice: 0, maxPrice: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const boundsMin = listings.minPrice || 0;
  const boundsMax = listings.maxPrice || 0;

  const priceRange = useMemo<[number, number]>(() => {
    const urlMin = searchParams.get('minPrice');
    const urlMax = searchParams.get('maxPrice');
    const min = urlMin !== null ? Number(urlMin) : boundsMin;
    const max = urlMax !== null ? Number(urlMax) : boundsMax;
    const finalMin = clamp(Number.isFinite(min) ? min : boundsMin, boundsMin, boundsMax);
    const finalMax = clamp(Number.isFinite(max) ? max : boundsMax, boundsMin, boundsMax);
    return [Math.min(finalMin, finalMax), Math.max(finalMin, finalMax)];
  }, [searchParams, boundsMin, boundsMax]);

  // ── Local Input States ────────────────────────────────────────────────────
  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get('search') || '');
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isDraggingRef = useRef(false);

  // Sync local search input with URL when URL changes externally
  useEffect(() => {
    setLocalSearchTerm(searchParams.get('search') || '');
  }, [searchParamsString]);

  // Sync slider state with URL priceRange (when not dragging)
  useEffect(() => {
    if (isDraggingRef.current) return;
    setSliderRange(priceRange);
    setMinInput(String(priceRange[0]));
    setMaxInput(String(priceRange[1]));
  }, [priceRange]);

  // ── Helper to modify URL parameters ───────────────────────────────────────
  const updateURLParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // ── User Actions ──────────────────────────────────────────────────────────
  const toggleCategory = (catName: string) => {
    const next = selectedCategories.includes(catName)
      ? selectedCategories.filter(c => c !== catName)
      : [...selectedCategories, catName];
    updateURLParams({
      categories: next.length > 0 ? next.join(',') : null,
      category: null, // Clear deprecated singular param if present
    });
  };

  const commitPrice = useCallback((rawMin: number, rawMax: number) => {
    const finalMin = clamp(rawMin, boundsMin, boundsMax);
    const finalMax = clamp(rawMax, boundsMin, boundsMax);
    const safeMin = Math.min(finalMin, finalMax);
    const safeMax = Math.max(finalMin, finalMax);

    updateURLParams({
      minPrice: safeMin > boundsMin ? String(safeMin) : null,
      maxPrice: safeMax < boundsMax ? String(safeMax) : null,
    });
  }, [boundsMin, boundsMax, updateURLParams]);

  const handleInputCommit = () => {
    const min = parseFloat(minInput);
    const max = parseFloat(maxInput);
    commitPrice(
      Number.isFinite(min) ? min : priceRange[0],
      Number.isFinite(max) ? max : priceRange[1],
    );
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleInputCommit();
  };

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), sliderRange[1]);
    setSliderRange([val, sliderRange[1]]);
    setMinInput(String(val));
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), sliderRange[0]);
    setSliderRange([sliderRange[0], val]);
    setMaxInput(String(val));
  };

  const handleSliderRelease = () => {
    isDraggingRef.current = false;
    commitPrice(sliderRange[0], sliderRange[1]);
  };

  const resetFilters = () => {
    setLocalSearchTerm('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleSortChange = (newSort: string) => {
    updateURLParams({ sort: newSort === 'newest' ? null : newSort });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLParams({ search: localSearchTerm.trim() || null });
    setPage(1);
  };

  // ── Build API query params ────────────────────────────────────────────────
  const query = useMemo(() => {
    const params: Record<string, string> = {
      search: (searchParams.get('search') || '').trim(),
      categories: expandCategoryTree(categories, selectedCategories).join(','),
      sort: sortOrder,
    };
    const isPriceFiltered = priceRange[0] > boundsMin || priceRange[1] < boundsMax;
    if (isPriceFiltered && priceRange[1] > 0) {
      params.minPrice = String(priceRange[0]);
      params.maxPrice = String(priceRange[1]);
    }
    return params;
  }, [categories, selectedCategories, priceRange, sortOrder, searchParamsString, boundsMin, boundsMax]);

  // ── Fetch products ────────────────────────────────────────────────────────
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

  // ── Infinite scroll ───────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (isFetchingMore || listings.page >= listings.totalPages) return;
    setIsFetchingMore(true);
    setPage(prev => {
      const nextPage = prev + 1;
      fetchProductListings({ ...query, page: nextPage, limit: PAGE_SIZE })
        .then(response => setListings(current => ({ ...response, items: [...current.items, ...response.items] })))
        .catch(e => setError(e.message || 'Failed to load more products'))
        .finally(() => setIsFetchingMore(false));
      return nextPage;
    });
  }, [isFetchingMore, listings.page, listings.totalPages, query, fetchProductListings]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) loadMore();
    }, { rootMargin: '500px' });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Slider track visual percentages ──────────────────────────────────────
  const rangeDiff  = boundsMax - boundsMin;
  const hasPriceRange = rangeDiff > 0;
  const leftPct    = hasPriceRange ? ((sliderRange[0] - boundsMin) / rangeDiff) * 100 : 0;
  const rightPct   = hasPriceRange ? 100 - ((sliderRange[1] - boundsMin) / rangeDiff) * 100 : 0;
  const minThumbZ  = hasPriceRange && sliderRange[0] >= boundsMax - rangeDiff * 0.05 ? 5 : 3;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className={`w-full md:w-64 space-y-8 shrink-0 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Filter size={18} className="text-primary" /> Filters</h3>
            <div className="space-y-6">

              {/* Search */}
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3">Search</h4>
                <div className="relative">
                  <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <form onSubmit={handleSearchSubmit}>
                    <input
                      aria-label="Search products"
                      value={localSearchTerm}
                      onChange={e => setLocalSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </form>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3">Price Range</h4>
                <div className="space-y-4">

                  {/* Min / Max number inputs */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <label htmlFor="minPrice" className="text-[10px] font-black text-gray-400 uppercase">Min Price (৳)</label>
                      <input
                        id="minPrice"
                        type="number"
                        value={minInput}
                        placeholder={isLoading ? 'Loading…' : String(boundsMin)}
                        disabled={isLoading}
                        onChange={e => setMinInput(e.target.value)}
                        onBlur={handleInputCommit}
                        onKeyDown={handleInputKeyDown}
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-sm outline-none focus:border-primary font-mono disabled:cursor-not-allowed disabled:bg-gray-100"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label htmlFor="maxPrice" className="text-[10px] font-black text-gray-400 uppercase">Max Price (৳)</label>
                      <input
                        id="maxPrice"
                        type="number"
                        value={maxInput}
                        placeholder={isLoading ? 'Loading…' : String(boundsMax)}
                        disabled={isLoading}
                        onChange={e => setMaxInput(e.target.value)}
                        onBlur={handleInputCommit}
                        onKeyDown={handleInputKeyDown}
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-sm outline-none focus:border-primary font-mono disabled:cursor-not-allowed disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Dual-thumb range slider */}
                  <div className="relative h-6 flex items-center select-none mt-2 dual-slider mb-2">
                    <style>{`
                      .dual-slider{position:relative;width:100%}
                      .dual-slider input[type=range]{-webkit-appearance:none;appearance:none;position:absolute;width:100%;height:0;background:transparent;pointer-events:none;outline:none;margin:0;padding:0}
                      .dual-slider input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:var(--color-primary,#ef4444);cursor:pointer;pointer-events:auto;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}
                      .dual-slider input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--color-primary,#ef4444);cursor:pointer;pointer-events:auto;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3)}
                    `}</style>
                    {/* Track background */}
                    <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-lg" />
                    {/* Active track fill (between the two thumbs) */}
                    <div
                      className="absolute h-1 bg-primary rounded-lg"
                      style={{
                        left:  `${clamp(leftPct,  0, 100)}%`,
                        right: `${clamp(rightPct, 0, 100)}%`,
                      }}
                    />
                    {/* Min thumb */}
                    <input
                      type="range"
                      min={boundsMin}
                      max={boundsMax}
                      step={1}
                      value={sliderRange[0]}
                      disabled={isLoading || !hasPriceRange}
                      onPointerDown={() => { isDraggingRef.current = true; }}
                      onChange={handleMinSliderChange}
                      onPointerUp={handleSliderRelease}
                      onTouchEnd={handleSliderRelease}
                      style={{ zIndex: minThumbZ }}
                    />
                    {/* Max thumb */}
                    <input
                      type="range"
                      min={boundsMin}
                      max={boundsMax}
                      step={1}
                      value={sliderRange[1]}
                      disabled={isLoading || !hasPriceRange}
                      onPointerDown={() => { isDraggingRef.current = true; }}
                      onChange={handleMaxSliderChange}
                      onPointerUp={handleSliderRelease}
                      onTouchEnd={handleSliderRelease}
                      style={{ zIndex: 4 }}
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3 mt-4">Categories</h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                    <input type="checkbox" checked={selectedCategories.length === 0} onChange={() => resetFilters()} className="w-4 h-4 accent-primary rounded cursor-pointer" />
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
              <span className="text-sm text-gray-500 hidden sm:block">{isLoading ? 'Loading...' : `${listings.total} Products Found`}</span>
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-sm cursor-pointer"><Filter size={16} /> Filter</button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">Sort By:</span>
              <select value={sortOrder} onChange={e => handleSortChange(e.target.value)} className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold focus:border-primary outline-none cursor-pointer">
                <option value="newest">Newest</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-8 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <h2 className="text-xl font-bold">Could not load products</h2>
              <p className="text-gray-400 italic">{error}</p>
            </div>
          ) : listings.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {listings.items.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <div ref={loadMoreRef} className="py-8 text-center text-sm text-gray-500">
                {isFetchingMore ? 'Loading more products…' : listings.page < listings.totalPages ? 'Scroll to load more' : 'End of products'}
              </div>
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="text-6xl">🔍</div>
              <h2 className="text-xl font-bold">No Products Found</h2>
              <p className="text-gray-400 italic font-medium">Try adjusting your search or filters</p>
              <button onClick={resetFilters} className="text-primary font-bold underline cursor-pointer">Reset All Filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
