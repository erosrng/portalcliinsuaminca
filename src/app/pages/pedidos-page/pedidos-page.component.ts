import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: 'app-pedidos-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent
],
  templateUrl: './pedidos-page.component.html',
  styleUrl: './pedidos-page.component.scss'
})
export class PedidosPageComponent {

  products = [
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: true,
      precioDescuento: 0.5
    }, {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },
    {
      img: 'https://www.farmago.com.ve/wp-content/uploads/2020/12/imagen7-01-32.png',
      descripcion: 'PANTOPRAZOL 40MG 10 TAB LA SANTE',
      proveedor: 'LA SANTÉ',
      Lote: '24H1256',
      vence: '10-12-2028',
      bs: '60,00',
      usd: '1',
      cantidad: '284',
      descuento: false,
      precioDescuento: 0
    },


];

}
