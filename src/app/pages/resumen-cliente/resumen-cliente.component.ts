import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {AsyncPipe, CommonModule, CurrencyPipe} from "@angular/common";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from "@angular/material/autocomplete";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {Clienteselect} from "../pedidos-page/pedidos-page.component";
import {debounceTime, distinctUntilChanged, Observable, Subject, takeUntil} from "rxjs";
import {MatCard, MatCardContent, MatCardTitle} from "@angular/material/card";
import {map, startWith} from "rxjs/operators";
interface EstadisticasCliente {
  codigo: string;
  nombre: string;
  condicion: string;
  dias_credito: string;
  segmento: string;
  monto_actura: string;
  pPago_dias_1: string;
  desc_ppago_1: string;
  pPago_dias_2: string;
  desc_ppago_2: string;
  pPago_dias_3: string;
  desc_ppago_3: string;
  pPago_dias_4: string;
  desc_ppago_4: string;
  limt: string;
  deuda: string;
  dias_retraso: string;
  solvencia: string;
  vta_3_meses: string;
  prom_3_Meses: string;
  vta_unid_3_meses: string;
  prom_unid_3_meses: string;
  grupo_economico: string;
}

interface ClienteAutocomplete {
  cliente: string; // Usaremos el código como identificador
  nombre: string;
}
@Component({
  selector: 'app-resumen-cliente',
  imports: [
      CommonModule,
    AsyncPipe,
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatFormField,
    ReactiveFormsModule,
    MatCard,
    MatCardTitle,
    MatCardContent,
  ],
  templateUrl: './resumen-cliente.component.html',
  styleUrl: './resumen-cliente.component.scss'
})
export class ResumenClienteComponent implements  OnInit {
  clienteControl = new FormControl('');
  clientes: unknown = [];
  filteredOptions!: Observable<ClienteAutocomplete[]>;
  data: EstadisticasCliente | null = null;
  private readonly _destroying$ = new Subject<void>();


  constructor(private apiService: ApiService) {
  }

  ngOnInit() {
    this.apiService.get_info_client().pipe(takeUntil(this._destroying$)).subscribe(data => {
      this.clientes = data;
      this.filteredOptions = this.clienteControl.valueChanges.pipe(
          takeUntil(this._destroying$),
          debounceTime(300), // Espera 300ms después de que el usuario deja de escribir
          distinctUntilChanged(), // Emite solo si el valor ha cambiado
          startWith(''),
          map(value => this._filter(value || '')),
      );
    });
  }

  ngOnDestroy(): void {
    this._destroying$.next();
    this._destroying$.complete();
  }

  private _filter(value: string): ClienteAutocomplete[] {
    const filterValue = value.toLowerCase();
    // @ts-ignore
    return this.clientes.map(cliente => ({ cliente: cliente.codigo, nombre: cliente.nombre }))
        .filter((option: { cliente: string; nombre: string; }) => option.cliente.toLowerCase().includes(filterValue) || option.nombre.toLowerCase().includes(filterValue));
  }

  displayFn(cliente: ClienteAutocomplete): string {
    return cliente && cliente.nombre ? `(${cliente.cliente}) ${cliente.nombre}` : '';
  }

  onClienteSeleccionado(clienteSeleccionado: ClienteAutocomplete) {
    // @ts-ignore
    const clienteEncontrado = this.clientes.find(cliente => cliente.codigo === clienteSeleccionado.cliente);
    this.cargarDatosCliente(clienteEncontrado);
  }

  onClienteInputChange(event: any) {
    // Opcional: Puedes realizar alguna acción mientras el usuario escribe
  }

  cargarDatosCliente(cliente: EstadisticasCliente | undefined) {
    if (cliente) {
      this.data = {
        codigo: cliente.codigo,
        nombre: cliente.nombre,
        condicion: cliente.condicion,
        dias_credito: cliente.dias_credito,
        segmento: cliente.segmento,
        monto_actura: cliente.monto_actura,
        pPago_dias_1: cliente.pPago_dias_1,
        desc_ppago_1: cliente.desc_ppago_1,
        pPago_dias_2: cliente.pPago_dias_2,
        desc_ppago_2: cliente.desc_ppago_2,
        pPago_dias_3: cliente.pPago_dias_3,
        desc_ppago_3: cliente.desc_ppago_3,
        pPago_dias_4: cliente.pPago_dias_4,
        desc_ppago_4: cliente.desc_ppago_4,
        limt: cliente.limt,
        deuda: cliente.deuda,
        dias_retraso: cliente.dias_retraso,
        solvencia: cliente.solvencia,
        vta_3_meses: cliente.vta_3_meses,
        prom_3_Meses: cliente.prom_3_Meses,
        vta_unid_3_meses: cliente.vta_unid_3_meses,
        prom_unid_3_meses: cliente.prom_unid_3_meses,
        grupo_economico: cliente.grupo_economico
      };
      // Convertir los campos numéricos a number si es necesario para el pipe de currency
      if (this.data.monto_actura) this.data.monto_actura = String(parseFloat(this.data.monto_actura));
      if (this.data.limt) this.data.limt = String(parseFloat(this.data.limt));
      if (this.data.deuda) this.data.deuda = String(parseFloat(this.data.deuda));
      if (this.data.vta_3_meses) this.data.vta_3_meses = String(parseFloat(this.data.vta_3_meses));
      if (this.data.prom_3_Meses) this.data.prom_3_Meses = String(parseFloat(this.data.prom_3_Meses));
      if (this.data.vta_unid_3_meses) this.data.vta_unid_3_meses = String(parseFloat(this.data.vta_unid_3_meses));
      if (this.data.prom_unid_3_meses)  this.data.prom_unid_3_meses = String(parseFloat(this.data.prom_unid_3_meses));
      if (this.data.dias_credito) this.data.dias_credito = this.data.dias_credito;
      if (this.data.pPago_dias_1) this.data.pPago_dias_1 = this.data.pPago_dias_1;
      if (this.data.desc_ppago_1) this.data.desc_ppago_1 = this.data.desc_ppago_1;
      if (this.data.pPago_dias_2) this.data.pPago_dias_2 = this.data.pPago_dias_2;
      if (this.data.desc_ppago_2) this.data.desc_ppago_2 = this.data.desc_ppago_2;
      if (this.data.pPago_dias_3) this.data.pPago_dias_3 = this.data.pPago_dias_3;
      if (this.data.desc_ppago_3) this.data.desc_ppago_3 = this.data.desc_ppago_3;
      if (this.data.pPago_dias_4) this.data.pPago_dias_4 = this.data.pPago_dias_4;
      if (this.data.desc_ppago_4) this.data.desc_ppago_4 = this.data.desc_ppago_4;
      if (this.data.dias_retraso) this.data.dias_retraso = this.data.dias_retraso;
    } else {
      this.data = null;
    }
  }
}
