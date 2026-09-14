import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PortalcliLogicaService } from './../../services/portalcli-logica.service';

@Component({
  selector: 'app-aviso-horario',
  imports: [CommonModule],
  templateUrl: './aviso-horario.component.html',
  styleUrl: './aviso-horario.component.scss'
})
export class AvisoHorarioComponent implements OnInit, OnDestroy {
  @Input() compacto = false;
  @Input() mostrarPrecios = true;

  fueraDeHorario = false;
  private intervalo?: ReturnType<typeof setInterval>;

  constructor(private portalcliLogicaService: PortalcliLogicaService) {}

  ngOnInit(): void {
    this.actualizarEstado();
    this.intervalo = setInterval(() => this.actualizarEstado(), 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  private actualizarEstado(): void {
    this.fueraDeHorario = this.portalcliLogicaService.estaFueraDeHorario();
  }
}
