import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import { CartProvider } from './CartContext';
import { initializeFacebookPixel, trackPageView } from './utils/facebookPixel';
import { AuthProvider, useAuth } from './AuthContext';
import { AdminProvider, useAdmin } from './AdminContext';

const Home = React.lazy(() => import(/* webpackChunkName: "home-page" */ './pages/Home').then(module => ({ default: module.Home })));
const ProductList = React.lazy(() => import(/* webpackChunkName: "product-list-page" */ './pages/ProductList').then(module => ({ default: module.ProductList })));
const ProductDetail = React.lazy(() => import(/* webpackChunkName: "product-detail-page" */ './pages/ProductDetail').then(module => ({ default: module.ProductDetail })));

const Cart = React.lazy(() => import(/* webpackChunkName: "cart-page" */ './pages/Cart').then(module => ({ default: module.Cart })));
const Checkout = React.lazy(() => import(/* webpackChunkName: "checkout-page" */ './pages/Checkout').then(module => ({ default: module.Checkout })));
const OrderSuccess = React.lazy(() => import(/* webpackChunkName: "order-success-page" */ './pages/OrderSuccess').then(module => ({ default: module.OrderSuccess })));
const AdminDashboard = React.lazy(() => import(/* webpackChunkName: "admin-dashboard" */ './pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const Account = React.lazy(() => import(/* webpackChunkName: "account-page" */ './pages/Account').then(module => ({ default: module.Account })));
const Contact = React.lazy(() => import(/* webpackChunkName: "contact-page" */ './pages/Contact').then(module => ({ default: module.Contact })));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/account" />;
};

// Component to track page views with Facebook Pixel
const PixelPageTracker = () => {
  const location = useLocation();
  const { settings } = useAdmin();

  React.useEffect(() => {
    const verificationTag = settings?.metaPixel?.domainVerificationTag?.trim();
    document.querySelector('meta[name="facebook-domain-verification"]')?.remove();

    if (verificationTag) {
      const contentMatch = verificationTag.match(/content=["']([^"']+)["']/i);
      const meta = document.createElement('meta');
      meta.name = 'facebook-domain-verification';
      meta.content = contentMatch?.[1] || verificationTag;
      document.head.appendChild(meta);
    }
  }, [settings?.metaPixel?.domainVerificationTag]);

  React.useEffect(() => {
    // Initialize pixel when settings are available
    if (settings?.metaPixel?.enabled && settings?.metaPixel?.pixelId) {
      initializeFacebookPixel(settings);
    }
  }, [settings]);

  React.useEffect(() => {
    // Track page view on route changes
    trackPageView();
  }, [location.pathname]);

  return null;
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <PixelPageTracker />
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
        </CartProvider>
      </AdminProvider>
      </AuthProvider>
    </Router>
  );
}
