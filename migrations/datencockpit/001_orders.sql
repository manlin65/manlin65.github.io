CREATE TABLE IF NOT EXISTS datencockpit_batches (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL CHECK (length(token_hash) = 64),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);
CREATE TABLE IF NOT EXISTS datencockpit_orders (
  batch_id uuid NOT NULL REFERENCES datencockpit_batches(id) ON DELETE CASCADE,
  order_number varchar(80) NOT NULL,
  order_date date NOT NULL CHECK (order_date BETWEEN '2000-01-01' AND '2100-12-31'),
  customer varchar(160) NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents BETWEEN 0 AND 1000000000),
  status text NOT NULL CHECK (status IN ('offen','bezahlt','storniert')),
  PRIMARY KEY (batch_id, order_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS datencockpit_orders_case_unique ON datencockpit_orders(batch_id, lower(order_number));
CREATE INDEX IF NOT EXISTS datencockpit_batches_expiry ON datencockpit_batches(expires_at);
