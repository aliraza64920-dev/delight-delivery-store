import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type QuoteItem = { productId: string; quantity: number };
export type Quote = {
  lines: { productId: string; name: string; sku: string; unitPrice: number; quantity: number; lineTotal: number; stock: number }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  coupon: { id: string; code: string } | null;
  couponError: string | null;
  deliveryAvailable: boolean;
  issues: string[];
};

export async function getUserFromRequest(authHeader: string | null | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  if (token.split(".").length !== 3) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user ?? null;
}

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
export const normPhone = (s?: string | null) => (s ?? "").replace(/\D/g, "").replace(/^92/, "0");

/** Recalculates everything from the database. Never trusts browser prices. */
export async function computeQuote(opts: {
  items: QuoteItem[];
  city?: string;
  couponCode?: string | null;
  userId?: string | null;
  email?: string;
  phone?: string;
}): Promise<Quote> {
  const issues: string[] = [];
  const ids = [...new Set(opts.items.map((i) => i.productId))];
  const { data: products } = ids.length
    ? await supabaseAdmin.from("products").select("id,name,sku,price,sale_price,stock_quantity,is_active").in("id", ids)
    : { data: [] };
  const lines: Quote["lines"] = [];
  for (const it of opts.items) {
    const p = products?.find((x) => x.id === it.productId);
    if (!p || !p.is_active) {
      issues.push("A product in your cart is no longer available.");
      continue;
    }
    const unit = p.sale_price != null && Number(p.sale_price) < Number(p.price) ? Number(p.sale_price) : Number(p.price);
    let qty = Math.max(1, Math.floor(it.quantity));
    if (p.stock_quantity <= 0) {
      issues.push(`${p.name} is out of stock.`);
      continue;
    }
    if (qty > p.stock_quantity) {
      issues.push(`Only ${p.stock_quantity} × ${p.name} available.`);
      qty = p.stock_quantity;
    }
    lines.push({ productId: p.id, name: p.name, sku: p.sku, unitPrice: unit, quantity: qty, lineTotal: unit * qty, stock: p.stock_quantity });
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  const { data: settings } = await supabaseAdmin.from("store_settings").select("*").eq("id", 1).single();
  let deliveryFee = Number(settings?.delivery_fee ?? 0);
  let deliveryAvailable = settings?.delivery_enabled ?? true;
  if (opts.city) {
    const { data: rate } = await supabaseAdmin.from("city_rates").select("*").ilike("city", opts.city.trim()).maybeSingle();
    if (rate) {
      deliveryFee = Number(rate.fee);
      if (!rate.available) deliveryAvailable = false;
    }
  }
  if (settings?.free_delivery_threshold != null && subtotal >= Number(settings.free_delivery_threshold)) deliveryFee = 0;
  if (!lines.length) deliveryFee = 0;

  let discount = 0;
  let coupon: Quote["coupon"] = null;
  let couponError: string | null = null;
  if (opts.couponCode) {
    const res = await evaluateCoupon(opts.couponCode, subtotal, opts);
    if ("error" in res) couponError = res.error;
    else {
      discount = res.discount;
      coupon = { id: res.id, code: res.code };
    }
  }
  const total = Math.max(0, subtotal - discount + deliveryFee);
  return { lines, subtotal, deliveryFee, discount, total, coupon, couponError, deliveryAvailable, issues };
}

async function evaluateCoupon(
  code: string,
  subtotal: number,
  who: { userId?: string | null; email?: string; phone?: string },
): Promise<{ id: string; code: string; discount: number } | { error: string }> {
  const { data: c } = await supabaseAdmin.from("coupons").select("*").ilike("code", code.trim()).maybeSingle();
  if (!c || !c.is_active) return { error: "This coupon code isn't valid." };
  if (c.expires_at && new Date(c.expires_at) < new Date()) return { error: "This coupon has expired." };
  if (c.usage_limit != null && c.used_count >= c.usage_limit) return { error: "This coupon has already been used." };
  if (subtotal < Number(c.min_order)) return { error: `Minimum order of Rs. ${Number(c.min_order).toLocaleString()} required.` };
  if (c.assigned_user_id || c.assigned_email || c.assigned_phone) {
    const ok =
      (c.assigned_user_id && who.userId === c.assigned_user_id) ||
      (c.assigned_email && who.email && norm(who.email) === norm(c.assigned_email)) ||
      (c.assigned_phone && who.phone && normPhone(who.phone) === normPhone(c.assigned_phone));
    if (!ok) {
      if (!who.userId && !who.email && !who.phone) return { error: "Enter your email/phone at checkout to use this personal coupon." };
      return { error: "This coupon belongs to a different customer." };
    }
  }
  if (c.per_customer_limit != null && (who.userId || who.email || who.phone)) {
    const ors = [
      who.userId ? `user_id.eq.${who.userId}` : null,
      who.email ? `email.eq.${norm(who.email)}` : null,
      who.phone ? `phone.eq.${normPhone(who.phone)}` : null,
    ].filter(Boolean).join(",");
    const { count } = await supabaseAdmin.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", c.id).or(ors);
    if ((count ?? 0) >= c.per_customer_limit) return { error: "You've already used this coupon." };
  }
  let discount = c.discount_type === "percent" ? Math.round((subtotal * Number(c.discount_value)) / 100) : Number(c.discount_value);
  if (c.max_discount != null) discount = Math.min(discount, Number(c.max_discount));
  discount = Math.min(discount, subtotal);
  return { id: c.id, code: c.code, discount };
}

export async function recordCouponUse(order: { id: string; coupon_code: string | null; user_id: string | null; email: string; phone: string }) {
  if (!order.coupon_code) return;
  const { data: c } = await supabaseAdmin.from("coupons").select("id").ilike("code", order.coupon_code).maybeSingle();
  if (!c) return;
  await supabaseAdmin.rpc("redeem_coupon", { _coupon_id: c.id });
  await supabaseAdmin.from("coupon_redemptions").insert({ coupon_id: c.id, order_id: order.id, user_id: order.user_id, email: norm(order.email), phone: normPhone(order.phone) });
}

function randomCode(n: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
export const newOrderNumber = () => `PT-${randomCode(6)}`;

/** Called only from a verified payment webhook. Idempotent. */
export async function finalizeCardPayment(orderNumber: string, outcome: "paid" | "failed" | "cancelled", reference: string) {
  const { data: order } = await supabaseAdmin.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  if (!order || order.payment_method !== "card") return;
  if (order.payment_status === "paid") return; // already done
  if (outcome !== "paid") {
    await supabaseAdmin.from("orders").update({ payment_status: outcome === "cancelled" ? "awaiting_payment" : "failed", payment_reference: reference, updated_at: new Date().toISOString() }).eq("id", order.id);
    return;
  }
  try {
    await supabaseAdmin.rpc("deduct_order_stock", { _order_id: order.id });
  } catch (e) {
    console.error("Stock deduction failed after payment", orderNumber, e);
  }
  await supabaseAdmin.from("orders").update({ payment_status: "paid", status: "placed", payment_reference: reference, updated_at: new Date().toISOString() }).eq("id", order.id);
  await supabaseAdmin.from("order_status_history").insert({ order_id: order.id, status: "placed", note: "Card payment received" });
  await recordCouponUse(order);
  // Loyalty: one-time 10% coupon for the NEXT order, only after a verified paid card order.
  const { data: existing } = await supabaseAdmin.from("coupons").select("id").eq("source_order_id", order.id).maybeSingle();
  if (!existing) {
    await supabaseAdmin.from("coupons").insert({
      code: `CARD10-${randomCode(6)}`,
      discount_type: "percent",
      discount_value: 10,
      usage_limit: 1,
      per_customer_limit: 1,
      is_reward: true,
      source_order_id: order.id,
      assigned_user_id: order.user_id,
      assigned_email: norm(order.email),
      assigned_phone: normPhone(order.phone),
      expires_at: new Date(Date.now() + 90 * 864e5).toISOString(),
      description: "Card payment bonus — 10% off your next order",
    });
  }
}
