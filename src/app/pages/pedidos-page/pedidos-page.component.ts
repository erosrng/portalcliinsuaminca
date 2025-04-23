import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ElementRef, ChangeDetectorRef  } from '@angular/core';
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
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {MatButtonModule} from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { CarshopComponent } from "../../components/carshop/carshop.component";
import * as XLSX from 'xlsx';
import {MatSidenav, MatSidenavModule} from '@angular/material/sidenav';

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
    MatTabsModule,
    MatStepperModule,
    MatButtonModule,
    MatDialogModule,
    CarshopComponent,
    MatSidenav,
    MatSidenavModule
],
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.scss'
})
export class PedidosPageComponent implements OnInit, OnDestroy {
  @ViewChild(CarshopComponent) carshopComponent: CarshopComponent | undefined; 
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  products: any[] = [];
  dataSource = new MatTableDataSource<any>(this.products);
  displayedColumns: string[] = 
  [
    'img', 'descrip', 'nomprv', 'lote', 'vence', 
    'opreciod', 'apliDiscount', 'cantidad',
    'descuento', 'agregar'
  ];
  
  categoria: string | null = null;
  categorianombre: string | null = null;
  search: string | null = null;
  isLoading = false;

  

  private destroy$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  private clienteCambiadoSubscription: Subscription | undefined;

  filteredProducts: any[] = [];
  pagedProducts: any[] = [];
  currentPage = 1;
  itemsPerPage = 1000;
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

  descuentoLineal: number | 0 = 0; 
  toggleMenu = false;


  /* @ViewChild(MatTabGroup) tabGroup: MatTabGroup | undefined; */
  @ViewChild('stepper') stepper: MatStepper | undefined; 

  

  constructor(
    public dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    public http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService,
    private cdr: ChangeDetectorRef,
    private router: Router // Inyecta el Router si lo necesitas para navegación
  ) { }


