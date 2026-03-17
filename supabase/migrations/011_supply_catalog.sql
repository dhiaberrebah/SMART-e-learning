-- Catalog of school supply items managed by admin
CREATE TABLE IF NOT EXISTS public.supply_catalog (
  id          uuid           NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name        text           NOT NULL,
  description text           NULL,
  category    text           NOT NULL,
  unit_price  numeric(10, 3) NOT NULL,
  unit        text           NOT NULL DEFAULT 'unité',
  icon        text           NOT NULL DEFAULT '📦',
  available   boolean        NOT NULL DEFAULT true,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT supply_catalog_pkey PRIMARY KEY (id)
);

-- Seed default items
INSERT INTO public.supply_catalog (name, description, category, unit_price, unit, icon) VALUES
  ('Manuel Mathématiques',     'Manuel scolaire niveau collège',       'Livres',     18.000, 'unité',  '📘'),
  ('Manuel Français',          'Manuel scolaire niveau collège',       'Livres',     16.500, 'unité',  '📗'),
  ('Manuel Sciences',          'Manuel scolaire sciences naturelles',  'Livres',     19.000, 'unité',  '📙'),
  ('Manuel Histoire-Géo',      'Manuel scolaire niveau collège',       'Livres',     16.000, 'unité',  '📕'),
  ('Cahier 200 pages',         'Cahier grands carreaux',               'Cahiers',     4.500, 'unité',  '📓'),
  ('Cahier 100 pages',         'Cahier petits carreaux',               'Cahiers',     3.000, 'unité',  '📒'),
  ('Cahier brouillon',         'Cahier de brouillon 96 pages',         'Cahiers',     2.000, 'unité',  '📔'),
  ('Stylos bleus (lot×10)',    'Stylos à bille bleus',                 'Papeterie',   5.000, 'lot',    '🖊️'),
  ('Stylos rouges (lot×5)',    'Stylos à bille rouges',                'Papeterie',   3.000, 'lot',    '✒️'),
  ('Crayons HB (lot×12)',      'Crayons à papier HB',                  'Papeterie',   4.000, 'lot',    '✏️'),
  ('Surligneurs (lot×4)',      '4 couleurs assorties',                 'Papeterie',   6.000, 'lot',    '🖍️'),
  ('Règle 30 cm',              'Règle transparente graduée',           'Papeterie',   1.500, 'unité',  '📏'),
  ('Équerre + rapporteur',     'Kit géométrie complet',                'Papeterie',   7.000, 'kit',    '📐'),
  ('Compas',                   'Compas en métal avec crayon',          'Papeterie',   6.000, 'unité',  '🧭'),
  ('Calculatrice scientifique','Calculatrice approuvée lycée',         'Papeterie',  45.000, 'unité',  '🔢'),
  ('Classeur A4',              'Classeur rigide 4 anneaux',            'Rangement',   7.000, 'unité',  '📁'),
  ('Pochettes plastiques ×100','Pochettes perforées transparentes',    'Rangement',   5.500, 'paquet', '🗂️'),
  ('Trousse scolaire',         'Trousse avec compartiments',           'Rangement',   9.000, 'unité',  '👜'),
  ('Cartable scolaire',        'Sac à dos 30L ergonomique',            'Rangement',  65.000, 'unité',  '🎒'),
  ('Colle en stick',           'Lot de 3 colles',                      'Divers',      4.500, 'lot',    '🧴'),
  ('Ciseaux scolaires',        'Ciseaux inox bout rond',               'Divers',      4.000, 'unité',  '✂️'),
  ('Gommes (lot×3)',           'Gommes blanches douces',               'Divers',      2.000, 'lot',    '🧽'),
  ('Taille-crayons double',    'Taille-crayons avec réservoir',        'Divers',      2.500, 'unité',  '🗑️')
ON CONFLICT DO NOTHING;
