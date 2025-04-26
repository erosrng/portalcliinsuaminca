import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {MatSidenav, MatSidenavModule} from '@angular/material/sidenav';
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';
import { HistoricoPedidosModel } from '../../models/model';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-historial-pedidos',
  imports: [
    MatSidenav,
    MatSidenavModule,
    CommonModule,
    SideBarComponent,
    NavBarComponent,
    FooterComponent
],
  templateUrl: './historial-pedidos.component.html',
  styleUrl: './historial-pedidos.component.scss'
})
export class HistorialPedidosComponent implements OnInit {

  toggleMenu = false;
  historialPedidos: HistoricoPedidosModel[] = [];
  pedidoActivo: HistoricoPedidosModel | null = null;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    Swal.showLoading();
    const aux = localStorage.getItem('usuario')
    if (aux) {
      this.apiService.get_historial_by_user(aux).subscribe((data: HistoricoPedidosModel[]) => {
        console.log(data)
        Swal.close()
        this.historialPedidos = data;
      }, () => {
        Swal.close()
      })
    }
  
  }

  // Para hacer el toggle del menu 
  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }

  openDetail(pedido: HistoricoPedidosModel): void {
    this.pedidoActivo = pedido;
  }
}
