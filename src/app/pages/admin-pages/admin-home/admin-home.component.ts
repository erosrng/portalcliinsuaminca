import { Component, ViewChild } from '@angular/core';
import { NavBarComponent } from "../../../components/nav-bar/nav-bar.component";
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
    SideBarAdminComponent
],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss'
})
export class AdminHomeComponent {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;
  toggleMenu = false;
  toppings = new FormControl('');
  vededores: string[] = ['Vendedor 1', 'Vendedor 2', 'Vendedor 3', 'Vendedor 4', 'Vendedor 5', 'Vendedor 6'];
  selectedValue: string = '';

  constructor() {
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



  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }

}
