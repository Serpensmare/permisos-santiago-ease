-- Create function to automatically link documents to permits based on name matching
CREATE OR REPLACE FUNCTION public.auto_link_documento_to_permiso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if document has a negocio_id and doesn't already have a permiso_negocio_id
  IF NEW.negocio_id IS NOT NULL AND NEW.permiso_negocio_id IS NULL THEN
    -- Try to find a matching permiso_negocio record
    UPDATE documentos 
    SET permiso_negocio_id = (
      SELECT pn.id 
      FROM permisos_negocio pn
      JOIN permisos p ON p.id = pn.permiso_id
      WHERE pn.negocio_id = NEW.negocio_id 
        AND LOWER(TRIM(p.nombre)) = LOWER(TRIM(NEW.nombre))
      LIMIT 1
    )
    WHERE id = NEW.id
      AND permiso_negocio_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic linking on insert
CREATE TRIGGER trigger_auto_link_documento_insert
  AFTER INSERT ON documentos
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_documento_to_permiso();

-- Create trigger for automatic linking on update (in case document name changes)
CREATE TRIGGER trigger_auto_link_documento_update
  AFTER UPDATE ON documentos
  FOR EACH ROW
  WHEN (OLD.nombre IS DISTINCT FROM NEW.nombre OR OLD.negocio_id IS DISTINCT FROM NEW.negocio_id)
  EXECUTE FUNCTION auto_link_documento_to_permiso();

-- Also update existing documents that might match
UPDATE documentos 
SET permiso_negocio_id = (
  SELECT pn.id 
  FROM permisos_negocio pn
  JOIN permisos p ON p.id = pn.permiso_id
  WHERE pn.negocio_id = documentos.negocio_id 
    AND LOWER(TRIM(p.nombre)) = LOWER(TRIM(documentos.nombre))
  LIMIT 1
)
WHERE negocio_id IS NOT NULL 
  AND permiso_negocio_id IS NULL;