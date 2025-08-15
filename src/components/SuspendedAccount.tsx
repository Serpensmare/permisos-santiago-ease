import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Users, Building2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

interface BusinessSuspended {
  id: string;
  nombre: string;
  estado?: string;
  fecha_suspension?: string;
}

const SuspendedAccount = () => {
  const { user } = useAuth();
  const [suspendedBusinesses, setSuspendedBusinesses] = useState<BusinessSuspended[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuspendedBusinesses();
    }
  }, [user]);

  const fetchSuspendedBusinesses = async () => {
    try {
      // For now, we'll just show the static suspended message since 
      // the negocios table doesn't have an estado column yet
      // This would be added when implementing payment/suspension functionality
      setSuspendedBusinesses([]);
    } catch (error) {
      console.error('Error fetching suspended businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-red-200 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-2xl text-red-800 mb-2">
                Cuenta Suspendida
              </CardTitle>
              <p className="text-red-600">
                Tu cuenta ha sido suspendida por falta de pago
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Suspended Businesses */}
            {suspendedBusinesses.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Negocios Suspendidos
                </h3>
                {suspendedBusinesses.map((business) => (
                  <div key={business.id} className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{business.nombre}</span>
                      <Badge variant="destructive">Suspendido</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Information */}
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Razón de la suspensión:</strong> Pago mensual pendiente.
                <br />
                Tu servicio será reactivado automáticamente una vez que se procese el pago.
              </AlertDescription>
            </Alert>

            {/* What's Restricted */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                Acciones Restringidas
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  Subir nuevos documentos
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  Crear nuevos negocios
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Acceder al panel de gestión
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                ¿Necesitas ayuda o tienes preguntas sobre tu cuenta?
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <a 
                    href="https://wa.me/56912345678?text=Hola,%20mi%20cuenta%20está%20suspendida%20y%20necesito%20ayuda%20con%20el%20pago"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                    </svg>
                    Contactar por WhatsApp
                  </a>
                </Button>
                
                <Button variant="outline" asChild>
                  <a href="mailto:soporte@tuapp.com">
                    Enviar Email
                  </a>
                </Button>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              Una vez realizado el pago, tu cuenta será reactivada dentro de las próximas 24 horas.
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SuspendedAccount;