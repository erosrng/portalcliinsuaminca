import { Component, ViewChild } from '@angular/core';
import { NavBarComponent } from "../../../components/nav-bar/nav-bar.component";
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HistorialpedComponent } from "../../../components/historialped/historialped.component";
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from "../../../components/footer/footer.component";
import { FormControl } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SideBarAdminComponent } from "../../../components/side-bar-admin/side-bar-admin.component";


@Component({
  selector: 'app-admin-pedidos-vendedor',
  imports: [
    NavBarComponent,
    MatSidenav,
    MatSidenavModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HistorialpedComponent,
    MatIconModule,
    FooterComponent,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    SideBarAdminComponent
  ],
  templateUrl: './admin-pedidos-vendedor.component.html',
  styleUrl: './admin-pedidos-vendedor.component.scss'
})
export class AdminPedidosVendedorComponent {

  toggleMenu = false;
  toppings = new FormControl('');
  vededores: string[] = ['Vendedor 1', 'Vendedor 2', 'Vendedor 3', 'Vendedor 4', 'Vendedor 5', 'Vendedor 6'];
  selectedValue: string = '';

  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }

}