  ngOnInit() {
   
    this.rutaActual = this.activatedRoute.snapshot.url.join('/');

    this.codCli = this.authService.getCodCli();
    if (this.codCli) {
      this.subscribeToClienteData(() => { // Pasar un callback a subscribeToClienteData
        if (this.stepper) {
          this.stepper.next(); // Avanza al siguiente paso si ya hay cliente
        }
      });
    }else{
      console.log(this.rutaActual)

      if(this.rutaActual=='pedidos'){
        Swal.fire({
          text: 'Seleccione un cliente para continuar',
          icon: 'info',
          showConfirmButton: false,
          timer: 4000,
          toast: true,
        });
      }

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


  }

  ngAfterViewInit(): void {
    // Escucha el evento de cambio de paso del stepper
    if (this.stepper) {
      this.stepper.selectionChange.pipe(takeUntil(this.destroy$)).subscribe((step) => {
        // Verifica si el índice del paso actual es 2 (el tercer paso, ya que los índices son 0, 1, 2)
        if (step.selectedIndex == 2 && this.carshopComponent) {
          // Llama a la función openCar() del CarshopComponent
          this.carshopComponent.subscribeToClienteData();
        }
      });
    }

    // $(this.datatable.nativeElement).DataTable(this.dtOptions);

  }


  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
    // this.dtTrigger.unsubscribe();
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


  obtenerClientes(): Observable<void> {
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

  onClienteSeleccionado(cliente: Clienteselect): void {
    this.authService.setCodCli(cliente.cliente);
    this.codCli = this.authService.getCodCli();

    this.portalcliLogicaService.buscaalmacen();
    this.clienteData = cliente; // Actualizar clienteData al seleccionar
    this.applyFilters(); // Recargar productos al seleccionar cliente
    this.revisarCarrito();
    if(this.codCli){
      this.subscribeToClienteData();
    }
    // Cambiar a la pestaña del inventario (índice 1)
    /* if (this.stepper) {
      this.stepper.next();
    } */
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
          this.aplicarDescuentoLineal();
          console.log(this.pagedProducts)
          this.isLoading = false; 
          this.dataSource.paginator = this.paginator;
          
          this.cdr.detectChanges();

          
          
        },
        error: (error) => {
          this.isLoading = false; 
          console.error('Error al cargar inventario:', error);
        },
      });
      
    }else{
      if(this.rutaActual=='pedidos'){
        Swal.fire({
          text: 'Seleccione un cliente para continuar',
          icon: 'info',
          showConfirmButton: false,
          timer: 4000,
          toast: true,
        });
      }
    }

  }

  // Función para aplicar el descuento lineal
  aplicarDescuentoLineal(): void {    
      if (this.descuentoLineal > 100) {
        Swal.fire('El descuento no puede ser mayor a 100', '', 'warning');
        return;
    }

    if (this.descuentoLineal !== null) {
      this.pagedProducts = this.pagedProducts.map(product => {
        if (!this.productosEnCarritoCodigos.includes(product.codigo)) {
          product.descprov = this.descuentoLineal;
        }
        return product;
      });
      this.dataSource.data = this.pagedProducts; // Actualiza la vista de la tabla
    } else {
      // Si el descuento lineal es null, puedes resetear los descuentos si lo deseas
      this.pagedProducts = this.pagedProducts.map(product => {
        if (!this.productosEnCarritoCodigos.includes(product.codigo)) {
          product.descprov = null; // O el valor original si lo tienes almacenado
        }
        return product;
      });
      this.dataSource.data = this.pagedProducts; // Actualiza la vista de la tabla
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
    product.descprov = event.target.value;
    console.log(this.portalcliLogicaService.validateCant(event))
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

  /*PARA CARGAR EXCEL Y BAJAR EXCEL*/
    jsonData: any;
    fileName: string = '';
    habilitarCargar: boolean = false; 
    
  
    productosEnCarritoNumber: string = '';
  
    onFileChange(event: any): void {
      const file = event.target.files[0];
      if (file) {
        if (file.name.endsWith('.xlsx')) { // Verifica la extensión del archivo
          this.fileName = file.name;
          const reader: FileReader = new FileReader();
  
          reader.onload = (e: any) => {
            const binarystr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(binarystr, { type: 'binary' });
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
  
            this.jsonData = XLSX.utils.sheet_to_json(ws);
            //console.log('Datos procesados:', this.jsonData);
            Swal.fire({
              text: 'Presione cargar archivo para procesar pedido',
              icon: 'info',
              showConfirmButton: false,
              timer: 9000,
              toast: true,
              position: 'bottom-end',
            });
          };
  
          reader.readAsBinaryString(file);
        } else {
          Swal.fire({
              text: 'Por favor, seleccione un archivo .xlsx',
              icon: 'error',
              showConfirmButton: false,
              timer: 3000,
              toast: true,
              position: 'bottom-end',
          });
  
          this.fileName = '';
          this.jsonData = null;
        }
      } else {
        Swal.fire({
          text: 'Por favor, seleccione un archivo .xlsx',
          icon: 'error',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          position: 'bottom-end',
      });
        this.fileName = '';
        this.jsonData = null;
      }
    }

    @ViewChild('cargarArchivoModal') cargarArchivoModal: TemplateRef<any> | undefined;

    openCargarArchivoModal(): void {
      if (this.cargarArchivoModal) {
        const dialogRef = this.dialog.open(this.cargarArchivoModal, {
          width: '600px', // Ajusta el ancho según necesites
        });
  
        dialogRef.afterClosed().subscribe(result => {
          console.log('El diálogo fue cerrado');
          this.fileName = ''; // Resetear el nombre del archivo al cerrar el modal
          this.habilitarCargar = false; // Resetear el estado del botón cargar
          // Aquí puedes manejar cualquier resultado del modal si es necesario
        });
      } else {
        console.error('cargarArchivoModal is undefined');
        // Puedes mostrar un mensaje de error al usuario si el template no se cargó correctamente
      }
    }

    LeerArchivo(): void {
      this.isLoading = true;
    
      const columnas = Object.keys(this.jsonData[0] || {});
      let i = 0;
      const filasFiltradas: any[][] = [];
      const codigosvacios: any[][] = [];
    
      if (this.jsonData  && this.jsonData.length > 0) {
        const promises: Promise<any>[] = this.jsonData.map((fila: any) => {
          const celdas = Object.values(fila);
          const canaexcel: number = Number(celdas[11]);
    
          if (!isNaN(canaexcel) && canaexcel > 0) {
            let codigoProducto: string = String(celdas[0]);
            codigoProducto = codigoProducto.trim().replace(/[^a-zA-Z0-9]/g, '');
    
            filasFiltradas.push(celdas);
    
            return this.portalcliLogicaService.agregarAlCarrito({ codigo: codigoProducto }, Number(celdas[11]),1,'a').toPromise()
              .then((response: any) => {
                if (response.status) {
                  i++;
                  console.log(`Producto ${codigoProducto} agregado al carrito. Respuesta:`, response);
                } else {
                  codigosvacios.push(celdas);
                  console.error(`Error al agregar el producto ${codigoProducto} al carrito:`, response);
                }
              })
              .catch((error) => {
                console.error(`Error al agregar el producto ${codigoProducto} al carrito:`, error);
              });
          }else{
            console.error('No hay datos para cargar');
          }
          return Promise.resolve(celdas);
        });
    
        Promise.all(promises).then(() => {
          if (codigosvacios.length > 0) {
            console.log('Códigos vacíos:', codigosvacios);
    
            // Construye el contenido de la alerta
            let contenidoAlerta = '';
            codigosvacios.forEach((fila) => {
              const descripcion = fila[2]; // Asume que la descripción está en el índice 2
              contenidoAlerta += `- ${descripcion}<br><br>`;
            });
    
            Swal.fire({
              title: 'No se cargaron los siguientes productos por falta de existencia.',
              html: contenidoAlerta,
              icon: 'warning',
              width: '600px',
              heightAuto: false,
              scrollbarPadding: false,
              customClass: {
                container: 'swal-container',
              },
              allowOutsideClick: false, // Deshabilita el cierre al hacer clic fuera
              allowEscapeKey: false, // Deshabilita el cierre con la tecla Esc
            });          
    
            this.revisarCarrito();
          }
          this.isLoading = false; 
        });
      } else {
        console.error('No hay datos para cargar');
        this.isLoading = false; 
      }
    }
  
    bajaexcel() {
      this.isLoading = true;
      //const codCli = localStorage.getItem(`idcli_${usuario}`);
      const formData = new FormData();
      const token = this.authService.getToken();
  
      const headers = new HttpHeaders({
        'Authorization': `${token}`
      });
      const apiUrl = `http://186.167.69.10:50080/proteoerp/ventas/generador/index/21/S`;
    
      this.http.post(apiUrl, {}, { }).subscribe({
        next: (response: any) => {
          const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const fileName = "/generador/listasprv/LISTADO DE PROVEEDOR_" + this.authService.getProveed() + "_" + formattedDate + ".xlsx";

          window.location.href = `http://186.167.69.10:50080/generador/${fileName}`;
          this.isLoading = false; 
        },
        error: (error) => {
          this.isLoading = false; 
          console.error('Error de la API:', error);
        },
      });
  }

  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }

  getPriceWDiscount(element: any) {
    if (element.descprov > 0) {
      console.log(element)
    }
    
  }
   
}