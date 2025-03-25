import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild  } from '@angular/core';

import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";

import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

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
    MatFormFieldModule
  ],
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.scss'
})
export class PedidosPageComponent implements OnInit, OnDestroy {
  products: any[] = [];
  categoria: string | null = null;
  categorianombre: string | null = null;

  dataSource = new MatTableDataSource<any>(this.products);
  displayedColumns: string[] = ['img', 'descrip', 'nomprv', 'lote', 'vence', 'oprecio', 'opreciod', 'existen', 'cantidad', 'agregar'];
  @ViewChild(MatPaginator) paginator!: MatPaginator; 
  private subscriptions: Subscription[] = [];

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

  isLoading = false;

  pageInput: string = '';
  minResults: number = 0;
  recordsFiltered: number = 0;

  filterDescrip = '';
  filterProveedor = '';
  filterLote = '';
  filterPrecio = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.categoria = params['categoria'];
      this.categorianombre = params['categorianombre'];
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
    formData.append('search', this.filterDescrip); // Usamos filterDescrip como search
    formData.append('marca', ''); // Puedes agregar un input para la marca si es necesario
    formData.append('proveedor', this.filterProveedor);
    formData.append('lote', this.filterLote);
    formData.append('orderby', '');
    formData.append('categoria', this.categoria ?? '');
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
    const apiUrl = `${API_URL}portalcli/data`;
  
    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
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

  vaciacar() {
    this.portalcliLogicaService.vaciacar();
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