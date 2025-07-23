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
    <div class="fojas-box">
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

  tablaHTML += `</tbody></table></div>`;
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

  let resultHTML = `<h2>REPORTE GENERADO POR CERTY</h2>`;
  resultHTML += `<p><strong>Fecha de inicio:</strong> ${formatDate(startDate)}</p>`;
  resultHTML += `<p><strong>Plazo inicial:</strong> ${initialDays} días</p>`;

  if (hasPauses && pauses.length > 0) {
    resultHTML += '<p><strong>Paralizaciones:</strong></p><ul>';
    pauses.forEach(([pauseStart, pauseEnd], i) => {
      resultHTML += `<li>Paralización ${i + 1}: ${formatDate(pauseStart)} a ${formatDate(pauseEnd)}</li>`;
    });
    resultHTML += '</ul>';
  } else {
    resultHTML += `<p><strong>Paralizaciones:</strong> No hubo</p>`;
  }

  let extensionDays = 0;

  if (hasExtension) {
    extensionDays = parseInt(document.getElementById("extensionDays").value);
    resultHTML += `<p><strong>Ampliación de plazo:</strong> ${extensionDays} días</p>`;
  } else {
    resultHTML += `<p><strong>Ampliación de plazo:</strong> No se solicitó</p>`;
  }

  resultHTML += '<hr />';
  resultHTML += `<p><strong>Fecha de finalización inicial:</strong> ${formatDate(currentDate)}</p>`;

  let showWarning = false;

  if (hasPauses) {
    pauses.forEach(([pauseStart, pauseEnd], i) => {
      const diff = Math.round((pauseEnd - pauseStart) / (1000 * 60 * 60 * 24)) + 1;
      currentDate = addDays(currentDate, diff);
      resultHTML += `<p><strong>Finalización tras Paralización ${i + 1}:</strong> ${formatDate(currentDate)}</p>`;
    });
    if (pauses.some(([pStart]) => pStart > startDate)) {
      showWarning = true;
    }
  }

  if (hasExtension) {
    currentDate = addDays(currentDate, extensionDays);
    resultHTML += `<p><strong>Finalización con Ampliación:</strong> ${formatDate(currentDate)}</p>`;
  }

  const fojasIniciales = countFojas(startDate, currentDate, pauses);
  resultHTML += `<p><strong>Fojas totales:</strong> ${fojasIniciales}</p>`;
  if (showWarning) {
    resultHTML += `<p class="warning">Si paralizás la obra con fecha posterior al inicio, debés generar una foja un día antes de la paralización.</p>`;
  }
  resultHTML += generarTablaFojas(startDate, currentDate, pauses);

  document.getElementById("result").innerHTML = resultHTML;
  document.getElementById('shareBtn').style.display = 'block';
}

function clearAll() {
  document.getElementById('startDate').value = '';
  document.getElementById('initialDays').value = '';
  document.getElementById('hasPauses').value = 'no';
  document.getElementById('hasExtension').value = 'no';
  document.getElementById('pauseSection').innerHTML = '';
  document.getElementById('extensionSection').innerHTML = '';
  document.getElementById('result').innerHTML = '';
  document.getElementById('shareBtn').style.display = 'none';
}

function shareWhatsApp() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const resultEl = document.getElementById('result');
  
  // Save original styles
  const originalStyles = {};
  const elements = resultEl.getElementsByTagName('*');
  for (let el of elements) {
    if (el.style) {
      originalStyles[el] = {
        color: el.style.color,
        backgroundColor: el.style.backgroundColor
      };
      // Force black text and white background for PDF
      el.style.color = '#000000';
      el.style.backgroundColor = '#FFFFFF';
    }
  }
  
  doc.html(resultEl, {
    margin: [40, 40, 60, 40],
    html2canvas: { 
      scale: 0.8,
      logging: true,
      useCORS: true
    },
    callback: function (doc) {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Black text
      doc.text('Gracias por usar la app de Certy!', 40, pageH - 20);
      
      // Restore original styles
      for (let el in originalStyles) {
        if (el.style) {
          el.style.color = originalStyles[el].color;
          el.style.backgroundColor = originalStyles[el].backgroundColor;
        }
      }
      
      const fileName = 'Reporte' + Date.now() + '.pdf';
      doc.save(fileName);
      const text = 'Te envío los resultados en PDF. Compartí el archivo generado.';
      window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
    }
  });
}

document.getElementById('calculateBtn').addEventListener('click', function() {
  this.classList.add('robot');
  setTimeout(() => this.classList.remove('robot'), 300);
});

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
            <label>Inicio de Paralización ${i}: <input type="date" class="pauseStart" placeholder="Inicio" /></label>
            <label>Fin de Paralización ${i}: <input type="date" class="pauseEnd" placeholder="Fin" /></label>
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
      <label>Ampliación de plazo (en días): <input type="number" id="extensionDays" placeholder="Cantidad" /></label>
    `;
  }
});
