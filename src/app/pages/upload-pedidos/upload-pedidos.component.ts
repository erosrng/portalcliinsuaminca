import {Component, OnInit} from '@angular/core';
import {NavBarComponent} from "../../components/nav-bar/nav-bar.component";
import {MatSidenav, MatSidenavModule} from "@angular/material/sidenav";
import {SideBarComponent} from "../../components/side-bar/side-bar.component";
import {FooterComponent} from "../../components/footer/footer.component";
import {CommonModule} from "@angular/common";
import {ProteoService} from "../../services/proteo.service";
import Swal from "sweetalert2";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {MatDividerModule} from '@angular/material/divider';
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Clienteselect} from "../pedidos-page/pedidos-page.component";
import {CasaMatrizModel, ExcelData, PedidoAgrupado,} from "../../models/model";
import {AsyncPipe} from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {map, Observable} from "rxjs";
import {startWith} from "rxjs/operators";
import * as XLSX from 'xlsx';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {SelectionModel} from '@angular/cdk/collections';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {API_URL} from "../../app.config";
import {AuthService} from "../../auth.service";
import {ApiService} from "../../services/api.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {event} from "jquery";


@Component({
    selector: 'app-upload-pedidos',
    imports: [
        CommonModule,
        NavBarComponent,
        MatSidenav,
        MatSidenavModule,
        SideBarComponent,
        FooterComponent,
        MatSidenav,
        MatButtonToggleModule,
        MatDividerModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        AsyncPipe,

        MatTableModule, MatButtonModule, MatIconModule,
        MatCheckboxModule, MatProgressSpinner
    ],
    templateUrl: './upload-pedidos.component.html',
    styleUrl: './upload-pedidos.component.scss'
})
export class UploadPedidosComponent implements OnInit {

    toggleMenu = false;
    typeUpload = '';
    clientesIndividual: Clienteselect[] = [];
    clientesGrupo: CasaMatrizModel[] = [];

    // Autocomplete de Grupo de casa matriz
    controlCasaMatriz = new FormControl('');
    filteredOptions: Observable<CasaMatrizModel[]> | null = null;

    // Autocomplete de cliente unico
    controlUnico = new FormControl('');
    filteredOptionsUnico: Observable<Clienteselect[]> | null = null;


    jsonData: ExcelData | null = null;
    pedidosAgrupados: PedidoAgrupado[] = [];


    displayedColumns = ['select','codigoCliente', 'nombreCliente', 'unidades', 'valor', 'detalle'];
    dataSource: any = new MatTableDataSource<any>([]);
    selection = new SelectionModel<any>(true, []);
    listActive: any[] = [];
    listActiveGrupo: any[] = [];
    listProdutos: any[] = [];
    clienteData: any;
    diasCredito = 0
    montoFactura = 0
    emailSendUser = '';
    emailSendProveed: string | null = localStorage.getItem('emailprov');
    showloader = false;

    constructor(
        private proteoServices: ProteoService,
        private authService: AuthService,
        public http: HttpClient,
        private apiService: ApiService,
    ) {
    }

    ngOnInit() {
        this.loadAll();
    }

    fetchPedidos() {
        Swal.showLoading();
        const formData = new FormData();
        const token = this.authService.getToken();
        const codCli = '00001';

        if(codCli){
            formData.append('start', '0');
            formData.append('length', '1000');
            formData.append('codCli', '00001');
            formData.append('search', '');
            formData.append('categoria','');
            formData.append('almacen', '0001');
            formData.append('lote', '');
            formData.append('orderby', 'descrip');
            formData.append('orderDirection', 'asc');
            formData.append('nuevos', '0');
            formData.append('columns', JSON.stringify([
                { data: 'codigo' },
                { data: 'descrip' },
                { data: 'nomprv' },
                { data: 'oprecio' },
                { data: 'existen' },
            ]));

            const headers = new HttpHeaders({
                'Authorization': `${token}`
            });
            const apiUrl = `${API_URL}inventarioprv`;

            this.http.post(apiUrl, formData, { headers: headers }).subscribe({
                next: (response: any) => {
                    this.listProdutos = response.data.data;
                    console.log('ENTRE')
                },
                error: (error) => {
                    Swal.hideLoading();
                    Swal.fire({
                        title: 'Error',
                        text: 'Error al cargar inventario',
                    })
                    console.error('Error al cargar inventario:', error);
                },
            });

        }

    }

