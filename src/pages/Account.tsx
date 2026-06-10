import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, LogOut, Package, MapPin, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Account: React.FC = () => {
  const { user, login, signup, logout, isAdmin, updateUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    loginIdentifier: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(formData.loginIdentifier, formData.password);
        if (!success) setError('Invalid email/phone number or password');
      } else {
        const success = await signup({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone,
          address: formData.address
        }, formData.password);
        if (!success) setError('This phone number or email is already registered');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(editFormData);
    setShowEditModal(false);
  };

  const openEditModal = () => {
    if (user) {
      setEditFormData({
        name: user.name,
        phone: user.phone,
        address: user.address || ''
      });
      setShowEditModal(true);
    }
  };

  if (user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-2xl uppercase">
                {user.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                  {isAdmin && (
                    <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  )}
                </div>
                <p className="text-gray-400 font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover-primary-dark transition-all"
                >
                  Admin Panel
                </Link>
              )}
              <button 
                onClick={logout}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-500 transition-all flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest border-b pb-4">Personal Details</h3>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3 text-sm">
                       <Phone size={16} className="text-primary" />
                       <span className="font-medium">{user.phone}</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm">
                       <Mail size={16} className="text-primary" />
                       <span className="font-medium">{user.email || 'No email provided'}</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm">
                       <MapPin size={16} className="text-primary" />
                       <span className="font-medium">{user.address || 'No address provided yet'}</span>
                     </div>
                  </div>
                  <button 
                     onClick={openEditModal}
                     className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                  >
                     Edit Profile
                  </button>
                </div>
             </div>

             <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[400px]">
                  <h3 className="font-bold text-lg mb-8 flex items-center gap-2">
                    <Package className="text-primary" /> Your Orders
                  </h3>
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 text-gray-300">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                       <Package size={40} />
                    </div>
                    <p className="font-medium italic">You haven't placed any orders yet.</p>
                    <Link to="/products" className="text-primary font-bold text-sm hover:underline">Browse products to place an order</Link>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
               />
               <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-md rounded-3xl p-8 relative z-10 shadow-2xl space-y-6"
               >
                 <h2 className="text-2xl font-black tracking-tighter">Edit Profile</h2>
                 <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                      <input 
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        type="tel"
                        required
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
                      <textarea 
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all h-24 resize-none"
                        placeholder="Enter your full address..."
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                       <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black transition-all">Cancel</button>
                       <button type="submit" className="flex-2 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-red-100 hover-primary-dark transition-all">Save Changes</button>
                    </div>
                 </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100"
        >
          <div className="flex bg-gray-50 p-2 rounded-2xl mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LogIn size={18} /> Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${!isLogin ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <UserPlus size={18} /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-black tracking-tighter mb-6">
              {isLogin ? 'Log in to your account' : 'Create a new account'}
            </h2>

            {error && (
              <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login-fields"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email or Phone Number</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        required
                        value={formData.loginIdentifier}
                        onChange={(e) => setFormData({...formData, loginIdentifier: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-12 pr-4 py-3 rounded-2xl outline-none transition-all font-medium"
                        placeholder="017xxxxxxxx / email@example.com"
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-12 pr-4 py-3 rounded-2xl outline-none transition-all font-medium"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number (Required)</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-12 pr-4 py-3 rounded-2xl outline-none transition-all font-medium"
                        placeholder="017xxxxxxxx"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-12 pr-4 py-3 rounded-2xl outline-none transition-all font-medium"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                      <textarea 
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary pl-12 pr-4 py-3 rounded-2xl outline-none transition-all h-24 resize-none font-medium"
                        placeholder="e.g. House 10, Road 5, Uttara, Dhaka"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary px-4 py-3 rounded-2xl outline-none transition-all font-medium"
                placeholder="********"
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot Password?</button>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-red-100 hover-primary-dark transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Login' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-xs text-gray-400 font-medium">
              {isLogin ? 'New customer?' : 'Already have an account?'} 
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-bold ml-1 hover:underline"
              >
                {isLogin ? 'Create Account' : 'Login'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
