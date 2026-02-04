import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';

import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import Swal from 'sweetalert2';
import { AuthService } from '../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URL } from './../../app.config';
import { API_URLINTER } from './../../app.config';
import { PROTEO_URL_ALONE } from './../../app.config';
import { PROTEO_URL_ALONEINTER } from './../../app.config';
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
  precad: number;
  tota: number;
  totad: number;
  iva: number;
  lote: string | null;
  vence: string | null;
  descu3: string;
}

@Component({
  selector: 'app-historial-pedidos',
    imports: [
    MatSidenavModule,
    MatIconModule,
    CommonModule,
    SideBarComponent,
    NavBarComponent,
    FooterComponent,
    MatTableModule,
    MatPaginatorModule
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

   // Variables para paginación Material
  dataSource = new MatTableDataSource<Pedido>([]);
  displayedColumns: string[] = [
    'numero', 'nombre', 'fecha', 'totals', 'iva', 'totalg', 
    'totalgDolar', 'unidades', 'detalle', 'descargar'
  ];
  // Configuración del paginator
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];
  pageIndex = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
  ) { }

  ngOnInit(): void {
    Swal.showLoading();
    const aux = localStorage.getItem('usuario');

    this.cargarHistorialPedidos();
    
  }

    // Método para obtener datos paginados
    getPaginatedData(): Pedido[] {
      const startIndex = this.pageIndex * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      return this.historialPedidos.slice(startIndex, endIndex);
    }
  
    // Método para manejar cambio de página
    onPageChange(event: PageEvent): void {
      this.pageIndex = event.pageIndex;
      this.pageSize = event.pageSize;
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
      'X-Auth-Token': `${token}`
    });

    const apiUrl = `${API_URLINTER}portalcli/trianguladeta`; // Usamos la API para los detalles

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
      'X-Auth-Token': `${token}`
    });

    const apiUrl = `${API_URLINTER}portalcli/triangulatotal`;

    this.http.post<{ result: boolean; keys: any[]; columns: any[]; data: Pedido[] }>(apiUrl, formData, { headers: headers })
      .subscribe({
        next: (response) => {
          this.historialPedidos = response.data;
          this.dataSource.data = this.historialPedidos; // Asigna datos al dataSource
          this.dataSource.paginator = this.paginator; // Asigna el paginator
          this.isLoading = false;
          this.calcularUnidadesHistorial();
          this.calcularTotalHistorial();
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

  abrirEnlaceExcel(idpedido: string) {
    const url = `${PROTEO_URL_ALONEINTER}formatos/ver/PFAC/${idpedido}`;
    window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,status=yes,resizable=yes');
  }

  calcularTotalHistorial(): void {
    this.totalValorDolar = 0;
    this.historialPedidos.forEach(pedido => {
      this.totalValorDolar =(pedido.totalg / this.authService.getTasa()) + this.totalValorDolar;
    })
  }
}
