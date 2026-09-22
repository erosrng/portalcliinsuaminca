import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PortalcliLogicaService } from '../../services/portalcli-logica.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.scss'
})
export class ProductModalComponent {
  @Input() selectedProduct: any = null;
  @Input() imageficha: any;
  @Input() productosEnCarritoCodigos: string[] = [];
  @Input() showAgregar: boolean = false;
  @Output() agregar = new EventEmitter<any>();

  constructor(public portalcliLogicaService: PortalcliLogicaService) {}

  onAgregar() {
    this.agregar.emit(this.selectedProduct);
  }
}