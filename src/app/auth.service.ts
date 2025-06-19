/* import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

interface DecodedToken {
  usuario: string;
  nombre: string;
  logged_in: boolean;
  tipo_u: string;
  almacen: string;
  tasa: string;
  cmatriz: string;
  lgrup: { grupo: string; nom_grup: string;}[];
  clientes: { cliente: string; nombre: string; rifci: string }[];
  API_TIME: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token: string | null = null;
  private decodedToken: DecodedToken | null = null;
  private jwtHelper = new JwtHelperService();
  private _codCli: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
    try {
      this.decodedToken = this.jwtHelper.decodeToken(token);
    } catch (error) {
      console.error('Error decodificando token:', error);
      this.decodedToken = null;
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
      if (this.token) {
        try {
          this.decodedToken = this.jwtHelper.decodeToken(this.token);
        } catch (error) {
          console.error('Error decodificando token:', error);
          this.decodedToken = null;
        }
      }
    }
    return this.token;
  }

  removeToken() {
    this.token = null;
    this.decodedToken = null;
    localStorage.removeItem('token');
  }

  getUsuario(): string | null {
    return this.decodedToken ? this.decodedToken.usuario : null;
  }

  getNombre(): string | null {
    return this.decodedToken ? this.decodedToken.nombre : null;
  }

  isLoggedIn(): boolean {
    return !!this.decodedToken && this.decodedToken.logged_in;
  }

  getTipoU(): string | null {
    return this.decodedToken ? this.decodedToken.tipo_u : null;
  }

  getAlmacen(): string | null {
    return this.decodedToken ? this.decodedToken.almacen : null;
  }

  getTasa(): number {
    if (!this.decodedToken || this.decodedToken.tasa === undefined || this.decodedToken.tasa === null) {
      return 0;
    }
  
    const parsedTasa = parseFloat(this.decodedToken.tasa);
    return isNaN(parsedTasa) ? 0 : parsedTasa;
  }

  getCmatriz(): string | null {
    return this.decodedToken ? this.decodedToken.cmatriz : null;
  }

  getApiTime(): number | null {
    return this.decodedToken ? this.decodedToken.API_TIME : null;
  }

  logout() {
    localStorage.clear();
    this.removeToken();
  }

  getCodCli(): string | null {
    if (!this._codCli) {
      this._codCli = localStorage.getItem('codCli');
      if (!this._codCli) {
        this._codCli = this.getUsuario();
        localStorage.setItem('codCli', this._codCli || '');
      }
    }
    return this._codCli;
  }

  setCodCli(codCli: string | null): void {
    this._codCli = codCli;
    localStorage.setItem('codCli', codCli || '');
  }

  getClientes(): { cliente: string; nombre: string; rifci: string }[] | null {
    return this.decodedToken ? this.decodedToken.clientes : null;
  }

  getLgrup(): { grupo: string; nom_grup: string; }[] | null {
    return this.decodedToken ? this.decodedToken.lgrup : null;
  }

} */


// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

interface DecodedToken {
  usuario: string;
  nombre: string;
  logged_in: boolean;
  tipo_u: string;
  almacen: string;
  tasa: string;
  cmatriz: string;
  lgrup: { grupo: string; nom_grup: string;}[];
  clientes: { cliente: string; nombre: string; rifci: string }[];
  API_TIME: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token: string | null = null;
  private decodedToken: DecodedToken | null = null;
  private jwtHelper = new JwtHelperService();
  private _codCli: string | null = null;
  private isHandlingSessionExpired = false;

  constructor(private router: Router) {
    this.validateAndLoadToken();
  }

