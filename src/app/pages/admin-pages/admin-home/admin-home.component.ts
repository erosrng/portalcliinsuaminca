import { Component, ViewChild, OnInit } from '@angular/core';
import { NavBarComponent } from "../../../components/nav-bar/nav-bar.component";
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { map, Observable } from 'rxjs';
import { AuthService } from './../../../auth.service';
import { API_URL } from './../../../app.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  NgApexchartsModule
} from "ng-apexcharts";
import { CommonModule } from '@angular/common';
import { HistorialpedComponent } from "../../../components/historialped/historialped.component";
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from "../../../components/footer/footer.component";
import { FormControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SideBarAdminComponent } from "../../../components/side-bar-admin/side-bar-admin.component";
import { SideBarComponent } from "../../../components/side-bar/side-bar.component";

interface Vendedor {
  us_codigo: string;
  us_nombre: string;
  proveed: string;
  usuariopadre: string;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
};
@Component({
  selector: 'app-admin-home',
  imports: [
    NavBarComponent,
    MatSidenav,
    MatSidenavModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    HistorialpedComponent,
    MatIconModule,
    FooterComponent,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SideBarAdminComponent,
    SideBarComponent
],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss'
})
export class AdminHomeComponent implements OnInit { // Implementa OnInit
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;
  toggleMenu = false;
  toppings = new FormControl('');
  // Eliminamos la propiedad estática vededores
  selectedValue: string = '';
  vendedores: Vendedor[] = [];
  isLoadingVendedores: boolean = false;
  selectedVendedor: Vendedor | null = null;

  constructor(
    public authService: AuthService,
    public http: HttpClient
  ) {

    this.chartOptions = {
      series: [
        {
          name: "My-series",
          data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
        }
      ],
      chart: {
        height: 350,
        type: "bar"
      },
      title: {
        text: "Ventas por vendedor"
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]
      }
    };
  }

  ngOnInit() {
    this.obtenerVendedores().subscribe();
  }

  obtenerVendedores(): Observable<void> {
    this.isLoadingVendedores = true;
    const formData = new FormData();
    const token = this.authService.getToken();
    const apiUrl = `${API_URL}vendedoresportal`;
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    return this.http.post<{ data: Vendedor[], result: boolean, mensaje: string }>(apiUrl, formData, { headers: headers }).pipe(
      map(response => {
        if (response.result) {
          this.vendedores = response.data;
        } else {
          console.error('Error al cargar vendedores:', response);
          this.vendedores = [];
        }
        this.isLoadingVendedores = false;
      })
    );
  }

  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }
}