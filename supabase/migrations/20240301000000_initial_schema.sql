-- Create enum types
CREATE TYPE coating_finish AS ENUM ('higher_gloss', 'recommended_gloss', 'lower_gloss');
CREATE TYPE ticket_status AS ENUM ('Order Received', 'In Progress', 'Final Inspection', 'Completed');

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year TEXT;
  sequence_number INT;
  new_order_number TEXT;
BEGIN
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Get the next sequence number for the current year
  WITH next_seq AS (
    SELECT COALESCE(MAX(SUBSTRING(order_number FROM 'CRK-\d{4}-(\d{5})')::integer), 0) + 1 as next_num
    FROM tickets
    WHERE order_number LIKE 'CRK-' || year || '-%'
  )
  SELECT next_num INTO sequence_number FROM next_seq;
  
  -- Format the order number
  new_order_number := 'CRK-' || year || '-' || LPAD(sequence_number::TEXT, 5, '0');
  
  -- Set the new order number
  NEW.order_number := new_order_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update last_updated column
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  date_received TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  coating_color TEXT NOT NULL,
  coating_finish coating_finish NOT NULL DEFAULT 'recommended_gloss',
  status ticket_status NOT NULL DEFAULT 'Order Received',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for last_updated
CREATE TRIGGER set_last_updated
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_column();

-- Create trigger for order_number
CREATE TRIGGER set_order_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Add indexes for common queries
CREATE INDEX idx_tickets_order_number ON tickets(order_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- Grant necessary permissions
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON tickets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tickets; 