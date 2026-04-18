-- Allow anonymous (public) users to read repairs for QR code tracking page
-- Run this in your Supabase SQL Editor

-- First, make sure RLS is enabled on the repairs table
ALTER TABLE public.repairs ENABLE ROW LEVEL SECURITY;

-- Drop policy if it already exists to avoid errors
DROP POLICY IF EXISTS "Public can read repairs by id" ON public.repairs;

-- Create a policy that allows anyone (including unauthenticated/anonymous) 
-- to SELECT a specific repair ticket (used for QR code tracking)
CREATE POLICY "Public can read repairs by id"
ON public.repairs
FOR SELECT
TO anon, authenticated
USING (true);
