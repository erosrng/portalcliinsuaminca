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

declare var bootstrap: any;

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
    proveed: string; 
    nombre: string;  
    rif: string;
  }[];
}
// --- Fin Nuevas Interfaces ---
export interface PublicidadItem {
  prefijo: string;
  proveedor: string;
  nombre_proveedor: string;
  titulo: string;
  plantilla: string; // 'HB', 'HS1', 'HS2', 'PB', 'PS'
  descrip: string;
  url: string[];
}

export interface ApiResponsePublicidad {
  status: boolean;
  message: string;
  data: PublicidadItem[];
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    CarouselModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HomePageComponent implements OnInit {
  mainImages: any[] = []; 
  leftImages: any[] = []; 
  rightImages: any[] = []; 

  shuffledMainImages: any[] = [];
  shuffledLeftImages: any[] = [];
  shuffledRightImages: any[] = [];

  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = false;

  products: Product[] = [];
  products_2: Product[] = [];
  isLoading: boolean = false; 
  isLoadingProviders: boolean = false; 

  error: any;
  selectedProduct: any = null;

  currentPage: number = 1;
  itemsPerPage: number = 20;
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
    dots: false,
    dotsEach: false,
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
  providers: Provider[] = [];

  providersCarouselOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    dotsEach: false,
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
      private http: HttpClient
  ) { }

  ngOnInit() {
    this.revisarCarrito();
    this.fetchProducts();
    this.fetchPublicidad();
    // this.loadCarouselProviders();
  }

    // Nuevo método para obtener las imágenes de publicidad desde la API
    fetchPublicidad(): void {
      const token = this.authService.getToken();
      const headers = new HttpHeaders({
        'X-Auth-Token': `${token}`
      });
  
      const apiUrl = `${API_URL}portalcli/publiweb`;
      const body = {
        area: '' // Solo necesitamos estas áreas para la página de inicio
      };
  
      this.http.post<ApiResponsePublicidad>(apiUrl, body, { headers: headers })
        .pipe(
          catchError(this.handleError)
        )
        .subscribe({
          next: (response: ApiResponsePublicidad) => {
            if (response.data) {
              this.processPublicidadData(response.data);
              this.shuffleAllImages();
            } else {
              console.warn('No se encontraron imágenes de publicidad:', response.message);
              this.setDefaultImages(); // Fallback a imágenes por defecto si no hay datos
            }
          },
          error: (error) => {
            console.error('Error al cargar publicidad:', error);
            this.setDefaultImages(); // Fallback a imágenes por defecto en caso de error
          }
        });
    }
  
    // Procesar los datos de la API y organizarlos por plantilla
    private processPublicidadData(publicidadData: PublicidadItem[]): void {
      // Limpiar arrays
      this.mainImages = [];
      this.leftImages = [];
      this.rightImages = [];
  
      publicidadData.forEach(item => {
        const images = item.url.map(url => ({
          src: url,
          alt: item.titulo || `Publicidad ${item.prefijo}`,
          descrip: item.descrip || '',
          plantilla: item.plantilla
        }));
  
        // Organizar por tipo de plantilla
        switch (item.plantilla) {
          case 'HB': // Home Big - Carrusel principal
            this.mainImages.push(...images);
            break;
          case 'HS1': // Home Small 1 - Carrusel izquierdo
            this.leftImages.push(...images);
            break;
          case 'HS2': // Home Small 2 - Carrusel derecho
            this.rightImages.push(...images);
            break;
        }
      });
  
      // Si algún array está vacío, usar imágenes por defecto para esa sección
      if (this.mainImages.length === 0) {
        this.mainImages = this.getDefaultMainImages();
      }
      if (this.leftImages.length === 0) {
        this.leftImages = this.getDefaultLeftImages();
      }
      if (this.rightImages.length === 0) {
        this.rightImages = this.getDefaultRightImages();
      }
    }
  
    // Imágenes por defecto como fallback
    private setDefaultImages(): void {
      this.mainImages = this.getDefaultMainImages();
      this.leftImages = this.getDefaultLeftImages();
      this.rightImages = this.getDefaultRightImages();
    }
  
    private getDefaultMainImages(): any[] {
      return [
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Diamante/PUBLICIDAD LARGA (HOME E INVENTARIO)/banner.jpg", alt: "Banner 1" },
        { src: "https://d2wnvkodoh477y.cloudfront.net/proteoerp/uploads/publicidad/68dae7581634d.jpg", alt: "Banner 2" },
        { src: "https://insuaminca.org/insuaminca/uploads/publicidad/68dd4c74e1ac5.jpg", alt: "Banner 3" },
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Diamante/PUBLICIDAD LARGA (HOME E INVENTARIO)/banner2.jpg", alt: "Banner 4" },
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Diamante/PUBLICIDAD LARGA (HOME E INVENTARIO)/banner3.jpg", alt: "Banner 5" },
      ];
    }
  
    private getDefaultLeftImages(): any[] {
      return [
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Standard/PUBLICIDAD LARGA STANDARD/banner24.jpg", alt: "Banner 24" },
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Standard/PUBLICIDAD LARGA STANDARD/banner25.jpg", alt: "Banner 25" },
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Standard/PUBLICIDAD LARGA STANDARD/banner26.png", alt: "Banner 26" },
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Standard/PUBLICIDAD LARGA STANDARD/banner27.jpg", alt: "Banner 27" }
      ];
    }
  
