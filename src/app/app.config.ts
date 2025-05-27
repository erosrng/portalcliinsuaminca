// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './auth.service';
import { NgxSpinnerModule } from 'ngx-spinner';

// *** Importación clave para las animaciones ***
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// ***********************************************

//export const API_URL = 'http://10.0.100.2/practica/api/';
export const API_URL = 'http://insuaminca.proteoerp.org:50080/practica/api/';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(NgxSpinnerModule),
    // *** ¡Añade provideAnimationsAsync() aquí! ***
    provideAnimationsAsync()
  ]
};