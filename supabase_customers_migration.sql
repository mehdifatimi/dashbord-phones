-- Create the customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert, read, update, delete
CREATE POLICY "Enable ALL for authenticated users only" ON public.customers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add customer_id reference to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add customer_id reference to repairs table
ALTER TABLE public.repairs
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
