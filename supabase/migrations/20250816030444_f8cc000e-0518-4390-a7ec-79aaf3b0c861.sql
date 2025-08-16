-- Update the auto-linking function to support partial word matching
CREATE OR REPLACE FUNCTION public.auto_link_documento_to_permiso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if document has a negocio_id and doesn't already have a permiso_negocio_id
  IF NEW.negocio_id IS NOT NULL AND NEW.permiso_negocio_id IS NULL THEN
    -- Try to find a matching permiso_negocio record with word-based matching
    UPDATE documentos 
    SET permiso_negocio_id = (
      SELECT pn.id 
      FROM permisos_negocio pn
      JOIN permisos p ON p.id = pn.permiso_id
      WHERE pn.negocio_id = NEW.negocio_id 
        AND (
          -- Exact match (case insensitive)
          LOWER(TRIM(p.nombre)) = LOWER(TRIM(NEW.nombre))
          OR
          -- Partial word matching - check if all words in permit name exist in document name
          (
            SELECT COUNT(*) 
            FROM unnest(string_to_array(LOWER(TRIM(p.nombre)), ' ')) AS permit_word
            WHERE permit_word = ANY(string_to_array(LOWER(TRIM(NEW.nombre)), ' '))
            AND LENGTH(permit_word) > 2  -- Only consider words longer than 2 characters
          ) >= LEAST(2, array_length(string_to_array(TRIM(p.nombre), ' '), 1))
        )
      ORDER BY 
        -- Prioritize exact matches first, then word matches
        CASE WHEN LOWER(TRIM(p.nombre)) = LOWER(TRIM(NEW.nombre)) THEN 1 ELSE 2 END,
        LENGTH(p.nombre) DESC
      LIMIT 1
    )
    WHERE id = NEW.id
      AND permiso_negocio_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update existing documents with the new matching logic
UPDATE documentos 
SET permiso_negocio_id = (
  SELECT pn.id 
  FROM permisos_negocio pn
  JOIN permisos p ON p.id = pn.permiso_id
  WHERE pn.negocio_id = documentos.negocio_id 
    AND (
      -- Exact match (case insensitive)
      LOWER(TRIM(p.nombre)) = LOWER(TRIM(documentos.nombre))
      OR
      -- Partial word matching - check if all words in permit name exist in document name
      (
        SELECT COUNT(*) 
        FROM unnest(string_to_array(LOWER(TRIM(p.nombre)), ' ')) AS permit_word
        WHERE permit_word = ANY(string_to_array(LOWER(TRIM(documentos.nombre)), ' '))
        AND LENGTH(permit_word) > 2  -- Only consider words longer than 2 characters
      ) >= LEAST(2, array_length(string_to_array(TRIM(p.nombre), ' '), 1))
    )
  ORDER BY 
    -- Prioritize exact matches first, then word matches
    CASE WHEN LOWER(TRIM(p.nombre)) = LOWER(TRIM(documentos.nombre)) THEN 1 ELSE 2 END,
    LENGTH(p.nombre) DESC
  LIMIT 1
)
WHERE negocio_id IS NOT NULL 
  AND permiso_negocio_id IS NULL;