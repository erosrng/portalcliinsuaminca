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
  showPedidosDropdown: boolean = false;
  showReportesDropdown: boolean = false;
  transitionClass: string = 'menu__transition'; // Clase para la transición

  constructor(
    public authService: AuthService, 
    public portalcliLogicaService: PortalcliLogicaService,
    private router: Router
  ) {} 

  ngOnInit() {
    const token = this.authService.getToken();

    this.portalcliLogicaService.isMenuOpen$.subscribe((isOpen: boolean) => {
      this.isMenuOpen = isOpen;
    });
  }

  navigateTo(route: string) {
    this.portalcliLogicaService.navigateTo(route);
  }

  togglePedidosDropdown() {
    this.showPedidosDropdown = !this.showPedidosDropdown;
  }

  toggleReportesDropdown() {
    this.showReportesDropdown = !this.showReportesDropdown;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}