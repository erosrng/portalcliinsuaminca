import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, signal, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar'; 
import { MatSnackBar } from '@angular/material/snack-bar'; // Importa MatSnackBar
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';
import Swal from 'sweetalert2';
import { Subscription, takeUntil, Subject } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormControl,Validators } from '@angular/forms'; // Importar ReactiveFormsModule y FormControl
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper } from '@angular/material/stepper';
import { MatStepperModule } from '@angular/material/stepper';
import { StepperSelectionEvent } from '@angular/cdk/stepper'; // Importa este tipo
import { MatAutocompleteModule } from '@angular/material/autocomplete'; // Para el autocompletado del cliente

import { MatRadioModule } from '@angular/material/radio'; 

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface GrupoCliente {
  clienteId: string;
  clienteNombre: string;
  productos: any[]; // Array de productos de ese cliente
  subtotalBs: number;
  subtotalUsd: number;
  totalUnidades: number;
}

interface ProductData {
  id_pedido: string;
  cliente: string;
  nombre: string;
  codigoa: string;
  barras: string;
  descrip: string;
  existen: string;
  oprecio: string; 
  opreciod: string;
  total: string; 
  totald: string;
  precio: string; 
  preciod: string; 
  iva: string;
  cant: string; 
  segmento: number;
  tasa: string;
  lote: string;
  vence: string;
  img: string;
  descu: number;
}


@Component({
  selector: 'app-pedidos-page',
  standalone: true, // Asegúrate de que tu componente es standalone
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    FormsModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,      // <-- Añadir MatStepperModule
    MatAutocompleteModule, // <-- Añadir MatAutocompleteModule
    MatSnackBarModule,
    MatRadioModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, 
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.scss'
})


export class PedidosPageComponent implements OnInit, OnDestroy {
  tipoCargaControl = new FormControl('', Validators.required); 
  clienteControl = new FormControl(); 
  tipoCarga: 'individual' | 'casa_matriz' | null = null;
  products: any[] = [];
  categoria: string | null = null;
  categorianombre: string | null = null;
  proveedselect: string | null = null;

  clientes: { cliente: string; nombre: string; rifci: string }[] | null = null;

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

  filterPrecio = '';
  clienteData: any;
  private clienteDataSubscription: Subscription | undefined;
  filterMarca: string = '';
  filterLote: string = '';
  orderBy: string = 'descrip';
  orderDirection: string = 'asc';

