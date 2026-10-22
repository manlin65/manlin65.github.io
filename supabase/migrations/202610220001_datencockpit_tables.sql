-- Supabase only: additive schema, direct browser access disabled.
BEGIN;
CREATE TABLE IF NOT EXISTS public.datencockpit_batches (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL CHECK (length(token_hash) = 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE TABLE IF NOT EXISTS public.datencockpit_orders (
  batch_id uuid NOT NULL REFERENCES public.datencockpit_batches(id) ON DELETE CASCADE,
  order_number varchar(80) NOT NULL,
  order_date date NOT NULL CHECK (order_date BETWEEN '2000-01-01' AND '2100-12-31'),
  customer varchar(160) NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents BETWEEN 0 AND 1000000000),
  status text NOT NULL CHECK (status IN ('offen','bezahlt','storniert')),
  PRIMARY KEY (batch_id, order_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS datencockpit_orders_case_unique ON public.datencockpit_orders(batch_id, lower(order_number));
CREATE INDEX IF NOT EXISTS datencockpit_batches_expiry ON public.datencockpit_batches(expires_at);

ALTER TABLE public.datencockpit_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datencockpit_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.datencockpit_batches FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.datencockpit_orders FROM PUBLIC, anon, authenticated;
COMMIT;
