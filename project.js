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

function formatISO(date) {
  return date.toISOString().split('T')[0];
}

function endDateForWorkedDays(start, workedDays, nonWorkRanges = []) {
  if (!(start instanceof Date) || isNaN(start)) return null;
  let current = new Date(start);
  let count = 1;
  const isNonWork = d => nonWorkRanges.some(([s, e]) => d >= s && d <= e);
  while (count < workedDays) {
    current = addDays(current, 1);
    if (!isNonWork(current)) count++;
  }
  return current;
}

function buildFojas(startDate, totalWorkedDays, suspensions = [], pauses = []) {
  const fojas = [];
  let currentDate = new Date(startDate);
  let remaining = 30;
  let worked = 0;
  let fojaStart = null;

  const isSuspension = date => suspensions.some(([s, e]) => date >= s && date <= e);
  const getPause = date => pauses.find(([s, e]) => date >= s && date <= e);

  while (worked < totalWorkedDays) {
    const pause = getPause(currentDate);
    if (pause) {
      if (fojaStart && remaining < 30) {
        const end = addDays(currentDate, -1);
        fojas.push({ desde: new Date(fojaStart), hasta: end });
      }
      fojaStart = null;
      currentDate = addDays(pause[1], 1);
      continue;
    }

    if (isSuspension(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    if (!fojaStart) fojaStart = new Date(currentDate);

    worked++;
    remaining--;

    const end = new Date(currentDate);
    if (remaining === 0 || worked === totalWorkedDays) {
      fojas.push({ desde: new Date(fojaStart), hasta: end });
      remaining = 30;
      fojaStart = null;
    }

    currentDate = addDays(currentDate, 1);
  }

  return fojas;
}

function generarTablaFojas(fojas) {
  if (fojas.length === 0) return '';
  let tablaHTML = `
    <div class="fojas-box">
    <h3>Detalle de Fojas</h3>
    <table class="fojas-table">
      <colgroup>
        <col style="width:33.33%">
        <col style="width:33.33%">
        <col style="width:33.33%">
      </colgroup>
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
        <td class="num">${label}</td>
        <td>${formatDate(foja.desde)}</td>
        <td>${formatDate(foja.hasta)}</td>
      </tr>
    `;
  });

  tablaHTML += `</tbody></table></div>`;
  return tablaHTML;
}

