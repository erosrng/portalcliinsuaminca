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
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import Swal from 'sweetalert2';
import { ClicardComponent } from "../../components/clicard/clicard.component";

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
  selectedRowsMap: { [key: string]: boolean } = {};
  selectedCount = 0;
  allPagos: any[] = [];
  showSelectedOnly = false;
  facturasACancelar: string = '';
  montoACancelar: number = 0;

  @ViewChild(MatSort) sort: MatSort = new MatSort();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) { }

  ngOnInit() {
    this.fetchPagos();
  }

  metodoPagoSeleccionado: string = '';
  tiposPago: string[] = []; 
  mostrarSelectorCuenta: boolean = false;
  cuentaSeleccionada: any = null;
  cuentas: any[] = []; // Datos de cuentas desde la API
  tipoPagoSeleccionado: string = '';

  identificacion: string = '';
  fechaTransferencia: string = '';
  monto: number = 0;
  numeroReferencia: string = '';
  comprobante: any = null;

  sortColumn: string = 'numero'; // Columna de ordenamiento inicial
  sortDirection: string = 'asc';

  actualizarTiposPago() {
    switch (this.metodoPagoSeleccionado) {
      case 'VES':
        this.tiposPago = ['Transferencia'];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
        break;
      case '$':
        this.tiposPago = ['Efectivo', 'Zelle', 'Transferencia', 'Cuenta Custodia'];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
        break;
      case '€':
        this.tiposPago = ['Efectivo', 'Cuenta Custodia'];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
        break;
      default:
        this.tiposPago = [];
        this.mostrarSelectorCuenta = false;
        this.cuentaSeleccionada = null;
    }
  }


  cargarCuentas() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();

    const apiUrl = `${API_URL}portalcli/buscabanco`;

    const headers = new HttpHeaders({
      'Authorization': `${token}`
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
  seleccionarMetodoPago(metodo: string) {
    this.resetearCampos();
    this.metodoPagoSeleccionado = metodo;
    this.actualizarTiposPago();
  }

  seleccionarTipoPago(tipo: string) {
    if (this.tipoPagoSeleccionado === tipo) {
      this.tipoPagoSeleccionado = ''; // Deselecciona si se selecciona el mismo tipo
    } else {
      this.tipoPagoSeleccionado = tipo;
    }

    if (this.tipoPagoSeleccionado === 'Transferencia' && this.metodoPagoSeleccionado === 'VES') {
      this.mostrarSelectorCuenta = true;
      this.cargarCuentas();
    } else {
      this.mostrarSelectorCuenta = false;
      this.cuentaSeleccionada = null;
    }
  }

  seleccionarCuenta(event: any) {
    if (event && event.value) {
      this.cuentaSeleccionada = this.cuentas.find(cuenta => cuenta.codbanc == event.value);
      console.log('Cuenta seleccionada:', this.cuentaSeleccionada);
    } else {
      this.cuentaSeleccionada = null;
    }
  }

  resetearCampos() {
    this.tipoPagoSeleccionado = '';
    this.cuentaSeleccionada = null;
    this.identificacion = '';
    this.fechaTransferencia = '';
    this.numeroReferencia = '';
    this.comprobante = null;
    this.monto = 0;
    this.metodoPagoSeleccionado = '';
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

  pageChanged(event: PageEvent) {
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


  fetchPagos() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    const apiUrl = `${API_URL}portalcli/facturaspago`;

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const length = this.itemsPerPage;

    formData.append('start', start.toString());
    formData.append('length', length.toString());
    formData.append('codCli', codCli ?? '');
    formData.append('search', this.search ?? '');
    formData.append('sortColumn', this.sortColumn);
    formData.append('sortDirection', this.sortDirection);

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.allPagos = response.data;
        this.totalPages = Math.ceil(parseInt(response.recordsTotal) / this.itemsPerPage);
        this.updatePagedPagos();
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error de la API:', error);
      },
    });
  }

  updatePagedPagos() {
    this.pagedPagos = this.allPagos.map(row => ({
      ...row,
      selected: this.selectedRowsMap[this.getRowId(row)] || false
    }));
    this.filterSelectedRows();
    this.actualizarFacturasACancelar(); // Actualizar el campo de texto aquí
    this.actualizarMonto();
  }

  getRowId(row: any): string {
    return `${row.tipo_doc}-${row.numero}`;
  }

  //Selector de todas las filas
  selectAll(event: MatCheckboxChange) {
    this.allPagos.forEach(row => {
      const rowId = this.getRowId(row);
      this.selectedRowsMap[rowId] = event.checked;
    });
    this.updatePagedPagos();
  }

  saveSelected() {
    const selectedRows = Object.keys(this.selectedRowsMap)
      .filter(key => this.selectedRowsMap[key]);
    console.log(selectedRows);
  }

  toggleRowSelection(row: any) {
    const rowId = this.getRowId(row);
    this.selectedRowsMap[rowId] = !this.selectedRowsMap[rowId];
    this.updatePagedPagos();
  }

  updateSelectedCount() {
    this.selectedCount = Object.keys(this.selectedRowsMap)
      .filter(key => this.selectedRowsMap[key]).length;
  }

  filterSelectedRows() {
    if (this.showSelectedOnly) {
      this.pagedPagos = this.allPagos.filter(row => this.selectedRowsMap[this.getRowId(row)]).map(row => ({
        ...row,
        selected: this.selectedRowsMap[this.getRowId(row)] || false
      }));
    } else {
      this.pagedPagos = this.allPagos.map(row => ({
        ...row,
        selected: this.selectedRowsMap[this.getRowId(row)] || false
      }));
    }
    this.updateSelectedCount();
    this.actualizarFacturasACancelar(); 
  }

  toggleShowSelectedOnly(event: MatCheckboxChange) {
    this.isLoading = true;
    this.showSelectedOnly = event.checked;
    this.filterSelectedRows();
    this.isLoading = false;
  }

  // Actualizar el campo de texto aquí
  actualizarFacturasACancelar() {
    const facturas = Object.keys(this.selectedRowsMap)
      .filter(key => this.selectedRowsMap[key])
      .map(key => key.replace('-', ''));
    this.facturasACancelar = 'PAGA: ' + facturas.join(', ');
  }

  actualizarMonto() {
    let totalMonto = 0;
    this.pagedPagos.forEach(row => {
      if (this.selectedRowsMap[this.getRowId(row)]) {
        totalMonto += parseFloat(row.monto);
      }
    });
    this.montoACancelar = totalMonto;
  }
}