-- Fix storage RLS policies for documentos bucket
-- Allow authenticated users to upload files

-- Create storage policies for documentos bucket
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documentos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow users to view their own files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documentos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow users to update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'documentos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow users to delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documentos' AND 
  auth.uid() IS NOT NULL
);

-- Remove the duplicate foreign key constraint that's causing the relationship ambiguity
-- Keep only the newer one (fk_documentos_permiso_negocio)
ALTER TABLE documentos 
DROP CONSTRAINT IF EXISTS documentos_permiso_negocio_id_fkey;