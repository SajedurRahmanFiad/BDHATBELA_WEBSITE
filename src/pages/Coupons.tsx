import React from 'react';
import { useAdmin } from '../AdminContext';
import { useCart } from '../CartContext';
import { Coupon, CouponFormData, CouponType, Product, Category } from '../types';
import { Search, Plus, Tag, Percent, Gift, Edit3, Trash2, AlertCircle, Calendar, ListChecks, CheckCircle2 } from 'lucide-react';

const emptyCouponForm: CouponFormData = {
  code: '',
  name: '',
  type: 'fixed',
  amount: '',
  percentage: '',
  noteMessage: '',
  isActive: true,
  startDate: '',
  endDate: '',
  usageLimit: '',
  productIds: [],
  categoryIds: []
};

const couponTypeLabel = (type: CouponType) => {
  if (type === 'fixed') return 'Fixed Discount';
  if (type === 'percentage') return 'Percentage Discount';
  return 'Note / Free Gift';
};

const couponTypeIcon = (type: CouponType) => {
  if (type === 'fixed') return <Tag size={16} />;
  if (type === 'percentage') return <Percent size={16} />;
  return <Gift size={16} />;
};

const toggleValue = (values: string[], value: string) => {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
};

const CouponRestrictions = ({ coupon, products, categories }: { coupon: Coupon; products: Product[]; categories: Category[] }) => {
  const productNames = coupon.productIds
    .map(id => products.find(product => product.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const categoryNames = coupon.categoryIds
    .map(id => categories.find(category => category.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="flex flex-wrap gap-2">
      {productNames.length === 0 && categoryNames.length === 0 && (
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">All products</span>
      )}
      {productNames.map(name => (
        <span key={`product-${name}`} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">{name}</span>
      ))}
      {categoryNames.map(name => (
        <span key={`category-${name}`} className="text-[10px] bg-red-50 text-primary px-2 py-1 rounded-full font-bold">{name}</span>
      ))}
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tighter">{title}</h3>
          <p className="text-sm text-gray-400 font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-100 transition-all text-sm">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white shadow-lg shadow-red-200 hover-primary-dark transition-all text-sm">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export const Coupons: React.FC = () => {
  const { products, categories, coupons, loadCoupons, saveCoupon, deleteCoupon } = useAdmin();
  const { showToast } = useCart();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showModal, setShowModal] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [couponToDelete, setCouponToDelete] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CouponFormData>(emptyCouponForm);
  const [showCategoryRestrictions, setShowCategoryRestrictions] = React.useState(false);
  const [showProductRestrictions, setShowProductRestrictions] = React.useState(false);

  React.useEffect(() => {
    loadCoupons().catch(console.error);
  }, [loadCoupons]);

  React.useEffect(() => {
    if (editingCoupon) {
      setForm({
        id: editingCoupon.id,
        code: editingCoupon.code,
        name: editingCoupon.name,
        type: editingCoupon.type,
        amount: editingCoupon.type === 'fixed' ? editingCoupon.amount.toString() : '',
        percentage: editingCoupon.type === 'percentage' ? editingCoupon.percentage.toString() : '',
        noteMessage: editingCoupon.noteMessage || '',
        isActive: editingCoupon.isActive,
        startDate: editingCoupon.startDate ? editingCoupon.startDate.slice(0, 16) : '',
        endDate: editingCoupon.endDate ? editingCoupon.endDate.slice(0, 16) : '',
        usageLimit: editingCoupon.usageLimit !== null && editingCoupon.usageLimit !== undefined ? editingCoupon.usageLimit.toString() : '',
        productIds: editingCoupon.productIds || [],
        categoryIds: editingCoupon.categoryIds || []
      });
    } else {
      setForm(emptyCouponForm);
    }
  }, [editingCoupon]);

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(emptyCouponForm);
    setShowCategoryRestrictions(false);
    setShowProductRestrictions(false);
    setShowModal(true);
  };

  const closeCouponModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setForm(emptyCouponForm);
  };

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase();
    const name = form.name.trim();

    if (!code) return alert('Please provide a coupon code.');
    if (!name) return alert('Please provide a coupon name.');

    if (form.type === 'fixed') {
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) return alert('Fixed discount amount must be greater than zero.');
    }

    if (form.type === 'percentage') {
      const percentage = Number(form.percentage);
      if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) return alert('Percentage must be between 1 and 100.');
    }

    if (form.type === 'note' && !form.noteMessage?.trim()) {
      return alert('Please provide the note/free gift message.');
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      return alert('Coupon start date cannot be after end date.');
    }

    const payload: CouponFormData = {
      ...form,
      id: form.id,
      code,
      name,
      amount: form.type === 'fixed' ? Number(form.amount) : 0,
      percentage: form.type === 'percentage' ? Number(form.percentage) : 0,
      noteMessage: form.noteMessage?.trim(),
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit)
    };

    const saved = await saveCoupon(payload);
    if (!saved) return;

    showToast(`Successfully saved coupon ${saved.code}!`);
    closeCouponModal();
  };

  const filteredCoupons = coupons.filter(coupon => {
    const search = searchTerm.toLowerCase();
    return !search ||
      coupon.code.toLowerCase().includes(search) ||
      coupon.name.toLowerCase().includes(search) ||
      coupon.type.toLowerCase().includes(search) ||
      coupon.noteMessage?.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Coupon Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Create fixed, percentage, or note-only coupons with product/category restrictions.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-xl outline-none focus:border-primary w-full md:w-64 text-sm transition-all bg-white"
            />
          </div>
          <button onClick={openCreate} className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover-primary-dark transition-all shrink-0 flex items-center justify-center gap-2">
            <Plus size={16} /> Add Coupon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCoupons.map(coupon => (
          <div key={coupon.id} className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm group hover:border-primary transition-all relative">
            <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all bg-white/90 p-1 rounded-full backdrop-blur">
              <button onClick={() => { setEditingCoupon(coupon); setShowCategoryRestrictions(false); setShowProductRestrictions(false); setShowModal(true); }} className="p-1.5 text-blue-500 rounded-full hover:bg-blue-50" title="Edit">
                <Edit3 size={14} />
              </button>
              <button onClick={() => setCouponToDelete(coupon.id)} className="p-1.5 text-red-500 rounded-full hover:bg-red-50" title="Delete">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="flex items-start gap-3 pr-16">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${coupon.type === 'fixed' ? 'bg-red-50 text-primary' : coupon.type === 'percentage' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                {couponTypeIcon(coupon.type)}
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">{coupon.code}</h3>
                <p className="text-sm text-gray-500 font-bold">{coupon.name}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Type</span>
                <span className="font-black">{couponTypeLabel(coupon.type)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Discount</span>
                <span className="font-black text-primary">
                  {coupon.type === 'fixed' ? `৳${coupon.amount}` : coupon.type === 'percentage' ? `${coupon.percentage}%` : 'No discount'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Status</span>
                <span className={`text-[10px] px-3 py-1 rounded-full font-black border ${coupon.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-100 text-gray-500 border-gray-100'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Restrictions</p>
                <CouponRestrictions coupon={coupon} products={products} categories={categories} />
              </div>
              {coupon.noteMessage && (
                <div className="pt-3 border-t">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Customer Note</p>
                  <p className="text-sm font-medium text-gray-600">{coupon.noteMessage}</p>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Usage</span>
                <span className="font-black">{coupon.timesUsed ?? 0}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="bg-white border border-dashed border-gray-200 rounded-[32px] p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag size={32} />
          </div>
          <h3 className="text-lg font-black">No coupons found</h3>
          <p className="text-sm text-gray-500 font-medium mt-1">Create your first coupon to start offering discounts or free gifts.</p>
        </div>
      )}

      <ConfirmModal
        isOpen={!!couponToDelete}
        onClose={() => setCouponToDelete(null)}
        onConfirm={() => couponToDelete && deleteCoupon(couponToDelete)}
        title="Delete this Coupon?"
        message="This will remove the coupon and all of its product/category restrictions."
      />

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCouponModal} />
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tighter">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Dynamic coupon rules</p>
              </div>
              <button onClick={closeCouponModal} className="text-2xl text-gray-400 hover:text-black">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coupon Code *</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold uppercase tracking-widest" placeholder="SAVE10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coupon Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold" placeholder="Eid Sale Coupon" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coupon Type *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['fixed', 'percentage', 'note'] as CouponType[]).map(type => (
                    <button key={type} type="button" onClick={() => setForm({ ...form, type })} className={`p-4 rounded-2xl border-2 text-left transition-all ${form.type === type ? 'border-primary bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-center gap-2 font-black text-sm">{couponTypeIcon(type)} {couponTypeLabel(type)}</div>
                      <p className="text-xs text-gray-500 font-medium mt-1">{type === 'fixed' ? 'Deduct a fixed amount from eligible carts.' : type === 'percentage' ? 'Deduct a percentage from eligible carts.' : 'Show a custom note/free gift without discount.'}</p>
                    </button>
                  ))}
                </div>
              </div>

              {form.type !== 'note' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Discount Value *</label>
                  {form.type === 'fixed' ? (
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold" placeholder="100" />
                  ) : (
                    <input type="number" min="1" max="100" step="0.01" value={form.percentage} onChange={e => setForm({ ...form, percentage: e.target.value })} className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold" placeholder="10" />
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer Note / Free Gift Message {form.type === 'note' ? '*' : ''}</label>
                <textarea value={form.noteMessage} onChange={e => setForm({ ...form, noteMessage: e.target.value })} className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold h-24 resize-none" placeholder={form.type === 'note' ? 'You will receive a free gift with this order.' : 'Optional message shown to the customer.'} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                  <input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold" />
                  <p className="text-xs text-gray-400 mt-1">Optional expiry date. Leave blank for no expiration.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Usage Limit</label>
                  <input type="number" min="0" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} className="w-full bg-gray-50 border border-gray-200 focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all text-sm font-bold" placeholder="Leave empty for unlimited" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl border bg-gray-50">
                <input id="coupon-active" type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 accent-primary" />
                <label htmlFor="coupon-active" className="font-bold text-sm">Active coupon</label>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowCategoryRestrictions(prev => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-black tracking-widest uppercase text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      Specific Categories
                    </div>
                    <span className="text-primary">{showCategoryRestrictions ? 'Collapse' : 'Expand'}</span>
                  </button>
                  {showCategoryRestrictions && (
                    <div className="max-h-72 overflow-y-auto p-4 space-y-2 border-t border-gray-200">
                      {categories.length > 0 ? categories.map(category => (
                        <label key={category.id} className="flex items-center gap-3 p-3 rounded-2xl border bg-gray-50 hover:border-primary transition-all cursor-pointer">
                          <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => setForm({ ...form, categoryIds: toggleValue(form.categoryIds, category.id) })} className="w-4 h-4 accent-primary" />
                          <span className="text-sm font-bold">{category.name}</span>
                        </label>
                      )) : (
                        <p className="text-sm text-gray-400 italic">No categories available yet.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowProductRestrictions(prev => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left text-sm font-black tracking-widest uppercase text-gray-700 bg-gray-50 hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <ListChecks size={16} className="text-gray-400" />
                      Specific Products
                    </div>
                    <span className="text-primary">{showProductRestrictions ? 'Collapse' : 'Expand'}</span>
                  </button>
                  {showProductRestrictions && (
                    <div className="max-h-72 overflow-y-auto p-4 space-y-2 border-t border-gray-200">
                      {products.length > 0 ? products.map(product => (
                        <label key={product.id} className="flex items-center gap-3 p-3 rounded-2xl border bg-gray-50 hover:border-primary transition-all cursor-pointer">
                          <input type="checkbox" checked={form.productIds.includes(product.id)} onChange={() => setForm({ ...form, productIds: toggleValue(form.productIds, product.id) })} className="w-4 h-4 accent-primary" />
                          <span className="text-sm font-bold">{product.name}</span>
                        </label>
                      )) : (
                        <p className="text-sm text-gray-400 italic">No products available yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button onClick={closeCouponModal} className="flex-1 bg-white border border-gray-200 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all text-sm">Cancel</button>
              <button onClick={handleSave} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover-primary-dark transition-all text-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> {editingCoupon ? 'Update Coupon' : 'Save Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
