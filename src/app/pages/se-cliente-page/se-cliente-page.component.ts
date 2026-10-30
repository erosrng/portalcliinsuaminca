import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subscription, debounceTime, startWith } from 'rxjs';
import Swal from 'sweetalert2';
import { API_URL } from '../../app.config';
import { ProgressRingComponent } from '../../components/progress-ring/progress-ring.component';

interface DocumentoConfig {
  key: string;
  nombre: string;
  descripcion: string;
  icono: string;
  requerido: boolean;
  multiple: boolean;
}

interface SeccionFormulario {
  id: string;
  numero: string;
  titulo: string;
}

interface ProgresoSeccion {
  porcentaje: number;
  completado: boolean;
  iniciado: boolean;
  faltantes: number;
  total: number;
  completos: number;
  vacios: number;
  invalidos: number;
}

@Component({
  selector: 'app-se-cliente-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ProgressRingComponent
  ],
  templateUrl: './se-cliente-page.component.html',
  styleUrl: './se-cliente-page.component.scss'
})
export class SeClientePageComponent implements OnInit, OnDestroy {
  readonly apiSolicitudCliente = `${API_URL}portalcli/solicitud_cliente`;
  // Modo prueba temporal: abrir /se-cliente?prueba=1 para saltar validaciones.
  readonly modoPrueba = new URLSearchParams(window.location.search).get('prueba') === '1';
  private readonly tokenModoPrueba = 'sol-2026-prueba-9f4c';
  // Endpoint del API de Insuaminca que recibe la solicitud. Ajustar aquí si cambia la ruta.
  readonly correo = 'Clientesinsuaminca@gmail.com';
  readonly anio = new Date().getFullYear();
  readonly tiposRif = ['J', 'V', 'E', 'P', 'G'];
  readonly tiposContribuyente = ['Ordinario', 'Formal', 'Especial'];
  readonly tiposCuenta = ['Ahorro', 'Corriente'];
  readonly tiposLocal = ['Propio', 'Alquilado'];
  readonly maxFileSize = 5 * 1024 * 1024;
  readonly maxAccionistas = 2;
  readonly maxArchivosPorDocumento = 5;
  readonly aceptaArchivos = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

  solicitudForm!: FormGroup;
  enviando = false;
  documentos: { [key: string]: File[] } = {};

  progresoGeneral = 0;
  formIniciado = false;
  pasoActual = 0;
  seccionesCompletas = 0;
  documentosCargados = 0;
  documentosRequeridos = 0;
  mensajeProgreso = 'Completa el formulario para enviar tu solicitud';
  progresoSecciones: { [id: string]: ProgresoSeccion } = {};
  private progresoSub?: Subscription;
  private borradorSub?: Subscription;
  private borradorListo = false;
  private readonly borradorKey = 'insuanet_solicitud_borrador_v1';
  private borradorDbPromise?: Promise<IDBDatabase>;

  readonly secciones: SeccionFormulario[] = [
    { id: 'datos-fiscales', numero: '01', titulo: 'Datos fiscales' },
    { id: 'accionistas', numero: '02', titulo: 'Accionistas y regentes' },
    { id: 'datos-comerciales', numero: '03', titulo: 'Bancos y datos comerciales' },
    { id: 'representantes', numero: '04', titulo: 'Representantes y pagos' },
    { id: 'referencias', numero: '05', titulo: 'Referencias' },
    { id: 'documentos', numero: '06', titulo: 'Documentos' },
    { id: 'confirmacion', numero: '07', titulo: 'Confirmación' }
  ];

