"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export type CartPromo = {
  title: string;
  discountLabel: string;
  percent: number;
  productIds: string[];
};

type CartContextValue = {
  items: CartItem[];
  promo: CartPromo | null;
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  applyCombo: (
    products: Omit<CartItem, "quantity">[],
    promo: Omit<CartPromo, "productIds"> & { productIds?: string[] }
  ) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "mk-gourmet-cart-v3";

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(
  a: Pick<CartItem, "productId" | "variantId">,
  b: Pick<CartItem, "productId" | "variantId">
) {
  return a.productId === b.productId && (a.variantId || "") === (b.variantId || "");
}

function parsePercent(label: string, fallback = 0) {
  const match = label.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return fallback;
  return Number(match[1].replace(",", ".")) || fallback;
}

function loadState(): { items: CartItem[]; promo: CartPromo | null } {
  if (typeof window === "undefined") return { items: [], promo: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], promo: null };
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((item: CartItem) => ({
            productId: String(item.productId || ""),
            variantId: item.variantId ? String(item.variantId) : undefined,
            name: String(item.name || ""),
            price: Number(item.price) || 0,
            image: String(item.image || ""),
            quantity: Math.max(1, Number(item.quantity) || 1),
          }))
          .filter((item: CartItem) => item.productId && item.name)
      : [];
    const promo =
      parsed.promo && typeof parsed.promo === "object"
        ? {
            title: String(parsed.promo.title || ""),
            discountLabel: String(parsed.promo.discountLabel || ""),
            percent: Number(parsed.promo.percent) || 0,
            productIds: Array.isArray(parsed.promo.productIds)
              ? parsed.promo.productIds.map(String)
              : [],
          }
        : null;
    return { items, promo };
  } catch {
    return { items: [], promo: null };
  }
}

function calcDiscount(items: CartItem[], promo: CartPromo | null) {
  if (!promo || promo.percent <= 0 || promo.productIds.length === 0) return 0;

  let comboValue = 0;
  for (const productId of promo.productIds) {
    const item = items.find((entry) => entry.productId === productId);
    if (!item || item.quantity < 1) return 0;
    comboValue += item.price;
  }

  return (comboValue * promo.percent) / 100;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState<CartPromo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const state = loadState();
    setItems(state.items);
    setPromo(state.promo);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, promo })
    );
  }, [items, promo, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      const qty = Math.max(1, quantity);
      setItems((current) => {
        const existing = current.find((entry) => sameLine(entry, item));
        if (existing) {
          return current.map((entry) =>
            sameLine(entry, item)
              ? { ...entry, quantity: entry.quantity + qty }
              : entry
          );
        }
        return [...current, { ...item, quantity: qty }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((current) =>
      current.filter((item) => !sameLine(item, { productId, variantId }))
    );
    setPromo((current) => {
      if (!current) return null;
      if (!current.productIds.includes(productId)) return current;
      return null;
    });
  }, []);

  const setQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      const next = Math.max(1, quantity);
      setItems((current) =>
        current.map((item) =>
          sameLine(item, { productId, variantId })
            ? { ...item, quantity: next }
            : item
        )
      );
    },
    []
  );

  const applyCombo = useCallback(
    (
      products: Omit<CartItem, "quantity">[],
      nextPromo: Omit<CartPromo, "productIds"> & { productIds?: string[] }
    ) => {
      const unique = products.filter(
        (product, index, list) =>
          list.findIndex((entry) => entry.productId === product.productId) ===
          index
      );

      setItems((current) => {
        const next = [...current];
        for (const product of unique) {
          const index = next.findIndex(
            (entry) => entry.productId === product.productId
          );
          if (index >= 0) {
            next[index] = {
              ...next[index],
              ...product,
              quantity: 1,
            };
          } else {
            next.push({ ...product, quantity: 1 });
          }
        }
        return next;
      });

      setPromo({
        title: nextPromo.title,
        discountLabel: nextPromo.discountLabel,
        percent:
          nextPromo.percent || parsePercent(nextPromo.discountLabel, 0),
        productIds:
          nextPromo.productIds || unique.map((product) => product.productId),
      });
      setIsOpen(true);
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setPromo(null);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const discount = useMemo(
    () => calcDiscount(items, promo),
    [items, promo]
  );
  const total = Math.max(0, subtotal - discount);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      promo,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      discount,
      total,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem,
      setQuantity,
      applyCombo,
      clearCart,
    }),
    [
      items,
      promo,
      subtotal,
      discount,
      total,
      isOpen,
      addItem,
      removeItem,
      setQuantity,
      applyCombo,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
}

export { parsePercent };
