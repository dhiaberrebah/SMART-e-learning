-- Stock par article catalogue + suivi déduction à la livraison
ALTER TABLE public.supply_catalog
  ADD COLUMN IF NOT EXISTS stock_quantity int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_stock_quantity int NOT NULL DEFAULT 0;

ALTER TABLE public.supply_orders
  ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;