  readonly documentosConfig: DocumentoConfig[] = [
    {
      key: 'permisoInstalacion',
      nombre: 'Permiso de Instalación',
      descripcion: 'Documento vigente en PDF o imagen.',
      icono: 'engineering',
      requerido: true,
      multiple: false
    },
    {
      key: 'permisoFuncionamiento',
      nombre: 'Permiso de Funcionamiento',
      descripcion: 'Documento vigente en PDF o imagen.',
      icono: 'verified',
      requerido: true,
      multiple: false
    },
    {
      key: 'codigoSicm',
      nombre: 'Código SICM',
      descripcion: 'Sistema Integral de Control de Medicamentos.',
      icono: 'qr_code_2',
      requerido: true,
      multiple: false
    },
    {
      key: 'codigoSica',
      nombre: 'Código SICA / Sunagro',
      descripcion: 'Sistema Integral de Control Agroalimentario (opcional).',
      icono: 'qr_code_scanner',
      requerido: false,
      multiple: false
    },
    {
      key: 'registroMercantil',
      nombre: 'Registro Mercantil y actas de asamblea',
      descripcion: 'Incluye las modificaciones. Puedes adjuntar varios archivos.',
      icono: 'account_balance',
      requerido: true,
      multiple: true
    },
    {
      key: 'rifEmpresa',
      nombre: 'RIF de la empresa',
      descripcion: 'Registro de Información Fiscal actualizado.',
      icono: 'receipt_long',
      requerido: true,
      multiple: false
    },
    {
      key: 'cedulaRepresentante',
      nombre: 'Cédula del representante legal',
      descripcion: 'Copia de identidad del o de los representantes legales.',
      icono: 'badge',
      requerido: true,
      multiple: true
    },
    {
      key: 'cedulaAccionistas',
      nombre: 'Cédula de los accionistas',
      descripcion: 'Copia de identidad de los socios de la empresa.',
      icono: 'groups',
      requerido: true,
      multiple: true
    },
    {
      key: 'rifRepresentante',
      nombre: 'RIF del representante legal',
      descripcion: 'Del o de los representantes legales.',
      icono: 'contact_page',
      requerido: true,
      multiple: true
    },
    {
      key: 'tituloFarmaceutico',
      nombre: 'Título universitario y cédula del regente (farmacéutico)',
      descripcion: 'Del regente o farmacéutico responsable.',
      icono: 'school',
      requerido: true,
      multiple: true
    },
    {
      key: 'referenciaBancaria',
      nombre: 'Referencia bancaria de la empresa',
      descripcion: 'Requisito interno.',
      icono: 'account_balance_wallet',
      requerido: true,
      multiple: false
    },
    {
      key: 'permisoSanitario',
      nombre: 'Permiso Sanitario',
      descripcion: 'Según aplique.',
      icono: 'health_and_safety',
      requerido: false,
      multiple: false
    }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.solicitudForm = this.fb.group({
      empresa: this.fb.group({
        razonSocial: ['', Validators.required],
        rifTipo: ['J', Validators.required],
        rifNumero: ['', [Validators.required, Validators.pattern('^[0-9]{7,10}$')]],
        direccionFiscal: ['', Validators.required],
        tipoContribuyente: ['Ordinario', Validators.required],
        telefono: ['', [Validators.required, Validators.pattern('^[0-9+()\\-\\s]{7,20}$')]],
        celular: ['', [Validators.required, Validators.pattern('^[0-9+()\\-\\s]{7,20}$')]],
        fax: [''],
        email: ['', [Validators.required, Validators.email]],
        estado: ['', Validators.required],
        expediente: ['', Validators.required],
        tomo: ['', Validators.required],
        fechaRegistro: ['', Validators.required],
        permisoInstalacion: ['', Validators.required],
        permisoFuncionamiento: ['', Validators.required],
        codigoSicm: ['', [Validators.required, Validators.pattern('^[A-Za-z0-9-]{3,20}$')]],
        codigoSica: ['']
      }),
      accionistas: this.fb.array([this.crearAccionista()]),
      regentes: this.fb.array([this.crearRegente()]),
      bancos: this.fb.group({
        banco1Nombre: ['', Validators.required],
        banco1Cuenta: ['', Validators.required],
        banco2Nombre: [''],
        banco2Cuenta: ['']
      }),
      comercial: this.fb.group({
        nombreComercial: ['', Validators.required],
        direccion: ['', Validators.required],
        estado: ['', Validators.required],
        municipio: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        telefono: ['', [Validators.required, Validators.pattern('^[0-9+()\\-\\s]{7,20}$')]],
        local: ['Propio', Validators.required],
        duracionContrato: [{ value: '', disabled: true }]
      }),
      arrendatarios: this.fb.array([this.crearArrendatario()]),
      representantes: this.fb.array([this.crearRepresentante()]),
      responsablesPago: this.fb.array([this.crearResponsablePago()]),
      fiadores: this.fb.array([this.crearFiador()]),
      ejecutivoVenta: [''],
      referenciasComerciales: this.fb.array([this.crearReferenciaComercial()]),
      referenciaBancaria: this.fb.group({
        entidad: ['', Validators.required],
        direccion: ['', Validators.required],
        tipoCuenta: ['', Validators.required],
        numeroCuenta: ['', Validators.required]
      }),
      aceptaTerminos: [false, Validators.requiredTrue],
      autorizaVerificacion: [false, Validators.requiredTrue]
    });

    this.aplicarValidadoresArrendatarios(false);

    this.progresoSub = this.solicitudForm.valueChanges
      .pipe(startWith(null), debounceTime(80))
      .subscribe(() => this.actualizarProgreso());

    this.borradorSub = this.solicitudForm.valueChanges
      .pipe(debounceTime(500))
      .subscribe(() => this.guardarBorradorFormulario());

    this.restaurarBorrador();
    this.actualizarProgreso();
  }

  ngOnDestroy(): void {
    this.progresoSub?.unsubscribe();
    this.borradorSub?.unsubscribe();
  }

