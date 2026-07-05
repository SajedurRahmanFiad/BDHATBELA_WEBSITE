import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Layout } from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import { CartProvider } from './CartContext';

import { AuthProvider, useAuth } from './AuthContext';
import { AdminProvider } from './AdminContext';

const Home = React.lazy(() => import(/* webpackChunkName: "home-page" */ './pages/Home').then(module => ({ default: module.Home })));
const ProductList = React.lazy(() => import(/* webpackChunkName: "product-list-page" */ './pages/ProductList').then(module => ({ default: module.ProductList })));
const ProductDetail = React.lazy(() => import(/* webpackChunkName: "product-detail-page" */ './pages/ProductDetail').then(module => ({ default: module.ProductDetail })));

const Cart = React.lazy(() => import(/* webpackChunkName: "cart-page" */ './pages/Cart').then(module => ({ default: module.Cart })));
const Checkout = React.lazy(() => import(/* webpackChunkName: "checkout-page" */ './pages/Checkout').then(module => ({ default: module.Checkout })));
const OrderSuccess = React.lazy(() => import(/* webpackChunkName: "order-success-page" */ './pages/OrderSuccess').then(module => ({ default: module.OrderSuccess })));
const AdminDashboard = React.lazy(() => import(/* webpackChunkName: "admin-dashboard" */ './pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const Account = React.lazy(() => import(/* webpackChunkName: "account-page" */ './pages/Account').then(module => ({ default: module.Account })));
const Contact = React.lazy(() => import(/* webpackChunkName: "contact-page" */ './pages/Contact').then(module => ({ default: module.Contact })));

const RouteFallback = () => null;

const RouteTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    setIsNavigating(true);
    const timer = window.setTimeout(() => setIsNavigating(false), 220);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <>
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-gray-200 bg-white/90 px-8 py-6 shadow-xl">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
              <p className="text-sm font-semibold text-gray-600">Loading page…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/account" />;
};

// Component to track page views through the existing analytics flow
const PixelPageTracker = () => {
  const location = useLocation();

  const pushGtmPageView = (pathname: string) => {
    const dataLayer = (window as any).dataLayer || ((window as any).dataLayer = []);
    dataLayer.push({
      event: 'page_view',
      page_path: pathname,
      page_title: document.title,
    });
  };

  React.useEffect(() => {
    pushGtmPageView(location.pathname);
  }, [location.pathname]);

  return null;
};

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL || '/'}>
      <ScrollToTop />
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <PixelPageTracker />
            <RouteTransition>
              <Routes>
                {/* Admin Routes - No Layout */}
                <Route path="/admin/*" element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  </Suspense>
                } />

                {/* Customer Routes - With Layout */}
                <Route path="/" element={<Suspense fallback={<RouteFallback />}><Layout><Home /></Layout></Suspense>} />
                <Route path="/products" element={<Suspense fallback={<RouteFallback />}><Layout><ProductList /></Layout></Suspense>} />
                <Route path="/category/:categoryName" element={<Suspense fallback={<RouteFallback />}><Layout><ProductList /></Layout></Suspense>} />
                <Route path="/product/:key" element={<Suspense fallback={<RouteFallback />}><Layout><ProductDetail /></Layout></Suspense>} />
                <Route path="/cart" element={<Suspense fallback={<RouteFallback />}><Layout><Cart /></Layout></Suspense>} />
                <Route path="/checkout" element={<Suspense fallback={<RouteFallback />}><Layout><Checkout /></Layout></Suspense>} />
                <Route path="/account" element={<Suspense fallback={<RouteFallback />}><Layout><Account /></Layout></Suspense>} />
                <Route path="/contact" element={<Suspense fallback={<RouteFallback />}><Layout><Contact /></Layout></Suspense>} />
                <Route path="/order-success/:id" element={<Suspense fallback={<RouteFallback />}><Layout><OrderSuccess /></Layout></Suspense>} />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            </RouteTransition>
        </CartProvider>
      </AdminProvider>
      </AuthProvider>
    </Router>
  );
}
