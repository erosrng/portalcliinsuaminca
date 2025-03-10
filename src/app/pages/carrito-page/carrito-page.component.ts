import { Component } from '@angular/core';
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";

@Component({
  selector: 'app-carrito-page',
  imports: [
    NavBarComponent,
    SideBarComponent
  ],
  templateUrl: './carrito-page.component.html',
  styleUrl: './carrito-page.component.scss'
})
export class CarritoPageComponent {

}
