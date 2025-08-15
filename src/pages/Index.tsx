import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, FileText, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen bg-secondary/50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary rounded-full">
                <Building2 className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4">¡Bienvenido a Permisos Santiago!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ya tienes una cuenta activa. Ve a tu dashboard para gestionar tus negocios.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="text-lg px-8 py-3">
                Ir al Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-full">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
            Permisos Santiago
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Gestiona todos los permisos de tu negocio en Santiago de forma simple y organizada
          </p>
          <div className="flex justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Gestión Simple</h3>
              <p className="text-muted-foreground">
                Administra todos los permisos de tus negocios desde un solo lugar, 
                con una interfaz clara y fácil de usar.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Documentos Organizados</h3>
              <p className="text-muted-foreground">
                Sube y organiza todos tus documentos importantes en un repositorio 
                seguro y accesible desde cualquier lugar.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent>
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Alertas Inteligentes</h3>
              <p className="text-muted-foreground">
                Recibe notificaciones por email o WhatsApp sobre vencimientos 
                y próximos pasos para mantener tus permisos al día.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Process Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-primary mb-12">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Regístrate', desc: 'Crea tu cuenta con email' },
              { step: '2', title: 'Agrega tu negocio', desc: 'Registra la información básica' },
              { step: '3', title: 'Gestiona permisos', desc: 'Ve el estado de cada permiso' },
              { step: '4', title: 'Mantente al día', desc: 'Recibe alertas de vencimientos' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-primary mb-4">
            ¿Listo para simplificar la gestión de tus permisos?
          </h2>
          <p className="text-muted-foreground mb-6">
            Únete a cientos de emprendedores que ya están usando Permisos Santiago
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Comenzar Gratis
              <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
