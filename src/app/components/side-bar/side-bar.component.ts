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
  transitionClass: string = 'menu__transition'; 
  usuariopadre: string | null = null; 
  constructor(
    public authService: AuthService, 
    public portalcliLogicaService: PortalcliLogicaService,
    private router: Router
  ) {} 

  ngOnInit() {
    this.usuariopadre = this.authService.getUsuarioPadre(); 
    const token = this.authService.getToken();

    this.portalcliLogicaService.isMenuOpen$. subscribe((isOpen: boolean) => {
      this.isMenuOpen = isOpen;
    });
  }

  navigateTo(route: string) {
    this.portalcliLogicaService.navigateTo(route);
  }

  openMenuOnItemHover() {
    if (!this.isMenuOpen) {
      this.portalcliLogicaService.openMenu();
    }
  }

  closeMenuOnItemLeave() {
    if (!this.portalcliLogicaService.isButtonOpen) {
      this.portalcliLogicaService.closeMenu();
    }
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

  toggleMenu() {
    this.portalcliLogicaService.toggleMenu();
  }

  openMenuOnHover() {
    this.portalcliLogicaService.openMenu();
  }

  closeMenuOnLeave() {
    this.portalcliLogicaService.closeMenu();
  }

}