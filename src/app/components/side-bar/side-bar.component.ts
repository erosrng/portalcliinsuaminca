import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-side-bar',
  imports: [CommonModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss'
})
export class SideBarComponent {
  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = true;

  constructor(
    private authService: AuthService, 
    public portalcliLogicaService: PortalcliLogicaService,
    private router: Router
  ) {} 

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
    this.portalcliLogicaService.navigateTo(route);
  }
}

