import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Product } from "./format";
import { computeQuote, getUserFromRequest, newOrderNumber, normPhone, recordCouponUse } from "./orders.server";
import { getPaymentProvider } from "./payments/provider.server";

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const { data, error } = await db.from("products").select("*").eq("is_active", true).order("popularity", { ascending: false });
  if (error) throw new Error("Could not load products");
  return (data ?? []) as unknown as Product[];
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: p } = await db.from("products").select("*").eq("slug", data.slug).eq("is_active", true).maybeSingle();
    return (p ?? null) as unknown as Product | null;
  });

export const getStoreConfig = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  const [{ data: settings }, { data: cities }, provider] = await Promise.all([
    db.from("store_settings").select("*").eq("id", 1).single(),
    db.from("city_rates").select("*").order("city"),
    getPaymentProvider(),
  ]);
  return {
    deliveryFee: Number(settings?.delivery_fee ?? 0),
    freeDeliveryThreshold: settings?.free_delivery_threshold != null ? Number(settings.free_delivery_threshold) : null,
    deliveryEnabled: settings?.delivery_enabled ?? true,
    codEnabled: settings?.cod_enabled ?? true,
    whatsapp: settings?.whatsapp_number && settings.whatsapp_number !== "923000000000" ? settings.whatsapp_number : "923002552414",
    cities: (cities ?? []).map((c) => ({ city: c.city, fee: Number(c.fee), available: c.available })),
    cardEnabled: !!provider,
    cardProvider: provider?.label ?? null,
  };
});

const itemsSchema = z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).max(50);

export const quoteCart = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      items: itemsSchema,
      city: z.string().max(80).optional(),
      couponCode: z.string().max(40).optional().nullable(),
      email: z.string().max(200).optional(),
      phone: z.string().max(30).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const user = await getUserFromRequest(getRequestHeader("authorization"));
    return computeQuote({ ...data, userId: user?.id ?? null, email: data.email || user?.email || undefined });
  });

const checkoutSchema = z.object({
  items: itemsSchema.min(1),
  customer: z.object({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^(\+?92|0)3\d{2}[- ]?\d{7}$/, "Enter a valid Pakistani mobile number"),
    email: z.string().trim().email().max(200),
    address: z.string().trim().min(8).max(400),
    city: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().max(10).optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  }),
  couponCode: z.string().max(40).optional().nullable(),
  paymentMethod: z.enum(["cod", "card"]),
  idempotencyKey: z.string().min(10).max(80),
  origin: z.string().url(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => checkoutSchema.parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const user = await getUserFromRequest(getRequestHeader("authorization"));

    // Duplicate-click protection
    const { data: dup } = await db.from("orders").select("order_number,access_token,payment_method,payment_status").eq("idempotency_key", data.idempotencyKey).maybeSingle();
    if (dup) {
      if (dup.payment_method === "card" && dup.payment_status !== "paid") {
        return { ok: false as const, error: "This checkout was already started. Please refresh and try again." };
      }
      return { ok: true as const, orderNumber: dup.order_number, token: dup.access_token, redirectUrl: null };
    }

    const q = await computeQuote({ items: data.items, city: data.customer.city, couponCode: data.couponCode, userId: user?.id, email: data.customer.email, phone: data.customer.phone });
    if (q.issues.length) return { ok: false as const, error: q.issues.join(" ") };
    if (!q.deliveryAvailable) return { ok: false as const, error: `Sorry, we don't deliver to ${data.customer.city} right now.` };
    if (data.couponCode && q.couponError) return { ok: false as const, error: q.couponError };

    const { data: settings } = await db.from("store_settings").select("*").eq("id", 1).single();
    let provider = null;
    if (data.paymentMethod === "card") {
      provider = await getPaymentProvider();
      if (!provider) return { ok: false as const, error: "Card payments are not available yet. Please choose Cash on Delivery." };
    } else if (settings && !settings.cod_enabled) {
      return { ok: false as const, error: "Cash on Delivery is currently unavailable." };
    }

    const isCard = data.paymentMethod === "card";
    let order: { id: string; order_number: string; access_token: string } | null = null;
    for (let i = 0; i < 5 && !order; i++) {
      const { data: row, error } = await db
        .from("orders")
        .insert({
          order_number: newOrderNumber(),
          user_id: user?.id ?? null,
          customer_name: data.customer.fullName,
          phone: normPhone(data.customer.phone),
          email: data.customer.email.toLowerCase(),
          address: data.customer.address,
          city: data.customer.city,
          postal_code: data.customer.postalCode || null,
          notes: data.customer.notes || null,
          subtotal: q.subtotal,
          delivery_fee: q.deliveryFee,
          discount: q.discount,
          total: q.total,
          coupon_code: q.coupon?.code ?? null,
          payment_method: data.paymentMethod,
          payment_status: isCard ? "awaiting_payment" : "cod_pending",
          payment_provider: provider?.id ?? null,
          status: isCard ? "pending_payment" : "placed",
          idempotency_key: data.idempotencyKey,
        })
        .select("id,order_number,access_token")
        .single();
      if (row) order = row;
      else if (error && !error.message.includes("order_number")) {
        if (error.message.includes("idempotency")) return { ok: false as const, error: "Order already submitted." };
        console.error(error);
        return { ok: false as const, error: "Could not create your order. Please try again." };
      }
    }
    if (!order) return { ok: false as const, error: "Could not create your order." };

    await db.from("order_items").insert(
      q.lines.map((l) => ({ order_id: order!.id, product_id: l.productId, product_name: l.name, sku: l.sku, unit_price: l.unitPrice, quantity: l.quantity, line_total: l.lineTotal })),
    );

    if (!isCard) {
      if ((settings?.cod_stock_policy ?? "on_place") === "on_place") {
        const { error } = await db.rpc("deduct_order_stock", { _order_id: order.id });
        if (error) {
          await db.from("orders").delete().eq("id", order.id);
          return { ok: false as const, error: "Sorry, an item just went out of stock. Please review your cart." };
        }
      }
      await db.from("order_status_history").insert({ order_id: order.id, status: "placed", note: "Cash on Delivery order placed" });
      await recordCouponUse({ id: order.id, coupon_code: q.coupon?.code ?? null, user_id: user?.id ?? null, email: data.customer.email, phone: data.customer.phone });
      return { ok: true as const, orderNumber: order.order_number, token: order.access_token, redirectUrl: null };
    }

    try {
      const session = await provider!.createSession({
        orderNumber: order.order_number,
        amount: q.total,
        customerEmail: data.customer.email,
        customerPhone: data.customer.phone,
        successUrl: `${data.origin}/checkout/return?order=${order.order_number}&t=${order.access_token}`,
        cancelUrl: `${data.origin}/checkout?cancelled=1`,
      });
      await db.from("orders").update({ payment_reference: session.reference }).eq("id", order.id);
      return { ok: true as const, orderNumber: order.order_number, token: order.access_token, redirectUrl: session.redirectUrl };
    } catch {
      await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      return { ok: false as const, error: "We couldn't reach the payment gateway. No money was taken — please try again." };
    }
  });

