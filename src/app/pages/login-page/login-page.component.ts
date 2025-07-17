import {Component, ElementRef, ViewChild, AfterViewInit, signal} from '@angular/core'; // Importa AfterViewInit
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

import { API_URL } from '../../app.config';
import { API_URLINTER } from '../../app.config';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import {MatOption} from "@angular/material/core";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgxSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatOption,
    MatSelect,
    ReactiveFormsModule
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements AfterViewInit {
  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  userData = {
    user: '',
    password: '',
  };
  errorMessage: string = '';
  isLoading = false;
  idTypes: string[] = ['J', 'V', 'E'];
  msjRif: string = '';
  nombreCli: string = '';
  registerForm!: FormGroup;
  isRifChecked: boolean = false
  @ViewChild('userInput') userInput!: ElementRef;

  constructor(
    private route: Router,
    private http: HttpClient,
    public authService: AuthService,
    private spinner: NgxSpinnerService,
    public portalcliLogicaService: PortalcliLogicaService,
    private fb: FormBuilder,
  ) {
    this.registerForm = this.fb.group({
      idType: ['J', Validators.required],
      rif: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]],
      email: ['',],
    });
  }

  ngAfterViewInit() {
    this.userInput.nativeElement.focus(); // Enfoca el input de usuario al cargar la página
  }

  navigateTo(route: string){
    this.portalcliLogicaService.navigateTo(route);
  }

  onSubmit() {
    this.errorMessage = '';
    this.isLoading = true; 

    if (!this.userData.user || !this.userData.password) {
      this.errorMessage = 'Por favor, complete todos los campos.';
      this.isLoading = false;
      return;
    }

    const formData = new FormData();
    formData.append('user', this.userData.user);
    formData.append('password', this.userData.password);

    const apiUrl = `${API_URLINTER}logincli/logincli`;

    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
        if (response.status === false) {
          this.errorMessage = response.message;
          this.isLoading = false;
          this.userData.user = ''; // Limpia el campo de usuario
          this.userData.password = ''; // Limpia el campo de contraseña
          this.userInput.nativeElement.focus(); // Enfoca el input de usuario
        } else {
          this.authService.setToken(response.api_key);
          this.route.navigate(['/home']);
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Usuario o contraseña incorrectos.';
        this.isLoading = false;
        this.userData.user = ''; // Limpia el campo de usuario
        this.userData.password = ''; // Limpia el campo de contraseña
        this.userInput.nativeElement.focus(); // Enfoca el input de usuario
        console.error('Error de autenticación:', error);
      },
    });
  }

  // Método para buscar el RIF y controlar la habilitación de campos
  checkRif(): void {
    const idTypeControl = this.registerForm.get('idType');
    const rifControl = this.registerForm.get('rif');

    // Limpiar mensaje y deshabilitar campos por si se vuelve a intentar
    this.msjRif = '';
    this.disableFormFields(); // Deshabilita los campos antes de la nueva verificación

    // Validar localmente Tipo y RIF antes de llamar a la API
    if (idTypeControl?.invalid || rifControl?.invalid) {
      idTypeControl?.markAsTouched();
      rifControl?.markAsTouched();
      this.msjRif = 'Por favor, selecciona un Tipo y un RIF válidos.';
      return;
    }

    this.isLoading = true;
    this.spinner.show();

    const tipo = idTypeControl?.value;
    const rif = rifControl?.value;

    const apiUrl = `${API_URLINTER}logincli/buscacliente`; // Asegúrate de que API_URL esté configurada correctamente

    // Crear FormData para enviar los datos por separado
    const formData = new FormData();
    formData.append('tipoRif', tipo); // Envía 'tipo'
    formData.append('rif', rif);   // Envía 'rif'

    this.http.post(apiUrl, formData).subscribe({
      next: (response: any) => {
        this.spinner.hide();
        this.isLoading = false;

        if (response.status == true) {
          this.msjRif = response.mensaje;
          this.nombreCli='Rif de: '+response.data.nombre
          this.enableFormFields();

        } else { // RIF no encontrado o algún otro mensaje de error de la API
          this.msjRif = response.mensaje;
          this.disableFormFields(); // Mantiene los campos deshabilitados
        }
      },
      error: (error) => {
        this.spinner.hide();
        this.isLoading = false;
        console.error('Error al verificar RIF:', error);
        this.msjRif = 'Error de conexión al verificar el RIF. Intenta de nuevo más tarde.';
        this.disableFormFields(); // Mantiene los campos deshabilitados en caso de error
      },
    });
  }

  // Nuevo método para deshabilitar los campos del formulario (excepto Tipo y RIF)
  private disableFormFields(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      if (key !== 'idType' && key !== 'rif') {
        this.registerForm.get(key)?.disable();
      }
    });
    this.isRifChecked = false; // Resetear el estado de validación del RIF
  }

  // Nuevo método para habilitar los campos del formulario
  private enableFormFields(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.enable();
    });
    this.isRifChecked = true; // El RIF ha sido validado
  }

}