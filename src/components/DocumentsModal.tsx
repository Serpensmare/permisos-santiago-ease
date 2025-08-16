import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Download, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Documento {
  id: string;
  nombre: string;
  tipo_archivo: string;
  url_archivo: string;
  tamaño_archivo: number | null;
  created_at: string;
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permisoNegocioId: string;
  permisoNombre: string;
}

const DocumentsModal: React.FC<DocumentsModalProps> = ({
  isOpen,
  onClose,
  permisoNegocioId,
  permisoNombre
}) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && permisoNegocioId) {
      fetchDocumentos();
    }
  }, [isOpen, permisoNegocioId]);

  const fetchDocumentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('permiso_negocio_id', permisoNegocioId);

      if (error) throw error;
      setDocumentos(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Desconocido';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = async (url: string, nombre: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = nombre;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documentos - {permisoNombre}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-secondary rounded w-1/3 mx-auto"></div>
                <div className="h-32 bg-secondary rounded"></div>
              </div>
            </div>
          ) : documentos.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay documentos</h3>
              <p className="text-muted-foreground">
                No se han subido documentos para este permiso aún.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documentos.map((documento) => (
                <Card key={documento.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <h4 className="font-medium">{documento.nombre}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{documento.tipo_archivo.toUpperCase()}</span>
                            <span>{formatFileSize(documento.tamaño_archivo)}</span>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(documento.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(documento.url_archivo, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(documento.url_archivo, documento.nombre)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentsModal;