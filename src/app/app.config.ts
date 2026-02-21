// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './auth.service';
import { NgxSpinnerModule } from 'ngx-spinner';

// *** Importación clave para las animaciones ***
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
// ***********************************************

//URL PRACTICA INTERNA 
export const API_URL = 'http://10.0.100.2/practica/api/';
export const URLSOLA = 'http://10.0.100.2/';
export const PROTEO_URL_ALONE = 'http://10.0.100.2/practica/';

//PRACTICA SOLO PRUEBAS LOCALES
export const API_URLINTER = 'http://10.0.100.2/practica/api/';
export const URLSOLAINTER = 'http://10.0.100.2/';
export const PROTEO_URL_ALONEINTER = 'http://10.0.100.2/practica/'; 

//URL PRACTICA EXTERNA

/* export const API_URL = 'https://d2wnvkodoh477y.cloudfront.net/practica/api/';
export const URLSOLA = 'https://d2wnvkodoh477y.cloudfront.net/';
export const PROTEO_URL_ALONE = 'https://d2wnvkodoh477y.cloudfront.net/practica/';

 export const API_URLINTER = 'https://d2wnvkodoh477y.cloudfront.net/practica/api/';
export const URLSOLAINTER = 'https://d2wnvkodoh477y.cloudfront.net/';
export const PROTEO_URL_ALONEINTER = 'https://d2wnvkodoh477y.cloudfront.net/practica/';  */
 



//URL DE INSUAMINCA PARA TRABAJAR 
/* export const API_URLINTER = 'https://d2wnvkodoh477y.cloudfront.net/proteoerp/api/';
export const URLSOLAINTER = 'https://d2wnvkodoh477y.cloudfront.net/';
export const PROTEO_URL_ALONEINTER = 'https://d2wnvkodoh477y.cloudfront.net/proteoerp/'; 

export const API_URL = 'https://insuaminca.org/insuaminca/api/'; 
export const URLSOLA = 'https://insuaminca.org/';
export const PROTEO_URL_ALONE = 'https://insuaminca.org/insuaminca/';  */

//MI MAQUINA
/* export const API_URL = 'http://localhost/insuaminca/api/';
export const URLSOLA = 'http://localhost/';
export const PROTEO_URL_ALONE = 'http://localhost/insuaminca/';

export const API_URLINTER = 'http://localhost/insuaminca/api/';
export const URLSOLAINTER = 'http://localhost/';
export const PROTEO_URL_ALONEINTER = 'http://localhost/insuaminca/';  */


//export const API_URL = 'https://d2wnvkodoh477y.cloudfront.net/practica/api/'; 
export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false || 'none'
        }
      }
    }),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(NgxSpinnerModule),
    provideAnimationsAsync()
  ]
};
