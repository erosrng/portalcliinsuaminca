import { Component } from '@angular/core';
import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';

@Component({
  selector: 'app-nav-bar',
  imports: [],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = true;

  constructor(
    private authService: AuthService, 
    public portalcliLogicaService: PortalcliLogicaService
  ) {} 

  ngOnInit() { // Implementa ngOnInit
    this.userData = this.authService.getUserData();
  }

  toggleMenu() {
    this.portalcliLogicaService.toggleMenu();
  }

  navigateTo(route: string) {
    this.portalcliLogicaService.navigateTo(route);
  }
}
