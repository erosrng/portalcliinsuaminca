import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";

import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';
import Swal from 'sweetalert2';
import { Subscription, takeUntil, Subject } from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs'; // Importa MatTabsModule

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabGroup } from '@angular/material/tabs';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';

export interface Clienteselect {
  cliente: string; // Ajusta según la estructura de tu API
  nombre: string;  // Este será el campo que mostrarás
  rifci: string;   // Otros campos que necesites
}

@Component({
  selector: 'app-pedidos-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    FormsModule,
    MatTableModule,
    MatAutocompleteModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    AsyncPipe,
    MatTabsModule // Agrega MatTabsModule a los imports
  ],
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.scss'
})
export class PedidosPageComponent implements OnInit, OnDestroy {
  products: any[] = [];
  categoria: string | null = null;
  categorianombre: string | null = null;
  search: string | null = null;
  isLoading = false;

  private destroy$ = new Subject<void>();

  dataSource = new MatTableDataSource<any>(this.products);
  displayedColumns: string[] = ['img', 'descrip', 'nomprv', 'lote', 'vence', 'oprecio', 'opreciod', 'existen', 'cantidad', 'agregar'];
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

  unidades: string = '';
  totalBs: string = '';
  totalUsd: string = '';
  encarprod: string = '';
  productosEnCarritoCodigos: string[] = [];
  selectedProduct: any = null;
  sortField: string = 'descrip';
  marcas: any[] = [];

  pageInput: string = '';
  minResults: number = 0;
  recordsFiltered: number = 0;

  filterDescrip = '';
  filterPrecio = '';
  clienteData: any = { cliente: null, nombre: null, rifci: null };
  private clienteDataSubscription: Subscription | undefined;
  filterMarca: string = '';
  filterLote: string = '';
  orderBy: string = 'descrip'; // Valor por defecto
  orderDirection: string = 'asc';

  codCli: string | null = null;
  //clientes: any[] = [];
  rutaActual: string = '';

  clienteControl = new FormControl<string | Clienteselect>('');
  clientes: Clienteselect[] = [];
  filteredOptions: Observable<Clienteselect[]> | undefined;

  @ViewChild(MatTabGroup) tabGroup: MatTabGroup | undefined;

  constructor(
    private activatedRoute: ActivatedRoute,
    public http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService,
    private router: Router // Inyecta el Router si lo necesitas para navegación
  ) { }


  ngOnInit() {
    this.codCli = this.authService.getCodCli();
    if (this.codCli) {
      this.subscribeToClienteData(() => { // Pasar un callback a subscribeToClienteData
        if (this.tabGroup) {
          this.tabGroup.selectedIndex = 1; // Cambiar a la pestaña del catálogo
        }
      });
    }else{
      Swal.fire({
        text: 'Seleccione un cliente para continuar',
        icon: 'info',
        showConfirmButton: false,
        timer: 4000,
        toast: true,
      });
    }

    this.obtenerClientes().subscribe(() => {
      this.filteredOptions = this.clienteControl.valueChanges.pipe(
        startWith(''),
        map(value => {
          const name = typeof value === 'string' ? value : value?.nombre;
          return name ? this._filter(name as string) : this.clientes.slice();
        }),
      );
    });


    this.rutaActual = this.activatedRoute.snapshot.url.join('/');
  }


  displayFn(cliente: Clienteselect): string {
    return cliente && cliente.nombre ? cliente.nombre : '';
  }

  private _filter(name: string): Clienteselect[] {
    const filterValue = name.toLowerCase();
    return this.clientes.filter(cliente => cliente.nombre.toLowerCase().includes(filterValue));
  }

