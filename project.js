window.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.form-container');
  if (container) {
    container.classList.add('loaded');
  }
});

function addDays(date, days) {
  const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function formatDate(date) {
  return date.toLocaleDateString('es-AR');
}

function buildFojas(startDate, finalDate, suspensions = []) {
  const fojas = [];
  const sorted = suspensions.sort((a, b) => a[0] - b[0]);
  let currentStart = new Date(startDate);

  while (currentStart <= finalDate) {
    const nextBreak = addDays(currentStart, 29);
    const nextSusp = sorted.length ? sorted[0] : null;

    if (nextSusp && nextSusp[0] <= nextBreak) {
      const measurement = addDays(nextSusp[1], 1);
      fojas.push({ desde: formatDate(currentStart), hasta: formatDate(measurement) });
      currentStart = addDays(measurement, 1);
      sorted.shift();
    } else if (nextBreak <= finalDate) {
      fojas.push({ desde: formatDate(currentStart), hasta: formatDate(nextBreak) });
      currentStart = addDays(nextBreak, 1);
    } else {
      fojas.push({ desde: formatDate(currentStart), hasta: formatDate(finalDate) });
      break;
    }
  }

  return fojas;
}

function generarTablaFojas(fojas) {
  if (fojas.length === 0) return '';
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
    const label = index === fojas.length - 1 ? `${index + 1} FINAL` : `${index + 1}`;
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

  const hasSuspensions = document.getElementById("hasSuspensions").value === "yes";
  const hasPauses = document.getElementById("hasPauses").value === "yes";

  let suspensions = [];
  let pauses = [];

  if (hasSuspensions) {
    const groups = document.querySelectorAll(".suspensionGroup");
    for (const group of groups) {
      const rawRange = group.querySelector(".suspensionRange").value;
      if (!rawRange || !rawRange.includes(" a ")) {
        continue;
      }
      const [rawStartP, rawEnd] = rawRange.split(" a ");
      const [sY, sM, sD] = rawStartP.split("-").map(Number);
      const [eY, eM, eD] = rawEnd.split("-").map(Number);
      const sStart = new Date(sY, sM - 1, sD);
      const sEnd = new Date(eY, eM - 1, eD);
      if (!isNaN(sStart) && !isNaN(sEnd) && sStart <= sEnd) {
        suspensions.push([sStart, sEnd]);
      }
    }
  }

  if (hasPauses) {
    const groups = document.querySelectorAll(".pauseGroup");
    for (const group of groups) {
      const rawRange = group.querySelector(".pauseRange").value;
      if (!rawRange || !rawRange.includes(" a ")) {
        continue;
      }
      const [rawStartP, rawEnd] = rawRange.split(" a ");
      const [sY, sM, sD] = rawStartP.split("-").map(Number);
      const [eY, eM, eD] = rawEnd.split("-").map(Number);
      const pStart = new Date(sY, sM - 1, sD);
      const pEnd = new Date(eY, eM - 1, eD);
      if (!isNaN(pStart) && !isNaN(pEnd) && pStart <= pEnd) {
        pauses.push([pStart, pEnd]);
      }
    }
  }

  let currentDate = addDays(startDate, initialDays - 1);

  let resultHTML = `<h2 class="report-title">REPORTE GENERADO POR LA APP CERTY</h2>`;
  resultHTML += `<p><strong>Fecha de inicio:</strong> ${formatDate(startDate)}</p>`;
  resultHTML += `<p><strong>Plazo inicial:</strong> ${initialDays} días</p>`;

  if (hasSuspensions && suspensions.length > 0) {
    resultHTML += '<p><strong>Suspensiones:</strong></p><ul>';
    suspensions.forEach(([sStart, sEnd], i) => {
      resultHTML += `<li>Suspensión ${i + 1}: ${formatDate(sStart)} a ${formatDate(sEnd)}</li>`;
      const diff = Math.round((sEnd - sStart) / (1000 * 60 * 60 * 24)) + 1;
      currentDate = addDays(currentDate, diff);
    });
    resultHTML += '</ul>';
  } else {
    resultHTML += `<p><strong>Suspensiones:</strong> No hubo</p>`;
  }

  if (hasPauses && pauses.length > 0) {
    resultHTML += '<p><strong>Paralizaciones:</strong></p><ul>';
    pauses.forEach(([pStart, pEnd], i) => {
      resultHTML += `<li>Paralización ${i + 1}: ${formatDate(pStart)} a ${formatDate(pEnd)}</li>`;
      const diff = Math.round((pEnd - pStart) / (1000 * 60 * 60 * 24)) + 1;
      currentDate = addDays(currentDate, diff);
    });
    resultHTML += '</ul>';
  } else {
    resultHTML += `<p><strong>Paralizaciones:</strong> No hubo</p>`;
  }

  resultHTML += '<hr />';
  resultHTML += `<p><strong>Fecha de finalización:</strong> ${formatDate(currentDate)}</p>`;

  const fojas = buildFojas(startDate, currentDate, suspensions);
  resultHTML += `<p><strong>Foja Nº Final:</strong> ${fojas.length} FINAL</p>`;
  resultHTML += generarTablaFojas(fojas);

  document.getElementById("result").innerHTML = resultHTML;
  document.getElementById('printBtn').style.display = 'block';
}

function clearAll() {
  document.getElementById('startDate').value = '';
  document.getElementById('initialDays').value = '';
  document.getElementById('hasSuspensions').value = 'no';
  document.getElementById('hasPauses').value = 'no';
  document.getElementById('suspensionSection').innerHTML = '';
  document.getElementById('pauseSection').innerHTML = '';
  document.getElementById('result').innerHTML = '';
  document.getElementById('printBtn').style.display = 'none';
}

function openPdfReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const resultEl = document.getElementById('result');
  const originalWordSpacing = resultEl.style.wordSpacing;
  const textNodes = [];
  const walker = document.createTreeWalker(resultEl, NodeFilter.SHOW_TEXT, null, false);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeValue.includes(':')) {
      textNodes.push({ node, text: node.nodeValue });
      node.nodeValue = node.nodeValue.replace(/:/g, ' :');
    }
  }
  resultEl.style.wordSpacing = '4px';

  const originalStyles = {};
  const elements = resultEl.getElementsByTagName('*');
  for (let el of elements) {
    if (el.style) {
      originalStyles[el] = {
        color: el.style.color,
        backgroundColor: el.style.backgroundColor
      };
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
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(0, 0, 0);

      const finalize = async () => {
        for (let el in originalStyles) {
          if (el.style) {
            el.style.color = originalStyles[el].color;
            el.style.backgroundColor = originalStyles[el].backgroundColor;
          }
        }
        textNodes.forEach(({ node, text }) => (node.nodeValue = text));
        resultEl.style.wordSpacing = originalWordSpacing;

        const pdfBlob = doc.output('blob');
        const formData = new FormData();
        formData.append('file', pdfBlob, 'informe.pdf');

        try {
          const response = await fetch('/pdf', { method: 'POST', body: formData });
          if (!response.ok) throw new Error('Error en la carga del PDF');
          const { url } = await response.json();
          window.open(url, '_blank');
        } catch (err) {
          console.error('Error generando o enviando el PDF:', err);
          alert('No se pudo generar el PDF.');
        }
      };

      const img = new Image();
      img.src = 'Robot.png';
      img.onload = function() {
        const imgSize = 16;
        const xImg = pageW - 40 - imgSize;
        const yImg = pageH - imgSize - 20;
        doc.addImage(img, 'PNG', xImg, yImg, imgSize, imgSize);
        doc.text('Gracias por usar la app de Certy!', xImg - 10, pageH - 20, { align: 'right' });
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

document.getElementById("hasSuspensions").addEventListener("change", function () {
  const section = document.getElementById("suspensionSection");
  section.innerHTML = "";

  if (this.value === "yes") {
    section.innerHTML = `
      <label>Cantidad de suspensiones:
        <input type="number" id="suspensionCount" min="1" value="1" />
      </label>
      <div id="suspensionsContainer"></div>
    `;

    updateSuspensionSuggestions();

    const countInput = document.getElementById("suspensionCount");
    const container = document.getElementById("suspensionsContainer");

    function renderSuspensionInputs() {
      const count = parseInt(countInput.value) || 0;
      container.innerHTML = "";
      for (let i = 1; i <= count; i++) {
        container.innerHTML += `
          <div class="suspensionGroup">
            <p class="suspensionSuggestion suggestion-box suggestion"></p>
            <label>Suspensión ${i}:
              <input type="text" class="suspensionRange" placeholder="Seleccionar rango"/>
            </label>
          </div>`;
      }
      container.querySelectorAll('.suspensionRange').forEach(el => {
        flatpickr(el, {
          mode: 'range',
          dateFormat: 'Y-m-d',
          altInput: true,
          altFormat: 'd/m/Y',
          locale: 'es',
          rangeSeparator: ' a '
        });
        el.addEventListener('change', updateSuspensionSuggestions);
      });
    }

    countInput.addEventListener("input", () => { renderSuspensionInputs(); updateSuspensionSuggestions(); });
    renderSuspensionInputs();
    updateSuspensionSuggestions();
  }
});

document.getElementById('startDate').addEventListener('change', updateSuspensionSuggestions);

function updateSuspensionSuggestions() {
  const rawStart = document.getElementById('startDate').value;
  const groups = document.querySelectorAll('.suspensionGroup');
  if (groups.length === 0) return;

  let startDate = null;
  if (rawStart) {
    const [y, m, d] = rawStart.split('-').map(Number);
    startDate = new Date(y, m - 1, d);
  }

  let prevFojaEnd = startDate ? new Date(startDate) : null;
  groups.forEach((group, index) => {
    const p = group.querySelector('.suspensionSuggestion');
    if (!startDate) {
      p.textContent = 'Se le sugiere guardar 1 día de los 30 para medir después de la suspensión.';
    } else if (index === 0) {
      const suggestion = addDays(startDate, 29);
      p.innerHTML = `Se le sugiere guardar 1 día de los 30 para medir después de la suspensión. Por lo tanto debería suspender a partir del <span class="suggestion-date">${formatDate(suggestion)}</span>.`;
    } else if (prevFojaEnd) {
      const suggestion = addDays(prevFojaEnd, 30);
      p.innerHTML = `Se le sugiere guardar 1 día de los 30 para medir después de la suspensión. Por lo tanto debería suspender a partir del <span class="suggestion-date">${formatDate(suggestion)}</span>.`;
    } else {
      p.textContent = 'Complete la suspensión anterior para obtener sugerencia.';
    }

    const rangeVal = group.querySelector('.suspensionRange').value;
    if (rangeVal && rangeVal.includes(' a ')) {
      const [, rawEnd] = rangeVal.split(' a ');
      const [eY, eM, eD] = rawEnd.split('-').map(Number);
      prevFojaEnd = addDays(new Date(eY, eM - 1, eD), 1);
    } else {
      prevFojaEnd = null;
    }
  });
}
