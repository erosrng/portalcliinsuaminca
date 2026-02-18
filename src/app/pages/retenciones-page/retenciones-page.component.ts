import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { API_URL } from './../../app.config';
import { API_URLINTER } from './../../app.config';

import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { Subscription } from 'rxjs';

interface Retencion {
  id: string;
  cod_cli: string;
  nombre: string;
  tipo: string;
  vend: string;
  fecha: string;
  numero: string;
  transac: string;
  monto: string;
  impuesto: string;
  rt: string;
  abonos: string;
  saldo: string;
  rtaplicada: string;
  ndoc: string | null;
  reiva: string | null;
  grupoe: string;
  rtsi: string;
  selected?: boolean;
  estado_retencion?: string;  
  ndoc_web?: string;  
  reiva_web?: string;  
  fecha_web?: string;      
  operacion_web?: string; 
}

@Component({
  selector: 'app-retenciones-page',
  imports: [CommonModule, NavBarComponent, SideBarComponent, FooterComponent, FormsModule],
  templateUrl: './retenciones-page.component.html',
  styleUrl: './retenciones-page.component.scss'
})
export class RetencionesPageComponent implements OnInit {
  isLoading = false;
  retenciones: Retencion[] = [];
  
  // Variables para pestañas
  activeTab: 'individual' | 'multiple' = 'individual';
  
  // Variables para retención individual
  retencionSeleccionada: Retencion | null = null;
  comprobanteFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadError: string | null = null;
  isDragging = false;
  numeroComprobante: string = '';
  comprobanteError: string | null = null;
  
  // Variables para múltiples retenciones
  retencionesSeleccionadas: Retencion[] = [];
  totalSeleccionado: number = 0;
  
  // Filtros
  searchTerm: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  
  // Variables para paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  startItem: number = 0;
  endItem: number = 0;
  
  // Variables para ordenación
  currentSort: string = 'fecha';
  sortDirection: 'asc' | 'desc' = 'desc';

