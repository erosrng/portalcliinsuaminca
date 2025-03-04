import { Component } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: 'app-carrito-page',
  imports: [NavBarComponent, FooterComponent],
  templateUrl: './carrito-page.component.html',
  styleUrl: './carrito-page.component.scss'
})
export class CarritoPageComponent {

}
