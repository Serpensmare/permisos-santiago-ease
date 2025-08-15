-- Create specific permits with codes
INSERT INTO permisos (id, nombre, descripcion, vigencia_meses, es_obligatorio) VALUES
(gen_random_uuid(), 'PAT_MUN', 'Patente Municipal', 12, true),
(gen_random_uuid(), 'RES_SAN', 'Resolución Sanitaria', 12, true),
(gen_random_uuid(), 'CERT_BOM', 'Certificado de Bomberos', 12, true),
(gen_random_uuid(), 'SII_INIT', 'Iniciación de Actividades SII', 0, true),
(gen_random_uuid(), 'PER_ANU', 'Permiso de Anuencias', 12, true)
ON CONFLICT (nombre) DO NOTHING;

-- Create permit rules for specific rubros
-- First get the IDs we need
WITH permit_ids AS (
  SELECT 
    (SELECT id FROM permisos WHERE nombre = 'PAT_MUN') as pat_mun_id,
    (SELECT id FROM permisos WHERE nombre = 'RES_SAN') as res_san_id,
    (SELECT id FROM permisos WHERE nombre = 'CERT_BOM') as cert_bom_id,
    (SELECT id FROM permisos WHERE nombre = 'SII_INIT') as sii_init_id,
    (SELECT id FROM permisos WHERE nombre = 'PER_ANU') as per_anu_id
),
rubro_ids AS (
  SELECT 
    (SELECT id FROM rubros WHERE nombre = 'Café') as cafe_id,
    (SELECT id FROM rubros WHERE nombre = 'Peluquería') as peluqueria_id,
    (SELECT id FROM rubros WHERE nombre = 'Minimarket') as minimarket_id
)
-- Insert permit rules for Café
INSERT INTO reglas_permisos (rubro_id, permiso_id, es_obligatorio)
SELECT r.cafe_id, p.pat_mun_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.cafe_id, p.res_san_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.cafe_id, p.cert_bom_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.cafe_id, p.sii_init_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.cafe_id, p.per_anu_id, true FROM rubro_ids r, permit_ids p
UNION ALL
-- Insert permit rules for Peluquería
SELECT r.peluqueria_id, p.pat_mun_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.peluqueria_id, p.res_san_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.peluqueria_id, p.sii_init_id, true FROM rubro_ids r, permit_ids p
UNION ALL
-- Insert permit rules for Minimarket
SELECT r.minimarket_id, p.pat_mun_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.minimarket_id, p.res_san_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.minimarket_id, p.cert_bom_id, true FROM rubro_ids r, permit_ids p
UNION ALL
SELECT r.minimarket_id, p.sii_init_id, true FROM rubro_ids r, permit_ids p
ON CONFLICT DO NOTHING;

-- Add new columns to permisos_negocio table to match the required structure
ALTER TABLE permisos_negocio 
ADD COLUMN IF NOT EXISTS fecha_emision date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'required';

-- Update existing records to have the new status
UPDATE permisos_negocio SET status = 'required' WHERE status IS NULL;