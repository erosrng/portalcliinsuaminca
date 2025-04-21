import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // urlBase = 'http://186.167.69.10:50080/proteoerp/api'
  urlBase = 'http://insuaminca.proteoerp.org:50080/practica/'

  constructor(private httpClient: HttpClient) { }


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
}
