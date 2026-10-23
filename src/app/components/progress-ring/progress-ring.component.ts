import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.scss'
})
export class ProgressRingComponent {
  @Input() porcentaje = 0;
  @Input() tamano = 44;
  @Input() grosor = 4;

  get radio(): number {
    return (this.tamano - this.grosor) / 2;
  }

  get circunferencia(): number {
    return 2 * Math.PI * this.radio;
  }

  get desplazamiento(): number {
    const porcentaje = Math.min(100, Math.max(0, this.porcentaje));
    return this.circunferencia * (1 - porcentaje / 100);
  }
}
