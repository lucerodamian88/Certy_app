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
  if (polizaSel) polizaSel.addEventListener('change', e => togglePoliza(e.target.value));

  const aprobadaPorSel = document.getElementById('aprobadaPor');
  if (aprobadaPorSel) {
    aprobadaPorSel.addEventListener('change', e => actualizarAprobadaPor(e.target.value));
    actualizarAprobadaPor(aprobadaPorSel.value);
  }

  const buscarBtn = document.getElementById('buscarResolucion');
  if (buscarBtn) buscarBtn.addEventListener('click', abrirDigestoResolucion);
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
    row.innerHTML = `
      <span>${ordinalesMasc[i]} Salto</span>
      <input type="text" class="salto-acum" placeholder="NN,NN">
      <input type="text" class="salto-fecha" placeholder="MM/AA">
    `;
    cont.appendChild(row);
  }
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
}

function toggleEmpresaOtro(val) {
  const lbl = document.getElementById('empresaOtroLabel');
  if (!lbl) return;
  if (val === 'OTRO') lbl.classList.remove('oculto');
  else lbl.classList.add('oculto');
}

function togglePoliza(val) {
  const form = document.getElementById('polizaForm');
  if (!form) return;
  if (val === 'si') form.classList.remove('oculto');
  else form.classList.add('oculto');
}

const ordinalesMasc = [
  'Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo',
  'Undécimo', 'Duodécimo', 'Decimotercer', 'Decimocuarto', 'Decimoquinto', 'Decimosexto', 'Decimoséptimo', 'Decimooctavo', 'Decimonoveno', 'Vigésimo'
];

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

function abrirDigestoResolucion() {
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
  const url = `https://www.muninqn.gov.ar/info/doc/digesto/RESOLUCIONES/20${anioCorto}/r-${numero}-${anioCorto}-.pdf`;
  const nuevaVentana = window.open(url, '_blank');
  if (nuevaVentana) nuevaVentana.opener = null;
}