    loadAll(): void {
        Swal.showLoading()
        this.proteoServices.get_clients_by_group().subscribe((clientes: any) => {
            this.clientesGrupo = clientes.data;
            this.proteoServices.get_clients().subscribe((clients: any) => {
                this.clientesIndividual = clients.data;

                this.filteredOptions = this.controlCasaMatriz.valueChanges.pipe(
                    startWith(''),
                    map(value => this._filter(value || '')),
                );

                this.filteredOptionsUnico = this.controlUnico.valueChanges.pipe(
                    startWith(''),
                    map(value => this._filterUnico(value || '')),
                );

                this.fetchPedidos();
                Swal.close()
            })
        });
    }

    private _filter(value: string): CasaMatrizModel[] {
        const filterValue = value.toLowerCase();
        return this.clientesGrupo.filter((option: CasaMatrizModel) => option.nombre.toLowerCase().includes(filterValue));
    }

    private _filterUnico(value: string): Clienteselect[] {
        const filterValue = value.toLowerCase();

        return this.clientesIndividual.filter((option: Clienteselect) =>
            option.nombre.toLowerCase().includes(filterValue) ||
            option.cliente.toLowerCase().includes(filterValue) // Agregamos la búsqueda por cliente
        );
    }

    downloadFile(): void {

        if (this.typeUpload === 'GRUPO') {
            if (this.controlCasaMatriz.value !== '' && this.controlCasaMatriz.value !== null) {
                const nombreGrupo: any = this.controlCasaMatriz.value;
                Swal.showLoading();
                this.proteoServices.get_document_by_group(nombreGrupo).subscribe(
                    (data: Blob) => {
                        const url = window.URL.createObjectURL(data);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `formato_pedidos_${nombreGrupo}.xlsx`; // Set the desired filename
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url); // Clean up the URL object
                        console.log('File downloaded successfully.');
                        Swal.close();
                    },
                    (error) => {
                        console.error('Error downloading file:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Ocurrio un error al realizar la descarga',
                            text: 'intente nuevamente, si continua el error pongase en contacto con nosotros',
                            showCancelButton: false,
                        })
                    }
                );
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Debe seleccionar un grupo',
                    showCancelButton: false,
                })
            }

        }

        if (this.typeUpload === 'INDIVIDUAL') {
            if (this.controlUnico.value !== '' && this.controlUnico.value !== null) {
                const nombreUnico: any = this.controlUnico.value;
                Swal.showLoading();
                this.proteoServices.get_file_simple(nombreUnico).subscribe(
                    (data: Blob) => {
                        const url = window.URL.createObjectURL(data);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `formato_pedidos_${nombreUnico}.xlsx`; // Set the desired filename
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url); // Clean up the URL object
                        console.log('File downloaded successfully.');
                        Swal.close();
                    },
                    (error) => {
                        console.error('Error downloading file:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Ocurrio un error al realizar la descarga',
                            text: 'intente nuevamente, si continua el error pongase en contacto con nosotros',
                            showCancelButton: false,
                        })
                    }
                );
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Debe seleccionar un grupo',
                    showCancelButton: false,
                })
            }

        }

    }

    openMenu(event: any) {
        if (this.toggleMenu) {
            this.toggleMenu = false;
        } else {
            this.toggleMenu = true;
        }
    }

    onFileChange(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.readFile(file);
        }
    }

    readFile(file: File): void {
        const reader: FileReader = new FileReader();
        try {
            reader.onload = (e: any) => {
                try {
                    const binaryString: string = e.target.result;
                    const workbook: XLSX.WorkBook = XLSX.read(binaryString, {type: 'binary'});
                    const sheetName: string = workbook.SheetNames[0]; // Suponemos que solo hay una hoja
                    const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
                    this.processExcelData(worksheet);
                } catch (e) {
                    this.showError();
                }
            };

            reader.onerror = (error) => {
                console.error('Error al leer el archivo:', error);
                this.showError();
            };

            reader.readAsBinaryString(file);
        } catch (e) {
           this.showError();
        }

    }


    onFileChangeUnico(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.readFileUnico(file);
        }
    }

    readFileUnico(file: File): void {
        const reader: FileReader = new FileReader();
        try {
            reader.onload = (e: any) => {
                try {
                    const binaryString: string = e.target.result;
                    const workbook: XLSX.WorkBook = XLSX.read(binaryString, {type: 'binary'});
                    const sheetName: string = workbook.SheetNames[0]; // Suponemos que solo hay una hoja
                    const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
                    this.processExcelDataUnico(worksheet);
                } catch (e) {
                    this.showError();
                }
            };

            reader.onerror = (error) => {
                console.error('Error al leer el archivo:', error);
                this.showError();
            };

            reader.readAsBinaryString(file);
        } catch (e) {
            this.showError();
        }

    }

    showError() {
        Swal.fire({
            icon: 'error',
            title: 'Error al leer el archivo',
            text: 'intente nuevamente, si continua el error pongase en contacto con nosotros',
            showCancelButton: false,
        })
    }

    processExcelData(worksheet: XLSX.WorkSheet): void {
        Swal.showLoading()
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        if (jsonData && jsonData.length > 2) {
            // const
            const headersNames = jsonData[0].filter(header => header !== null && header !== undefined);
            const headersCodigos = jsonData[1].filter(header => header !== null && header !== undefined);
            const pedidosRealizados: any[] = [];
            const dataRows: any[] = jsonData.slice(2).map(row => {return row})


            headersNames.forEach((item, index) => {
                if (index > 5) {
                    pedidosRealizados.push({
                        nombreCliente: item,
                        codigoCliente: headersCodigos[index - 5],
                        indexPedido: index,
                        pedido: [],
                    });
                }
            });

            console.log(pedidosRealizados)

            pedidosRealizados.forEach((item, index) => {
                dataRows.forEach((row) => {
                    if (row[item.indexPedido]) {
                        item.pedido.push({
                            Codigo: row[0],
                            COD_Proveedor: row[1],
                            Descripcion: row[2],
                            Precio: row[3],
                            Oferta: row[4],
                            Descuento: row[5],
                            Unidades: row[item.indexPedido]
                        });
                    }
                })
            });

            const pedidoFinales: any[] = pedidosRealizados.filter(item => item.pedido.length > 0)
            this.dataSource = pedidoFinales;
            Swal.close()

        } else {
            console.warn('El archivo Excel no tiene suficientes filas o la estructura esperada.');
            this.jsonData = null;
            Swal.fire({
                icon: 'error',
                title: 'El archivo Excel no tiene suficientes filas o la estructura esperada.',
                text: 'intente nuevamente, si continua el error pongase en contacto con nosotros',
                showCancelButton: false,
            });
        }
    }

    processExcelDataUnico(worksheet: XLSX.WorkSheet): void {
        Swal.showLoading()
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        console.log(jsonData)
        if (jsonData && jsonData.length > 2) {
            // const
            const headersNames = jsonData[3].filter(header => header !== null && header !== undefined);
            const pedidosRealizados: any[] = [];
            const dataRows: any[] = jsonData.slice(4).map(row => {return row})
            let cliente: any;
            this.clientesIndividual.forEach((item, index) => {
                if (item.cliente === this.controlUnico.value) {
                    cliente = item
                }
            })


            pedidosRealizados.push({
                nombreCliente: cliente.nombre,
                codigoCliente: this.controlUnico.value,
                indexPedido: 0,
                pedido: [],
            });

            pedidosRealizados.forEach((item, index) => {
                dataRows.forEach((row) => {
                    console.log(row[11])
                    if (Number(row[11]) > 0) {
                        console.log(row[11])
                        item.pedido.push({
                            Codigo: row[0],
                            COD_Proveedor: localStorage.getItem('proveed'),
                            Descripcion: row[2],
                            Precio: row[12],
                            Oferta1: row[4],
                            Oferta2: row[6],
                            Descuento: row[13],
                            Unidades: row[11]
                        });
                    }
                })
            });

            console.log(pedidosRealizados)

            const pedidoFinales: any[] = pedidosRealizados.filter(item => item.pedido.length > 0)
            this.dataSource = pedidoFinales;
            console.log(this.dataSource)
            Swal.close()

        } else {
            console.warn('El archivo Excel no tiene suficientes filas o la estructura esperada.');
            this.jsonData = null;
            Swal.fire({
                icon: 'error',
                title: 'El archivo Excel no tiene suficientes filas o la estructura esperada.',
                text: 'intente nuevamente, si continua el error pongase en contacto con nosotros',
                showCancelButton: false,
            });
        }
    }

    uploadFile(): void {
        // Simplemente activamos el input de tipo 'file' al hacer clic en el botón
        document.getElementById('fileInput')?.click();
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    toggleAllRows() {
        if (this.isAllSelected()) {
            this.selection.clear();
            return;
        }

        this.selection.select(...this.dataSource);
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: any): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
    }

    getUnits(element: any): number {
        const aux = element.pedido;
        let valueOfRetur = 0
        aux.forEach((info: any) => {
            valueOfRetur = Number(info.Unidades) + valueOfRetur
        })

        return valueOfRetur
    }

    getValor(element: any): number {

        const aux = element.pedido;
        let valueOfRetur = 0;
        aux.forEach((info: any) => {
            let stringNumber = info.Precio;
            if (info.Descuento !== undefined) {
                // console.log(info.Descuento, 'VALOR')
                const normalizedString = stringNumber.replace(",", "");
                const precio = parseFloat(normalizedString);
                const descuento = parseFloat(info.Descuento) / 100; // Convertir el porcentaje a decimal
                const precioConDescuento = precio * (1 - descuento);
                valueOfRetur = precioConDescuento + valueOfRetur;
            } else {
                const normalizedString = stringNumber.replace(",", "");
                const precio = parseFloat(normalizedString);
                valueOfRetur = precio
            }

        });
        return valueOfRetur;
    }

    getValorGrupo(element: any): number {
        const aux = element.pedido;
        let totalOferta = 0;
        aux.forEach((info: any) => {
            const stringOferta = info.Oferta;
            const normalizedString = stringOferta.replace(",", "");
            const oferta = parseFloat(normalizedString);
            totalOferta += oferta; // Sumamos el valor de la oferta al total
        });
        return totalOferta;
    }




    calculateDiscount(stringNumber: string, descuentoItem: string): number {
        if (this.typeUpload === 'INDIVIDUAL') {
            if (descuentoItem !== undefined) {
                const normalizedString = stringNumber.replace(",", "");
                const precio = parseFloat(normalizedString);
                const descuento = parseFloat(descuentoItem) / 100; // Convertir el porcentaje a decimal
                return (precio * (1 - descuento));
            } else {
                const normalizedString = stringNumber.replace(",", "");
                const precio = parseFloat(normalizedString);
                const descuento = parseFloat(descuentoItem) / 100; // Convertir el porcentaje a decimal
                return precio;
            }

        } else {
            const normalizedString = stringNumber.replace(",", "");
            const precio = parseFloat(normalizedString);
            return precio
        }

    }

    openDetail(info: any): void {
        console.log(info, 'ACA')
        this.listActive = info.pedido
    }

    openDetailGrupo(info: any): void {
        this.listActiveGrupo = info.pedido
    }

    getprice(pedido: any) {
        if (this.typeUpload === 'INDIVIDUAL') {
            const stringNumber = pedido.Precio;
            const normalizedString = stringNumber.replace(",", ".");
            const number = parseFloat(normalizedString);
            return number
        } else {
            const stringNumber = pedido.Oferta;
            const normalizedString = stringNumber.replace(",", ".");
            const number = parseFloat(normalizedString);
            return number * pedido.Unidades
        }

    }

    getimagen(pedido: any) {
        return `http://192.168.1.48/proteoerp/uploads/inventario/Image/${pedido.Codigo}_.png`
    }

    setDefaultImage(event: any) {
        event.target.src = 'http://192.168.1.48/proteoerp/assets/images/elemento-44.png';
    }

    generatePedido() {
        if (this.typeUpload === 'GRUPO') {
            Swal.fire({
                title: "Esta seguro que desea realizar el pedido",
                text: "",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Si, continuar",
            }).then((result) => {
                if (result.isConfirmed) {
                    this.executeMultiPed();
                }
            });
        }
        if (this.typeUpload === 'INDIVIDUAL') {
            Swal.fire({
                title: "Esta seguro que desea realizar el pedido",
                text: "",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Si, continuar",
            }).then((result) => {
                if (result.isConfirmed) {
                    this.proteoServices.get_client_data(this.controlUnico.value).subscribe((data: any) => {
                        console.log(data);
                        if (data.data.datcli) {
                           const aux = data.data.datcli;
                           this.emailSendUser = aux.email;
                           this.emailSendProveed = localStorage.getItem('emailprov');
                           this.executePed();
                        } else {
                            this.executePed();
                        }
                    }, () => {
                        this.executePed();
                    })


                }
            });
        }

    }

    executePed(): void {
        Swal.fire({
            title: 'Ingrese una observación para el pedido',
            input: 'textarea',
            inputPlaceholder: 'Escriba aquí su observación (obligatorio)',
            showCancelButton: true,
            confirmButtonText: 'Continuar con el envío',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return '¡La observación es obligatoria!';
                }
                return null;
            },
            preConfirm: (observacion) => {
                this.showloader = true;
                const pedidoResponse: any = {
                    cliente: this.controlUnico.value,
                    enviar: true,
                    diasCredito: this.diasCredito,
                    montoFactura:this.montoFactura,
                    pedido: []
                };
                this.selection.selected.forEach((element: any) => {

                    element.pedido.forEach((info: any) => {
                        pedidoResponse.pedido.push({
                            cantidad: info.Unidades,
                            descuento: info.Descuento,
                            codigo: info.Codigo,
                        });
                    });
                });

                const pedidoApi: any[] = [];
                this.selection.selected.forEach((element: any) => {

                    element.pedido.forEach((info: any) => {
                        this.listProdutos.forEach((item: any) => {
                            if (info.Codigo === item.codigo) {
                                console.log('entre')
                                pedidoApi.push({
                                    cant: Number(info.Unidades),
                                    descuento: info.Descuento,
                                    codigo: item.codigo,
                                    descprov: item.descprov,
                                    descrip: item.descrip,
                                    dprice: item.dprice,
                                    dpriced: item.dpriced,
                                    encar: item.encar,
                                    existen: item.existen,
                                    img: item.img,
                                    lote: item.lote,
                                    nomprv: item.nomprv,
                                    oferta: item.oferta,
                                    oprecio: item.oprecio,
                                    opreciod: item.opreciod,
                                    vence: item.vence,
                                    barras: '',
                                    bssiniva: '',
                                    cod_cli: '',
                                    codigoa: '',
                                    dconiva: '',
                                    descu: info.Descuento,
                                    dsiniva: '',
                                    escala: '',
                                    id_pedido: '',
                                    iva: '',
                                    ivabs: '',
                                    ivad: '',
                                    preciod: '',
                                    preciosiniva: '',
                                    tasa: 0,
                                    tivabs: '',
                                    tivad: '',
                                    totalbs: '',
                                    totald: info.Precio,


                                });
                            }
                        })

                    });
                });

                this.clientesIndividual.forEach((item, index) => {
                    if (item.cliente === this.controlUnico.value) {
                        this.clienteData = item
                    }
                })

                const aux = {
                    'usuario': localStorage.getItem('usuario'),
                    'nombre': localStorage.getItem('nombre'),
                    'nomprv': localStorage.getItem('nomprv'),
                    'proveed': localStorage.getItem('proveed'),
                    'codigo_cliente': this.clienteData.cliente,
                    'nombre_cliente':  this.clienteData.nombre,
                    'Pedido': pedidoApi,
                    'diasCredito': this.diasCredito,
                    'montoFactura': this.montoFactura,
                    'emailSendUser': this.emailSendUser,
                    'emailSendProveed': this.emailSendProveed,
                    'observa': observacion
                }
                this.proteoServices.generate_ped_simple(pedidoResponse).subscribe((INFO: any) => {
                    const pedidosTem = INFO.data.agg_pedido;
                    let auxLet = true
                    pedidosTem.forEach((element: any) => {
                        if (element.result === false) {
                            auxLet = element.result;
                        }
                    });
                    if (auxLet) {
                        this.apiService.generate_ped(aux).subscribe((data: any) => {
                            Swal.fire({
                                title: "Pedidos generado",
                                text: "",
                                icon: "success"
                            });
                            this.clearUpload();
                        })
                    } else {
                        Swal.close()
                        Swal.fire({
                            icon: 'error',
                            title: 'Ocurrio un error al realizar la descarga',
                            text: 'intente nuevamente, si continua el error pongase en contacto con nosotros',
                            showCancelButton: false,
                        });
                        this.showloader = false;
                    }

                }, () => {
                    Swal.fire({
                        title: "Error al generar pedidos",
                        text: "",
                        icon: "error"
                    });
                    this.showloader = false;
                });
            }
        });


    }

    executeMultiPed(): void {
        Swal.fire({
            title: 'Ingrese una observación para el pedido',
            input: 'textarea',
            inputPlaceholder: 'Escriba aquí su observación (obligatorio)',
            showCancelButton: true,
            confirmButtonText: 'Continuar con el envío',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return '¡La observación es obligatoria!';
                }
                return null;
            },
            preConfirm: (observacion) => {
                this.emailSendUser = ''
                Swal.close()
                this.showloader = true;
                const pedidoResponse: any = {
                    pedidos: {}
                };

                this.selection.selected.forEach((element: any) => {
                    const codigoCliente = element.codigoCliente;
                    pedidoResponse.pedidos[codigoCliente] = {
                        diasCredito: 0, // Assuming 'diasCredito' exists in your 'element'
                        montoFactura: 0, // Assuming 'montoFactura' exists in your 'element'
                        pedido: []
                    };

                    element.pedido.forEach((info: any) => {
                        pedidoResponse.pedidos[codigoCliente].pedido.push({
                            cantidad: info.Unidades,
                            descuento: info.Descuento,
                            codigo: info.Codigo,
                        });
                    });
                });
                Swal.showLoading()



                this.proteoServices.generate_ped_multi(pedidoResponse).subscribe((INFO: any) => {
                    const pedidosTem = INFO.data.tem_carrito;
                    let auxLet = true
                    pedidosTem.forEach((element: any) => {
                        if (element.result === false) {
                            auxLet = element.result;
                        }
                    });
                    if (auxLet) {
                        this.selection.selected.forEach((element: any) => {
                            const codigoCliente = element.codigoCliente;
                            this.clientesIndividual.forEach((item, index) => {
                                if (item.cliente === codigoCliente) {
                                    this.clienteData = item
                                }
                            });
                            const pedidoApi: any[] = [];
                            console.log(element)
                            console.log(this.listProdutos)
                            element.pedido.forEach((info: any) => {
                                this.listProdutos.forEach((item: any) => {
                                    if (info.Codigo === item.codigo) {
                                        console.log(info)
                                        pedidoApi.push({
                                            cant: Number(info.Unidades),
                                            descuento: info.Descuento,
                                            codigo: item.codigo,
                                            descprov: item.descprov,
                                            descrip: item.descrip,
                                            dprice: item.dprice,
                                            dpriced: item.dpriced,
                                            encar: item.encar,
                                            existen: item.existen,
                                            img: item.img,
                                            lote: item.lote,
                                            nomprv: item.nomprv,
                                            oferta: item.oferta,
                                            oprecio: item.oprecio,
                                            opreciod: item.opreciod,
                                            vence: item.vence,
                                            barras: '',
                                            bssiniva: '',
                                            cod_cli: '',
                                            codigoa: '',
                                            dconiva: '',
                                            descu: '',
                                            dsiniva: '',
                                            escala: '',
                                            id_pedido: '',
                                            iva: '',
                                            ivabs: '',
                                            ivad: '',
                                            preciod: '',
                                            preciosiniva: '',
                                            tasa: 0,
                                            tivabs: '',
                                            tivad: '',
                                            totalbs: '',
                                            totald: info.Oferta,


                                        });
                                    }
                                })
                            });

                            this.proteoServices.get_client_data(codigoCliente).subscribe((data: any) => {
                                console.log(data);
                                if (data.data.datcli) {
                                    const aux2 = data.data.datcli;
                                    this.emailSendUser = aux2.email;
                                    this.emailSendProveed = localStorage.getItem('emailprov');
                                    const aux = {
                                        'usuario': localStorage.getItem('usuario'),
                                        'nombre': localStorage.getItem('nombre'),
                                        'nomprv': localStorage.getItem('nomprv'),
                                        'proveed': localStorage.getItem('proveed'),
                                        'codigo_cliente': this.clienteData.cliente,
                                        'nombre_cliente':  this.clienteData.nombre,
                                        'Pedido': pedidoApi,
                                        'diasCredito': this.diasCredito,
                                        'montoFactura': this.montoFactura,
                                        'emailSendUser': this.emailSendUser,
                                        'emailSendProveed': localStorage.getItem('emailprov'),
                                        'observa': observacion
                                    }
                                    this.apiService.generate_ped(aux).subscribe((data: any) => {
                                        console.log('pedido enviado')
                                        console.log(data)
                                        this.clearUpload();
                                    })
                                    Swal.fire({
                                        title: "Pedidos generado",
                                        text: "",
                                        icon: "success"
                                    });
                                } else {
                                    const aux = {
                                        'usuario': localStorage.getItem('usuario'),
                                        'nombre': localStorage.getItem('nombre'),
                                        'nomprv': localStorage.getItem('nomprv'),
                                        'proveed': localStorage.getItem('proveed'),
                                        'codigo_cliente': this.clienteData.cliente,
                                        'nombre_cliente':  this.clienteData.nombre,
                                        'Pedido': pedidoApi,
                                        'diasCredito': this.diasCredito,
                                        'montoFactura': this.montoFactura,
                                        'emailSendUser': this.emailSendUser,
                                        'emailSendProveed': localStorage.getItem('emailprov'),
                                        'observa': observacion
                                    }
                                    this.apiService.generate_ped(aux).subscribe((data: any) => {
                                        console.log('pedido enviado')
                                        console.log(data)
                                        this.clearUpload();
                                    })
                                    Swal.fire({
                                        title: "Pedidos generado",
                                        text: "",
                                        icon: "success"
                                    });
                                }
                            }, () => {
                                const aux = {
                                    'usuario': localStorage.getItem('usuario'),
                                    'nombre': localStorage.getItem('nombre'),
                                    'nomprv': localStorage.getItem('nomprv'),
                                    'proveed': localStorage.getItem('proveed'),
                                    'codigo_cliente': this.clienteData.cliente,
                                    'nombre_cliente':  this.clienteData.nombre,
                                    'Pedido': pedidoApi,
                                    'diasCredito': this.diasCredito,
                                    'montoFactura': this.montoFactura,
                                    'emailSendUser': this.emailSendUser,
                                    'emailSendProveed': localStorage.getItem('emailprov'),
                                    'observa': observacion
                                }
                                this.apiService.generate_ped(aux).subscribe((data: any) => {
                                    console.log('pedido enviado')
                                    console.log(data)
                                    this.clearUpload();
                                })
                                Swal.fire({
                                    title: "Pedidos generado",
                                    text: "",
                                    icon: "success"
                                });
                            })

                        });
                    } else {
                        Swal.close()
                        Swal.fire({
                            icon: 'error',
                            title: 'Ocurrio un error al realizar la descarga',
                            text: 'intente nuevamente, si continua el error pongase en contacto con nosotros',
                            showCancelButton: false,
                        });
                        this.showloader = false;
                    }



                }, () => {
                    Swal.fire({
                        title: "Error al generar pedidos",
                        text: "",
                        icon: "error"
                    });
                    this.showloader = false;
                })
            }
        })


    }

    clearAll() {
        Swal.fire({
            title: "Esta seguro que desea eliminar todos los pedidos?",
            text: "Tendra que cargarlos nuevamente",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, eliminar!",
        }).then((result) => {
            if (result.isConfirmed) {
                this.clearUpload();
                Swal.fire({
                    title: "Pedidos borrados",
                    text: "",
                    icon: "success"
                });
            }
        });
    }

    clearUpload() {
        this.dataSource= new MatTableDataSource<any>([]);
        this.selection= new SelectionModel<any>(true, []);
        this.listActive= [];
        this.controlCasaMatriz.setValue(null)
        this.controlUnico.setValue(null)
        this.emailSendUser = ''
        this.showloader = false;
    }

    getTotalIndividual() {
        let total = 0
        // console.log(this.dataSource)
        this.dataSource.forEach((element: any) => {
            total = this.getValor(element) + total
        })

        return total
    }

    getEmailIndiv(event: any) {
       console.log( event)
    }

    getAllPriceGroup(): number {
        let aux = 0;
        this.listActiveGrupo.forEach((element: any) => {
            aux = this.getprice(element) + aux
        });
        return aux
    }

    getValorTotalGrupo(element: any): number {
        console.log(element)
        const aux = element.pedido;
        let totalOferta = 0;
        aux.forEach((info: any) => {
            totalOferta = this.getprice(info) + totalOferta
        });
        return totalOferta;
    }

    protected readonly event = event;
}
