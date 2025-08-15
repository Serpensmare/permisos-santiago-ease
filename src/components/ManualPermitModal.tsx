import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ManualPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onPermitAdded: () => void;
}

interface Permit {
  id: string;
  nombre: string;
}

const ManualPermitModal: React.FC<ManualPermitModalProps> = ({
  isOpen,
  onClose,
  businessId,
  onPermitAdded
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [permits, setPermits] = useState<Permit[]>([]);
  const [selectedPermitId, setSelectedPermitId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPermits();
    }
  }, [isOpen]);

  const fetchPermits = async () => {
    try {
      const { data, error } = await supabase
        .from('permisos')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      setPermits(data || []);
    } catch (error) {
      console.error('Error fetching permits:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermitId || !user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('permisos_negocio')
        .upsert({
          negocio_id: businessId,
          permiso_id: selectedPermitId,
          estado: 'pendiente',
          status: 'required',
          fecha_emision: issueDate || null,
          fecha_vencimiento: expiryDate || null,
          proximo_paso: 'Agregar documento de respaldo'
        }, {
          onConflict: 'negocio_id,permiso_id'
        });

      if (error) throw error;

      toast({
        title: 'Permiso agregado',
        description: 'El permiso ha sido agregado exitosamente.',
      });

      onPermitAdded();
      handleClose();

    } catch (error: any) {
      console.error('Error adding permit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el permiso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPermitId('');
    setIssueDate('');
    setExpiryDate('');
    onClose();
  };

  const selectedPermit = permits.find(p => p.id === selectedPermitId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Agregar Permiso Manualmente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="permit">Tipo de Permiso</Label>
            <Select value={selectedPermitId} onValueChange={setSelectedPermitId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de permiso" />
              </SelectTrigger>
              <SelectContent>
                {permits.map((permit) => (
                  <SelectItem key={permit.id} value={permit.id}>
                    {permit.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Fecha de Emisión</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {selectedPermit && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Permiso seleccionado:</strong> {selectedPermit.nombre}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Podrás subir el documento de respaldo después de crear el permiso.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedPermitId}>
              {loading ? 'Agregando...' : 'Agregar Permiso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPermitModal;