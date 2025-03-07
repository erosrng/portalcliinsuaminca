import { Component } from '@angular/core';
import { AuthService } from './../../auth.service';

@Component({
  selector: 'app-nav-bar',
  imports: [],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent {
  userData: any;
  apiKey: string = '';

  constructor(private authService: AuthService) {} 

  ngOnInit() { // Implementa ngOnInit
    this.userData = this.authService.getUserData();
  }
}
