import { Pipe, PipeTransform } from '@angular/core';

/**
 * Convierte el primer dígito del número de factura solo para mostrarlo en pantalla:
 * 7xxxxxx -> Bxxxxxx
 * 9xxxxxx -> Cxxxxxx
 *
 * No modifica el valor original que se usa en la lógica ni en las peticiones al API.
 */
export function formatearNumeroFacturaVisual(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') {
    return '';
  }

  const numero = String(valor);

  // Se admite un prefijo no numérico (ej. "FC-7000123" o "Factura 9000123")
  // para que igualmente se cambie la primera cifra del número de factura.
  const coincidencia = numero.match(/^(\D*)([79])(.*)$/);

  if (!coincidencia) {
    return numero;
  }

  const [, prefijo, primerDigito, resto] = coincidencia;
  return `${prefijo}${primerDigito === '7' ? 'B' : 'C'}${resto}`;
}

@Pipe({
  name: 'numeroFacturaVisual',
  standalone: true
})
export class NumeroFacturaVisualPipe implements PipeTransform {
  transform(valor: string | number | null | undefined): string {
    return formatearNumeroFacturaVisual(valor);
  }
}
