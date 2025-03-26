import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";
import { HistorialpedComponent } from "../../components/historialped/historialped.component";

import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { AuthService } from './../../auth.service';

@Component({
  selector: 'app-miperfil-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    HistorialpedComponent
],
  templateUrl: './miperfil-page.component.html',
  styleUrl: './miperfil-page.component.scss'
})
export class MiperfilPageComponent {
  
  ngOnInit() {
    const token = this.authService.getToken();
  }

  constructor(
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  
  ) {}
}
