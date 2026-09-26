import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUSES = ["placed", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"] as const;
const PAY = ["pending", "paid", "refunded"] as const;

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: unknown }> }; userId: string };
async function adminDb(context: Ctx) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), status: z.enum(STATUSES), note: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await adminDb(context as unknown as Ctx);
    const { data: o } = await db.from("orders").select("*").eq("id", data.orderId).single();
    if (!o) throw new Error("Order not found");
    if (o.status === data.status) return { ok: true, error: null };
    if (o.payment_method === "card" && o.payment_status !== "paid" && data.status !== "cancelled")
      return { ok: false, error: "This card order hasn't been paid yet." };

    if (data.status === "cancelled") {
      await db.rpc("restore_order_stock", { _order_id: o.id });
    } else if (!o.stock_deducted) {
      const { error } = await db.rpc("deduct_order_stock", { _order_id: o.id });
      if (error) return { ok: false, error: "Not enough stock to confirm this order." };
    }
    await db.from("orders").update({ status: data.status, updated_at: new Date().toISOString(), ...(data.status === "cancelled" && o.payment_status === "cod_pending" ? { payment_status: "cancelled" } : {}), ...(data.status === "delivered" && o.payment_method === "cod" ? { payment_status: "paid" } : {}) }).eq("id", o.id);
    await db.from("order_status_history").insert({ order_id: o.id, status: data.status, note: data.note ?? null });
    return { ok: true, error: null };
  });

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), paymentStatus: z.enum(PAY) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await adminDb(context as unknown as Ctx);
    const { data: o } = await db.from("orders").select("id,payment_method").eq("id", data.orderId).single();
    if (!o) throw new Error("Order not found");
    const value = data.paymentStatus === "pending" ? (o.payment_method === "cod" ? "cod_pending" : "awaiting_payment") : data.paymentStatus;
    await db.from("orders").update({ payment_status: value, updated_at: new Date().toISOString() }).eq("id", o.id);
    await db.from("order_status_history").insert({ order_id: o.id, status: `payment_${data.paymentStatus}`, note: `Payment marked ${data.paymentStatus}` });
    return { ok: true };
  });

export const listAdminOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ q: z.string().max(100).optional(), status: z.string().max(30).optional(), payment: z.string().max(30).optional(), from: z.string().max(20).optional(), to: z.string().max(20).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await adminDb(context as unknown as Ctx);
    let q = db.from("orders").select("id,order_number,customer_name,phone,total,payment_method,payment_status,status,created_at").order("created_at", { ascending: false }).limit(500);
    if (data.status) q = q.eq("status", data.status);
    if (data.payment === "pending") q = q.in("payment_status", ["cod_pending", "awaiting_payment"]);
    else if (data.payment) q = q.eq("payment_status", data.payment);
    if (data.from) q = q.gte("created_at", `${data.from}T00:00:00+05:00`);
    if (data.to) q = q.lte("created_at", `${data.to}T23:59:59+05:00`);
    const term = data.q?.trim().replace(/[,()%*]/g, "");
    if (term) {
      const digits = term.replace(/\D/g, "").replace(/^92/, "0");
      q = q.or([`order_number.ilike.%${term}%`, `customer_name.ilike.%${term}%`, digits.length >= 3 ? `phone.ilike.%${digits}%` : null].filter(Boolean).join(","));
    }
    const { data: rows, error } = await q;
    if (error) throw new Error("Could not load orders");
    return rows ?? [];
  });

export const getAdminOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderNumber: z.string().max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await adminDb(context as unknown as Ctx);
    const { data: o } = await db.from("orders").select("*").eq("order_number", data.orderNumber.toUpperCase()).maybeSingle();
    if (!o) return null;
    const [{ data: items }, { data: history }, { data: label }] = await Promise.all([
      db.from("order_items").select("id,product_id,product_name,sku,unit_price,quantity,line_total, products(images,emoji,color)").eq("order_id", o.id),
      db.from("order_status_history").select("status,note,created_at").eq("order_id", o.id).order("created_at"),
      db.from("order_labels").select("*").eq("order_id", o.id).maybeSingle(),
    ]);
    const { idempotency_key: _i, access_token: _a, ...order } = o;
    return { order, items: (items ?? []) as unknown as { id: string; product_id: string | null; product_name: string; sku: string; unit_price: number; quantity: number; line_total: number; products: { images: string[]; emoji: string; color: string } | null }[], history: history ?? [], label };
  });

export const recordLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), action: z.enum(["generate", "print", "download"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await adminDb(context as unknown as Ctx);
    const { data: existing } = await db.from("order_labels").select("*").eq("order_id", data.orderId).maybeSingle();
    if (!existing) {
      await db.from("order_labels").insert({ order_id: data.orderId });
    }
    if (data.action !== "generate") {
      const cur = existing ?? { print_count: 0, download_count: 0 };
      await db.from("order_labels").update(
        data.action === "print"
          ? { print_count: cur.print_count + 1, last_printed_at: new Date().toISOString() }
          : { download_count: cur.download_count + 1 },
      ).eq("order_id", data.orderId);
    }
    const { data: label } = await db.from("order_labels").select("*").eq("order_id", data.orderId).single();
    return label;
  });

export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await adminDb(context as unknown as Ctx);
    const { data: rows } = await db.from("orders").select("status,payment_status,payment_method,total");
    const list = rows ?? [];
    const by: Record<string, number> = {};
    let codPending = 0, revenue = 0;
    for (const r of list) {
      by[r.status] = (by[r.status] ?? 0) + 1;
      if (r.payment_status === "cod_pending" && r.status !== "cancelled") codPending += Number(r.total);
      if (r.payment_status === "paid") revenue += Number(r.total);
    }
    return { total: list.length, by, codPending, revenue };
  });
