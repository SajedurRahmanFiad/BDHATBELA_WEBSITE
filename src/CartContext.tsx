import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';
import { CartItem, Product } from './types';
import { toFiniteNumber } from './utils/money';
import { trackAddToCart } from './utils/facebookPixel';
import { trackAddToCart as trackGA4AddToCart } from './utils/ga4';

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

const defaultCartContext: CartContextType = {
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  subtotal: 0,
  isSidebarOpen: false,
  openSidebar: () => {},
  closeSidebar: () => {},
  toast: null,
  clearToast: () => {},
  showToast: () => {},
};

const CartContext = createContext<CartContextType>(defaultCartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load cart from localStorage synchronously before render using useLayoutEffect
  // This ensures cart is available immediately without delayed re-render
  useLayoutEffect(() => {
    const saved = localStorage.getItem('cart');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setCart(parsed);
      }
    } catch {
      localStorage.removeItem('cart');
    }
  }, []);
  const [toast, setToast] = useState<{ message: string; show: boolean; type?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const clearToast = () => setToast(null);

  const addToCart = (product: Product, quantity = 1, openSidebar = true, variation?: any) => {
    const normalizedQuantity = toFiniteNumber(quantity, 1);
    if (normalizedQuantity <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => {
        if (item.product.id !== product.id) return false;
        if (item.variation && variation) return item.variation.id === variation.id;
        return !item.variation && !variation;
      });
      if (existing) {
        return prev.map(item =>
          (item.product.id === product.id && ((item.variation && variation && item.variation.id === variation.id) || (!item.variation && !variation)))
            ? { ...item, quantity: item.quantity + normalizedQuantity }
            : item
        );
      }
      return [...prev, { product, variation, quantity: normalizedQuantity }];
    });
    const name = variation ? `${product.name} (${variation.name})` : product.name;
    setToast({ message: `${name} has been added to cart!`, show: true, type: 'success' });
    const ga4Items = [{
      id: variation?.sku ?? product.sku ?? variation?.id ?? product.id,
      name,
      price: toFiniteNumber(variation?.discountPrice ?? variation?.price ?? product.discountPrice ?? product.price),
      quantity: normalizedQuantity,
      category: product.category,
      sku: variation?.sku ?? product.sku,
      stock: variation?.stock ?? product.stock,
      productType: variation ? 'variation' : product.productType || 'simple',
      itemBrand: product.badge || undefined,
      index: 1,
      affiliation: window.location.hostname,
      googleBusinessVertical: 'retail',
    }];

    trackAddToCart(ga4Items);
    trackGA4AddToCart(ga4Items);

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
    const normalizedQuantity = toFiniteNumber(quantity, 0);
    if (normalizedQuantity <= 0) {
      removeFromCart(productId, variationId);
      return;
    }
    setCart(prev => prev.map(item =>
      (item.product.id === productId && ((variationId && item.variation && item.variation.id == variationId) || (!variationId && !item.variation))) ? { ...item, quantity: normalizedQuantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const getCartItemUnitPrice = (item: CartItem): number => {
    const priceSource = item.variation ?? item.product;
    return toFiniteNumber(priceSource.discountPrice ?? priceSource.price);
  };

  const totalItems = cart.reduce((sum, item) => sum + toFiniteNumber(item.quantity), 0);
  const subtotal = cart.reduce((sum, item) => {
    return sum + getCartItemUnitPrice(item) * toFiniteNumber(item.quantity);
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
  return useContext(CartContext);
};
