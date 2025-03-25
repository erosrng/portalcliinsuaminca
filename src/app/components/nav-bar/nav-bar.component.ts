import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild  } from '@angular/core';
import { AuthService } from './../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URL } from './../../app.config';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router'; 
@Component({
  selector: 'app-nav-bar',
  imports: [CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  categoriaSeleccionada: { grupo: string; nom_grup: string; } | null = null;
  rutaActual: string='';

  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = true;

  productosEnCarrito: any[] = [];
  productosEnCarritoNumber: string = '';
  encarprod: string = '';
  productosEnCarritoCodigos: string[] = [];
  selectedProduct: any = null;
  totalBs: string = '';
  totalUsd: string = '';
  unidades: string = '';

  private subscriptions: Subscription[] = []; 
  clientes: { cliente: string; nombre: string; rifci: string }[] | null = null;
  grup: { grupo: string; nom_grup: string;}[]  | null = null;
  codCli: string | null = null;

  constructor(
    private router: Router,
    public authService: AuthService, 
    private route: ActivatedRoute,
    private http: HttpClient,
    public portalcliLogicaService: PortalcliLogicaService
  ) {} 

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
        if(params['categoria']) {
            this.grup?.forEach((cat)=>{
                if(cat.grupo == params['categoria']){
                    this.categoriaSeleccionada = cat;
                }
            })
        } else {
            this.categoriaSeleccionada = null;
        }
    });
    this.rutaActual = this.route.snapshot.url.join('/');
    this.codCli = this.authService.getCodCli();
    this.clientes = this.authService.getClientes();
    this.grup = this.authService.getLgrup();
    this.portalcliLogicaService.buscaalmacen();
    this.revisarCarrito();
  }

  toggleMenu() {
    this.portalcliLogicaService.toggleMenu();
  }

  navigateTo(route: string) {
    this.portalcliLogicaService.navigateTo(route);
  }


  onClienteSeleccionado(cliente: { cliente: string; nombre: string; rifci: string }): void {
    this.authService.setCodCli(cliente.cliente);
    this.portalcliLogicaService.buscaalmacen();
    if(this.rutaActual == 'carrito'){
      this.portalcliLogicaService.notificarCambioCliente(cliente.cliente);
    }
    this.revisarCarrito();
  }

/*   onCategoriaSeleccionada(lgrup: { grupo: string; nom_grup: string;}): void {
    console.log(lgrup)
    this.categoriaSeleccionada = lgrup;
    this.router.navigate(['/pedidos'], { queryParams: { categoria: lgrup.grupo } }); 
  }
 */
  onCategoriaSeleccionada(lgrup?: { grupo: string; nom_grup: string; }): void {
    if (lgrup) {
      this.router.navigate(['/pedidos'], { queryParams: { categoria: lgrup.grupo, categorianombre: lgrup.nom_grup } }); 
    } else {
      this.router.navigate(['/pedidos'], { queryParams: { categoria: "" } }); 
    }
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

        if (this.rutaActual == 'pedidos') {
          this.productosEnCarrito = productos;
        }
      }),
      this.portalcliLogicaService.unidades$.subscribe((unidades) => {
        if (this.rutaActual == 'pedidos') {
          this.unidades = unidades;
        }
      }),
      this.portalcliLogicaService.totalBs$.subscribe((totalBs) => {
        if (this.rutaActual == 'pedidos') {
          this.totalBs = totalBs;
        }
      }),
      this.portalcliLogicaService.totalUsd$.subscribe((totalUsd) => {
        if (this.rutaActual == 'pedidos') {
          this.totalUsd = totalUsd;
        }
      }),
      this.portalcliLogicaService.encarprod$.subscribe((encarprod) => {
        if (this.rutaActual == 'pedidos') {
          this.encarprod = encarprod;
        }
      }),
      this.portalcliLogicaService.productosEnCarritoCodigos$.subscribe((codigos) => {
        if (this.rutaActual == 'pedidos') {
          this.productosEnCarritoCodigos = codigos;
        }
      })
    );
  }


  getNombreClienteSeleccionado(): string {
    const codCli = this.authService.getCodCli();
    if (!this.clientes) {
      return `(${codCli}) ${this.authService.getNombre()}`;
    }
    const clienteSeleccionado = this.clientes.find((cliente) => cliente.cliente === codCli);
    return clienteSeleccionado
      ? `(${clienteSeleccionado.cliente}) ${clienteSeleccionado.nombre}`
      : `(${codCli}) ${this.authService.getNombre()}`;

  }

  /* buscaalmacen(){
    const formData = new FormData();
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/buscaalmacen`;

    formData.append('codCli', this.codCli ?? '');

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
          this.clienteData = response.datcli;
      },
      error: (error) => {
        console.error('Error de la API:', error);
      },
    });
  } */
}
