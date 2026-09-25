import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STATUSES = ["placed", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"] as const;

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid(), status: z.enum(STATUSES), note: z.string().max(300).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: o } = await db.from("orders").select("*").eq("id", data.orderId).single();
    if (!o) throw new Error("Order not found");
    if (o.payment_method === "card" && o.payment_status !== "paid" && data.status !== "cancelled")
      return { ok: false, error: "This card order hasn't been paid yet." };

    if (data.status === "cancelled") {
      await db.rpc("restore_order_stock", { _order_id: o.id });
    } else if (!o.stock_deducted) {
      // COD with "on_confirm" policy: deduct when the order moves forward.
      const { error } = await db.rpc("deduct_order_stock", { _order_id: o.id });
      if (error) return { ok: false, error: "Not enough stock to confirm this order." };
    }
    await db.from("orders").update({ status: data.status, updated_at: new Date().toISOString(), ...(data.status === "cancelled" && o.payment_status === "cod_pending" ? { payment_status: "cancelled" } : {}), ...(data.status === "delivered" && o.payment_method === "cod" ? { payment_status: "paid" } : {}) }).eq("id", o.id);
    await db.from("order_status_history").insert({ order_id: o.id, status: data.status, note: data.note ?? null });
    return { ok: true, error: null };
  });
