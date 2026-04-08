import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // isLoggedIn() internamente ejecutará validateAndLoadToken()
  if (authService.isLoggedIn()) {
    return true;
  }

  // Si no está logueado, redirigimos al login
  // Usamos parseUrl para una redirección limpia
  return router.parseUrl('/login');
};