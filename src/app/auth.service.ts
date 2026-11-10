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
  segme: string;
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
    const almacen = localStorage.getItem('almacen');

    if (!storedToken && !almacen) {
      this.token = null;
      this.decodedToken = null;
      return;
    }

    try {
      const decoded = this.jwtHelper.decodeToken(storedToken!);
      if (!decoded) {
        throw new Error('AuthService: Decodificación de token fallida (malformado).');
      }

      if (this.jwtHelper.isTokenExpired(storedToken)) {
        throw new Error('Token is expired.');
      }

      this.token = storedToken;
      this.decodedToken = decoded;
    } catch (error) {
      // No se muestran alertas ni se redirige desde aquí: el constructor del
      // servicio no debe tener efectos secundarios. La navegación y el aviso
      // de sesión vencida los manejan el authGuard y el interceptor.
      this.token = null;
      this.decodedToken = null;
    }
  }


  setToken(token: string) {
    // Al iniciar una sesión nueva se eliminan los datos derivados de una
    // sesión anterior (por ejemplo, si el token viejo expiró y el usuario
    // llegó al login sin pasar por logout), para no mezclar clientes.
    this.clearSessionData();
    localStorage.setItem('token', token);
    this.validateAndLoadToken();
  }

  private clearSessionData(): void {
    localStorage.removeItem('codCli');
    localStorage.removeItem('nameFarmaActiva');
    localStorage.removeItem('segme');
    localStorage.removeItem('ubica');
    localStorage.removeItem('almacen');
    this._codCli = null;
    this.isHandlingSessionExpired = false;
  }

  getToken(): string | null {
      const storedToken = localStorage.getItem('token');
      
      // Nueva lógica de exclusión dentro de getToken
      const currentUrl = this.router.url;
      const excludedRoutes = ['/login', '/registrocli', '/se-cliente'];
      const isExcludedPage = excludedRoutes.some(route => currentUrl.includes(route));

      if (!storedToken) {
          // Solo hacemos logout si NO es una página pública
          if (!isExcludedPage) {
              this.logout(true);
          }
          return null;
      }

      if (this.jwtHelper.isTokenExpired(storedToken)) {
          if (!isExcludedPage) {
              this.logout(true);
          }
          return null;
      }

      this.token = storedToken;
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
      const token = localStorage.getItem('token');
      if (!token || this.jwtHelper.isTokenExpired(token)) {
          return false;
      }
      // Si llegamos aquí, el token existe y es válido
      if (!this.decodedToken) {
          this.decodedToken = this.jwtHelper.decodeToken(token);
      }
      return !!this.decodedToken && this.decodedToken.logged_in;
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

  getSegme(): string | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.segme : null;
  }

  getApiTime(): number | null {
    this.getToken();
    return this.decodedToken ? this.decodedToken.API_TIME : null;
  }

  async logout(showMsg: boolean = false): Promise<void> {
  if (showMsg) {
    await Swal.fire({
      icon: 'info',
      title: 'Sesión Finalizada',
      text: 'Tu sesión ha vencido o los datos de cliente no son válidos. Por seguridad, debes ingresar de nuevo.',
      confirmButtonColor: '#1a237e', // Tu azul corporativo
      timer: 4000,
      timerProgressBar: true
    });
  }

  // Limpieza total
  localStorage.clear();
  this.token = null;
  this.decodedToken = null;
  this._codCli = null;
  this.isHandlingSessionExpired = false;
  
  // Redirección
  this.router.navigate(['/login']);
}

  // Modificado para aceptar un token como argumento opcional
  async handleSessionExpired(invalidToken: string | null = null): Promise<void> {
    if (this.isHandlingSessionExpired) {
      return;
    }
    this.isHandlingSessionExpired = true;


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
      text: alertText, 
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    this.logout();
  }

  getCodCli(): string | null {
    //if (!this._codCli) {
      this._codCli = localStorage.getItem('codCli');
      if (!this._codCli) {
        if (this.isLoggedIn()) {
            this._codCli = this.getUsuario();
            localStorage.setItem('codCli', this._codCli || '');
        } else {
            this._codCli = null;
        }
      }
    //}
    //console.log(this._codCli);
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

    getNombreFarmaciaActiva() {
        return localStorage.getItem('nameFarmaActiva')
    }

    getSegmeCli(): string | null {
        return localStorage.getItem('segme');
    }

    getUbicaCli(): string | null {
        return localStorage.getItem('ubica');
    }

    setSegmeCli(segme: string): void {
        localStorage.setItem('segme', segme);
    }

    setUbicaCli(ubica: string): void {
        localStorage.setItem('ubica', ubica);
    }
}
