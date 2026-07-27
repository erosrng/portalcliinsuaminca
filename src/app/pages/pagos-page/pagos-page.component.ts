 
import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSort, Sort } from '@angular/material/sort';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';
import { API_URLINTER } from './../../app.config';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // O MatLuxonDateModule si usas Luxon

import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { MatTableModule } from '@angular/material/table';
import Swal from 'sweetalert2';
import { ClicardComponent } from "../../components/clicard/clicard.component";
import { Subscription } from 'rxjs';
import { FormsModule, ReactiveFormsModule, FormControl,Validators } from '@angular/forms'; 



interface FacturaSeleccionada {
  selected: boolean;
  data: {
    tipo_doc: string;
    numero: string;
    emision: string;
    entregado: string;
    vence: string;
    dias: number;
    monto: number;
    impuesto: number;
    reteiva: number;
    saldo: number;
    ppago: number;
    difc: number;
    cdolar: number;
    monto_dolar: number;
    saldo_dolar: number;
    preabono: number;
    mfactura: number;
    [key: string]: any;
  };
  montoAPagar: number; 
  montoAPagarD: number; 
  montoTotalSeleccionado: number; 
  montoTotalSeleccionadoD: number; 
}

@Component({
  selector: 'app-pagos-page',
  imports: [
    NavBarComponent,
    MatCheckboxModule,
    FooterComponent,
    SideBarComponent,
    CommonModule,
    FormsModule,
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    ClicardComponent
],
  templateUrl: './pagos-page.component.html',
  styleUrl: './pagos-page.component.scss'
})

export class PagosPageComponent implements OnInit {
  pagedPagos: any[] = [];
  search: string | null = null;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  isLoading = false;
  //selectedRowsMap: { [key: string]: boolean } = {};
  selectedRowsMap: { [key: string]: FacturaSeleccionada } = {};
  selectedCount = 0;
  allPagos: any[] = [];
  showSelectedOnly = false;
  facturasACancelar: string = '';
  montoACancelar: number = 0;
  montoACancelard: number = 0;

  //Monto seleccionado en las filas
  montoSeleccionado: number = 0;
  montoSeleccionadod: number = 0;

  //montoPagado: number = 0;

  saldoDisponible: number = 0;
  saldoDisponibled: number = 0;

  montoPagado: any = ''; 
  montoPagadod: any = ''; 
  montoNumerico: number = 0;

  montoOriginalPagado: number = 0;
  montoOriginalPagadod: number = 0;

  isResponsiveMode: boolean = false;

  displayedColumns: string[] = [
    'select', 'documento', 'emision', 'entregado', 'vence', 'dias', 
    'monto', 'impuesto', 'reteiva', 'saldo', 'ppago', 'difc', 
    'cdolar', 'monto_dolar', 'saldo_dolar', 'mfactura'
  ];

  @ViewChild(MatSort) sort: MatSort = new MatSort();
  private subscriptions: Subscription[] = []; 
  private clienteSubscription: Subscription = new Subscription();
    public clienteData: any = {};
  clienteControl = new FormControl(); 
public deudaTotalAbsoluta: number = 0;

