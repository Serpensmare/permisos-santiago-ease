-- Create specific permits with codes (checking for existing ones first)
DO $$
BEGIN
  -- Insert PAT_MUN if not exists
  IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'PAT_MUN') THEN
    INSERT INTO permisos (nombre, descripcion, vigencia_meses, es_obligatorio) 
    VALUES ('PAT_MUN', 'Patente Municipal', 12, true);
  END IF;
  
  -- Insert RES_SAN if not exists
  IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'RES_SAN') THEN
    INSERT INTO permisos (nombre, descripcion, vigencia_meses, es_obligatorio) 
    VALUES ('RES_SAN', 'Resolución Sanitaria', 12, true);
  END IF;
  
  -- Insert CERT_BOM if not exists
  IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'CERT_BOM') THEN
    INSERT INTO permisos (nombre, descripcion, vigencia_meses, es_obligatorio) 
    VALUES ('CERT_BOM', 'Certificado de Bomberos', 12, true);
  END IF;
  
  -- Insert SII_INIT if not exists
  IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'SII_INIT') THEN
    INSERT INTO permisos (nombre, descripcion, vigencia_meses, es_obligatorio) 
    VALUES ('SII_INIT', 'Iniciación de Actividades SII', 0, true);
  END IF;
  
  -- Insert PER_ANU if not exists
  IF NOT EXISTS (SELECT 1 FROM permisos WHERE nombre = 'PER_ANU') THEN
    INSERT INTO permisos (nombre, descripcion, vigencia_meses, es_obligatorio) 
    VALUES ('PER_ANU', 'Permiso de Anuencias', 12, true);
  END IF;
END $$;

-- Add new columns to permisos_negocio table
ALTER TABLE permisos_negocio 
ADD COLUMN IF NOT EXISTS fecha_emision date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'required';