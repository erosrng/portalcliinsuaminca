import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { API_URL } from './../../app.config';
import { FormsModule } from '@angular/forms';

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
  montoAplicar: number = 0;
  
  // Variables para múltiples retenciones
  retencionesSeleccionadas: Retencion[] = [];
  totalSeleccionado: number = 0;
  
  // Filtros
  searchTerm: string = '';
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.fetchRetenciones();
  }

  // Método para cambiar entre pestañas
  cambiarTab(tab: 'individual' | 'multiple') {
    this.activeTab = tab;
    this.limpiarSelecciones();
  }

  // Limpiar selecciones al cambiar de tab
  limpiarSelecciones() {
    this.retencionSeleccionada = null;
    this.montoAplicar = 0;
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

    const apiUrl = `${API_URL}portalcli/retenpendi`;

    const headers = new HttpHeaders({
      'X-Auth-Token': `${token}`
    });

    formData.append('codCli', codCli ?? '');

    this.http.post<{status: boolean, data: Retencion[], recordsTotal: number}>(apiUrl, formData, { headers: headers }).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.retenciones = response.data;
          this.retenciones.forEach(r => r.selected = false);
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
    this.montoAplicar = parseFloat(retencion.saldo) || 0;
    
    // Limpiar selección múltiple
    this.retenciones.forEach(r => {
      if (r.id !== retencion.id) r.selected = false;
    });
  }

  // Métodos para múltiples retenciones
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
    
    // Limpiar selección individual si se usa múltiple
    if (this.retencionesSeleccionadas.length > 0) {
      this.retencionSeleccionada = null;
    }
  }

  calcularTotalSeleccionado() {
    this.totalSeleccionado = this.retencionesSeleccionadas.reduce((total, retencion) => {
      return total + (parseFloat(retencion.saldo) || 0);
    }, 0);
  }

  seleccionarTodo() {
    this.retenciones.forEach(retencion => {
      retencion.selected = true;
    });
    this.retencionesSeleccionadas = [...this.retenciones];
    this.calcularTotalSeleccionado();
    this.retencionSeleccionada = null;
  }

  deseleccionarTodo() {
    this.retenciones.forEach(retencion => {
      retencion.selected = false;
    });
    this.retencionesSeleccionadas = [];
    this.totalSeleccionado = 0;
  }

  // Aplicar retenciones
  aplicarRetencionIndividual() {
    if (!this.retencionSeleccionada) return;
    
    // Lógica para aplicar retención individual
    console.log('Aplicando retención individual:', this.retencionSeleccionada);
    console.log('Monto a aplicar:', this.montoAplicar);
    
    // Aquí iría la llamada a la API para aplicar la retención
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

    return filtradas;
  }

  // Formatear montos
  formatCurrency(value: string): string {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  // Obtener clase según estado
  getEstadoClase(retencion: Retencion): string {
    const saldo = parseFloat(retencion.saldo);
    if (saldo <= 0) return 'estado-pagado';
    if (saldo < parseFloat(retencion.monto) * 0.5) return 'estado-parcial';
    return 'estado-pendiente';
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }
  
}