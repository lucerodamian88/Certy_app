// Lógica del Asistente de Redeterminación de Precios

document.addEventListener('DOMContentLoaded', () => {

  const formContainer = document.querySelector('.form-container');
  if (formContainer) formContainer.classList.add('loaded');

  const form = document.getElementById('formAsistente');
  if (form) form.addEventListener('submit', manejarEnvioSolicitud);

  const genSaltosBtn = document.getElementById('generarSaltos');
  if (genSaltosBtn) genSaltosBtn.addEventListener('click', generarSaltos);

  const limpiarBtn = document.getElementById('limpiarFormulario');
  if (limpiarBtn) limpiarBtn.addEventListener('click', limpiarFormulario);

  const empresaSel = document.getElementById('empresa');
  if (empresaSel) {
    cargarDatosEmpresas().catch(err => console.error('Error al precargar empresas', err));
    empresaSel.addEventListener('change', e => manejarCambioEmpresa(e.target.value));
  }

  const aprobadaPorSel = document.getElementById('aprobadaPor');
  if (aprobadaPorSel) {
    aprobadaPorSel.addEventListener('change', e => actualizarAprobadaPor(e.target.value));
    actualizarAprobadaPor(aprobadaPorSel.value);
  }

  const buscarBtn = document.getElementById('buscarResolucion');
  if (buscarBtn) buscarBtn.addEventListener('click', abrirDigestoResolucion);

  inicializarPoliza();
  inicializarMontoRedeterminacion();
});

function generarSaltos() {
  const cantidadEl = document.getElementById('cantidadSaltos');
  const cont = document.getElementById('saltosContainer');
  if (!cantidadEl || !cont) return;
  const cantidad = parseInt(cantidadEl.value, 10);
  cont.innerHTML = '';
  if (isNaN(cantidad) || cantidad < 1 || cantidad > 20) {
    alert('Ingrese una cantidad válida de saltos (1-20).');
    return;
  }
  for (let i = 0; i < cantidad; i++) {
    const row = document.createElement('div');
    row.className = 'salto-row';
    const etiqueta = i === 0 ? 'Salto inicial' : `${ordinalesMasc[i]} Salto`;
    row.innerHTML = `
      <span>${etiqueta}</span>
      <div class="salto-porcentaje">
        <input type="text" class="salto-acum" placeholder="NN,NN" inputmode="decimal" pattern="\\d+(?:[.,]\\d{1,2})?">
        <span class="porcentaje-signo" aria-hidden="true">%</span>
      </div>
      <input type="text" class="salto-fecha" placeholder="MM/AA">
    `;
    cont.appendChild(row);
  }
  actualizarCalculosPoliza();
}

function limpiarFormulario() {
  const form = document.getElementById('formAsistente');
  const cont = document.getElementById('saltosContainer');
  if (form) form.reset();
  if (cont) cont.innerHTML = '';
  ocultarEstadoSolicitud();
  const empresa = document.getElementById('empresa');
  if (empresa) toggleEmpresaOtro(empresa.value);
  limpiarCamposEmpresa();
  reiniciarPolizaDesdeFormulario();
  const aprobadaPor = document.getElementById('aprobadaPor');
  if (aprobadaPor) actualizarAprobadaPor(aprobadaPor.value);
  const montoLetras = document.getElementById('montoRedeterminacionLetras');
  if (montoLetras) montoLetras.value = '';
  actualizarCalculosPoliza();
}

function toggleEmpresaOtro(val) {
  const lbl = document.getElementById('empresaOtroLabel');
  if (!lbl) return;
  if (val === 'OTRO') lbl.classList.remove('oculto');
  else lbl.classList.add('oculto');
}

function togglePoliza(activa) {
  const panel = polizaContext && polizaContext.section
    ? polizaContext.section
    : document.getElementById('polizaSection');
  if (!panel) return;
  if (activa) {
    panel.classList.remove('oculto');
    panel.setAttribute('aria-hidden', 'false');
    sincronizarMontoConAdicionales({ formatear: true });
    actualizarCalculosPoliza();
  } else {
    panel.classList.add('oculto');
    panel.setAttribute('aria-hidden', 'true');
  }
}

