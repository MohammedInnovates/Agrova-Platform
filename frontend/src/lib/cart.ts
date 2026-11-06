"use client";

import { useState, useEffect } from "react";
import type { Product } from "./api";

export type CartItem = {
  product_id: string;
  product_name: string;
  product_brand: string | null;
  product_unit: string;
  quantity: number;
  unit_kind: "bulk" | "local";
  unit_price_kobo: number;
  image_url: string | null;
  category: string;
};

const CART_KEY = "agrova_cart";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: CartItem) {
  const cart = readCart();
  const existing = cart.find(
    (i) => i.product_id === item.product_id && i.unit_kind === item.unit_kind
  );
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  writeCart(cart);
}

export function removeFromCart(product_id: string, unit_kind: "bulk" | "local") {
  const cart = readCart();
  const newCart = cart.filter(
    (i) => !(i.product_id === product_id && i.unit_kind === unit_kind)
  );
  writeCart(newCart);
}

export function updateQuantity(
  product_id: string,
  unit_kind: "bulk" | "local",
  quantity: number
) {
  const cart = readCart();
  const item = cart.find(
    (i) => i.product_id === product_id && i.unit_kind === unit_kind
  );
  if (item) {
    if (quantity <= 0) {
      removeFromCart(product_id, unit_kind);
      return;
    }
    item.quantity = quantity;
    writeCart(cart);
  }
}

export function clearCart() {
  writeCart([]);
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCart(readCart());

    const handler = () => {
      // Force a completely new array reference to guarantee React re-renders
      const freshCart = [...readCart()];
      setCart(freshCart);
    };
    
    window.addEventListener("cart-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cart-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  // Calculate total directly inside the return to ensure it's always fresh
  const totalKobo = cart.reduce((sum, item) => sum + (item.unit_price_kobo * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    mounted,
    totalKobo,
    itemCount,
  };
}

export function computeUnitPrice(
  product: Product,
  unit_kind: "bulk" | "local"
): number | null {
  if (unit_kind === "bulk") return product.bulk_unit_price_kobo;
  if (!product.local_unit_multiplier) return null;
  return Math.round(product.bulk_unit_price_kobo * product.local_unit_multiplier);
}