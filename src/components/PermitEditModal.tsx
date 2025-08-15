import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PermitEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permitData: {
    type: string;
    name: string;
    issueDate?: Date;
    expiryDate?: Date;
  }) => void;
  onDelete: () => void;
  initialData?: {
    type?: string;
    name?: string;
    issueDate?: Date;
    expiryDate?: Date;
  };
  fileName: string;
}

const PermitEditModal: React.FC<PermitEditModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  initialData,
  fileName
}) => {
  const [permitType, setPermitType] = useState(initialData?.type || '');
  const [issueDate, setIssueDate] = useState<Date | undefined>(initialData?.issueDate);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(initialData?.expiryDate);

  const permitOptions = [
    { value: 'PAT_MUN', label: 'Patente Municipal' },
    { value: 'RES_SAN', label: 'Resolución Sanitaria' },
    { value: 'CERT_BOM', label: 'Certificado de Bomberos' },
    { value: 'SII_INIT', label: 'Inicio de Actividades SII' },
    { value: 'PER_ANU', label: 'Permiso de Anuncio' },
  ];

  const handleConfirm = () => {
    if (!permitType) return;

    const selectedPermit = permitOptions.find(p => p.value === permitType);
    if (!selectedPermit) return;

    onConfirm({
      type: permitType,
      name: selectedPermit.label,
      issueDate,
      expiryDate
    });
  };

  const resetForm = () => {
    setPermitType(initialData?.type || '');
    setIssueDate(initialData?.issueDate);
    setExpiryDate(initialData?.expiryDate);
  };

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, initialData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData?.type ? 'Editar Permiso Detectado' : 'Seleccionar Tipo de Permiso'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Info */}
          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-sm font-medium">Archivo:</p>
            <p className="text-sm text-muted-foreground truncate">{fileName}</p>
          </div>

          {/* Permit Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="permit-type">Tipo de Permiso</Label>
            <Select value={permitType} onValueChange={setPermitType}>
              <SelectTrigger id="permit-type">
                <SelectValue placeholder="Selecciona el tipo de permiso" />
              </SelectTrigger>
              <SelectContent>
                {permitOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue Date */}
          <div className="space-y-2">
            <Label>Fecha de Emisión</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !issueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {issueDate ? format(issueDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={issueDate}
                  onSelect={setIssueDate}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label>Fecha de Vencimiento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, "PPP", { locale: es }) : "Seleccionar fecha (opcional)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => issueDate ? date < issueDate : date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="destructive" onClick={onDelete} className="mr-auto">
            <X className="h-4 w-4 mr-2" />
            Eliminar Archivo
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!permitType}
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PermitEditModal;