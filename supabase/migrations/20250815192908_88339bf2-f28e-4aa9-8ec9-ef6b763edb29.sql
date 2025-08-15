-- Fix documentos table structure and add missing foreign key
ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS permiso_negocio_id UUID REFERENCES public.permisos_negocio(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_documentos_permiso_negocio_id 
ON public.documentos (permiso_negocio_id);

-- Update RLS policies to include the new relationship
DROP POLICY IF EXISTS "Users can view their own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can create their own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can update their own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can delete their own documentos" ON public.documentos;

-- Create enhanced RLS policies
CREATE POLICY "Users can view their own documentos" 
ON public.documentos 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.negocios n 
    WHERE n.id = documentos.negocio_id 
    AND n.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own documentos" 
ON public.documentos 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.negocios n 
    WHERE n.id = documentos.negocio_id 
    AND n.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own documentos" 
ON public.documentos 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.negocios n 
    WHERE n.id = documentos.negocio_id 
    AND n.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own documentos" 
ON public.documentos 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.negocios n 
    WHERE n.id = documentos.negocio_id 
    AND n.user_id = auth.uid()
  )
);