function generateCalendar(startDate, endDate, suspensions = [], pauses = [], fojas = []) {
  const months = [];
  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (current <= last) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  const isSuspension = date => suspensions.some(([s, e]) => date >= s && date <= e);
  const isPause = date => pauses.some(([s, e]) => date >= s && date <= e);
  const measurementDays = fojas.map(f => f.hasta.getTime());
  const isMeasurement = date => measurementDays.includes(date.getTime());



  let html = '<div class="calendar">';
  months.forEach(mDate => {
    const year = mDate.getFullYear();
    const month = mDate.getMonth();
    const monthName = mDate.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
    html += `<div class="month"><h4>${monthName}</h4><table><thead><tr>`;
    ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody><tr>';
    const firstDay = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDay; i++) html += '<td></td>';
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      let className = '';

      if (currentDay >= startDate && currentDay <= endDate) {
        if (isSuspension(currentDay)) {
          className = 'suspension-day';
        } else if (isPause(currentDay)) {
          className = 'pause-day';
        } else if (isMeasurement(currentDay)) {
          className = 'measurement-day';
        } else {
          className = 'work-day';
        }
      }

      html += `<td class="${className}">${day}</td>`;
      if ((firstDay + day) % 7 === 0 && day !== daysInMonth) html += '</tr><tr>';
    }
    const trailing = (firstDay + daysInMonth) % 7;
    if (trailing !== 0) {
      for (let i = 0; i < 7 - trailing; i++) html += '<td></td>';
    }
    html += '</tr></tbody></table></div>';
  });
  html += '</div>';
  return html;
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

  let resultHTML = `<h1>REPORTE GENERADO POR CERTY</h1>`;
  resultHTML += `<p><strong>Fecha de inicio:</strong> ${formatDate(startDate)}</p>`;
  resultHTML += `<p><strong>Plazo inicial:</strong> ${initialDays} días</p>`;

  if (hasSuspensions && suspensions.length > 0) {
    resultHTML += '<p><strong>Suspensiones:</strong></p><ul>';
    suspensions.forEach(([sStart, sEnd], i) => {
      resultHTML += `<li>Suspensión ${i + 1}: ${formatDate(sStart)} a ${formatDate(sEnd)}</li>`;
    });
    resultHTML += '</ul>';
  } else {
    resultHTML += `<p><strong>Suspensiones:</strong> No hubo</p>`;
  }

  if (hasPauses && pauses.length > 0) {
    resultHTML += '<p><strong>Paralizaciones:</strong></p><ul>';
    pauses.forEach(([pStart, pEnd], i) => {
      resultHTML += `<li>Paralización ${i + 1}: ${formatDate(pStart)} a ${formatDate(pEnd)}</li>`;
    });
    resultHTML += '</ul>';
  } else {
    resultHTML += `<p><strong>Paralizaciones:</strong> No hubo</p>`;
  }

  const fojas = buildFojas(startDate, initialDays, suspensions, pauses);
  const finalDate = fojas[fojas.length - 1].hasta;

  resultHTML += '<hr />';
  resultHTML += `<p><strong>Fecha de finalización:</strong> ${formatDate(finalDate)}</p>`;
  resultHTML += `<p><strong>Foja Nº Final:</strong> ${fojas.length} FINAL</p>`;
  resultHTML += generarTablaFojas(fojas);

  const resultEl = document.getElementById("reporte");
  resultEl.innerHTML = resultHTML;
  const calendarHTML = generateCalendar(startDate, finalDate, suspensions, pauses, fojas);
  resultEl.insertAdjacentHTML('beforeend', calendarHTML);
  document.getElementById('printSection').style.display = 'flex';
}

function clearAll() {
  document.getElementById('startDate').value = '';
  document.getElementById('initialDays').value = '';
  document.getElementById('hasSuspensions').value = 'no';
  document.getElementById('hasPauses').value = 'no';
  document.getElementById('suspensionSection').innerHTML = '';
  document.getElementById('pauseSection').innerHTML = '';
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
    margin: [40, 40, 40, 40],
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
      doc.setTextColor(0, 0, 0);

      const finalize = () => {
        for (const [el, styles] of originalStyles.entries()) {
          el.style.color = styles.color;
          el.style.backgroundColor = styles.backgroundColor;
        }
        resultEl.classList.remove('pdf-export');

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        if (pdfWindow) pdfWindow.location.href = url; else window.location.href = url;
      };

      const img = new Image();
      img.src = 'Certy_saludando.png';
      img.onload = function () {
        const imgSize = 32 * 1.2;
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

document.getElementById('calculateBtn').addEventListener('click', function () {
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
        el.addEventListener('change', updateSuspensionSuggestions);
      });
    }

    pauseCountInput.addEventListener("input", () => { renderPauseInputs(); updateSuspensionSuggestions(); });
    renderPauseInputs();
    updateSuspensionSuggestions();
  } else {
    updateSuspensionSuggestions();
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
      <label>Foja para sugerencia:
        <select id="suspensionAnchor"></select>
      </label>
      <p id="suspensionSuggestion" class="suspensionSuggestion suggestion"></p>
      <div id="suspensionsContainer"></div>
    `;

    const countInput = document.getElementById("suspensionCount");
    const container = document.getElementById("suspensionsContainer");
    const anchorSelect = document.getElementById("suspensionAnchor");
    anchorSelect.addEventListener('change', updateSuspensionSuggestions);

    function renderSuspensionInputs() {
      const count = parseInt(countInput.value) || 0;
      container.innerHTML = "";
      for (let i = 1; i <= count; i++) {
        container.innerHTML += `
          <div class="suspensionGroup">
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
      });
    }

    countInput.addEventListener("input", () => { renderSuspensionInputs(); updateSuspensionSuggestions(); });
    renderSuspensionInputs();
    updateSuspensionSuggestions();
  } else {
    updateSuspensionSuggestions();
  }
});

