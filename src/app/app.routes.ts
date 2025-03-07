import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'home', component: HomePageComponent, canActivate: [AuthGuard] }, // Ruta protegida
  { path: 'login', component: LoginPageComponent }, // Ruta pública
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];