  private validateAndLoadToken(): void {
    const storedToken = localStorage.getItem('token');

    // Obtener la URL actual para verificar si es la ruta de login
    const currentUrl = this.router.url;
    const isLoginPage = currentUrl === '/login';

    if (!storedToken) {
      this.token = null;
      this.decodedToken = null;

      if (!isLoginPage) {
        this.handleSessionExpired(null);
      } 
      return;
    }

    try {
      const decoded = this.jwtHelper.decodeToken(storedToken);
      if (!decoded) {
        //console.error('AuthService: Decodificación de token fallida (malformado).');
        throw new Error('AuthService: Decodificación de token fallida (malformado)..');
      }

      if (this.jwtHelper.isTokenExpired(storedToken)) {
        throw new Error('Token is expired.');
      }

      this.token = storedToken;
      this.decodedToken = decoded;
      //console.log('AuthService: Token válido cargado y decodificado en memoria.');
    } catch (error) {
      //console.error('AuthService: Error CRÍTICO durante la validación de token (decodificación o expiración):', error);
      this.token = null;
      this.decodedToken = null;

      // Solo llama a handleSessionExpired si NO estamos en la página de login
      if (!isLoginPage) {
        //console.log('AuthService: Token inválido/expirado y NO estamos en la página de login. Iniciando proceso de expiración/logout.');
        this.handleSessionExpired(storedToken); // Pasa el token problemático
      }/*  else {
        console.log('AuthService: Token inválido/expirado, pero estamos en la página de login. No se muestra alerta ni se redirige.');
      } */
    }
  }


  setToken(token: string) {
    localStorage.setItem('token', token);
    this.validateAndLoadToken();
  }

  getToken(): string | null {
    if (this.token && this.decodedToken && !this.jwtHelper.isTokenExpired(this.token)) {
      return this.token;
    }
    this.validateAndLoadToken();
    return this.token;
  }

  removeToken() {
    this.token = null;
    this.decodedToken = null;
    localStorage.removeItem('token');
  }

  getUsuario(): string | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.usuario : null;
  }

  getNombre(): string | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.nombre : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.decodedToken && this.decodedToken.logged_in;
  }

  getTipoU(): string | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.tipo_u : null;
  }

  getAlmacen(): string | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.almacen : null;
  }

  getTasa(): number {
    this.getToken();
    if (!this.decodedToken || this.decodedToken.tasa === undefined || this.decodedToken.tasa === null) {
      return 0;
    }
    const parsedTasa = parseFloat(this.decodedToken.tasa);
    return isNaN(parsedTasa) ? 0 : parsedTasa;
  }

  getCmatriz(): string | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.cmatriz : null;
  }

  getApiTime(): number | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.API_TIME : null;
  }

  logout(): void {
    localStorage.clear();
    this.removeToken();
    this.isHandlingSessionExpired = false;
    this.router.navigate(['/login']);
  }

  // Modificado para aceptar un token como argumento opcional
  async handleSessionExpired(invalidToken: string | null = null): Promise<void> {
    if (this.isHandlingSessionExpired) {
      return;
    }
    this.isHandlingSessionExpired = true;

    console.warn('Sesión expirada o token inválido. Mostrando alerta y redirigiendo al login...');

    let alertText = 'Tu sesión ha caducado o el token es inválido. Serás redirigido al inicio de sesión.';
    if (invalidToken) {
      // Recorta el token para que no sea excesivamente largo en la alerta
      const displayToken = invalidToken.length > 50 ? invalidToken.substring(0, 50) + '...' : invalidToken;
      alertText += `\n\nToken afectado: ${displayToken}`;
    } else {
      alertText += `\n\nToken no disponible o nulo.`;
    }

    await Swal.fire({
      icon: 'warning',
      title: 'Sesión Expirada',
      text: alertText, // Usa el texto con el token
      timer: 4000, // Aumentado el timer a 4 segundos para que dé tiempo a leer el token
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    this.logout();
  }

  getCodCli(): string | null {
    if (!this._codCli) {
      this._codCli = localStorage.getItem('codCli');
      if (!this._codCli) {
        if (this.isLoggedIn()) {
            this._codCli = this.getUsuario();
            localStorage.setItem('codCli', this._codCli || '');
        } else {
            this._codCli = null;
        }
      }
    }
    return this._codCli;
  }

  setCodCli(codCli: string | null): void {
    this._codCli = codCli;
    localStorage.setItem('codCli', codCli || '');
  }

  getClientes(): { cliente: string; nombre: string; rifci: string }[] | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.clientes : null;
  }

  getLgrup(): { grupo: string; nom_grup: string; }[] | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.lgrup : null;
  }
}