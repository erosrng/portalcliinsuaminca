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
import { HistoricoPedidosModel } from '../../../models/model';
import { ApiService } from '../../../services/api.service';
import Swal from 'sweetalert2';
import { data } from 'jquery';

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
    public http: HttpClient,
    private apiService: ApiService
  ) {}
  toggleMenu = false;
  toppings = new FormControl('');
  selectedValue: string = '';

  vendedores: Vendedor[] = [];
  isLoadingVendedores: boolean = false;
  selectedVendedor: Vendedor | null = null;
  historialPedidos: HistoricoPedidosModel[] | null = null
  totalPedidos = 0;
  totalUnidades = 0;
  totalValorDolar = 0;
  vendedorSeleccionado: Vendedor | null = null;
  pedidoActivo: HistoricoPedidosModel | null = null;

  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }

  ngOnInit() {
    this.obtenerVendedores().subscribe();
    Swal.close()
  }

  getInfoVendedor(): void {
    this.totalPedidos = 0;
    this.totalUnidades = 0;
    this.totalValorDolar = 0;
    if (this.selectedVendedor) {
      Swal.showLoading()
      this.apiService.get_historial_by_user(this.selectedVendedor.us_codigo).subscribe((data: HistoricoPedidosModel[]) => {
        this.historialPedidos = data;
        // 1) Calcular el total de pedidos procesados
        const totalPedidos = data.length;
        this.totalPedidos = totalPedidos
      
        // 2) Calcular el total de unidades
        const totalUnidades = data.reduce((sum, pedido) => sum + pedido.unidades, 0);
        this.totalUnidades = totalUnidades
       
      
        // 3) Calcular el total de valor en dólares
        const totalValorDolar = data.reduce((sum, pedido) => sum + pedido.valor_dolar, 0);
        this.totalValorDolar = totalValorDolar
        Swal.close()
      }, () => {
        Swal.fire('Ocurrio un error', '', 'error');
      })
    }
  }

  openDetail(pedido: HistoricoPedidosModel): void {
    this.pedidoActivo = pedido;
  }

  obtenerVendedores(): Observable<void> {
      Swal.showLoading()
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
            Swal.close()
          } else {
            console.error('Error al cargar vendedores:', response);
            Swal.fire('Ocurrio un error', response.mensaje, 'error');
            this.vendedores = [];
            Swal.close()
          }
        })
      );
    }

}
