import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userData: any;
  private token: string | null = null;  
  
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }


  setUserData(data: any) {
    this.userData = data;
    localStorage.setItem('userData', JSON.stringify(data)); // Almacena en localStorage
  }

  getUserData() {
    if (!this.userData) {
      this.userData = JSON.parse(localStorage.getItem('userData') || '{}'); // Recupera de localStorage
    }
    return this.userData;
  }

  isLoggedIn(): boolean {
    return !!this.getUserData() && this.getUserData().logged_in;
  }

  logout() {
    this.userData = null;
    this.token = '';
    localStorage.removeItem('userData'); // Elimina de localStorage
    localStorage.removeItem('apiKey'); // Elimina de localStorage
  }
}