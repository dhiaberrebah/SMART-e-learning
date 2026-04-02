-- Messages de contact public → consultation admin (accès via service role côté app)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id          uuid        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  full_name   text        NOT NULL,
  email       text        NOT NULL,
  phone       text        NULL,
  subject     text        NULL,
  message     text        NOT NULL,
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON public.contact_messages (is_read);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Aucune policy : pas d'accès direct client ; insert/select via service role (server actions / pages admin).
