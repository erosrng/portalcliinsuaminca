/* import {AfterViewInit, Component, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URL } from './../../app.config';
import { NavBarComponent } from "../nav-bar/nav-bar.component";
import { SideBarComponent } from "../side-bar/side-bar.component";
import { FooterComponent } from "../footer/footer.component";
import {MatProgressBarModule} from '@angular/material/progress-bar';

import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';

@Component({
  selector: 'app-historialped',
  imports: [
    CommonModule, 
    NavBarComponent, 
    SideBarComponent, 
    FooterComponent,
    MatProgressBarModule,
    MatTableModule, MatPaginatorModule
  ],
  templateUrl: './historialped.component.html',
  styleUrl: './historialped.component.scss',
})
export class HistorialpedComponent {
  isLoading = false;
  historialPedidos: any[] = [];
  detallesPedido: any[] = [];
  pedidoSeleccionado: any;

  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = new MatTableDataSource(this.historialPedidos);

  constructor(private authService: AuthService, private http: HttpClient) {}

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  
  ngOnInit() {
    this.traeHistorial();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  traeHistorial() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    formData.append('codCli', codCli ?? '');

    const headers = new HttpHeaders({
      Authorization: `${token}`,
    });
    const apiUrl = `${API_URL}historialped`;

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.data) {
          this.historialPedidos = response.data;
        } else {
          console.error('Respuesta de la API sin datos:', response);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error de la API:', error);
      },
    });
  }

  showdetail(pedido: any) {
    this.isLoading = true;
    this.pedidoSeleccionado = pedido; // Guardar el pedido seleccionado
    const formData = new FormData();

    const headers = new HttpHeaders({
      Authorization: `${this.authService.getToken()}`,
    });

    formData.append('pedido', pedido.pedido);

    const apiUrl = `${API_URL}detalle_pedido`;

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.result && response.data) {
          this.detallesPedido = response.data;
          this.openDetailsModal();
        } else {
          console.error('Respuesta de la API sin datos de detalleped:', response.data);
          this.detallesPedido = []; // Asegura que detallesPedido esté vacío en caso de error
          this.openDetailsModal(); // Abre el modal incluso si no hay datos
        }
      },
      error: (error) => {
        console.error('Error al obtener detalles del pedido:', error);
        this.isLoading = false;
        this.detallesPedido = []; // Asegura que detallesPedido esté vacío en caso de error
        this.openDetailsModal(); // Abre el modal incluso si hay error
      },
    });
  }

  openDetailsModal() {
    const myModal = new (window as any).bootstrap.Modal(document.getElementById('detallesPedidoModal'));
    myModal.show();
  }
} */

  import { AfterViewInit, Component, ViewChild } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { AuthService } from './../../auth.service';
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { API_URL } from './../../app.config';
  import { NavBarComponent } from "../nav-bar/nav-bar.component";
  import { SideBarComponent } from "../side-bar/side-bar.component";
  import { FooterComponent } from "../footer/footer.component";
  import { MatProgressBarModule } from '@angular/material/progress-bar';
  import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
  import { MatSort, MatSortModule } from '@angular/material/sort';
  import { MatTableDataSource, MatTableModule } from '@angular/material/table';
  import { MatInputModule } from '@angular/material/input';
  import { FormsModule } from '@angular/forms';
  

  export interface Historialped {
    img: string;
    descrip: string;
    preciosiniva: number;
    ivabs: number;
    preciod: number;
    ivad: number;
    totalbs: number;
    totald: number;
    cant: number;
    descprov: number;
    id_pedido: number;
    codigoa: string;
  }


  @Component({
    selector: 'app-historialped',
    imports: [
      CommonModule,
      NavBarComponent,
      SideBarComponent,
      FooterComponent,
      MatProgressBarModule,
      MatTableModule,
      MatPaginatorModule,
      MatSortModule,
      MatInputModule,
      FormsModule
    ],
    templateUrl: './historialped.component.html',
    styleUrl: './historialped.component.scss',
  })
  export class HistorialpedComponent implements AfterViewInit {
    isLoading = false;
    historialPedidos: any[] = [];
    detallesPedido: any[] = [];
    pedidoSeleccionado: any;
  
    // Definir las columnas que se mostrarán en la tabla
    displayedColumns: string[] = ['pedido', 'origen', 'unidades', 'factura', 'fecha', 'estatus', 'ver'];
    dataSource = new MatTableDataSource<Historialped>(this.historialPedidos); // Usar MatTableDataSource para la paginación y ordenación
  
    // Obtener referencias al paginador y al sort
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;
    filterValue = '';
    sortField: string = 'fecha';
    constructor(private authService: AuthService, private http: HttpClient) {
      this.dataSource = new MatTableDataSource<any>([]); // Inicializar dataSource con un array vacío
    }
  
    ngOnInit() {
      this.traeHistorial(); // Llamar a la función para obtener los datos del historial al inicializar el componente
    }
  
    ngAfterViewInit() {
      // Asignar el paginador y el sort al dataSource en ngAfterViewInit
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  
    traeHistorial() {
      this.isLoading = true;
      const formData = new FormData();
      const token = this.authService.getToken();
      const codCli = this.authService.getCodCli();
  
      formData.append('codCli', codCli ?? '');
  
      const headers = new HttpHeaders({
        Authorization: `${token}`,
      });
      const apiUrl = `${API_URL}historialped`;
  
      this.http.post(apiUrl, formData, { headers: headers }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response && response.data) {
            /* this.historialPedidos = response.data;
            this.dataSource.data = this.historialPedidos; // Asignar los datos al dataSource
            this.dataSource.paginator = this.paginator; // Asignar el paginador
            this.dataSource.sort = this.sort;   */   // Asignar el sort


                    this.historialPedidos = response.data;
                    this.dataSource.data = this.historialPedidos;
                    this.dataSource.paginator = this.paginator;
                    this.dataSource.sort = this.sort;
                    this.sortData(this.sortField as keyof Historialped); // Llamar a sortData después de asignar los datos
                    this.isLoading = false;
          } else {
            console.error('Respuesta de la API sin datos:', response);
            this.dataSource.data = [];
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error de la API:', error);
          this.dataSource.data = [];
        },
      });
    }

      sortData(sortField: keyof Historialped) {
        /* this.sortField = sortField;
        if (this.productscar && Array.isArray(this.productscar)) {
          this.productscar.sort((a, b) => {
              let valueA = a[sortField];
              let valueB = b[sortField];
    
              if (typeof valueA === 'string' && typeof valueB === 'string') {
                  valueA = valueA.toLowerCase();
                  valueB = valueB.toLowerCase();
              }
    
              if (valueA < valueB) {
                  return this.sortDirection === 'asc' ? -1 : 1;
              } else if (valueA > valueB) {
                  return this.sortDirection === 'asc' ? 1 : -1;
              } else {
                  return 0;
              }
          });
          this.dataSource.data = this.productscar;
        } else {
          console.warn('this.productscar no es un array, no se puede ordenar.');
        }
      }
      onSortChange(sortField: string) {
        this.sortData(sortField as keyof Product);
    }
    
      toggleSortDirection() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortData(this.sortField as keyof Product); */
    }
    
    
  
    showdetail(pedido: any) {
      this.isLoading = true;
      this.pedidoSeleccionado = pedido;
      const formData = new FormData();
  
      const headers = new HttpHeaders({
        Authorization: `${this.authService.getToken()}`,
      });
  
      formData.append('pedido', pedido.pedido);
  
      const apiUrl = `${API_URL}detalle_pedido`;
  
      this.http.post(apiUrl, formData, { headers: headers }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.result && response.data) {
            this.detallesPedido = response.data;
            this.openDetailsModal();
          } else {
            console.error('Respuesta de la API sin datos de detalleped:', response.data);
            this.detallesPedido = [];
            this.openDetailsModal();
          }
        },
        error: (error) => {
          console.error('Error al obtener detalles del pedido:', error);
          this.isLoading = false;
          this.detallesPedido = [];
          this.openDetailsModal();
        },
      });
    }
  
    openDetailsModal() {
      const myModal = new (window as any).bootstrap.Modal(document.getElementById('detallesPedidoModal'));
      myModal.show();
    }
  
    applyFilter(event: Event) {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
  }
  
  