function inicializarPoliza() {
  const form = document.getElementById('formAsistente');
  const section = document.getElementById('polizaSection');
  if (!form || !section) return;

  polizaContext = {
    form,
    section,
    hastaInput: document.getElementById('cambiosHasta'),
    montoContrato: document.getElementById('polizaMontoContrato'),
    montoConAdicionales: document.getElementById('polizaMontoConAdicionales'),
    montoAcumulado: document.getElementById('polizaMontoObraAcumulada'),
    saldoAnticipo: document.getElementById('polizaSaldoAnticipo'),
    saldoNeto: document.getElementById('polizaSaldoNeto'),
    ultimoFriValor: document.getElementById('polizaUltimoFriValor'),
    ultimoFriAprobadoFecha: document.getElementById('polizaUltimoFriAprobadoFecha'),
    ultimoFriAprobadoValor: document.getElementById('polizaUltimoFriAprobadoValor'),
    incrementoFri: document.getElementById('polizaIncrementoFri'),
    baseContratacion: document.getElementById('polizaBaseContratacion'),
    montoGarantizarSaldo: document.getElementById('polizaMontoGarantizarSaldoObra'),
    certificadoRp: document.getElementById('polizaCertificadoRp'),
    montoGarantizarRp: document.getElementById('polizaMontoGarantizarRp'),
    montoTotal: document.getElementById('polizaMontoTotalGarantizar'),
    montoClausulaLetras: document.getElementById('polizaMontoClausulaLetras'),
    tipoPoliza: document.getElementById('polizaQueCorresponde'),
    montoPoliza: document.getElementById('polizaMontoPoliza'),
    hastaTargets: Array.from(document.querySelectorAll('.poliza-hasta')),
    calcularRadios: Array.from(document.querySelectorAll('input[name="calcularPoliza"]')),
    errorContenedor: document.getElementById('polizaError'),
    errorTexto: document.getElementById('polizaErrorTexto'),
    montoConAdicionalesEditado: false
  };

  const camposMoneda = [
    polizaContext.montoContrato,
    polizaContext.montoConAdicionales,
    polizaContext.montoAcumulado,
    polizaContext.saldoAnticipo,
    polizaContext.certificadoRp
  ];
  camposMoneda.forEach(registrarCampoMoneda);

  registrarCampoPorcentaje(polizaContext.ultimoFriAprobadoValor);

  if (polizaContext.ultimoFriAprobadoFecha) {
    polizaContext.ultimoFriAprobadoFecha.addEventListener('input', event => {
      guardarValorBase(event.target);
      actualizarCalculosPoliza();
    });
    polizaContext.ultimoFriAprobadoFecha.addEventListener('blur', event => {
      guardarValorBase(event.target);
    });
  }

  if (polizaContext.hastaInput) {
    polizaContext.hastaInput.addEventListener('input', actualizarTextoHastaPoliza);
    polizaContext.hastaInput.addEventListener('blur', actualizarTextoHastaPoliza);
  }

  if (polizaContext.montoConAdicionales) {
    polizaContext.montoConAdicionales.addEventListener('input', () => {
      evaluarEdicionMontoConAdicionales();
    });
    polizaContext.montoConAdicionales.addEventListener('blur', () => {
      evaluarEdicionMontoConAdicionales();
    });
  }

  const saltosContainer = document.getElementById('saltosContainer');
  if (saltosContainer) {
    saltosContainer.addEventListener('input', event => {
      if (event.target && event.target.classList.contains('salto-acum')) {
        normalizarEntradaDecimal(event.target);
        actualizarCalculosPoliza();
      }
    });
  }

  polizaContext.calcularRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      if (radio.value === 'si') {
        togglePoliza(true);
        actualizarEstadoPoliza({ calcular: 'si' });
        actualizarCalculosPoliza();
      } else {
        togglePoliza(false);
        limpiarValoresBasePoliza();
        limpiarResultadosPoliza();
        ocultarAdvertenciaPoliza();
        actualizarEstadoPoliza({ calcular: 'no', valores: {}, reemplazarValores: true, adicionalesEditado: false });
      }
    });
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      restablecerPoliza();
    }, 0);
  });

  restaurarEstadoPoliza();
}

function restaurarEstadoPoliza() {
  if (!polizaContext) return;
  const estado = obtenerEstadoPoliza();
  const calcularValor = estado.calcular === 'si' ? 'si' : 'no';
  establecerRadio(polizaContext.calcularRadios, calcularValor);
  polizaContext.montoConAdicionalesEditado = estado.adicionalesEditado === true;

  const valores = estado.valores || {};
  Object.keys(valores).forEach(id => {
    const campo = document.getElementById(id);
    if (!campo) return;
    campo.value = valores[id];
    if (campo === polizaContext.montoContrato || campo === polizaContext.montoConAdicionales || campo === polizaContext.montoAcumulado || campo === polizaContext.saldoAnticipo || campo === polizaContext.certificadoRp) {
      formatearValorCampoMoneda(campo);
    } else if (campo === polizaContext.ultimoFriAprobadoValor) {
      formatearValorCampoPorcentaje(campo);
    }
  });

  evaluarEdicionMontoConAdicionales();
  actualizarTextoHastaPoliza();
  togglePoliza(calcularValor === 'si');
  if (calcularValor === 'si') {
    actualizarCalculosPoliza();
  } else {
    limpiarResultadosPoliza();
    ocultarAdvertenciaPoliza();
  }
}

