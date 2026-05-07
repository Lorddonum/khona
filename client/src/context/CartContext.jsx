import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('khona_cart')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('khona_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, selectedModel = null) => {
    setCartItems((prev) => {
      const cartItemId = selectedModel ? `${product._id}-${selectedModel}` : product._id;
      const existing = prev.find((i) => i.cartItemId === cartItemId || (!i.cartItemId && i._id === product._id && !selectedModel));
      
      if (existing) {
        return prev.map((i) =>
          (i.cartItemId === cartItemId || (!i.cartItemId && i._id === product._id && !selectedModel)) 
            ? { ...i, qty: i.qty + quantity } 
            : i
        );
      }
      return [...prev, { ...product, qty: quantity, selectedModel, cartItemId }];
    });
  };

  const removeFromCart = (idOrCartItemId) => {
    setCartItems((prev) => prev.filter((i) => (i.cartItemId || i._id) !== idOrCartItemId));
  };

  const updateQty = (idOrCartItemId, qty) => {
    if (qty < 1) return removeFromCart(idOrCartItemId);
    setCartItems((prev) => prev.map((i) => ((i.cartItemId || i._id) === idOrCartItemId ? { ...i, qty } : i)));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
