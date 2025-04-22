import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './auth.service'; 
import { NgxSpinnerModule } from 'ngx-spinner';
export const API_URL = 'http://10.0.100.2/practica/api/ptprv/post/';
export const API_URL2 = 'http://10.0.100.2/practica/api/ptprv/';

// export const API_URL = 'http://186.167.69.10:50080/practica/api/ptprv/post/'
// export const API_URL2 = 'http://186.167.69.10:50080/practica/api/ptprv/'




export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(NgxSpinnerModule),
  ]
};