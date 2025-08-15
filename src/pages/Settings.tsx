import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Bell, Phone, Mail, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface ProfileData {
  nombre_completo: string;
  telefono_whatsapp: string;
  alertas_activas: boolean;
  tipo_notificacion: string;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    nombre_completo: '',
    telefono_whatsapp: '',
    alertas_activas: true,
    tipo_notificacion: 'email',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfileData({
          nombre_completo: data.nombre_completo || '',
          telefono_whatsapp: data.telefono_whatsapp || '',
          alertas_activas: data.alertas_activas ?? true,
          tipo_notificacion: data.tipo_notificacion || 'email',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profileData,
        });

      if (error) throw error;

      toast({
        title: 'Configuración guardada',
        description: 'Tus preferencias han sido actualizadas exitosamente',
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error al guardar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
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
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">
              Personaliza tus preferencias y configuración de alertas
            </p>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Tu email no se puede cambiar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={profileData.nombre_completo}
                  onChange={(e) => handleInputChange('nombre_completo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Número de WhatsApp</Label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md">
                    <span className="text-sm text-muted-foreground">+56</span>
                  </div>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="912345678"
                    value={profileData.telefono_whatsapp}
                    onChange={(e) => handleInputChange('telefono_whatsapp', e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Incluye el número sin el código de país (+56)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configuración de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activar Alertas</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe notificaciones sobre vencimientos y actualizaciones
                  </p>
                </div>
                <Switch
                  checked={profileData.alertas_activas}
                  onCheckedChange={(checked) => handleInputChange('alertas_activas', checked)}
                />
              </div>

              {profileData.alertas_activas && (
                <div className="space-y-2">
                  <Label htmlFor="tipo-notificacion">Tipo de Notificación</Label>
                  <Select
                    value={profileData.tipo_notificacion}
                    onValueChange={(value) => handleInputChange('tipo_notificacion', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de notificación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Solo Email
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Solo WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="ambos">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Email y WhatsApp
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {profileData.tipo_notificacion !== 'email' && !profileData.telefono_whatsapp && (
                    <p className="text-sm text-destructive">
                      Debes agregar tu número de WhatsApp para recibir notificaciones
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
              size="lg"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>

          {/* Help Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Sobre las Alertas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Las alertas te notificarán 30, 15 y 7 días antes del vencimiento de tus permisos, 
                    y cuando cambien de estado. Puedes elegir recibir notificaciones por email, 
                    WhatsApp o ambos medios.
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

export default Settings;