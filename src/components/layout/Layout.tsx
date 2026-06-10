import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, Phone, Truck, RotateCcw, ShieldCheck, Facebook, Youtube, Instagram, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../CartContext';
import { useAdmin } from '../../AdminContext';
import { useAuth } from '../../AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { CartSidebar } from './CartSidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { totalItems, isSidebarOpen, openSidebar, closeSidebar, toast, clearToast } = useCart();
  const { settings, categories, products } = useAdmin();
  const { user } = useAuth();



  React.useEffect(() => {
    if (!settings) return;
    // Dynamic Title
    document.title = `${settings.companyName} - Best Online Shopping`;

    // Dynamic Favicon
    if (settings.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.favicon;
    }
  }, [settings?.favicon, settings?.companyName, settings]);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showResults, setShowResults] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on every page navigation
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const searchResults = searchQuery.trim()
    ? products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        :root {
          --color-primary: ${settings.primaryColor || '#ef4444'};
          --color-primary-hover: ${settings.primaryColor ? `color-mix(in srgb, ${settings.primaryColor}, black 15%)` : '#dc2626'};
        }
        .bg-primary { background-color: var(--color-primary); }
        .text-primary { color: var(--color-primary); }
        .border-primary { border-color: var(--color-primary); }
        .hover\:bg-primary:hover { background-color: var(--color-primary); }
        .hover\:text-primary:hover { color: var(--color-primary); }
        
        /* Custom hover classes */
        .hover-primary-dark:hover { background-color: var(--color-primary-hover) !important; }
        .btn-primary { 
          background-color: var(--color-primary);
          color: white;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background-color: var(--color-primary-hover);
        }
      `}</style>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast?.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[200] bg-white border border-green-100 shadow-2xl px-6 py-4 rounded-2xl flex items-center gap-3 min-w-[300px]"
          >
            <div className="w-8 h-8 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-sm font-bold text-gray-800">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <CartSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Top Bar */}
      <div className="bg-gray-900 text-white py-2 text-xs md:text-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1"><Phone size={14} /> Hotline: {settings.contactPhone}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="hidden md:inline">🚚 Cash on Delivery All Over Bangladesh</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src={settings.logo} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">{settings.companyName}</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <form onSubmit={handleSearchSubmit} className="w-full relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  className="w-full pl-4 pr-12 py-2 border-2 border-gray-100 rounded-full focus:border-primary outline-none transition-all"
                />
                <button type="submit" className="absolute right-0 top-0 bottom-0 bg-primary text-white px-5 rounded-r-full hover-primary-dark transition-colors">
                  <Search size={20} />
                </button>
              </form>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showResults && searchResults.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="p-2">
                        {searchResults.map(product => (
                          <button
                            key={product.id}
                            onClick={() => {
                              navigate(`/product/${product.id}`);
                              setShowResults(false);
                              setSearchQuery('');
                            }}
                            className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-all text-left group"
                          >
                            <img src={product.images[0]} className="w-12 h-12 object-cover rounded-lg border group-hover:border-primary" alt="" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm truncate">{product.name}</h4>
                              <p className="text-xs text-primary font-black">৳{product.discountPrice || product.price}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <Link
                        to={`/products?search=${searchQuery}`}
                        onClick={() => setShowResults(false)}
                        className="block w-full py-3 bg-gray-50 text-center text-xs font-bold text-gray-400 hover:text-primary border-t"
                      >
                        View All Results
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-5">
              <Link to="/account" className="flex items-center gap-2 p-1 pl-2 pr-3 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex group">
                {user ? (
                  <>
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase group-hover:bg-primary group-hover:text-white transition-all">
                      {user.name[0]}
                    </div>
                    <span className="text-xs font-bold text-gray-700 hidden lg:inline">{user.name.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <div className="p-1">
                      <User size={24} className="text-gray-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 hidden lg:inline">Login</span>
                  </>
                )}
              </Link>
              <button
                onClick={openSidebar}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group"
              >
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>

          {/* Categories Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-8 mt-4 border-t pt-3">
            <Link
              to="/"
              className={`font-medium transition-colors text-sm pb-0.5 ${
                isActive('/') ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
              }`}
            >
              Home
            </Link>
            <div className="group relative">
              <button className="flex items-center gap-1 font-medium hover:text-primary transition-colors cursor-pointer text-sm">
                All Categories <ChevronDown size={14} />
              </button>
              <div className="absolute top-full left-0 bg-white shadow-xl rounded-lg py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-gray-100">
                {categories.map(cat => (
                  <Link key={cat.id} to={`/products?category=${encodeURIComponent(cat.name)}`} className="block px-4 py-2 hover:bg-gray-50 hover:text-primary transition-colors text-sm">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              to="/products"
              className={`font-medium transition-colors text-sm pb-0.5 ${
                isActive('/products') ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
              }`}
            >
              All Products
            </Link>
            <Link
              to="/contact"
              className={`font-medium transition-colors text-sm pb-0.5 ${
                isActive('/contact') ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'
              }`}
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-[70] p-6 shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8 border-b pb-4">
                <span className="text-xl font-bold">Navigation</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-2xl">&times;</button>
              </div>
              <div className="flex flex-col gap-4">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="py-2 border-b font-medium text-sm">Home</Link>

                {/* Nested Category lists under All Products per user's prompt */}
                <div className="border-b pb-2 space-y-2">
                  <Link
                    to="/products"
                    onClick={() => setIsMenuOpen(false)}
                    className="py-1 font-bold block text-sm text-primary hover:underline"
                  >
                    All Products
                  </Link>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider pl-1">All Categories</p>
                  <div className="flex flex-col gap-1 pl-3 max-h-48 overflow-y-auto border-l border-gray-100">
                    {categories.map(cat => (
                      <Link
                        key={cat.id}
                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="py-1.5 text-xs text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full shrink-0" />
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="py-2 border-b font-medium text-sm">Contact</Link>
                <Link to="/account" onClick={() => setIsMenuOpen(false)} className="py-2 border-b font-medium flex items-center justify-between text-sm">
                  {user ? (
                    <>
                      <span>Account ({user.name})</span>
                      <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase">
                        {user.name[0]}
                      </div>
                    </>
                  ) : (
                    <span>Login / Signup</span>
                  )}
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        {/* Why Choose Us */}
        <div className="bg-gray-50 py-10">
          <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-start text-left md:items-center md:text-center gap-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm animate-pulse">
                <Truck size={24} />
              </div>
              <h3 className="font-bold text-sm">Fast Delivery</h3>
              <p className="text-xs text-gray-500">24-72 hours delivery all over Bangladesh</p>
            </div>
            <div className="flex flex-col items-start text-left md:items-center md:text-center gap-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-sm">Original Products</h3>
              <p className="text-xs text-gray-500">100% authentic product guarantee</p>
            </div>
            <div className="flex flex-col items-start text-left md:items-center md:text-center gap-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                <RotateCcw size={24} />
              </div>
              <h3 className="font-bold text-sm">Easy Return</h3>
              <p className="text-xs text-gray-500">Easy return within 7 days</p>
            </div>
            <div className="flex flex-col items-start text-left md:items-center md:text-center gap-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                <ShoppingCart size={24} />
              </div>
              <h3 className="font-bold text-sm">Cash On Delivery</h3>
              <p className="text-xs text-gray-500">Pay after receiving the products</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={settings.logo} alt="Logo" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-bold">{settings.companyName}</span>
            </Link>
            <p className="text-sm text-gray-600">{settings.tagline || 'Just click & get!'}</p>
            <div className="flex items-center gap-4">
              {settings.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-blue-600 hover:text-white transition-all"><Facebook size={18} /></a>
              )}
              {settings.socialLinks?.youtube && (
                <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover-primary-dark hover:text-white transition-all"><Youtube size={18} /></a>
              )}
              {settings.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-pink-600 hover:text-white transition-all"><Instagram size={18} /></a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Useful Links</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-600">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Contact</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-600">
              <p><b>Address:</b> {settings.address || 'Not Provided'}</p>
              <p className="flex items-center gap-2 bg-primary/5 text-primary p-3 rounded-xl border border-primary/10 font-bold">
                <Phone size={16} /> Hotline: {settings.contactPhone}
              </p>
              <p><b>Email:</b> {settings.email}</p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t py-6">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
            <div className="flex items-center">
              <p>
                Developed by{' '}
                <a
                  href="https://sajedurrahmanfiad.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold hover:text-primary transition-colors"
                >
                  Md Sajedur Rahman Fiad
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
