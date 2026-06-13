import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, ChevronRight, Minus, Plus } from 'lucide-react';
import { useCart } from '../../CartContext';
import { Link } from 'react-router-dom';

const normalizeSrc = (src?: string | null) => {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  return trimmed ? trimmed : null;
};

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-sm bg-white shadow-2xl z-[160] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="font-black text-lg tracking-tight">Your Cart</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cart.length} items</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6">
              {cart.length > 0 ? (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <div key={(item.product.id + (item.variation?.id ? `-${item.variation.id}` : ''))} className="flex gap-4 group">
                      <div className="w-20 h-24 bg-gray-50 rounded-2xl overflow-hidden border shrink-0">
                        {(() => {
                          const rawMedia = item.variation?.media;
                          const mediaSrc = Array.isArray(rawMedia) ? rawMedia[0] : rawMedia;
                          const src = normalizeSrc(mediaSrc ?? item.product.images?.[0]);
                          return src ? (
                            <img 
                              src={src}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                              alt={item.product.name} 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-sm truncate">{item.product.name}{item.variation ? ` (${item.variation.name})` : ''}</h3>
                            <button 
                              onClick={() => removeFromCart(item.product.id, item.variation?.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-xs font-black text-primary mt-1">৳{item.variation ? (item.variation.discountPrice ?? item.variation.price) : (item.product.discountPrice || item.product.price)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-gray-50 rounded-lg p-1 border">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variation?.id)}
                              className="p-1 hover:bg-white rounded-md transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variation?.id)}
                              className="p-1 hover:bg-white rounded-md transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <p className="text-sm font-black">৳{(item.variation ? (item.variation.discountPrice ?? item.variation.price) : (item.product.discountPrice || item.product.price)) * item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                    <ShoppingBag size={40} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Cart Empty</h3>
                    <p className="text-sm text-gray-400">There are no products in your cart</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 hover:scale-105 transition-all"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t bg-gray-50/50 space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
                  <span className="font-bold text-gray-500">Subtotal</span>
                  <span className="text-xl font-black text-primary">৳{subtotal}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    to="/cart" 
                    onClick={onClose}
                    className="py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-black text-center text-sm shadow-sm hover:bg-gray-50 transition-all"
                  >
                    View Cart
                  </Link>
                  <Link 
                    to="/checkout" 
                    onClick={onClose}
                    className="py-4 bg-primary text-white rounded-2xl font-black text-center text-sm shadow-xl shadow-red-100 flex items-center justify-center gap-2 group transition-all"
                  >
                    Checkout <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
