export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: string;
  subcategory: string | null;
  age_range: string;
  brand: string;
  description: string;
  specifications: Record<string, string>;
  whats_included: string[];
  keywords: string[];
  images: string[];
  emoji: string;
  color: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  rating: number;
  review_count: number;
  popularity: number;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  is_active: boolean;
  created_at: string;
};

export const formatRs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-PK")}`;

export function effectivePrice(p: Pick<Product, "price" | "sale_price">) {
  return p.sale_price != null && p.sale_price < p.price ? p.sale_price : p.price;
}

export function discountPct(p: Pick<Product, "price" | "sale_price">) {
  if (p.sale_price == null || p.sale_price >= p.price) return 0;
  return Math.round(((p.price - p.sale_price) / p.price) * 100);
}

export function stockStatus(p: Pick<Product, "stock_quantity" | "low_stock_threshold">) {
  if (p.stock_quantity <= 0) return { key: "out", label: "Out of Stock", cls: "bg-destructive/10 text-destructive" } as const;
  if (p.stock_quantity <= p.low_stock_threshold)
    return { key: "low", label: `Low Stock · only ${p.stock_quantity} left`, cls: "bg-butter text-warning" } as const;
  return { key: "in", label: "In Stock", cls: "bg-success/10 text-success" } as const;
}

export const COLOR_BG: Record<string, string> = {
  blue: "bg-baby",
  pink: "bg-blush",
  lilac: "bg-lilac",
  yellow: "bg-butter",
  peach: "bg-peach",
};

export const AGES = [
  { value: "0-2", label: "0–2 Years", emoji: "🍼", bg: "bg-baby" },
  { value: "3-5", label: "3–5 Years", emoji: "🧸", bg: "bg-blush" },
  { value: "6-8", label: "6–8 Years", emoji: "🧩", bg: "bg-butter" },
  { value: "9-12", label: "9–12 Years", emoji: "🎮", bg: "bg-lilac" },
  { value: "Teens", label: "13+ Years", emoji: "🎧", bg: "bg-peach" },
];

export const CATEGORIES = [
  { name: "Musical Toys", emoji: "🎵", bg: "bg-blush" },
  { name: "Building Blocks", emoji: "🧱", bg: "bg-butter" },
  { name: "Play & Tent House", emoji: "⛺", bg: "bg-baby" },
  { name: "Collectible Toys", emoji: "🦸", bg: "bg-peach" },
  { name: "Educational Toys", emoji: "🧠", bg: "bg-lilac" },
  { name: "Diecast Models", emoji: "🏎️", bg: "bg-baby" },
  { name: "Trending Toys", emoji: "🔥", bg: "bg-blush" },
  { name: "Toy Guns", emoji: "🎯", bg: "bg-peach" },
  { name: "Sports", emoji: "🏀", bg: "bg-baby" },
  { name: "RC Toys", emoji: "🎮", bg: "bg-lilac" },
  { name: "Makeup & Beauty Sets", emoji: "💄", bg: "bg-blush" },
  { name: "DIY Toys", emoji: "🎨", bg: "bg-butter" },
];

export const ORDER_STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Order Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting Payment",
  placed: "Order Placed",
  confirmed: "Order Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_LABEL: Record<string, string> = {
  cod_pending: "Pending · Cash on Delivery",
  awaiting_payment: "Awaiting card payment",
  paid: "Paid",
  failed: "Payment failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function waLink(number: string, text: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
