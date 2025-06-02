import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// --- ¡Nuevas importaciones de Angular Material! ---
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { AuthService } from './../../auth.service';
import { API_URL } from './../../app.config';
import { URLSOLA } from './../../app.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-tomaexcel-page',
  standalone: true,
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule
],
  templateUrl: './tomaexcel-page.component.html',
  styleUrl: './tomaexcel-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TomaexcelPageComponent implements OnInit, OnDestroy {
  esgrupo: any;

  loading: boolean = false;
  // --- Mantenemos esta variable, ngModel se enlazará a ella ---
  tipoCarga: 'individual' | 'grupo' = 'individual'; 

  constructor(
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService,
    private route: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  jsonData: any;
  fileName: string = '';
  habilitarCargar: boolean = false; 
  private subscriptions: Subscription[] = []; 
  
  productosEnCarritoNumber: string = '';

  ngOnInit(): void {
    this.esgrupo = this.authService.getCmatriz();

    this.revisarCarrito();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.xlsx')) {
        this.fileName = file.name;
        const reader: FileReader = new FileReader();

        reader.onload = (e: any) => {
          const binarystr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(binarystr, { type: 'binary' });
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];

          this.jsonData = XLSX.utils.sheet_to_json(ws);
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

  cargarArchivo(): void {
    Swal.showLoading();    
    if (!this.jsonData || this.jsonData.length === 0) {
      Swal.fire({
        text: 'No hay datos de archivo para cargar. Por favor, seleccione un archivo .xlsx válido.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      this.loading = false;
      return;
    }

    const columnas = Object.keys(this.jsonData[0] || {});
    let i = 0;
    const filasFiltradas: any[][] = [];
    const codigosvacios: any[][] = [];
  
    if (this.jsonData  && this.jsonData.length > 0) {
      Swal.fire({
        title: 'Procesando archivo...',
        text: 'Agregando productos al carrito. Por favor, espere.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const promises: Promise<any>[] = this.jsonData.map((fila: any) => {
        const celdas = Object.values(fila);
        const canaexcel: number = Number(celdas[11]);
  
        if (!isNaN(canaexcel) && canaexcel > 0) {
          let codigoProducto: string = String(celdas[0]);
          codigoProducto = codigoProducto.trim().replace(/[^a-zA-Z0-9]/g, '');
  
          filasFiltradas.push(celdas);
  
          return this.portalcliLogicaService.agregarAlCarrito({ codigo: codigoProducto }, Number(celdas[11]),'').toPromise()
            .then((response: any) => {
              if (response.status) {
                i++;
                //console.log(`Producto ${codigoProducto} agregado al carrito. Respuesta:`, response);
              } else {
                codigosvacios.push(celdas);
                //console.error(`Error al agregar el producto ${codigoProducto} al carrito:`, response);
              }
            })
            .catch((error) => {
             // console.error(`Error al agregar el producto ${codigoProducto} al carrito:`, error);
            });
        }
        
        return Promise.resolve(celdas);
      });
  
      Promise.all(promises).then(() => {
        Swal.close();

        if (codigosvacios.length > 0) {
          console.log('Códigos vacíos:', codigosvacios);
  
          let contenidoAlerta = '';
          codigosvacios.forEach((fila) => {
            const codigo = fila[0]; 
            const descripcion = fila[2]; 
            contenidoAlerta += `- (${codigo})${descripcion}<br><br>`;
          });
  
          Swal.fire({
            title: 'Algunos productos no se cargaron',
            html: 'Los siguientes productos no se agregaron al carrito, posiblemente por falta de existencia o porque ya estan en el carrito:<br><br>' + contenidoAlerta,
            icon: 'warning',
            width: '600px',
            heightAuto: false,
            scrollbarPadding: false,
            customClass: {
              container: 'swal-container',
            },
            allowOutsideClick: false, 
            allowEscapeKey: false, 
          });          
  
        } else {
          Swal.fire({
            title: '¡Carga completa!',
            text: 'Todos los productos del archivo se agregaron correctamente al carrito.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });
        }
        this.loading = false;
        this.revisarCarrito();
        this.fileName = '';
        this.jsonData = null;
      }).catch(error => {
        Swal.close();
        Swal.fire('Error en la carga', 'Hubo un problema al procesar el archivo. Por favor, intente de nuevo.', 'error');
        this.loading = false;
        console.error('Error al procesar el archivo completo:', error);
      });
    } else {
      console.error('No hay datos para cargar');
      this.loading = false;
      Swal.fire({
        text: 'No hay datos de archivo para cargar. Por favor, seleccione un archivo .xlsx válido.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
  }

  bajaexcel() {
    Swal.showLoading();    
    const formData = new FormData();
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/traesegme`;
  
    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        Swal.close();
        window.location.href = `${URLSOLA}generador/${response.archivo}`;
      },
      error: (error) => {
        console.error('Error de la API:', error);
        Swal.fire('Error', 'No se pudo descargar el listado. Intente de nuevo.', 'error');
      },
    });
  }

  bajaexcelgrupo() {
    Swal.showLoading();    
    const formData = new FormData();
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/getfile`;
  
    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        Swal.close();
      },
      error: (error) => {
        console.error('Error de la API:', error);
        Swal.fire('Error', 'No se pudo descargar el listado. Intente de nuevo.', 'error');
      },
    });
  }


  revisarCarrito() {
    this.portalcliLogicaService.revisarCarrito();
    const sub = this.portalcliLogicaService.productosEnCarrito$.subscribe((productos) => {
      //if (productos && productos.length > 0 && productos[0].value !== undefined) {
        this.productosEnCarritoNumber = productos[0].value.toString();
        this.cdr.detectChanges();
      /* } else {
        this.productosEnCarritoNumber = '0';
      } */
    });
    this.subscriptions.push(sub);
  }

}