  //Trae los datos del cliente al buscarlo o cambiarlo
  subscribeToClienteData(callback?: () => void) { // Añadir un parámetro de callback
    this.portalcliLogicaService.clienteData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.clienteData = data;
      this.clienteControl.setValue(this.clienteData);
      this.applyFilters(); // Recargar productos al cambiar de cliente (opcional)
      this.revisarCarrito();
      if (callback) {
        callback(); // Ejecutar el callback después de obtener los datos
      }
    });
  }


  dataIndex(dataRow: any): number {
    return this.dataSource.data.indexOf(dataRow);
  }


  obtenerClientes(): Observable<void> { // Devuelve un Observable para encadenar
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const apiUrl = `${API_URL}bdscli`;
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    return this.http.post(apiUrl, formData, { headers: headers }).pipe(
      map((response: any) => {
        if (response.result) {
          this.clientes = response.data.map((item: any) => ({
            cliente: item.cliente,
            nombre: item.nombre,
            rifci: item.rifci
          }));
        } else {
          console.error('Error al cargar clientes:', response);
          this.clientes = [];
        }
        this.isLoading = false;
      }),
      // catchError para manejar errores de la API si es necesario
    );
  }

  onClienteInputChange(event: any): void {
    const inputValue = event.target.value;
    if (!inputValue) { // Si el input está vacío
      this.clienteData = null;
      this.authService.setCodCli(null); 
      this.codCli = this.authService.getCodCli();
      return; // Sale de la función para evitar la búsqueda
    }

    const selectedCliente = this.clientes.find(
      (cliente) =>
        cliente.cliente === inputValue ||
        cliente.nombre.toLowerCase().includes(inputValue.toLowerCase()) ||
        cliente.rifci === inputValue
    );

    if (selectedCliente) {
      this.onClienteSeleccionado(selectedCliente);
    }
  }


  /* onClienteSeleccionado(cliente: { cliente: string; nombre: string; rifci: string }): void {

    this.authService.setCodCli(cliente.cliente);
    this.codCli = this.authService.getCodCli();

    this.portalcliLogicaService.buscaalmacen();
    if (this.rutaActual == 'carrito' || this.rutaActual == 'pedidos') {
      this.portalcliLogicaService.notificarCambioCliente(cliente.cliente);
    }
    this.subscribeToClienteData();
  } */

  onClienteSeleccionado(cliente: Clienteselect): void {
    this.authService.setCodCli(cliente.cliente);
    this.codCli = this.authService.getCodCli();
    if(this.codCli){
      this.subscribeToClienteData();
    }
    this.portalcliLogicaService.buscaalmacen();
    this.clienteData = cliente; // Actualizar clienteData al seleccionar
    this.applyFilters(); // Recargar productos al seleccionar cliente
    this.revisarCarrito();
  
    // Cambiar a la pestaña del inventario (índice 1)
    if (this.tabGroup) {
      this.tabGroup.selectedIndex = 1;
    }
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

    if(codCli){
      // Parámetros de paginación
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const length = this.itemsPerPage;
    
      formData.append('start', start.toString());
      formData.append('length', length.toString());
    
      formData.append('codCli', codCli ?? '');
      formData.append('search', this.filterDescrip); 
      formData.append('categoria', this.categoria ?? '');

      if (this.clienteData && this.clienteData.ubica) {
        formData.append('almacen', this.clienteData.ubica);
      }else{
        formData.append('almacen', '');
      }
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
      const apiUrl = `${API_URL}inventarioprv`;
    
      this.http.post(apiUrl, formData, { headers: headers }).subscribe({
        next: (response: any) => {
          this.pagedProducts = response.data.data;
          this.totalPages = Math.ceil(parseInt(response.data.recordsTotal) / this.itemsPerPage);
          this.isLoading = false; 
        },
        error: (error) => {
          this.isLoading = false; 
          console.error('Error al cargar inventario:', error);
        },
      });
    }else{
      Swal.fire({
        text: 'Seleccione un cliente para continuar',
        icon: 'info',
        showConfirmButton: false,
        timer: 4000,
        toast: true,
      });
    }

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
    console.log(this.codCli)
    const cantidadInput = document.getElementById(`cana_${product.codigo}`) as HTMLInputElement;
    const cantidadInput2 = document.getElementById(`cana2_${product.codigo}`) as HTMLInputElement;
    let cantidad: number;

    const descprovInput = document.getElementById(`descprov_${product.codigo}`) as HTMLInputElement;
    const descprovInput2 = document.getElementById(`descprov2_${product.codigo}`) as HTMLInputElement;
    let descprov: number;
  
    if (cantidadInput && cantidadInput.value) {
      cantidad = parseInt(cantidadInput.value, 10);
      descprov = parseInt(descprovInput.value, 10);
    } else if (cantidadInput2 && cantidadInput2.value) {
      cantidad = parseInt(cantidadInput2.value, 10);
      descprov = parseInt(descprovInput2.value, 10);
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
  
    this.portalcliLogicaService.agregarAlCarrito(product, cantidad, descprov,this.clienteData.ubica).subscribe({
      next: (response: any) => {
        let mensaje = response.message;
        if (typeof mensaje === 'object') {
          mensaje = JSON.stringify(mensaje);
        }
        Swal.fire({
          text: mensaje == 'Producto Agregado' ? 'Producto agregado exitosamente!' : mensaje,
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
              if (response.result) {
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
                console.error('Error al enviar pedido:', error);
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