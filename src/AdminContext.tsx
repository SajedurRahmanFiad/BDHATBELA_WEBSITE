import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, Banner, StoreSettings, Order, OrderStatus, Staff, Review } from './types';
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
  deleteProduct: (id: string) => Promise<void>;
  updateSettings: (settings: StoreSettings) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
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

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  // Fetch initial data
  useEffect(() => {
    const parseJsonResponse = async (res: Response, url: string) => {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`${url} returned ${res.status} ${res.statusText}: ${text}`);
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`${url} returned non-JSON content type ${contentType}: ${text.slice(0, 400)}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`${url} returned invalid JSON: ${text.slice(0, 400)}`);
      }
    };

    const fetchData = async () => {
      try {
        const [prodRes, catRes, banRes, setRes, ordRes] = await Promise.all([
          fetch(`${API_BASE_URL}/products.php`),
          fetch(`${API_BASE_URL}/categories.php`),
          fetch(`${API_BASE_URL}/banners.php`),
          fetch(`${API_BASE_URL}/settings.php`),
          fetch(`${API_BASE_URL}/orders.php`)
        ]);

        setProducts(await parseJsonResponse(prodRes, `${API_BASE_URL}/products.php`));
        setCategories(await parseJsonResponse(catRes, `${API_BASE_URL}/categories.php`));
        setBanners(await parseJsonResponse(banRes, `${API_BASE_URL}/banners.php`));
        setSettings(await parseJsonResponse(setRes, `${API_BASE_URL}/settings.php`));
        setOrders(await parseJsonResponse(ordRes, `${API_BASE_URL}/orders.php`));
      } catch (e) {
        console.error('Failed to fetch admin data', e);
      }
    };
    fetchData();
  }, []);

  const addProduct = async (p: Product): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const text = await res.text();
      if (res.ok) {
        const savedProduct = JSON.parse(text);
        setProducts([savedProduct, ...products]);
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
  };

  const updateProduct = async (p: Product): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const text = await res.text();
      if (res.ok) {
        const savedProduct = JSON.parse(text);
        setProducts(products.map(item => item.id === p.id ? savedProduct : item));
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
  };

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setProducts(products.filter(item => item.id !== id));
    } catch (e) { console.error(e); }
  };

  const updateSettings = async (s: StoreSettings) => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      if (res.ok) setSettings(await res.json());
    } catch (e) { console.error(e); }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(orders.map(o => o.id === id ? updated : o));
      }
    } catch (e) { console.error(e); }
  };

  const deleteOrder = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setOrders(orders.filter(o => o.id !== id));
    } catch (e) { console.error(e); }
  };

  const addOrder = async (o: Order) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(o)
      });
      if (res.ok) {
        const savedOrder = await res.json();
        setOrders([savedOrder, ...orders]);
        return { success: true, order: savedOrder };
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to place order.' };
    } catch (e: any) { 
        console.error(e); 
        return { success: false, error: e.message || 'Network error.' };
    }
  };

  const updateBanners = async (b: Banner[]) => {
    setBanners(b);
  };

  const addBanner = async (b: Banner) => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      if (res.ok) {
        const saved = await res.json();
        setBanners([saved, ...banners]);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to add banner. The image might be too large.');
      }
    } catch (e) { console.error(e); }
  };

  const updateBanner = async (b: Banner) => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      if (res.ok) {
        const saved = await res.json();
        setBanners(banners.map(item => item.id === b.id ? saved : item));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update banner. The image might be too large.');
      }
    } catch (e) { console.error(e); }
  };

  const deleteBanner = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/banners.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setBanners(banners.filter(item => item.id !== id));
    } catch (e) { console.error(e); }
  };

  const addStaff = (s: Staff) => setStaff([s, ...staff]);
  const removeStaff = (id: string) => setStaff(staff.filter(s => s.id !== id));

  const addCategory = async (c: Category) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories([saved, ...categories]);
      }
    } catch (e) { console.error(e); }
  };

  const updateCategory = async (c: Category) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories(categories.map(item => item.id === c.id ? saved : item));
      }
    } catch (e) { console.error(e); }
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories.php?id=${id}`, { method: 'DELETE' });
      if (res.ok) setCategories(categories.filter(item => item.id !== id));
    } catch (e) { console.error(e); }
  };

  const addReview = async (productId: string, review: Review) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products.php?action=review&id=${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      if (res.ok) {
        // Refetch product to get updated reviews and rating
        const pRes = await fetch(`${API_BASE_URL}/products.php?id=${productId}`);
        if (pRes.ok) {
          const updatedProduct = await pRes.json();
          setProducts(products.map(p => p.id === productId ? updatedProduct : p));
        }
      }
    } catch (e) { console.error(e); }
  };

  return (
    <AdminContext.Provider value={{
      products, categories, banners, settings, orders, staff,
      addProduct, updateProduct, deleteProduct, updateSettings, updateOrderStatus, addOrder, updateBanners, addBanner, updateBanner, deleteBanner, addStaff, removeStaff, deleteOrder,
      addCategory, updateCategory, deleteCategory, addReview
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