function registrarCampoMoneda(campo) {
  if (!campo) return;
  campo.addEventListener('input', event => {
    normalizarEntradaDecimal(event.target);
    guardarValorBase(event.target);
    if (event.target === polizaContext.montoContrato) {
      sincronizarMontoConAdicionales();
    }
    actualizarCalculosPoliza();
  });
  campo.addEventListener('blur', () => {
    formatearValorCampoMoneda(campo);
    guardarValorBase(campo);
    if (campo === polizaContext.montoContrato) {
      sincronizarMontoConAdicionales({ formatear: true });
    }
    actualizarCalculosPoliza();
  });
}

function registrarCampoPorcentaje(campo) {
  if (!campo) return;
  campo.addEventListener('input', event => {
    normalizarEntradaDecimal(event.target);
    guardarValorBase(event.target);
    actualizarCalculosPoliza();
  });
  campo.addEventListener('blur', () => {
    formatearValorCampoPorcentaje(campo);
    guardarValorBase(campo);
    actualizarCalculosPoliza();
  });
}

function normalizarEntradaDecimal(campo) {
  if (!campo) return;
  const original = campo.value || '';
  let limpio = original.replace(/[^0-9.,]/g, '');
  const comaIndex = limpio.indexOf(',');
  if (comaIndex !== -1) {
    limpio = `${limpio.slice(0, comaIndex + 1)}${limpio.slice(comaIndex + 1).replace(/,/g, '')}`;
  }
  const puntoIndex = limpio.indexOf('.');
  if (puntoIndex !== -1) {
    limpio = `${limpio.slice(0, puntoIndex + 1)}${limpio.slice(puntoIndex + 1).replace(/\./g, '')}`;
  }
  if (limpio !== original) campo.value = limpio;
}

function formatearValorCampoMoneda(campo) {
  if (!campo) return;
  const numero = parseMonto(obtenerValorCampo(campo));
  if (numero === null) {
    campo.value = '';
    return;
  }
  campo.value = formatearMoneda(numero);
}

function formatearValorCampoPorcentaje(campo) {
  if (!campo) return;
  const numero = parsePorcentaje(obtenerValorCampo(campo));
  if (numero === null) {
    campo.value = '';
    return;
  }
  campo.value = formatearPorcentaje(numero);
}

function guardarValorBase(campo) {
  if (!campo || !campo.id) return;
  actualizarEstadoPoliza({ valores: { [campo.id]: campo.value } });
}

function actualizarTextoHastaPoliza() {
  if (!polizaContext) return;
  const valor = obtenerValorHasta();
  const texto = valor || 'mm/aaaa';
  polizaContext.hastaTargets.forEach(span => {
    span.textContent = texto;
  });
}

const formateadorMoneda = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formateadorPorcentaje = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function actualizarCalculosPoliza() {
  if (!polizaContext) return;
  if (!polizaEstaActiva()) {
    limpiarResultadosPoliza();
    return;
  }

  const montoConAdicionales = leerMontoCampo(polizaContext.montoConAdicionales);
  const montoAcumulado = leerMontoCampo(polizaContext.montoAcumulado);
  const saldoAnticipo = leerMontoCampo(polizaContext.saldoAnticipo);

  const hayDatosSaldo = montoConAdicionales.tieneDato || montoAcumulado.tieneDato || saldoAnticipo.tieneDato;
  const saldoNeto = hayDatosSaldo
    ? redondearDosDecimales(montoConAdicionales.valor - montoAcumulado.valor - saldoAnticipo.valor)
    : null;
  if (polizaContext.saldoNeto) {
    polizaContext.saldoNeto.value = saldoNeto !== null ? formatearMoneda(saldoNeto) : '';
  }

  const ultimoFri = obtenerUltimoSaltoValor();
  if (polizaContext.ultimoFriValor) {
    polizaContext.ultimoFriValor.value = ultimoFri !== null ? formatearPorcentaje(ultimoFri) : '';
  }

  const ultimoFriAprobado = leerPorcentajeCampo(polizaContext.ultimoFriAprobadoValor);
  const incrementoFri = ultimoFri !== null
    ? redondearDosDecimales(ultimoFri - ultimoFriAprobado.valor)
    : null;
  if (polizaContext.incrementoFri) {
    polizaContext.incrementoFri.value = incrementoFri !== null ? formatearPorcentaje(incrementoFri) : '';
  }

  const baseContratacion = saldoNeto !== null && incrementoFri !== null
    ? redondearDosDecimales(saldoNeto * (incrementoFri / 100))
    : null;
  if (polizaContext.baseContratacion) {
    polizaContext.baseContratacion.value = baseContratacion !== null ? formatearMoneda(baseContratacion) : '';
  }

  const montoGarantizarSaldo = baseContratacion !== null
    ? redondearDosDecimales(baseContratacion * 0.05)
    : null;
  if (polizaContext.montoGarantizarSaldo) {
    polizaContext.montoGarantizarSaldo.value = montoGarantizarSaldo !== null ? formatearMoneda(montoGarantizarSaldo) : '';
  }

  const certificadoRp = leerMontoCampo(polizaContext.certificadoRp);
  const montoGarantizarRp = certificadoRp.tieneDato
    ? redondearDosDecimales(certificadoRp.valor * 0.05)
    : (certificadoRp.valor ? redondearDosDecimales(certificadoRp.valor * 0.05) : null);
  if (polizaContext.montoGarantizarRp) {
    polizaContext.montoGarantizarRp.value = montoGarantizarRp !== null ? formatearMoneda(montoGarantizarRp) : '';
  }

  let montoTotal = null;
  if (montoGarantizarSaldo !== null || montoGarantizarRp !== null) {
    montoTotal = redondearDosDecimales((montoGarantizarSaldo ?? 0) + (montoGarantizarRp ?? 0));
  }
  if (polizaContext.montoTotal) {
    polizaContext.montoTotal.value = montoTotal !== null ? formatearMoneda(montoTotal) : '';
  }
  if (polizaContext.montoPoliza) {
    polizaContext.montoPoliza.value = montoTotal !== null ? formatearMoneda(montoTotal) : '';
  }
  if (polizaContext.montoClausulaLetras) {
    polizaContext.montoClausulaLetras.value = montoTotal !== null ? numeroALetras(montoTotal) : '';
  }
}

