window.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.form-container');
  if (container) {
    container.classList.add('loaded');
  }
});

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
          <th>Fecha de medición</th>
        </tr>
      </thead>
      <tbody>
  `;

  fojas.forEach((foja, index) => {
    const label = index === fojas.length - 1 ? `${foja.numero} FINAL` : `${foja.numero}`;
    tablaHTML += `
      <tr>
        <td>${label}</td>
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

  if (!rawStart || isNaN(startDate)) {
    alert('Ingrese una fecha de inicio válida.');
    return;
  }

  const initialDays = parseInt(document.getElementById("initialDays").value);
  if (isNaN(initialDays) || initialDays <= 0) {
    alert('El plazo inicial debe ser un número positivo.');
    return;
  }
  const hasPauses = document.getElementById("hasPauses").value === "yes";
  const hasExtension = document.getElementById("hasExtension").value === "yes";

  let pauses = [];

  if (hasPauses) {
    const pauseGroups = document.querySelectorAll(".pauseGroup");
    for (const group of pauseGroups) {
      const rawRange = group.querySelector(".pauseRange").value;
      if (!rawRange || !rawRange.includes(" a ")) {
        continue;
      }
      const [rawStartP, rawEnd] = rawRange.split(" a ");

      const [sY, sM, sD] = rawStartP.split("-").map(Number);
      const [eY, eM, eD] = rawEnd.split("-").map(Number);

      const pauseStart = new Date(sY, sM - 1, sD);
      const pauseEnd = new Date(eY, eM - 1, eD);

      if (pauseStart < startDate) {
        Swal.fire({
          imageUrl: 'Certy_advertencia.png',
          imageAlt: 'Advertencia',
          imageWidth: 202,
          imageHeight: 252,
          text: 'La paralización no puede tener fecha anterior al de inicio de la obra. Revise los datos.',
          timer: 5000,
          timerProgressBar: true
        });
        return;
      }

      if (!isNaN(pauseStart) && !isNaN(pauseEnd) && pauseStart <= pauseEnd) {
        pauses.push([pauseStart, pauseEnd]);
      }
    }
    // Validar solapamientos
    pauses.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < pauses.length; i++) {
      if (pauses[i][0] <= pauses[i - 1][1]) {
        Swal.fire({
          imageUrl: 'Certy_advertencia.png',
          imageAlt: 'Advertencia',
          imageWidth: 202,
          imageHeight: 252,
          text: 'Los plazos de las paralizaciones se solapan, corregir.',
          timer: 5000,
          timerProgressBar: true
        });
        return;
      }
    }
  }

  const finalDate = addDays(startDate, initialDays - 1);
  let currentDate = new Date(finalDate);

  let resultHTML = `<h1>REPORTE GENERADO POR CERTY</h1>`;
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
    if (isNaN(extensionDays) || extensionDays <= 0) {
      alert('La ampliación de plazo debe ser un número positivo.');
      return;
    }
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
  resultHTML += `<p><strong>Foja Nº Final:</strong> ${fojasIniciales} FINAL</p>`;
  if (showWarning) {
    resultHTML += `<p class="warning">OJO! ten en cuenta que si paralizás la obra con fecha posterior al inicio, debés generar una foja un día antes de la paralización.</p>`;
  }
  resultHTML += generarTablaFojas(startDate, currentDate, pauses);

  document.getElementById("reporte").innerHTML = resultHTML;
    document.getElementById('printSection').style.display = 'flex';
}

function clearAll() {
  document.getElementById('startDate').value = '';
  document.getElementById('initialDays').value = '';
  document.getElementById('hasPauses').value = 'no';
  document.getElementById('hasExtension').value = 'no';
  document.getElementById('pauseSection').innerHTML = '';
  document.getElementById('extensionSection').innerHTML = '';
  document.getElementById('reporte').innerHTML = '';
    document.getElementById('printSection').style.display = 'none';
}

async function openPdfReport() {
  const resultEl = document.getElementById('reporte');

  resultEl.classList.add('pdf-export');

  if (window.isAndroidWebView && window.isAndroidWebView()) {
    try {
      const response = await fetch('/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: resultEl.innerHTML })
      });
      if (!response.ok) throw new Error('Error en la generación del PDF');
      const { url } = await response.json();
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error generando PDF en el servidor:', err);
      alert('No se pudo generar el PDF.');
    }
    return;
  }
  const pdfWindow = window.open('', '_blank');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4', lineHeightFactor: 1.5 });

  // Save original styles using a Map to restore them later
  const originalStyles = new Map();
  const elements = resultEl.getElementsByTagName('*');
  for (let el of elements) {
    if (el.style) {
      originalStyles.set(el, {
        color: el.style.color,
        backgroundColor: el.style.backgroundColor
      });
      el.style.color = '#000000';
      el.style.backgroundColor = '#FFFFFF';
    }
  }

  doc.setFont('Arial', 'normal');
  doc.setCharSpace(0.5);

  doc.html(resultEl, {
    margin: [40, 40, 60, 40],
    html2canvas: {
      scale: 0.8,
      logging: true,
      useCORS: true
    },
    callback: function (doc) {
      const pageH = doc.internal.pageSize.getHeight();
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFontSize(12);
      doc.setFont('Arial', 'normal');
      doc.setCharSpace(0);
      doc.setTextColor(0, 0, 0); // Black text

      const finalize = () => {
        for (const [el, styles] of originalStyles.entries()) {
          el.style.color = styles.color;
          el.style.backgroundColor = styles.backgroundColor;
        }
        resultEl.classList.remove('pdf-export');

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        if (pdfWindow) {
          pdfWindow.location.href = url;
        } else {
          window.location.href = url;
        }
      };

      const img = new Image();
      img.src = 'Certy_saludando.png';
      img.onload = function() {
        const imgSize = 16 * 1.2;
        const xImg = pageW - 40 - imgSize;
        const yImg = pageH - imgSize - 20;
        doc.addImage(img, 'PNG', xImg, yImg, imgSize, imgSize);
        doc.setFont('Arial', 'italic');
        const textX = xImg - 10;
        doc.text('Gracias por usar Certy!', textX, pageH - 20, { align: 'right' });
        finalize();
      };
      img.onerror = finalize;
    }
  });
}

document.getElementById('calculateBtn').addEventListener('click', function() {
  this.classList.add('shake');
  setTimeout(() => this.classList.remove('shake'), 300);
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
            <label>Paralización ${i}:
              <input type="text" class="pauseRange" placeholder="Seleccionar rango"/>
            </label>
          </div>`;
      }
      container.querySelectorAll('.pauseRange').forEach(el => {
        flatpickr(el, {
          mode: 'range',
          dateFormat: 'Y-m-d',
          altInput: true,
          altFormat: 'd/m/Y',
          locale: 'es',
          rangeSeparator: ' a '
        });
      });
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
