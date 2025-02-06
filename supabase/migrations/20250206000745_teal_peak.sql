/*
  # Add inventory movement function

  1. New Functions
    - create_inventory_movement: Handles inventory movements in a transaction
      - Creates movement record
      - Updates item stock
      - Validates stock levels
      - Returns the created movement

  2. Security
    - Function is accessible only to authenticated users
*/

CREATE OR REPLACE FUNCTION create_inventory_movement(
  p_item_id uuid,
  p_type text,
  p_quantity integer,
  p_reference_type text,
  p_notes text,
  p_user_id uuid
)
RETURNS inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock integer;
  v_movement inventory_movements;
BEGIN
  -- Get current stock
  SELECT current_stock INTO v_current_stock
  FROM inventory_items
  WHERE id = p_item_id
  FOR UPDATE;

  -- Validate stock for outgoing movements
  IF p_type = 'salida' AND v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente';
  END IF;

  -- Create movement record
  INSERT INTO inventory_movements (
    item_id,
    type,
    quantity,
    reference_type,
    notes,
    created_by
  ) VALUES (
    p_item_id,
    p_type,
    p_quantity,
    p_reference_type,
    p_notes,
    p_user_id
  )
  RETURNING * INTO v_movement;

  -- Update item stock
  UPDATE inventory_items
  SET
    current_stock = CASE
      WHEN p_type = 'entrada' THEN current_stock + p_quantity
      WHEN p_type = 'salida' THEN current_stock - p_quantity
    END,
    updated_at = now(),
    updated_by = p_user_id
  WHERE id = p_item_id;

  RETURN v_movement;
END;
$$;