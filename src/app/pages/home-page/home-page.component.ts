import { CommonModule } from '@angular/common';
import { Component, OnInit,ViewEncapsulation, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';

import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";
import Swal from 'sweetalert2';
import { AuthService } from '../../auth.service';
import { PortalcliLogicaService } from '../../services/portalcli-logica.service';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { OwlOptions, CarouselModule } from 'ngx-owl-carousel-o';
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { API_URL } from "../../app.config";
import { Observable, throwError } from 'rxjs'; // Asegúrate de importar Observable y throwError
import { catchError, map, finalize } from 'rxjs/operators'; // Importa map y finalize
import { Subscription, takeUntil, Subject } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';


export interface OfertaDetalle {
  lista: string;
  descuento: string; // O number si siempre es un número
}

export interface ApiProductItem {
  codigo: string;
  img: string;
  descrip: string;
  nomprv: string;
  dprice: string;
  dpriced: string;
  descuento: string;
  oprecio: string;
  opreciod: string;
  existen: string;
  segmento: number;
  encar: number;
  oferta: string | null | OfertaDetalle[];
  lote: string;
  vence: string;
}

export interface ApiResponse {
  draw: string;
  recordsTotal: string;
  recordsFiltered: string;
  data: ApiProductItem[];
}

export interface Product {
  codigo: string;
  img: string;
  descrip: string;
  nomprv: string;
  dprice: string;
  dpriced: string;
  descuento: string;
  oprecio: string;
  opreciod: string;
  existen: string;
  encar: number;
  segmento: number;
  oferta: string | null | OfertaDetalle[]; // Se mantiene el tipo completo aquí
  lote: string;
  vence: string;
  ofertaDisplay?: string; // Para el texto corto en el badge
}

// --- Nuevas Interfaces para Proveedores ---
export interface Provider {
  proveed: string; // Añadido para el nombre del archivo de imagen
  name: string;
  imageSrc: string;
}

export interface ApiResponseProviders {
  status: boolean;
  data: {
    cana_total: number;
    proveed: string; // El código del proveedor que usaremos para la imagen
    nombre: string;  // El nombre del proveedor para el 'alt'
    rif: string;
  }[];
}
// --- Fin Nuevas Interfaces ---

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    CarouselModule, // Necesario para ngx-owl-carousel-o
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HomePageComponent implements OnInit {

  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = false;

  products: Product[] = [];
  isLoading: boolean = false; // Para la carga de productos
  isLoadingProviders: boolean = false; // Para la carga de proveedores del carrusel

  error: any;
  selectedProduct: any = null;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  search: string = '';
  categoria: string = '';
  filterMarca: string = '';
  filterLote: string = '';
  orderBy: string = '';
  orderDirection: string = '';

  private subscriptions: Subscription[] = [];
  productosEnCarrito: any[] = [];
  unidades: string = '';
  totalBs: string = '';
  totalUsd: string = '';
  encarprod: string = '';
  productosEnCarritoCodigos: string[] = [];

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: true,
    dotsEach: true,
    center: true,
    navSpeed: 800,
    navText: ['<i class="fa-solid fa-chevron-left"></i>', '<i class="fa-solid fa-chevron-right"></i>'],
    responsive: {
      0: { items: 1 },
      640: { items: 2 },
      768: { items: 3 },
      1024: { items: 5 }
    },
    nav: true

  };

  // Carrusel de Proveedores: ya no tiene datos quemados
  providers: Provider[] = []; // Se inicializa vacío, se llenará desde la API

  providersCarouselOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: true,
    dotsEach: true,
    navSpeed: 800,
    navText: ['<i class="fa-solid fa-chevron-left"></i>', '<i class="fa-solid fa-chevron-right"></i>'],
    responsive: {
      0: { items: 3 },
      480: { items: 4 },
      768: { items: 5 },
      992: { items: 6 },
      1200: { items: 7 }
    },
    nav: true,
    autoplay: true,
    autoplayTimeout: 6000,
    autoplayHoverPause: true
  };

  constructor(
      private authService: AuthService,
      public portalcliLogicaService: PortalcliLogicaService,
      private route: ActivatedRoute,
      private router: Router,
      private http: HttpClient // HttpClient ya está inyectado
  ) { }

  ngOnInit() {
    this.revisarCarrito();
    this.fetchProducts();
    this.loadCarouselProviders(); // <-- ¡Llamada para cargar los proveedores!
  }

  // --- Método para cargar los proveedores del carrusel ---
  loadCarouselProviders(): void {
    this.isLoadingProviders = true; // Activa el loader del carrusel
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const apiUrl = `${API_URL}portalcli/carruselaliado`; // Tu endpoint de PHP para proveedores

    this.http.post<ApiResponseProviders>(apiUrl, {}, { headers: headers }).pipe(
      map(response => {
        if (response.status && response.data) {
          console.log('Datos de proveedores de la API:', response.data); // Log de la data bruta
          return response.data.map(item => ({
            proveed: item.proveed, // Asegúrate de que esta propiedad exista en la API
            name: item.nombre,    // Asegúrate de que esta propiedad exista en la API
            imageSrc: `./assets/images/logoprv/${item.proveed}.png`, // Construye la ruta de la imagen
          }));
        } else {
          console.warn('API de proveedores no devolvió datos o el estado es false:', response);
          return []; // Devuelve un array vacío si no hay datos o el estado es falso
        }
      }),
      // Reutiliza tu handleError para los errores de la petición
      catchError(this.handleError),
      finalize(() => {
        this.isLoadingProviders = false;
      })
    ).subscribe({
      next: (data: Provider[]) => {
        this.providers = data;
        console.log('Proveedores mapeados para el carrusel:', this.providers); // Log de la data mapeada
      },
      error: (error) => {
        console.error('Error al cargar los proveedores del carrusel:', error);
        // El handleError ya muestra el mensaje general, podrías añadir algo específico aquí si lo necesitas
      }
    });
  }

  // --- Tu método handleError existente, se reutiliza para proveedores ---
  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('Ocurrió un error del lado del cliente o de la red:', error.error);
      Swal.fire('Error de Conexión', 'No se pudo conectar con el servidor. Revisa tu conexión a internet.', 'error');
    } else {
      console.error(
          `El backend retornó el código ${error.status}, el cuerpo era: `, error.error);
      // Puedes ser más específico aquí si el error 401/403 significa token inválido
      Swal.fire('Error del Servidor', 'Ocurrió un problema al obtener los datos. Por favor, inténtalo de nuevo.', 'error');
    }
    return throwError(() => new Error('Algo malo sucedió; por favor, inténtalo de nuevo más tarde.'));
  }

  fetchProducts() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    formData.append('start', String((this.currentPage - 1) * this.itemsPerPage));
    formData.append('length', String(this.itemsPerPage));

    formData.append('codCli', codCli ?? '');
    formData.append('search', this.search);
    formData.append('categoria', this.categoria);
    formData.append('marca', '');
    if (this.userData && this.userData.ubica) {
      formData.append('almacen', this.userData.ubica);
    } else {
      console.warn('userData.ubica no disponible para el parámetro almacen.');
    }
    formData.append('proveedor', this.filterMarca);
    formData.append('lote', this.filterLote);
    formData.append('orderby', this.orderBy);
    formData.append('orderDirection', this.orderDirection);
    formData.append('nuevos', '0');

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/inventariocli`;

    this.http.post<ApiResponse>(apiUrl, formData, { headers: headers })
        .pipe(
            catchError(this.handleError)
        )
        .subscribe({
          next: (response: ApiResponse) => {
            this.products = response.data.map(item => {
              const product: Product = {
                codigo: item.codigo,
                img: item.img,
                descrip: item.descrip,
                nomprv: item.nomprv,
                dprice: item.dprice,
                dpriced: item.dpriced,
                descuento: item.descuento || '0%',
                oprecio: item.oprecio,
                opreciod: item.opreciod,
                existen: item.existen,
                encar: item.encar,
                oferta: item.oferta,
                lote: item.lote,
                segmento: item.segmento,
                vence: item.vence
              };

              if (Array.isArray(item.oferta) && item.oferta.length > 0) {
                product.ofertaDisplay = 'Oferta';
              } else if (typeof item.oferta === 'string' && item.oferta.trim() !== '') {
                product.ofertaDisplay = item.oferta;
              } else {
                product.ofertaDisplay = ''; 
              }

              return product;
            });
            this.isLoading = false;
          },
          error: (err) => {
            this.error = err;
            this.isLoading = false;
            console.error('Error de la API en subscribe (fetchProducts):', err);
            this.products = [];
          },
        });
  }

  formatOfertasTooltip(ofertas: string | null | OfertaDetalle[] | undefined): string {
    if (Array.isArray(ofertas) && ofertas.length > 0) {
      return ofertas.map(oferta => `${oferta.lista} (Descuento: ${oferta.descuento}%)`).join('\n');
    } else if (typeof ofertas === 'string' && ofertas.trim() !== '') {
      return ofertas;
    }
    return 'Sin ofertas disponibles';
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  eventcant(codigo: string, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    console.log(`Input para producto ${codigo}: ${value}`);

    const product = this.products.find(p => p.codigo === codigo);
    if (product) {
      product.encar = parseInt(value, 10) || 0;
    }


    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      if (product) {
        this.agg_pedido(product);
      }
    }
  }

  agg_pedido(product: any) {
      const cantidadInput = document.getElementById(`cana_${product.codigo}`) as HTMLInputElement;
      const cantidadInput2 = document.getElementById(`cana2_${product.codigo}`) as HTMLInputElement;
      let cantidad: number;
    
      if (cantidadInput && cantidadInput.value) {
        cantidad = parseInt(cantidadInput.value, 10);
      } else if (cantidadInput2 && cantidadInput2.value) {
        cantidad = parseInt(cantidadInput2.value, 10);
      } else {
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
    
      this.portalcliLogicaService.agregarAlCarrito(product, cantidad).subscribe({
        next: (response: any) => {
          let mensaje = response.mensaje;
          if (typeof mensaje === 'object') {
            mensaje = JSON.stringify(mensaje);
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
      });
    }

    revisarCarrito() {
      this.portalcliLogicaService.revisarCarrito();
      this.subscriptions.push(
        this.portalcliLogicaService.productosEnCarrito$.subscribe((productos) => {
          this.productosEnCarrito = productos;
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
        this.portalcliLogicaService.encarprod$.subscribe((encarprod) => {
          this.encarprod = encarprod;
        }),
        this.portalcliLogicaService.productosEnCarritoCodigos$.subscribe((codigos) => {
          this.productosEnCarritoCodigos = codigos;
        })
      );
    }

    imageficha: any;

openProductModal(codigo: string) {
  this.isLoading = true;
    this.portalcliLogicaService.openProductModal(codigo).subscribe({ // Suscríbete al Observable
      next: (data) => {
        this.selectedProduct = data.product;
        this.imageficha = data.imageUrl;
        this.isLoading = false; 
      },
      error: (error) => {
        console.error('Error al obtener el producto:', error);
      },
    });
  }

  Proveedselect(proveedselect: any) {
    let currentSearch = '';
    this.route.queryParams.subscribe((params) => {
      currentSearch = params['search'] || '';
      currentSearch = params['categoria'] || '';
      currentSearch = params['categorianombre'] || '';

    });

    if (proveedselect) {
      this.router.navigate(['/pedidos'], {
        queryParams: {
          search: currentSearch, 
          proveedselect: proveedselect,
          categorianombre: currentSearch,
          categoria: currentSearch,
        },
      });
    } else {
      this.router.navigate(['/pedidos'], {
        queryParams: {
          search: currentSearch, 
          categoria: '',
          proveedselect: '',
        },
      });
    }
  }

}