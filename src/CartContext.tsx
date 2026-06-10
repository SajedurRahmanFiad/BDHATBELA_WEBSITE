import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from './types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, openSidebar?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toast: { message: string; show: boolean } | null;
  clearToast: () => void;
  showToast: (message: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean } | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const clearToast = () => setToast(null);

  const addToCart = (product: Product, quantity = 1, openSidebar = true) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setToast({ message: `${product.name} has been added to cart!`, show: true });
    
    if (openSidebar) {
      setIsSidebarOpen(true);
    }
    
    // Auto clear toast after 3 seconds
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, show: false } : null);
    }, 3000);
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, show: false } : null);
    }, 3000);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
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
