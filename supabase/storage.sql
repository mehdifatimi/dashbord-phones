-- Create public storage bucket for products
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create storage policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload to products"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Create storage policy to allow anyone to view files in products bucket
CREATE POLICY "Allow anyone to view products files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- Create storage policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete products files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- Create storage policy to allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update products files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'products');
