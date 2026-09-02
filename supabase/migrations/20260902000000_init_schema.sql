-- Create brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tone_guidelines TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  brand_id UUID NOT NULL REFERENCES brands(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(email, brand_id)
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  product_name TEXT NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'delivered' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TYPE message_sender AS ENUM ('customer', 'agent', 'ai');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender message_sender NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create kb_articles table
CREATE TYPE kb_category AS ENUM ('return', 'refund', 'shipping', 'cancellation');

CREATE TABLE kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  category kb_category NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create ai_logs table
CREATE TYPE ai_log_status AS ENUM ('generated', 'edited', 'approved');

CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  customer_message TEXT NOT NULL,
  retrieved_context TEXT,
  ai_response TEXT,
  agent_edited_response TEXT,
  final_response TEXT,
  status ai_log_status NOT NULL DEFAULT 'generated',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_customers_brand_id ON customers(brand_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_brand_id ON orders(brand_id);
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_kb_articles_brand_category ON kb_articles(brand_id, category);
CREATE INDEX idx_ai_logs_conversation_id ON ai_logs(conversation_id);

-- Seed data: Create brand "HydroFlow Bottles"
INSERT INTO brands (name, tone_guidelines) VALUES (
  'HydroFlow Bottles',
  'Friendly, helpful, empathetic. Acknowledge customer issues quickly. Prioritize solutions over deflection. Use casual but professional language.'
);

-- Get the brand ID for seeding related data
-- Note: In a real migration, you might use a transaction or stored procedure
-- For simplicity, we''ll reference it in subsequent inserts

-- Seed data: Create a test customer
INSERT INTO customers (name, email, brand_id) 
SELECT 'Alex Rodriguez', 'alex@email.com', id FROM brands WHERE name = 'HydroFlow Bottles';

-- Seed data: Create an order (delivered, broken bottle scenario)
INSERT INTO orders (customer_id, brand_id, product_name, order_date, delivery_date, status)
SELECT 
  c.id,
  b.id,
  'HydroFlow Pro 32oz Bottle (Blue)',
  CURRENT_DATE - INTERVAL '14 days',
  CURRENT_DATE - INTERVAL '7 days',
  'delivered'
FROM customers c
JOIN brands b ON c.brand_id = b.id
WHERE c.email = 'alex@email.com' AND b.name = 'HydroFlow Bottles';

-- Seed data: Create a conversation with initial customer message
INSERT INTO conversations (customer_id, brand_id)
SELECT c.id, b.id
FROM customers c
JOIN brands b ON c.brand_id = b.id
WHERE c.email = 'alex@email.com' AND b.name = 'HydroFlow Bottles';

-- Seed data: Add customer message to the conversation
INSERT INTO messages (conversation_id, sender, content)
SELECT 
  conv.id,
  'customer'::message_sender,
  'My order was delivered three days ago but the bottle is broken. What can I do?'
FROM conversations conv
JOIN customers c ON conv.customer_id = c.id
WHERE c.email = 'alex@email.com';

-- Seed data: KB articles for HydroFlow Bottles
INSERT INTO kb_articles (brand_id, category, content)
SELECT b.id, 'return'::kb_category, 
'Returns: We accept returns within 30 days of delivery. Items must be unused and in original packaging. Customer must initiate the return through their account and will receive a prepaid shipping label.'
FROM brands b WHERE b.name = 'HydroFlow Bottles';

INSERT INTO kb_articles (brand_id, category, content)
SELECT b.id, 'refund'::kb_category,
'Refunds: Refunds are processed within 7 days of delivery for defective items. Once the item is received at our warehouse and inspected, the refund will be issued to the original payment method within 5-7 business days. Refunds are only permitted within 30 days of delivery date.'
FROM brands b WHERE b.name = 'HydroFlow Bottles';

INSERT INTO kb_articles (brand_id, category, content)
SELECT b.id, 'shipping'::kb_category,
'Shipping: Standard shipping takes 5-7 business days. Expedited shipping (2-3 business days) is available for an additional fee. All items are tracked and insured during transit.'
FROM brands b WHERE b.name = 'HydroFlow Bottles';

INSERT INTO kb_articles (brand_id, category, content)
SELECT b.id, 'cancellation'::kb_category,
'Cancellation: Orders can be cancelled within 24 hours of placement if not yet shipped. After shipment, cancellation is not possible; you may initiate a return instead.'
FROM brands b WHERE b.name = 'HydroFlow Bottles';

-- Seed data: Create a second test customer (for edge case: refund outside 7-day window)
INSERT INTO customers (name, email, brand_id)
SELECT 'Jordan Smith', 'jordan@email.com', id FROM brands WHERE name = 'HydroFlow Bottles';

-- Seed order for second customer (old order, 45 days ago - outside refund window)
INSERT INTO orders (customer_id, brand_id, product_name, order_date, delivery_date, status)
SELECT 
  c.id,
  b.id,
  'HydroFlow Standard 24oz Bottle (Red)',
  CURRENT_DATE - INTERVAL '50 days',
  CURRENT_DATE - INTERVAL '45 days',
  'delivered'
FROM customers c
JOIN brands b ON c.brand_id = b.id
WHERE c.email = 'jordan@email.com' AND b.name = 'HydroFlow Bottles';

-- Seed conversation for second customer
INSERT INTO conversations (customer_id, brand_id)
SELECT c.id, b.id
FROM customers c
JOIN brands b ON c.brand_id = b.id
WHERE c.email = 'jordan@email.com' AND b.name = 'HydroFlow Bottles';

-- Seed message for second customer (requesting refund outside window)
INSERT INTO messages (conversation_id, sender, content)
SELECT 
  conv.id,
  'customer'::message_sender,
  'I received my bottle 45 days ago and it has some small cracks. Can I get a refund?'
FROM conversations conv
JOIN customers c ON conv.customer_id = c.id
WHERE c.email = 'jordan@email.com';

-- Enable Row Level Security (RLS) for security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies (permissive for now, can be tightened based on auth)
-- Allow agents to view their brand data
CREATE POLICY "agents_can_view_brand_data" ON brands FOR SELECT USING (true);
CREATE POLICY "agents_can_view_customers" ON customers FOR SELECT USING (true);
CREATE POLICY "agents_can_view_orders" ON orders FOR SELECT USING (true);
CREATE POLICY "agents_can_view_conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "agents_can_view_messages" ON messages FOR SELECT USING (true);
CREATE POLICY "agents_can_view_kb_articles" ON kb_articles FOR SELECT USING (true);
CREATE POLICY "agents_can_insert_ai_logs" ON ai_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "agents_can_view_ai_logs" ON ai_logs FOR SELECT USING (true);
CREATE POLICY "agents_can_update_ai_logs" ON ai_logs FOR UPDATE USING (true);
