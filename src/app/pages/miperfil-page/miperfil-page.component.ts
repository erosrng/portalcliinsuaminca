import { Component } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";

@Component({
  selector: 'app-miperfil-page',
  imports: [NavBarComponent, FooterComponent],
  templateUrl: './miperfil-page.component.html',
  styleUrl: './miperfil-page.component.scss'
})
export class MiperfilPageComponent {

}
