import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import ScrollToTop from './components/layout/ScrollToTop';
import { Home } from './pages/Home';
import { ProductList } from './pages/ProductList';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { AdminDashboard } from './pages/AdminDashboard';
import { Account } from './pages/Account';
import { Contact } from './pages/Contact';
import { CartProvider } from './CartContext';
import { AdminProvider } from './AdminContext';
import { AuthProvider, useAuth } from './AuthContext';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/account" />;
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <Routes>
              {/* Admin Routes - No Layout */}
              <Route path="/admin/*" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* Customer Routes - With Layout */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/products" element={<Layout><ProductList /></Layout>} />
              <Route path="/category/:categoryName" element={<Layout><ProductList /></Layout>} />
              <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
              <Route path="/account" element={<Layout><Account /></Layout>} />
              <Route path="/contact" element={<Layout><Contact /></Layout>} />
              <Route path="/order-success/:id" element={<Layout><OrderSuccess /></Layout>} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </CartProvider>
      </AdminProvider>
      </AuthProvider>
    </Router>
  );
}
