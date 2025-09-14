// Lógica del Asistente de Redeterminación de Precios

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('loginModal');
  const loginIng = document.getElementById('loginIngresar');
  const loginCanc = document.getElementById('loginCancelar');
  const salirBtn = document.getElementById('salirAsistente');
  const genSaltosBtn = document.getElementById('generarSaltos');
  const limpiarBtn = document.getElementById('limpiarFormulario');
  const empresaSel = document.getElementById('empresa');
  const polizaSel = document.getElementById('tienePoliza');

  if (localStorage.getItem('certy_redet_auth') !== '1') {
    modal.classList.remove('oculto');
  }

  loginIng.addEventListener('click', () => {
    const user = document.getElementById('loginUsuario').value.trim();
    const pass = document.getElementById('loginClave').value;
    const err = document.getElementById('loginError');
    if (user === 'LUCERODAMI' && pass === 'RED2025') {
      localStorage.setItem('certy_redet_auth', '1');
      err.textContent = '';
      modal.classList.add('oculto');
    } else {
      err.textContent = 'Usuario o contraseña incorrectos.';
    }
  });

  loginCanc.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  salirBtn.addEventListener('click', () => {
    localStorage.removeItem('certy_redet_auth');
    window.location.href = 'index.html';
  });

  genSaltosBtn.addEventListener('click', generarSaltos);
  limpiarBtn.addEventListener('click', limpiarFormulario);
  empresaSel.addEventListener('change', e => toggleEmpresaOtro(e.target.value));
  polizaSel.addEventListener('change', e => togglePoliza(e.target.value));
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

function limpiarFormulario() {
  document.getElementById('formAsistente').reset();
  document.getElementById('saltosContainer').innerHTML = '';
  toggleEmpresaOtro(document.getElementById('empresa').value);
  togglePoliza(document.getElementById('tienePoliza').value);
}

function toggleEmpresaOtro(val) {
  const lbl = document.getElementById('empresaOtroLabel');
  if (val === 'OTRO') lbl.classList.remove('oculto');
  else lbl.classList.add('oculto');
}

function togglePoliza(val) {
  const form = document.getElementById('polizaForm');
  if (val === 'si') form.classList.remove('oculto');
  else form.classList.add('oculto');
}

const ordinalesMasc = [
  'Primer', 'Segundo', 'Tercer', 'Cuarto', 'Quinto', 'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo',
  'Undécimo', 'Duodécimo', 'Decimotercer', 'Decimocuarto', 'Decimoquinto', 'Decimosexto', 'Decimoséptimo', 'Decimooctavo', 'Decimonoveno', 'Vigésimo'
];
