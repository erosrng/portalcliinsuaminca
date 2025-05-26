import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
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
  standalone: true, // Asegúrate de que está marcado como standalone si lo estás usando así
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    HistorialpedComponent
  ],
  templateUrl: './tomaexcel-page.component.html',
  styleUrl: './tomaexcel-page.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class TomaexcelPageComponent implements OnInit, OnDestroy { 

  loading: boolean = false;
  jsonData: any;
  fileName: string | null = null; 
  showErrorHighlight: boolean = false;
  productosEnCarritoNumber: string = '0'; 
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService,
    private route: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.revisarCarrito();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];

    this.showErrorHighlight = false;

    if (file) {
      if (file.name.endsWith('.xlsx')) {
        this.fileName = file.name;
        const reader: FileReader = new FileReader();
        Swal.showLoading();

        reader.onload = (e: any) => {
          const binarystr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(binarystr, { type: 'binary' });
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];
          this.jsonData = XLSX.utils.sheet_to_json(ws);
          Swal.close();
          Swal.fire({
            text: 'Presione "Cargar Archivo" para procesar el pedido.',
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
            text: 'Por favor, seleccione un archivo .xlsx.',
            icon: 'error',
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            position: 'bottom-end',
        });
        this.fileName = null;
        this.jsonData = null;
        event.target.value = ''; 
      }
    } else {
      Swal.fire({
        text: 'Por favor, seleccione un archivo .xlsx.',
        icon: 'error',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        position: 'bottom-end',
      });
      this.fileName = null;
      this.jsonData = null;
    }
  }

  async cargarArchivo(): Promise<void> { 
    Swal.showLoading();

    if (this.fileName && this.jsonData && this.jsonData.length > 0) {
      const codigosvacios: any[][] = [];
      const promises: Promise<any>[] = [];

      for (const fila of this.jsonData) {
        const celdas = Object.values(fila);
        const canaexcel: number = Number(celdas[11]); 

        if (!isNaN(canaexcel) && canaexcel > 0) {
          let codigoProducto: string = String(celdas[0]);
          codigoProducto = codigoProducto.trim().replace(/[^a-zA-Z0-9]/g, '');
        console.log(codigoProducto)
          promises.push(
            this.portalcliLogicaService.agregarAlCarrito({ codigo: codigoProducto }, canaexcel)
              .toPromise()
              .then((response: any) => {
                if (response.status) {
                } else {
                  codigosvacios.push(celdas); 
                  //console.error(`Error al agregar el producto ${codigoProducto} al carrito:`, response);
                }
              })
              .catch((error) => {
                codigosvacios.push(celdas);
                //console.error(`Error de red/API al agregar el producto ${codigoProducto} al carrito:`, error);
              })
          );
        }
      }

      await Promise.all(promises);
      Swal.close();
      if (codigosvacios.length > 0) {
        let contenidoAlerta = '';
        codigosvacios.forEach((fila) => {
          const descripcion = fila[2] || 'Descripción no disponible'; 
          const codigo = fila[0] || 'Código no disponible';
          contenidoAlerta += `- **${descripcion}** (Código: ${codigo})<br>`;
        });

        Swal.fire({
          title: 'Productos No Cargados',
          html: `Los siguientes productos no pudieron cargarse por motivos de existencia, o fueron cargados previamente<br><br>${contenidoAlerta}`,
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
          title: 'Carga Completa',
          text: 'Todos los productos del archivo fueron procesados y agregados al carrito.',
          icon: 'success',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          position: 'bottom-end',
        });
      }

      this.revisarCarrito(); // Actualiza el conteo del carrito
      this.fileName = null; // Limpia el nombre del archivo después de procesar
      this.jsonData = null; // Limpia los datos del JSON
      this.loading = false;
    } else {
      console.error('No hay archivo seleccionado o datos para cargar.');
      this.showErrorHighlight = true; // Activa el resaltado si no hay datos para cargar
      Swal.fire({
        text: 'Baje el listado indicado y carguelo.',
        icon: 'error',
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        position: 'bottom-end',
      });
      this.loading = false;
    }
  }

  bajaexcel(): void { // Añadido tipo de retorno void
    this.loading = true;
    const formData = new FormData();
    const token = this.authService.getToken();

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const apiUrl = `${API_URL}portalcli/traesegme`; // Asegúrate que esta API realmente devuelve el archivo para descarga

    this.http.post(apiUrl, formData, { headers: headers, responseType: 'blob' as 'json' }).subscribe({ // Usa responseType: 'blob' si esperas un archivo
      next: (response: any) => {
        // Si el backend devuelve el archivo directamente como blob
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.download = `plantilla_descarga_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`; // Nombre de archivo sugerido
        a.click();
        window.URL.revokeObjectURL(url);
        this.loading = false;
        
        Swal.fire({
          text: 'Archivo de descarga generado correctamente.',
          icon: 'success',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          position: 'bottom-end',
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error de la API al descargar:', error);
        Swal.fire({
          text: 'Ocurrió un error al generar el archivo de descarga.',
          icon: 'error',
          showConfirmButton: false,
          timer: 3000,
          toast: true,
          position: 'bottom-end',
        });
      },
    });
  }

  revisarCarrito(): void { // Añadido tipo de retorno void
    this.portalcliLogicaService.revisarCarrito();
    // Limpia suscripciones antiguas antes de añadir una nueva para evitar duplicados
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.push(
      this.portalcliLogicaService.productosEnCarrito$.subscribe((productos) => {
        if (productos && productos.length > 0 && productos[0].value !== undefined && productos[0].value !== null) {
          this.productosEnCarritoNumber = productos[0].value.toString();
        } else {
          this.productosEnCarritoNumber = '0';
        }
      })
    );
  }
}