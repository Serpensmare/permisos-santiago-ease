import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Negocio {
  id: string;
  nombre: string;
}

interface Permiso {
  id: string;
  nombre: string;
}

interface AddPermisoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermisoAdded: () => void;
}

const AddPermisoModal: React.FC<AddPermisoModalProps> = ({
  isOpen,
  onClose,
  onPermisoAdded
}) => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [selectedNegocio, setSelectedNegocio] = useState<string>('');
  const [selectedPermiso, setSelectedPermiso] = useState<string>('');
  const [fechaEmision, setFechaEmision] = useState<string>('');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('');
  const [proximoPaso, setProximoPaso] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNegocios();
      fetchPermisos();
      setFechaEmision(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const fetchNegocios = async () => {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select('id, nombre')
        .order('nombre');
      
      if (error) throw error;
      setNegocios(data || []);
    } catch (error) {
      console.error('Error fetching negocios:', error);
    }
  };

  const fetchPermisos = async () => {
    try {
      const { data, error } = await supabase
        .from('permisos')
        .select('id, nombre')
        .order('nombre');
      
      if (error) throw error;
      setPermisos(data || []);
    } catch (error) {
      console.error('Error fetching permisos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNegocio || !selectedPermiso) {
      toast.error('Por favor selecciona un negocio y un permiso');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('permisos_negocio')
        .insert({
          negocio_id: selectedNegocio,
          permiso_id: selectedPermiso,
          fecha_emision: fechaEmision || null,
          fecha_vencimiento: fechaVencimiento || null,
          proximo_paso: proximoPaso || null,
          estado: 'pendiente'
        });

      if (error) throw error;
      
      toast.success('Permiso agregado exitosamente');
      onPermisoAdded();
      handleClose();
    } catch (error) {
      console.error('Error adding permiso:', error);
      toast.error('Error al agregar el permiso');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedNegocio('');
    setSelectedPermiso('');
    setFechaEmision('');
    setFechaVencimiento('');
    setProximoPaso('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Permiso</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="negocio">Negocio</Label>
            <Select value={selectedNegocio} onValueChange={setSelectedNegocio}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un negocio" />
              </SelectTrigger>
              <SelectContent>
                {negocios.map((negocio) => (
                  <SelectItem key={negocio.id} value={negocio.id}>
                    {negocio.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="permiso">Tipo de Permiso</Label>
            <Select value={selectedPermiso} onValueChange={setSelectedPermiso}>
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

          <div>
            <Label htmlFor="fechaEmision">Fecha de Emisión</Label>
            <Input
              id="fechaEmision"
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
            <Input
              id="fechaVencimiento"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="proximoPaso">Próximo Paso (opcional)</Label>
            <Input
              id="proximoPaso"
              value={proximoPaso}
              onChange={(e) => setProximoPaso(e.target.value)}
              placeholder="Ej: Entregar documentos en oficina municipal"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Agregando...' : 'Agregar Permiso'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPermisoModal;