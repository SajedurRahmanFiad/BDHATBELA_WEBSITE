import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Category, Banner, StoreSettings, Order, OrderStatus, Staff, Review, PaginatedProducts } from './types';
import { API_BASE_URL } from './constants';

interface AdminContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: StoreSettings | null;
  orders: Order[];
  staff: Staff[];
  addProduct: (product: Product) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  loadProducts: () => Promise<Product[]>;
  fetchProduct: (idOrSku: string) => Promise<Product | null>;
  fetchProductListings: (params?: Record<string, string | number | boolean | undefined>) => Promise<PaginatedProducts>;
  searchProducts: (query: string) => Promise<PaginatedProducts['items']>;
  deleteProduct: (id: string) => Promise<void>;
  updateSettings: (settings: StoreSettings) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  loadOrders: () => Promise<Order[]>;
  deleteOrder: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<{ success: boolean; error?: string; order?: Order }>;
  updateBanners: (banners: Banner[]) => Promise<void>;
  addBanner: (banner: Banner) => Promise<void>;
  updateBanner: (banner: Banner) => Promise<void>;
  deleteBanner: (id: string) => Promise<void>;
  addStaff: (staff: Staff) => void;
  removeStaff: (id: string) => void;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addReview: (productId: string, review: Review) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const parseJsonText = (text: string, url: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.trim().slice(0, 400);
    throw new Error(`${url} returned invalid JSON${preview ? `: ${preview}` : ''}`);
  }
};

