import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AuthService } from './../../auth.service';
import { API_URLINTER } from './../../app.config';
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial-pagos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, SideBarComponent, NavBarComponent, FooterComponent
  ],
  templateUrl: './historial-pagos.component.html',
  styleUrls: ['./historial-pagos.component.scss'] // Usaremos SCSS para igualar pedidos
})
export class HistorialPagosComponent implements OnInit {
  public isLoading: boolean = false;
  public fechaFiltro: Date | null = null;
  
  // Columnas para el historial de pagos
  displayedColumns: string[] = ['idgecli','fecha', 'referencia', 'descripcion', 'monto', 'status'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, public authService: AuthService) {}

  ngOnInit(): void {
    this.fetchHistorial();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  fetchHistorial() {
    this.isLoading = true;
    Swal.fire({ title: 'Cargando historial...', didOpen: () => { Swal.showLoading(); }});

    const formData = new FormData();
    const token = this.authService.getToken();
    const codCli = this.authService.getCodCli();
    const headers = new HttpHeaders({ 'X-Auth-Token': `${token}` });

    formData.append('codCli', codCli ?? '');
    
    if (this.fechaFiltro) {
      const d = this.fechaFiltro;
      const fechaEnvio = `${d.getFullYear()}${('0' + (d.getMonth() + 1)).slice(-2)}${('0' + d.getDate()).slice(-2)}`;
      formData.append('fecha', fechaEnvio);
    }
    formData.append('sortColumn', this.sort?.active || 'fecha');
    formData.append('sortDirection', this.sort?.direction || 'desc');

    this.http.post<any>(`${API_URLINTER}portalcli/historial_pagos`, formData, { headers })
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data || [];
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.isLoading = false;
          Swal.close();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error:', error);
          Swal.fire('Error', 'No se pudo obtener el historial', 'error');
        }
      });
  }

  formatearMonto(monto: any) {
    return parseFloat(monto).toLocaleString('es-VE', { minimumFractionDigits: 2 });
  }
}