  irAPaso(index: number): void {
    if (index < 0 || index >= this.secciones.length) {
      return;
    }


    this.pasoActual = index;
    this.guardarBorradorFormulario();
    setTimeout(() => {
      document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  pasoAnterior(): void {
    this.irAPaso(this.pasoActual - 1);
  }

  pasoSiguiente(): void {
    this.irAPaso(this.pasoActual + 1);
  }

  async limpiarBorrador(): Promise<void> {
    const resultado = await Swal.fire({
      icon: 'warning',
      title: '¿Limpiar borrador?',
      text: 'Se borrarán los datos y archivos guardados en este navegador.',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) {
      return;
    }

    this.eliminarBorrador();
    this.borradorListo = false;
    this.reiniciarFormulario();
    this.borradorListo = true;
  }

  private restaurarBorrador(): void {
    try {
      const guardado = localStorage.getItem(this.borradorKey);
      if (guardado) {
        const data = JSON.parse(guardado);
        if (data?.datos) {
          this.restaurarFormulario(data.datos);
          const paso = Number(data.paso);
          this.pasoActual = Number.isFinite(paso)
            ? Math.min(Math.max(paso, 0), this.secciones.length - 1)
            : 0;
        }
      }
    } catch (error) {
      console.warn('No se pudo restaurar el borrador:', error);
    }

    this.borradorListo = true;
    this.cargarArchivosBorrador();
    this.actualizarProgreso();
  }

  private restaurarFormulario(datos: any): void {
    if (!datos || typeof datos !== 'object') {
      return;
    }

    const lista = (valor: any): any[] => {
      if (Array.isArray(valor)) {
        return valor;
      }
      return valor && typeof valor === 'object' ? [valor] : [];
    };

    const {
      accionistas,
      regentes,
      representantes,
      responsablesPago,
      fiadores,
      arrendatarios,
      referenciasComerciales,
      ...resto
    } = datos;

    const regentesData = lista(regentes ?? datos.regente);
    const representantesData = lista(representantes ?? datos.representante);
    const responsablesData = lista(responsablesPago ?? datos.pagos);
    const fiadoresData = lista(fiadores ?? datos.fiador);
    const arrendatariosData = lista(arrendatarios ?? datos.arrendatario);

    this.solicitudForm.patchValue(resto);
    this.restaurarArray('accionistas', lista(accionistas), () => this.crearAccionista());
    this.restaurarArray('regentes', regentesData, () => this.crearRegente());
    this.restaurarArray('representantes', representantesData, () => this.crearRepresentante());
    this.restaurarArray('responsablesPago', responsablesData, () => this.crearResponsablePago());
    this.restaurarArray('fiadores', fiadoresData, () => this.crearFiador());
    this.restaurarArray('arrendatarios', arrendatariosData, () => this.crearArrendatario());
    this.restaurarArray('referenciasComerciales', lista(referenciasComerciales), () => this.crearReferenciaComercial());

    const local = this.solicitudForm.get('comercial.local')?.value;
    const duracion = this.solicitudForm.get('comercial.duracionContrato');
    if (local === 'Alquilado') {
      duracion?.setValidators(Validators.required);
      duracion?.enable();
    } else {
      duracion?.clearValidators();
      duracion?.disable();
    }
    duracion?.updateValueAndValidity();
    this.aplicarValidadoresArrendatarios(local === 'Alquilado');
    if (this.datosConContenido(this.solicitudForm.getRawValue())) {
      this.solicitudForm.markAsDirty();
    }
  }

  private datosConContenido(valor: any, ruta = ''): boolean {
    if (valor === null || valor === undefined) {
      return false;
    }

    if (typeof valor === 'boolean') {
      return valor;
    }

    if (Array.isArray(valor)) {
      return valor.some((item, indice) => this.datosConContenido(item, `${ruta}.${indice}`));
    }

    if (typeof valor === 'object') {
      return Object.entries(valor).some(([campo, contenido]) => {
        const nuevaRuta = ruta ? `${ruta}.${campo}` : campo;
        return this.datosConContenido(contenido, nuevaRuta);
      });
    }

    const texto = String(valor).trim();
    if (texto === '') {
      return false;
    }
    if (ruta === 'empresa.rifTipo' && texto === 'J') {
      return false;
    }
    if (ruta === 'empresa.tipoContribuyente' && texto === 'Ordinario') {
      return false;
    }
    if (ruta === 'comercial.local' && texto === 'Propio') {
      return false;
    }
    return true;
  }

  private restaurarArray(nombre: string, valores: any, crear: () => FormGroup): void {
    const array = this.solicitudForm.get(nombre) as FormArray;
    array.clear();

    let lista = Array.isArray(valores) ? valores : [];
    if (nombre === 'accionistas') {
      lista = lista.slice(0, this.maxAccionistas);
    }

    if (lista.length === 0) {
      array.push(crear());
      return;
    }

    lista.forEach(valor => {
      const grupo = crear();
      if (valor && typeof valor === 'object') {
        grupo.patchValue(valor);
      }
      array.push(grupo);
    });
  }

  private guardarBorradorFormulario(): void {
    if (!this.borradorListo) {
      return;
    }

    if (
      !this.datosConContenido(this.solicitudForm.getRawValue()) &&
      !Object.values(this.documentos).some(archivos => archivos.length > 0)
    ) {
      try {
        localStorage.removeItem(this.borradorKey);
      } catch (error) {
        console.warn('No se pudo limpiar el borrador vacío:', error);
      }
      return;
    }

    try {
      localStorage.setItem(this.borradorKey, JSON.stringify({
        datos: this.solicitudForm.getRawValue(),
        paso: this.pasoActual,
        actualizado: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('No se pudo guardar el borrador:', error);
    }
  }

  private abrirBorradorDB(): Promise<IDBDatabase> {
    if (this.borradorDbPromise) {
      return this.borradorDbPromise;
    }

    this.borradorDbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB no disponible'));
        return;
      }

      const request = indexedDB.open('insuanet_solicitud', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('borrador')) {
          db.createObjectStore('borrador');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.borradorDbPromise;
  }

  private guardarArchivosBorrador(): void {
    if (!this.borradorListo) {
      return;
    }

    this.abrirBorradorDB().then(db => {
      const tx = db.transaction('borrador', 'readwrite');
      const store = tx.objectStore('borrador');
      if (Object.values(this.documentos).some(archivos => archivos.length > 0)) {
        store.put(this.documentos, 'archivos');
      } else {
        store.delete('archivos');
      }
    }).catch(() => {});
  }

  private cargarArchivosBorrador(): void {
    this.abrirBorradorDB().then(db => new Promise<any>((resolve, reject) => {
      const tx = db.transaction('borrador', 'readonly');
      const request = tx.objectStore('borrador').get('archivos');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    })).then(data => {
      if (data && typeof data === 'object') {
        this.documentos = data;
        this.actualizarProgreso();
      }
    }).catch(() => {});
  }

  private eliminarBorrador(): void {
    try {
      localStorage.removeItem(this.borradorKey);
    } catch (error) {
      console.warn('No se pudo eliminar el borrador:', error);
    }

    this.abrirBorradorDB().then(db => {
      const tx = db.transaction('borrador', 'readwrite');
      tx.objectStore('borrador').delete('archivos');
    }).catch(() => {});
  }

  private reiniciarFormulario(): void {
    this.solicitudForm.reset({
      empresa: { rifTipo: 'J', tipoContribuyente: 'Ordinario' },
      comercial: { local: 'Propio' }
    });

    this.restaurarArray('accionistas', [], () => this.crearAccionista());
    this.restaurarArray('regentes', [], () => this.crearRegente());
    this.restaurarArray('representantes', [], () => this.crearRepresentante());
    this.restaurarArray('responsablesPago', [], () => this.crearResponsablePago());
    this.restaurarArray('fiadores', [], () => this.crearFiador());
    this.restaurarArray('arrendatarios', [], () => this.crearArrendatario());
    this.restaurarArray('referenciasComerciales', [], () => this.crearReferenciaComercial());

    const duracion = this.solicitudForm.get('comercial.duracionContrato');
    duracion?.clearValidators();
    duracion?.reset('');
    duracion?.disable();
    duracion?.updateValueAndValidity();

    this.aplicarValidadoresArrendatarios(false);
    this.documentos = {};
    this.pasoActual = 0;
    this.actualizarProgreso();
  }

  get accionistas(): FormArray {
    return this.solicitudForm.get('accionistas') as FormArray;
  }

  get referenciasComerciales(): FormArray {
    return this.solicitudForm.get('referenciasComerciales') as FormArray;
  }

  get regentes(): FormArray {
    return this.solicitudForm.get('regentes') as FormArray;
  }

  get representantes(): FormArray {
    return this.solicitudForm.get('representantes') as FormArray;
  }

  get responsablesPago(): FormArray {
    return this.solicitudForm.get('responsablesPago') as FormArray;
  }

  get fiadores(): FormArray {
    return this.solicitudForm.get('fiadores') as FormArray;
  }

  get arrendatarios(): FormArray {
    return this.solicitudForm.get('arrendatarios') as FormArray;
  }

  private crearAccionista(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      cargo: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9+()\\-\\s]{7,20}$')]]
    });
  }

  private crearReferenciaComercial(): FormGroup {
    return this.fb.group({
      entidad: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9+()\\-\\s]{7,20}$')]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private crearRegente(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      titulo: ['', Validators.required],
      rif: [''],
      matricula: ['', Validators.required],
      colfar: [''],
      inprefar: ['']
    });
  }

  private crearRepresentante(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      rif: [''],
      cargo: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9+()\\-\\s]{7,20}$')]]
    });
  }

