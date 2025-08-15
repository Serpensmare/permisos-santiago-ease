import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { translateAuthError } from '@/utils/authErrors';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { user, signIn, signUp, sendMagicLink } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const type = params.get('type');
      if (type === 'signup') {
        setEmailConfirmed(true);
        setActiveTab('signin');
        toast({
          title: 'Correo confirmado',
          description: 'Tu cuenta está activa. Ingresa con tus credenciales.',
        });
        // Clean URL hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    if (!emailSent || resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [emailSent, resendCooldown]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: translateAuthError(error),
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión exitosamente',
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if passwords match
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, nombreCompleto);

    if (error) {
      toast({
        title: 'Error al registrarse',
        description: translateAuthError(error),
        variant: 'destructive',
      });
    } else {
      setEmailSent(true);
      setResendCooldown(30);
      toast({
        title: 'Cuenta creada exitosamente',
        description: 'Revisa tu email para confirmar tu cuenta',
      });
    }

    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await sendMagicLink(email);

    if (error) {
      toast({
        title: 'Error al enviar enlace',
        description: translateAuthError(error),
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Enlace enviado',
        description: 'Revisa tu email para el enlace de acceso',
      });
    }

    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    if (resending || resendCooldown > 0 || !email) return;
    setResending(true);
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectUrl }
    });

    if (error) {
      toast({
        title: 'Error al reenviar',
        description: translateAuthError(error),
        variant: 'destructive',
      });
    } else {
      setResendCooldown(30);
      toast({
        title: 'Correo reenviado',
        description: 'Hemos enviado un nuevo enlace de confirmación.',
      });
    }

    setResending(false);
  };

  return (
    <div className="min-h-screen bg-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary">Permisos Santiago</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona los permisos de tu negocio de forma simple
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accede a tu cuenta</CardTitle>
            <CardDescription>
              Ingresa con tu email o crea una cuenta nueva
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">¡Cuenta creada exitosamente!</h3>
                  <p className="text-muted-foreground">
                    Hemos enviado un email de confirmación a:
                  </p>
                  <p className="font-medium text-primary">{email}</p>
                  <p className="text-sm text-muted-foreground">
                    Revisa tu bandeja de entrada y haz click en el enlace para activar tu cuenta.
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground">El enlace de confirmación expira en 5 minutos.</p>
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={resending || resendCooldown > 0}
                    className="w-full"
                  >
                    {resending ? 'Reenviando...' : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar correo de confirmación'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                      setPassword('');
                      setConfirmPassword('');
                      setNombreCompleto('');
                    }}
                    className="w-full"
                  >
                    Crear otra cuenta
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {emailConfirmed && (
                  <div className="text-center p-4 rounded-md border bg-primary/5 text-foreground">
                    <p className="font-medium text-primary">Correo confirmado</p>
                    <p className="text-sm text-muted-foreground">Tu cuenta está activa. Ingresa con tus credenciales.</p>
                  </div>
                )}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signup' | 'signin')} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Registrarse</TabsTrigger>
                  <TabsTrigger value="signin">Ingresar</TabsTrigger>
                </TabsList>

                {/* Sign Up Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Juan Pérez"
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                </form>
              </TabsContent>
              </Tabs>
              </>
            )}

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-primary hover:underline">
                ← Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;