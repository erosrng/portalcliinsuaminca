import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URL } from './../../app.config';

@Component({
  selector: 'app-historialped',
  imports: [CommonModule],
  templateUrl: './historialped.component.html',
  styleUrl: './historialped.component.scss',
})
export class HistorialpedComponent {
  isLoading = false;

  constructor(private authService: AuthService, private http: HttpClient) {}

  historialPedidos: any[] = []; // Propiedad para almacenar los datos
  //detallesPedido: any[] = [];
  ngOnInit() {
    this.traeHistorial();
  }

  traeHistorial() {
    this.isLoading = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();

    formData.append('codCli', codCli ?? '');

    const headers = new HttpHeaders({
      Authorization: `${token}`,
    });
    const apiUrl = `${API_URL}portalcli/historialped`;

    this.http.post(apiUrl, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.data) {
          // Asigna los datos del historial a la propiedad
          this.historialPedidos = response.data;
        } else {
          console.error('Respuesta de la API sin datos:', response);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error de la API:', error);
      },
    });
  }



  showdetail(pedido: any) {
    if (pedido.detallesMostrados) {
      // Si la tabla ya está abierta, solo ciérrala
      pedido.detallesMostrados = false;
    } else {
      // Si la tabla está cerrada, haz la solicitud POST
      this.isLoading = true;
      const headers = new HttpHeaders({
        Authorization: `${this.authService.getToken()}`,
      });
      const apiUrl = `${API_URL}portalcli/detalle_pedido/${pedido.pedido}`;

      this.http.post(apiUrl, {}, { headers: headers }).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response && response.data && response.data.detalleped) {
            pedido.detalles = response.data.detalleped;
            pedido.detallesMostrados = true;
          } else {
            console.error('Respuesta de la API sin datos de detalleped:', response);
          }
        },
        error: (error) => {
          console.error('Error al obtener detalles del pedido:', error);
          this.isLoading = false;
        },
      });
    }
  }
}