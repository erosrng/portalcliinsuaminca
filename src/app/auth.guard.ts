import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // isLoggedIn() valida que el token exista, no esté expirado y tenga logged_in
  if (authService.isLoggedIn()) {
    return true;
  }

  // Si no está logueado, redirigimos al login
  // Usamos parseUrl para una redirección limpia
  return router.parseUrl('/login');
};

/**
 * Guard para páginas públicas de autenticación (login).
 * Si ya existe una sesión válida, siempre redirige al home para evitar
 * que se sobrescriba la sesión iniciada con otro usuario.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.parseUrl('/home');
  }

  return true;
};
