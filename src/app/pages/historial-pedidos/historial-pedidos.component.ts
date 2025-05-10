import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';
import { HistoricoPedidosModel } from '../../models/model';
import { AuthService } from '../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URL } from './../../app.config';
import { PROTEO_URL_ALONE } from './../../app.config';
import { MatIconModule } from '@angular/material/icon';

interface Pedido {
  fecha: string;
  numero: string;
  cod_cli: string;
  nombre: string;
  direc: string;
  totals: string;
  iva: string;
  totalg: number;
  anticipo: string;
  peso: null;
  referen: string;
  observ1: null;
  rifci: string;
  direccion: string;
  idpedido: string;
  unidades: number;
  factura: null;
  vence: null;
  vd: string;
  nomvend: string;
  email: string;
  grupo: string;
  autoriza: string;
}

interface DetallePedido {
  codigo: string;
  desca: string;
  cana: string;
  pvp: string;
  preca: number;
  tota: number;
  iva: number;
  lote: string | null;
  vence: string | null;
  descu3: string;
}

@Component({
  selector: 'app-historial-pedidos',
    imports: [
        MatSidenav,
        MatSidenavModule,
        MatIconModule,
        CommonModule,
        SideBarComponent,
        NavBarComponent,
        FooterComponent,
    ],
  templateUrl: './historial-pedidos.component.html',
  styleUrl: './historial-pedidos.component.scss'
})
export class HistorialPedidosComponent implements OnInit {
  isLoading = false;
  toggleMenu = false;
  historialPedidos: Pedido[] = [];
  pedidoActivo: Pedido | null = null;
  detallePedidoActivo: DetallePedido[] = []; // Array para almacenar los detalles del pedido
  totalPedidos= 0
  totalUnidades= 0
  totalValorDolar= 0

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    public authService: AuthService,
  ) { }

  ngOnInit(): void {
    Swal.showLoading();
    const aux = localStorage.getItem('usuario');
    /* if (aux) {
      this.apiService.get_historial_by_user(aux).subscribe((data: HistoricoPedidosModel[]) => {
        Swal.close();
        // Aquí podrías necesitar mapear los datos si la estructura de HistoricoPedidosModel
        // es diferente de la estructura de la respuesta de triangulatotal
        // this.historialPedidos = data.map(item => ({ ... }));
      }, () => {
        Swal.close();
      });
    } */
    this.cargarResumen();
    this.cargarHistorialPedidos();
    
  }

  openMenu(event: any) {
    this.toggleMenu = !this.toggleMenu;
  }

  openDetail(pedido: Pedido): void {
    this.pedidoActivo = pedido;
    this.cargarDetallePedido(pedido.numero); // Llama a la función para cargar los detalles
  }

  cargarDetallePedido(numeroPedido: string) {
    this.isLoading = true;
    const token = this.authService.getToken();
    const formData = new FormData();
    formData.append('numero', numeroPedido); // Pasamos el número del pedido

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const apiUrl = `${API_URL}trianguladeta`; // Usamos la API para los detalles

    this.http.post<{ result: boolean; keys: any[]; columns: any[]; data: DetallePedido[]; message: string }>(apiUrl, formData, { headers: headers })
      .subscribe({
        next: (response) => {
          this.detallePedidoActivo = response.data; // Asignamos los detalles a la variable
          this.isLoading = false;
          // No es necesario abrir el modal aquí, ya que el clic en el ojo ya lo abre
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al cargar detalle del pedido:', error);
          Swal.fire('Error', 'Error al cargar el detalle del pedido', 'error');
        },
      });
  }

  abrirEnlaceExcel(idpedido: string) {
    const url = `${PROTEO_URL_ALONE}formatos/ver/PFAC/${idpedido}`;
    window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,status=yes,resizable=yes');
  }

  calculateDiscount(stringNumber: string, descuentoItem: string): number {
    const normalizedString = stringNumber.replace(",", "");
    const precio = parseFloat(normalizedString);
    const descuento = parseFloat(descuentoItem) / 100;
    return precio * (1 - descuento);
  }

  getValor(element: any): number {
    return parseFloat(element.totalg);
  }

  cargarHistorialPedidos() {
    const codCli = this.authService.getCodCli();
    this.isLoading = true;
    const token = this.authService.getToken();
    const formData = new FormData();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const apiUrl = `${API_URL}triangulatotal`;

    this.http.post<{ result: boolean; keys: any[]; columns: any[]; data: Pedido[] }>(apiUrl, formData, { headers: headers })
      .subscribe({
        next: (response) => {
          this.historialPedidos = response.data;
          this.isLoading = false;
          this.calcularUnidadesHistorial()
          this.calcularTotalHistorial()
          Swal.close();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al cargar historial de triangulatotal:', error);
        },
      });
  }

  calcularUnidadesHistorial(): void {
    this.totalUnidades = 0;
    this.historialPedidos.forEach(pedido => {
      this.totalUnidades = Number(pedido.unidades) + this.totalUnidades;
    })
  }

  calcularTotalHistorial(): void {
    this.totalValorDolar = 0;
    this.historialPedidos.forEach(pedido => {
      this.totalValorDolar =(pedido.totalg / this.authService.getTasa()) + this.totalValorDolar;
    })
  }

    cargarResumen() {
      const proveed = this.authService.getProveed();
      const token = this.authService.getToken();
      const formData = new FormData();
  
      const headers = new HttpHeaders({
        'Authorization': `${token}`
      });
      formData.append('proveed', proveed ?? '');
  
      const apiUrl = `${API_URL}resumen`;
  
      this.http.post(apiUrl, formData, { headers: headers })
        .subscribe({
          next: (response: any) => {
            if (response.data) { // La API ya devuelve un objeto, no un array
              this.totalPedidos = response.data.pedidos;
              this.totalUnidades = response.data.unidades;
              this.totalValorDolar = parseFloat((response.data.totalg / this.authService.getTasa()).toFixed(2));
            } else {
              this.totalPedidos = 0;
              this.totalUnidades = 0;
              this.totalValorDolar = 0;
              console.warn('La API de resumen devolvió un objeto de datos vacío.');
            }
            Swal.close();
          },
          error: (error) => {
            console.error('Error al cargar resumen:', error);
            Swal.close();
          },
        });
    }
}