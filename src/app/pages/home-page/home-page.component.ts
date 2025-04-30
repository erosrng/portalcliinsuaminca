import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";

import { AuthService } from './../../auth.service';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';
import { Router } from '@angular/router';

import { CarouselModule } from 'primeng/carousel';

interface Product {
  name: string;
  price: string;
  discount: string;
  imageSrc: string;
  available: string;
  description: string;
  id: string;
}

@Component({
  selector: 'app-home-page',
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    CarouselModule
],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit{
  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = true;

  products: Product[] = [ // Define tu array de productos aquí
    {
      id: '00372_1',
      name: 'PANTOPRAZOL 40MG',
      price: 'US$ 3,66',
      discount: '20%',
      imageSrc: './assets/images/02268_.png',
      available: 'Disponibles: 284',
      description: '10 TAB LA SANTE'
    },
    {
      id: '00372_2',
      name: 'Otro Producto',
      price: 'US$ 5,00',
      discount: '10%',
      imageSrc: '/insuaminca/uploads/inventario/Image/00372_.png',
      available: 'Disponibles: 150',
      description: 'Descripción del otro producto'
    },
    {
      id: '00372_3',
      name: 'Tercer Artículo',
      price: 'US$ 2,20',
      discount: '25%',
      imageSrc: './assets/images/otro_producto.png',
      available: 'Disponibles: 300',
      description: 'Detalles del tercer artículo'
    },
    {
      id: '00372_4',
      name: 'Cuarto Producto',
      price: 'US$ 7,80',
      discount: '5%',
      imageSrc: './assets/images/un_producto_mas.png',
      available: 'Disponibles: 90',
      description: 'Información del cuarto producto'
    }
  ];

    responsiveOptions: any[] | undefined;


  @ViewChild('carouselCardsContainer') carouselCardsContainer!: ElementRef;
  cardWidth = 266;

  constructor(
    private authService: AuthService,
    public portalcliLogicaService: PortalcliLogicaService,
    private router: Router
  ) {}

    ngOnInit() {
      const token = this.authService.getToken();

      // Suscribirse al estado del menú desde el servicio
      this.portalcliLogicaService.isMenuOpen$.subscribe((isOpen: boolean) => {
        this.isMenuOpen = isOpen;
      });

      this.responsiveOptions = [
          {
              breakpoint: '1024px',
              numVisible: 3,
              numScroll: 1
          },
          {
              breakpoint: '768px',
              numVisible: 2,
              numScroll: 1
          },
          {
              breakpoint: '560px',
              numVisible: 1,
              numScroll: 1
          }
      ];
    }

    navigateTo(route: string) {
      this.router.navigate([route]);
    }
}