import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {API_FAST, PROTEO_URL_ALONE} from '../app.config';
import {AuthService} from "../auth.service";

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  urlBase = PROTEO_URL_ALONE;
  urlFast = API_FAST;

  constructor(
      private httpClient: HttpClient,
      public authService: AuthService,
  ) { }


  /**
   * Metodo para hacer llamada a login 
   * @param info -> Informacion del user
   * @returns -> Observable
   */
  login(info: any): Observable<any> {

    const apiUrl = this.urlBase + '/logincli/logincli'
    console.log('gf')
    return this.httpClient.post(apiUrl, info)
  }

  // Para registrar log de segumiento de login de usuarios
  setLogUser(user: string): Observable<any> {
    const aux = {usuario: user}
    const apiUrl = this.urlFast + '/log_usuario'
    return this.httpClient.post(apiUrl, aux)
  }

  // Para almacenar los pedidos generados
  generate_ped(info: any): Observable<any> {
    const apiUrl = this.urlFast + '/pedidos_vendedor'
    return this.httpClient.post(apiUrl, info)
  }

  //Para obtener los pedidos realizados por un usuario
  get_historial_by_user(user: string) : Observable<any> {
    const apiUrl = this.urlFast + '/pedidos_vendedor/usuario/' + user
    return this.httpClient.get(apiUrl)
  }

  //Para obtener los pedidos realizados por un proveedor
  get_historial_by_prov(user: string) : Observable<any> {
    const apiUrl = this.urlFast + '/pedidos_vendedor/proveedor/' + user
    return this.httpClient.get(apiUrl)
  }
}