  esgrupo: any;


  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    public authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef 
  ) { }

  private searchSubject = new Subject<string>();
  filterDescrip = '';

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.categoria = params['categoria'];
      this.proveedselect = params['proveedselect'];
      this.search = params['search'];
      this.categorianombre = params['categorianombre'];

      //this.fetchPedidos(); 
    });
    this.esgrupo = this.authService.getCmatriz();
    this.clientes = this.authService.getClientes();

    if(!this.esgrupo){
      this.fetchPedidos();
    }

    this.portalcliLogicaService.clienteCambiado$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      //this.clienteData = this.portalcliLogicaService.clienteData$.getValue(); // Obtén el valor actual
      this.fetchPedidos();
    });

    this.searchSubject.pipe(
      debounceTime(300), // Espera 300ms después de la última pulsación
      distinctUntilChanged() // Solo emite si el valor actual es diferente al último
    ).subscribe(searchText => {
      this.fetchPedidos(); // Llama a la función de búsqueda
    });

    //this.fetchPedidos();
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
    //this.isLoading = true;
    Swal.showLoading();
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    // Parámetros de paginación
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const length = this.itemsPerPage;
  
    formData.append('start', start.toString());
    formData.append('length', length.toString());
  
    formData.append('codCli', codCli ?? '');
    formData.append('search', this.filterDescrip); 
    formData.append('categoria', this.categoria ?? '');
    formData.append('marca', '');
    if (this.clienteData && this.clienteData.ubica) {
      formData.append('almacen', this.clienteData.ubica);
    }
    formData.append('proveedor', this.proveedselect ?? '');
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
        this.pagedProducts = response.data;
        this.totalPages = Math.ceil(parseInt(response.recordsTotal) / this.itemsPerPage);
        this.cdr.detectChanges(); 
        Swal.close();
      },
      error: (error) => {
        console.error('Error de la API:', error);
        this.cdr.detectChanges(); 
        Swal.close();
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
      this.filterDescrip = '';
      this.dataSource.filter = '';
      this.fetchPedidos();
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

  agg_pedido(product: any,cliente: any,masivo=false) {
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

    if(cantidad<=0){
      Swal.fire({
        text: 'CANTIDAD DEBE SER MAYOR A CERO!!!',
        icon: 'error',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        position: 'bottom-end',
      });
      return;
    }
  
    this.portalcliLogicaService.agregarAlCarrito(product, cantidad,cliente).subscribe({
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
        if(!masivo){
          this.revisarCarrito();
        }
      },
    });
  }

  agg_all(product: any) {
    const cantidadInput = document.getElementById(`cana_${product.codigo}`) as HTMLInputElement;

    const codCli = this.authService.getCodCli();
    let cantidad: number;

    if (cantidadInput && cantidadInput.value) {
      cantidad = parseInt(cantidadInput.value, 10);
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

    if(cantidad<=0){
      Swal.fire({
        text: 'CANTIDAD DEBE SER MAYOR A CERO!!!',
        icon: 'error',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        position: 'bottom-end',
      });
      return;
    }
  

    this.mostrarSweetAlertClientes(product, cantidad);
}

private mostrarSweetAlertClientes(product: any, cantidad: number) {
  if (!this.clientes || this.clientes.length === 0) {
    Swal.fire({
      title: 'Error',
      text: 'No se encontraron clientes para seleccionar.',
      icon: 'warning',
      confirmButtonText: 'Ok'
    });
    return;
  }

  // Aquí se guardarán los clientes seleccionados
  let selectedClientes: { cliente: string, nombre: string }[] = [];

  const tableHtml = `
    <style>
      .swal2-table-container {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 15px;
        border: 1px solid #eee;
        border-radius: 5px;
      }
      .swal2-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9em;
      }
      .swal2-table th, .swal2-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      .swal2-table th {
        background-color: #f2f2f2;
      }
      .swal2-table tr:hover {
        background-color: #f5f5f5;
      }
      /* Estilos para los checkboxes */
      .swal2-table input[type="checkbox"] {
        margin-right: 8px;
        cursor: pointer;
      }
      .select-all-container {
          margin-bottom: 10px;
          padding: 5px;
          background-color: #f9f9f9;
          border-radius: 4px;
          display: flex;
          align-items: center;
      }
      .select-all-container label {
          font-weight: bold;
          margin-left: 5px;
          cursor: pointer;
      }
    </style>
    <div class="select-all-container">
      <input type="checkbox" id="selectAllClients" class="select-all-checkbox">
      <label for="selectAllClients">Seleccionar todos</label>
    </div>
    <div class="swal2-table-container">
      <table class="swal2-table">
        <thead>
          <tr>
            <th></th>
            <th>Código</th>
            <th>Nombre del Cliente</th>
          </tr>
        </thead>
        <tbody>
          ${this.clientes.map(cliente => `
            <tr>
              <td>
                <input type="checkbox" name="clienteSeleccionado" value="${cliente.cliente}" data-nombre="${cliente.nombre}" id="checkbox-${cliente.cliente}" class="client-checkbox">
              </td>
              <td><label for="checkbox-${cliente.cliente}">(${cliente.cliente})</label></td>
              <td><label for="checkbox-${cliente.cliente}">${cliente.nombre}</label></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  Swal.fire({
    title: 'Selecciona Clientes',
    html: tableHtml,
    width: '800px', 
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Confirmar Selección',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
      // Lógica para "Seleccionar todos"
      const selectAllCheckbox = Swal.getPopup()?.querySelector('#selectAllClients') as HTMLInputElement;
      const clientCheckboxes = Swal.getPopup()?.querySelectorAll('.client-checkbox') as NodeListOf<HTMLInputElement>;

      if (selectAllCheckbox && clientCheckboxes) {
        selectAllCheckbox.addEventListener('change', () => {
          clientCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
          });
        });

        //se desmarca un cliente, desmarcar "Seleccionar todos"
        clientCheckboxes.forEach(checkbox => {
          checkbox.addEventListener('change', () => {
            if (!checkbox.checked) {
              selectAllCheckbox.checked = false;
            } else {
              const allChecked = Array.from(clientCheckboxes).every(cb => cb.checked);
              selectAllCheckbox.checked = allChecked;
            }
          });
        });
      }
    },
    preConfirm: () => {
      const checkedCheckboxes = Swal.getPopup()?.querySelectorAll('input[name="clienteSeleccionado"]:checked') as NodeListOf<HTMLInputElement>;
      if (checkedCheckboxes.length === 0) {
        Swal.showValidationMessage('Por favor, selecciona al menos un cliente.');
        return false;
      }
      selectedClientes = Array.from(checkedCheckboxes).map(checkbox => ({
        cliente: checkbox.value,
        nombre: checkbox.dataset['nombre'] || ''
      }));
      return true;
    }
  }).then((result) => {
    Swal.showLoading();

    if (result.isConfirmed && selectedClientes.length > 0) {
      const cantidadtotal = selectedClientes.length*cantidad;
      const existen = product.existen;

      /* console.log('Clientes seleccionados longitud '+selectedClientes.length);
      console.log('Existencia total '+product.existen);
      console.log('Cantidad por cliente'+cantidad);
      console.log('Cantidad a pedir'+cantidadtotal); */

      if(cantidadtotal>existen){
        Swal.fire({
          title: '¡Cantidad Solicitada Excede la Existencia!',
          html: `
            La **cantidad total** que intentas enviar a los ${selectedClientes.length} clientes seleccionados es de
            **${cantidadtotal} unidades**, lo cual es **superior** a la existencia disponible en tu almacén, que es de
            **${existen} unidades**.
            <br><br>
            Para poder procesar este pedido, por favor, ajusta la cantidad por cliente o deselecciona algunos clientes hasta que el total solicitado sea menor o igual a la existencia.
          `,
          icon: 'warning', 
          confirmButtonText: 'Entendido',
        });
        return;
      }

      selectedClientes.forEach(cli => {
        //console.log(`Agregando pedido para cliente: (${cli.cliente}) ${cli.nombre}`);
        this.agg_pedido(product,cli.cliente,true)
      });
      Swal.close();
      this.revisarCarrito();
      Swal.fire({
        text: `Pedido agregado para ${selectedClientes.length} cliente(s).`,
        icon: 'success',
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        position: 'bottom-end',
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        text: 'Selección de clientes cancelada.',
        icon: 'info',
        showConfirmButton: false,
        timer: 1500,
        toast: true,
        position: 'bottom-end',
      });
    }
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
        this.cdr.detectChanges();
      }),
      this.portalcliLogicaService.unidades$.subscribe((unidades) => {
        this.unidades = unidades;
        this.cdr.detectChanges();
      }),
      this.portalcliLogicaService.totalBs$.subscribe((totalBs) => {
        this.totalBs = totalBs;
        this.cdr.detectChanges();
      }),
      this.portalcliLogicaService.totalUsd$.subscribe((totalUsd) => {
        this.totalUsd = totalUsd;
        this.cdr.detectChanges();
      }),
      this.portalcliLogicaService.encarprod$.subscribe((encarprod) => {
        this.encarprod = encarprod;
        this.cdr.detectChanges();
      }),
      this.portalcliLogicaService.productosEnCarritoCodigos$.subscribe((codigos) => {
        this.productosEnCarritoCodigos = codigos;
        this.cdr.detectChanges();
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

    vaciacarcm(): void {
      const apiUrl = `${API_URL}portalcli/vaciacarcm`;
      const formData = new FormData();
      const token = this.authService.getToken();
  
      const headers = new HttpHeaders({
        'Authorization': `${token}`
      });

      Swal.fire({
        title: '¿Desea vaciar el carrito del grupo?',
        text: "Eliminar todos los productos en el mismo.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Vaciar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.http.post(apiUrl, formData, { headers: headers }).subscribe({
            next: (response: any) => {
              if (response.status) {
                this.productosEnCarrito = [];
                this.Procesarpedido(); 
                this.revisarCarrito();
                this.cdr.detectChanges();

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
          Swal.showLoading();
            this.http.post(apiUrl, formData, { headers: headers }).subscribe({
              next: (response: any) => {
                if (response.status) {
                  Swal.close();
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
                Swal.close();
                Swal.fire(error, '', 'error');
                console.error('Error de la API:', error);
              },
            });
        }
        });
    }

    enviapedcm(){
        const formData = new FormData();
        const token = this.authService.getToken();
    
        const headers = new HttpHeaders({
          'Authorization': `${token}`
        });
        const apiUrl = `${API_URL}portalcli/enviacm`;
      
        Swal.fire({
          
        title: '¿Desea enviar los pedidos del grupo?',
        text: "Esta acción no se puede deshacer.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        cancelButtonText: 'Cancelar',
          allowOutsideClick: () => !Swal.isLoading()
      
        }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                      title: 'Enviando pedido...',
                      text: 'Por favor, espere.',
                      allowOutsideClick: false, // Prevent closing by clicking outside
                      didOpen: () => {
                        Swal.showLoading(); // Show the actual loading spinner
                      }
                    });
              
            this.http.post(apiUrl, formData, { headers: headers }).subscribe({
              next: (response: any) => {
                console.log(response)
                if (response.status) {
                  Swal.close();
                  this.revisarCarrito();
                  this.Procesarpedido(); 

                  Swal.fire(response.mensaje, '', 'success');
                  this.productosEnCarrito = [];
                  this.dataSource.data = this.productosEnCarrito;
                } else {
                  Swal.fire(response.mensaje, '', 'error');
                  Swal.close();
                }
              },
              error: (error) => {
                Swal.close();
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
    Swal.showLoading();
      this.portalcliLogicaService.openProductModal(codigo).subscribe({ // Suscríbete al Observable
        next: (data) => {
          this.selectedProduct = data.product;
          this.imageficha = data.imageUrl;
          Swal.close();
          this.cdr.detectChanges();

        },
        error: (error) => {
          this.cdr.detectChanges();
          Swal.close();
          console.error('Error al obtener el producto:', error);
        },
      });
    }

  onClienteSeleccionado(cliente: any) {
    //this.portalcliLogicaService.setClienteData(cliente);
    this.clienteData = cliente;
    this.clienteControl.setValue(cliente); // Actualiza el control del autocompletado
    this.fetchPedidos(); // Carga los pedidos una vez que el cliente está seleccionado
  }

  @ViewChild('stepper') stepper!: MatStepper; 

   onStepChange(event: StepperSelectionEvent) {
    // event.selectedIndex es el índice del paso al que se navegó
    // event.previouslySelectedIndex es el índice del paso del que se salió

    if (event.selectedIndex == 1) { 
      this.iniciarCargaDeInventario();
    } else if (event.selectedIndex === 2 && this.esgrupo && this.tipoCargaControl.value === 'casa_matriz') { 
      this.Procesarpedido(); 
    }
    // Si tienes lógica para otros pasos, puedes añadir más `else if`
  }

  iniciarCargaDeInventario() {
      this.fetchPedidos();
  }

  displayedColumnsFinalOrder: string[] = ['nombre', 'img', 'producto', 'cantidad', 'precioBs', 'precioUsd'];
  dataSourceFinalOrder = new MatTableDataSource<any>([]);

  groupedClientData: GrupoCliente[] = [];

  Procesarpedido() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    formData.append('codCli', codCli ?? '');
    if (this.clienteData && this.clienteData.ubica) {
      formData.append('almacen', this.clienteData.ubica);
    }

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const apiUrl = `${API_URL}portalcli/carritocm`;
  
    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        // Asegúrate de que `response` contiene los datos directamente,
        this.groupedClientData = this.groupProductsByClient(response); // <-- Asigna un NUEVO ARRAY aquí
        this.calculateFinalOrderSummary();

        this.isLoading = false; 
        this.cdr.detectChanges();

      },
      error: (error) => {
        this.isLoading = false; 
        console.error('Error de la API:', error);
        this.cdr.detectChanges();
      },
    });
  }

  private groupProductsByClient(products: any[]): GrupoCliente[] {
    const grouped: { [key: string]: GrupoCliente } = {};

    products.forEach(product => {
      const clientId = product.cliente;
      if (!grouped[clientId]) {
        grouped[clientId] = {
          clienteId: clientId,
          clienteNombre: product.nombre, 
          productos: [],
          subtotalBs: 0,
          subtotalUsd: 0,
          totalUnidades: 0
        };
      }
      grouped[clientId].productos.push(product);
      grouped[clientId].subtotalBs += parseFloat(product.total || 0); // Asumiendo 'total' es el subtotal en Bs.
      grouped[clientId].subtotalUsd += parseFloat(product.totald || 0); // Asumiendo 'totald' es el subtotal en Usd.
      grouped[clientId].totalUnidades += parseInt(product.cant || 0); // Asumiendo 'cant' es la cantidad.
    });

    return Object.values(grouped);
  }

  unidadescm: number = 0;
  encarprodcm: number = 0;
  totalBscm: number = 0;
  totalUsdcm: number = 0;

  calculateFinalOrderSummary() {
    this.unidadescm = 0;
    this.totalBscm = 0;
    this.totalUsdcm = 0;
    this.encarprodcm = this.groupedClientData.length;

    let totalProductosDiferentesEnCarrito = 0; 

    this.groupedClientData.forEach(clientGroup => {
      this.unidadescm += clientGroup.totalUnidades;
      this.totalBscm += clientGroup.subtotalBs;
      this.totalUsdcm += clientGroup.subtotalUsd;
      totalProductosDiferentesEnCarrito += clientGroup.productos.length; 
    });

    this.encarprodcm = totalProductosDiferentesEnCarrito;
  }

  // Función para modificar la cantidad de un producto
  modificarCantidad(product: ProductData, newQuantity: number) {
    if (newQuantity <= 0) {
      this.snackBar.open('La cantidad debe ser mayor a cero. Para eliminar el producto, usa el botón de eliminar.', 'Cerrar', {
        duration: 5000, 
        panelClass: ['warning-snackbar'] 
      });
      
      if (newQuantity === 0) {
        if (confirm(`¿Estás seguro de que quieres eliminar "${product.descrip}" del carrito?`)) {
          this.eliminarItem(product);
        }
      }
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    formData.append('id', product.id_pedido);
    formData.append('codigo', product.codigoa);
    formData.append('cantidad', newQuantity.toString());

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/totalizacampo`; 
  
    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        if (response.status == true) {
          this.Procesarpedido(); 

          this.snackBar.open('Cantidad actualizada correctamente.', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar', 'snackbar-with-icon'] 
          });
        } else {
          this.snackBar.open(response.message || 'Error al actualizar la cantidad.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar', 'snackbar-with-icon'] 
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false; 
        console.error('Error de la API al modificar cantidad:', error);
        this.snackBar.open('Ocurrió un error al conectar con el servidor.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar'] // Clase CSS para personalizar el estilo
        });
      },
    });
  }

  // Función para eliminar un ítem del carrito de casa matriz 
  eliminarItem(product: ProductData) {
    Swal.fire({
      title: '¿Estás seguro?',
      html: `¿Realmente deseas eliminar **"${product.descrip}"** del carrito? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', 
      cancelButtonColor: '#3085d6', 
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true; 
        const formData = new FormData();
        const token = this.authService.getToken();
  
        formData.append('id', product.id_pedido);
        formData.append('codigo', product.codigoa);
  
        const headers = new HttpHeaders({
          'Authorization': `${token}`
        });
        const apiUrl = `${API_URL}portalcli/eliminareg`; 
      
        this.http.post(apiUrl, formData, { headers: headers }).subscribe({
          next: (response: any) => {
            if (response.status == true) {
              this.snackBar.open('Producto eliminado correctamente.', 'Cerrar', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              // Después de la eliminación exitosa, recarga los datos del carrito
              this.Procesarpedido(); 
              // La detección de cambios para la tabla final del carrito ya está en Procesarpedido()
            } else {
              this.snackBar.open(response.message || 'Error al eliminar el producto.', 'Cerrar', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
            this.isLoading = false; 
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.isLoading = false; 
            console.error('Error de la API al eliminar ítem:', error);
            this.snackBar.open('Ocurrió un error al conectar con el servidor.', 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            this.cdr.detectChanges();
          },
        });
      } else {
        this.snackBar.open('Eliminación cancelada.', 'Cerrar', {
          duration: 2000,
          panelClass: ['info-snackbar'] 
        });
      }
    });
  }
  

  onQuantityChange(product: ProductData, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    let newQuantity = parseInt(inputElement.value);
    const existenciaDisponible = parseInt(product.existen || '0', 10); 

    // Validación para asegurarse de que sea un número válido y no esté vacío
    if (isNaN(newQuantity) || inputElement.value.trim() === '') {
      inputElement.value = product.cant;
      this.snackBar.open('Por favor, introduce una cantidad válida.', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    // Asegurarse de que la cantidad no sea negativa (ya que min="1" en HTML lo evita, pero es bueno validarlo en TS)
    if (newQuantity < 0) {
        newQuantity = 1; // O puedes dejarlo en 0 y esperar la lógica de eliminación
        inputElement.value = '1'; // Actualiza el input visualmente
        this.snackBar.open('La cantidad no puede ser negativa. Se ha establecido a 1.', 'Cerrar', {
          duration: 3000,
          panelClass: ['warning-snackbar']
        });
    }

    if (newQuantity > existenciaDisponible) {
      this.snackBar.open(`La cantidad no puede ser mayor que la existencia disponible (${existenciaDisponible}). Se ha ajustado a la máxima.`, 'Cerrar', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
      newQuantity = existenciaDisponible; // <--- Ajusta la cantidad a la existencia máxima
      inputElement.value = newQuantity.toString(); 
      return;
    }

    // Llama a tu función para modificar la cantidad
    this.modificarCantidad(product, newQuantity);
  }



}