import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import { CartProvider } from './CartContext';
import { initializeFacebookPixel, trackPageView } from './utils/facebookPixel';
import { initializeGA4 } from './utils/ga4';
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

  const initializeGtm = (containerId: string) => {
    const normalizedId = containerId.trim();
    if (!normalizedId) return;

    const existingScripts = Array.from(document.querySelectorAll('script[data-gtm-container-id]'));
    const existingNoscripts = Array.from(document.querySelectorAll('noscript[data-gtm-container-id]'));

    const hasSameGtm = existingScripts.some((script) => script.getAttribute('data-gtm-container-id') === normalizedId);
    if (hasSameGtm) return;

    existingScripts.forEach((script) => script.remove());
    existingNoscripts.forEach((noscript) => noscript.remove());

    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${normalizedId}`;
    script.setAttribute('data-gtm-container-id', normalizedId);
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.setAttribute('data-gtm-container-id', normalizedId);
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${normalizedId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  };

  React.useEffect(() => {
    if (settings?.gtm?.containerId) {
      initializeGtm(settings.gtm.containerId);
    }
  }, [settings?.gtm?.containerId]);

  React.useEffect(() => {
    if (settings?.ga4?.enabled && settings?.ga4?.measurementId) {
      initializeGA4(settings.ga4.measurementId);
    }
  }, [settings?.ga4?.enabled, settings?.ga4?.measurementId]);

  const pushGtmPageView = (pathname: string) => {
    const dataLayer = (window as any).dataLayer || ((window as any).dataLayer = []);
    dataLayer.push({ event: 'pageview', page_path: pathname });
  };

  React.useEffect(() => {
    // Track page view on route changes
    trackPageView();
    pushGtmPageView(location.pathname);
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
