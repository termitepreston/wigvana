import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MessagingProvider } from './context/MessagingContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ProductProvider } from './context/ProductContext';
import CartPage from './pages/CartPage';
import SellerDashboard from './pages/SellerDashboard';
import MessagingPage from './pages/MessagingPage';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import SellerStorePage from './pages/SellerStorePage';
import BecomeSeller from './pages/BecomeSeller';
import SellersPage from './pages/SellersPage';
import SellerProducts from './pages/SellerProducts';
import SellerOrders from './pages/SellerOrders';
import FavoritesPage from './pages/FavoritesPage';
import Footer from './components/Footer';
import ProtectedSellerRoute from './components/ProtectedSellerRoute';
import DealsPage from './pages/DealsPage';
import SellerGuidePage from './pages/SellerGuidePage';
import FAQPage from './pages/FAQPage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';

const App = () => {
  console.log('App rendering'); // Debug log

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer position="top-right" autoClose={3000} />
        <ToastProvider>
          <AuthProvider>
            <ProductProvider>
              <CartProvider>
                <FavoritesProvider>
                  <MessagingProvider>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      minHeight: '100vh',
                      backgroundColor: '#FFFFFF'
                    }}>
                      <Navbar />
                      <main style={{ flex: 1 }}>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/products" element={<ProductsPage />} />
                          <Route path="/explore" element={<ProductsPage />} />
                          <Route path="/products/:id" element={<ProductDetailsPage />} />
                          <Route path="/about" element={<AboutUsPage />} />
                          <Route path="/contact" element={<ContactUsPage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/register" element={<RegisterPage />} />
                          <Route path="/sellers" element={<SellersPage />} />
                          <Route path="/favorites" element={<FavoritesPage />} />
                          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                          <Route path="/messages" element={<ProtectedRoute><MessagingPage /></ProtectedRoute>} />
                          <Route path="/seller/:id" element={<SellerStorePage />} />
                          
                          {/* New Routes */}
                          <Route path="/deals" element={<DealsPage />} />
                          <Route path="/seller-guide" element={<SellerGuidePage />} />
                          <Route path="/faq" element={<FAQPage />} />
                          <Route path="/shipping" element={<ShippingPage />} />
                          <Route path="/returns" element={<ReturnsPage />} />
                          
                          {/* Seller Routes */}
                          <Route path="/become-seller" element={<ProtectedRoute><BecomeSeller /></ProtectedRoute>} />
                          <Route path="/seller/dashboard" element={<ProtectedSellerRoute><SellerDashboard /></ProtectedSellerRoute>} />
                          <Route path="/seller/products" element={<ProtectedSellerRoute><SellerProducts /></ProtectedSellerRoute>} />
                          <Route path="/seller/orders" element={<ProtectedSellerRoute><SellerOrders /></ProtectedSellerRoute>} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  </MessagingProvider>
                </FavoritesProvider>
              </CartProvider>
            </ProductProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App; 