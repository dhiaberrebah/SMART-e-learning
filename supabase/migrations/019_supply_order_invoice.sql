-- Preuve de paiement : scan / photo de la facture remise par l'école (chemin fichier local servi depuis /public)
ALTER TABLE public.supply_orders
  ADD COLUMN IF NOT EXISTS invoice_path text NULL,
  ADD COLUMN IF NOT EXISTS invoice_uploaded_at timestamptz NULL;

COMMENT ON COLUMN public.supply_orders.invoice_path IS 'URL publique relative, ex. /uploads/supply-invoices/abc.pdf';
