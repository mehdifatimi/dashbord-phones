-- =============================================
-- SUPPLIERS TABLE
-- Run this in your Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add supplier_id to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Policies for suppliers (only authenticated users)
DROP POLICY IF EXISTS "Authenticated users can do all on suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can do all on suppliers"
ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
