-- Add label field to documentos table for permit name detection
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS label text;

-- Add negocio_id field to documentos table to directly link documents to businesses
ALTER TABLE documentos ADD COLUMN IF NOT EXISTS negocio_id uuid REFERENCES negocios(id) ON DELETE CASCADE;