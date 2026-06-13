import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from './types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, openSidebar?: boolean, variation?: any) => void;
  removeFromCart: (productId: string, variationId?: any) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: any) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toast: { message: string; show: boolean; type?: 'success' | 'error' } | null;
  clearToast: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean; type?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const clearToast = () => setToast(null);

  const addToCart = (product: Product, quantity = 1, openSidebar = true, variation?: any) => {
    setCart(prev => {
      const existing = prev.find(item => {
        if (item.product.id !== product.id) return false;
        if (item.variation && variation) return item.variation.id === variation.id;
        return !item.variation && !variation;
      });
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && ((item.variation && variation && item.variation.id === variation.id) || (!item.variation && !variation)))
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, variation, quantity }];
    });
    const name = variation ? `${product.name} (${variation.name})` : product.name;
    setToast({ message: `${name} has been added to cart!`, show: true, type: 'success' });
    
    if (openSidebar) {
      setIsSidebarOpen(true);
    }
    
    // Auto clear toast after 3 seconds
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, show: false } : null);
    }, 3000);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, show: true, type });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, show: false } : null);
    }, 3000);
  };

  const removeFromCart = (productId: string, variationId?: any) => {
    setCart(prev => prev.filter(item => {
      if (item.product.id !== productId) return true;
      if (variationId) return !(item.variation && item.variation.id == variationId);
      return !!item.variation; // remove only items without variation when variationId not provided
    }));
  };

  const updateQuantity = (productId: string, quantity: number, variationId?: any) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
      return;
    }
    setCart(prev => prev.map(item => 
      (item.product.id === productId && ((variationId && item.variation && item.variation.id == variationId) || (!variationId && !item.variation))) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const price = Number(item.variation ? (item.variation.discountPrice ?? item.variation.price) : (item.product.discountPrice ?? item.product.price));
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      totalItems, subtotal, isSidebarOpen, openSidebar, closeSidebar,
      toast, clearToast, showToast
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
