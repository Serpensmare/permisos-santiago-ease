-- Add foreign key constraint to link documentos with permisos_negocio
-- This allows documents to be linked to specific permits instead of just being standalone

-- First, add an index for better performance
CREATE INDEX IF NOT EXISTS idx_documentos_permiso_negocio_id ON documentos(permiso_negocio_id);

-- Add foreign key constraint to ensure referential integrity
ALTER TABLE documentos 
ADD CONSTRAINT fk_documentos_permiso_negocio 
FOREIGN KEY (permiso_negocio_id) 
REFERENCES permisos_negocio(id) 
ON DELETE SET NULL;