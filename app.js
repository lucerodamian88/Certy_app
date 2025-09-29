// Lógica del Asistente de Redeterminación de Precios

document.addEventListener('DOMContentLoaded', () => {

  const formContainer = document.querySelector('.form-container');
  if (formContainer) formContainer.classList.add('loaded');

  const genSaltosBtn = document.getElementById('generarSaltos');
  if (genSaltosBtn) genSaltosBtn.addEventListener('click', generarSaltos);

  const limpiarBtn = document.getElementById('limpiarFormulario');
  if (limpiarBtn) limpiarBtn.addEventListener('click', limpiarFormulario);

  const empresaSel = document.getElementById('empresa');
  if (empresaSel) {
    cargarDatosEmpresas().catch(err => console.error('Error al precargar empresas', err));
    empresaSel.addEventListener('change', e => manejarCambioEmpresa(e.target.value));
  }

  const polizaSel = document.getElementById('tienePoliza');
  if (polizaSel) {
    polizaSel.addEventListener('change', e => togglePoliza(e.target.value));
    togglePoliza(polizaSel.value);
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
  const empresa = document.getElementById('empresa');
  if (empresa) toggleEmpresaOtro(empresa.value);
  limpiarCamposEmpresa();
  const poliza = document.getElementById('tienePoliza');
  if (poliza) togglePoliza(poliza.value);
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

function togglePoliza(val) {
  const panel = document.getElementById('polizaForm');
  const wrapper = document.querySelector('.form-wrapper');
  if (!panel || !wrapper) return;
  if (val === 'si') {
    wrapper.classList.add('poliza-activa');
    panel.setAttribute('aria-hidden', 'false');
  } else {
    wrapper.classList.remove('poliza-activa');
    panel.setAttribute('aria-hidden', 'true');
  }
  actualizarCalculosPoliza();
}

function inicializarPoliza() {
  const form = document.getElementById('formAsistente');
  const poliza = document.getElementById('polizaForm');
  if (!form || !poliza) return;

  polizaContext = {
    form,
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
    baseContratacionCopia: document.getElementById('polizaBaseContratacionCopia'),
    montoGarantizarSaldo: document.getElementById('polizaMontoGarantizarSaldoObra'),
    certificadoRp: document.getElementById('polizaCertificadoRp'),
    montoGarantizarRp: document.getElementById('polizaMontoGarantizarRp'),
    montoTotal: document.getElementById('polizaMontoTotalGarantizar'),
    montoClausula: document.getElementById('polizaMontoClausula'),
    montoClausulaLetras: document.getElementById('polizaMontoClausulaLetras'),
    hastaTargets: Array.from(document.querySelectorAll('.poliza-hasta'))
  };

  const camposMonto = [
    polizaContext.montoContrato,
    polizaContext.montoConAdicionales,
    polizaContext.montoAcumulado,
    polizaContext.saldoAnticipo,
    polizaContext.certificadoRp
  ];
  camposMonto.forEach(campo => {
    if (campo) {
      campo.addEventListener('input', actualizarCalculosPoliza);
      campo.addEventListener('blur', actualizarCalculosPoliza);
    }
  });

  if (polizaContext.ultimoFriAprobadoValor) {
    polizaContext.ultimoFriAprobadoValor.addEventListener('input', actualizarCalculosPoliza);
    polizaContext.ultimoFriAprobadoValor.addEventListener('blur', actualizarCalculosPoliza);
  }

  if (polizaContext.ultimoFriAprobadoFecha) {
    polizaContext.ultimoFriAprobadoFecha.addEventListener('input', actualizarCalculosPoliza);
    polizaContext.ultimoFriAprobadoFecha.addEventListener('blur', actualizarCalculosPoliza);
  }

  if (polizaContext.hastaInput) {
    polizaContext.hastaInput.addEventListener('input', actualizarTextoHastaPoliza);
    polizaContext.hastaInput.addEventListener('blur', actualizarTextoHastaPoliza);
  }

  form.addEventListener('reset', () => {
    setTimeout(() => {
      actualizarTextoHastaPoliza();
      actualizarCalculosPoliza();
    }, 0);
  });

  const saltosContainer = document.getElementById('saltosContainer');
  if (saltosContainer) {
    saltosContainer.addEventListener('input', event => {
      if (event.target && event.target.classList.contains('salto-acum')) {
        actualizarCalculosPoliza();
      }
    });
  }

  actualizarTextoHastaPoliza();
  actualizarCalculosPoliza();
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
  const selector = document.getElementById('tienePoliza');
  if (selector && selector.value !== 'si') {
    limpiarResultadosPoliza();
    return;
  }

  const montoConAdicionales = parseMonto(obtenerValorCampo(polizaContext.montoConAdicionales));
  const montoAcumulado = parseMonto(obtenerValorCampo(polizaContext.montoAcumulado));
  const saldoAnticipo = parseMonto(obtenerValorCampo(polizaContext.saldoAnticipo));

  let saldoNeto = null;
  if ([montoConAdicionales, montoAcumulado, saldoAnticipo].some(valor => valor !== null)) {
    saldoNeto = redondearDosDecimales((montoConAdicionales ?? 0) - (montoAcumulado ?? 0) - (saldoAnticipo ?? 0));
  }
  if (polizaContext.saldoNeto) {
    polizaContext.saldoNeto.value = saldoNeto !== null ? formatearMoneda(saldoNeto) : '';
  }

  const ultimoFri = obtenerUltimoSaltoValor();
  if (polizaContext.ultimoFriValor) {
    polizaContext.ultimoFriValor.value = ultimoFri !== null ? formatearPorcentaje(ultimoFri) : '';
  }

  const ultimoFriAprobado = parsePorcentaje(obtenerValorCampo(polizaContext.ultimoFriAprobadoValor));
  const incrementoFri = ultimoFri !== null && ultimoFriAprobado !== null
    ? redondearDosDecimales(ultimoFri - ultimoFriAprobado)
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
  if (polizaContext.baseContratacionCopia) {
    polizaContext.baseContratacionCopia.value = baseContratacion !== null ? formatearMoneda(baseContratacion) : '';
  }

  const montoGarantizarSaldo = baseContratacion !== null
    ? redondearDosDecimales(baseContratacion * 0.05)
    : null;
  if (polizaContext.montoGarantizarSaldo) {
    polizaContext.montoGarantizarSaldo.value = montoGarantizarSaldo !== null ? formatearMoneda(montoGarantizarSaldo) : '';
  }

  const certificadoRp = parseMonto(obtenerValorCampo(polizaContext.certificadoRp));
  const montoGarantizarRp = certificadoRp !== null
    ? redondearDosDecimales(certificadoRp * 0.05)
    : null;
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
  if (polizaContext.montoClausula) {
    polizaContext.montoClausula.value = montoTotal !== null ? formatearMoneda(montoTotal) : '';
  }
  if (polizaContext.montoClausulaLetras) {
    polizaContext.montoClausulaLetras.value = montoTotal !== null ? numeroALetras(montoTotal) : '';
  }
}

function limpiarResultadosPoliza() {
  if (!polizaContext) return;
  const campos = [
    'saldoNeto',
    'ultimoFriValor',
    'incrementoFri',
    'baseContratacion',
    'baseContratacionCopia',
    'montoGarantizarSaldo',
    'montoGarantizarRp',
    'montoTotal',
    'montoClausula'
  ];
  campos.forEach(nombre => {
    const campo = polizaContext[nombre];
    if (campo) campo.value = '';
  });
  if (polizaContext.montoClausulaLetras) {
    polizaContext.montoClausulaLetras.value = '';
  }
}

function obtenerValorCampo(campo) {
  if (!campo) return '';
  return (campo.value || '').trim();
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

let polizaContext = null;
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