    private getDefaultRightImages(): any[] {
      return [
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Standard/PUBLICIDAD LARGA STANDARD/banner28.png", alt: "Banner 28" },
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Standard/PUBLICIDAD LARGA STANDARD/banner29.png", alt: "Banner 29" },
        { src: "https://insuaminca.org/insuaminca/assets/images/Publicidad Standard/PUBLICIDAD LARGA STANDARD/banner30.jpg", alt: "Banner 30" }
      ];
    }
  
    // Función para mezclar cualquier array de imágenes (mantener la existente)
    shuffleArray(array: any[]): any[] {
      let arrayCopy = [...array];
      for (let i = arrayCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
      }
      return arrayCopy;
    }
  
    // Mezclar todas las imágenes (modificada para usar los nuevos arrays)
    shuffleAllImages() {
      this.shuffledMainImages = this.shuffleArray(this.mainImages);
      this.shuffledLeftImages = this.shuffleArray(this.leftImages);
      this.shuffledRightImages = this.shuffleArray(this.rightImages);
      
      // Reinicializar carruseles después de mezclar
      setTimeout(() => {
        this.initializeCarousels();
      }, 100);
    }
  
    // Función mejorada para inicializar carruseles
    initializeCarousels() {
      const carruseles = [
        'carouselExampleIndicators',
        'promotionCarousel3', 
        'promotionCarousel4'
      ];
      
      carruseles.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          // Disposes existing carousel if any
          const existing = bootstrap.Carousel.getInstance(element);
          if (existing) {
            existing.dispose();
          }
          
          // Initialize new carousel
          new bootstrap.Carousel(element, {
            interval: 3000,
            ride: 'carousel'
          });
        }
      });
    }
  
    ngAfterViewInit() {
      // Inicializar carruseles después de que se carguen las imágenes
      setTimeout(() => {
        this.initializeCarousels();
      }, 500);
    }

  // --- Método para cargar los proveedores del carrusel ---
  loadCarouselProviders(): void {
    this.isLoadingProviders = true; 
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'X-Auth-Token': `${token}`
    });

    const apiUrl = `${API_URL}portalcli/carruselaliado`; 

    this.http.post<ApiResponseProviders>(apiUrl, {}, { headers: headers }).pipe(
      map(response => {
        if (response.status && response.data) {
          return response.data.map(item => ({
            proveed: item.proveed,
            name: item.nombre,   
            imageSrc: `./assets/images/logoprv/${item.proveed}.png`, 
          }));
        } else {
          console.warn('API de proveedores no devolvió datos o el estado es false:', response);
          return []; 
        }
      }),
      catchError(this.handleError),
      finalize(() => {
        this.isLoadingProviders = false;
      })
    ).subscribe({
      next: (data: Provider[]) => {
        this.providers = data;
      },
      error: (error) => {
        console.error('Error al cargar los proveedores del carrusel:', error);
      }
    });
  }

  //método handleError existente, se reutiliza para proveedores ---
  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('Ocurrió un error del lado del cliente o de la red:', error.error);
      Swal.fire('Error de Conexión', 'No se pudo conectar con el servidor. Revisa tu conexión a internet.', 'error');
    } else {
      console.error(
          `El backend retornó el código ${error.status}, el cuerpo era: `, error.error);
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
    formData.append('ofertas', '0'); // Añadido el filtro de ofertas
    formData.append('ofertasActivas', '1'); // Añadido el filtro de ofertas activas

    const headers = new HttpHeaders({
      'X-Auth-Token': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/inventariocli`;

    this.http.post<ApiResponse>(apiUrl, formData, { headers: headers })
        .pipe(
            catchError(this.handleError)
        )
        .subscribe({
          next: (response: ApiResponse) => {
            // Asegúrate de que response.data tenga al menos 20 elementos antes de intentar dividirlos
            if (!response.data || response.data.length < 20) {
              console.warn('La API no devolvió al menos 20 productos. No se realizará la división.');
              // Puedes decidir cómo manejar esto:
              this.products = [];
              this.products_2 = []; // O manejarlo de otra forma si necesitas un comportamiento específico
              this.isLoading = false;
              return;
            }

            // Mapea *todos* los datos recibidos una sola vez
            const allMappedProducts: Product[] = response.data.map(item => {
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

              // Lógica para 'ofertaDisplay'
              if (Array.isArray(item.oferta) && item.oferta.length > 0) {
                product.ofertaDisplay = 'Oferta';
              } else if (typeof item.oferta === 'string' && item.oferta.trim() !== '') {
                product.ofertaDisplay = item.oferta;
              } else {
                product.ofertaDisplay = '';
              }
              return product;
            });

            // Asigna los primeros 10 productos a 'products'
            this.products = allMappedProducts.slice(0, 10);

            // Asigna los siguientes 10 productos a 'products_2'
            // Esto toma desde el índice 10 (el undécimo elemento) hasta el final (índice 19, si hay 20 en total)
            this.products_2 = allMappedProducts.slice(10, 20);

            this.isLoading = false;
          },
          error: (err) => {
            this.error = err;
            this.isLoading = false;
            console.error('Error de la API en subscribe (fetchProducts):', err);
            this.products = [];
            this.products_2 = []; // Limpia también products_2 en caso de error
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
    
      this.portalcliLogicaService.agregarAlCarrito(product, cantidad,'').subscribe({
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
  Swal.showLoading();
    this.portalcliLogicaService.openProductModal(codigo).subscribe({ // Suscríbete al Observable
      next: (data) => {
        this.selectedProduct = data.product;
        this.imageficha = data.imageUrl;
        Swal.close();
      },
      error: (error) => {
        Swal.close();
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
