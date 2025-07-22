function addDays(date, days) {
  const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  newDate.setDate(newDate.getDate() + days - 1);
  return newDate;
}

function formatDate(date) {
  return date.toLocaleDateString('es-AR');
}

function calculateFojas(startDate, endDate, pauses = []) {
  const trabajados = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const inPause = pauses.some(([pauseStart, pauseEnd]) =>
      current >= pauseStart && current <= pauseEnd
    );

    if (!inPause) {
      trabajados.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  const meses = new Set(trabajados.map(d => `${d.getFullYear()}-${d.getMonth()}`));
  return meses.size;
}

function generarTablaFojas(startDate, endDate, pauses = []) {
  const trabajados = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const inPause = pauses.some(([pauseStart, pauseEnd]) =>
      current >= pauseStart && current <= pauseEnd
    );

    if (!inPause) {
      trabajados.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  const fojas = [];
  let fojaNum = 1;
  let mesActual = null;
  let inicioFoja = null;
  let finFoja = null;

  trabajados.forEach((dia, idx) => {
    const key = `${dia.getFullYear()}-${dia.getMonth()}`;

    if (key !== mesActual) {
      if (inicioFoja && finFoja) {
        fojas.push({
          numero: fojaNum++,
          desde: formatDate(inicioFoja),
          hasta: formatDate(finFoja),
        });
      }
      mesActual = key;
      inicioFoja = dia;
    }
    finFoja = dia;

    if (idx === trabajados.length - 1) {
      fojas.push({
        numero: fojaNum,
        desde: formatDate(inicioFoja),
        hasta: formatDate(finFoja),
      });
    }
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
      const pauseStart = new Date(group.querySelector(".pauseStart").value);
      const pauseEnd = new Date(group.querySelector(".pauseEnd").value);

      const adjustedStart = new Date(pauseStart);
      adjustedStart.setDate(adjustedStart.getDate() - 1);
      const adjustedEnd = new Date(pauseEnd);
      adjustedEnd.setDate(adjustedEnd.getDate() + 1);

      pauses.push([adjustedStart, adjustedEnd]);
    });
  }

  const finalDate = addDays(startDate, initialDays);
  let currentDate = new Date(finalDate);

  let resultHTML = `<p><strong>Fecha de finalización inicial:</strong> ${formatDate(finalDate)}</p>`;

  if (hasPauses) {
    pauses.forEach(([_, pauseEnd], i) => {
      currentDate = addDays(currentDate, 1); // ya se sumó con días al excluirse
      resultHTML += `<p><strong>Finalización tras Paralización ${i + 1}:</strong> ${formatDate(currentDate)}</p>`;
    });
  }

  if (hasExtension) {
    const extensionDays = parseInt(document.getElementById("extensionDays").value);
    currentDate = addDays(currentDate, extensionDays);
    resultHTML += `<p><strong>Finalización con Ampliación:</strong> ${formatDate(currentDate)}</p>`;
  }

  const fojasIniciales = calculateFojas(startDate, currentDate, pauses);
  resultHTML += `<p><strong>Fojas totales:</strong> ${fojasIniciales}</p>`;
  resultHTML += generarTablaFojas(startDate, currentDate, pauses);

  document.getElementById("result").innerHTML = resultHTML;
}

document.getElementById("hasPauses").addEventListener("change", function () {
  const section = document.getElementById("pauseSection");
  section.innerHTML = "";

  if (this.value === "yes") {
    const cantidad = prompt("¿Cuántas paralizaciones desea cargar?");
    for (let i = 1; i <= cantidad; i++) {
      section.innerHTML += `
        <div class="pauseGroup">
          <label>Inicio de Paralización ${i}: <input type="date" class="pauseStart" /></label>
          <label>Fin de Paralización ${i}: <input type="date" class="pauseEnd" /></label>
        </div>
      `;
    }
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

