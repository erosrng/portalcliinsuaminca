import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, takeUntil, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms'; 

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import Swal from 'sweetalert2';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';

import { MatTableDataSource, MatTableModule } from '@angular/material/table'; 
import { MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input'; // Importa MatInputModule
import { MatIconModule } from '@angular/material/icon';

import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select'; // Importa MatSelectModule
import { MatFormFieldModule } from '@angular/material/form-field'; // Importa MatFormFieldModule
import {MatProgressBarModule} from '@angular/material/progress-bar';

export interface Product {
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
  selector: 'app-carshop',
    imports: [
      CommonModule,
      MatTableModule,
      MatFormFieldModule,
      MatInputModule,
      MatIconModule,
      FormsModule,
      MatPaginatorModule,
      MatProgressBarModule,
      MatSelectModule
    ],
  templateUrl: './carshop.component.html',
  styleUrl: './carshop.component.scss'
})
export class CarshopComponent implements OnInit, AfterViewInit {
 isLoading = false;

  sortField: string = 'descrip'; // Campo de ordenamiento inicial
  sortDirection: 'desc' | 'asc' = 'desc';
  private subscriptions: Subscription[] = [];
  private clienteCambiadoSubscription: Subscription | undefined;

  private destroy$ = new Subject<void>();
  clienteData: any;
  private clienteDataSubscription: Subscription | undefined;
  codCli: string | null = null;

  productosEnCarritoNumber: string = '';
  productscar: Product[] = [];
  dataSource = new MatTableDataSource<Product>(this.productscar);
  displayedColumns: string[] = ['img', 'descrip', 'preciosiniva', 'ivabs', 'preciod', 'ivad', 'totalbs', 'totald', 'cant', 'descprov', 'actions']; // Ajusta las columnas según tus necesidades
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  totalBs: string = '';
  totalUsd: string = '';
  unidades: string = '';

  descuentoLineal: number | 0 = 0; 

  constructor(
    private route: Router,
    private http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) {}

  ngOnInit() {
    this.codCli = this.authService.getCodCli();
    if(this.codCli){
      this.subscribeToClienteData();
    }

    /* this.clienteCambiadoSubscription = this.portalcliLogicaService.clienteCambiado$.subscribe(() => {
      console.log(this.clienteCambiadoSubscription)
      this.openCar();
    }); */
  }

  ngAfterViewInit(): void {

  }

