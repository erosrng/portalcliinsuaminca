import { CommonModule } from '@angular/common';
import {Component, Input} from '@angular/core';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { AuthService } from './../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URLINTER } from '../../app.config';


@Component({
  selector: 'app-clicard',
  imports: [CommonModule],
  templateUrl: './clicard.component.html',
  styleUrl: './clicard.component.scss'
})
export class ClicardComponent {
  tasa: number=0;
  @Input() minimal: boolean = false;
    saldocli: number=0;
    public clienteData: any = {};

  constructor(
    public authService: AuthService, 
    public portalcliLogicaService: PortalcliLogicaService,
    private http: HttpClient
  ) { 
    this.tasa = this.authService.getTasa(); 
  }


  ngOnInit() {
    this.portalcliLogicaService.clienteData$.subscribe((clienteData) => {
      this.tasa = this.authService.getTasa();
      clienteData = clienteData || {};
      this.clienteData = clienteData;
          this.traesaldo();

    });
  }


  formatCurrency(value: number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '0.00'; // O algún valor predeterminado
    }
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return numericValue.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  traesaldo() {
      const formData = new FormData();
      const token = this.authService.getToken();
  
      const headers = new HttpHeaders({
        'X-Auth-Token': `${token}`
      });
      const apiUrl = `${API_URLINTER}portalcli/traesaldo`;
  
      formData.append('codCli', this.authService.getCodCli() ?? '');
  
      this.http.post(apiUrl, formData, { headers: headers }).subscribe({
        next: (response: any) => {
          //console.log('entre')
          this.saldocli = this.clienteData.limite - response.datcli;
        },
        error: (error) => {
          console.error('Error de la API:', error);
        },
      });
    }

}
