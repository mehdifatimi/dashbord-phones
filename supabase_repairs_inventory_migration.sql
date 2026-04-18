-- Add unused columns safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='repairs' AND column_name='used_product_id') THEN
        ALTER TABLE public.repairs ADD COLUMN used_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='repairs' AND column_name='is_billed') THEN
        ALTER TABLE public.repairs ADD COLUMN is_billed BOOLEAN DEFAULT false;
    END IF;
END $$;
