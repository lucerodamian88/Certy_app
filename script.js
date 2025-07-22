// Suma la cantidad exacta de días al calendario
function addDays(date, days) {
  const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function formatDate(date) {
  return date.toLocaleDateString('es-AR');
}

function getWorkingDays(startDate, endDate, pauses = []) {
  const days = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const inPause = pauses.some(([pauseStart, pauseEnd]) =>
      current >= pauseStart && current <= pauseEnd
    );

    if (!inPause) {
      days.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return days;
}

// Devuelve la cantidad de fojas (meses) trabajadas entre dos fechas
// Ejemplo:
// countFojas(new Date('2024-01-01'), new Date('2024-03-31')) => 3
function countFojas(startDate, endDate, pauses = []) {
  if (!(startDate instanceof Date) || isNaN(startDate)) {
    throw new Error('startDate debe ser un objeto Date válido');
  }
  if (!(endDate instanceof Date) || isNaN(endDate)) {
    throw new Error('endDate debe ser un objeto Date válido');
  }
  if (startDate > endDate) {
    throw new Error('startDate no puede ser posterior a endDate');
  }

  const trabajados = getWorkingDays(startDate, endDate, pauses);
  const meses = new Set(trabajados.map(d => `${d.getFullYear()}-${d.getMonth()}`));
  return meses.size;
}

function generarTablaFojas(startDate, endDate, pauses = []) {
  const trabajados = getWorkingDays(startDate, endDate, pauses);

  const fojas = [];
  let fojaNum = 1;

  if (trabajados.length === 0) {
    return '';
  }

  let inicioFoja = trabajados[0];
  let finFoja = trabajados[0];

  for (let i = 1; i < trabajados.length; i++) {
    const dia = trabajados[i];
    const prev = trabajados[i - 1];
    const diff = (dia - prev) / (1000 * 60 * 60 * 24);

    if (diff > 1 || dia.getMonth() !== prev.getMonth()) {
      fojas.push({
        numero: fojaNum++,
        desde: formatDate(inicioFoja),
        hasta: formatDate(finFoja),
      });
      inicioFoja = dia;
    }
    finFoja = dia;
  }

  fojas.push({
    numero: fojaNum,
    desde: formatDate(inicioFoja),
    hasta: formatDate(finFoja),
  });

  let tablaHTML = `
    <h3>Detalle de Fojas</h3>
    <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse; background: white; color: black; margin-top: 1rem;">
      <thead>
        <tr>
          <th>Foja Nº</th>
          <th>Desde</th>
          <th>Hasta</th>
        </tr>
      </thead>
      <tbody>
  `;

  fojas.forEach(foja => {
    tablaHTML += `
      <tr>
        <td>${foja.numero}</td>
        <td>${foja.desde}</td>
        <td>${foja.hasta}</td>
      </tr>
    `;
  });

  tablaHTML += `</tbody></table>`;
  return tablaHTML;
}

function calculate() {
  const rawStart = document.getElementById("startDate").value;
  const [year, month, day] = rawStart.split("-").map(Number);
  const startDate = new Date(year, month - 1, day);

  const initialDays = parseInt(document.getElementById("initialDays").value);
  const hasPauses = document.getElementById("hasPauses").value === "yes";
  const hasExtension = document.getElementById("hasExtension").value === "yes";

  let pauses = [];

  if (hasPauses) {
    const pauseGroups = document.querySelectorAll(".pauseGroup");
    pauseGroups.forEach(group => {
      const rawStart = group.querySelector(".pauseStart").value;
      const rawEnd = group.querySelector(".pauseEnd").value;

      if (!rawStart || !rawEnd) {
        return;
      }

      const [sY, sM, sD] = rawStart.split("-").map(Number);
      const [eY, eM, eD] = rawEnd.split("-").map(Number);

      const pauseStart = new Date(sY, sM - 1, sD);
      const pauseEnd = new Date(eY, eM - 1, eD);

      if (!isNaN(pauseStart) && !isNaN(pauseEnd) && pauseStart <= pauseEnd) {
        pauses.push([pauseStart, pauseEnd]);
      }
    });
  }

  const finalDate = addDays(startDate, initialDays - 1);
  let currentDate = new Date(finalDate);

  let resultHTML = `<p><strong>Fecha de finalización inicial:</strong> ${formatDate(currentDate)}</p>`;

  if (hasPauses) {
    pauses.forEach(([pauseStart, pauseEnd], i) => {
      const diff = Math.round((pauseEnd - pauseStart) / (1000 * 60 * 60 * 24)) + 1;
      currentDate = addDays(currentDate, diff);
      resultHTML += `<p><strong>Finalización tras Paralización ${i + 1}:</strong> ${formatDate(currentDate)}</p>`;
    });
  }

  if (hasExtension) {
    const extensionDays = parseInt(document.getElementById("extensionDays").value);
    currentDate = addDays(currentDate, extensionDays);
    resultHTML += `<p><strong>Finalización con Ampliación:</strong> ${formatDate(currentDate)}</p>`;
  }

  const fojasIniciales = countFojas(startDate, currentDate, pauses);
  resultHTML += `<p><strong>Fojas totales:</strong> ${fojasIniciales}</p>`;
  resultHTML += generarTablaFojas(startDate, currentDate, pauses);

  document.getElementById("result").innerHTML = resultHTML;
}

document.getElementById("hasPauses").addEventListener("change", function () {
  const section = document.getElementById("pauseSection");
  section.innerHTML = "";

  if (this.value === "yes") {
    section.innerHTML = `
      <label>Cantidad de paralizaciones:
        <input type="number" id="pauseCount" min="1" value="1" />
      </label>
      <div id="pausesContainer"></div>
    `;

    const pauseCountInput = document.getElementById("pauseCount");
    const container = document.getElementById("pausesContainer");

    function renderPauseInputs() {
      const count = parseInt(pauseCountInput.value) || 0;
      container.innerHTML = "";
      for (let i = 1; i <= count; i++) {
        container.innerHTML += `
          <div class="pauseGroup">
            <label>Inicio de Paralización ${i}: <input type="date" class="pauseStart" /></label>
            <label>Fin de Paralización ${i}: <input type="date" class="pauseEnd" /></label>
          </div>
        `;
      }
    }

    pauseCountInput.addEventListener("input", renderPauseInputs);
    renderPauseInputs();
  }
});

document.getElementById("hasExtension").addEventListener("change", function () {
  const section = document.getElementById("extensionSection");
  section.innerHTML = "";

  if (this.value === "yes") {
    section.innerHTML = `
      <label>Ampliación de plazo (en días): <input type="number" id="extensionDays" /></label>
    `;
  }
});

