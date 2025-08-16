-- Update RLS policy for documentos to allow documents without negocio_id
DROP POLICY IF EXISTS "Users can create their own documentos" ON documentos;

CREATE POLICY "Users can create their own documentos" 
ON documentos 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND (
    negocio_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM negocios n 
      WHERE n.id = documentos.negocio_id AND n.user_id = auth.uid()
    )
  )
);

-- Update other policies to handle documents without negocio_id
DROP POLICY IF EXISTS "Users can view their own documentos" ON documentos;

CREATE POLICY "Users can view their own documentos" 
ON documentos 
FOR SELECT 
USING (
  auth.uid() = user_id OR (
    negocio_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM negocios n 
      WHERE n.id = documentos.negocio_id AND n.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own documentos" ON documentos;

CREATE POLICY "Users can update their own documentos" 
ON documentos 
FOR UPDATE 
USING (
  auth.uid() = user_id AND (
    negocio_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM negocios n 
      WHERE n.id = documentos.negocio_id AND n.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own documentos" ON documentos;

CREATE POLICY "Users can delete their own documentos" 
ON documentos 
FOR DELETE 
USING (
  auth.uid() = user_id AND (
    negocio_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM negocios n 
      WHERE n.id = documentos.negocio_id AND n.user_id = auth.uid()
    )
  )
);