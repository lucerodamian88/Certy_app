// graficos.js
document.addEventListener('DOMContentLoaded', () => {

  if (!document.getElementById('cgMesesQty')) return; // solo en graficos.html

  Chart.register(ChartDataLabels);

  const form = document.getElementById('chartForm');
  const cgMesesQty = document.getElementById('cgMesesQty');
  const dynamicTablesContainer = document.getElementById('dynamicTablesContainer');
  const cgWarning = document.getElementById('cgWarning');
  const cgDownloadPdfBtn = document.getElementById('cgDownloadPdfBtn');
  const cgHasPauses = document.getElementById('cgHasPauses');
  const cgPauseSection = document.getElementById('cgPauseSection');
  const cgPreviewBtn = document.getElementById('cgPreviewBtn');
  const chartRenderArea = document.getElementById('chartRenderArea');
  const cgFechaInicio = document.getElementById('cgFechaInicio');
  
  // Table Rows (Teorico)
  const tHeadTr = document.getElementById('tHeadTr');
  const tAcumTr = document.getElementById('tAcumTr');
  const tMensualTr = document.getElementById('tMensualTr');
  
  // Table Rows (Real)
  const rHeadTr = document.getElementById('rHeadTr');
  const rAcumTr = document.getElementById('rAcumTr');
  const rMensualTr = document.getElementById('rMensualTr');

  let previewChart = null;

  // Render Dynamic Tables
  cgMesesQty.addEventListener('input', () => {
    const qty = parseInt(cgMesesQty.value) || 0;
    
    // Clear dynamic cells
    document.querySelectorAll('.dinamico').forEach(el => el.remove());
    
    if(qty > 0 && qty <= 100) {
      dynamicTablesContainer.style.display = 'block';
      cgPreviewBtn.style.display = 'inline-flex';
      cgDownloadPdfBtn.style.display = 'inline-flex';
      
      for(let i=1; i<=qty; i++) {
        // Teorico Th
        let thT = document.createElement('th');
        thT.className = 'dinamico'; thT.textContent = `Mes ${i}`;
        tHeadTr.appendChild(thT);

        // Teorico Acum (Input)
        let tdTa = document.createElement('td');
        tdTa.className = 'dinamico';
        let inTi = document.createElement('input');
        inTi.type = 'text'; inTi.className = 'teo-in'; inTi.dataset.index = i;
        tdTa.appendChild(inTi);
        tAcumTr.appendChild(tdTa);

        // Teorico Mensual (Read-only calc)
        let tdTm = document.createElement('td');
        tdTm.className = 'dinamico readonly-cell teo-men';
        tMensualTr.appendChild(tdTm);

        // Real Th
        let thR = document.createElement('th');
        thR.className = 'dinamico'; thR.textContent = `Mes ${i}`;
        rHeadTr.appendChild(thR);

        // Real Acum (Input)
        let tdRa = document.createElement('td');
        tdRa.className = 'dinamico';
        let inRi = document.createElement('input');
        inRi.type = 'text'; inRi.className = 'rea-in'; inRi.dataset.index = i;
        inRi.dataset.manuallyModified = 'false';
        tdRa.appendChild(inRi);
        rAcumTr.appendChild(tdRa);

        // Real Mensual (Read-only calc)
        let tdRm = document.createElement('td');
        tdRm.className = 'dinamico readonly-cell rea-men';
        rMensualTr.appendChild(tdRm);

        // Listeners
        inTi.addEventListener('input', () => {
          let valT = inTi.value;
          // Clonar a Real si no fue modificado manualmente
          if(inRi.dataset.manuallyModified === 'false') {
            inRi.value = valT;
          }
          validateAndCalc();
        });

        inRi.addEventListener('input', () => {
          inRi.dataset.manuallyModified = 'true'; // Se rompe el clonado automatico
          validateAndCalc();
        });
      }
      validateAndCalc(); // initial
    } else {
      dynamicTablesContainer.style.display = 'none';
      cgPreviewBtn.style.display = 'none';
      cgDownloadPdfBtn.style.display = 'none';
      chartRenderArea.style.display = 'none';
    }
  });

  if(cgHasPauses) {
    cgHasPauses.addEventListener("change", function () {
      cgPauseSection.innerHTML = "";
      if (this.value === "yes") {
        cgPauseSection.innerHTML = `
          <label style="margin-top: 1rem; display: block;">Cantidad de paralizaciones:
            <select id="cgPauseCount" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 0.5rem; margin-top: 0.2rem;">
              ${[1,2,3,4,5,6,7,8].map(n => '<option value="' + n + '">' + n + '</option>').join('')}
            </select>
          </label>
          <div id="cgPausesContainer"></div>
        `;

        const cgPauseCount = document.getElementById("cgPauseCount");
        const container = document.getElementById("cgPausesContainer");

        const renderPauseInputs = () => {
          const count = parseInt(cgPauseCount.value) || 0;
          container.innerHTML = "";
          for (let i = 1; i <= count; i++) {
            container.innerHTML += `
              <div style="margin-bottom: 0.5rem;">
                <label>Paralización ${i}:
                  <input type="text" class="cg-pause-range" placeholder="Seleccionar fechas Desde - Hasta" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #ccc; margin-top: 0.2rem;" required />
                </label>
              </div>`;
          }
          container.querySelectorAll('.cg-pause-range').forEach(el => {
            flatpickr(el, {
              mode: 'range',
              dateFormat: 'Y-m-d',
              altInput: true,
              altFormat: 'd/m/Y',
              locale: 'es',
              rangeSeparator: ' a ',
              onChange: () => {
                if(chartRenderArea.style.display !== 'none') {
                  renderCurvaS('sCurveChartPreview', false);
                }
              }
            });
          });
        };

        cgPauseCount.addEventListener("change", renderPauseInputs);
        renderPauseInputs();
      } else {
        if(chartRenderArea.style.display !== 'none') {
           renderCurvaS('sCurveChartPreview', false);
        }
      }
    });
  }

  function parseDateLocal(str) {
    let [y, m, d] = str.split('-');
    return new Date(Number(y), Number(m)-1, Number(d));
  }

  function getPauses() {
    let pauses = [];
    if(cgHasPauses && cgHasPauses.value === 'yes') {
      const inputs = document.querySelectorAll('.cg-pause-range');
      for(let group of inputs) {
        let val = group.value; 
        if(val && val.includes(' a ')) {
          let [s, e] = val.split(' a ');
          pauses.push([parseDateLocal(s), parseDateLocal(e)]);
        }
      }
    }
    return pauses;
  }

  function getCutoffDates(startDate, qty, pauses) {
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const fojas = [];
    let currentFojaDays = [];
    
    let maxIters = 5000; 
    while(fojas.length < qty && maxIters > 0) {
      maxIters--;
      let inPause = pauses.some(p => current >= p[0] && current <= p[1]);
      
      if(!inPause) {
         if(currentFojaDays.length > 0) {
            let prev = currentFojaDays[currentFojaDays.length - 1];
            let diff = (current - prev) / (1000*60*60*24);
            if(diff > 1 || current.getMonth() !== prev.getMonth()) {
               fojas.push(new Date(prev));
               currentFojaDays = [];
            }
         }
         currentFojaDays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    if(currentFojaDays.length > 0 && fojas.length < qty) {
      fojas.push(new Date(currentFojaDays[currentFojaDays.length - 1]));
    }
    
    return fojas;
  }

  function getArr(selector) {
    const inputs = Array.from(document.querySelectorAll(selector));
    return inputs.map(input => {
      let val = input.value.replace(',','.'); // soporte de coma
      let num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });
  }

  function validateAndCalc() {
    const arrT = getArr('.teo-in');
    const arrR = getArr('.rea-in');
    
    const mensT = document.querySelectorAll('.teo-men');
    arrT.forEach((v, idx) => {
      let prev = idx === 0 ? 0 : arrT[idx-1];
      let valMensual = v - prev;
      if(mensT[idx]) mensT[idx].textContent = valMensual.toFixed(4) + '%';
    });

    const mensR = document.querySelectorAll('.rea-men');
    arrR.forEach((v, idx) => {
      let prev = idx === 0 ? 0 : arrR[idx-1];
      let valMensual = v - prev;
      if(mensR[idx]) mensR[idx].textContent = valMensual.toFixed(4) + '%';
    });

    const teoricoInputs = Array.from(document.querySelectorAll('.teo-in'));
    const isComplete = teoricoInputs.length > 0 && teoricoInputs.every(el => el.value.trim() !== "");
    let lastT = teoricoInputs.length > 0 ? arrT[arrT.length - 1] : 0;
    
    if(!isComplete) {
      cgWarning.style.display = 'none';
      togglePdfBtn(false);
      return false;
    } else if(Math.abs(lastT - 100) > 0.0001) {
      cgWarning.textContent = `⚠️ Advertencia: El acumulado final teórico es ${lastT.toFixed(4)}% (diferente de 100.0000%).`;
      cgWarning.style.display = 'block';
      togglePdfBtn(true);
      return true;
    } else {
      cgWarning.style.display = 'none';
      togglePdfBtn(true);
      return true;
    }
  }

  function togglePdfBtn(enable) {
    if(enable) {
      cgDownloadPdfBtn.disabled = false;
      cgDownloadPdfBtn.style.opacity = '1';
      cgDownloadPdfBtn.style.cursor = 'pointer';
    } else {
      cgDownloadPdfBtn.disabled = true;
      cgDownloadPdfBtn.style.opacity = '0.5';
      cgDownloadPdfBtn.style.cursor = 'not-allowed';
    }
  }

  function formatFecha(d) {
    if(!d) return 'Inicio';
    const parts = d.split('-'); 
    if(parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`; // DD/MM/YY
  }

  function renderCurvaS(canvasId, animate = true) {
    const ctx = document.getElementById(canvasId);
    if(!ctx) return null;
    
    if(canvasId === 'sCurveChartPreview' && previewChart) {
      previewChart.destroy();
    }
    
    const arrT = getArr('.teo-in'); 
    const arrR = getArr('.rea-in'); 
    
    const realInputs = document.querySelectorAll('.rea-in');
    let realData = [];
    arrR.forEach((v, idx) => {
      if(realInputs[idx].value.trim() !== '') {
        realData.push(v);
      }
    });

    const rawIni = cgFechaInicio.value;
    const startDate = rawIni ? parseDateLocal(rawIni) : new Date();
    const fIniForm = formatFecha(rawIni);
    const pauses = getPauses();

    const fojasDates = getCutoffDates(startDate, arrT.length, pauses);

    let events = [];
    events.push({ type: 'start', date: startDate, label: fIniForm, valueIndex: null });
    
    for(let i=0; i<arrT.length; i++) {
       events.push({ type: 'mes', date: fojasDates[i] || new Date(startDate.getTime() + (i+1)*30*24*60*60*1000), label: `Mes ${i+1}`, valueIndex: i });
    }

    for(let p of pauses) {
      const pstr = `Susp: ${('0'+p[0].getDate()).slice(-2)}/${('0'+(p[0].getMonth()+1)).slice(-2)}/${p[0].getFullYear().toString().slice(-2)} - ${('0'+p[1].getDate()).slice(-2)}/${('0'+(p[1].getMonth()+1)).slice(-2)}/${p[1].getFullYear().toString().slice(-2)}`;
      events.push({ type: 'susp', date: p[0], label: pstr, valueIndex: null });
    }

    events.sort((a, b) => {
       if (a.date.getTime() === b.date.getTime()) {
          const w = { 'start': 0, 'mes': 1, 'susp': 2 };
          return w[a.type] - w[b.type];
       }
       return a.date - b.date;
    });

    let chartLabels = [];
    let dataT = [];
    let dataR = [];
    
    let lastT = 0;
    let lastR = 0;
    let lastRValid = true; 

    for(let ev of events) {
      chartLabels.push(ev.label);
      
      if(ev.type === 'start') {
        dataT.push(0);
        dataR.push(realData.length > 0 ? 0 : null);
      } else if(ev.type === 'mes') {
        let valT = arrT[ev.valueIndex];
        let valR = realData[ev.valueIndex];
        dataT.push(valT);
        if(valR !== undefined) {
           dataR.push(valR);
           lastR = valR;
           lastRValid = true;
        } else {
           dataR.push(null);
           lastRValid = false;
        }
        lastT = valT;
      } else if(ev.type === 'susp') {
        dataT.push(lastT);
        dataR.push(lastRValid && realData.length > 0 ? lastR : null);
      }
    }

    const datasets = [
      {
        label: 'Teorico',
        data: dataT,
        borderColor: '#000000',
        backgroundColor: '#000000',
        borderWidth: 2.5,
        fill: false,
        tension: 0, 
        pointBackgroundColor: '#fff',
        pointBorderColor: '#000',
        pointRadius: 4,
        pointBorderWidth: 1.5,
        datalabels: {
          align: 'top',
          offset: 6,
          formatter: (v, ctx) => {
            if (v === null) return '';
            if (ctx.dataIndex === 0 && v === 0) return '';
            // Truncate to 2 decimals (no rounding up)
            return (Math.floor(v * 100) / 100).toFixed(2);
          },
          font: { size: canvasId === 'sCurveChartPreview' ? 13 : 16, weight: 'bold' }
        }
      }
    ];

    if(dataR.length > 0) {
      datasets.push({
        label: 'Real',
        data: dataR,
        borderColor: '#000000',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#000',
        pointRadius: 4,
        pointBorderWidth: 1.5,
        datalabels: {
          align: 'bottom',
          offset: 6,
          formatter: (v, ctx) => {
            if (v === null) return '';
            if (ctx.dataIndex === 0 && v === 0) return '';
            
            // Si el valor Real coincide con el Teórico en ese punto, ocultar el sello (retornar blanco)
            if (v === dataT[ctx.dataIndex]) return '';

            // Truncate to 2 decimals (no rounding up)
            return (Math.floor(v * 100) / 100).toFixed(2);
          },
          font: { size: canvasId === 'sCurveChartPreview' ? 13 : 16, weight: 'bold' }
        }
      });
    }

    let maxVal = Math.max(...arrT, ...(realData.length ? realData : []), 100);
    let yMax = 110;
    if (maxVal > 110) {
      yMax = Math.ceil(maxVal / 10) * 10;
    }

    const chartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: chartLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: animate ? { duration: 800 } : false,
        layout: { padding: { top: 30, right: 20 } },
        scales: {
          y: {
            beginAtZero: true,
            max: yMax,
            ticks: { stepSize: yMax > 130 ? 30 : 20, font: { size: 12 } },
            grid: { color: '#ccc' }
          },
          x: {
            offset: true,
            grid: { color: '#ccc' },
            ticks: { 
              font: { size: canvasId === 'sCurveChartPreview' ? 10 : 11, weight: 'bold' },
              maxRotation: 45,
              minRotation: 45
            }
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: { display: true, color: '#000' }
        }
      }
    });

    if(canvasId === 'sCurveChartPreview') previewChart = chartInstance;
    return chartInstance;
  }

  cgPreviewBtn.addEventListener('click', () => {
    if(!validateAndCalc()) return;
    chartRenderArea.style.display = 'block';
    renderCurvaS('sCurveChartPreview', true);
  });

  // Generar PDF
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!validateAndCalc()) return;
    
    const originalText = cgDownloadPdfBtn.innerHTML;
    cgDownloadPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
    cgDownloadPdfBtn.disabled = true;

    try {
      document.getElementById('pdfObra').textContent = document.getElementById('cgObra').value;
      document.getElementById('pdfIdObra').textContent = document.getElementById('cgIdObra').value;
      
      let expText = document.getElementById('cgExpediente').value.trim();
      if(expText && !expText.toUpperCase().startsWith('OE-')) {
        expText = 'OE-' + expText;
      }
      document.getElementById('pdfExpediente').textContent = expText;
      
      document.getElementById('pdfContratista').textContent = document.getElementById('cgContratista').value;
      document.getElementById('pdfInspectores').textContent = document.getElementById('cgInspectores').value;
      
      const fIni = document.getElementById('cgFechaInicio').value;
      const fMed = document.getElementById('cgFechaMedicion').value;
      const fFin = document.getElementById('cgFechaFin').value;
      const foja = document.getElementById('cgFoja').value;

      document.getElementById('pdfFechaInicio').textContent = fIni ? fIni.split('-').reverse().join('/') : '';
      document.getElementById('pdfFechaMedicion').textContent = fMed ? fMed.split('-').reverse().join('/') : '';
      document.getElementById('pdfFechaFin').textContent = fFin ? fFin.split('-').reverse().join('/') : '';
      document.getElementById('pdfFojaHead').textContent = foja;
      document.getElementById('pdfFojaTitle').textContent = foja;
      document.getElementById('pdfFechaMedicionTitle').textContent = formatFecha(fMed);

      // Poblar tabla dinamica
      // Usar comas en vez de puntos y 4 decimales
      const formatNumber = (num) => {
        return num.toFixed(4).replace('.', ',');
      };

      const arrT = getArr('.teo-in');
      const arrR = getArr('.rea-in');
      const realInputs = document.querySelectorAll('.rea-in');

      let realVals = arrR.map((v, i) => {
        if(realInputs[i].value.trim() === '') return undefined;
        return v;
      });

      let tableHtml = `<table class="pdf-table" style="width: auto; margin-left: 0; margin-right: auto; border-collapse: collapse; font-size: 14px; font-family: Arial; text-align: center; border: 1px solid #000; border-radius:0;">
        <tbody>
          <tr><td style="border: 1px solid #000; text-align: left; padding: 6px; width: 190px; border-radius:0;">Porc. Acumulado Teórico</td>`;
      arrT.forEach(val => {
        tableHtml += `<td style="border: 1px solid #000; padding: 6px; width: 55px; border-radius:0;">${formatNumber(val)}</td>`;
      });
      tableHtml += `</tr><tr><td style="border: 1px solid #000; text-align: left; padding: 6px; width: 190px; border-radius:0;">Porc. Acumulado Real</td>`;
      
      realVals.forEach(val => {
        tableHtml += `<td style="border: 1px solid #000; padding: 6px; width: 55px; border-radius:0;">${val !== undefined ? formatNumber(val) : '0,0000'}</td>`;
      });
      tableHtml += `</tr></tbody></table>`;

      document.getElementById('pdfTableContainer').innerHTML = tableHtml;

      const printChart = renderCurvaS('sCurveChartPrint', false);
      await new Promise(r => setTimeout(r, 600));

      const template = document.getElementById('pdfTemplate');
      template.style.left = '0';
      template.style.top = '0';
      template.style.zIndex = '-9999';

      const canvas = await html2canvas(template, {
        scale: 4, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      template.style.left = '-9999px';
      template.style.top = '-9999px';

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      printChart.destroy();

      const { jsPDF } = window.jspdf;
      // Orientation 'l' (landscape)
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // ~297mm
      // Calculate height to maintain ratio. A4 landscape is 297x210
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, pdfHeight); 
      pdf.save(`Curva_Inversion_${document.getElementById('cgExpediente').value}.pdf`);

    } catch (err) {
      console.error(err);
      alert('Error en generacion PDF. Verifica consola.');
    } finally {
      cgDownloadPdfBtn.innerHTML = originalText;
      togglePdfBtn(true);
    }
  });

});
