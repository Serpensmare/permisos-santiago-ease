import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, X, Check, Edit, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createWorker } from 'tesseract.js';
import PermitEditModal from './PermitEditModal';

interface UploadedFile {
  id: string;
  file: File;
  url?: string;
  status: 'uploading' | 'processing' | 'detected' | 'confirmed' | 'error';
  progress: number;
  detectedPermit?: {
    type: string;
    name: string;
    issueDate?: Date;
    expiryDate?: Date;
    confidence: number;
  };
  error?: string;
}

interface PermitUploaderProps {
  businessId: string;
  businessName: string;
  onPermitAdded: () => void;
}

const PermitUploader: React.FC<PermitUploaderProps> = ({ businessId, businessName, onPermitAdded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Permit detection mappings
  const permitMappings = {
    'PAT_MUN': {
      keywords: ['patente municipal', 'patente comercial', 'municipal'],
      name: 'Patente Municipal'
    },
    'RES_SAN': {
      keywords: ['resolución sanitaria', 'sanitaria', 'seremi salud', 'autorización sanitaria'],
      name: 'Resolución Sanitaria'
    },
    'CERT_BOM': {
      keywords: ['certificado bomberos', 'bomberos', 'prevención riesgos', 'seguridad bomberos'],
      name: 'Certificado de Bomberos'
    },
    'SII_INIT': {
      keywords: ['inicio actividades', 'iniciación actividades', 'sii', 'servicio impuestos'],
      name: 'Inicio de Actividades SII'
    },
    'PER_ANU': {
      keywords: ['permiso anuncio', 'publicidad', 'permiso publicidad', 'anuncio', 'propaganda'],
      name: 'Permiso de Anuncio'
    }
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const extractDates = (text: string): Date[] => {
    const dates: Date[] = [];
    const normalizedText = text.toLowerCase();

    // Common date formats
    const datePatterns = [
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
      /\b(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\b/g,
      /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g
    ];

    const months = {
      'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
      'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    };

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(normalizedText)) !== null) {
        try {
          if (match[2] in months) {
            // Spanish format: "3 de abril de 2025"
            const day = parseInt(match[1]);
            const month = months[match[2] as keyof typeof months];
            const year = parseInt(match[3]);
            dates.push(new Date(year, month - 1, day));
          } else {
            // Numeric formats
            const parts = match.slice(1).map(p => parseInt(p));
            if (parts[2] > 1900) { // Year at the end
              dates.push(new Date(parts[2], parts[1] - 1, parts[0]));
            } else if (parts[0] > 1900) { // Year at the start
              dates.push(new Date(parts[0], parts[1] - 1, parts[2]));
            }
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    });

    return dates.filter(date => date.getFullYear() >= 2020 && date.getFullYear() <= 2030);
  };

  const classifyDates = (text: string, dates: Date[]): { issueDate?: Date; expiryDate?: Date } => {
    if (dates.length === 0) return {};
    if (dates.length === 1) return { issueDate: dates[0] };

    const normalizedText = normalizeText(text);
    const issueKeywords = ['emision', 'emitida', 'fecha', 'otorgada', 'concedida'];
    const expiryKeywords = ['vencimiento', 'validez', 'vence', 'hasta', 'expira', 'caduca'];

    let issueDate: Date | undefined;
    let expiryDate: Date | undefined;

    // Sort dates chronologically
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

    // Look for keyword proximity
    dates.forEach(date => {
      const dateStr = date.toLocaleDateString('es-CL');
      const dateIndex = text.indexOf(dateStr);
      
      if (dateIndex !== -1) {
        const contextBefore = normalizedText.substring(Math.max(0, dateIndex - 100), dateIndex);
        const contextAfter = normalizedText.substring(dateIndex, Math.min(text.length, dateIndex + 100));
        
        const hasIssueKeyword = issueKeywords.some(keyword => 
          contextBefore.includes(keyword) || contextAfter.includes(keyword)
        );
        const hasExpiryKeyword = expiryKeywords.some(keyword => 
          contextBefore.includes(keyword) || contextAfter.includes(keyword)
        );

        if (hasIssueKeyword && !issueDate) issueDate = date;
        if (hasExpiryKeyword && !expiryDate) expiryDate = date;
      }
    });

    // If no keywords found, assume first date is issue, second is expiry
    if (!issueDate && !expiryDate) {
      issueDate = sortedDates[0];
      if (sortedDates.length > 1) {
        expiryDate = sortedDates[sortedDates.length - 1];
      }
    }

    return { issueDate, expiryDate };
  };

  const detectPermitType = (text: string): { type: string; name: string; confidence: number } | null => {
    const normalizedText = normalizeText(text);
    
    for (const [code, config] of Object.entries(permitMappings)) {
      const matches = config.keywords.filter(keyword => 
        normalizedText.includes(normalizeText(keyword))
      );
      
      if (matches.length > 0) {
        const confidence = Math.min(matches.length / config.keywords.length + 0.5, 1);
        return { type: code, name: config.name, confidence };
      }
    }

    return null;
  };

  const processFileWithOCR = async (file: File, fileId: string) => {
    try {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 30 } : f
      ));

      const worker = await createWorker('spa', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(30 + (m.progress * 50));
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, progress } : f
            ));
          }
        }
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Process OCR text
      const permitInfo = detectPermitType(text);
      const dates = extractDates(text);
      const { issueDate, expiryDate } = classifyDates(text, dates);

      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: permitInfo ? 'detected' : 'error',
          progress: 100,
          detectedPermit: permitInfo ? {
            ...permitInfo,
            issueDate,
            expiryDate
          } : undefined,
          error: !permitInfo ? 'No se pudo detectar el tipo de permiso' : undefined
        } : f
      ));

    } catch (error) {
      console.error('OCR processing error:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'error',
          progress: 100,
          error: 'Error procesando el archivo'
        } : f
      ));
    }
  };

  const uploadFile = async (file: File, fileId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `docs/${businessId}/${fileName}`;

      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 10 } : f
      ));

      const { data, error } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, url: publicUrl, progress: 20 } : f
      ));

      // Start OCR processing
      await processFileWithOCR(file, fileId);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'error',
          progress: 100,
          error: 'Error subiendo el archivo'
        } : f
      ));
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      file,
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    newFiles.forEach(fileItem => {
      uploadFile(fileItem.file, fileItem.id);
    });
  }, [businessId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const confirmPermit = async (fileId: string, permitData?: {
    type: string;
    name: string;
    issueDate?: Date;
    expiryDate?: Date;
  }) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || !file.url) return;

    const permitInfo = permitData || file.detectedPermit;
    if (!permitInfo) return;

    try {
      // Get permit ID from database using the permit name
      const { data: permit, error: permitError } = await supabase
        .from('permisos')
        .select('id')
        .eq('nombre', permitInfo.name)
        .single();

      if (permitError) {
        console.error('Permit not found, trying fallback:', permitError);
        throw new Error(`No se encontró el permiso: ${permitInfo.name}`);
      }

      // Create or update business permit first
      const { data: businessPermit, error: permitBusinessError } = await supabase
        .from('permisos_negocio')
        .upsert({
          negocio_id: businessId,
          permiso_id: permit.id,
          estado: 'aprobado',
          status: 'approved',
          fecha_emision: permitInfo.issueDate?.toISOString().split('T')[0],
          fecha_vencimiento: permitInfo.expiryDate?.toISOString().split('T')[0],
          proximo_paso: 'Documento subido y aprobado'
        }, {
          onConflict: 'negocio_id,permiso_id'
        })
        .select()
        .single();

      if (permitBusinessError) throw permitBusinessError;

      // Create document record with permit reference
      const { data: document, error: docError } = await supabase
        .from('documentos')
        .insert({
          user_id: user?.id,
          negocio_id: businessId,
          permiso_negocio_id: businessPermit?.id,
          nombre: file.file.name,
          tipo_archivo: file.file.type,
          url_archivo: file.url,
          tamaño_archivo: file.file.size,
          label: permitInfo.name
        })
        .select()
        .single();

      if (docError) throw docError;

      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'confirmed' } : f
      ));

      toast({
        title: "Permiso confirmado",
        description: `${permitInfo.name} ha sido agregado exitosamente.`,
      });

      onPermitAdded();

    } catch (error: any) {
      console.error('Error confirming permit:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el permiso.",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (fileId: string) => {
    setEditingFileId(fileId);
    setModalOpen(true);
  };

  const handleModalConfirm = (permitData: {
    type: string;
    name: string;
    issueDate?: Date;
    expiryDate?: Date;
  }) => {
    if (editingFileId) {
      confirmPermit(editingFileId, permitData);
    }
    setModalOpen(false);
    setEditingFileId(null);
  };

  const handleModalDelete = () => {
    if (editingFileId) {
      removeFile(editingFileId);
    }
    setModalOpen(false);
    setEditingFileId(null);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'detected':
        return <Edit className="h-4 w-4" />;
      case 'confirmed':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return 'Subiendo...';
      case 'processing':
        return 'Procesando con OCR...';
      case 'detected':
        return `Detectado: ${file.detectedPermit?.name}`;
      case 'confirmed':
        return 'Confirmado';
      case 'error':
        return file.error || 'Error';
      default:
        return '';
    }
  };

  const editingFile = editingFileId ? uploadedFiles.find(f => f.id === editingFileId) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Sube tus permisos aquí
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Arrastra y suelta archivos PDF o imágenes de tus permisos. Los detectaremos automáticamente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar archivos
            </p>
            <p className="text-xs text-muted-foreground">
              Formatos soportados: PDF, JPG, PNG (máx. 10MB)
            </p>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Archivos subidos</h3>
              {uploadedFiles.map((file) => (
                <Card key={file.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {file.file.type.startsWith('image/') ? (
                        <Image className="h-8 w-8 text-blue-600" />
                      ) : (
                        <FileText className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium truncate">{file.file.name}</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(file.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{getStatusText(file)}</span>
                          <span className="text-muted-foreground">{file.progress}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                        
                        {file.status === 'detected' && file.detectedPermit && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => confirmPermit(file.id)}
                              className="flex items-center gap-2"
                            >
                              <Check className="h-3 w-3" />
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(file.id)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                          </div>
                        )}
                        
                        {file.status === 'error' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(file.id)}
                            className="flex items-center gap-2 mt-3"
                          >
                            <Edit className="h-3 w-3" />
                            Seleccionar manualmente
                          </Button>
                        )}
                        
                        {file.status === 'confirmed' && (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Confirmado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingFile && (
        <PermitEditModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingFileId(null);
          }}
          onConfirm={handleModalConfirm}
          onDelete={handleModalDelete}
          initialData={editingFile.detectedPermit ? {
            type: editingFile.detectedPermit.type,
            name: editingFile.detectedPermit.name,
            issueDate: editingFile.detectedPermit.issueDate,
            expiryDate: editingFile.detectedPermit.expiryDate
          } : undefined}
          fileName={editingFile.file.name}
        />
      )}
    </>
  );
};

export default PermitUploader;