function polizaEstaActiva() {
  if (!polizaContext) return false;
  return polizaContext.calcularRadios.some(radio => radio.checked && radio.value === 'si');
}

function limpiarResultadosPoliza() {
  if (!polizaContext) return;
  const campos = [
    'saldoNeto',
    'ultimoFriValor',
    'incrementoFri',
    'baseContratacion',
    'montoGarantizarSaldo',
    'montoGarantizarRp',
    'montoTotal',
    'montoPoliza'
  ];
  campos.forEach(nombre => {
    const campo = polizaContext[nombre];
    if (campo) campo.value = '';
  });
  if (polizaContext.montoClausulaLetras) {
    polizaContext.montoClausulaLetras.value = '';
  }
}

function limpiarValoresBasePoliza() {
  if (!polizaContext) return;
  const campos = [
    polizaContext.montoContrato,
    polizaContext.montoConAdicionales,
    polizaContext.montoAcumulado,
    polizaContext.saldoAnticipo,
    polizaContext.ultimoFriAprobadoFecha,
    polizaContext.ultimoFriAprobadoValor,
    polizaContext.certificadoRp,
    polizaContext.tipoPoliza
  ];
  campos.forEach(campo => {
    if (campo) campo.value = '';
  });
  polizaContext.montoConAdicionalesEditado = false;
  actualizarEstadoPoliza({ valores: {}, reemplazarValores: true, adicionalesEditado: false });
}

function obtenerValorCampo(campo) {
  if (!campo) return '';
  return (campo.value || '').trim();
}

function leerMontoCampo(campo) {
  const texto = obtenerValorCampo(campo);
  if (!texto) return { valor: 0, tieneDato: false };
  const numero = parseMonto(texto);
  if (numero === null) return { valor: 0, tieneDato: false };
  return { valor: numero, tieneDato: true };
}

function leerPorcentajeCampo(campo) {
  const texto = obtenerValorCampo(campo);
  if (!texto) return { valor: 0, tieneDato: false };
  const numero = parsePorcentaje(texto);
  if (numero === null) return { valor: 0, tieneDato: false };
  return { valor: numero, tieneDato: true };
}

function parseMonto(valor) {
  if (!valor) return null;
  const limpio = valor.replace(/\$/g, '').trim();
  if (!limpio) return null;
  const normalizado = normalizarMontoTexto(limpio);
  const numero = Number(normalizado);
  if (Number.isNaN(numero)) return null;
  return numero;
}

function parsePorcentaje(valor) {
  if (!valor) return null;
  const sinSimbolo = valor.replace(/%/g, '').trim();
  if (!sinSimbolo) return null;
  const normalizado = normalizarMontoTexto(sinSimbolo);
  const numero = Number(normalizado);
  if (Number.isNaN(numero)) return null;
  return numero;
}

function formatearMoneda(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return '';
  return formateadorMoneda.format(valor);
}

function formatearPorcentaje(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return '';
  return formateadorPorcentaje.format(valor);
}

function obtenerUltimoSaltoValor() {
  const cont = document.getElementById('saltosContainer');
  if (!cont) return null;
  const saltos = cont.querySelectorAll('.salto-acum');
  for (let i = saltos.length - 1; i >= 0; i -= 1) {
    const valor = parsePorcentaje(obtenerValorCampo(saltos[i]));
    if (valor !== null) return valor;
  }
  return null;
}

function obtenerValorHasta() {
  if (!polizaContext || !polizaContext.hastaInput) return '';
  return (polizaContext.hastaInput.value || '').trim();
}

function redondearDosDecimales(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  return Math.round(valor * 100) / 100;
}

