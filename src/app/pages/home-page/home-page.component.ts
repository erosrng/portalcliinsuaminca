import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core'; // `ElementRef` y `ViewChild` no son necesarios para ngx-owl-carousel-o en este caso
import { NavBarComponent } from "../../components/nav-bar/nav-bar.component";
import { FooterComponent } from "../../components/footer/footer.component";
import { SideBarComponent } from "../../components/side-bar/side-bar.component";
import { ClicardComponent } from "../../components/clicard/clicard.component";

import { AuthService } from '../../auth.service';
import { PortalcliLogicaService } from '../../services/portalcli-logica.service';
import { Router } from '@angular/router';

// *** Importaciones y configuración para ngx-owl-carousel-o ***
import { OwlOptions, CarouselModule } from 'ngx-owl-carousel-o'; // <-- ¡Importación clave!
// ************************************************************

// Interfaz para la estructura de tus productos
interface Product {
  name: string;
  price: string;
  discount: string;
  imageSrc: string;
  available: string; // Asegúrate de que sea string si manejas "284"
  description: string;
  id: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true, // ¡Muy importante que esté como standalone!
  imports: [
    CommonModule,
    NavBarComponent,
    FooterComponent,
    SideBarComponent,
    ClicardComponent,
    CarouselModule // <-- ¡Añade CarouselModule a tus imports!
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HomePageComponent implements OnInit {

  userData: any;
  apiKey: string = '';
  isMenuOpen: boolean = true;

  // *** Configuración de ngx-owl-carousel-o para el carrusel de productos ***
  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    center:true,
    navSpeed: 700,
    navText: ['<i class="fa-solid fa-chevron-left"></i>', '<i class="fa-solid fa-chevron-right"></i>'],
    responsive: {
      0: {
        items: 1 // Para pantallas muy pequeñas, 1 elemento
      },
      640: {
        items: 2 // Para teléfonos más grandes/tabletas pequeñas, 2 elementos
      },
      768: {
        items: 3 // Para tabletas, 3 elementos
      },
      1024: {
        items: 5 // Para escritorios, 4 elementos
      }
    },
    nav: true
  };
  // *************************************************************************

  // Tus 10 productos de ejemplo (ajustados para que `available` sea string)
  products: Product[] = [
    { id: '001', name: 'PANTOPRAZOL 40MG 10 TAB LA SANTE', price: 'US$ 3,66', discount: '20%', available: '284', imageSrc: './assets/images/02268_.png', description: 'Antiácido para el reflujo gástrico.' },
    { id: '002', name: 'AMOXICILINA 500MG 12 CAP ELFARMA', price: 'US$ 2,50', discount: '10%', available: '150', imageSrc: './assets/images/amoxicilina.png', description: 'Antibiótico de amplio espectro.' },
    { id: '003', name: 'IBUPROFENO 600MG 20 TAB GENERICO', price: 'US$ 1,99', discount: '5%', available: '300', imageSrc: './assets/images/ibuprofeno.png', description: 'Analgésico y antiinflamatorio.' },
    { id: '004', name: 'LOSARTÁN 50MG 30 TAB LA SANTE', price: 'US$ 4,10', discount: '15%', available: '100', imageSrc: './assets/images/losartan.png', description: 'Para el control de la presión arterial.' },
    { id: '005', name: 'METFORMINA 850MG 60 TAB ELFARMA', price: 'US$ 3,00', discount: '25%', available: '200', imageSrc: './assets/images/metformina.png', description: 'Medicamento para la diabetes tipo 2.' },
    { id: '006', name: 'ATORVASTATINA 20MG 30 TAB FARMA', price: 'US$ 6,50', discount: '10%', available: '90', imageSrc: './assets/images/placeholder.png', description: 'Para reducir el colesterol.' },
    { id: '007', name: 'OMEPRAZOL 20MG 14 CAP LA SANTE', price: 'US$ 2,80', discount: '0%', available: '350', imageSrc: './assets/images/placeholder.png', description: 'Protector gástrico.' },
    { id: '008', name: 'DICLOFENAC 50MG 20 TAB GENERICO', price: 'US$ 1,20', discount: '8%', available: '400', imageSrc: './assets/images/placeholder.png', description: 'Antiinflamatorio no esteroideo.' },
    { id: '009', name: 'CEFALEXINA 500MG 20 CAP ELFARMA', price: 'US$ 3,90', discount: '12%', available: '180', imageSrc: './assets/images/placeholder.png', description: 'Antibiótico cefalosporínico.' },
    { id: '010', name: 'PARACETAMOL 500MG 100 TAB FARMA', price: 'US$ 1,00', discount: '0%', available: '500', imageSrc: './assets/images/placeholder.png', description: 'Analgésico y antipirético.' }
  ];

  constructor(
      private authService: AuthService,
      public portalcliLogicaService: PortalcliLogicaService,
      private router: Router
  ) {}

  ngOnInit() {
    // La variable `token` está declarada pero no se usa.
    // Si necesitas el token para alguna lógica aquí, úsalo.
    const token = this.authService.getToken();

  }

  // Método para navegar a otras rutas
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  // Lógica para manejar el ingreso de cantidad en el campo del producto
  eventcant(id: string, value: string, event: Event): void {
    if (event instanceof KeyboardEvent && event.key === 'Enter') {
      console.log(`Producto ${id}: Cantidad ingresada ${value}`);
      // Aquí puedes añadir la lógica para, por ejemplo, validar la cantidad
      // o pre-agregar al carrito al presionar Enter.
    }
  }

  // Lógica para añadir el producto al carrito
  agg_pedido(id: string, quantity: string): void {
    console.log(`Agregando producto ${id} con cantidad ${quantity} al carrito`);
    // Aquí es donde debes implementar la lógica real para añadir el producto al carrito.
    // Esto podría implicar llamar a un servicio de carrito, almacenar en LocalStorage, etc.
  }
}