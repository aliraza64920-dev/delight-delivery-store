CREATE TABLE public.order_labels (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  print_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  last_printed_at timestamptz,
  courier text,
  courier_tracking text
);
GRANT SELECT ON public.order_labels TO authenticated;
GRANT ALL ON public.order_labels TO service_role;
ALTER TABLE public.order_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read labels" ON public.order_labels FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uniq ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_uniq ON public.orders(order_number);