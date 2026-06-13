import React from 'react';
import { useCart } from '../CartContext';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAdmin } from '../AdminContext';

const normalizeSrc = (src?: string | null) => {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  return trimmed ? trimmed : null;
};

export const Cart: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();
  const { settings } = useAdmin();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <ShoppingBag size={48} />
          </div>
          <h1 className="text-2xl font-bold">Your cart is currently empty!</h1>
          <p className="text-gray-500 italic">Add some desired products to your cart to complete your purchase.</p>
          <Link to="/products" className="inline-block bg-primary text-white px-10 py-3 rounded-full font-bold hover-primary-dark transition-all shadow-lg shadow-red-200">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        <ShoppingBag className="text-primary" /> Your Shopping Cart ({totalItems})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div key={(item.product.id + (item.variation?.id ? `-${item.variation.id}` : ''))} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <Link to={`/product/${item.product.id}`} className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0 border">
                {(() => {
                  const rawMedia = item.variation?.media;
                  const mediaSrc = Array.isArray(rawMedia) ? rawMedia[0] : rawMedia;
                  const src = normalizeSrc(mediaSrc ?? item.product.images?.[0]);
                  return src ? (
                    <img src={src} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                  );
                })()}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product.id}`} className="font-bold hover:text-primary transition-colors block truncate">{item.product.name}{item.variation ? ` (${item.variation.name})` : ''}</Link>
                <p className="text-sm text-gray-500 mb-2">৳{item.variation ? (item.variation.discountPrice ?? item.variation.price) : (item.product.discountPrice || item.product.price)} / unit</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg bg-gray-50">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variation?.id)} className="p-1 px-2 hover:text-primary"><Minus size={14} /></button>
                    <span className="px-3 font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variation?.id)} className="p-1 px-2 hover:text-primary"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id, item.variation?.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <span className="font-black text-lg">৳{(item.variation ? (item.variation.discountPrice ?? item.variation.price) : (item.product.discountPrice || item.product.price)) * item.quantity}</span>
              </div>
            </div>
          ))}

          <Link to="/products" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline py-2">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-6 border-b pb-4">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold">৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="text-xs text-gray-400">Calculated at checkout</span>
              </div>
              <div className="border-t pt-4 flex justify-between text-xl font-black">
                <span>Total</span>
                <span className="text-primary">৳{subtotal}</span>
              </div>
            </div>
            <Link to="/checkout" className="block w-full bg-primary text-white text-center py-4 rounded-xl font-bold text-lg hover-primary-dark transition-all shadow-lg shadow-red-200">
              Proceed to Checkout
            </Link>
          </div>
          
          <div className="bg-gray-900 text-white p-6 rounded-3xl space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">?</div>
               <h3 className="font-bold">Need Help?</h3>
             </div>
             <p className="text-xs opacity-70 leading-relaxed">If you run into any issues while ordering, feel free to call our support hotline or message us directly.</p>
             <a href={`tel:${settings.contactPhone}`} className="block text-center border border-white/30 py-2 rounded-lg text-sm hover:bg-white/10 transition-all">Call us: {settings.contactPhone}</a>
          </div>
        </div>
      </div>
    </div>
  );
};
