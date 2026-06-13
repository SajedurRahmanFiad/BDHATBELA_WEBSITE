import React, { useState, useEffect } from 'react';
import { useCart } from '../CartContext';
import { useAdmin } from '../AdminContext';
import { useAuth } from '../AuthContext';
import { handlePhoneChange, isValidPhone } from '../utils/phone';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Truck, CreditCard, Wallet, Landmark, Phone } from 'lucide-react';
import { DISTRICTS } from '../constants';
import { OrderStatus } from '../types';

export const Checkout: React.FC = () => {
  const { cart, subtotal, clearCart, showToast } = useCart();
  const { settings, addOrder, products: liveProducts } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    district: user?.address ? (DISTRICTS.includes(user.address) ? user.address : DISTRICTS[0]) : DISTRICTS[0],
    note: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        phone: user.phone,
        address: user.address || prev.address
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [transactionId, setTransactionId] = useState('');

  const shippingBase = settings.shippingCharges?.base ?? 0;
  // Only use legacy insideDhaka/outsideDhaka if base is not explicitly set (i.e. old settings format)
  const hasBase = settings.shippingCharges?.base !== undefined && settings.shippingCharges?.base !== null;
  const legacyBase = formData.district === 'Dhaka'
    ? settings.shippingCharges?.insideDhaka
    : settings.shippingCharges?.outsideDhaka;
  const defaultCharge = hasBase ? shippingBase : (legacyBase ?? 0);

  const exceptionCharge = Array.isArray(settings.shippingCharges?.exceptions)
    ? settings.shippingCharges.exceptions.find(ex => ex.district === formData.district)?.charge
    : undefined;

  // Exception overrides base; base overrides legacy
  const districtShippingCost = exceptionCharge ?? defaultCharge;

  const totalWeight = cart.reduce((sum, item) => {
    // Use live product data to avoid stale localStorage weight
    const liveProduct = liveProducts.find(p => p.id === item.product.id);
    if (item.variation) {
      // For variation products, find the matching live variation
      const liveVariation = liveProduct?.variations?.find(v => v.id === item.variation!.id);
      const varWeight = liveVariation?.weight ?? item.variation.weight;
      const w = (varWeight !== null && varWeight !== undefined) ? varWeight
        : (liveProduct?.weight ?? item.product.weight ?? 0);
      return sum + w * item.quantity;
    }
    const w = liveProduct?.weight ?? item.product.weight ?? 0;
    return sum + w * item.quantity;
  }, 0);
  const dynamicEnabled = settings.shippingCharges?.dynamicShipping?.enabled ?? false;
  const dynamicStartKg = settings.shippingCharges?.dynamicShipping?.startKg ?? 0;
  const dynamicPerKg = settings.shippingCharges?.dynamicShipping?.perKgCharge ?? 0;
  const extraWeightCharge = dynamicEnabled
    ? Math.max(totalWeight - dynamicStartKg, 0) * dynamicPerKg
    : 0;
  const shippingCost = districtShippingCost + extraWeightCharge;
  const totalAmount = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(formData.phone)) {
      alert('Please enter a valid 11-digit phone number (e.g. 01XXXXXXXXX)');
      return;
    }
    if (!formData.name || !formData.phone || !formData.address) {
      alert('Please fill out all required fields');
      return;
    }

    if (paymentMethod !== 'cod' && !transactionId) {
        alert('Please provide the Payment Transaction ID');
        return;
    }

    const mappedItems = cart.map(item => {
      const prod = item.product;
      const variation = (item as any).variation;
      return {
        product: {
          id: prod.id,
          name: variation ? `${prod.name} (${variation.name})` : prod.name,
          price: variation ? (variation.discountPrice ?? variation.price) : (prod.discountPrice ?? prod.price),
          images: [variation?.media ?? prod.images?.[0] ?? '']
        },
        quantity: item.quantity,
        variationId: variation?.id ?? null
      };
    });

    const newOrder = {
      id: `order-${Date.now()}`,
      customerId: 'guest',
      customerName: formData.name,
      phone: formData.phone,
      address: formData.address,
      area: formData.district,
      items: mappedItems,
      total: totalAmount,
      status: OrderStatus.PENDING,
      date: new Date().toLocaleDateString('en-US'),
      paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase(),
      note: formData.note + (transactionId ? ` | TrxID: ${transactionId}` : '')
    };

    const result = await addOrder(newOrder);
    if (!result.success) {
      showToast(result.error || 'Failed to confirm order.', 'error');
      return;
    }
    clearCart();
    navigate(`/order-success/${result.order?.id || newOrder.id}`);

  };

  if (cart.length === 0) {
    return (
       <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Your shopping cart is empty!</h1>
          <Link to="/" className="text-primary font-bold underline">Click here to start shopping</Link>
       </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Shipping Info */}
        <div className="space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Truck size={24} className="text-primary" /> Shipping Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-600 block">Your Name *</label>
                 <input 
                   type="text" 
                   required
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   placeholder="Enter your full name"
                   className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none transition-all"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-gray-600 block">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="tel" 
                      required
                      maxLength={11}
                      value={formData.phone}
                      onChange={e => handlePhoneChange(e.target.value, (v) => setFormData({...formData, phone: v}))}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none transition-all"
                    />
                  </div>
               </div>
               <div className="space-y-2 text-sm">
                  <label className="text-sm font-bold text-gray-600 block">District *</label>
                  <select 
                    value={formData.district}
                    onChange={e => setFormData({...formData, district: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
               </div>
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-600 block">Full Address *</label>
                 <textarea 
                   required
                   value={formData.address}
                   onChange={e => setFormData({...formData, address: e.target.value})}
                   placeholder="House number, road number, area, etc..."
                   className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none transition-all h-24 resize-none"
                 />
               </div>
               <div className="space-y-2 md:col-span-2">
                 <label className="text-sm font-bold text-gray-600 block">Order Notes (Optional)</label>
                 <input 
                   type="text" 
                   value={formData.note}
                   onChange={e => setFormData({...formData, note: e.target.value})}
                   placeholder="Enter notes or instructions for delivery"
                   className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-primary outline-none transition-all"
                 />
               </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard size={24} className="text-primary" /> Payment Method
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {settings.paymentGateways.cod.enabled && (
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <Wallet className="text-primary" />
                    <span className="font-bold">Cash on Delivery</span>
                  </div>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 accent-primary" />
                </label>
              )}

              {['bkash', 'nagad', 'rocket'].map((gateway) => {
                const config = (settings.paymentGateways as any)[gateway];
                if (!config.enabled) return null;
                return (
                  <label key={gateway} className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === gateway ? 'border-primary bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center font-black text-xs uppercase ${
                        gateway === 'bkash' ? 'bg-pink-100 text-pink-600' :
                        gateway === 'nagad' ? 'bg-orange-100 text-orange-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {gateway.slice(0, 2)}
                      </div>
                      <span className="font-bold uppercase">{gateway} {config.type && `(${config.type})`}</span>
                    </div>
                    <input type="radio" name="payment" value={gateway} checked={paymentMethod === gateway} onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 accent-primary" />
                  </label>
                );
              })}

              {settings.paymentGateways.bank.enabled && (
                <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-primary bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <Landmark className="text-blue-600" />
                    <span className="font-bold">Bank Transfer</span>
                  </div>
                  <input type="radio" name="payment" value="bank" checked={paymentMethod === 'bank'} onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 accent-primary" />
                </label>
              )}
            </div>

            {paymentMethod !== 'cod' && (
              <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-300 space-y-4 animate-in fade-in slide-in-from-top-4">
                <div className="space-y-1">
                    <h4 className="font-black text-primary uppercase text-xs tracking-widest">Payment Instructions:</h4>
                    <p className="text-sm font-medium leading-relaxed">
                        {paymentMethod === 'bank' ? (
                            <>
                                <b>Bank Name:</b> {settings.paymentGateways.bank.bankName}<br/>
                                <b>Branch:</b> {settings.paymentGateways.bank.branchName}<br/>
                                <b>Account Name:</b> {settings.paymentGateways.bank.accountName}<br/>
                                <b>Account No:</b> {settings.paymentGateways.bank.accountNumber}<br/>
                                <span className="text-xs text-gray-500 mt-2 block">{settings.paymentGateways.bank.instructions}</span>
                            </>
                        ) : (
                            <>
                                Please send money to our <b>{(settings.paymentGateways as any)[paymentMethod].type}</b> account <b>{(settings.paymentGateways as any)[paymentMethod].number}</b>.<br/>
                                <span className="text-xs text-gray-500 mt-2 block">{(settings.paymentGateways as any)[paymentMethod].instructions}</span>
                            </>
                        )}
                    </p>
                </div>
                <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction ID *</label>
                    <input 
                        required
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        placeholder="e.g. 8N7A6D5C"
                        className="w-full px-4 py-3 rounded-xl bg-white border outline-none focus:border-primary font-mono text-center tracking-widest uppercase font-bold"
                    />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Review */}
        <div className="space-y-6">
          <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl space-y-6 sticky top-24">
            <h2 className="text-xl font-bold border-b border-white/10 pb-4 mb-4">Order Review</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pr-2 mb-6">
              {cart.map(item => (
                <div key={(item.product.id + (item.variation?.id ? `-${item.variation.id}` : ''))} className="flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{item.quantity}x</span>
                    <span className="text-sm opacity-80 truncate">{item.product.name}{item.variation ? ` (${item.variation.name})` : ''}</span>
                  </div>
                  <span className="font-bold text-sm shrink-0">৳{((item.variation ? (item.variation.discountPrice ?? item.variation.price) : (item.product.discountPrice ?? item.product.price))) * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between opacity-80 text-sm">
                <span>Subtotal</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between opacity-80 text-sm">
                <span>Delivery Charge</span>
                <span>৳{districtShippingCost}</span>
              </div>
              {dynamicEnabled && (
                <div className="flex justify-between opacity-70 text-xs">
                  <span>Cart Weight: {totalWeight.toFixed(2)} kg
                    {dynamicStartKg > 0 && ` (free up to ${dynamicStartKg} kg)`}
                  </span>
                  <span className={extraWeightCharge > 0 ? 'text-yellow-300 font-bold' : ''}>
                    {extraWeightCharge > 0 ? `+৳${extraWeightCharge.toFixed(2)}` : 'No surcharge'}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-black pt-4">
                <span>Total</span>
                <span className="text-primary text-3xl">৳{totalAmount}</span>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary py-5 rounded-2xl font-black text-xl hover-primary-dark transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 mt-8 text-white">
              Confirm Order <CheckCircle2 size={24} />
            </button>
            <p className="text-[10px] text-center opacity-40 italic">By confirming the order, you agree to our terms and conditions.</p>
          </div>
        </div>
      </form>
    </div>
  );
};
