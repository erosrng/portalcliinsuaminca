import { Component, ViewChild } from '@angular/core';
import { NavBarComponent } from "../../../components/nav-bar/nav-bar.component";
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HistorialpedComponent } from "../../../components/historialped/historialped.component";
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from "../../../components/footer/footer.component";
import { FormControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SideBarAdminComponent } from "../../../components/side-bar-admin/side-bar-admin.component";

import { map, Observable } from 'rxjs';
import { AuthService } from './../../../auth.service';
import { API_URL } from './../../../app.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SideBarComponent } from "../../../components/side-bar/side-bar.component";

interface Vendedor {
  us_codigo: string;
  us_nombre: string;
  proveed: string;
  usuariopadre: string;
}

@Component({
  selector: 'app-admin-pedidos-vendedor',
  imports: [
    NavBarComponent,
    MatSidenav,
    MatSidenavModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HistorialpedComponent,
    MatIconModule,
    FooterComponent,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SideBarAdminComponent,
    SideBarComponent
],
  templateUrl: './admin-pedidos-vendedor.component.html',
  styleUrl: './admin-pedidos-vendedor.component.scss'
})
export class AdminPedidosVendedorComponent {
  constructor(
    public authService: AuthService,
    public http: HttpClient
  ) {}
  toggleMenu = false;
  toppings = new FormControl('');
  selectedValue: string = '';

  vendedores: Vendedor[] = [];
  isLoadingVendedores: boolean = false;
  selectedVendedor: Vendedor | null = null;

  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }

  ngOnInit() {
    this.obtenerVendedores().subscribe();
  }

  obtenerVendedores(): Observable<void> {
      const formData = new FormData();
      const token = this.authService.getToken();
      const apiUrl = `${API_URL}vendedoresportal`;
      const headers = new HttpHeaders({
        'Authorization': `${token}`
      });
  
      return this.http.post<{ data: Vendedor[], result: boolean, mensaje: string }>(apiUrl, formData, { headers: headers }).pipe(
        map(response => {
          if (response.result) {
            this.vendedores = response.data;
          } else {
            console.error('Error al cargar vendedores:', response);
            this.vendedores = [];
          }
        })
      );
    }

}
