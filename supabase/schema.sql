-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  purchase_price NUMERIC(10, 2) NOT NULL,
  sale_price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  profit NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_products_stock ON products(stock);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Categories: Allow all authenticated operations
CREATE POLICY "Allow all authenticated for categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Products: Allow all authenticated operations
CREATE POLICY "Allow all authenticated for products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Sales: Allow all authenticated operations
CREATE POLICY "Allow all authenticated for sales"
  ON sales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- Insert some sample data (optional)
INSERT INTO categories (name) VALUES
  ('Smartphones'),
  ('Tablets'),
  ('Accessories'),
  ('Wearables');

INSERT INTO products (name, brand, category_id, purchase_price, sale_price, stock) VALUES
  ('iPhone 15 Pro', 'Apple', (SELECT id FROM categories WHERE name = 'Smartphones'), 900.00, 1099.00, 25),
  ('Samsung Galaxy S24', 'Samsung', (SELECT id FROM categories WHERE name = 'Smartphones'), 750.00, 899.00, 30),
  ('iPad Air', 'Apple', (SELECT id FROM categories WHERE name = 'Tablets'), 550.00, 699.00, 15),
  ('AirPods Pro', 'Apple', (SELECT id FROM categories WHERE name = 'Accessories'), 180.00, 249.00, 50),
  ('Galaxy Watch 6', 'Samsung', (SELECT id FROM categories WHERE name = 'Wearables'), 250.00, 329.00, 20);
