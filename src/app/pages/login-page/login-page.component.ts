import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Para manejar formularios
import { Router } from '@angular/router';


@Component({
  selector: 'app-login-page',
  standalone: true, // Indica que es un componente independiente
  imports: [
    CommonModule,
    FormsModule // Importar FormsModule para usar ngModel
  ],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss']
})
export class LoginPageComponent {
  // Objeto para almacenar los datos del formulario
  userData = {
    user: '',
    password: ''
  };

  // Inyectar HttpClient para hacer solicitudes HTTP
  constructor(private route: Router) {}

  // Función que se ejecuta al enviar el formulario
  onSubmit() {
    this.route.navigateByUrl('home')
    // // URL de la API (ajusta la ruta según tu backend)
    // const apiUrl = 'https://tudominio.com/api/logincli';

    // // Realizar la solicitud POST a la API
    // this.http.post(apiUrl, this.userData).subscribe(
    //   (response: any) => {
    //     // Manejar la respuesta exitosa
    //     if (response.status) {
    //       console.log('Login exitoso:', response.userdata);
    //       // Guardar el token en el almacenamiento local
    //       localStorage.setItem('token', response.api_key);
    //       // Redirigir al usuario a otra página
    //       // this.router.navigate(['/dashboard']);
    //     } else {
    //       console.error('Error:', response.message);
    //       alert(response.message); // Mostrar mensaje de error
    //     }
    //   },
    //   (error) => {
    //     // Manejar errores de la solicitud
    //     console.error('Error en la solicitud:', error);
    //     alert('Error en la conexión con el servidor'); // Mostrar mensaje de error
    //   }
    // );
  }
}