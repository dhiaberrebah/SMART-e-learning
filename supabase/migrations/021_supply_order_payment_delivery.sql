-- Paiement et frais de livraison sur les commandes fournitures
ALTER TABLE public.supply_orders
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS delivery_cost numeric(10, 3) NOT NULL DEFAULT 7;

COMMENT ON COLUMN public.supply_orders.payment_type IS 'cash | transfer | check | card | invoice';
COMMENT ON COLUMN public.supply_orders.delivery_cost IS 'Frais de livraison (DT), en plus du total articles (total_amount)';