  private crearResponsablePago(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      cedula: ['', Validators.required],
      cargo: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9+()\\-\\s]{7,20}$')]]
    });
  }

  private crearFiador(): FormGroup {
    return this.fb.group({
      nombre: [''],
      cedula: [''],
      telefono: ['']
    });
  }

  private crearArrendatario(): FormGroup {
    return this.fb.group({
      arrendador: [''],
      cedula: [''],
      cargo: [''],
      telefono: ['']
    });
  }

  agregarAccionista(): void {
    if (this.accionistas.length >= this.maxAccionistas) {
      Swal.fire({
        icon: 'info',
        title: 'Límite de accionistas',
        text: `Puedes registrar hasta ${this.maxAccionistas} accionistas por ahora.`,
        confirmButtonText: 'Entendido'
      });
      return;
    }
    this.accionistas.push(this.crearAccionista());
  }

  eliminarAccionista(index: number): void {
    if (this.accionistas.length === 1) {
      return;
    }
    this.accionistas.removeAt(index);
  }

  agregarRegente(): void {
    this.regentes.push(this.crearRegente());
  }

  eliminarRegente(index: number): void {
    if (this.regentes.length === 1) {
      return;
    }
    this.regentes.removeAt(index);
  }

  agregarRepresentante(): void {
    this.representantes.push(this.crearRepresentante());
  }

  eliminarRepresentante(index: number): void {
    if (this.representantes.length === 1) {
      return;
    }
    this.representantes.removeAt(index);
  }

  agregarResponsablePago(): void {
    this.responsablesPago.push(this.crearResponsablePago());
  }

  eliminarResponsablePago(index: number): void {
    if (this.responsablesPago.length === 1) {
      return;
    }
    this.responsablesPago.removeAt(index);
  }

  agregarFiador(): void {
    this.fiadores.push(this.crearFiador());
  }

  eliminarFiador(index: number): void {
    if (this.fiadores.length === 1) {
      return;
    }
    this.fiadores.removeAt(index);
  }

  agregarArrendatario(): void {
    this.arrendatarios.push(this.crearArrendatario());
    this.aplicarValidadoresArrendatarios(
      this.solicitudForm.get('comercial.local')?.value === 'Alquilado'
    );
  }

  eliminarArrendatario(index: number): void {
    if (this.arrendatarios.length === 1) {
      return;
    }
    this.arrendatarios.removeAt(index);
  }

  agregarReferenciaComercial(): void {
    this.referenciasComerciales.push(this.crearReferenciaComercial());
  }

  eliminarReferenciaComercial(index: number): void {
    if (this.referenciasComerciales.length === 1) {
      return;
    }
    this.referenciasComerciales.removeAt(index);
  }

  onLocalChange(valor: string): void {
    const duracion = this.solicitudForm.get('comercial.duracionContrato');
    if (!duracion) {
      return;
    }

    const esAlquilado = valor === 'Alquilado';

    if (esAlquilado) {
      duracion.setValidators(Validators.required);
      duracion.enable();
    } else {
      duracion.clearValidators();
      duracion.reset('');
      duracion.disable();
      this.arrendatarios.clear();
      this.arrendatarios.push(this.crearArrendatario());
    }
    duracion.updateValueAndValidity();
    this.aplicarValidadoresArrendatarios(esAlquilado);
  }

  private aplicarValidadoresArrendatarios(esAlquilado: boolean): void {
    const campos = ['arrendador', 'cedula', 'telefono'];

    (this.arrendatarios.controls as FormGroup[]).forEach(grupo => {
      campos.forEach(campo => {
        const control = grupo.get(campo);
        if (!control) {
          return;
        }

        if (!esAlquilado) {
          control.clearValidators();
          control.disable();
        } else if (campo === 'telefono') {
          control.setValidators([
            Validators.required,
            Validators.pattern('^[0-9+()\\-\\s]{7,20}$')
          ]);
          control.enable();
        } else {
          control.setValidators(Validators.required);
          control.enable();
        }

        control.updateValueAndValidity();
      });
    });
  }

  tieneError(path: string, error: string): boolean {
    const control = this.solicitudForm.get(path);
    return !!control && control.hasError(error) && (control.touched || control.dirty);
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.isComposing || keyboardEvent.ctrlKey || keyboardEvent.altKey || keyboardEvent.metaKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const tag = target.tagName.toLowerCase();
    if (tag === 'button' || tag === 'a' || target.closest('button, a')) {
      return;
    }

    if (tag !== 'input' && tag !== 'textarea') {
      return;
    }

    const field = target as HTMLInputElement | HTMLTextAreaElement;
    if (field.disabled || (field as HTMLInputElement).type === 'file') {
      return;
    }

    if (tag === 'textarea' && keyboardEvent.shiftKey) {
      return;
    }

    const form = target.closest('form');
    if (!form) {
      return;
    }

    const focusables = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(element => {
      if (element === field) {
        return true;
      }
      return element.getClientRects().length > 0;
    });

    const index = focusables.indexOf(field);
    if (index === -1) {
      return;
    }

    const next = focusables
      .slice(index + 1)
      .find(element => {
        if (element === field || element.hasAttribute('disabled')) {
          return false;
        }
        if ((element as HTMLInputElement).type === 'file') {
          return false;
        }
        return element.getClientRects().length > 0;
      });

    event.preventDefault();

    if (next) {
      next.focus();
      return;
    }

    form.querySelector<HTMLButtonElement>('.btn-submit')?.focus();
  }

  irASeccion(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  progresoDe(id: string): ProgresoSeccion {
    return this.progresoSecciones[id] ?? {
      porcentaje: 0,
      completado: false,
      iniciado: false,
      faltantes: 0,
      total: 0,
      completos: 0,
      vacios: 0,
      invalidos: 0
    };
  }

  textoFaltantes(id: string): string {
    const progreso = this.progresoDe(id);

    if (progreso.completado) {
      return 'Sección completa';
    }

    const partes: string[] = [];
    if (progreso.invalidos > 0) {
      partes.push(
        `${progreso.invalidos} campo${progreso.invalidos === 1 ? '' : 's'} con error`
      );
    }
    if (progreso.vacios > 0) {
      if (id === 'documentos') {
        partes.push(
          `${progreso.vacios} documento${progreso.vacios === 1 ? '' : 's'} pendiente${
            progreso.vacios === 1 ? '' : 's'
          }`
        );
      } else {
        partes.push(
          `${progreso.vacios} campo${progreso.vacios === 1 ? '' : 's'} pendiente${
            progreso.vacios === 1 ? '' : 's'
          }`
        );
      }
    }

    return partes.length > 0 ? partes.join(' · ') : 'Sección incompleta';
  }

  iconoEstado(id: string): string {
    const progreso = this.progresoDe(id);
    if (progreso.completado) {
      return 'check_circle';
    }
    return progreso.invalidos > 0 ? 'error_outline' : 'pending';
  }

  private actualizarProgreso(): void {
    if (!this.solicitudForm) {
      return;
    }

    this.formIniciado =
      this.solicitudForm.dirty ||
      Object.values(this.documentos).some(archivos => archivos.length > 0);

    const progreso: { [id: string]: ProgresoSeccion } = {
      'datos-fiscales': this.calcularProgreso(this.controlesEmpresa()),
      accionistas: this.calcularProgreso(this.controlesAccionistas()),
      'datos-comerciales': this.calcularProgreso(this.controlesComerciales()),
      representantes: this.calcularProgreso(this.controlesRepresentantes()),
      referencias: this.calcularProgreso(this.controlesReferencias()),
      documentos: this.calcularProgresoDocumentos(),
      confirmacion: this.calcularProgreso([
        this.solicitudForm.get('aceptaTerminos'),
        this.solicitudForm.get('autorizaVerificacion')
      ])
    };

    this.progresoSecciones = progreso;

    const resumen = Object.values(progreso).reduce(
      (acumulado, seccion) => {
        acumulado.total += seccion.total;
        acumulado.completos += seccion.completos;
        return acumulado;
      },
      { total: 0, completos: 0 }
    );

    this.progresoGeneral = resumen.total
      ? Math.round((resumen.completos / resumen.total) * 100)
      : 0;
    this.seccionesCompletas = Object.values(progreso).filter(seccion => seccion.completado).length;
    this.documentosRequeridos = this.documentosConfig.filter(documento => documento.requerido).length;
    this.documentosCargados = this.documentosConfig.filter(
      documento => documento.requerido && this.tieneArchivos(documento.key)
    ).length;
    this.mensajeProgreso = this.obtenerMensajeProgreso(this.progresoGeneral);
  }

  private obtenerMensajeProgreso(porcentaje: number): string {
    if (porcentaje >= 100) {
      return '¡Todo listo! Ya puedes enviar tu solicitud';
    }
    if (porcentaje >= 75) {
      return 'Estás muy cerca de terminar';
    }
    if (porcentaje >= 50) {
      return 'Vas por buen camino';
    }
    if (porcentaje >= 25) {
      return 'Buen avance, sigue así';
    }
    if (porcentaje > 0) {
      return 'Comienza a completar tu solicitud';
    }
    return 'Completa el formulario para enviar tu solicitud';
  }

  private calcularProgreso(controles: Array<AbstractControl | null>): ProgresoSeccion {
    const activos = controles.filter(
      (control): control is AbstractControl => !!control && control.enabled
    );
    const total = activos.length;
    const completos = activos.filter(control => this.controlCompletado(control)).length;
    const iniciados = activos.filter(control => this.controlIniciado(control)).length;
    const invalidos = activos.filter(
      control => !this.controlCompletado(control) && this.tieneValor(control) && control.invalid
    ).length;
    const vacios = Math.max(0, total - completos - invalidos);
    const porcentaje = total ? Math.round((completos / total) * 100) : 100;

    return {
      porcentaje,
      completado: total > 0 && completos === total,
      iniciado: iniciados > 0,
      faltantes: total - completos,
      total,
      completos,
      vacios,
      invalidos
    };
  }

  private controlCompletado(control: AbstractControl): boolean {
    if (!control.valid || !this.tieneValor(control)) {
      return false;
    }
    return this.formIniciado || control.dirty || control.touched;
  }

  private controlIniciado(control: AbstractControl): boolean {
    if (!this.tieneValor(control)) {
      return false;
    }
    return this.formIniciado || control.dirty || control.touched;
  }

  private calcularProgresoDocumentos(): ProgresoSeccion {
    const requeridos = this.documentosConfig.filter(documento => documento.requerido);
    const total = requeridos.length;
    const completos = requeridos.filter(documento => this.tieneArchivos(documento.key)).length;
    const porcentaje = total ? Math.round((completos / total) * 100) : 100;

    return {
      porcentaje,
      completado: total === completos,
      iniciado: completos > 0,
      faltantes: total - completos,
      total,
      completos,
      vacios: total - completos,
      invalidos: 0
    };
  }

  private controlesEmpresa(): Array<AbstractControl | null> {
    const claves = [
      'razonSocial',
      'rifTipo',
      'rifNumero',
      'direccionFiscal',
      'tipoContribuyente',
      'telefono',
      'celular',
      'email',
      'estado',
      'expediente',
      'tomo',
      'fechaRegistro',
      'permisoInstalacion',
      'permisoFuncionamiento',
      'codigoSicm'
    ];

    return claves.map(clave => this.solicitudForm.get(`empresa.${clave}`));
  }

  private controlesAccionistas(): Array<AbstractControl | null> {
    const controles: Array<AbstractControl | null> = [];

    (this.accionistas.controls as FormGroup[]).forEach(accionista => {
      ['nombre', 'cedula', 'cargo', 'telefono'].forEach(clave => {
        controles.push(accionista.get(clave));
      });
    });

    (this.regentes.controls as FormGroup[]).forEach(regente => {
      ['nombre', 'cedula', 'titulo', 'matricula'].forEach(clave => {
        controles.push(regente.get(clave));
      });
    });

    return controles;
  }

  private controlesComerciales(): Array<AbstractControl | null> {
    const controles: Array<AbstractControl | null> = [
      ...['banco1Nombre', 'banco1Cuenta'].map(clave =>
        this.solicitudForm.get(`bancos.${clave}`)
      ),
      ...[
        'nombreComercial',
        'direccion',
        'estado',
        'municipio',
        'email',
        'telefono',
        'local'
      ].map(clave => this.solicitudForm.get(`comercial.${clave}`))
    ];

    if (this.solicitudForm.get('comercial.local')?.value === 'Alquilado') {
      controles.push(this.solicitudForm.get('comercial.duracionContrato'));
      (this.arrendatarios.controls as FormGroup[]).forEach(arrendatario => {
        ['arrendador', 'cedula', 'telefono'].forEach(clave => {
          controles.push(arrendatario.get(clave));
        });
      });
    }

    return controles;
  }

  private controlesRepresentantes(): Array<AbstractControl | null> {
    const controles: Array<AbstractControl | null> = [];

    (this.representantes.controls as FormGroup[]).forEach(representante => {
      ['nombre', 'cedula', 'cargo', 'telefono'].forEach(clave => {
        controles.push(representante.get(clave));
      });
    });

    (this.responsablesPago.controls as FormGroup[]).forEach(responsable => {
      ['nombre', 'cedula', 'cargo', 'telefono'].forEach(clave => {
        controles.push(responsable.get(clave));
      });
    });

    return controles;
  }

  private controlesReferencias(): Array<AbstractControl | null> {
    const controles: Array<AbstractControl | null> = [];

    (this.referenciasComerciales.controls as FormGroup[]).forEach(referencia => {
      ['entidad', 'direccion', 'telefono', 'email'].forEach(clave => {
        controles.push(referencia.get(clave));
      });
    });

    ['entidad', 'direccion', 'tipoCuenta', 'numeroCuenta'].forEach(clave => {
      controles.push(this.solicitudForm.get(`referenciaBancaria.${clave}`));
    });

    return controles;
  }

  private tieneValor(control: AbstractControl): boolean {
    const valor = control.value;

    if (typeof valor === 'boolean') {
      return valor;
    }
    if (Array.isArray(valor)) {
      return valor.length > 0;
    }
    if (valor === null || valor === undefined) {
      return false;
    }
    return String(valor).trim() !== '';
  }

  onFileSelected(event: Event, documento: DocumentoConfig, input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (files.length === 0) {
      return;
    }

    let actuales = [...(this.documentos[documento.key] ?? [])];
    let seAgrego = false;

    for (const file of files) {
      if (!this.archivoValido(file)) {
        continue;
      }

      if (!documento.multiple) {
        actuales = [file];
        seAgrego = true;
        break;
      }

      if (actuales.length >= this.maxArchivosPorDocumento) {
        Swal.fire({
          icon: 'info',
          title: 'Límite alcanzado',
          text: `Puedes adjuntar hasta ${this.maxArchivosPorDocumento} archivos por documento.`,
          confirmButtonText: 'Entendido'
        });
        break;
      }

      const duplicado = actuales.some(
        archivo => archivo.name === file.name && archivo.size === file.size
      );

      if (!duplicado) {
        actuales.push(file);
        seAgrego = true;
      }
    }

    if (seAgrego) {
      this.documentos = { ...this.documentos, [documento.key]: actuales };
      this.actualizarProgreso();
      this.guardarArchivosBorrador();
    }
  }

  private archivoValido(file: File): boolean {
    const extensionValida = /\.(pdf|jpe?g|png)$/i.test(file.name);

    if (!extensionValida) {
      Swal.fire({
        icon: 'error',
        title: 'Formato no permitido',
        text: 'Solo se permiten archivos PDF, JPG, JPEG o PNG.',
        confirmButtonText: 'Entendido'
      });
      return false;
    }

    if (file.size > this.maxFileSize) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo demasiado grande',
        text: `El archivo "${file.name}" supera el máximo de 5 MB.`,
        confirmButtonText: 'Entendido'
      });
      return false;
    }

    return true;
  }

  quitarArchivo(key: string, index: number): void {
    const actuales = [...(this.documentos[key] ?? [])];
    actuales.splice(index, 1);
    this.documentos = { ...this.documentos, [key]: actuales };
    this.actualizarProgreso();
    this.guardarArchivosBorrador();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  documentosFaltantes(): DocumentoConfig[] {
    return this.documentosConfig.filter(
      documento => documento.requerido && (this.documentos[documento.key]?.length ?? 0) === 0
    );
  }

  tieneArchivos(key: string): boolean {
    return (this.documentos[key]?.length ?? 0) > 0;
  }

  enviarSolicitud(): void {
    if (this.enviando) {
      return;
    }

    this.solicitudForm.markAllAsTouched();

    if (!this.modoPrueba && this.solicitudForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Revisa los campos marcados antes de enviar la solicitud.',
        confirmButtonText: 'Entendido'
      });
      this.irAlPrimerError();
      return;
    }

    const faltantes = this.documentosFaltantes();
    if (!this.modoPrueba && faltantes.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan documentos',
        html: `<p>Adjunta los siguientes documentos obligatorios:</p><ul style="text-align:left;margin:1rem 0 0 1.4rem">${faltantes
          .map(documento => `<li>${documento.nombre}</li>`)
          .join('')}</ul>`,
        confirmButtonText: 'Entendido'
      });
      this.irASeccion('documentos');
      return;
    }

    const datos = this.construirPayload();
    const formData = new FormData();
    formData.append('datos', JSON.stringify(datos));
    formData.append('rif', datos.empresa.rif);
    formData.append('razon_social', datos.empresa.razonSocial);
    formData.append('email', datos.empresa.email);
    formData.append('telefono', datos.empresa.telefono);
    formData.append('origen', 'portal-web');
    if (this.modoPrueba) {
      formData.append('modo_prueba', this.tokenModoPrueba);
    }

    this.documentosConfig.forEach(documento => {
      (this.documentos[documento.key] ?? []).forEach(archivo => {
        formData.append(`documentos[${documento.key}][]`, archivo, archivo.name);
      });
    });

    this.enviando = true;

    this.http.post(this.apiSolicitudCliente, formData).subscribe({
      next: (response: any) => {
        this.enviando = false;
        const fallo =
          response?.success === false ||
          response?.status === false ||
          !!response?.error;

        if (fallo) {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo enviar',
            text:
              response?.message ||
              response?.mensaje ||
              response?.error ||
              'Ocurrió un error al registrar la solicitud. Intenta nuevamente.',
            confirmButtonText: 'Entendido'
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: '¡Solicitud enviada!',
          text:
            response?.message ||
            response?.mensaje ||
            'Recibimos tu solicitud. Nuestro equipo revisará la información y se comunicará contigo.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.borradorListo = false;
          this.eliminarBorrador();
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        this.enviando = false;
        console.error('Error al enviar la solicitud de cliente:', error);
        Swal.fire({
          icon: 'error',
          title: 'No se pudo enviar',
          text:
            error?.error?.message ||
            error?.error?.mensaje ||
            error?.error?.error ||
            'No pudimos conectar con el servicio. Intenta nuevamente en unos minutos.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  private construirPayload(): any {
    const datos = this.solicitudForm.getRawValue();

    return {
      ...datos,
      empresa: {
        ...datos.empresa,
        rif: `${datos.empresa.rifTipo}-${datos.empresa.rifNumero}`
      },
      fechaSolicitud: new Date().toISOString(),
      origen: 'portal-web',
      documentos: this.documentosConfig.map(documento => ({
        tipo: documento.key,
        nombre: documento.nombre,
        archivos: (this.documentos[documento.key] ?? []).map(archivo => ({
          nombre: archivo.name,
          tamano: archivo.size,
          tipo: archivo.type
        }))
      }))
    };
  }

  private irAlPrimerError(): void {
    setTimeout(() => {
      const primerError = document.querySelector(
        '.form-card .mat-mdc-form-field.ng-invalid, .form-card .mat-mdc-checkbox.ng-invalid'
      );
      primerError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
}
