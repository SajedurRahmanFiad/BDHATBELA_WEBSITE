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

/** Clamp a value to [lo, hi]. */
const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value));

export const ProductList: React.FC = () => {
  const { categories, fetchProductListings } = useAdmin();
  const { categoryName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();

  // ── Filter state ──────────────────────────────────────────────────────────
  const searchParam = searchParams.get('search') || '';
  const initialCat = searchParams.get('categories') || searchParams.get('category') || categoryName || 'all';
  const initialCategories = initialCat === 'all' ? [] : initialCat.split(',');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [sortOrder, setSortOrder] = useState<string>(getSortValue(searchParams.get('sort') || 'newest'));
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ── Price range state ─────────────────────────────────────────────────────
  // `priceRange`  – committed values that drive the API query.
  // `sliderRange` – in-progress values while the user drags (no API call yet).
  // `minInput` / `maxInput` – raw text shown in the number inputs.
  const [priceRange, setPriceRange]   = useState<[number, number]>([0, 0]);
  const [sliderRange, setSliderRange] = useState<[number, number]>([0, 0]);
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  // Set to true once we have initialised price from the first API response.
  const priceInitialisedRef = useRef(false);
  // Set to true while the user is actively dragging a thumb.
  const isDraggingRef = useRef(false);

  // ── Product / pagination state ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState<PaginatedProducts>({
    items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0, minPrice: 0, maxPrice: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // ── Sync search term from URL ─────────────────────────────────────────────
  useEffect(() => {
    setSearchTerm(searchParam);
  }, [searchParam]);

  // Sync selected categories from URL — only fires when the URL param actually changes,
  // so clicking "All Products" (/products, no ?categories param) correctly clears the state.
  useEffect(() => {
    const cat = searchParams.get('categories') || searchParams.get('category') || categoryName || 'all';
    const next = cat === 'all' ? [] : cat.split(',');
    setSelectedCategories(prev => {
      // Avoid re-render if the value is already the same.
      if (prev.length === next.length && prev.every((v, i) => v === next[i])) return prev;
      return next;
    });
  }, [searchParams.get('categories'), searchParams.get('category'), categoryName]);

  // ── Initialise price bounds once, after the first successful fetch ────────
  // We read URL price params (if any) and clamp them to the actual product
  // min/max returned by the API.  The ref ensures this only runs once per
  // page-load so subsequent re-fetches never reset a user's slider position.
  useEffect(() => {
    if (isLoading || priceInitialisedRef.current) return;
    if (listings.maxPrice === 0) return; // bounds not ready

    priceInitialisedRef.current = true;

    const boundsMin = listings.minPrice;
    const boundsMax = listings.maxPrice;

    const urlMin = searchParams.get('minPrice');
    const urlMax = searchParams.get('maxPrice');
    const desiredMin = urlMin !== null ? Number(urlMin) : boundsMin;
    const desiredMax = urlMax !== null ? Number(urlMax) : boundsMax;

    const finalMin = clamp(Number.isFinite(desiredMin) ? desiredMin : boundsMin, boundsMin, boundsMax);
    const finalMax = clamp(Number.isFinite(desiredMax) ? desiredMax : boundsMax, boundsMin, boundsMax);
    const safeMin  = Math.min(finalMin, finalMax);
    const safeMax  = Math.max(finalMin, finalMax);

    setPriceRange([safeMin, safeMax]);
    setSliderRange([safeMin, safeMax]);
    setMinInput(String(safeMin));
    setMaxInput(String(safeMax));
  }, [isLoading, listings.minPrice, listings.maxPrice]);

  // ── Single commit function – all price-change paths go through this ───────
  const commitPrice = useCallback((rawMin: number, rawMax: number) => {
    const boundsMin = listings.minPrice || 0;
    const boundsMax = listings.maxPrice || 100000;
    const safeMin  = Number.isFinite(rawMin) ? rawMin : boundsMin;
    const safeMax  = Number.isFinite(rawMax) ? rawMax : boundsMax;
    const ordered: [number, number] = [Math.min(safeMin, safeMax), Math.max(safeMin, safeMax)];
    const final: [number, number]   = [
      clamp(ordered[0], boundsMin, boundsMax),
      clamp(ordered[1], boundsMin, boundsMax),
    ];
    setPriceRange(final);
    setSliderRange(final);
    setMinInput(String(final[0]));
    setMaxInput(String(final[1]));
  }, [listings.minPrice, listings.maxPrice]);

  // ── Text input handlers ───────────────────────────────────────────────────
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

  // ── Slider handlers ───────────────────────────────────────────────────────
  // While dragging: update only sliderRange + text inputs (no API call yet).
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

  // On pointer-up / touch-end: commit slider position → triggers API query.
  const handleSliderRelease = () => {
    isDraggingRef.current = false;
    commitPrice(sliderRange[0], sliderRange[1]);
  };

  // ── Reset all filters ─────────────────────────────────────────────────────
  const resetFilters = () => {
    setSelectedCategories([]);
    setSearchTerm('');
    commitPrice(listings.minPrice || 0, listings.maxPrice || 100000);
  };

  // ── Build API query params ────────────────────────────────────────────────
  const boundsMin = listings.minPrice || 0;
  const boundsMax = listings.maxPrice || 0;
  const isPriceFiltered = priceRange[0] > boundsMin || priceRange[1] < boundsMax;

  const query = useMemo(() => {
    const params: Record<string, string> = {
      search: searchTerm.trim(),
      categories: expandCategoryTree(categories, selectedCategories).join(','),
      sort: sortOrder,
    };
    // Only include price params when the user has narrowed the range.
    if (isPriceFiltered && priceRange[1] > 0) {
      params.minPrice = String(priceRange[0]);
      params.maxPrice = String(priceRange[1]);
    }
    return params;
  }, [categories, selectedCategories, priceRange, sortOrder, searchTerm, isPriceFiltered]);

  // ── Sync URL search params ────────────────────────────────────────────────
  // Guard: don't push a URL update that merely re-adds a category that was
  // explicitly cleared by the user navigating to /products.
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (isPriceFiltered && priceRange[1] > 0) {
      params.set('minPrice', String(priceRange[0]));
      params.set('maxPrice', String(priceRange[1]));
    }
    if (sortOrder !== 'newest') params.set('sort', sortOrder);
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    const next = params.toString();
    // Only update the URL if it would actually change — prevents the
    // infinite loop where each navigation re-triggers this effect.
    if (next !== searchParamsString) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedCategories, priceRange, sortOrder, searchTerm, isPriceFiltered, searchParamsString]);

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

  // ── Category helpers ──────────────────────────────────────────────────────
  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev => prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]);
  };

  // ── Slider track visual percentages ──────────────────────────────────────
  const rangeDiff  = boundsMax - boundsMin;
  const hasPriceRange = rangeDiff > 0;
  const leftPct    = hasPriceRange ? ((sliderRange[0] - boundsMin) / rangeDiff) * 100 : 0;
  const rightPct   = hasPriceRange ? 100 - ((sliderRange[1] - boundsMin) / rangeDiff) * 100 : 0;
  // Elevate min thumb z-index when near the max so it stays draggable.
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
                  <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setPage(1)}
                    placeholder="Search products..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-bold text-sm text-gray-800 mb-3">Price Range</h4>
                <div className="space-y-4">

                  {/* Min / Max number inputs */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Min Price (৳)</label>
                      <input
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
                      <label className="text-[10px] font-black text-gray-400 uppercase">Max Price (৳)</label>
                      <input
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
              <span className="text-sm text-gray-500 hidden sm:block">{isLoading ? 'Loading...' : `${listings.total} Products Found`}</span>
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
