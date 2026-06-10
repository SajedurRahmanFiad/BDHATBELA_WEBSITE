import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Category, Banner, StoreSettings, Order, OrderStatus, Staff, Review } from './types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BANNERS, INITIAL_SETTINGS } from './constants';

interface AdminContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: StoreSettings;
  orders: Order[];
  staff: Staff[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateSettings: (settings: StoreSettings) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  addOrder: (order: Order) => void;
  updateBanners: (banners: Banner[]) => void;
  addStaff: (staff: Staff) => void;
  removeStaff: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addReview: (productId: string, review: Review) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('admin_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('admin_categories');
    return saved ? JSON.parse(saved) : MOCK_CATEGORIES;
  });
  
  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('admin_banners');
    return saved ? JSON.parse(saved) : MOCK_BANNERS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('admin_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('admin_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('admin_staff');
    return saved ? JSON.parse(saved) : [
      { id: 's1', name: 'Admin User', email: 'admin@shop.com', role: 'Admin', phone: '01XXXXXXXXX' }
    ];
  });

  useEffect(() => localStorage.setItem('admin_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('admin_banners', JSON.stringify(banners)), [banners]);
  useEffect(() => localStorage.setItem('admin_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('admin_orders', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('admin_staff', JSON.stringify(staff)), [staff]);
  useEffect(() => localStorage.setItem('admin_categories', JSON.stringify(categories)), [categories]);

  const addProduct = (p: Product) => setProducts([p, ...products]);
  const updateProduct = (p: Product) => setProducts(products.map(item => item.id === p.id ? p : item));
  const deleteProduct = (id: string) => setProducts(products.filter(item => item.id !== id));
  const updateSettings = (s: StoreSettings) => setSettings(s);
  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };
  const deleteOrder = (id: string) => setOrders(orders.filter(o => o.id !== id));
  const addOrder = (o: Order) => setOrders([o, ...orders]);
  const updateBanners = (b: Banner[]) => setBanners(b);
  const addStaff = (s: Staff) => setStaff([s, ...staff]);
  const removeStaff = (id: string) => setStaff(staff.filter(s => s.id !== id));
  const addCategory = (c: Category) => setCategories([c, ...categories]);
  const updateCategory = (c: Category) => setCategories(categories.map(item => item.id === c.id ? c : item));
  const deleteCategory = (id: string) => setCategories(categories.filter(item => item.id !== id));
  const addReview = (productId: string, review: Review) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const newReviews = [review, ...p.reviews];
        const newRating = newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length;
        return { ...p, reviews: newReviews, rating: Number(newRating.toFixed(1)) };
      }
      return p;
    }));
  };

  return (
    <AdminContext.Provider value={{
      products, categories, banners, settings, orders, staff,
      addProduct, updateProduct, deleteProduct, updateSettings, updateOrderStatus, addOrder, updateBanners, addStaff, removeStaff, deleteOrder,
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
