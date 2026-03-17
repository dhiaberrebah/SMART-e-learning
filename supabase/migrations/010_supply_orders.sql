-- School supply orders placed by parents for their children
CREATE TABLE IF NOT EXISTS public.supply_orders (
  id          uuid        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  parent_id   uuid        NOT NULL,
  student_id  uuid        NOT NULL,
  items       jsonb       NOT NULL DEFAULT '[]',
  -- items format: [{ id, name, category, quantity, unit_price }]
  total_amount numeric(10, 2) NOT NULL DEFAULT 0,
  status      text        NOT NULL DEFAULT 'pending',
  -- pending | confirmed | shipped | delivered | cancelled
  notes       text        NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supply_orders_pkey PRIMARY KEY (id),
  CONSTRAINT supply_orders_parent_id_fkey  FOREIGN KEY (parent_id)  REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT supply_orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_supply_orders_parent_id  ON public.supply_orders (parent_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_student_id ON public.supply_orders (student_id);
