export interface HistoricoPedidosModel {
    id: number,
    nombre: string,
    codigo_cliente: string,
    estado: string,
    fecha: string,
    hora: string,
    nombre_cliente: string,
    nomprv: string,
    proveed: string,
    tasa_dia: number,
    unidades: number,
    usuario: string,
    valor_dolar: number,
    Pedido: any[],
}

export interface CasaMatrizModel {
    codigo: string,
    nombre: string,
}

export interface ExcelData {
    headers: string[];
    data: any[];
}

export interface PedidoAgrupado {
    nombre: string | undefined;
    codigo: string | undefined;
    items: {
        CodigoProd: string | undefined;
        Descripcion: string | undefined;
        Precio: any;
        Descuento: any;
    }[];
}