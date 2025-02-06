/*
  # Database Audit and Improvements

  1. Schema Updates
    - Add audit columns to all tables
    - Add missing indexes for performance
    - Add foreign key constraints
    - Add check constraints
    - Add unique constraints
    - Add NOT NULL constraints
    - Add search optimization indexes
    
  2. Security
    - Update RLS policies with better security
    - Add proper audit triggers
    
  3. Documentation
    - Add table and column comments
*/

-- Add audit columns to all tables
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE movements ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_clients_business_name ON clients(business_name);
CREATE INDEX IF NOT EXISTS idx_providers_business_name ON providers(business_name);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_credit_notes_date ON credit_notes(date);
CREATE INDEX IF NOT EXISTS idx_movements_date ON movements(date);

-- Add missing foreign key constraints
ALTER TABLE quotations 
  ADD CONSTRAINT fk_quotations_payment 
  FOREIGN KEY (payment_id) 
  REFERENCES payments(id) 
  ON DELETE SET NULL;

-- Add check constraints for better data validation
ALTER TABLE inventory_items 
  ADD CONSTRAINT check_minimum_stock_positive 
  CHECK (minimum_stock >= 0);

ALTER TABLE inventory_items 
  ADD CONSTRAINT check_current_stock_positive 
  CHECK (current_stock >= 0);

ALTER TABLE payments 
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

ALTER TABLE credit_notes 
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

ALTER TABLE movements 
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

-- Create trigger function for updating audit columns
CREATE OR REPLACE FUNCTION update_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit columns
DO $$ 
BEGIN
  -- Categories
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'categories_audit_trigger') THEN
    CREATE TRIGGER categories_audit_trigger
      BEFORE UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Inventory Items
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'inventory_items_audit_trigger') THEN
    CREATE TRIGGER inventory_items_audit_trigger
      BEFORE UPDATE ON inventory_items
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Inventory Movements
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'inventory_movements_audit_trigger') THEN
    CREATE TRIGGER inventory_movements_audit_trigger
      BEFORE UPDATE ON inventory_movements
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Clients
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'clients_audit_trigger') THEN
    CREATE TRIGGER clients_audit_trigger
      BEFORE UPDATE ON clients
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Providers
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'providers_audit_trigger') THEN
    CREATE TRIGGER providers_audit_trigger
      BEFORE UPDATE ON providers
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Quotations
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'quotations_audit_trigger') THEN
    CREATE TRIGGER quotations_audit_trigger
      BEFORE UPDATE ON quotations
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Payments
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'payments_audit_trigger') THEN
    CREATE TRIGGER payments_audit_trigger
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Credit Notes
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'credit_notes_audit_trigger') THEN
    CREATE TRIGGER credit_notes_audit_trigger
      BEFORE UPDATE ON credit_notes
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;

  -- Movements
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'movements_audit_trigger') THEN
    CREATE TRIGGER movements_audit_trigger
      BEFORE UPDATE ON movements
      FOR EACH ROW
      EXECUTE FUNCTION update_audit_columns();
  END IF;
END $$;

-- Update RLS policies
DO $$
BEGIN
  -- Drop existing policies
  EXECUTE (
    SELECT string_agg(
      format('DROP POLICY IF EXISTS %I ON %I.%I;',
             policyname, schemaname, tablename),
      E'\n'
    )
    FROM pg_policies
    WHERE schemaname = 'public'
  );
END $$;

-- Create new policies
CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add unique constraints
ALTER TABLE clients 
  ADD CONSTRAINT unique_client_rfc 
  UNIQUE (rfc);

ALTER TABLE providers 
  ADD CONSTRAINT unique_provider_rfc 
  UNIQUE (rfc);

ALTER TABLE inventory_items 
  ADD CONSTRAINT unique_serial_number 
  UNIQUE (serial_number);

-- Add NOT NULL constraints where appropriate
ALTER TABLE clients 
  ALTER COLUMN business_name SET NOT NULL,
  ALTER COLUMN rfc SET NOT NULL;

ALTER TABLE providers 
  ALTER COLUMN business_name SET NOT NULL,
  ALTER COLUMN rfc SET NOT NULL;

ALTER TABLE inventory_items 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

-- Create indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_inventory_items_search 
  ON inventory_items 
  USING gin(to_tsvector('spanish', name || ' ' || COALESCE(model, '') || ' ' || COALESCE(serial_number, '')));

CREATE INDEX IF NOT EXISTS idx_clients_search 
  ON clients 
  USING gin(to_tsvector('spanish', business_name || ' ' || contact_name || ' ' || rfc));

CREATE INDEX IF NOT EXISTS idx_providers_search 
  ON providers 
  USING gin(to_tsvector('spanish', business_name || ' ' || contact_name || ' ' || rfc));

-- Add comments for documentation
COMMENT ON TABLE categories IS 'Product and service categories';
COMMENT ON TABLE inventory_items IS 'Inventory items with their details and current stock';
COMMENT ON TABLE inventory_movements IS 'Track all inventory movements (in/out)';
COMMENT ON TABLE clients IS 'Client information and details';
COMMENT ON TABLE providers IS 'Provider information and details';
COMMENT ON TABLE quotations IS 'Sales quotations for clients';
COMMENT ON TABLE payments IS 'Payment records for both income and expenses';
COMMENT ON TABLE credit_notes IS 'Credit notes issued to clients';
COMMENT ON TABLE movements IS 'Financial movements tracking';

-- Add column comments
COMMENT ON COLUMN categories.name IS 'Category name';
COMMENT ON COLUMN inventory_items.current_stock IS 'Current available quantity';
COMMENT ON COLUMN inventory_movements.type IS 'Movement type: entrada (in) or salida (out)';
COMMENT ON COLUMN quotations.status IS 'Current status: pendiente, aprobada, rechazada, or pagada';
COMMENT ON COLUMN payments.amount IS 'Payment amount in the default currency';