document.getElementById('startDate').addEventListener('change', updateSuspensionSuggestions);
document.getElementById('initialDays').addEventListener('input', updateSuspensionSuggestions);

function updateSuspensionSuggestions() {
  const rawStart = document.getElementById('startDate').value;
  const initialVal = parseInt(document.getElementById('initialDays').value);
  const anchorSelect = document.getElementById('suspensionAnchor');
  const groups = document.querySelectorAll('.suspensionGroup');

  let startDate = null;
  if (rawStart) {
    const [y, m, d] = rawStart.split('-').map(Number);
    startDate = new Date(y, m - 1, d);
  }

  let suspensions = [];
  groups.forEach(g => {
    const val = g.querySelector('.suspensionRange').value;
    if (val && val.includes(' a ')) {
      const [rawS, rawE] = val.split(' a ');
      const [sY, sM, sD] = rawS.split('-').map(Number);
      const [eY, eM, eD] = rawE.split('-').map(Number);
      const s = new Date(sY, sM - 1, sD);
      const e = new Date(eY, eM - 1, eD);
      if (!isNaN(s) && !isNaN(e) && s <= e) suspensions.push([s, e]);
    }
  });

  let pauses = [];
  document.querySelectorAll('.pauseGroup').forEach(g => {
    const val = g.querySelector('.pauseRange').value;
    if (val && val.includes(' a ')) {
      const [rawS, rawE] = val.split(' a ');
      const [sY, sM, sD] = rawS.split('-').map(Number);
      const [eY, eM, eD] = rawE.split('-').map(Number);
      const s = new Date(sY, sM - 1, sD);
      const e = new Date(eY, eM - 1, eD);
      if (!isNaN(s) && !isNaN(e) && s <= e) pauses.push([s, e]);
    }
  });

  if (!startDate || isNaN(initialVal)) {
    if (anchorSelect) {
      anchorSelect.innerHTML = '';
    }
    return;
  }

  const fojas = buildFojas(startDate, initialVal, suspensions, pauses);

  if (anchorSelect) {
    const current = anchorSelect.value;
    anchorSelect.innerHTML = '';
    fojas.forEach((_, idx) => {
      const opt = document.createElement('option');
      opt.value = `foja-${idx + 1}`;
      opt.textContent = `Foja ${idx + 1}`;
      anchorSelect.appendChild(opt);
    });
    if ([...anchorSelect.options].some(o => o.value === current)) {
      anchorSelect.value = current;
    } else if (fojas.length > 0) {
      anchorSelect.value = 'foja-1';
    }
  }

  if (groups.length === 0) return;

  let anchorDate = startDate;
  if (anchorSelect) {
    const selVal = anchorSelect.value;
    if (selVal.startsWith('foja-')) {
      const n = parseInt(selVal.split('-')[1]);
      if (fojas[n - 1]) anchorDate = fojas[n - 1].desde;
    }
  }

  const nonWorkRanges = suspensions.concat(pauses);
  const suggestion = endDateForWorkedDays(anchorDate, 30, nonWorkRanges);

  const targetGroup = groups[groups.length - 1];
  const p = document.getElementById('suspensionSuggestion');
  if (!p) return;

  if (suggestion) {
    p.innerHTML = `Se le sugiere guardar 1 día de los 30 para medir después de la suspensión. Por lo tanto debería suspender a partir del <span class="suggestion-date">${formatDate(suggestion)}</span>.`;
    if (targetGroup) {
      const rangeEl = targetGroup.querySelector('.suspensionRange');
      if (rangeEl && !rangeEl.value) {
        const iso = formatISO(suggestion);
        rangeEl._flatpickr.setDate([iso, iso], false);
      }
    }
  } else {
    p.textContent = 'Complete la fecha de inicio y el plazo inicial para obtener sugerencia.';
  }
}
