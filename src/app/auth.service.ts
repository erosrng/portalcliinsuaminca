import { Injectable } from '@angular/core';
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

}