import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    tap({
      next: (event: any) => {
        // Validamos si la respuesta del API trae el mensaje de error de token
        if (event.body && event.body.result === false && event.body.message === "API key invalida: Token Time Expire.") {
          console.warn('Token expirado detectado por el API. Cerrando sesión...');
          authService.logout(true);
        }
      },
      error: (err) => {
        // Si el servidor responde con un error 401 (No autorizado)
        if (err.status === 401) {
          authService.logout(true);
        }
      }
    })
  );
};