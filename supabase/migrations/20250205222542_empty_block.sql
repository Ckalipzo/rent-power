/*
  # Initial Database Schema

  1. New Tables
    - `categories`
      - Equipment categories (generators, tools, etc.)
    - `inventory_items`
      - Physical items in inventory
    - `inventory_movements`
      - Track item entries/exits
    - `clients`
      - Client information
    - `providers`
      - Provider/supplier information
    - `quotations`
      - Quotation records
    - `quotation_items`
      - Items included in quotations
    - `payments`
      - Payment records
    - `credit_notes`
      - Credit note records
    - `movements`
      - Financial movements

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id),
  name text NOT NULL,
  model text,
  serial_number text,
  status text NOT NULL CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
  condition text NOT NULL CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  purchase_date timestamptz,
  purchase_price decimal(10,2),
  daily_rental_price decimal(10,2) NOT NULL,
  location text,
  notes text,
  minimum_stock integer NOT NULL DEFAULT 0,
  current_stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read inventory items"
  ON inventory_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify inventory items"
  ON inventory_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id),
  type text NOT NULL CHECK (type IN ('entrada', 'salida')),
  quantity integer NOT NULL,
  reference_type text NOT NULL CHECK (reference_type IN ('compra', 'renta', 'ajuste')),
  reference_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read inventory movements"
  ON inventory_movements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create inventory movements"
  ON inventory_movements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  rfc text NOT NULL,
  notes text,
  sector text,
  registration_date timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  rfc text NOT NULL,
  category text NOT NULL,
  products jsonb,
  notes text,
  registration_date timestamptz DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read providers"
  ON providers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify providers"
  ON providers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  reservation_date timestamptz,
  created_at timestamptz DEFAULT now(),
  items jsonb NOT NULL,
  subtotal decimal(10,2) NOT NULL,
  tax decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  validity text NOT NULL,
  notes text,
  status text NOT NULL CHECK (status IN ('pendiente', 'aprobada', 'rechazada', 'pagada')),
  pdf_generated boolean DEFAULT false,
  payment_id uuid,
  stripe_session_id text,
  stripe_payment_status text CHECK (stripe_payment_status IN ('pending', 'completed', 'failed'))
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read quotations"
  ON quotations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify quotations"
  ON quotations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('ingreso', 'egreso')),
  category text NOT NULL,
  concept text NOT NULL,
  amount decimal(10,2) NOT NULL,
  date timestamptz NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'cheque')),
  status text NOT NULL CHECK (status IN ('pendiente', 'completado', 'cancelado')),
  receipt text,
  client_id uuid REFERENCES clients(id),
  provider_id uuid REFERENCES providers(id),
  reference text,
  credit_note_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id),
  payment_id uuid REFERENCES payments(id),
  amount decimal(10,2) NOT NULL,
  date timestamptz NOT NULL,
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('activa', 'cancelada')),
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read credit notes"
  ON credit_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify credit notes"
  ON credit_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Financial Movements
CREATE TABLE IF NOT EXISTS movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('ingreso', 'egreso')),
  category text NOT NULL,
  concept text NOT NULL,
  amount decimal(10,2) NOT NULL,
  date timestamptz NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'tarjeta', 'cheque')),
  status text NOT NULL CHECK (status IN ('pendiente', 'completado', 'cancelado')),
  reference text,
  payment_id uuid REFERENCES payments(id),
  credit_note_id uuid REFERENCES credit_notes(id),
  client_id uuid REFERENCES clients(id),
  provider_id uuid REFERENCES providers(id),
  receipt text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read movements"
  ON movements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can modify movements"
  ON movements
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_client ON credit_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_payment ON credit_notes(payment_id);
CREATE INDEX IF NOT EXISTS idx_movements_payment ON movements(payment_id);
CREATE INDEX IF NOT EXISTS idx_movements_credit_note ON movements(credit_note_id);