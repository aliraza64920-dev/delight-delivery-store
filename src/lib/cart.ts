import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { effectivePrice, type Product } from "./format";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  emoji: string;
  color: string;
  image: string | null;
  stock: number;
  quantity: number;
};

function createStore<T>(key: string, initial: T) {
  let value = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) value = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  };
  return {
    get: () => {
      load();
      return value;
    },
    set: (next: T) => {
      load();
      value = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    initial,
  };
}

const cartStore = createStore<CartItem[]>("pt-cart", []);
const couponStore = createStore<string | null>("pt-coupon", null);
const wishStore = createStore<string[]>("pt-wishlist", []);

export function useCart() {
  const items = useSyncExternalStore(cartStore.subscribe, cartStore.get, () => cartStore.initial);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return { items, count };
}
export const useCoupon = () => useSyncExternalStore(couponStore.subscribe, couponStore.get, () => null);
export const setCoupon = (c: string | null) => couponStore.set(c);

/** Returns false if limited by stock. */
export function addToCart(p: Product, qty = 1): { ok: boolean; message: string } {
  if (p.stock_quantity <= 0) return { ok: false, message: `${p.name} is out of stock` };
  const items = [...cartStore.get()];
  const i = items.findIndex((x) => x.productId === p.id);
  const current = i >= 0 ? (items[i]?.quantity ?? 0) : 0;
  const next = Math.min(current + qty, p.stock_quantity);
  const entry: CartItem = {
    productId: p.id, slug: p.slug, name: p.name, price: effectivePrice(p), emoji: p.emoji, color: p.color,
    image: p.images[0] ?? null, stock: p.stock_quantity, quantity: next,
  };
  if (i >= 0) items[i] = entry;
  else items.push(entry);
  cartStore.set(items);
  if (next < current + qty) return { ok: false, message: `Only ${p.stock_quantity} available — cart updated` };
  return { ok: true, message: `${p.name} added to cart` };
}

export function setQty(productId: string, qty: number) {
  const items = cartStore.get()
    .map((x) => (x.productId === productId ? { ...x, quantity: Math.max(1, Math.min(qty, x.stock)) } : x));
  cartStore.set(items);
}
export function syncStock(productId: string, stock: number) {
  cartStore.set(cartStore.get().map((x) => (x.productId === productId ? { ...x, stock, quantity: Math.min(x.quantity, Math.max(stock, 1)) } : x)));
}
export const removeFromCart = (productId: string) => cartStore.set(cartStore.get().filter((x) => x.productId !== productId));
export const clearCart = () => {
  cartStore.set([]);
  couponStore.set(null);
};

// ---------- Wishlist ----------
export const useWishlist = () => useSyncExternalStore(wishStore.subscribe, wishStore.get, () => wishStore.initial);

export async function toggleWishlist(productId: string, userId: string | null) {
  const list = wishStore.get();
  const has = list.includes(productId);
  wishStore.set(has ? list.filter((x) => x !== productId) : [...list, productId]);
  if (userId) {
    if (has) await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
    else await supabase.from("wishlists").insert({ user_id: userId, product_id: productId });
  }
  return !has;
}

/** Merge the device wishlist with the account wishlist after sign-in. */
export async function syncWishlist(userId: string) {
  const { data } = await supabase.from("wishlists").select("product_id").eq("user_id", userId);
  const remote = (data ?? []).map((r) => r.product_id);
  const local = wishStore.get();
  const missing = local.filter((id) => !remote.includes(id));
  if (missing.length) await supabase.from("wishlists").insert(missing.map((product_id) => ({ user_id: userId, product_id })));
  wishStore.set([...new Set([...remote, ...local])]);
}
