import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus, Edit, Trash2, Building2, FileText, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

interface Permiso {
  id: string;
  nombre: string;
  descripcion: string;
  vigencia_meses: number;
  es_obligatorio: boolean;
}

interface Rubro {
  id: string;
  nombre: string;
}

interface Comuna {
  id: string;
  nombre: string;
}

interface Negocio {
  id: string;
  nombre: string;
  direccion: string;
  comuna_id: string;
  rubro_id: string;
  comunas: { nombre: string };
  rubros: { nombre: string };
}

interface ReglaPermiso {
  id: string;
  rubro_id: string;
  permiso_id: string;
  es_obligatorio: boolean;
  rubros: { nombre: string };
  permisos: { nombre: string };
}

const Admin = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'permisos' | 'reglas' | 'negocios'>('permisos');
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [comunas, setComunas] = useState<Comuna[]>([]);
  const [reglas, setReglas] = useState<ReglaPermiso[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPermiso, setEditingPermiso] = useState<Permiso | null>(null);
  const [editingNegocio, setEditingNegocio] = useState<Negocio | null>(null);

  // Form states
  const [permisoForm, setPermisoForm] = useState({
    nombre: '',
    descripcion: '',
    vigencia_meses: 12,
    es_obligatorio: true,
  });

  const [reglaForm, setReglaForm] = useState({
    rubro_id: '',
    permiso_id: '',
    es_obligatorio: true,
  });

  const [negocioForm, setNegocioForm] = useState({
    nombre: '',
    direccion: '',
    comuna_id: '',
    rubro_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permisosRes, rubrosRes, comunasRes, reglasRes, negociosRes] = await Promise.all([
        supabase.from('permisos').select('*').order('nombre'),
        supabase.from('rubros').select('*').order('nombre'),
        supabase.from('comunas').select('*').order('nombre'),
        supabase.from('reglas_permisos').select(`
          *,
          rubros (nombre),
          permisos (nombre)
        `).order('created_at', { ascending: false }),
        supabase.from('negocios').select(`
          *,
          comunas (nombre),
          rubros (nombre)
        `).eq('user_id', user?.id).order('nombre')
      ]);

      if (permisosRes.error) throw permisosRes.error;
      if (rubrosRes.error) throw rubrosRes.error;
      if (comunasRes.error) throw comunasRes.error;
      if (reglasRes.error) throw reglasRes.error;
      if (negociosRes.error) throw negociosRes.error;

      setPermisos(permisosRes.data || []);
      setRubros(rubrosRes.data || []);
      setComunas(comunasRes.data || []);
      setReglas(reglasRes.data || []);
      setNegocios(negociosRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermiso = async () => {
    try {
      if (editingPermiso) {
        // Update existing permiso
        const { error } = await supabase
          .from('permisos')
          .update(permisoForm)
          .eq('id', editingPermiso.id);

        if (error) throw error;

        toast({
          title: 'Permiso actualizado',
          description: `${permisoForm.nombre} ha sido actualizado`,
        });
      } else {
        // Create new permiso
        const { error } = await supabase
          .from('permisos')
          .insert(permisoForm);

        if (error) throw error;

        toast({
          title: 'Permiso creado',
          description: `${permisoForm.nombre} ha sido creado`,
        });
      }

      setPermisoForm({
        nombre: '',
        descripcion: '',
        vigencia_meses: 12,
        es_obligatorio: true,
      });
      setEditingPermiso(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving permiso:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePermiso = async (permiso: Permiso) => {
    try {
      const { error } = await supabase
        .from('permisos')
        .delete()
        .eq('id', permiso.id);

      if (error) throw error;

      toast({
        title: 'Permiso eliminado',
        description: `${permiso.nombre} ha sido eliminado`,
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting permiso:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveRegla = async () => {
    try {
      const { error } = await supabase
        .from('reglas_permisos')
        .insert(reglaForm);

      if (error) throw error;

      toast({
        title: 'Regla creada',
        description: 'La regla de permiso ha sido creada',
      });

      setReglaForm({
        rubro_id: '',
        permiso_id: '',
        es_obligatorio: true,
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving regla:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRegla = async (regla: ReglaPermiso) => {
    try {
      const { error } = await supabase
        .from('reglas_permisos')
        .delete()
        .eq('id', regla.id);

      if (error) throw error;

      toast({
        title: 'Regla eliminada',
        description: 'La regla de permiso ha sido eliminada',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting regla:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const startEditingPermiso = (permiso: Permiso) => {
    setEditingPermiso(permiso);
    setPermisoForm({
      nombre: permiso.nombre,
      descripcion: permiso.descripcion || '',
      vigencia_meses: permiso.vigencia_meses,
      es_obligatorio: permiso.es_obligatorio,
    });
  };

  const handleSaveNegocio = async () => {
    try {
      if (!editingNegocio) return;

      const { error } = await supabase
        .from('negocios')
        .update(negocioForm)
        .eq('id', editingNegocio.id);

      if (error) throw error;

      toast({
        title: 'Negocio actualizado',
        description: `${negocioForm.nombre} ha sido actualizado`,
      });

      setNegocioForm({
        nombre: '',
        direccion: '',
        comuna_id: '',
        rubro_id: '',
      });
      setEditingNegocio(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving negocio:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const startEditingNegocio = (negocio: Negocio) => {
    setEditingNegocio(negocio);
    setNegocioForm({
      nombre: negocio.nombre,
      direccion: negocio.direccion,
      comuna_id: negocio.comuna_id,
      rubro_id: negocio.rubro_id,
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/3"></div>
            <div className="h-64 bg-secondary rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Administración</h1>
            <p className="text-muted-foreground">
              Gestiona permisos y reglas del sistema
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={activeTab === 'permisos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('permisos')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Permisos
          </Button>
          <Button
            variant={activeTab === 'reglas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reglas')}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Reglas por Rubro
          </Button>
          <Button
            variant={activeTab === 'negocios' ? 'default' : 'outline'}
            onClick={() => setActiveTab('negocios')}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Mis Negocios
          </Button>
        </div>

        {/* Permisos Tab */}
        {activeTab === 'permisos' && (
          <div className="space-y-6">
            {/* Add/Edit Permiso Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingPermiso ? 'Editar Permiso' : 'Crear Nuevo Permiso'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Permiso</Label>
                    <Input
                      id="nombre"
                      value={permisoForm.nombre}
                      onChange={(e) => setPermisoForm(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Patente Municipal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vigencia">Vigencia (meses)</Label>
                    <Input
                      id="vigencia"
                      type="number"
                      value={permisoForm.vigencia_meses}
                      onChange={(e) => setPermisoForm(prev => ({ ...prev, vigencia_meses: parseInt(e.target.value) }))}
                      min="1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={permisoForm.descripcion}
                    onChange={(e) => setPermisoForm(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Descripción del permiso..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="obligatorio"
                    checked={permisoForm.es_obligatorio}
                    onChange={(e) => setPermisoForm(prev => ({ ...prev, es_obligatorio: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="obligatorio">Es obligatorio</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePermiso}>
                    {editingPermiso ? 'Actualizar' : 'Crear'} Permiso
                  </Button>
                  {editingPermiso && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingPermiso(null);
                        setPermisoForm({
                          nombre: '',
                          descripcion: '',
                          vigencia_meses: 12,
                          es_obligatorio: true,
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Permisos List */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Permisos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Vigencia</TableHead>
                        <TableHead>Obligatorio</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permisos.map((permiso) => (
                        <TableRow key={permiso.id}>
                          <TableCell className="font-medium">{permiso.nombre}</TableCell>
                          <TableCell className="max-w-xs truncate">{permiso.descripcion}</TableCell>
                          <TableCell>{permiso.vigencia_meses} meses</TableCell>
                          <TableCell>
                            <Badge variant={permiso.es_obligatorio ? 'default' : 'secondary'}>
                              {permiso.es_obligatorio ? 'Sí' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingPermiso(permiso)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePermiso(permiso)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reglas Tab */}
        {activeTab === 'reglas' && (
          <div className="space-y-6">
            {/* Add Regla Form */}
            <Card>
              <CardHeader>
                <CardTitle>Asignar Permiso a Rubro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rubro">Rubro</Label>
                    <Select
                      value={reglaForm.rubro_id}
                      onValueChange={(value) => setReglaForm(prev => ({ ...prev, rubro_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rubro" />
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
                  <div className="space-y-2">
                    <Label htmlFor="permiso">Permiso</Label>
                    <Select
                      value={reglaForm.permiso_id}
                      onValueChange={(value) => setReglaForm(prev => ({ ...prev, permiso_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un permiso" />
                      </SelectTrigger>
                      <SelectContent>
                        {permisos.map((permiso) => (
                          <SelectItem key={permiso.id} value={permiso.id}>
                            {permiso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="regla-obligatorio"
                    checked={reglaForm.es_obligatorio}
                    onChange={(e) => setReglaForm(prev => ({ ...prev, es_obligatorio: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="regla-obligatorio">Es obligatorio para este rubro</Label>
                </div>
                <Button
                  onClick={handleSaveRegla}
                  disabled={!reglaForm.rubro_id || !reglaForm.permiso_id}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Regla
                </Button>
              </CardContent>
            </Card>

            {/* Reglas List */}
            <Card>
              <CardHeader>
                <CardTitle>Reglas de Permisos por Rubro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rubro</TableHead>
                        <TableHead>Permiso</TableHead>
                        <TableHead>Obligatorio</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reglas.map((regla) => (
                        <TableRow key={regla.id}>
                          <TableCell className="font-medium">{regla.rubros.nombre}</TableCell>
                          <TableCell>{regla.permisos.nombre}</TableCell>
                          <TableCell>
                            <Badge variant={regla.es_obligatorio ? 'default' : 'secondary'}>
                              {regla.es_obligatorio ? 'Sí' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRegla(regla)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Negocios Tab */}
        {activeTab === 'negocios' && (
          <div className="space-y-6">
            {/* Edit Negocio Form */}
            {editingNegocio && (
              <Card>
                <CardHeader>
                  <CardTitle>Editar Negocio: {editingNegocio.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="negocio-nombre">Nombre del Negocio</Label>
                      <Input
                        id="negocio-nombre"
                        value={negocioForm.nombre}
                        onChange={(e) => setNegocioForm(prev => ({ ...prev, nombre: e.target.value }))}
                        placeholder="Nombre del negocio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="negocio-comuna">Comuna</Label>
                      <Select
                        value={negocioForm.comuna_id}
                        onValueChange={(value) => setNegocioForm(prev => ({ ...prev, comuna_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una comuna" />
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
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="negocio-direccion">Dirección</Label>
                      <Textarea
                        id="negocio-direccion"
                        value={negocioForm.direccion}
                        onChange={(e) => setNegocioForm(prev => ({ ...prev, direccion: e.target.value }))}
                        placeholder="Dirección completa del negocio"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="negocio-rubro">Tipo de Negocio</Label>
                      <Select
                        value={negocioForm.rubro_id}
                        onValueChange={(value) => setNegocioForm(prev => ({ ...prev, rubro_id: value }))}
                      >
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
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNegocio}>
                      Guardar Cambios
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingNegocio(null);
                        setNegocioForm({
                          nombre: '',
                          direccion: '',
                          comuna_id: '',
                          rubro_id: '',
                        });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Negocios List */}
            <Card>
              <CardHeader>
                <CardTitle>Mis Negocios</CardTitle>
              </CardHeader>
              <CardContent>
                {negocios.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tienes negocios registrados</h3>
                    <p className="text-muted-foreground mb-4">
                      Agrega tu primer negocio para comenzar a gestionar sus permisos
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Dirección</TableHead>
                          <TableHead>Comuna</TableHead>
                          <TableHead>Tipo de Negocio</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {negocios.map((negocio) => (
                          <TableRow key={negocio.id}>
                            <TableCell className="font-medium">{negocio.nombre}</TableCell>
                            <TableCell className="max-w-xs truncate">{negocio.direccion}</TableCell>
                            <TableCell>{negocio.comunas.nombre}</TableCell>
                            <TableCell>{negocio.rubros.nombre}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditingNegocio(negocio)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;