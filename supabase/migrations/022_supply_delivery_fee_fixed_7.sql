-- Forfait livraison fixe 7 DT
ALTER TABLE public.supply_orders ALTER COLUMN delivery_cost SET DEFAULT 7;
UPDATE public.supply_orders SET delivery_cost = 7;
