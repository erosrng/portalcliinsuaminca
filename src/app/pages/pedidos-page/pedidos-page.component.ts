import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild  } from '@angular/core';

import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';

import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';
import Swal from 'sweetalert2';
import { Subscription, takeUntil, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-pedidos-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.scss'
})
export class PedidosPageComponent implements OnInit, OnDestroy {
  products: any[] = [];
  categoria: string | null = null;
  categorianombre: string | null = null;
  search: string | null = null;

  private destroy$ = new Subject<void>();

  dataSource = new MatTableDataSource<any>(this.products);
  displayedColumns: string[] = ['img', 'descrip','oprecio', 'opreciod', 'existen', 'cantidad', 'agregar']; // 'nomprv', 'lote', 'vence', 
  @ViewChild(MatPaginator) paginator!: MatPaginator; 
  private subscriptions: Subscription[] = [];
  private clienteCambiadoSubscription: Subscription | undefined;

  filteredProducts: any[] = [];
  pagedProducts: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  pages: number[] = [];
  productosEnCarrito: any[] = [];
  //loading: boolean = false;
  unidades: string = '';
  totalBs: string = '';
  totalUsd: string = '';
  encarprod: string = '';
  productosEnCarritoCodigos: string[] = [];
  selectedProduct: any = null;
  sortField: string = 'descrip';
  marcas: any[] = [];
  isLoading = false;

  pageInput: string = '';
  minResults: number = 0;
  recordsFiltered: number = 0;
  diasMontoFactura: number | undefined;

  filterDescrip = '';
  filterPrecio = '';
  clienteData: any;
  private clienteDataSubscription: Subscription | undefined;
  filterMarca: string = '';
  filterLote: string = '';
  orderBy: string = 'descrip'; // Valor por defecto
  orderDirection: string = 'asc';

  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.categoria = params['categoria'];
      this.search = params['search'];
      this.categorianombre = params['categorianombre'];
      this.fetchPedidos(); 
    });

    /* this.clienteCambiadoSubscription = this.portalcliLogicaService.clienteCambiado$.subscribe(() => {
      this.clienteDataSubscription = this.portalcliLogicaService.clienteData$.subscribe(data => {
        this.clienteData = data;
        //console.log(this.clienteData)
      });
      this.fetchPedidos();

    }); */

    this.portalcliLogicaService.clienteCambiado$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      //this.clienteData = this.portalcliLogicaService.clienteData$.getValue(); // Obtén el valor actual
      this.fetchPedidos();
    });

    this.fetchPedidos();
    this.revisarCarrito();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  applyFilters() {
      this.currentPage = 1; // Reset to first page when applying filters
      this.fetchPedidos();
      if (this.paginator) {
        this.paginator.firstPage();
      }
  }

  sortData(sortField: string) {
    if (this.orderBy === sortField) {
      this.orderDirection = this.orderDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.orderBy = sortField;
      this.orderDirection = 'asc';
    }
    this.applyFilters();
  }

    checkPriceRange(price: number, range: string): boolean {
      if (!range) return true;
      const [min, max] = range.split('-').map(Number);
      return price >= min && price <= max;
    }
  
    pageChanged(event: PageEvent) {
      this.currentPage = event.pageIndex + 1;
      this.itemsPerPage = event.pageSize;
      this.fetchPedidos();
    }
  

  updatePagedProducts() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedProducts = this.filteredProducts.slice(start, end);
  }

  fetchPedidos() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    // Parámetros de paginación
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const length = this.itemsPerPage;
  
    formData.append('start', start.toString());
    formData.append('length', length.toString());
  
    formData.append('codCli', codCli ?? '');
    //formData.append('search', this.filterDescrip); 
    formData.append('search', this.search ?? ''); 
    formData.append('categoria', this.categoria ?? '');
    formData.append('marca', '');
    if (this.clienteData && this.clienteData.ubica) {
      formData.append('almacen', this.clienteData.ubica);
    }
    formData.append('proveedor', this.filterMarca);
    formData.append('lote', this.filterLote);
    formData.append('orderby', this.orderBy);
    formData.append('orderDirection', this.orderDirection);
    formData.append('nuevos', '0');
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
    const apiUrl = `${API_URL}portalcli/inventariocli`;
  
    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.dataSource.data = response.data; 
        this.pagedProducts = response.data; // Usamos pagedProducts directamente
        this.totalPages = Math.ceil(parseInt(response.recordsTotal) / this.itemsPerPage);
        this.isLoading = false; 
      },
      error: (error) => {
        this.isLoading = false; 
        console.error('Error de la API:', error);
      },
    });
  }

  /* traeMarcas() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();

    const apiUrl = `${API_URL}portalcli/buscamarcas`;

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.marcas = response.data;
        } else {
          console.error('Error al cargar marcas:', response);
          this.marcas = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error de la API:', error);
        this.marcas = [];
      },
    });
  } */

    searchProducts(event: Event): void {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();
    }
    

    clear(): void {
      this.search = '';
      this.dataSource.filter = '';
    }    

  goToFirstPage() {
    this.currentPage = 1;
    this.fetchPedidos();
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
    this.fetchPedidos();
    if (this.paginator) {
      this.paginator.lastPage();
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

  validateInput(product: any, event: any) {
    product.cant = this.portalcliLogicaService.validateCant(event);
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

  navigateTo(route: string) {
    this.portalcliLogicaService.navigateTo(route);
  }

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
                this.productosEnCarrito = [];
                this.dataSource.data = this.productosEnCarrito;
    
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

    formatOfertasTooltip(ofertas: any[]): string {
      return ofertas.map(oferta => `${oferta.lista} (Descuento: ${oferta.descuento}%)`).join('\n');
    }

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
            this.mostrarLoader;
            this.http.post(apiUrl, formData, { headers: headers }).subscribe({
              next: (response: any) => {
                if (response.status) {
                  this.ocultarLoader;
                  this.revisarCarrito();
                  Swal.fire(response.mensaje, '', 'success');
                  this.productosEnCarrito = [];
                  this.dataSource.data = this.productosEnCarrito;
                  this.isLoading = false;  
                } else {
                  Swal.fire(response.mensaje, '', 'error');
                  this.isLoading = false;  
                }
              },
              error: (error) => {
                this.isLoading = false;  
                this.ocultarLoader;
                Swal.fire(error, '', 'error');
                console.error('Error de la API:', error);
              },
            });
        }
        });
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
}