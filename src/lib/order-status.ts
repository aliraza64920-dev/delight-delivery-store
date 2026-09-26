export const ORDER_STATUSES = [
  { value: "placed", label: "New" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const statusLabel = (s: string) =>
  ORDER_STATUSES.find((x) => x.value === s)?.label ?? (s === "pending_payment" ? "Awaiting payment" : s === "out_for_delivery" ? "Out for delivery" : s);

export const payLabel = (s: string) =>
  s === "cod_pending" || s === "awaiting_payment" ? "Pending" : s === "paid" ? "Paid" : s === "refunded" ? "Refunded" : s === "failed" ? "Failed" : s === "cancelled" ? "Cancelled" : s;

export const payKey = (s: string) => (s === "cod_pending" || s === "awaiting_payment" ? "pending" : s);

export const methodLabel = (m: string) => (m === "cod" ? "Cash on Delivery" : m === "card" ? "Card" : m);

export const STATUS_TONE: Record<string, string> = {
  placed: "bg-primary/15 text-primary",
  confirmed: "bg-accent text-accent-foreground",
  processing: "bg-secondary text-secondary-foreground",
  packed: "bg-secondary text-secondary-foreground",
  shipped: "bg-primary/10 text-foreground",
  delivered: "bg-emerald-500/15 text-emerald-700",
  cancelled: "bg-destructive/15 text-destructive",
};
