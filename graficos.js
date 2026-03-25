// graficos.js
document.addEventListener('DOMContentLoaded', () => {

  if (!document.getElementById('cgMesesQty')) return; // solo en graficos.html

  Chart.register(ChartDataLabels);

  const form = document.getElementById('chartForm');
  const cgMesesQty = document.getElementById('cgMesesQty');
  const dynamicTablesContainer = document.getElementById('dynamicTablesContainer');
  const cgWarning = document.getElementById('cgWarning');
  const cgDownloadPdfBtn = document.getElementById('cgDownloadPdfBtn');
  const cgPreviewBtn = document.getElementById('cgPreviewBtn');
  const chartRenderArea = document.getElementById('chartRenderArea');
  const cgFechaInicio = document.getElementById('cgFechaInicio');
  
  // Table Rows (Teorico)
  const tHeadTr = document.getElementById('tHeadTr');
  const tInputTr = document.getElementById('tInputTr');
  const tAcumTr = document.getElementById('tAcumTr');
  
  // Table Rows (Real)
  const rHeadTr = document.getElementById('rHeadTr');
  const rInputTr = document.getElementById('rInputTr');
  const rAcumTr = document.getElementById('rAcumTr');

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

        // Teorico Input
        let tdTi = document.createElement('td');
        tdTi.className = 'dinamico';
        let inTi = document.createElement('input');
        inTi.type = 'text'; inTi.className = 'teo-in'; inTi.dataset.index = i;
        tdTi.appendChild(inTi);
        tInputTr.appendChild(tdTi);

        // Teorico Acum
        let tdTa = document.createElement('td');
        tdTa.className = 'dinamico readonly-cell teo-acum';
        tAcumTr.appendChild(tdTa);

        // Real Th
        let thR = document.createElement('th');
        thR.className = 'dinamico'; thR.textContent = `Mes ${i}`;
        rHeadTr.appendChild(thR);

        // Real Input
        let tdRi = document.createElement('td');
        tdRi.className = 'dinamico';
        let inRi = document.createElement('input');
        inRi.type = 'text'; inRi.className = 'rea-in'; inRi.dataset.index = i;
        inRi.dataset.manuallyModified = 'false';
        tdRi.appendChild(inRi);
        rInputTr.appendChild(tdRi);

        // Real Acum
        let tdRa = document.createElement('td');
        tdRa.className = 'dinamico readonly-cell rea-acum';
        rAcumTr.appendChild(tdRa);

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
    
    let sumT = 0;
    const acumsT = document.querySelectorAll('.teo-acum');
    arrT.forEach((v, idx) => {
      sumT += v;
      if(acumsT[idx]) acumsT[idx].textContent = sumT.toFixed(4) + '%';
    });

    let sumR = 0;
    const acumsR = document.querySelectorAll('.rea-acum');
    arrR.forEach((v, idx) => {
      sumR += v;
      if(acumsR[idx]) acumsR[idx].textContent = sumR.toFixed(4) + '%';
    });

    const isComplete = arrT.every(v => document.querySelectorAll('.teo-in')[arrT.indexOf(v)].value !== "");
    
    if(isComplete && Math.abs(sumT - 100) > 0.0001) {
      cgWarning.textContent = `⚠️ La suma teórica actual es ${sumT.toFixed(4)}%. El total debe ser 100.0000% para generar la curva oficial.`;
      cgWarning.style.display = 'block';
      togglePdfBtn(false);
      return false;
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
    
    let cumT = 0, cumR = 0;
    const acumsT = arrT.map(v => { cumT += v; return cumT; });
    
    // Real stops matching if the user hasn't filled all inputs yet, but since we clone, it's ok.
    // However, if an input is empty literally, we shouldn't draw the line to zero abruptly if it's in the future.
    // We filter out entirely empty future inputs for Real.
    const realInputs = document.querySelectorAll('.rea-in');
    let realData = [];
    arrR.forEach((v, idx) => {
      if(realInputs[idx].value.trim() === '') {
        // empty => no point yet
        return;
      }
      cumR += v;
      realData.push(cumR);
    });

    const fechaIniForm = formatFecha(cgFechaInicio.value);
    
    // Agregar un espaciador al inicio (X vacio, Y null) para que la curva NO pegue exactamente contra el eje Y
    let chartLabels = ["", fechaIniForm];
    for(let i=0; i<arrT.length; i++) {
      chartLabels.push(`Mes ${i+1}`);
    }

    const dataT = [null, 0, ...acumsT];
    const dataR = realData.length > 0 ? [null, 0, ...realData] : [];

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
            if (ctx.dataIndex === 1 && v === 0) return '';
            return v.toFixed(2);
          },
          font: { size: 11, weight: 'bold' }
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
            if (ctx.dataIndex === 1 && v === 0) return '';
            return v.toFixed(2);
          },
          font: { size: 11, weight: 'bold' }
        }
      });
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
            max: 110,
            ticks: { stepSize: 20, font: { size: 12 } },
            grid: { color: '#ccc' }
          },
          x: {
            grid: { color: '#ccc' },
            ticks: { font: { size: 11, weight: 'bold' } }
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

      let cumT = 0, cumR = 0;
      let acumsT = arrT.map(v => { cumT += v; return cumT; });
      let realVals = arrR.map((v, i) => {
        if(realInputs[i].value.trim() === '') return undefined;
        cumR += v;
        return cumR;
      });

      let tableHtml = `<table class="pdf-table" style="width: auto; margin:auto; border-collapse: collapse; font-size: 14px; font-family: Arial; text-align: center; border: 1px solid #000; border-radius:0;">
        <tbody>
          <tr><td style="border: 1px solid #000; text-align: left; padding: 6px; width: 140px; border-radius:0;">Porc. Acumulado Teórico</td>`;
      acumsT.forEach(val => {
        tableHtml += `<td style="border: 1px solid #000; padding: 6px; width: 55px; border-radius:0;">${formatNumber(val)}</td>`;
      });
      tableHtml += `</tr><tr><td style="border: 1px solid #000; text-align: left; padding: 6px; width: 140px; border-radius:0;">Porc. Acumulado Real</td>`;
      
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
