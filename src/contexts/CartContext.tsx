import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'vetmedix-cart';

function readStoredCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  console.log('CartProvider naturally mounted');

  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(item => item.id !== id));
      return;
    }
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [items]
  );

  const value = useMemo<CartContextType>(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalAmount,
  }), [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a <CartProvider>');
  }
  return context;
}