function sincronizarMontoConAdicionales(opciones = {}) {
  if (!polizaContext) return;
  const origen = polizaContext.montoContrato;
  const destino = polizaContext.montoConAdicionales;
  if (!origen || !destino) return;
  const { forzar = false, formatear = false } = opciones;
  if (!forzar && polizaContext.montoConAdicionalesEditado && obtenerValorCampo(destino)) {
    if (formatear) {
      formatearValorCampoMoneda(destino);
    }
    return;
  }
  destino.value = origen ? origen.value : '';
  if (formatear) {
    formatearValorCampoMoneda(destino);
  }
  guardarValorBase(destino);
  polizaContext.montoConAdicionalesEditado = false;
  actualizarEstadoPoliza({ adicionalesEditado: false });
  evaluarEdicionMontoConAdicionales();
}

function evaluarEdicionMontoConAdicionales() {
  if (!polizaContext) return;
  const origen = polizaContext.montoContrato;
  const destino = polizaContext.montoConAdicionales;
  if (!origen || !destino) return;
  const textoDestino = obtenerValorCampo(destino);
  let editado = false;
  if (textoDestino) {
    const valorDestino = parseMonto(textoDestino);
    const valorOrigen = parseMonto(obtenerValorCampo(origen));
    if (valorOrigen === null) {
      editado = true;
    } else if (valorDestino !== null) {
      editado = valorDestino !== valorOrigen;
    }
  }
  polizaContext.montoConAdicionalesEditado = editado;
  actualizarEstadoPoliza({ adicionalesEditado: editado });
}

function ocultarAdvertenciaPoliza() {
  if (!polizaContext || !polizaContext.errorContenedor) return;
  polizaContext.errorContenedor.classList.add('oculto');
  if (polizaContext.errorTexto) {
    polizaContext.errorTexto.textContent = '';
  }
}

function restablecerPoliza() {
  if (!polizaContext) return;
  establecerRadio(polizaContext.calcularRadios, 'no');
  togglePoliza(false);
  limpiarValoresBasePoliza();
  limpiarResultadosPoliza();
  ocultarAdvertenciaPoliza();
  actualizarEstadoPoliza({ calcular: 'no', valores: {}, reemplazarValores: true, adicionalesEditado: false });
}

function reiniciarPolizaDesdeFormulario() {
  if (!polizaContext) return;
  restablecerPoliza();
}

function establecerRadio(radios, valor) {
  if (!Array.isArray(radios)) return;
  radios.forEach(radio => {
    radio.checked = radio.value === valor;
  });
}

function obtenerStorageSeguro() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (err) {
    console.warn('No se puede acceder a localStorage', err);
    return null;
  }
}

