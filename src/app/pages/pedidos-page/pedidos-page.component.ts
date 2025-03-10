import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedidos-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent
  ],
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.scss'
})
export class PedidosPageComponent implements OnInit { // Implementa OnInit
    products: any[] = [];
    productosEnCarrito: any[] = [];
    loading: boolean = false;
    carrito: Set<string> = new Set();
    unidades: string = '';
    totalBs: string = '';
    totalUsd: string = '';
    encarprod: string = '';
    constructor(
      private route: Router, 
      private http: HttpClient, 
      private authService: AuthService,
      public portalcliLogicaService: PortalcliLogicaService
    
    ) {}

    ngOnInit() { // Implementa ngOnInit
        this.fetchPedidos();
        this.revisarCarrito();
    }

    fetchPedidos() {
      this.loading = true; 

      const formData = new FormData();
      //const userData = this.authService.getUserData();
      const token = this.authService.getToken();

    
      // Agrega otros datos a FormData
      formData.append('start', '0');
      formData.append('length', '50');
      formData.append('codCli', '123');
      formData.append('search', '');
      formData.append('orderby', '');
      formData.append('p_activo', '');
      formData.append('marca', '');
      formData.append('categoria', '');
      formData.append('nuevos', '0');
      //formData.append('order', JSON.stringify([{ column: 1, dir: 'asc' }]));
      formData.append('columns', JSON.stringify([
        { data: 'codigo' },
        { data: 'descrip' },
        { data: 'nomprv' },
        { data: 'oprecio' },
        { data: 'existen' },
      ]));
    
      const headers = new HttpHeaders({
        'Authorization': `${token}`
      });
        const apiUrl = `${API_URL}portalcli/data`;
    
      this.http.post(apiUrl, formData, { headers: headers }).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.products = response.data; 
        },
        error: (error) => {
          this.loading = false;
          console.error('Error de la API:', error);
        },
      });
    }

    agg_pedido(product: any) {
      // Obtener la cantidad del input
      const cantidadInput = document.getElementById(`cana_${product.codigo}`) as HTMLInputElement;
      const cantidad = parseInt(cantidadInput.value, 10);
  
      if (isNaN(cantidad) || cantidad <= 0) {
        Swal.fire({
          text: 'Cantidad inválida',
          icon: 'error',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          position: 'bottom-end',
        });
        return;
      }
  
      // Llamar al servicio para agregar al carrito
      this.portalcliLogicaService.agregarAlCarrito(product, cantidad).subscribe({
        next: (response: any) => {
          let mensaje = response.mensaje; // Accede a la propiedad mensaje
        
          if (typeof mensaje === 'object') {
            mensaje = JSON.stringify(mensaje); // Convierte el objeto a cadena si es necesario
          }
        
          Swal.fire({
            text: mensaje == 'Producto Agregado' ? 'Pedido agregado exitosamente!' : mensaje,
            icon: mensaje == 'Producto Agregado' ? 'success' : 'error',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            position: 'bottom-end',
          });
          this.revisarCarrito();
        },
        /* error: (error) => {
          console.error('Error al agregar producto al carrito:', error);
        }, */
      });
    }

    revisarCarrito() {
      this.loading = true; 

      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        'Authorization': `${token}`,
      });
  
      this.http.get<any>(`${API_URL}carrito/revisacar`, { headers: headers }).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response && response.encar) {
            this.productosEnCarrito = Object.entries(response.encar).map(([key, value]) => ({
              key,
              value,
            }));
  
            // Asigna los valores a las variables
            this.unidades = response.encar.cana; 
            this.totalBs = response.encar.preciobs;
            this.totalUsd = response.encar.preciod;
            this.encarprod = response.encar.products;
          } else {
            this.productosEnCarrito = [];
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error al revisar el carrito:', error);
        },
      });
    }
}