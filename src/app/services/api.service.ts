import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  urlBase = 'http://10.0.100.2/proteoerp/api'

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
