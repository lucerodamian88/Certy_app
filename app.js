// Asistente de Redeterminación de Precios

document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('abrirAsistente');
  const modal = document.getElementById('loginModal');
  const menu = document.getElementById('servicios');
  const vista = document.getElementById('vistaAsistente');
  const loginIng = document.getElementById('loginIngresar');
  const loginCanc = document.getElementById('loginCancelar');
  const salirBtn = document.getElementById('salirAsistente');
  const genSaltosBtn = document.getElementById('generarSaltos');
  const redactarBtn = document.getElementById('redactarClausula');
  const limpiarBtn = document.getElementById('limpiarFormulario');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (localStorage.getItem('certy_redet_auth') === '1') {
        mostrarAsistente();
      } else {
        modal.classList.remove('oculto');
      }
    });
  }

  loginIng.addEventListener('click', () => {
    const user = document.getElementById('loginUsuario').value.trim();
    const pass = document.getElementById('loginClave').value;
    const err = document.getElementById('loginError');
    if (user === 'LUCERODAMI' && pass === 'RED2025') {
      localStorage.setItem('certy_redet_auth', '1');
      err.textContent = '';
      modal.classList.add('oculto');
      mostrarAsistente();
    } else {
      err.textContent = 'Usuario o contraseña incorrectos.';
    }
  });

  loginCanc.addEventListener('click', () => {
    modal.classList.add('oculto');
  });

  salirBtn.addEventListener('click', () => {
    localStorage.removeItem('certy_redet_auth');
    vista.classList.add('oculto');
    menu.classList.remove('oculto');
  });

  genSaltosBtn.addEventListener('click', generarSaltos);
  redactarBtn.addEventListener('click', redactarClausula);
  limpiarBtn.addEventListener('click', limpiarFormulario);

  if (localStorage.getItem('certy_redet_auth') === '1') {
    mostrarAsistente();
  }

  function mostrarAsistente() {
    menu.classList.add('oculto');
    vista.classList.remove('oculto');
  }
});

function generarSaltos() {
  const cantidad = parseInt(document.getElementById('cantidadSaltos').value, 10);
  const cont = document.getElementById('saltosContainer');
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

function redactarClausula() {
  const nRed = parseInt(document.getElementById('numeroRedet').value, 10);
  if (isNaN(nRed) || nRed < 1) {
    alert('Ingrese el número de redeterminación.');
    return;
  }
  const saltosRows = document.querySelectorAll('#saltosContainer .salto-row');
  if (saltosRows.length === 0) {
    alert('Genere las filas de saltos.');
    return;
  }
  const saltos = [];
  for (const row of saltosRows) {
    const acumStr = row.querySelector('.salto-acum').value.trim();
    const fecha = row.querySelector('.salto-fecha').value.trim();
    if (!acumStr || isNaN(parsePct(acumStr))) {
      alert('Complete los porcentajes acumulados correctamente.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(fecha)) {
      alert('Complete las fechas de los saltos con formato MM/AA.');
      return;
    }
    saltos.push({ acum: parsePct(acumStr), fecha });
  }

  let clausula = `TERCERA: Conforme la metodología aplicada, surge de la aplicación de los coeficientes detallados, la ${ordinalesFem[nRed-1] || nRed + 'ª'} Redeterminación atento a `;

  saltos.forEach((s, idx) => {
    const ord = ordinalesMasc[idx];
    if (idx === 0) {
      clausula += `un ${ord} Salto Inicial de ${toComma(s.acum)}% al ${s.fecha}`;
    } else {
      const prev = saltos[idx - 1].acum;
      const delta = s.acum - prev;
      const ref = idx === 1 ? 'Salto Anterior' : `${ordinalesMasc[idx - 1]} Salto`;
      clausula += `, un ${ord} Salto de ${toComma(s.acum)}% (${toComma(delta)}% respecto del ${ref}) al ${s.fecha}`;
    }
  });

  clausula += ',';

  const monto = document.getElementById('montoDif').value.trim();
  const montoLetras = document.getElementById('montoLetras').value.trim();
  if (monto && montoLetras) {
    clausula += ` generando esto una Diferencia de Precios para la Obra de $${monto} son (${montoLetras}).`;
  }
  const periodo = document.getElementById('periodoSaldo').value.trim();
  if (periodo) {
    const ult = saltos[saltos.length - 1];
    const ordUlt = ordinalesMasc[saltos.length - 1];
    clausula += ` El ${ordUlt} Salto de ${toComma(ult.acum)}% acumulado será de aplicación para el saldo de obra a partir del período ${periodo}.`;
  }
  document.getElementById('resultado').value = clausula;
}

function limpiarFormulario() {
  document.getElementById('formAsistente').reset();
  document.getElementById('saltosContainer').innerHTML = '';
  document.getElementById('resultado').value = '';
}

function toComma(n) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePct(str) {
  if (!str) return NaN;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

const ordinalesMasc = [
  'Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo',
  'Undécimo', 'Duodécimo', 'Decimotercer', 'Decimocuarto', 'Decimoquinto', 'Decimosexto', 'Decimoséptimo', 'Decimoctavo', 'Decimonoveno', 'Vigésimo'
];

const ordinalesFem = [
  'Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta', 'Sexta', 'Séptima', 'Octava', 'Novena', 'Décima',
  'Undécima', 'Duodécima', 'Decimotercera', 'Decimocuarta', 'Decimoquinta', 'Decimosexta', 'Decimoséptima', 'Decimoctava', 'Decimonovena', 'Vigésima'
];

function onEmpresaChange(nombre) {
  // TODO: integrar con Google Sheets
  fetchEmpresaPorNombre(nombre);
}

function fetchEmpresaPorNombre(nombre) {
  // TODO: Implementar búsqueda de empresa en Sheets
}