export const retryPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ orderNumber: z.string().max(20), token: z.string().uuid(), origin: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: o } = await db.from("orders").select("*").eq("order_number", data.orderNumber).eq("access_token", data.token).maybeSingle();
    if (!o || o.payment_method !== "card" || o.payment_status === "paid") return { ok: false as const, error: "This order can't be paid again." };
    const provider = await getPaymentProvider();
    if (!provider) return { ok: false as const, error: "Card payments are not available right now." };
    try {
      const s = await provider.createSession({
        orderNumber: o.order_number, amount: Number(o.total), customerEmail: o.email, customerPhone: o.phone,
        successUrl: `${data.origin}/checkout/return?order=${o.order_number}&t=${o.access_token}`,
        cancelUrl: `${data.origin}/checkout?cancelled=1`,
      });
      await db.from("orders").update({ payment_status: "awaiting_payment", payment_reference: s.reference }).eq("id", o.id);
      return { ok: true as const, redirectUrl: s.redirectUrl };
    } catch {
      return { ok: false as const, error: "Payment gateway unavailable. Please try again shortly." };
    }
  });

async function loadOrderDetail(orderId: string) {
  const db = await admin();
  const [{ data: items }, { data: history }, { data: reward }] = await Promise.all([
    db.from("order_items").select("product_name,sku,unit_price,quantity,line_total").eq("order_id", orderId),
    db.from("order_status_history").select("status,note,created_at").eq("order_id", orderId).order("created_at"),
    db.from("coupons").select("code,expires_at").eq("source_order_id", orderId).maybeSingle(),
  ]);
  return { items: items ?? [], history: history ?? [], reward };
}

function publicOrder(o: Record<string, unknown>) {
  const { idempotency_key: _i, access_token: _a, stock_deducted: _s, payment_reference, ...rest } = o as Record<string, unknown> & { payment_reference?: string };
  return { ...rest, has_payment_reference: !!payment_reference } as {
    id: string; order_number: string; customer_name: string; phone: string; email: string; address: string; city: string;
    postal_code: string | null; notes: string | null; subtotal: number; delivery_fee: number; discount: number; total: number;
    coupon_code: string | null; payment_method: string; payment_status: string; status: string; created_at: string; has_payment_reference: boolean;
  };
}

export const getOrderByToken = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ orderNumber: z.string().max(20), token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: o } = await db.from("orders").select("*").eq("order_number", data.orderNumber.toUpperCase()).eq("access_token", data.token).maybeSingle();
    if (!o) return null;
    const d = await loadOrderDetail(o.id);
    return { order: publicOrder(o), ...d };
  });

export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ orderNumber: z.string().trim().min(4).max(20), phone: z.string().trim().min(7).max(20) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: o } = await db.from("orders").select("*").eq("order_number", data.orderNumber.toUpperCase()).eq("phone", normPhone(data.phone)).maybeSingle();
    if (!o) return null;
    const d = await loadOrderDetail(o.id);
    return { order: publicOrder(o), items: d.items, history: d.history, reward: null };
  });