function obtenerEstadoPoliza() {
  if (polizaEstadoCache) return polizaEstadoCache;
  const storage = obtenerStorageSeguro();
  if (storage) {
    try {
      const raw = storage.getItem(POLIZA_STORAGE_KEY);
      if (raw) {
        polizaEstadoCache = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('No se pudo leer el estado de póliza', err);
    }
  }
  if (!polizaEstadoCache || typeof polizaEstadoCache !== 'object') {
    polizaEstadoCache = {};
  }
  if (!polizaEstadoCache.valores || typeof polizaEstadoCache.valores !== 'object') {
    polizaEstadoCache.valores = {};
  }
  if (typeof polizaEstadoCache.adicionalesEditado !== 'boolean') {
    polizaEstadoCache.adicionalesEditado = false;
  }
  return polizaEstadoCache;
}

function actualizarEstadoPoliza(parcial) {
  const estadoActual = obtenerEstadoPoliza();
  const nuevoEstado = {
    ...estadoActual,
    valores: estadoActual.valores ? { ...estadoActual.valores } : {}
  };
  if ('valores' in parcial) {
    nuevoEstado.valores = parcial.reemplazarValores
      ? { ...parcial.valores }
      : { ...nuevoEstado.valores, ...parcial.valores };
  }
  if (parcial.calcular === 'si' || parcial.calcular === 'no') {
    nuevoEstado.calcular = parcial.calcular;
  }
  if ('adicionalesEditado' in parcial) {
    nuevoEstado.adicionalesEditado = parcial.adicionalesEditado === true;
  }
  guardarEstadoPoliza(nuevoEstado);
  return nuevoEstado;
}

function guardarEstadoPoliza(estado) {
  polizaEstadoCache = {
    ...estado,
    valores: estado.valores ? { ...estado.valores } : {}
  };
  const storage = obtenerStorageSeguro();
  if (!storage) return;
  try {
    storage.setItem(POLIZA_STORAGE_KEY, JSON.stringify(polizaEstadoCache));
  } catch (err) {
    console.warn('No se pudo guardar el estado de póliza', err);
  }
}
const ordinalesMasc = [
  'Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo',
  'Undécimo', 'Duodécimo', 'Decimotercer', 'Decimocuarto', 'Decimoquinto', 'Decimosexto', 'Decimoséptimo', 'Decimooctavo', 'Decimonoveno', 'Vigésimo'
];

function inicializarMontoRedeterminacion() {
  const montoInput = document.getElementById('montoRedeterminacion');
  const montoLetras = document.getElementById('montoRedeterminacionLetras');
  const form = document.getElementById('formAsistente');
  if (!montoInput || !montoLetras) return;

  const actualizarMonto = () => {
    const crudo = (montoInput.value || '').trim();
    if (!crudo) {
      montoLetras.value = '';
      return;
    }
    const normalizado = normalizarMontoTexto(crudo);
    const numero = Number(normalizado);
    if (Number.isNaN(numero)) {
      montoLetras.value = '';
      return;
    }
    const valor = Math.round(numero * 100) / 100;
    montoLetras.value = numeroALetras(valor);
  };

  montoInput.addEventListener('input', actualizarMonto);
  montoInput.addEventListener('blur', actualizarMonto);
  if (form) {
    form.addEventListener('reset', () => {
      setTimeout(() => {
        montoLetras.value = '';
      }, 0);
    });
  }
  actualizarMonto();
}

async function manejarEnvioSolicitud(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('enviarSolicitud');
  const originalText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';
  }
  ocultarEstadoSolicitud();
  try {
    const payload = recolectarDatosFormulario();
    const respuesta = await fetch('/api/redeterminaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => ({}));
      const mensaje = detalle && detalle.error ? detalle.error : 'Error al registrar la solicitud';
      throw new Error(mensaje);
    }
    mostrarEstadoSolicitud('success', '✅ Solicitud registrada correctamente. Los documentos se generarán automáticamente en breve.');
  } catch (error) {
    console.error('Error enviando la solicitud de redeterminación:', error);
    mostrarEstadoSolicitud('error', '❌ Hubo un error al registrar la solicitud. Intente nuevamente o verifique la conexión con la planilla.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

function recolectarDatosFormulario() {
  const representanteTipo = obtenerValorPorId('repTipo');
  const representanteNombre = obtenerValorPorId('repNombreDni');
  const representante = [representanteTipo, representanteNombre].filter(Boolean).join(' - ');
  const ultimoFriAprobadoFecha = obtenerValorPorId('polizaUltimoFriAprobadoFecha');
  const ultimoFriAprobadoValor = obtenerValorPorId('polizaUltimoFriAprobadoValor');
  return {
    expediente: obtenerValorPorId('obraExpediente'),
    tipoRedeterminacion: obtenerValorPorId('tipoRedeterminacion'),
    empresa: obtenerEmpresaSeleccionada(),
    representante,
    domicilio: obtenerValorPorId('repDomicilio'),
    obraNombre: obtenerValorPorId('obraNombre'),
    aprobadaPor: obtenerTextoSeleccion('aprobadaPor'),
    numeroAdjudicacion: obtenerValorPorId('aprobadaNumero'),
    periodoDesde: obtenerValorPorId('cambiosDesde'),
    periodoHasta: obtenerValorPorId('cambiosHasta'),
    numeroRedeterminacion: obtenerTextoSeleccion('nRedet'),
    montoRedeterminacion: obtenerValorPorId('montoRedeterminacion'),
    montoRedeterminacionLetras: obtenerValorPorId('montoRedeterminacionLetras'),
    montoContrato: obtenerValorPorId('polizaMontoContrato'),
    montoConAdicionales: obtenerValorPorId('polizaMontoConAdicionales'),
    montoObraAcumulada: obtenerValorPorId('polizaMontoObraAcumulada'),
    saldoAnticipo: obtenerValorPorId('polizaSaldoAnticipo'),
    ultimoFri: agregarSimboloPorcentaje(obtenerValorPorId('polizaUltimoFriValor')),
    ultimoFriAprobado: combinarUltimoFriAprobado(ultimoFriAprobadoFecha, ultimoFriAprobadoValor),
    incrementoFri: agregarSimboloPorcentaje(obtenerValorPorId('polizaIncrementoFri')),
    baseContratacion: obtenerValorPorId('polizaBaseContratacion'),
    montoGarantizarSaldoObra: obtenerValorPorId('polizaMontoGarantizarSaldoObra'),
    montoGarantizarRedeterminacion: obtenerValorPorId('polizaMontoGarantizarRp'),
    montoTotalGarantizar: obtenerValorPorId('polizaMontoTotalGarantizar'),
    polizaQueCorresponde: obtenerValorPorId('polizaQueCorresponde'),
    montoPoliza: obtenerValorPorId('polizaMontoPoliza'),
    montoPolizaLetras: obtenerValorPorId('polizaMontoClausulaLetras')
  };
}

function obtenerValorPorId(id) {
  const elemento = document.getElementById(id);
  if (!elemento) return '';
  return (elemento.value || '').trim();
}

function obtenerEmpresaSeleccionada() {
  const select = document.getElementById('empresa');
  if (!select) return '';
  const valor = select.value;
  if (valor === 'OTRO') {
    return obtenerValorPorId('empresaOtro');
  }
  if (!valor) return '';
  const opcion = select.options[select.selectedIndex];
  const texto = opcion ? opcion.text : valor;
  return texto.trim();
}

function obtenerTextoSeleccion(id) {
  const select = document.getElementById(id);
  if (!select) return '';
  const indice = select.selectedIndex;
  if (indice < 0) return '';
  const opcion = select.options[indice];
  return opcion ? (opcion.text || '').trim() : '';
}

function agregarSimboloPorcentaje(valor) {
  if (!valor) return '';
  const texto = valor.trim();
  if (!texto) return '';
  return /%$/.test(texto) ? texto : `${texto}%`;
}

function combinarUltimoFriAprobado(fecha, valor) {
  const fechaLimpia = (fecha || '').trim();
  const porcentaje = agregarSimboloPorcentaje(valor || '');
  if (fechaLimpia && porcentaje) return `${fechaLimpia} - ${porcentaje}`;
  if (fechaLimpia) return fechaLimpia;
  return porcentaje;
}

function mostrarEstadoSolicitud(tipo, mensaje) {
  const contenedor = document.getElementById('formStatus');
  if (!contenedor) return;
  contenedor.classList.remove('oculto', 'form-status--success', 'form-status--error');
  const textoEl = contenedor.querySelector('.form-status-text');
  if (textoEl) {
    textoEl.textContent = mensaje;
  }
  if (tipo === 'success') {
    contenedor.classList.add('form-status--success');
  } else if (tipo === 'error') {
    contenedor.classList.add('form-status--error');
  }
}

function ocultarEstadoSolicitud() {
  const contenedor = document.getElementById('formStatus');
  if (!contenedor) return;
  contenedor.classList.add('oculto');
  contenedor.classList.remove('form-status--success', 'form-status--error');
  const textoEl = contenedor.querySelector('.form-status-text');
  if (textoEl) {
    textoEl.textContent = '';
  }
}

function normalizarMontoTexto(valor) {
  const limpio = valor.replace(/\s+/g, '');
  const tieneComa = limpio.includes(',');
  const tienePunto = limpio.includes('.');
  if (tieneComa && tienePunto) {
    return limpio.replace(/\./g, '').replace(',', '.');
  }
  if (tieneComa) return limpio.replace(',', '.');
  if (tienePunto) {
    const puntos = limpio.match(/\./g) || [];
    if (puntos.length > 1) return limpio.replace(/\./g, '');
  }
  return limpio;
}

function numeroALetras(valor) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return '';
  const absoluto = Math.abs(valor);
  const entero = Math.floor(absoluto);
  const decimales = Math.round((absoluto - entero) * 100);
  const textoEntero = capitalizarCadaPalabra(convertirNumeroEntero(entero));
  const textoDecimal = String(decimales).padStart(2, '0');
  return `${textoEntero} con ${textoDecimal}/100`;
}

function convertirNumeroEntero(num) {
  if (num === 0) return 'cero';
  if (num < 1000) return convertirCentenas(num);
  if (num < 1000000) {
    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    const textoMiles = miles === 1 ? 'mil' : `${ajustarUn(convertirNumeroEntero(miles))} mil`;
    const textoResto = resto ? convertirCentenas(resto) : '';
    return textoResto ? `${textoMiles} ${textoResto}` : textoMiles;
  }
  if (num < 1000000000) {
    const millones = Math.floor(num / 1000000);
    const resto = num % 1000000;
    const textoMillones = millones === 1 ? 'un millón' : `${ajustarUn(convertirNumeroEntero(millones))} millones`;
    const textoResto = resto ? convertirNumeroEntero(resto) : '';
    return textoResto ? `${textoMillones} ${textoResto}` : textoMillones;
  }
  const milesDeMillones = Math.floor(num / 1000000000);
  const resto = num % 1000000000;
  const textoMilesMillones = milesDeMillones === 1 ? 'mil millones' : `${ajustarUn(convertirNumeroEntero(milesDeMillones))} mil millones`;
  const textoResto = resto ? convertirNumeroEntero(resto) : '';
  return textoResto ? `${textoMilesMillones} ${textoResto}` : textoMilesMillones;
}

function convertirCentenas(num) {
  if (num === 0) return '';
  if (num === 100) return 'cien';
  const centenas = Math.floor(num / 100);
  const resto = num % 100;
  const textoCentena = CENTENAS[centenas];
  const textoResto = convertirDecenas(resto);
  if (!textoCentena) return textoResto;
  return textoResto ? `${textoCentena} ${textoResto}` : textoCentena;
}

function convertirDecenas(num) {
  if (num === 0) return '';
  if (num < 10) return UNIDADES[num];
  if (num < 20) return DIEZ_A_DIECINUEVE[num - 10];
  if (num === 20) return 'veinte';
  if (num < 30) return VEINTI[num];
  const decena = Math.floor(num / 10);
  const unidad = num % 10;
  const textoDecena = DECENAS[decena];
  if (unidad === 0) return textoDecena;
  return `${textoDecena} y ${UNIDADES[unidad]}`;
}

function ajustarUn(texto) {
  return texto
    .replace(/uno$/, 'un')
    .replace(/veintiuno$/, 'veintiún')
    .replace(/y uno$/, 'y un');
}

function capitalizarCadaPalabra(texto) {
  return texto
    .split(' ')
    .filter(Boolean)
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIEZ_A_DIECINUEVE = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
const VEINTI = {
  21: 'veintiuno',
  22: 'veintidós',
  23: 'veintitrés',
  24: 'veinticuatro',
  25: 'veinticinco',
  26: 'veintiséis',
  27: 'veintisiete',
  28: 'veintiocho',
  29: 'veintinueve'
};

const POLIZA_STORAGE_KEY = 'certy.poliza.estado';
let polizaContext = null;
let polizaEstadoCache = null;
let empresasCache = null;
let empresasPromise = null;

async function cargarDatosEmpresas() {
  if (empresasCache) return empresasCache;
  if (!empresasPromise) {
    const sheetId = '10qtk3KQplhuMqVDXjl61vZH8J-ELUN-fRnst1srLYfI';
    const query = 'select A,B,C,D';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Empresas&tq=${encodeURIComponent(query)}`;
    empresasPromise = fetch(url)
      .then(res => res.text())
      .then(text => {
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const data = {};
        if (json.table && Array.isArray(json.table.rows)) {
          json.table.rows.forEach(row => {
            if (!row || !Array.isArray(row.c)) return;
            const cells = row.c;
            const empresa = cells[0] && cells[0].v ? String(cells[0].v).trim() : '';
            if (!empresa) return;
            const key = normalizarEmpresa(empresa);
            if (!key) return;
            data[key] = {
              tipo: cells[1] && cells[1].v ? String(cells[1].v).trim() : '',
              nombreDni: cells[2] && cells[2].v ? String(cells[2].v).trim() : '',
              domicilio: cells[3] && cells[3].v ? String(cells[3].v).trim() : ''
            };
          });
        }
        empresasCache = data;
        return data;
      });
  }
  return empresasPromise;
}

function manejarCambioEmpresa(valor) {
  toggleEmpresaOtro(valor);
  if (!valor || valor === 'OTRO') {
    limpiarCamposEmpresa();
    return;
  }
  cargarDatosEmpresas()
    .then(data => {
      const info = data[normalizarEmpresa(valor)];
      if (info) {
        const tipo = document.getElementById('repTipo');
        const nombreDni = document.getElementById('repNombreDni');
        const domicilio = document.getElementById('repDomicilio');
        if (tipo) tipo.value = info.tipo || '';
        if (nombreDni) nombreDni.value = info.nombreDni || '';
        if (domicilio) domicilio.value = info.domicilio || '';
      } else {
        limpiarCamposEmpresa();
      }
    })
    .catch(err => {
      console.error('Error al cargar datos de la empresa', err);
      limpiarCamposEmpresa();
    });
}

function limpiarCamposEmpresa() {
  const tipo = document.getElementById('repTipo');
  const nombreDni = document.getElementById('repNombreDni');
  const domicilio = document.getElementById('repDomicilio');
  if (tipo) tipo.value = '';
  if (nombreDni) nombreDni.value = '';
  if (domicilio) domicilio.value = '';
}

function normalizarEmpresa(nombre) {
  if (!nombre) return '';
  return String(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function actualizarAprobadaPor(valor) {
  const hint = document.getElementById('aprobadaPorHint');
  const btn = document.getElementById('buscarResolucion');
  if (hint) hint.textContent = '';
  if (!btn) return;
  if (valor === 'resolucion') {
    if (hint) hint.textContent = 'Buscar la fecha en la página de Digesto';
    btn.classList.remove('oculto');
  } else if (valor === 'disposicion') {
    if (hint) hint.textContent = 'Consultarle a la subsecretaría';
    btn.classList.add('oculto');
  } else {
    btn.classList.add('oculto');
  }
}

async function abrirDigestoResolucion() {
  const tipo = document.getElementById('aprobadaPor');
  if (!tipo || tipo.value !== 'resolucion') return;
  const numeroInput = document.getElementById('aprobadaNumero');
  if (!numeroInput) return;
  const valor = (numeroInput.value || '').trim();
  const match = valor.match(/^(\d{4})\/(\d{2})$/);
  if (!match) {
    alert('Ingrese un número válido con el formato nnnn/aa.');
    return;
  }
  const [, numero, anioCorto] = match;
  const base = `https://www.muninqn.gov.ar/info/doc/digesto/RESOLUCIONES/20${anioCorto}/r-${numero}-${anioCorto}`;
  const urls = [`${base}-.pdf`, `${base}.pdf`];

  const abrirEnNuevaPestana = url => {
    const nuevaVentana = window.open(url, '_blank');
    if (nuevaVentana) nuevaVentana.opener = null;
  };

  urls.forEach(abrirEnNuevaPestana);
}
