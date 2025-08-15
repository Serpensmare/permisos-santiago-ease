import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Building2, MapPin, Tag, Calendar, FileText, AlertCircle, CheckCircle, Clock, XCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import PermitUploader from '@/components/PermitUploader';
import ManualPermitModal from '@/components/ManualPermitModal';

interface BusinessDetails {
  id: string;
  nombre: string;
  direccion: string;
  created_at: string;
  comunas: { nombre: string };
  rubros: { nombre: string };
}

interface PermitDetails {
  id: string;
  estado: string;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  status: string | null;
  permisos: { nombre: string };
  documentos: Array<{
    id: string;
    nombre: string;
    url_archivo: string;
    created_at: string;
  }>;
}

const BusinessDetails = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [permits, setPermits] = useState<PermitDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualPermitModalOpen, setManualPermitModalOpen] = useState(false);

  useEffect(() => {
    if (businessId && user) {
      fetchBusinessDetails();
      fetchBusinessPermits();
    }
  }, [businessId, user]);

  const fetchBusinessDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select(`
          id,
          nombre,
          direccion,
          created_at,
          comunas (nombre),
          rubros (nombre)
        `)
        .eq('id', businessId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };

  const fetchBusinessPermits = async () => {
    try {
      const { data, error } = await supabase
        .from('permisos_negocio')
        .select(`
          id,
          estado,
          fecha_emision,
          fecha_vencimiento,
          status,
          permisos (nombre),
          documentos:documentos!permiso_negocio_id (
            id,
            nombre,
            url_archivo,
            created_at
          )
        `)
        .eq('negocio_id', businessId);

      if (error) throw error;
      setPermits(data || []);
    } catch (error) {
      console.error('Error fetching permits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermitAdded = () => {
    fetchBusinessPermits();
  };

  const deletePermit = async (permitId: string) => {
    try {
      // First, get all documents associated with this permit
      const { data: documents } = await supabase
        .from('documentos')
        .select('url_archivo')
        .eq('permiso_negocio_id', permitId);

      // Delete files from storage
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          if (doc.url_archivo) {
            const filePath = doc.url_archivo.split('/').pop();
            if (filePath) {
              await supabase.storage
                .from('documentos')
                .remove([`docs/${businessId}/${filePath}`]);
            }
          }
        }
      }

      // Delete documents records
      await supabase
        .from('documentos')
        .delete()
        .eq('permiso_negocio_id', permitId);

      // Delete permit record
      const { error } = await supabase
        .from('permisos_negocio')
        .delete()
        .eq('id', permitId);

      if (error) throw error;

      toast({
        title: 'Permiso eliminado',
        description: 'El permiso y sus documentos han sido eliminados.',
      });

      fetchBusinessPermits();

    } catch (error: any) {
      console.error('Error deleting permit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el permiso.',
        variant: 'destructive',
      });
    }
  };

  const getEstadoBadge = (estado: string, status?: string | null) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode; label: string }> = {
      pendiente: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'Pendiente' },
      en_proceso: { variant: 'default', icon: <AlertCircle className="h-3 w-3" />, label: 'En Proceso' },
      aprobado: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Aprobado' },
      rechazado: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Rechazado' },
      vencido: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Vencido' },
    };

    if (status === 'approved') {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          Aprobado
        </Badge>
      );
    }

    const config = variants[estado] || variants.pendiente;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-CL');
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

  if (!business) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Negocio no encontrado</h3>
            <p className="text-muted-foreground mb-4">
              El negocio que buscas no existe o no tienes permisos para verlo.
            </p>
            <Link to="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
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
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{business.nombre}</h1>
            <p className="text-muted-foreground">
              Gestiona los permisos y documentos de tu negocio
            </p>
          </div>
        </div>

        {/* Business Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{business.direccion}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Rubro</p>
                  <p className="font-medium">{business.rubros.nombre}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Registrado</p>
                  <p className="font-medium">{formatFecha(business.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <div className="mb-6">
          <PermitUploader 
            businessId={business.id}
            businessName={business.nombre}
            onPermitAdded={handlePermitAdded}
          />
        </div>

        {/* Permits Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Permisos del Negocio
              </div>
              <Button 
                onClick={() => setManualPermitModalOpen(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Permiso
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {permits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay permisos registrados</h3>
                <p className="text-muted-foreground">
                  Los permisos se crearán automáticamente al subir documentos
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permiso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Emisión</TableHead>
                      <TableHead>Fecha Vencimiento</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permits.map((permit) => (
                      <TableRow key={permit.id}>
                        <TableCell className="font-medium">
                          {permit.permisos.nombre}
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(permit.estado, permit.status)}
                        </TableCell>
                        <TableCell>{formatFecha(permit.fecha_emision)}</TableCell>
                        <TableCell>{formatFecha(permit.fecha_vencimiento)}</TableCell>
                        <TableCell>
                          {permit.documentos.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{permit.documentos.length} archivo(s)</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sin documentos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePermit(permit.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Manual Permit Modal */}
        <ManualPermitModal
          isOpen={manualPermitModalOpen}
          onClose={() => setManualPermitModalOpen(false)}
          businessId={business.id}
          onPermitAdded={handlePermitAdded}
        />
      </div>
    </Layout>
  );
};

export default BusinessDetails;