const readJsonResponse = async (res: Response, url: string) => {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${url} returned ${res.status} ${res.statusText}${text.trim() ? `: ${text.trim().slice(0, 400)}` : ''}`);
  }
  if (text.trim().startsWith('<')) {
    throw new Error(`${url} returned HTML instead of JSON: ${text.trim().slice(0, 400)}`);
  }
  return parseJsonText(text, url);
};

const getCachedAdminData = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const setCachedAdminData = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage failures
  }
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => getCachedAdminData<Category[]>('admin_categories', []));
  const [banners, setBanners] = useState<Banner[]>(() => getCachedAdminData<Banner[]>('admin_banners', []));
  const [settings, setSettings] = useState<StoreSettings | null>(() => getCachedAdminData<StoreSettings | null>('admin_settings', null));
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const setRes = await fetch(`${API_BASE_URL}/settings.php`);
        const freshSettings = await readJsonResponse(setRes, `${API_BASE_URL}/settings.php`);
        setSettings(freshSettings);
        setCachedAdminData('admin_settings', freshSettings);
      } catch (e) {
        console.error('Failed to fetch settings', e);
      }
    };

    const fetchOptionalData = async () => {
      try {
        const [catRes, banRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories.php`),
          fetch(`${API_BASE_URL}/banners.php`)
        ]);

        const freshCategories = await readJsonResponse(catRes, `${API_BASE_URL}/categories.php`);
        const freshBanners = await readJsonResponse(banRes, `${API_BASE_URL}/banners.php`);

        setCategories(freshCategories);
        setCachedAdminData('admin_categories', freshCategories);
        setBanners(freshBanners);
        setCachedAdminData('admin_banners', freshBanners);
      } catch (e) {
        console.error('Failed to fetch categories or banners', e);
      }
    };

    fetchSettings();

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(fetchOptionalData, { timeout: 2000 });
      } else {
        globalThis.setTimeout(fetchOptionalData, 100);
      }
    }
  }, []);

  const addProduct = useCallback(async (p: Product): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const text = await res.text();
      if (res.ok) {
        const savedProduct = JSON.parse(text);
        setProducts(prev => [savedProduct, ...prev]);
        return true;
      }
      let err = {} as any;
      try {
        err = JSON.parse(text);
      } catch {
        console.error('Failed to parse product save error response:', text);
      }
      alert(err.error || `Failed to save product (HTTP ${res.status}). Please try again.`);
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const updateProduct = useCallback(async (p: Product): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const text = await res.text();
      if (res.ok) {
        const savedProduct = JSON.parse(text);
        setProducts(prev => prev.map(item => item.id === p.id ? savedProduct : item));
        return true;
      }
      let err = {} as any;
      try {
        err = JSON.parse(text);
      } catch {
        console.error('Failed to parse product update error response:', text);
      }
      alert(err.error || `Failed to update product (HTTP ${res.status}). Please try again.`);
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setProducts(prev => prev.filter(item => item.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  const loadProducts = useCallback(async (): Promise<Product[]> => {
    const loaded = await readJsonResponse(await fetch(`${API_BASE_URL}/products.php`), `${API_BASE_URL}/products.php`);
    const products = Array.isArray(loaded) ? loaded : [];
    setProducts(products);
    return products;
  }, []);

  const fetchProduct = useCallback(async (idOrSku: string): Promise<Product | null> => {
    try {
      return await readJsonResponse(await fetch(`${API_BASE_URL}/products.php?id=${encodeURIComponent(idOrSku)}`), `${API_BASE_URL}/products.php`);
    } catch {
      return null;
    }
  }, []);

  const fetchProductListings = useCallback(async (params: Record<string, string | number | boolean | undefined> = {}): Promise<PaginatedProducts> => {
    const query = new URLSearchParams();
    query.set('list', '1');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });
    return await readJsonResponse(
      await fetch(`${API_BASE_URL}/products.php?${query.toString()}`),
      `${API_BASE_URL}/products.php`
    );
  }, []);

  const searchProducts = useCallback(async (query: string): Promise<PaginatedProducts['items']> => {
    if (!query.trim()) return [];
    const result = await fetchProductListings({ search: query.trim(), limit: 5, page: 1 });
    return result.items;
  }, [fetchProductListings]);

  const updateSettings = useCallback(async (s: StoreSettings) => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      if (res.ok) setSettings(await res.json());
    } catch (e) { console.error(e); }
  }, []);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.id === id ? updated : o));
      }
    } catch (e) { console.error(e); }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  const loadOrders = useCallback(async (): Promise<Order[]> => {
    const loaded = await readJsonResponse(await fetch(`${API_BASE_URL}/orders.php`), `${API_BASE_URL}/orders.php`);
    const orders = Array.isArray(loaded) ? loaded : [];
    setOrders(orders);
    return orders;
  }, []);

  const addOrder = useCallback(async (o: Order) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(o)
      });
      if (res.ok) {
        const savedOrder = await res.json();
        setOrders(prev => [savedOrder, ...prev]);
        return { success: true, order: savedOrder };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to place order.' };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || 'Network error.' };
    }
  }, []);

  const updateBanners = useCallback(async (b: Banner[]) => {
    setBanners(b);
  }, []);

  const addBanner = useCallback(async (b: Banner) => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      if (res.ok) {
        const saved = await res.json();
        setBanners(prev => [saved, ...prev]);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to add banner. The image might be too large.');
      }
    } catch (e) { console.error(e); }
  }, []);

  const updateBanner = useCallback(async (b: Banner) => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      if (res.ok) {
        const saved = await res.json();
        setBanners(prev => prev.map(item => item.id === b.id ? saved : item));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update banner. The image might be too large.');
      }
    } catch (e) { console.error(e); }
  }, []);

  const deleteBanner = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setBanners(prev => prev.filter(item => item.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  const addStaff = useCallback((s: Staff) => setStaff(prev => [s, ...prev]), []);
  const removeStaff = useCallback((id: string) => setStaff(prev => prev.filter(s => s.id !== id)), []);

  const addCategory = useCallback(async (c: Category) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories(prev => [saved, ...prev]);
      }
    } catch (e) { console.error(e); }
  }, []);

  const updateCategory = useCallback(async (c: Category) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories(prev => prev.map(item => item.id === c.id ? saved : item));
      }
    } catch (e) { console.error(e); }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setCategories(prev => prev.filter(item => item.id !== id));
    } catch (e) { console.error(e); }
  }, []);

  const addReview = useCallback(async (productId: string, review: Review) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php?action=review&id=${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      if (res.ok) {
        const pRes = await fetch(`${API_BASE_URL}/products.php?id=${productId}`);
        if (pRes.ok) {
          const updatedProduct = await pRes.json();
          setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
        }
      }
    } catch (e) { console.error(e); }
  }, [fetchProduct]);

  const value = useMemo(() => ({
    products,
    categories,
    banners,
    settings,
    orders,
    staff,
    addProduct,
    updateProduct,
    loadProducts,
    fetchProduct,
    fetchProductListings,
    searchProducts,
    deleteProduct,
    updateSettings,
    updateOrderStatus,
    loadOrders,
    addOrder,
    updateBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    addStaff,
    removeStaff,
    deleteOrder,
    addCategory,
    updateCategory,
    deleteCategory,
    addReview,
  }), [
    products,
    categories,
    banners,
    settings,
    orders,
    staff,
    addProduct,
    updateProduct,
    loadProducts,
    fetchProduct,
    fetchProductListings,
    searchProducts,
    deleteProduct,
    updateSettings,
    updateOrderStatus,
    loadOrders,
    addOrder,
    updateBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    addStaff,
    removeStaff,
    deleteOrder,
    addCategory,
    updateCategory,
    deleteCategory,
    addReview,
  ]);

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
