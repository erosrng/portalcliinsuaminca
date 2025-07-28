import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";

import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { AuthService } from './../../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URL } from './../../app.config';
import { API_URLINTER } from './../../app.config';

import Swal from 'sweetalert2';
import {MatSidenav, MatSidenavModule} from '@angular/material/sidenav';

@Component({
  selector: 'app-miperfil-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    FormsModule,
    MatSidenav,
    MatSidenavModule
  ],
  templateUrl: './miperfil-page.component.html',
  styleUrl: './miperfil-page.component.scss'
})
export class MiperfilPageComponent implements OnInit {
  fichaData: any = {};
  nuevaContrasena = '';
  confirmarContrasena = '';
  prefijoTelefono = '0414';
  contrasenaActual = '';
  contrasenaValida = false;
  contrasenaInvalida = false;
  isLoading = false;
  toggleMenu = false;

  ngOnInit() {
    const token = this.authService.getToken();

  }

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService
  ) { }

  verificarContrasena() {
    const old_pws = this.contrasenaActual;
    const token = this.authService.getToken();

    const formData = new FormData();
    formData.append('old_pws', old_pws);

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    this.http.post(`${API_URLINTER}portalcli/buscaopws`, formData, { headers: headers }).subscribe({
      next: (response: any) => {
        if (response.status==false) {
          this.contrasenaInvalida = true;
          this.contrasenaValida = false;
        } else {
          this.contrasenaValida = true;
          this.contrasenaInvalida = false;
        }
      },
      error: (error) => {
        console.error('Error al verificar contraseña:', error);
        this.contrasenaInvalida = true;
        this.contrasenaValida = false;
      },
    });
  }

  actualizarDatos(formData: any) {
    if (this.nuevaContrasena !== this.confirmarContrasena) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
      });
      return;
    }

    const data = new FormData();
    data.append('correoElectronico', formData.correoElectronico);
    data.append('telefono', this.prefijoTelefono + formData.telefono);
    data.append('contacto', formData.contacto);
    data.append('direccion', formData.direccion);
    if (this.nuevaContrasena) {
      data.append('nuevaContrasena', this.nuevaContrasena);
      data.append('contrasenaActual', this.contrasenaActual);
    }

    const headers = new HttpHeaders({
      Authorization: `${this.authService.getToken()}`,
    });
    const apiUrl = `${API_URLINTER}portalcli/actualizar_perfil`;

    Swal.fire({
      title: '¿Desea actualizar su ficha?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.post(apiUrl, data, { headers: headers }).subscribe({
          next: (response: any) => {
            console.log('Datos actualizados:', response);
            Swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: 'Su ficha ha sido actualizada.',
            }).then(() => { 
              window.location.reload();
            });;
            const modal = document.getElementById('actualizarDatosModal');
            if (modal) {
              modal.classList.remove('show');
              modal.setAttribute('aria-hidden', 'true');
              modal.style.display = 'none';
              document.body.classList.remove('modal-open');
              document.body.style.paddingRight = '';
              const modalBackdrop = document.querySelector('.modal-backdrop');
              if (modalBackdrop) {
                modalBackdrop.remove();
              }
              this.contrasenaActual = '';
              this.nuevaContrasena = '';
              this.confirmarContrasena = '';
            }
          },
          error: (error) => {
            console.error('Error al actualizar datos:', error);
            let errorMessage = 'Error al actualizar datos.';
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            }
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: errorMessage,
            });
          },
        });
      }
    });
  }

  alertaerror() {
    this.portalcliLogicaService.alertaerror();
  }

  mostrarLoader() {
    this.portalcliLogicaService.mostrarLoader();
  }

  ocultarLoader() {
    this.portalcliLogicaService.ocultarLoader();
  }

  openMenu(event: any) {
    if (this.toggleMenu) {
      this.toggleMenu = false;
    } else {
      this.toggleMenu = true;
    }
  }
}