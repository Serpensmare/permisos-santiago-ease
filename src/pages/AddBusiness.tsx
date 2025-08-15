import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface Comuna {
  id: string;
  nombre: string;
}

interface Rubro {
  id: string;
  nombre: string;
}

const AddBusiness = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [comunaId, setComunaId] = useState('');
  const [rubroId, setRubroId] = useState('');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    fetchComunasAndRubros();
  }, []);

  const fetchComunasAndRubros = async () => {
    try {
      const [comunasResponse, rubrosResponse] = await Promise.all([
        supabase.from('comunas').select('id, nombre').order('nombre'),
        supabase.from('rubros').select('id, nombre').order('nombre')
      ]);

      if (comunasResponse.error) throw comunasResponse.error;
      if (rubrosResponse.error) throw rubrosResponse.error;

      setComunas(comunasResponse.data || []);
      setRubros(rubrosResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las opciones',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      // Create the business
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .insert({
          user_id: user.id,
          nombre,
          comuna_id: comunaId,
          rubro_id: rubroId,
          direccion,
        })
        .select()
        .single();

      if (negocioError) throw negocioError;

      // Get the permit rules for this rubro
      const { data: reglas, error: reglasError } = await supabase
        .from('reglas_permisos')
        .select(`
          permiso_id,
          es_obligatorio,
          permisos (
            nombre,
            vigencia_meses
          )
        `)
        .eq('rubro_id', rubroId);

      if (reglasError) throw reglasError;

      // Create the business permits based on the rules
      if (reglas && reglas.length > 0) {
        const permisosToInsert = reglas.map(regla => ({
          negocio_id: negocio.id,
          permiso_id: regla.permiso_id,
          estado: 'pendiente',
          fecha_vencimiento: null,
          proximo_paso: 'Iniciar trámite en la municipalidad correspondiente',
        }));

        const { error: permisosError } = await supabase
          .from('permisos_negocio')
          .insert(permisosToInsert);

        if (permisosError) throw permisosError;
      }

      toast({
        title: 'Negocio creado exitosamente',
        description: `${nombre} ha sido agregado con sus permisos correspondientes`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating business:', error);
      toast({
        title: 'Error al crear negocio',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 pb-20 lg:pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary rounded-full">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Agregar Negocio</h1>
            <p className="text-muted-foreground mt-2">
              Registra tu negocio y gestiona todos sus permisos
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre del Negocio */}
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Negocio</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="Ej: Café Central, Peluquería Moderna"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Comuna */}
                <div className="space-y-2">
                  <Label htmlFor="comuna">Comuna</Label>
                  <Select value={comunaId} onValueChange={setComunaId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la comuna" />
                    </SelectTrigger>
                    <SelectContent>
                      {comunas.map((comuna) => (
                        <SelectItem key={comuna.id} value={comuna.id}>
                          {comuna.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rubro */}
                <div className="space-y-2">
                  <Label htmlFor="rubro">Rubro</Label>
                  <Select value={rubroId} onValueChange={setRubroId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de negocio" />
                    </SelectTrigger>
                    <SelectContent>
                      {rubros.map((rubro) => (
                        <SelectItem key={rubro.id} value={rubro.id}>
                          {rubro.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="direccion"
                      type="text"
                      placeholder="Ej: Av. Providencia 1234, Local 5"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                    size="lg"
                  >
                    {loading ? 'Creando...' : 'Crear Negocio'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">¿Qué pasa después?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Una vez creado tu negocio, se asignarán automáticamente todos los permisos 
                    necesarios según el rubro seleccionado. Podrás gestionar cada uno desde el dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AddBusiness;