    private subscriptions: Subscription[] = []; 
  private clienteSubscription: Subscription = new Subscription();
    public clienteData: any = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) { }

  ngOnInit() {
    this.fetchRetenciones();

    this.clienteSubscription = this.portalcliLogicaService.clienteData$.subscribe(
      (cliente) => {
        this.clienteData = cliente;
        
        // Si necesitas hacer algo cuando cambia el cliente
        if (Object.keys(this.clienteData).length > 0) {
          this.fetchRetenciones(); 
        }
      }
    );
  }

  // Método para cambiar entre pestañas
  cambiarTab(tab: 'individual' | 'multiple') {
    this.activeTab = tab;
    this.limpiarSelecciones();
    this.currentPage = 1; // Resetear a primera página
  }

  // Limpiar selecciones al cambiar de tab
  limpiarSelecciones() {
    this.retencionSeleccionada = null;
    this.comprobanteFile = null;
    this.uploadError = null;
    this.uploadProgress = 0;
    this.retencionesSeleccionadas = [];
    this.totalSeleccionado = 0;
    
    // Resetear selección en todas las retenciones
    this.retenciones.forEach(r => r.selected = false);
  }
  
    // Obtener retenciones pendientes
    fetchRetenciones() {
      this.isLoading = true;
      const formData = new FormData();
      const token = this.authService.getToken();
      const codCli = this.authService.getCodCli();
  
      const apiUrl = `${API_URLINTER}portalcli/retenpendi`;
  
      const headers = new HttpHeaders({
        'X-Auth-Token': `${token}`
      });
  
      formData.append('codCli', codCli ?? '');
  
      this.http.post<{status: boolean, data: Retencion[], recordsTotal: number}>(apiUrl, formData, { headers: headers }).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            this.retenciones = response.data;
            this.retenciones.forEach(r => r.selected = false);
            this.applyFilters();
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error de la API:', error);
        },
      });
    }

  // Métodos para retención individual
  seleccionarRetencionIndividual(retencion: Retencion) {
    this.retencionSeleccionada = retencion;
    this.comprobanteFile = null; // Resetear archivo al seleccionar nueva retención
    this.uploadError = null;
    
    // Limpiar selección múltiple
    this.retenciones.forEach(r => {
      if (r.id !== retencion.id) r.selected = false;
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer?.files.length) {
      this.validateAndSetFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  validateAndSetFile(file: File) {
    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      this.uploadError = 'Solo se permiten archivos PDF';
      return;
    }
    
    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.uploadError = 'El archivo es demasiado grande. Tamaño máximo: 5MB';
      return;
    }
    
    // Limpiar errores anteriores
    this.uploadError = null;
    
    // Establecer archivo
    this.comprobanteFile = file;
  }

  removeComprobante(event: Event) {
    event.stopPropagation();
    this.comprobanteFile = null;
    this.uploadError = null;
  }

  cancelarRetencion() {
    this.retencionSeleccionada = null;
    this.comprobanteFile = null;
    this.uploadError = null;
  }

  // Cargar retención a la API
  cargarRetencion() {
      // Validar número de comprobante
      if (!this.numeroComprobante || this.numeroComprobante.trim() === '') {
          this.comprobanteError = 'El número de comprobante es obligatorio';
          return;
      }
      
      // Validar formato (solo números y letras)
      if (!/^[A-Z0-9-\/]+$/.test(this.numeroComprobante)) {
          this.comprobanteError = 'Solo se permiten letras, números y guiones';
          return;
      }
      
      // Validar retención y PDF
      if (!this.retencionSeleccionada || !this.comprobanteFile) {
          this.uploadError = 'Debe seleccionar una retención y un comprobante PDF';
          return;
      }
      
      this.isUploading = true;
      this.uploadProgress = 0;
      this.uploadError = null;
      this.comprobanteError = null;

      const formData = new FormData();
      const token = this.authService.getToken();
      const codCli = this.authService.getCodCli();
      
      // Agregar datos de la retención
      formData.append('cod_cli', codCli ?? '');
      formData.append('transac', this.retencionSeleccionada.transac);
      formData.append('fecha', this.retencionSeleccionada.fecha);
      formData.append('tipo', this.retencionSeleccionada.tipo);
      formData.append('numero', this.retencionSeleccionada.numero);
      formData.append('monto', this.retencionSeleccionada.rt);
      formData.append('nrocomp', this.numeroComprobante.trim());

      // Agregar archivo PDF
      formData.append('comprobante', this.comprobanteFile, this.comprobanteFile.name);
      
      // Configurar headers
      const headers = new HttpHeaders({
          'X-Auth-Token': `${token}`
      });
      
      // URL de la API para crear retención
      const apiUrl = `${API_URLINTER}portalcli/crear_retencion`;
      
      // Enviar a la API
      this.http.post<any>(apiUrl, formData, { 
          headers: headers,
          reportProgress: true,
          observe: 'events'
      }).subscribe({
          next: (event: any) => {
              if (event.type === 1) {
                  if (event.total) {
                      this.uploadProgress = Math.round((100 * event.loaded) / event.total);
                  }
              } else if (event.type === 4) {
                  if (event.body.status) {
                      this.handleSuccessResponse(event.body);
                  } else {
                      this.handleErrorResponse(event.body);
                  }
              }
          },
          error: (error) => {
              this.isUploading = false;
              this.uploadError = 'Error al conectar con el servidor. Intente nuevamente.';
              console.error('Error de la API:', error);
          }
      });
  }

  onComprobanteInput() {
    this.comprobanteError = null;
  }

  handleSuccessResponse(response: any) {
    this.isUploading = false;
    this.uploadProgress = 100;
    
    // Mostrar mensaje de éxito
    Swal.fire({
      text: '¡Retención cargada exitosamente!',
      icon: 'success',
      showConfirmButton: false,
      timer: 3000,
      toast: true,
      position: 'bottom-end',
    });
    
    // Limpiar selección
    this.retencionSeleccionada = null;
    this.comprobanteFile = null;
    
    // Actualizar lista de retenciones
    this.fetchRetenciones();
  }

  handleErrorResponse(response: any) {
    this.isUploading = false;
    this.uploadError = response.message || 'Error al cargar la retención. Verifique los datos.';
  }

  // Métodos para múltiples retenciones (simplificados)
  toggleSeleccionMultiple(retencion: Retencion) {
    retencion.selected = !retencion.selected;
    
    if (retencion.selected) {
      this.retencionesSeleccionadas.push(retencion);
    } else {
      const index = this.retencionesSeleccionadas.findIndex(r => r.id === retencion.id);
      if (index > -1) {
        this.retencionesSeleccionadas.splice(index, 1);
      }
    }
    
    this.calcularTotalSeleccionado();
  }

  calcularTotalSeleccionado() {
    this.totalSeleccionado = this.retencionesSeleccionadas.reduce((total, retencion) => {
      return total + (parseFloat(retencion.rt) || 0);
    }, 0);
  }

  seleccionarTodo() {
    this.retenciones.forEach(retencion => {
      retencion.selected = true;
    });
    this.retencionesSeleccionadas = [...this.retenciones];
    this.calcularTotalSeleccionado();
  }

  deseleccionarTodo() {
    this.retenciones.forEach(retencion => {
      retencion.selected = false;
    });
    this.retencionesSeleccionadas = [];
    this.totalSeleccionado = 0;
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Formatear fechas
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  // Formatear montos
  formatCurrency(value: string): string {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Obtener clase según estado
  getEstadoClase(retencion: any): string {
      const estado = retencion.estado_retencion || '';
      
      switch(estado.toLowerCase()) {
          case 'aprobada':
              return 'estado-aprobada';
          case 'en proceso':
              return 'estado-proceso';
          case 'procesada (web)':
              return 'estado-procesada';
          default:
              return 'estado-pendiente';
      }
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }
  ////////////


  // Aplicar retenciones
  aplicarRetencionIndividual() {
    if (!this.retencionSeleccionada) return;
    
    // Lógica para aplicar retención individual
    console.log('Aplicando retención individual:', this.retencionSeleccionada);
  }

  aplicarMultiplesRetenciones() {
    if (this.retencionesSeleccionadas.length === 0) return;
    
    // Lógica para aplicar múltiples retenciones
    console.log('Aplicando múltiples retenciones:', this.retencionesSeleccionadas);
    console.log('Total a aplicar:', this.totalSeleccionado);
    
    // Aquí iría la llamada a la API para aplicar las retenciones
  }

  // Filtros
  get retencionesFiltradas(): Retencion[] {
    let filtradas = this.retenciones;

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtradas = filtradas.filter(r =>
        r.nombre.toLowerCase().includes(term) ||
        r.numero.includes(term) ||
        r.tipo.toLowerCase().includes(term)
      );
    }

    // Filtro por fecha
    if (this.filtroFechaDesde) {
      filtradas = filtradas.filter(r => r.fecha >= this.filtroFechaDesde);
    }

    if (this.filtroFechaHasta) {
      filtradas = filtradas.filter(r => r.fecha <= this.filtroFechaHasta);
    }

    // Ordenar
    return this.sortRetenciones(filtradas);
  }

  // Paginación
  get paginatedRetenciones(): Retencion[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    // Calcular rangos para mostrar
    this.startItem = startIndex + 1;
    this.endItem = Math.min(endIndex, this.retencionesFiltradas.length);
    
    return this.retencionesFiltradas.slice(startIndex, endIndex);
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.retencionesFiltradas.length / this.itemsPerPage);
    
    // Asegurar que currentPage no sea mayor que totalPages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  changePageSize() {
    this.currentPage = 1;
    this.updatePagination();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    
    if (this.totalPages <= 7) {
      // Mostrar todas las páginas
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con elipsis
      if (this.currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 3) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }

  // Ordenación
  sortBy(column: string) {
    if (this.currentSort === column) {
      // Cambiar dirección si es la misma columna
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nueva columna, ordenar ascendente por defecto
      this.currentSort = column;
      this.sortDirection = 'asc';
    }
    
    this.currentPage = 1; // Volver a primera página al ordenar
  }

  sortRetenciones(retenciones: Retencion[]): Retencion[] {
    return retenciones.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (this.currentSort) {
        case 'numero':
          valueA = a.numero;
          valueB = b.numero;
          break;
        case 'fecha':
          valueA = new Date(a.fecha);
          valueB = new Date(b.fecha);
          break;
        case 'rt':
          valueA = parseFloat(a.rt);
          valueB = parseFloat(b.rt);
          break;

        default:
          valueA = new Date(a.fecha);
          valueB = new Date(b.fecha);
      }
      
      if (this.sortDirection === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  }

  // Funciones para filtros
  applyFilters() {
    this.currentPage = 1;
    this.updatePagination();
  }

  onSearchChange() {
    // Puedes agregar un debounce aquí para evitar múltiples llamadas
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.applyFilters();
  }
  
}