  subscribeToClienteData() {
    this.portalcliLogicaService.clienteData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.clienteData = data;
      this.openCar();
    });
  }

  openCar() {
    const codCli = this.authService.getCodCli();

    this.isLoading = true;
    const token = this.authService.getToken();
    const formData = new FormData();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const apiUrl = `${API_URL}opencardb`;
    formData.append('codCli', codCli ?? '');
   if (this.clienteData && this.clienteData.ubica) {
      formData.append('almacen', this.clienteData.ubica);
    }else{
      formData.append('almacen', '');
    }
    this.http.post(apiUrl,formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.revisarCarrito();
        this.productscar = response.data;
        this.dataSource.data = this.productscar;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.sortData(this.sortField as keyof Product); // Llamar a sortData después de asignar los datos
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al cargar carrito de compras:', error);
      },
    });
  }

  // Función para aplicar el descuento lineal a todos los items del carrito
  aplicarDescuentoLineal(): void {
    if (this.descuentoLineal > 100) {
      Swal.fire('El descuento no puede ser mayor a 100', '', 'warning');
      return;
    }
    if (this.descuentoLineal !== null) {
      this.productscar = this.productscar.map(product => {
        product.descprov = this.descuentoLineal!; // Asignación directa (usando '!' para asegurar que no es null)
        return product;
      });
      this.dataSource.data = [...this.productscar];
    } else {
      this.productscar = this.productscar.map(product => {
        product.descprov = 0; // O null si la interfaz lo permite
        return product;
      });
      this.dataSource.data = [...this.productscar];
    }

    const apiUrl = `${API_URL}totalizadesc`;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    const headers = new HttpHeaders({
        'Authorization': `${token}`
    });

    formData.append('desc', this.descuentoLineal!.toString());
    formData.append('codCli', codCli ?? '');

    this.http.post(apiUrl,formData, { headers: headers }).subscribe({
      next: (response: any) => {
        
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al actualizar', error);
        this.alertaerror();
      },
    });
  }

  eliminareg(caller: any, idPedido: any, codigo: any) {
      this.isLoading = true;

      const apiUrl = `${API_URL}eliminareg`;
      const formData = new FormData();
      const token = this.authService.getToken();

      const headers = new HttpHeaders({
          'Authorization': `${token}`
      });

      formData.append('id', idPedido);
      formData.append('codigo', codigo);

      this.productscar = this.productscar.filter(product => product.id_pedido !== idPedido && product.codigoa !== codigo);
      this.dataSource.data = this.productscar;

      this.http.post(apiUrl, formData, { headers: headers }).subscribe({
          next: (response: any) => {
              this.isLoading = false;
              if (response.result === true) {
                  // Actualiza productscar
                  this.productscar = this.productscar.filter(product => product.id_pedido !== idPedido && product.codigoa !== codigo);
                  this.revisarCarrito();
                  Swal.fire({
                      text: 'Producto eliminado',
                      icon: 'success',
                      showConfirmButton: false,
                      timer: 3000,
                      toast: true,
                      position: 'bottom-end',
                  });
              } else {
                this.alertaerror();
              }
          },
          error: (error) => {
              this.isLoading = false;
              this.alertaerror();
          },
      });
  }

  //Envia pedidos al servidor
  enviaped(){
    this.isLoading = true;
    const codCli = this.authService.getCodCli();

      const formData = new FormData();
      const token = this.authService.getToken();

      formData.append('codCli', codCli ?? '');

      const headers = new HttpHeaders({
        'Authorization': `${token}`
      });
      const apiUrl = `${API_URL}portalcli/enviaped`;

      Swal.fire({
      title: '¿Desea enviar el pedido?',
      text: "Esta acción no se puede deshacer.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar'
      }).then((result) => {
      if (result.isConfirmed) {
          this.mostrarLoader();
          this.http.post(apiUrl, formData, { headers: headers }).subscribe({
            next: (response: any) => {
              if (response.status) {
                this.ocultarLoader();
                this.revisarCarrito();
                Swal.fire(response.mensaje, '', 'success');
                this.productscar = [];
                this.dataSource.data = this.productscar;
                this.isLoading = false;
              } else {
                Swal.fire(response.mensaje, '', 'error');
                this.isLoading = false;
              }
            },
            error: (error) => {
              this.isLoading = false;
              this.ocultarLoader();
              Swal.fire(error, '', 'error');
              console.error('Error de la API:', error);
            },
          });
      }
      });
  }

  //Vacia carrito
  vaciacar(): void {
    Swal.fire({
      title: '¿Desea vaciar el carrito?',
      text: "Eliminar todos los productos en el mismo.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Vaciar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.portalcliLogicaService.vaciacar().subscribe({
          next: (response: any) => {
            if (response.result) {
              // Vaciar this.productscar
              this.productscar = [];

              // Actualizar this.dataSource.data
              this.dataSource.data = this.productscar;

              // Actualizar el carrito
              this.revisarCarrito();

              Swal.fire({
                text: 'Carro vacio',
                icon: 'success',
                showConfirmButton: false,
                timer: 3000,
                toast: true,
                position: 'bottom-end',
              });
            } else {
              this.alertaerror();
            }
          },
          error: (error) => {
            this.alertaerror();
          },
        });
      }
    });
  }

  revisarCarrito() {
    this.portalcliLogicaService.revisarCarrito();
    this.subscriptions.push(
      this.portalcliLogicaService.productosEnCarrito$.subscribe((productos) => {
        if (productos && productos.length > 0 && productos[0] && productos[0].value > 0) {
          this.productosEnCarritoNumber = productos[0].value;
        } else {
          this.productosEnCarritoNumber = '0';
        }
      }),
      this.portalcliLogicaService.unidades$.subscribe((unidades) => {
        this.unidades = unidades;
      }),
      this.portalcliLogicaService.totalBs$.subscribe((totalBs) => {
        this.totalBs = totalBs;
      }),
      this.portalcliLogicaService.totalUsd$.subscribe((totalUsd) => {
        this.totalUsd = totalUsd;
      }),
    );
  }

  validateInput(product: any, event: any) {
    product.cant = this.portalcliLogicaService.validateCant(event);
  }

  alertaerror(){
    this.portalcliLogicaService.alertaerror();
  }

  mostrarLoader(){
    this.portalcliLogicaService.mostrarLoader();
  }

  ocultarLoader(){
    this.portalcliLogicaService.ocultarLoader();
  }

  sortData(sortField: keyof Product) {
    this.sortField = sortField;
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
    this.sortData(this.sortField as keyof Product);
}


  // Agrega la función applyFilter
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  updatecant(idPedido: string, codigo: string, existen: string, change: string) {
    const input = document.getElementById(`cantidad_${codigo}`) as HTMLInputElement;

    const existenNum = parseInt(existen); // Convertir a número correctamente

    if (input) {
        const cantidadInput = parseInt(input.value); // Obtener el valor del input y convertirlo a número

        if (cantidadInput > existenNum) { // Comparar el valor del input con existen
            Swal.fire('Cantidad mayor a existencia', '', 'error');
            return;
        }

        let newValue = cantidadInput + ((change === '-') ? -1 : 1);

        if (newValue > 0) {
            input.value = newValue.toString();
            this.totaliza(idPedido, codigo, newValue, existenNum); // Usar existenNum
        }
    }
}


  totaliza(idPedido: string, codigo: string, cantidad: number, existen: number) {
      const apiUrl = `${API_URL}totalizacampo`;
      const formData = new FormData();
      const token = this.authService.getToken();

      const headers = new HttpHeaders({
          'Authorization': `${token}`
      });

      formData.append('id', idPedido);
      formData.append('codigo', codigo);
      formData.append('cantidad', cantidad.toString());

      this.http.post(apiUrl, formData, { headers: headers }).subscribe({
          next: (response: any) => {
              this.isLoading = false;
              if (response.result == true) {
                  // Actualiza productscar
                  this.revisarCarrito();
                  Swal.fire({
                      text: 'Producto Actualizado',
                      icon: 'success',
                      showConfirmButton: false,
                      timer: 3000,
                      toast: true,
                      position: 'bottom-end',
                  });
              } else {
                this.alertaerror();
              }
          },
          error: (error) => {
              this.isLoading = false;
              this.alertaerror();
          },
      });
}

}
