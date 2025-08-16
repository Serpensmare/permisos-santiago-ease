import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Upload, AlertCircle, CheckCircle, Clock, XCircle, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import SuspendedAccount from '@/components/SuspendedAccount';
import DocumentsModal from '@/components/DocumentsModal';
import AddPermisoModal from '@/components/AddPermisoModal';
import { toast } from 'sonner';

interface PermisoNegocio {
  id: string;
  negocio_id: string;
  estado: string;
  fecha_vencimiento: string | null;
  proximo_paso: string | null;
  permisos: {
    nombre: string;
  };
  negocios: {
    nombre: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [permisosNegocios, setPermisosNegocios] = useState<PermisoNegocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedPermiso, setSelectedPermiso] = useState<PermisoNegocio | null>(null);
  const [addPermisoModalOpen, setAddPermisoModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPermisosNegocios();
    }
  }, [user]);

  const fetchPermisosNegocios = async () => {
    try {
      // For now, skip suspension check since negocios doesn't have estado column
      // This would be implemented when adding payment/suspension functionality

      const { data, error } = await supabase
        .from('permisos_negocio')
        .select(`
          id,
          negocio_id,
          estado,
          fecha_vencimiento,
          proximo_paso,
          permisos (nombre),
          negocios!inner (
            nombre,
            user_id
          )
        `)
        .eq('negocios.user_id', user?.id);

      if (error) throw error;
      setPermisosNegocios(data || []);
    } catch (error) {
      console.error('Error fetching permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode }> = {
      pendiente: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      en_proceso: { variant: 'default', icon: <AlertCircle className="h-3 w-3" /> },
      aprobado: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      rechazado: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      vencido: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    };

    const config = variants[estado] || variants.pendiente;
    const label = estado.replace('_', ' ').charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ');

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {label}
      </Badge>
    );
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const handleViewDocuments = (permiso: PermisoNegocio) => {
    setSelectedPermiso(permiso);
    setDocumentsModalOpen(true);
  };

  const handleApprovePermiso = async (permisoId: string) => {
    try {
      const { error } = await supabase
        .from('permisos_negocio')
        .update({ estado: 'aprobado' })
        .eq('id', permisoId);

      if (error) throw error;
      
      toast.success('Permiso aprobado exitosamente');
      fetchPermisosNegocios();
    } catch (error) {
      console.error('Error approving permiso:', error);
      toast.error('Error al aprobar el permiso');
    }
  };

  if (isSuspended) {
    return <SuspendedAccount />;
  }

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Gestiona todos los permisos de tus negocios
            </p>
          </div>
          <Button 
            size="lg" 
            className="w-full sm:w-auto"
            onClick={() => setAddPermisoModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Permiso
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Permisos</p>
                  <p className="text-2xl font-bold">{permisosNegocios.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Aprobados</p>
                  <p className="text-2xl font-bold">
                    {permisosNegocios.filter(p => p.estado === 'aprobado').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">
                    {permisosNegocios.filter(p => p.estado === 'pendiente').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Próximos a Vencer</p>
                  <p className="text-2xl font-bold">
                    {permisosNegocios.filter(p => {
                      if (!p.fecha_vencimiento) return false;
                      const vence = new Date(p.fecha_vencimiento);
                      const hoy = new Date();
                      const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
                      return vence <= treintaDias && vence >= hoy;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permisos Table */}
        <Card>
          <CardHeader>
            <CardTitle>Permisos de tus Negocios</CardTitle>
          </CardHeader>
          <CardContent>
            {permisosNegocios.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tienes negocios registrados</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza agregando tu primer negocio para gestionar sus permisos
                </p>
                <Link to="/negocios">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Negocio
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Negocio</TableHead>
                      <TableHead>Permiso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Próximo Paso</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permisosNegocios.map((permiso) => (
                      <TableRow key={permiso.id}>
                        <TableCell className="font-medium">
                          <Link to={`/negocios/${permiso.negocio_id}`} className="hover:underline text-primary">
                            {permiso.negocios.nombre}
                          </Link>
                        </TableCell>
                        <TableCell>{permiso.permisos.nombre}</TableCell>
                        <TableCell>{getEstadoBadge(permiso.estado)}</TableCell>
                        <TableCell>{formatFecha(permiso.fecha_vencimiento)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {permiso.proximo_paso || 'No definido'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewDocuments(permiso)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                            {permiso.estado === 'pendiente' && (
                              <Button
                                size="sm"
                                onClick={() => handleApprovePermiso(permiso.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprobar
                              </Button>
                            )}
                            <Link to={`/negocios/${permiso.negocio_id}`}>
                              <Button size="sm" variant="outline">
                                <Upload className="h-3 w-3 mr-1" />
                                Gestionar
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Business Button at Bottom */}
        <div className="flex justify-center mt-8">
          <Link to="/negocios">
            <Button variant="outline" size="lg">
              <Building2 className="h-4 w-4 mr-2" />
              Agregar Negocio
            </Button>
          </Link>
        </div>

        {/* Modals */}
        {selectedPermiso && (
          <DocumentsModal
            isOpen={documentsModalOpen}
            onClose={() => setDocumentsModalOpen(false)}
            permisoNegocioId={selectedPermiso.id}
            permisoNombre={selectedPermiso.permisos.nombre}
          />
        )}
        
        <AddPermisoModal
          isOpen={addPermisoModalOpen}
          onClose={() => setAddPermisoModalOpen(false)}
          onPermisoAdded={fetchPermisosNegocios}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;