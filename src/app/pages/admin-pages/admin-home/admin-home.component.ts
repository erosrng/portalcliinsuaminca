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
import { ApiService } from '../../../services/api.service';
import { HistoricoPedidosModel } from '../../../models/model';
import Swal from 'sweetalert2';

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
  public ventasPorVendedor: Partial<ChartOptions> | any;
  public unidadesPorVendedor: Partial<ChartOptions> | any;
  toggleMenu = false;
  toppings = new FormControl('');
  // Eliminamos la propiedad estática vededores
  selectedValue: string = '';
  vendedores: Vendedor[] = [];
  isLoadingVendedores: boolean = false;
  selectedVendedor: Vendedor | null = null;
  pedidos: HistoricoPedidosModel[] | null = []
  totalPedidos = 0;
  totalUnidades = 0;
  totalValorDolar = 0;

  constructor(
    public authService: AuthService,
    public http: HttpClient,
    private apiService: ApiService
  ) {



  this.ventasPorVendedor = {
      series: [
        {
          name: "Ventas",
          data: []
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
        categories: []
      }
    };

  this.unidadesPorVendedor = {
    series: [
      {
        name: "Unidades",
        data: []
      }
    ],
    chart: {
      height: 350,
      type: "bar"
    },
    title: {
      text: "Ventas de unidades por vendedor"
    },
    xaxis: {
      categories: []
    }
  };
  }


  ngOnInit() {
    Swal.showLoading();
    this.obtenerVendedores().subscribe();
    const aux = localStorage.getItem('proveed')
    if (aux) {
      this.apiService.get_historial_by_prov(aux).subscribe((data: HistoricoPedidosModel[]) => {
        console.log(data);
        Swal.close();
      
        // 1) Calcular el total de pedidos procesados
        const totalPedidos = data.length;
        this.totalPedidos = totalPedidos
      
        // 2) Calcular el total de unidades
        const totalUnidades = data.reduce((sum, pedido) => sum + pedido.unidades, 0);
        this.totalUnidades = totalUnidades
       
      
        // 3) Calcular el total de valor en dólares
        const totalValorDolar = data.reduce((sum, pedido) => sum + pedido.valor_dolar, 0);
        this.totalValorDolar = totalValorDolar
       
      
        // Preparar datos para el gráfico de Ventas por Vendedor
        const ventasPorVendedorMap = new Map<string, number>();
        data.forEach(pedido => {
          ventasPorVendedorMap.set(pedido.usuario, (ventasPorVendedorMap.get(pedido.usuario) || 0) + 1);
        });
      
        this.ventasPorVendedor = {
          series: [
            {
              name: "Ventas",
              data: Array.from(ventasPorVendedorMap.values())
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
            categories: Array.from(ventasPorVendedorMap.keys())
          }
        };
      
        // Preparar datos para el gráfico de Unidades por Vendedor
        const unidadesPorVendedorMap = new Map<string, number>();
        data.forEach(pedido => {
          unidadesPorVendedorMap.set(pedido.usuario, (unidadesPorVendedorMap.get(pedido.usuario) || 0) + pedido.unidades);
        });
      
        this.unidadesPorVendedor = {
          series: [
            {
              name: "Unidades",
              data: Array.from(unidadesPorVendedorMap.values())
            }
          ],
          chart: {
            height: 350,
            type: "bar"
          },
          title: {
            text: "Ventas de unidades por vendedor"
          },
          xaxis: {
            categories: Array.from(unidadesPorVendedorMap.keys())
          }
        };
      }, () => {
        Swal.close();
      });
    }

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