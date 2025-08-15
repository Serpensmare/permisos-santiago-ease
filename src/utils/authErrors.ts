// Helper function to translate Supabase auth error messages to Spanish
export const translateAuthError = (error: any): string => {
  if (!error?.message) return 'Error desconocido';
  
  const message = error.message.toLowerCase();
  
  // Common Supabase auth error translations
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Email o contraseña incorrectos';
  }
  
  if (message.includes('email not confirmed')) {
    return 'Debes confirmar tu email antes de iniciar sesión';
  }
  
  if (message.includes('user already registered')) {
    return 'Ya existe una cuenta con este email';
  }
  
  if (message.includes('password should be at least 6 characters')) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  
  if (message.includes('invalid email')) {
    return 'El formato del email no es válido';
  }
  
  if (message.includes('email rate limit exceeded')) {
    return 'Demasiados intentos. Espera unos minutos antes de intentar nuevamente';
  }
  
  if (message.includes('signup is disabled')) {
    return 'El registro está temporalmente deshabilitado';
  }
  
  if (message.includes('email link is invalid') || message.includes('token has expired')) {
    return 'El enlace de confirmación ha expirado o es inválido';
  }
  
  if (message.includes('too many requests')) {
    return 'Demasiadas solicitudes. Intenta más tarde';
  }
  
  if (message.includes('weak password')) {
    return 'La contraseña es muy débil. Usa una combinación de letras, números y símbolos';
  }
  
  // Return original message if no translation found
  return error.message;
};