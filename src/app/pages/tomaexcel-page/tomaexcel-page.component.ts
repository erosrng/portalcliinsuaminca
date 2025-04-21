import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild  } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";

import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { AuthService } from './../../auth.service';
import { API_URL } from './../../app.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { HistorialpedComponent } from "../../components/historialped/historialped.component";


@Component({
  selector: 'app-tomaexcel-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    HistorialpedComponent
],
  templateUrl: './tomaexcel-page.component.html',
  styleUrl: './tomaexcel-page.component.scss'
})
export class TomaexcelPageComponent {
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService,
      private route: Router,
      private http: HttpClient,
  ) {}

  jsonData: any;
  fileName: string = '';
  habilitarCargar: boolean = false; 
  private subscriptions: Subscription[] = []; 
  

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

  cargarArchivo(): void {
    this.loading = true;
  
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
        this.loading = false;
      });
    } else {
      console.error('No hay datos para cargar');
      this.loading = false;
    }
  }

  bajaexcel() {
    this.loading = true;
    //const codCli = localStorage.getItem(`idcli_${usuario}`);
    const formData = new FormData();
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/traesegme`;
  
    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        window.location.href = `http://186.167.69.10:50080/generador/${response.archivo}`;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error de la API:', error);
      },
    });
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
      })
    );
  }

}
