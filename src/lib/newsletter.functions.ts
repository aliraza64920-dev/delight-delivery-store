import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const inputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(254, "That email address is too long"),
  source: z.string().trim().max(40).optional(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }) => {
    const db = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { error } = await db.from("newsletter_subscribers").insert({
      email: data.email,
      source: data.source ?? "site_band",
    });
    // 23505 = this email is already on the list; that is still a success for the visitor.
    if (error && error.code !== "23505") throw new Error("Could not save your email. Please try again.");
    return { ok: true, already: error?.code === "23505" };
  });
