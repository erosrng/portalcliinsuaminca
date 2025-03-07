import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; // Importa HTTP_INTERCEPTORS
import { routes } from './app.routes';
import { AuthGuard } from './auth.guard';
import { AuthInterceptor } from './auth.interceptor'; // Importa AuthInterceptor

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    { provide: AuthGuard, useClass: AuthGuard },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // Proporciona AuthInterceptor
  ]
};