import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core'; // Importa AfterViewInit
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from './../../auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxSpinnerModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements AfterViewInit { // Implementa AfterViewInit
  userData = {
    user: '',
    password: '',
  };
  errorMessage: string = '';
  isLoading = false; 
  @ViewChild('userInput') userInput!: ElementRef;

  constructor(
    private route: Router,
    private http: HttpClient,
    public authService: AuthService,
    private spinner: NgxSpinnerService
  ) {}

  ngAfterViewInit() {
    this.userInput.nativeElement.focus(); // Enfoca el input de usuario al cargar la página
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

    this.http.post('http://10.0.100.2/proteoerp/api/logincli/logincli', formData).subscribe({
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
}