'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MealType } from '@/types';

interface Cart {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

interface CartContextType {
  cart: Cart;
  addToCart: (mealType: MealType, recipeId: string) => void;
  removeFromCart: (mealType: MealType, recipeId: string) => void;
  toggleInCart: (mealType: MealType, recipeId: string) => void;
  clearCart: (mealType: MealType) => void;
  clearAll: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialCart: Cart = {
  breakfast: [],
  lunch: [],
  dinner: [],
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(initialCart);
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cookbro_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart', e);
    }
    setInitialized(true);
  }, []);

  // Save to localStorage when cart changes
  useEffect(() => {
    if (!initialized) return;
    try {
      localStorage.setItem('cookbro_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [cart, initialized]);

  const addToCart = (mealType: MealType, recipeId: string) => {
    setCart((prev) => {
      if (prev[mealType].includes(recipeId)) return prev;
      return {
        ...prev,
        [mealType]: [...prev[mealType], recipeId],
      };
    });
  };

  const removeFromCart = (mealType: MealType, recipeId: string) => {
    setCart((prev) => ({
      ...prev,
      [mealType]: prev[mealType].filter((id) => id !== recipeId),
    }));
  };

  const toggleInCart = (mealType: MealType, recipeId: string) => {
    setCart((prev) => {
      const list = prev[mealType];
      const exists = list.includes(recipeId);
      return {
        ...prev,
        [mealType]: exists ? list.filter((id) => id !== recipeId) : [...list, recipeId],
      };
    });
  };

  const clearCart = (mealType: MealType) => {
    setCart((prev) => ({
      ...prev,
      [mealType]: [],
    }));
  };

  const clearAll = () => {
    setCart(initialCart);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        toggleInCart,
        clearCart,
        clearAll,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
