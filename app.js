// Lógica del Asistente de Redeterminación de Precios

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('loginModal');
  if (modal && localStorage.getItem('certy_redet_auth') !== '1') {
    modal.classList.remove('oculto');
  }

  const loginIng = document.getElementById('loginIngresar');
  if (loginIng) {
    loginIng.addEventListener('click', () => {
      const user = document.getElementById('loginUsuario');
      const pass = document.getElementById('loginClave');
      const err = document.getElementById('loginError');
      if (user && pass && err) {
        if (user.value.trim() === 'LUCERODAMI' && pass.value === 'RED2025') {
          localStorage.setItem('certy_redet_auth', '1');
          err.textContent = '';
          if (modal) modal.classList.add('oculto');
        } else {
          err.textContent = 'Usuario o contraseña incorrectos.';
        }
      }
    });
  }

  const loginCanc = document.getElementById('loginCancelar');
  if (loginCanc) {
    loginCanc.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  const salirBtn = document.getElementById('salirAsistente');
  if (salirBtn) {
    salirBtn.addEventListener('click', () => {
      localStorage.removeItem('certy_redet_auth');
      window.location.href = 'index.html';
    });
  }

  const genSaltosBtn = document.getElementById('generarSaltos');
  if (genSaltosBtn) genSaltosBtn.addEventListener('click', generarSaltos);

  const limpiarBtn = document.getElementById('limpiarFormulario');
  if (limpiarBtn) limpiarBtn.addEventListener('click', limpiarFormulario);

  const empresaSel = document.getElementById('empresa');
  if (empresaSel) empresaSel.addEventListener('change', e => toggleEmpresaOtro(e.target.value));

  const polizaSel = document.getElementById('tienePoliza');
  if (polizaSel) polizaSel.addEventListener('change', e => togglePoliza(e.target.value));
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
  const poliza = document.getElementById('tienePoliza');
  if (poliza) togglePoliza(poliza.value);
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
