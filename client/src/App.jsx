import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import './i18n';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// RTL init on app load
function RTLInit() {
  const { i18n } = useTranslation();
  useEffect(() => {
    const lang = localStorage.getItem('khona_lang') || 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [i18n.language]);
  return null;
}

// Layout wrapper: no Navbar/Footer on admin routes
function Layout({ children, isAdmin }) {
  return isAdmin ? (
    <>{children}</>
  ) : (
    <>
      <Navbar />
      <>{children}</>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <RTLInit />
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route
              path="/*"
              element={
                <Layout isAdmin={false}>
                  <Routes>
                    <Route index element={<Home />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/:id" element={<Products />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout/success" element={<div style={{padding:'120px 0', textAlign:'center'}}><h2 style={{color:'var(--color-primary)'}}>✓ Payment Successful!</h2></div>} />
                    <Route path="checkout/cancel" element={<div style={{padding:'120px 0', textAlign:'center'}}><h2>Payment Cancelled</h2></div>} />
                  </Routes>
                </Layout>
              }
            />

            {/* Admin routes */}
            <Route path="/khona-admin-secure" element={<AdminLogin />} />
            <Route
              path="/khona-admin-secure/dashboard/*"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
