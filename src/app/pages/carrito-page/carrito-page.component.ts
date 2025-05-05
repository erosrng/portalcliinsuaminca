import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { Router } from '@angular/router';
import { Subscription, takeUntil, Subject } from 'rxjs';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { API_URL } from './../../app.config';

import { MatSort } from '@angular/material/sort';

import { MatPaginator, MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { CarshopComponent } from "../../components/carshop/carshop.component"; // Importa MatFormFieldModule
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: 'app-carrito-page',
  imports: [
    CommonModule,
    NavBarComponent,
    SideBarComponent,
    CarshopComponent,
    MatSidenav,
    MatSidenavModule,
    CommonModule,
    FooterComponent
  ],
  templateUrl: './carrito-page.component.html',
  styleUrl: './carrito-page.component.scss'
})

export class CarritoPageComponent implements OnInit, AfterViewInit {
  isLoading = false;

  sortField: string = 'descrip'; // Campo de ordenamiento inicial
  sortDirection: 'desc' | 'asc' = 'desc';
  private subscriptions: Subscription[] = [];
  private clienteCambiadoSubscription: Subscription | undefined;

  private destroy$ = new Subject<void>();
  clienteData: any;
  codCli: string | null = null;

  displayedColumns: string[] = ['img', 'descrip', 'preciosiniva', 'ivabs', 'preciod', 'ivad', 'totalbs', 'totald',
    'cant', 'descprov', 'actions']; // Ajusta las columnas según tus necesidades
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  totalBs: string = '';
  totalUsd: string = '';
  unidades: string = '';
  toggleMenu = false;

  constructor(
    private route: Router,
    private http: HttpClient,
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) { }

  ngOnInit() {
    this.codCli = this.authService.getCodCli();
    if (this.codCli) {
      this.subscribeToClienteData();
    }

  }

  ngAfterViewInit(): void {

  }

  subscribeToClienteData() {
    this.portalcliLogicaService.clienteData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.clienteData = data;
    });
  }

  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }

    navigateTo(route: string) {
    this.portalcliLogicaService.navigateTo(route);
  }


}