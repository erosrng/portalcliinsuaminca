import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from './../../auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})

export class LoginPageComponent {
  userData = {
    user: '',
    password: '',
  };
    errorMessage: string = '';
    loading: boolean = false;

  constructor(private route: Router, private http: HttpClient, private authService: AuthService) {}

  onSubmit() {
    this.errorMessage = '';
    this.loading = true;

    if (!this.userData.user || !this.userData.password) {
      this.errorMessage = 'Por favor, complete todos los campos.';
      this.loading = false;
      return;
    }

    const formData = new FormData();
    formData.append('user', this.userData.user);
    formData.append('password', this.userData.password);

    // Aquí iría la petición HTTP al servidor para la autenticación
    this.http.post('http://10.0.100.2/proteoerp/api/logincli/logincli', formData).subscribe({
      next: (response: any) => {
        if(response.status==false){
          this.errorMessage = response.message;
          this.loading = false;
        }else{
          // Manejar la respuesta del servidor (token, etc.)
          const token = this.authService.getToken();
          this.authService.setToken(response.api_key); // Guarda el token aquí
          this.route.navigate(['/home']); 
          this.loading = false;
        }
      },
      error: (error) => {
        // Manejar errores de autenticación
        this.errorMessage = 'Usuario o contraseña incorrectos.';
        this.loading = false;
      },
    });
  }
}