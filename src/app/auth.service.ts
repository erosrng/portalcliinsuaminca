import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token: string | null = null;
  private userData: any | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
    this.decodeToken(); // Decodifica el token al guardarlo
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
      this.decodeToken(); // Decodifica el token al recuperarlo
    }
    return this.token;
  }

  removeToken() {
    this.token = null;
    this.userData = null;
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserData(): any | null {
    return this.userData;
  }

  private decodeToken() {
    const token = this.getToken();
    if (token) {
      this.userData = jwtDecode(token);
    } else {
      this.userData = null;
    }
  }
}