  get ndpendiActivo(): boolean {
    return this.clienteData?.ndpendi === 'S';
  }

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) { }

  ngOnInit() {
    //this.fetchPagos();


    this.clienteSubscription = this.portalcliLogicaService.clienteData$.subscribe(
      (cliente) => {
        this.clienteData = cliente;
        this.allPagos = [];
        this.pagedPagos = [];
        this.resetearCampos();
        if (Object.keys(this.clienteData).length > 0 && this.fechaTransferencia) {
          this.fetchPagos();
        }
      }
    );

    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  onClienteSeleccionado(cliente: any) {
     // Actualiza el control del autocompletado
  }

  checkScreenSize() {
    this.isResponsiveMode = window.innerWidth <= 576;
  }

  metodoPagoSeleccionado: string = '';
  tiposPago: string[] = []; 
  mostrarSelectorCuenta: boolean = false;
  cuentaSeleccionada: any = null;
  cuentas: any[] = [];
  tipoPagoSeleccionado: string = '';
  identificacion: string = '';
  fechaTransferencia: string = '';
  monto: number = 0;
  numeroReferencia: string = '';
  comprobante: any = null;
  sortColumn: string = 'numero';
  sortDirection: string = 'asc';

  showConRetencionOnly: boolean = false;

  // ============ NUEVOS MÉTODOS PARA CONTROL DE RETENCIONES ============

  // Verifica si una factura PUEDE ser seleccionada (debe tener retención cargada)
  puedeSeleccionarFactura(row: any): boolean {
    // Si el cliente es EXENTO, siempre puede seleccionar
    if (this.clienteData?.tiva!='E') {
        return true;
    }

    // Si no tiene campo estado_retencion, asumir que no tiene retención
    if (!row.estado_retencion) return false;
    
    const estado = row.estado_retencion.toLowerCase();
    
    // Solo se pueden seleccionar las que tienen retención (en proceso o aprobada)
    return estado === 'en proceso' || estado === 'aprobada' || estado === 'procesada (web)';
  }

  // Verifica si una factura NO PUEDE ser seleccionada (no tiene retención)
  noTieneRetencion(row: any): boolean {
    if (this.clienteData?.tiva!='E') {
        return false; // Nunca deshabilita si es exento
    }

    // Si no tiene campo estado_retencion, asumir que no tiene retención
    if (!row.estado_retencion) return true;
    const estado = row.estado_retencion.toLowerCase();

    // No tiene retención si está pendiente o vacío
    return estado === 'pendiente' || estado === '' || estado === null;
  }

  // Obtiene clase CSS para la fila según estado de retención
  getClaseFilaRetencion(row: any): string {
    if (this.noTieneRetencion(row)) {
      return 'fila-sin-retencion'; // Fila deshabilitada
    }
    return '';
  }

  // Obtiene icono para indicador visual
  getIconoRetencion(row: any): string {
    if (!row.estado_retencion) return 'fas fa-times-circle text-danger';
    
    const estado = row.estado_retencion.toLowerCase();
    
    switch(estado) {
      case 'en proceso':
        return 'fas fa-clock text-warning';
      case 'aprobada':
        return 'fas fa-check-circle text-success';
      case 'procesada (web)':
        return 'fas fa-hourglass-half text-info';
      case 'pendiente':
        return 'fas fa-times-circle text-danger';
      default:
        return 'fas fa-times-circle text-danger';
    }
  }

  // Obtiene tooltip informativo
  getTooltipRetencion(row: any): string {
     // Si el cliente es EXENTO
     if (this.clienteData?.tiva!='E') {
        return 'Cliente EXENTO - No requiere retención IVA\nFactura disponible para pago.';
    }
  
    if (!row.estado_retencion || row.estado_retencion === 'Pendiente') {
      return 'Esta factura no tiene retención cargada. No se puede seleccionar.';
    }
    
    let tooltip = `Estado: ${row.estado_retencion}`;
    
    if (row.nrocomp_aprobado) {
      tooltip += `\nComprobante aprobado: ${row.nrocomp_aprobado}`;
    } else if (row.nrocomp_proceso) {
      tooltip += `\nComprobante en proceso: ${row.nrocomp_proceso}`;
    }
    
    tooltip += `\nFactura disponible para pago.`;
    
    return tooltip;
  }

  // Obtiene badge para mostrar estado
  getBadgeRetencion(row: any): string {
    if (!row.estado_retencion) {
        return this.clienteData?.tiva!='E' ? 'Exento' : 'Sin Retención';
    }
    return row.estado_retencion;
}


  // Obtiene clase CSS para el badge
  getBadgeClaseRetencion(row: any): string {
    if (!row.estado_retencion) {
        return this.clienteData?.tiva!='E' ? 'bg-info' : 'bg-danger';
    }    
    const estado = row.estado_retencion.toLowerCase();
    
    switch(estado) {
      case 'en proceso':
        return 'bg-warning text-dark';
      case 'aprobada':
        return 'bg-success';
      case 'procesada (web)':
        return 'bg-info text-dark';
      case 'pendiente':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getBadgeTitle(row: any): string {
    if (!row.estado_retencion || row.estado_retencion === 'N/A') {
        return 'Esta operación no posee o no requiere retención de IVA.';
    }

    const estado = row.estado_retencion.toLowerCase();

    switch(estado) {
        case 'en proceso':
            return 'Retención está a la espera de ser confirmada.';
        case 'aprobada':
            return 'Retención confirmada y aplicada correctamente.';
        case 'procesada (web)':
            return 'La retención fue gestionada a través del portal web.';
        case 'pendiente':
            return 'Aún no se registra el comprobante de retención.';
        default:
            return 'Estado de retención no identificado.';
    }
}

  // Muestra alerta cuando intenta seleccionar factura sin retención
  mostrarAlertaSinRetencion(row: any): void {
    if (this.clienteData?.tiva!='E') {
        return;
    }

    const mensaje = `La factura ${row.tipo_doc}-${row.numero} no tiene retención cargada.\n\nDebe cargar la retención primero en la sección correspondiente antes de poder seleccionarla para pago.`;
    
    row.selected = false; 

    // Opcional: Si manejas un mapa de filas seleccionadas, asegúrate de borrarla de ahí también
    const rowId = this.getRowId(row);
    delete this.selectedRowsMap[rowId];

    Swal.fire({
      title: 'Retención Requerida',
      text: mensaje,
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#1a237e',
      showCloseButton: true,
      width: 500
    });
  }

  // Verifica si hay facturas seleccionables (para deshabilitar "Seleccionar todo")
  tieneFacturasSeleccionables(): boolean {
    return this.allPagos.some(row => this.puedeSeleccionarFactura(row));
  }


  // Este método es todo lo que necesitas
  toggleMostrarConRetencion(): void {
    this.isLoading = true;
    
    if (this.showConRetencionOnly) {
      // Filtrar para mostrar solo las que tienen retención
      this.pagedPagos = this.allPagos
        .filter(row => !this.noTieneRetencion(row))
        .map(row => {
          const rowId = this.getRowId(row);
          return {
            ...row,
            selected: this.selectedRowsMap[rowId]?.selected || false
          };
        });
    } else {
      // Mostrar todas
      this.updatePagedPagos();
    }
    
    this.isLoading = false;
  }

  // ============ MÉTODOS EXISTENTES MODIFICADOS ============





  actualizarTiposPago() {
    switch (this.metodoPagoSeleccionado) {
      case 'VES':
        this.tiposPago = ['Pago Movil / Transferencia'];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
        break;
      case '$':
        this.tiposPago = ['Transferencia / Zelle'];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
        break;
      case '€':
        this.tiposPago = ['Cuenta Custodia'];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
        break;
      default:
        this.tiposPago = [];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
    }
  }


  //BUSCA CUENTAS DE BANCO
  cargarCuentas() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();

    const apiUrl = `${API_URLINTER}portalcli/buscabanco`;

    const headers = new HttpHeaders({
      'X-Auth-Token': `${token}`
    });

    formData.append('fpago', this.metodoPagoSeleccionado);
    formData.append('tpago', this.tipoPagoSeleccionado);

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.cuentas = response.data;
        } else {
          console.error('Error al cargar cuentas:', response);
          this.cuentas = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error de la API:', error);
        this.cuentas = [];
      },
    });
  }

  //METODO DE PAGO
  seleccionarMetodoPago(metodo: string) {
    this.resetearCampos();
    this.metodoPagoSeleccionado = metodo;
    this.actualizarTiposPago();
  }

  seleccionarTipoPago(tipo: string) {
    if (this.tipoPagoSeleccionado === tipo) {
      this.tipoPagoSeleccionado = ''; 
    } else {
      this.tipoPagoSeleccionado = tipo;
    }

    if (this.tipoPagoSeleccionado === 'Pago Movil / Transferencia' && this.metodoPagoSeleccionado === 'VES') {
      this.mostrarSelectorCuenta = true;
      this.cargarCuentas();
    }else if(this.metodoPagoSeleccionado === '$'){
      this.mostrarSelectorCuenta = true;
      this.cargarCuentas();
    } else {
      this.mostrarSelectorCuenta = false;
      this.cuentaSeleccionada = null;
    }
  }
