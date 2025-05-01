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
        MatCheckboxModule
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

    constructor(
        private proteoServices: ProteoService,
    ) {
    }

    ngOnInit() {
        this.loadAll();
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
                this.proteoServices.get_document_by_group(nombreUnico).subscribe(
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
                        codigoCliente: headersCodigos[index],
                        indexPedido: index,
                        pedido: [],
                    });
                }
            });

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
        let valueOfRetur = 0
        aux.forEach((info: any) => {
            valueOfRetur = Number(info.Precio) + valueOfRetur
        })

        return valueOfRetur
    }

    openDetail(info: any): void {
        this.listActive = info.pedido
    }

    generatePedido() {
        console.log(this.selection.selected)
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
                const pedidoResponse: any = {
                    pedidos: {} // Initialize 'pedidos' as an empty object
                };

                this.selection.selected.forEach((element: any) => {
                    const codigoCliente = element.codigoCliente;
                    if (!pedidoResponse.pedidos[codigoCliente]) {
                        pedidoResponse.pedidos[codigoCliente] = []; // Initialize the array if it doesn't exist
                    }

                    element.pedido.forEach((info: any) => {
                        pedidoResponse.pedidos[codigoCliente].push({
                            cantidad: info.Unidades,
                            descuento: info.Descuento,
                            codigo: info.Codigo,
                            diasCredito: 0,
                            montoFactura:0
                        });
                    });
                });
                Swal.showLoading()
                this.proteoServices.generate_ped_multi(pedidoResponse).subscribe((data: any) => {
                    console.log(data)
                    this.clearUpload();
                    Swal.fire({
                        title: "Pedidos generado",
                        text: "",
                        icon: "success"
                    });
                }, () => {
                    Swal.fire({
                        title: "Error al generar pedidos",
                        text: "",
                        icon: "error"
                    });
                })

            }
        });
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
    }

}
