import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  // Load products from localStorage when component mounts
  useEffect(() => {
    if (user?.isSeller) {
      const savedProducts = localStorage.getItem(`seller_products_${user.id}`);
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    }
  }, [user]);

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (user?.isSeller) {
      localStorage.setItem(`seller_products_${user.id}`, JSON.stringify(products));
    }
  }, [products, user]);

  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now(),
      sellerId: user.id,
      createdAt: new Date().toISOString(),
    };
    setProducts(prevProducts => [...prevProducts, newProduct]);
    return newProduct;
  };

  const updateProduct = (productId, updatedData) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId ? { ...product, ...updatedData } : product
      )
    );
  };

  const deleteProduct = (productId) => {
    setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
  };

  const getSellerProducts = () => {
    return products.filter(product => product.sellerId === user?.id);
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      getSellerProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductContext; 