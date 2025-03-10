import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";

import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-home-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent
],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {
  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = true;

  constructor(
    private authService: AuthService, 
    public portalcliLogicaService: PortalcliLogicaService,
    private router: Router
  ) {} 

  /* ngOnInit() { // Implementa ngOnInit
    const token = this.authService.getToken();
  }

  isMenuOpen: boolean = true;

  toggleMenu(){
    this.isMenuOpen = !this.isMenuOpen;
  } */

    ngOnInit() {
      // Obtener el token y los datos del usuario
      const token = this.authService.getToken();
      this.userData = this.authService.getUserData(); // Obtener los datos del usuario
  
      // Suscribirse al estado del menú desde el servicio
      this.portalcliLogicaService.isMenuOpen$.subscribe((isOpen: boolean) => {
        this.isMenuOpen = isOpen;
      });
    }

    navigateTo(route: string) {
      this.router.navigate([route]);
    }
}
