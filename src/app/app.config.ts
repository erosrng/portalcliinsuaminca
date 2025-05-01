import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './auth.service'; 
import { NgxSpinnerModule } from 'ngx-spinner';

//export const API_URL = 'http://insuaminca.proteoerp.org:50080/practica/api/ptprv/post/';
//export const API_URL2 = 'http://insuaminca.proteoerp.org:50080/practica/api/ptprv/';

// ACCESO INTERNO INSUAMINCA
// export const PROTEO_URL_ALONE = 'http://10.0.100.2/practica/'
// export const API_URL = 'http://10.0.100.2/practica/api/ptprv/post/';
// export const API_URL2 = 'http://10.0.100.2/practica/api/';
// export const PROTEO_URL = 'http://10.0.100.2/practica/api/ptprv/';
// export const API_FAST ='http://127.0.0.1:8000';

// ACCESO EXTERNO INSUAMINCA
// export const PROTEO_URL_ALONE = 'http://186.167.69.10:50080/practica/';
// export const API_URL = 'http://186.167.69.10:50080/practica/api/ptprv/post/';
// export const API_URL2 = 'http://186.167.69.10:50080/practica/api/ptprv/';
// export const PROTEO_URL = 'http://186.167.69.10:50080/practica/api/ptprv/';
// export const API_FAST ='http://127.0.0.1:8000';


// ACESSO DE SERVER LOCAL
export const PROTEO_URL_ALONE = 'http://192.168.1.48/';
export const API_URL = 'http://192.168.1.48/proteoerp/api/ptprv/post/';
export const API_URL2 = 'http://192.168.1.48/proteoerp/api/ptprv/';
export const PROTEO_URL = 'http://192.168.1.48/proteoerp/api/ptprv/';
// export const API_FAST ='http://1http://192.168.1.48:5000';
export const API_FAST ='http://0.0.0.0:5000';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(NgxSpinnerModule),
  ]
};