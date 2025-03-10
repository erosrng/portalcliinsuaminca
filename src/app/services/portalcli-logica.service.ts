import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../auth.service';
import { Router } from '@angular/router';
import { API_URL } from '../app.config';
@Injectable({
  providedIn: 'root',
})
export class PortalcliLogicaService {

  private isMenuOpenSubject = new BehaviorSubject<boolean>(true);
  isMenuOpen$ = this.isMenuOpenSubject.asObservable();

    constructor(
      private authService: AuthService, 
      private http: HttpClient, 
      private router: Router
    ) {} 

  toggleMenu() {
    this.isMenuOpenSubject.next(!this.isMenuOpenSubject.value);
  }
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  agregarAlCarrito(producto: any, cantidad: number) {
    const userData = this.authService.getUserData();
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const formData = new FormData();
    formData.append('codigo', producto.codigo); // Asume que el producto tiene una propiedad 'codigo'
    formData.append('cana', cantidad.toString());
    formData.append('codCli', userData.usuario);

    const apiUrl = `${API_URL}agg_pedido/agg_pedido`;

    return this.http.post(apiUrl, formData, { headers: headers });
  }
} 