fechaAnterior: any = null; // Guardará la fecha antes del cambio
  seleccionarFecha(fechaSeleccionada: string) {
      if (!fechaSeleccionada) return; 

      // Solo reseteamos si ya había una fecha guardada y es diferente a la nueva
    if (this.fechaAnterior && this.fechaAnterior !== fechaSeleccionada) {
        this.selectedRowsMap = {};
        //this.cuentaSeleccionada = null;
        this.identificacion = '';
        this.numeroReferencia = '';
        this.comprobante = null;
        this.monto = 0;
        this.montoACancelar=0;
        this.saldoDisponible = 0;
        this.saldoDisponibled = 0;
        this.montoSeleccionado=0;
        this.montoPagado=0;
        this.montoPagadod=0;
    }

    // Actualizamos la fecha anterior para el próximo cambio
    this.fechaAnterior = fechaSeleccionada;

      this.fetchPagos();
  }

    seleccionarCuenta(event: any) {
    if (event && event.value) {
      this.cuentaSeleccionada = this.cuentas.find(cuenta => cuenta.codbanc == event.value);
    } else {
      this.cuentaSeleccionada = null;
    }
  }


  resetearCampos() {
    this.selectedRowsMap = {};
    this.tipoPagoSeleccionado = '';
    this.cuentaSeleccionada = null;
    this.identificacion = '';
    this.fechaTransferencia = '';
    this.numeroReferencia = '';
    this.comprobante = null;
    this.monto = 0;
    this.metodoPagoSeleccionado = '';
    this.saldoDisponible = 0;
    this.saldoDisponibled = 0;

    this.montoACancelar=0;
    this.montoSeleccionado=0;
    this.montoPagado=0;
    this.montoPagadod=0;

  }

  copiarAlPortapapeles(texto: string) {
    const elementoTemporal = document.createElement('textarea');
    elementoTemporal.value = texto;
    document.body.appendChild(elementoTemporal);
    elementoTemporal.select();
    document.execCommand('copy');
    document.body.removeChild(elementoTemporal);
    Swal.fire({
      text: 'Texto copiado al portapapeles',
      icon: 'success',
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      position: 'bottom-end',
    });
  }

  applyFilters(event: any) {
    this.isLoading = true;
    this.search = event.target.value;
    this.currentPage = 1;
    this.fetchPagos();
  }

  //Cambio de pagina
  pageChanged(event: PageEvent) {
    if (this.showSelectedOnly) {
      // No hacemos nada si estamos mostrando solo seleccionados
      return;
    }
    
    this.isLoading = true;
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.fetchPagos();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.fetchPagos();
  }

  //Ordenamiendo de columnas
  sortData(sort: Sort) {
    this.sortColumn = sort.active;
    this.sortDirection = sort.direction;
    if (!sort.active || sort.direction === '') {
      this.fetchPagos();
      return;
    }

    this.sortColumn = sort.active;
    this.sortDirection = sort.direction;
    this.fetchPagos();
  }


  //TRAE LAS CUENTAS POR PAGAR
  fetchPagos() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    const apiUrl = `${API_URLINTER}portalcli/facturaspago`;

    const headers = new HttpHeaders({
      'X-Auth-Token': `${token}`
    });

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const length = this.itemsPerPage;

    formData.append('start', start.toString());
    formData.append('length', length.toString());
    formData.append('codCli', codCli ?? '');
    formData.append('search', this.search ?? '');
    formData.append('sortColumn', this.sortColumn);
    formData.append('sortDirection', this.sortDirection);

    if (this.fechaTransferencia) {
      // Creamos una fecha local para evitar problemas de zona horaria
      const d = new Date(this.fechaTransferencia);
      const anio = d.getFullYear();
      const mes = ('0' + (d.getMonth() + 1)).slice(-2);
      const dia = ('0' + d.getDate()).slice(-2);
      
      const fechaParaEnviar = `${anio}${mes}${dia}`; // Resultado: "20260317"
      formData.append('fechapago', fechaParaEnviar);
    }

    //formData.append('fechapago', this.fechaTransferencia);

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.allPagos = response.data;
        this.totalPages = Math.ceil(parseInt(response.recordsTotal) / this.itemsPerPage);
        this.deudaTotalAbsoluta = response.deudaTotalReal || 0;
        this.updatePagedPagos();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error de la API:', error);
      },
    });
  }
  

  //Selector de todas las filas
 /*  selectAll(event: MatCheckboxChange) {
    this.allPagos.forEach(row => {
      // Solo seleccionar las que tienen retención
      if (this.noTieneRetencion(row)) {
        return;
      }
      
      const rowId = this.getRowId(row);
      
      if (event.checked) {
        // Convertir a números y asegurar valores válidos
        const saldo = Number(row.saldo) || 0;
        const saldod = Number(row.saldod) || 0;
        const difc = Number(row.difc) || 0;
        const ppago = Number(row.ppago) || 0;
        const montoInicial = saldo + difc -ppago;
        const montoInicialD = saldod;

        this.selectedRowsMap[rowId] = {
          selected: true,
          data: {
            tipo_doc: row.tipo_doc,
            numero: row.numero,
            emision: row.emision,
            entregado: row.entregado,
            vence: row.vence,
            dias: row.dias,
            monto: row.monto,
            impuesto: row.impuesto,
            reteiva: row.reteiva,
            saldo: row.saldo || 0,
            ppago: row.ppago || 0,
            difc: row.difc || 0,
            cdolar: row.cdolar,
            monto_dolar: row.monto / row.cdolar,
            saldo_dolar: (row.saldo - (row.preabono || 0)) / row.cdolar,
            preabono: row.preabono || 0,
            mfactura: row.mfactura,
            estado_retencion: row.estado_retencion,
            disponible_para_retencion: row.disponible_para_retencion,
            puede_seleccionar: row.puede_seleccionar,
            nrocomp_aprobado: row.nrocomp_aprobado,
            nrocomp_proceso: row.nrocomp_proceso
          },
          montoAPagar: montoInicial,
          montoAPagarD: montoInicialD,
          montoTotalSeleccionado: montoInicial,
          montoTotalSeleccionadoD: montoInicialD,
        };
      } else {
        if (this.selectedRowsMap[rowId]) {
          this.selectedRowsMap[rowId].selected = false;
        }
      }
    });
    
    this.updatePagedPagos();
    this.actualizarMonto();
  }
 */

  saveSelected() {
    const selectedRows = Object.keys(this.selectedRowsMap)
      .filter(key => this.selectedRowsMap[key]);
  }

  //Guarda al momento de seleccionar fila
  getRowId(row: any): string {
    return `${row.tipo_doc}-${row.numero}`;
  }

  //CUANDO SELECCIONAMOS UNA FILA
  toggleRowSelection(row: any): void {
    // Validar si tiene retención cargada
    if (this.noTieneRetencion(row)) {
      this.mostrarAlertaSinRetencion(row);
      // Revertir el cambio del checkbox
      row.selected = !row.selected;
      return;
    }
    const rowId = this.getRowId(row);
    //console.log('desde el toggle '+this.saldoDisponible)

    if(this.montoPagado>0){
      if(this.metodoPagoSeleccionado=='VES'){
        if (this.saldoDisponible <= 0 && !this.selectedRowsMap[rowId]?.selected) {
          Swal.fire('Atención', 'No hay saldo disponible para agregar más facturas', 'warning');
          return;
        }
      }else{
        if (this.saldoDisponibled <= 0 && !this.selectedRowsMap[rowId]?.selected) {
          Swal.fire('Atención', 'No hay saldo disponible para agregar más facturas', 'warning');
          return;
        }
      }

    }

    if (!this.selectedRowsMap[rowId]) {
      const aplicarDifc = this.metodoPagoSeleccionado !== '$' && !this.ndpendiActivo;
      const saldo = Number(row.saldo) || 0;
      const ppago = Number(row.ppago) || 0;
      const difc = aplicarDifc ? (Number(row.difc) || 0) : 0;
      const montoMaximo = parseFloat((saldo + difc - ppago).toFixed(2));
      
      this.selectedRowsMap[rowId] = {
        selected: false,
        data: {
            tipo_doc: row.tipo_doc,
            numero: row.numero,
            emision: row.emision,
            entregado: row.entregado,
            vence: row.vence,
            dias: row.dias,
            monto: row.monto,
            impuesto: row.impuesto,
            reteiva: row.reteiva,
            saldo: row.saldo || 0,
            ppago: row.ppago || 0,
            difc: row.difc || 0,
            cdolar: row.cdolar,
            monto_dolar: row.monto / row.cdolar,
            saldo_dolar: (row.saldo - (row.preabono || 0)) / row.cdolar,
            preabono: row.preabono || 0,
            mfactura: row.mfactura,
            estado_retencion: row.estado_retencion,
            disponible_para_retencion: row.disponible_para_retencion,
            puede_seleccionar: row.puede_seleccionar,
            nrocomp_aprobado: row.nrocomp_aprobado,
            nrocomp_proceso: row.nrocomp_proceso
          },
        montoAPagar: 0,
        montoAPagarD: 0,
        montoTotalSeleccionado: 0,
        montoTotalSeleccionadoD: 0
      };
    }
  
    const factura = this.selectedRowsMap[rowId];
    
    if (!factura.selected) {
      const aplicarDifc = this.metodoPagoSeleccionado !== '$' && !this.ndpendiActivo;
      const saldo = Number(factura.data.saldo) || 0;
      const saldod = Number(factura.data.saldo_dolar) || 0;
      const ppago = Number(factura.data.ppago) || 0;
      const difc = aplicarDifc ? (Number(factura.data.difc) || 0) : 0;
      const montoMaximo = parseFloat((saldo + difc - ppago).toFixed(2));
      const montoMaximoD = parseFloat((saldod).toFixed(2));

      const montoAPagar = parseFloat((Math.min(montoMaximo, this.saldoDisponible)).toFixed(2));
      const montoAPagarD = parseFloat((Math.min(montoMaximoD, this.saldoDisponibled)).toFixed(2));
      
      factura.selected = true;
      factura.montoAPagar = montoAPagar;
      factura.montoAPagarD = montoAPagarD;
      factura.montoTotalSeleccionado = montoMaximo;
      factura.montoTotalSeleccionadoD = montoMaximoD;
      this.saldoDisponible = parseFloat((this.saldoDisponible - montoAPagar).toFixed(2));
      this.saldoDisponibled = parseFloat((this.saldoDisponibled - montoAPagarD).toFixed(2));
    } else {
      this.saldoDisponible = parseFloat((this.saldoDisponible + Number(factura.montoAPagar || 0)).toFixed(2));
      this.saldoDisponibled = parseFloat((this.saldoDisponibled + Number(factura.montoAPagarD || 0)).toFixed(2));

      factura.selected = false;
      factura.montoAPagar = 0;
      factura.montoAPagarD = 0;
    }

    
    this.updatePagedPagos();
    //this.actualizarFacturasACancelar();
    this.actualizarMonto();
  }

  // Verifica si la factura está pagada completamente
  isFacturaPagadaCompleta(key: string): boolean {
    const aplicarDifc = this.metodoPagoSeleccionado !== '$' && !this.ndpendiActivo;

    const factura = this.selectedRowsMap[key];
    const saldo = Number(factura.data.saldo) || 0;
    const difc = aplicarDifc ? (Number(factura.data.difc) || 0) : 0;
    const ppago = Number(factura.data.ppago) || 0;
    const totalFactura = saldo + difc-ppago;
    const montoAPagar = Number(factura.montoAPagar) || 0;
    
    return montoAPagar >= totalFactura - 0.01; // Margen de 0.01 por redondeo
  }

  // Calcula el porcentaje pagado de la factura
  getPorcentajePagado(key: string): number {
    const aplicarDifc = this.metodoPagoSeleccionado !== '$' && !this.ndpendiActivo;
    const factura = this.selectedRowsMap[key];
    const saldo = Number(factura.data.saldo) || 0;
    const difc = aplicarDifc ? (Number(factura.data.difc) || 0) : 0;
    const ppago = Number(factura.data.ppago) || 0;
    const totalFactura = saldo + difc-ppago;
    const montoAPagar = Number(factura.montoAPagar) || 0;
    
    if (totalFactura <= 0) return 100;
    return Math.min(100, Math.round((montoAPagar / totalFactura) * 100));
  }

    getSelectedKeys(): string[] {
      return Object.keys(this.selectedRowsMap).filter(key => this.selectedRowsMap[key].selected);
    }
    
    // Validar el monto de una factura específica
    /* validarMontoFactura(key: string): void {
      const aplicarDifc = this.metodoPagoSeleccionado !== '$';
      const factura = this.selectedRowsMap[key];
      const difc = aplicarDifc ? (Number(factura.data.difc) || 0) : 0;

      const maxMonto = factura.data.saldo + difc - factura.data.ppago;
      factura.montoAPagar = parseFloat(factura.montoAPagar.toFixed(2));
      if (factura.montoAPagar! > maxMonto) {
        factura.montoAPagar = maxMonto;
        Swal.fire({
          title: 'Atención',
          text: `No puede pagar más de ${maxMonto.toFixed(2)} por esta factura`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      }
      
      if (factura.montoAPagar! <= 0) {
        factura.montoAPagar = 0.01;
      }
      
      this.actualizarMonto();
    } */

  //CAMBIA DE PAGINA
  updatePagedPagos() {
    this.pagedPagos = this.allPagos.map(row => {
      const rowId = this.getRowId(row);
      return {
        ...row,
        selected: this.selectedRowsMap[rowId]?.selected || false
      };
    });
    this.filterSelectedRows();
  }

  //Muestra solo las facturas seleccionadas con el chulito
  toggleShowSelectedOnly(event: MatCheckboxChange) {
    this.isLoading = true;
    this.showSelectedOnly = event.checked;
    
    if (this.showSelectedOnly) {
      this.currentPage = 1; // Resetear a la primera página
    }
    
    this.filterSelectedRows();
    this.isLoading = false;
  }

  //Filtra las filas seleccionadas
  filterSelectedRows() {
    if (this.showSelectedOnly) {
      // Mostrar solo las filas seleccionadas con todos sus campos
      this.pagedPagos = Object.keys(this.selectedRowsMap)
        .filter(key => this.selectedRowsMap[key]?.selected)
        .map(key => {
          const factura = this.selectedRowsMap[key];
          return {
            ...factura.data,
            selected: true
          };
        });
    } else {
      // Mostrar todas las filas con paginación normal
      this.pagedPagos = this.allPagos.map(row => {
        const rowId = this.getRowId(row);
        return {
          ...row,
          selected: this.selectedRowsMap[rowId]?.selected || false
        };
      });
    }
    
    this.updateSelectedCount();
    this.actualizarFacturasACancelar();
    this.actualizarMonto();
  }

  updateSelectedCount() {
    this.selectedCount = Object.keys(this.selectedRowsMap)
      .filter(key => this.selectedRowsMap[key]?.selected).length;
  }


  // Actualizar el campo de texto aquí
  actualizarFacturasACancelar() {
    const facturas = Object.keys(this.selectedRowsMap)
      .filter(key => this.selectedRowsMap[key]?.selected)
      .map(key => key.replace('-', ''));
    this.facturasACancelar = 'PAGA: ' + facturas.join(', ');
  }
  montoAPagar: number = 0;

  // Este método para validar el monto
  validarMontoAPagar() {
    const maxMonto = this.metodoPagoSeleccionado === 'VES' ? this.montoACancelar : this.montoACancelard;
    
    if (this.montoAPagar > maxMonto) {
      this.montoAPagar = maxMonto;
      Swal.fire({
        title: 'Atención',
        text: `No puede cancelar más de ${maxMonto.toFixed(2)} ${this.metodoPagoSeleccionado === 'VES' ? 'Bs' : '$'}`,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
    
    if (this.montoAPagar <= 0) {
      this.montoAPagar = 0.01;
    }
  }

  formatearMonto(monto: number): string {
    return monto.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  soloNumeros(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const key = event.key;
    if (
      (charCode < 48 || charCode > 57) &&
      key !== '.' &&
      key !== 'Backspace' &&
      key !== 'Tab' &&
      key !== 'Delete' &&
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'Home' &&
      key !== 'End'
    ) {
      event.preventDefault();
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
  }

  soloNumerosMonto(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    const key = event.key;
    if (
      (charCode < 48 || charCode > 57) &&
      key !== '.' &&
      key !== 'Backspace' &&
      key !== 'Tab' &&
      key !== 'Delete' &&
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'Home' &&
      key !== 'End'
    ) {
      event.preventDefault();
    }
  }

comprobanteFile: File | null = null;
comprobanteNombre: string = '';
comprobanteError: string = '';
maxFileSize = 5 * 1024 * 1024;
allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

//importa el comprobante del pago
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    
    // Validar tipo de archivo
    if (!this.allowedTypes.includes(file.type)) {
      this.comprobanteError = 'Formato de archivo no permitido';
      this.comprobanteFile = null;
      this.comprobanteNombre = '';
      return;
    }
    
    // Validar tamaño
    if (file.size > this.maxFileSize) {
      this.comprobanteError = 'El archivo excede el tamaño máximo de 5MB';
      this.comprobanteFile = null;
      this.comprobanteNombre = '';
      return;
    }
    
    // Si pasa las validaciones
    this.comprobanteError = '';
    this.comprobanteFile = file;
    this.comprobanteNombre = file.name;
  }
}

//ENVIA PAGO
  async enviapago() {
    this.isLoading = true; 
    const codCli = this.authService.getCodCli();
  
    // Validar datos obligatorios
    if (!this.numeroReferencia || !this.montoACancelar || !this.cuentaSeleccionada ) {
      Swal.fire('Error', 'Por favor complete todos los campos obligatorios', 'error');
      this.isLoading = false;
      return;
    }
    //const saldoReal = this.saldoDisponible;
    const saldoReal = parseFloat(this.saldoDisponible.toFixed(6));

    if (saldoReal > 0 && saldoReal<this.montoPagado ) {
      //console.log('Saldo real: '+saldoReal);
      //console.log('Monto pagado: '+this.montoPagado);
      Swal.fire('Error', 'Saldo debe aplicarse por completo.', 'error');
      this.isLoading = false;
      return;
    }
  
  
    // Validar archivo si es requerido
    if (this.cuentaSeleccionada && !this.archivoComprobante) {
      Swal.fire('Error', 'Debe adjuntar el comprobante de pago', 'error');
      this.isLoading = false;
      return;
    }
  
    // Obtener facturas seleccionadas
    const facturasSeleccionadas = Object.keys(this.selectedRowsMap)
      .filter(key => this.selectedRowsMap[key]?.selected)
      .map(key => {
        const facturaData = this.selectedRowsMap[key].data;
        const montoAPagar = this.selectedRowsMap[key].montoAPagar ?? (facturaData.saldo + facturaData.difc);
        
        return {
          ...facturaData,
          montoAPagar: montoAPagar
        };
      });
  
    if (facturasSeleccionadas.length === 0) {
      Swal.fire('Error', 'Debe seleccionar al menos una factura', 'error');
      this.isLoading = false;
      return;
    }
  
    // Mostrar confirmación
    const confirmResult = await this.mostrarConfirmacionPago(facturasSeleccionadas);
    if (!confirmResult.isConfirmed) {
      this.isLoading = false;
      return;
    }
  
    // Registrar el pago primero
    const resultadoPago = await this.registrarPago(facturasSeleccionadas, codCli);
    
    if (resultadoPago?.success && this.archivoComprobante) {
      // Si el pago se registró correctamente y hay archivo, enviarlo
      await this.enviarComprobante(resultadoPago.idPago);
    }
  
    this.isLoading = false;
  }
  
  // Función para mostrar la confirmación del pago
  private async mostrarConfirmacionPago(facturasSeleccionadas: any[]): Promise<any> {
    // 1. Definimos el símbolo explícitamente según tu lógica
    const simboloMoneda = this.metodoPagoSeleccionado === 'VES' ? 'Bs ' : '$ ';
    
    // 2. Usamos montoACancelar (que es el que usas en el resto del componente)
    // Forzamos el formato 'es-VE' para asegurar que el separador de miles sea punto y decimal coma, 
    // o 'en-US' si prefieres lo contrario, pero FIJO para todos los navegadores.
    const totalFormateado = simboloMoneda + this.montoACancelar.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const detallesFacturas = facturasSeleccionadas.map(f => {
      // CORRECCIÓN ERROR UNDEFINED: Usamos montoAPagar que es el nombre 
      // que asignaste en el método enviapago
      const montoIndividual = f.montoAPagar || 0;
      const montoFormateado = simboloMoneda + montoIndividual.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      return `
        <div class="d-flex justify-content-between border-bottom pb-1 mb-1">
          <span>${f.tipo_doc}-${f.numero}</span>
          <span>${montoFormateado}</span>
        </div>
      `;
    }).join('');

    return await Swal.fire({
      // Título más directo y profesional
      title: 'Confirmación de Pago',
      html: `
        <div class="text-left">
          <p class="mb-2">Por favor, verifique que el monto coincida exactamente con su comprobante:</p>
          <p style="font-size: 1.4rem;">Total a Reportar: <strong>${totalFormateado}</strong></p>
          <hr>
          <p><strong>Detalle de Facturas (${facturasSeleccionadas.length}):</strong></p>
          <div class="mt-2" style="max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${detallesFacturas}
          </div>
        </div>
      `,
      icon: 'info', // 'info' suele verse más limpio para confirmaciones de datos
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1a237e', // Color azul institucional (similar al de BDV/Banesco)
      cancelButtonColor: '#d33'
    });
  }
  
  // Función para registrar el pago (sin el archivo)
  /*private async registrarPago(facturasSeleccionadas: any[], codCli: string | null): Promise<any> {
    const formData = new FormData();
    const token = this.authService.getToken();
  
    // Datos generales del pago
    formData.append('codCli', codCli ?? '');
    formData.append('descripcion', this.facturasACancelar);
    formData.append('referencia', this.numeroReferencia);
    formData.append('monto', this.montoACancelar.toString());
    formData.append('montod', this.montoACancelard.toString());

    
    // Datos del banco si existe cuenta seleccionada
    if (this.cuentaSeleccionada) {
      formData.append('codigo_banco', this.cuentaSeleccionada.codbanc);
      formData.append('banco', this.cuentaSeleccionada.banco);
      formData.append('cuenta', this.cuentaSeleccionada.numcuent);
    }
  
    // Tipo de pago y moneda
    //formData.append('fbanco', this.fechaTransferencia);
    if (this.fechaTransferencia) {
      // Creamos una fecha local para evitar problemas de zona horaria
      const d = new Date(this.fechaTransferencia);
      const anio = d.getFullYear();
      const mes = ('0' + (d.getMonth() + 1)).slice(-2);
      const dia = ('0' + d.getDate()).slice(-2);
      
      const fechaParaEnviar = `${anio}${mes}${dia}`; // Resultado: "20260317"
      formData.append('fbanco', fechaParaEnviar);
    }
    //formData.append('fbanco', this.fechaTransferencia.replace(/-/g, ''));
    formData.append('tipo_pago', this.tipoPagoSeleccionado);
    formData.append('moneda', this.metodoPagoSeleccionado);
    // Agregar el detalle de cada factura
    facturasSeleccionadas.forEach((factura, index) => {
      formData.append(`facturas[${index}][tipo_doc]`, factura.tipo_doc);
      formData.append(`facturas[${index}][numero]`, factura.numero);
      formData.append(`facturas[${index}][monto]`, factura.monto.toString());
      //formData.append(`facturas[${index}][abono]`, factura.montoAPagar.toString());
      formData.append(`facturas[${index}][abono]`, (factura.saldo + (this.ndpendiActivo ? 0 : (factura.difc || 0))));
    formData.append(`facturas[${index}][ppago]`, factura.ppago?.toString() || '0');
    formData.append(`facturas[${index}][difc]`, factura.difc?.toString() || '0');
      formData.append(`facturas[${index}][cdolar]`, factura.cdolar?.toString() || '1');
      formData.append(`facturas[${index}][preabono]`, factura.preabono?.toString() || '0');
    });

    const headers = new HttpHeaders({
      'X-Auth-Token': `${token}`
    });
    
    try {
      Swal.showLoading();
      const response: any = await this.http.post(`${API_URLINTER}portalcli/enviapago`, formData, { headers }).toPromise();
      
      if (response?.status) {
        const resumenPago = `
          <p>${response.mensaje}</p>
          <div class="mt-3 text-left">
            <p><strong>Referencia:</strong> ${this.numeroReferencia}</p>
            <p><strong>Total pagado:</strong> ${this.metodoPagoSeleccionado === 'VES' ? 'Bs ' : '$ '}${this.montoAPagar.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
          </div>
        `;
        
        Swal.fire({
          title: 'Pago registrado',
          html: resumenPago,
          icon: 'success'
        });
        this.pagedPagos=[];
        //this.fetchPagos();
        
        return { success: true, idPago: response.idPago };
      } else {
        Swal.fire('Error', response?.mensaje || 'Ocurrió un error al procesar el pago', 'error');
        return { success: false };
      }
    } catch (error) {
      console.error('Error de la API:', error);
      Swal.fire('Error', 'Ocurrió un error al enviar el pago', 'error');
      return { success: false };
    }
  }*/

    private async registrarPago(facturasSeleccionadas: any[], codCli: string | null): Promise<any> {
  const formData = new FormData();
  const token = this.authService.getToken();

  // Datos generales del pago
  formData.append('codCli', codCli ?? '');
  formData.append('descripcion', this.facturasACancelar);
  formData.append('referencia', this.numeroReferencia);
  formData.append('monto', this.montoACancelar.toString());
  formData.append('montod', this.montoACancelard.toString());

  // Datos del banco si existe cuenta seleccionada
  if (this.cuentaSeleccionada) {
    formData.append('codigo_banco', this.cuentaSeleccionada.codbanc);
    formData.append('banco', this.cuentaSeleccionada.banco);
    formData.append('cuenta', this.cuentaSeleccionada.numcuent);
  }

  // Tipo de pago y moneda
  if (this.fechaTransferencia) {
    const d = new Date(this.fechaTransferencia);
    const anio = d.getFullYear();
    const mes = ('0' + (d.getMonth() + 1)).slice(-2);
    const dia = ('0' + d.getDate()).slice(-2);
    
    const fechaParaEnviar = `${anio}${mes}${dia}`; 
    formData.append('fbanco', fechaParaEnviar);
  }
  
  formData.append('tipo_pago', this.tipoPagoSeleccionado);
  formData.append('moneda', this.metodoPagoSeleccionado);
  
  // Agregar el detalle de cada factura
  facturasSeleccionadas.forEach((factura, index) => {
    formData.append(`facturas[${index}][tipo_doc]`, factura.tipo_doc);
    formData.append(`facturas[${index}][numero]`, factura.numero);
    formData.append(`facturas[${index}][monto]`, factura.monto.toString());
    formData.append(`facturas[${index}][abono]`, (factura.saldo + factura.difc));
    formData.append(`facturas[${index}][ppago]`, factura.ppago?.toString());
    formData.append(`facturas[${index}][difc]`, factura.difc?.toString());
    formData.append(`facturas[${index}][cdolar]`, factura.cdolar?.toString() || '1');
    formData.append(`facturas[${index}][preabono]`, factura.preabono?.toString());
  });

  const headers = new HttpHeaders({
    'X-Auth-Token': `${token}`
  });
  
  try {
    // ==========================================
    // NUEVA VALIDACIÓN: Revisar gestión interna
    // ==========================================
    Swal.showLoading(); // Mostramos loading desde ya para que la experiencia sea fluida
    
    // Cambia 'portalcli/revisagestion' por la ruta real que le des en tus rutas de CodeIgniter
    const checkGestion: any = await this.http.post(`${API_URLINTER}portalcli/revisagestion`, formData, { headers }).toPromise();

    if (!checkGestion || checkGestion.status === false) {
      let detalleFacturas = '';
      // Validamos con .data que es donde viaja la lista de facturas retenidas
      if (checkGestion.data && checkGestion.data.length > 0) {
        detalleFacturas = '<br><small class="text-danger">Facturas afectadas: ' + 
          checkGestion.data.map((f: any) => `${f.tipo_doc}-${f.numero}`).join(', ') + 
          '</small>';
      }

      Swal.fire({
        title: 'Acción Bloqueada',
        html: `Una o más de las facturas seleccionadas presentan una <strong>gestión interna en la droguería</strong> y no pueden ser pagadas en este momento. ${detalleFacturas}`,
        icon: 'warning'
      });
      return { success: false };
    }
    // ==========================================

    // Si pasa la validación, procedemos a registrar el pago normalmente
    // Nota: El loading se mantiene abierto o se refresca implícitamente aquí
    const response: any = await this.http.post(`${API_URLINTER}portalcli/enviapago`, formData, { headers }).toPromise();
    
    if (response?.status) {
      const resumenPago = `
        <p>${response.mensaje}</p>
        <div class="mt-3 text-left">
          <p><strong>Referencia:</strong> ${this.numeroReferencia}</p>
          <p><strong>Total pagado:</strong> ${this.metodoPagoSeleccionado === 'VES' ? 'Bs ' : '$ '}${this.montoAPagar.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
        </div>
      `;
      
      Swal.fire({
        title: 'Pago registrado',
        html: resumenPago,
        icon: 'success'
      });
      this.pagedPagos = [];
      
      return { success: true, idPago: response.idPago };
    } else {
      Swal.fire('Error', response?.mensaje || 'Ocurrió un error al procesar el pago', 'error');
      return { success: false };
    }
  } catch (error) {
    console.error('Error de la API:', error);
    Swal.fire('Error', 'Ocurrió un error al procesar la solicitud', 'error');
    return { success: false };
  }
}

  
archivoComprobante: File | null = null;

handleFileUpload(event: any) {
  const file = event.target.files[0];
  
  // Validaciones
  if (!file) {
    this.archivoComprobante = null;
    return;
  }

  // Validar tamaño (5MB)
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire('Error', 'El archivo no debe exceder los 5MB', 'error');
    event.target.value = ''; // Limpiar input
    this.archivoComprobante = null;
    return;
  }

  // Validar tipo de archivo
  const validExtensions = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!validExtensions.includes(file.type)) {
    Swal.fire('Error', 'Formato de archivo no válido. Use JPG, PNG o PDF', 'error');
    event.target.value = ''; // Limpiar input
    this.archivoComprobante = null;
    return;
  }

  // Si pasa las validaciones, almacenar el archivo
  this.archivoComprobante = file;
  Swal.fire('Éxito', 'Archivo cargado correctamente', 'success');
}

private async enviarComprobante(idPago: string): Promise<void> {
  if (!this.archivoComprobante) return;

  const formData = new FormData();
  const token = this.authService.getToken();

  formData.append('comprobante', this.archivoComprobante);
  formData.append('idPago', idPago);
    
  const headers = new HttpHeaders({
    'X-Auth-Token': `${token}`
  });
  
  
  try {
    const response: any = await this.http.post(`${API_URLINTER}portalcli/guardar_comprobante`, formData, { headers }).toPromise();
    if (response?.success) {
      Swal.fire('Éxito', 'Comprobante subido correctamente', 'success');
      //Al terminar de cargar el pago
      this.resetearCampos();
    } else {
      Swal.fire('Advertencia', 'El pago se registró pero hubo un error al subir el comprobante', 'warning');
    }
  } catch (error) {
    console.error('Error al subir comprobante:', error);
    Swal.fire('Advertencia', 'El pago se registró pero hubo un error al subir el comprobante', 'warning');
  }
}

//LOGICA PARA DISTRIBUIR EL MONTO TRANSFERIDO POR EL CLIENTE

// Actualiza cuando cambia el monto pagado
 actualizarSaldoDisponible(): void {
  /* if (this.montoPagado <= 0 ) {
    this.montoPagado = 0.01;
  }
  if (this.montoPagadod <= 0) {
    this.montoPagadod = 0.01;
  } */
  // Resetear todo al cambiar el monto principal
  this.montoOriginalPagado = this.montoPagado;
  this.montoOriginalPagadod = this.montoPagadod;

  this.saldoDisponible = this.montoPagado;
  this.saldoDisponibled = this.montoPagadod;

  // Limpiar selecciones existentes
  /* Object.keys(this.selectedRowsMap).forEach(key => {
    this.selectedRowsMap[key].selected = false;
    this.selectedRowsMap[key].montoAPagar = 0;
  });
   */
  this.updatePagedPagos();
  this.distribuirSaldoAFacturas();
  //this.actualizarFacturasACancelar();
} 

distribuirSaldoAFacturas(): void {
  this.saldoDisponible = this.montoOriginalPagado;
    this.saldoDisponibled = this.montoOriginalPagadod;

  // Primero, resetear todos los montos a pagar
  Object.keys(this.selectedRowsMap).forEach(key => {
    if (this.selectedRowsMap[key].selected) {
      this.selectedRowsMap[key].montoAPagar = 0;
    }
  });
  
  // Luego, distribuir el saldo
  Object.keys(this.selectedRowsMap).forEach(key => {
    if(this.metodoPagoSeleccionado=='VES'){
      if (this.selectedRowsMap[key].selected && this.saldoDisponible > 0) {
        const factura = this.selectedRowsMap[key].data;
        const difc = this.ndpendiActivo ? 0 : (Number(factura.difc) || 0);
        const montoMaximo = factura.saldo + difc - factura.ppago;
        const montoAPagar = Math.min(montoMaximo, this.saldoDisponible);
        
        this.selectedRowsMap[key].montoAPagar = montoAPagar;
        this.saldoDisponible -= montoAPagar;
      }
    }else{
      if (this.selectedRowsMap[key].selected && this.saldoDisponibled > 0) {
        const factura = this.selectedRowsMap[key].data;
        const montoMaximo = factura.saldo_dolar;
        const montoAPagar = Math.min(montoMaximo, this.saldoDisponibled);
        
        this.selectedRowsMap[key].montoAPagar = montoAPagar;
        this.saldoDisponibled -= montoAPagar;
      }
    }

  });
  
  this.actualizarMonto();
}

  getMontoTotalFactura(key: string): number {
    const factura = this.selectedRowsMap[key];
    if (!factura) return 0;
    const saldo = Number(factura.data.saldo) || 0;
    const difc = this.ndpendiActivo ? 0 : (Number(factura.data.difc) || 0);
    const ppago = Number(factura.data.ppago) || 0;
    return saldo + difc - ppago;
  }

  //ACTUALIZA EL MONTO EN BASE A LAS FILAS SELECCIONADAS
  actualizarMonto(): void {
    let totalMonto = 0;
    let totalMontod = 0;
    let totalMontoSeleccionado = 0;
    let totalMontoSeleccionadod = 0;
    
    Object.keys(this.selectedRowsMap).forEach(key => {
      if (!this.selectedRowsMap[key]?.selected) return;
      
      const factura = this.selectedRowsMap[key];
      const monto = parseFloat((factura.montoAPagar || 0).toFixed(2)); 
      const montod = this.metodoPagoSeleccionado === '$' ? parseFloat((monto / factura.data.cdolar).toFixed(2)) : 0;      
      
      const monto2 = this.metodoPagoSeleccionado === 'VES' ? parseFloat((factura.montoTotalSeleccionado || 0).toFixed(2)) : parseFloat((factura.data.monto / factura.data.cdolar).toFixed(2));      

      const monto2d = this.metodoPagoSeleccionado === '$' ? parseFloat((factura.data.saldo / factura.data.cdolar).toFixed(2)) : 0;     
      totalMonto += monto;
      totalMontod += montod;
      totalMontoSeleccionado += monto2;
      totalMontoSeleccionadod += monto2d;
    });
    
    this.montoACancelar = parseFloat(totalMonto.toFixed(2));
    this.montoACancelard = parseFloat(totalMontod.toFixed(2));
    this.montoSeleccionado = parseFloat(totalMontoSeleccionado.toFixed(2));
    this.montoSeleccionadod = parseFloat(totalMontoSeleccionadod.toFixed(2));
    // Validación de consistencia
    /* if (totalMonto > this.montoOriginalPagado) {
      console.error('Error: El monto aplicado excede el saldo original');
    }

    if (totalMontod > this.montoOriginalPagadod) {
      console.error('Error: El monto aplicado excede el saldo original');
    } */
   //console.log('actualizaMonto')
  }

}