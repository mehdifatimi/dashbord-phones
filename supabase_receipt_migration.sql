-- Add receipt_number to sales table
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS receipt_number TEXT;
