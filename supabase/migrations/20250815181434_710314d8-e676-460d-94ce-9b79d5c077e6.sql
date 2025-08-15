-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  telefono_whatsapp TEXT,
  alertas_activas BOOLEAN DEFAULT true,
  tipo_notificacion TEXT DEFAULT 'email' CHECK (tipo_notificacion IN ('email', 'whatsapp', 'ambos')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comunas table
CREATE TABLE public.comunas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rubros table
CREATE TABLE public.rubros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permits table (master list)
CREATE TABLE public.permisos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  vigencia_meses INTEGER DEFAULT 12,
  es_obligatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create businesses table
CREATE TABLE public.negocios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  comuna_id UUID NOT NULL REFERENCES public.comunas(id),
  rubro_id UUID NOT NULL REFERENCES public.rubros(id),
  direccion TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business permits table (permits attached to specific businesses)
CREATE TABLE public.permisos_negocio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  permiso_id UUID NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'aprobado', 'rechazado', 'vencido')),
  fecha_vencimiento DATE,
  proximo_paso TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(negocio_id, permiso_id)
);

-- Create documents table
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permiso_negocio_id UUID REFERENCES public.permisos_negocio(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo_archivo TEXT NOT NULL,
  url_archivo TEXT NOT NULL,
  tamaño_archivo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permit rules table (mapping of rubro to default permits)
CREATE TABLE public.reglas_permisos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rubro_id UUID NOT NULL REFERENCES public.rubros(id) ON DELETE CASCADE,
  permiso_id UUID NOT NULL REFERENCES public.permisos(id) ON DELETE CASCADE,
  es_obligatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rubro_id, permiso_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglas_permisos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for comunas (public read access)
CREATE POLICY "Anyone can view comunas" ON public.comunas FOR SELECT USING (true);

-- Create RLS policies for rubros (public read access)
CREATE POLICY "Anyone can view rubros" ON public.rubros FOR SELECT USING (true);

-- Create RLS policies for permisos (public read access for users, full access for admins)
CREATE POLICY "Anyone can view permisos" ON public.permisos FOR SELECT USING (true);

-- Create RLS policies for negocios
CREATE POLICY "Users can view their own negocios" ON public.negocios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own negocios" ON public.negocios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own negocios" ON public.negocios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own negocios" ON public.negocios FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for permisos_negocio
CREATE POLICY "Users can view permits for their negocios" ON public.permisos_negocio FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.negocios WHERE negocios.id = permisos_negocio.negocio_id AND negocios.user_id = auth.uid())
);
CREATE POLICY "Users can create permits for their negocios" ON public.permisos_negocio FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.negocios WHERE negocios.id = permisos_negocio.negocio_id AND negocios.user_id = auth.uid())
);
CREATE POLICY "Users can update permits for their negocios" ON public.permisos_negocio FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.negocios WHERE negocios.id = permisos_negocio.negocio_id AND negocios.user_id = auth.uid())
);

-- Create RLS policies for documentos
CREATE POLICY "Users can view their own documentos" ON public.documentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documentos" ON public.documentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documentos" ON public.documentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documentos" ON public.documentos FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for reglas_permisos (public read access)
CREATE POLICY "Anyone can view reglas_permisos" ON public.reglas_permisos FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permisos_updated_at BEFORE UPDATE ON public.permisos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_negocios_updated_at BEFORE UPDATE ON public.negocios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permisos_negocio_updated_at BEFORE UPDATE ON public.permisos_negocio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre_completo)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'nombre_completo');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial data for comunas
INSERT INTO public.comunas (nombre) VALUES 
('Cerrillos'), ('Cerro Navia'), ('Conchalí'), ('El Bosque'), ('Estación Central'),
('Huechuraba'), ('Independencia'), ('La Cisterna'), ('La Florida'), ('La Granja'),
('La Pintana'), ('La Reina'), ('Las Condes'), ('Lo Barnechea'), ('Lo Espejo'),
('Lo Prado'), ('Macul'), ('Maipú'), ('Ñuñoa'), ('Pedro Aguirre Cerda'),
('Peñalolén'), ('Providencia'), ('Pudahuel'), ('Quilicura'), ('Quinta Normal'),
('Recoleta'), ('Renca'), ('San Joaquín'), ('San Miguel'), ('San Ramón'),
('Santiago'), ('Vitacura');

-- Insert initial data for rubros
INSERT INTO public.rubros (nombre) VALUES 
('Café'), ('Peluquería'), ('Minimarket'), ('Restaurante'), ('Farmacia'),
('Librería'), ('Ferretería'), ('Panadería'), ('Carnicería'), ('Verdulería');

-- Insert initial permits
INSERT INTO public.permisos (nombre, descripcion, vigencia_meses, es_obligatorio) VALUES 
('Patente Municipal', 'Permiso municipal para operar el negocio', 12, true),
('Resolución Sanitaria', 'Autorización sanitaria para establecimientos de alimentos', 12, true),
('Certificado de Bomberos', 'Certificado de seguridad contra incendios', 12, true),
('Permiso de Funcionamiento', 'Permiso general de funcionamiento', 12, true),
('Licencia de Alcohol', 'Permiso para venta de bebidas alcohólicas', 12, false),
('Permiso de Terraza', 'Autorización para uso de espacio público', 6, false),
('Certificado Ambiental', 'Certificado de cumplimiento ambiental', 24, false);

-- Insert permit rules for different rubros
-- Café rules
INSERT INTO public.reglas_permisos (rubro_id, permiso_id, es_obligatorio) 
SELECT r.id, p.id, true
FROM public.rubros r, public.permisos p 
WHERE r.nombre = 'Café' AND p.nombre IN ('Patente Municipal', 'Resolución Sanitaria', 'Certificado de Bomberos', 'Permiso de Funcionamiento');

-- Peluquería rules
INSERT INTO public.reglas_permisos (rubro_id, permiso_id, es_obligatorio) 
SELECT r.id, p.id, true
FROM public.rubros r, public.permisos p 
WHERE r.nombre = 'Peluquería' AND p.nombre IN ('Patente Municipal', 'Certificado de Bomberos', 'Permiso de Funcionamiento');

-- Minimarket rules
INSERT INTO public.reglas_permisos (rubro_id, permiso_id, es_obligatorio) 
SELECT r.id, p.id, true
FROM public.rubros r, public.permisos p 
WHERE r.nombre = 'Minimarket' AND p.nombre IN ('Patente Municipal', 'Resolución Sanitaria', 'Certificado de Bomberos', 'Permiso de Funcionamiento');

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);

-- Create storage policies
CREATE POLICY "Users can view their own documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents" ON storage.objects FOR UPDATE USING (
  bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE USING (
  bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]
);