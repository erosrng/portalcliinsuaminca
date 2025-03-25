import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
  id_pedido: number;
  codigoa: string;
}

@Component({
  selector: 'app-carrito-page',
  imports: [
    CommonModule,
    NavBarComponent,
    SideBarComponent,
    MatTableModule,
    MatFormFieldModule, 
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatSelectModule
  ],
  templateUrl: './carrito-page.component.html',
  styleUrl: './carrito-page.component.scss'
})

export class CarritoPageComponent implements OnInit, AfterViewInit {
  isLoading = false; 

  sortField: string = 'descrip'; // Campo de ordenamiento inicial
  sortDirection: 'desc' | 'asc' = 'desc'; 
  //productscar: any[] = [];
  private subscriptions: Subscription[] = []; 
  private clienteCambiadoSubscription: Subscription | undefined;

  productosEnCarritoNumber: string = '';
  productscar: Product[] = []; // Asegúrate de que productscar sea de tipo Product[]
  dataSource = new MatTableDataSource<Product>(this.productscar);
  displayedColumns: string[] = ['img', 'descrip', 'preciosiniva', 'ivabs', 'preciod', 'ivad', 'totalbs', 'totald', 'cant', 'actions']; // Ajusta las columnas según tus necesidades
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: Router, 
    private http: HttpClient, 
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) {}

  ngOnInit() { 
    this.openCar();
    this.clienteCambiadoSubscription = this.portalcliLogicaService.clienteCambiado$.subscribe(() => {
      this.openCar();
    });
  }

        ngAfterViewInit(): void {

      }
    
  openCar() {
    const codCli = this.authService.getCodCli();
    this.sortData(this.sortField as keyof Product);

    this.isLoading = true; 
    const token = this.authService.getToken();
    const formData = new FormData();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const apiUrl = `${API_URL}portalcli/opencardb`;
    formData.append('codCli', codCli ?? '');

    this.http.post(apiUrl,formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.productscar = response; 
        this.dataSource.data = this.productscar; // Asigna productscar al dataSource
        this.dataSource.paginator = this.paginator; // Asigna el paginador
        this.dataSource.sort = this.sort;
        this.isLoading = false;  

      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error de la API:', error);
      },
    });
  }

  eliminareg(caller: any, idPedido: any, codigo: any) {
      this.isLoading = true;
  
      const apiUrl = `${API_URL}portalcli/eliminareg`;
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
              if (response.status === true) {
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
                this.alertaerror;
              }
          },
          error: (error) => {
              this.isLoading = false;
              this.alertaerror;
          },
      });
  }

      //Envia pedidos al servidor
  enviaped(){
      /* const codCli = localStorage.getItem(`idcli_${usuario}`);

      var postData = {
          codCli: codCli
      }; */

      const formData = new FormData();
      const token = this.authService.getToken();

      //formData.append('nuevos', '0');
    
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
          this.mostrarLoader;
          this.http.post(apiUrl, formData, { headers: headers }).subscribe({
            next: (response: any) => {
              if (response.status) {
                this.ocultarLoader;
                this.revisarCarrito();
                Swal.fire(response.mensaje, '', 'success');
                this.productscar = [];
                this.dataSource.data = this.productscar;
              } else {
                Swal.fire(response.mensaje, '', 'error');
              }
            },
            error: (error) => {
              this.ocultarLoader;
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
            if (response.status) {
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
        if (productos[0].value > 0) {
          this.productosEnCarritoNumber = productos[0].value;
        } else {
          this.productosEnCarritoNumber = '0';
        }
      })
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
      const apiUrl = `${API_URL}portalcli/totalizacampo`;
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
              if (response.status == true) {
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
                this.alertaerror;
              }
          },
          error: (error) => {
              this.isLoading = false;
              this.alertaerror;
          },
      });

    /* $.ajax({
        url: baseUrl + 'portalcli/totalizacampo', // Ruta al archivo PHP que realizará el update
        method: 'POST', // Método de la solicitud   
        data: { idPedido: idPedido, cantidad: value, codigo: codigo}, // Datos que se enviarán al archivo PHP
        success: function(response) {
            //opencar();
        },
        error: function(xhr, status, error) {
            console.log(error);
        }
    });
    retotalbs(codigo); */
}  


}