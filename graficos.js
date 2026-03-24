// graficos.js
document.addEventListener('DOMContentLoaded', () => {

  Chart.register(ChartDataLabels);

  const openBtn = document.getElementById('openChartModalBtn');
  const overlay = document.getElementById('chartModalOverlay');
  const closeBtn = document.getElementById('closeChartModalBtn');
  const form = document.getElementById('chartForm');
  
  const cgPorcentajesTeorico = document.getElementById('cgPorcentajesTeorico');
  const cgPorcentajesReal = document.getElementById('cgPorcentajesReal');
  const cgWarning = document.getElementById('cgWarning');
  const cgDownloadPdfBtn = document.getElementById('cgDownloadPdfBtn');
  const cgPreviewBtn = document.getElementById('cgPreviewBtn');
  const chartRenderArea = document.getElementById('chartRenderArea');
  const cgFechaInicio = document.getElementById('cgFechaInicio');
  
  let previewChart = null;

  // Abrir / Cerrar Modal
  if(openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.style.display = 'flex';
    });
  }
  if(closeBtn) {
    closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });
  }
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) overlay.style.display = 'none';
  });

  // Utiles
  function parseVals(val) {
    if(!val) return [];
    return val.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  }
  function getCumulative(arr) {
    let sum = 0;
    return arr.map(v => { sum += v; return sum; });
  }
  function formatFecha(d) {
    if(!d) return '';
    const parts = d.split('-'); // YYYY-MM-DD
    if(parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
  }
  function formatFechaFull(d) {
    if(!d) return '';
    const parts = d.split('-');
    if(parts.length !== 3) return d;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function validateInput() {
    const arrT = parseVals(cgPorcentajesTeorico.value);
    if(arrT.length === 0) {
      cgWarning.style.display = 'none';
      togglePdfBtn(false);
      return false;
    }
    const sum = arrT.reduce((a,b) => a+b, 0);
    if(Math.abs(sum - 100) > 0.01) {
      cgWarning.textContent = `⚠️ La suma teórica actual es ${sum.toFixed(2)}%. El total debe ser 100% para generar la curva oficial.`;
      cgWarning.style.display = 'block';
      togglePdfBtn(false);
      return false;
    } else {
      cgWarning.style.display = 'none';
      togglePdfBtn(true);
      return true;
    }
  }

  cgPorcentajesTeorico.addEventListener('input', validateInput);
  cgPorcentajesReal.addEventListener('input', validateInput);

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

  // Visualizar Curva
  cgPreviewBtn.addEventListener('click', () => {
    if(!validateInput()) return;
    chartRenderArea.style.display = 'block';
    renderCurvaS('sCurveChartPreview', true);
  });

  function renderCurvaS(canvasId, animate = true) {
    const ctx = document.getElementById(canvasId);
    if(!ctx) return null;
    
    if(canvasId === 'sCurveChartPreview' && previewChart) {
      previewChart.destroy();
    }
    
    const arrT = parseVals(cgPorcentajesTeorico.value);
    const arrR = parseVals(cgPorcentajesReal.value);
    const cumT = getCumulative(arrT);
    const cumR = getCumulative(arrR);
    
    // Labels del eje X
    const fechaIniFormateada = formatFecha(cgFechaInicio.value) || 'Inicio';
    const chartLabels = [fechaIniFormateada, ...arrT.map((_, i) => `Mes ${i+1}`)];
    
    const dataT = [0, ...cumT];
    const dataR = cumR.length > 0 ? [0, ...cumR] : [];

    const datasets = [
      {
        label: 'Teorico',
        data: dataT,
        borderColor: '#000000',
        backgroundColor: '#000000',
        borderWidth: 2.5,
        fill: false,
        tension: 0, // lineas rectas como en el pdf
        pointBackgroundColor: '#fff',
        pointBorderColor: '#000',
        pointRadius: 4,
        pointBorderWidth: 1.5,
        datalabels: {
          align: 'top',
          offset: 6,
          formatter: v => v.toFixed(2),
          font: { size: 11 }
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
          formatter: v => v.toFixed(2),
          font: { size: 11 }
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
            ticks: {
              stepSize: 20,
              font: { size: 12 }
            },
            grid: { color: '#ccc' }
          },
          x: {
            grid: { color: '#ccc' },
            ticks: { font: { size: 11, weight: 'bold' } }
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            color: '#000'
          }
        }
      }
    });

    if(canvasId === 'sCurveChartPreview') previewChart = chartInstance;
    return chartInstance;
  }

  // Generar PDF
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!validateInput()) return;
    
    const originalText = cgDownloadPdfBtn.innerHTML;
    cgDownloadPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
    cgDownloadPdfBtn.disabled = true;

    try {
      // Poblar cabecera de la tabla
      document.getElementById('pdfObra').textContent = document.getElementById('cgObra').value;
      document.getElementById('pdfIdObra').textContent = document.getElementById('cgIdObra').value;
      document.getElementById('pdfExpediente').textContent = document.getElementById('cgExpediente').value;
      document.getElementById('pdfContratista').textContent = document.getElementById('cgContratista').value;
      document.getElementById('pdfInspectores').textContent = document.getElementById('cgInspectores').value;
      
      const fIni = document.getElementById('cgFechaInicio').value;
      const fMed = document.getElementById('cgFechaMedicion').value;
      const fFin = document.getElementById('cgFechaFin').value;
      const foja = document.getElementById('cgFoja').value;

      document.getElementById('pdfFechaInicio').textContent = formatFull(fIni);
      document.getElementById('pdfFechaMedicion').textContent = formatFull(fMed);
      document.getElementById('pdfFechaFin').textContent = formatFull(fFin);
      document.getElementById('pdfFojaHead').textContent = foja;
      document.getElementById('pdfFojaTitle').textContent = foja;
      document.getElementById('pdfFechaMedicionTitle').textContent = formatFecha(fMed);

      function formatFull(d) {
        if(!d) return '';
        const parts = d.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      // Poblar Tabla generada dinamicamente (el footer)
      const arrT = parseVals(cgPorcentajesTeorico.value);
      const arrR = parseVals(cgPorcentajesReal.value);
      const cumT = getCumulative(arrT);
      const cumR = getCumulative(arrR);
      
      // La imagen muestra la tabla con Porc Teorico y Porc Real con 4 decimales.
      let tableHtml = `<table style="width: auto; border-collapse: collapse; font-size: 10px; font-family: Arial; text-align: right; border: 1px solid #000;">
        <tbody>
          <tr><td style="border: 1px solid #000; text-align: left; padding: 4px; font-weight: normal; width: 140px;">Porc. Acumulado Teórico</td>`;
      for(let i=0; i<cumT.length; i++) {
        tableHtml += `<td style="border: 1px solid #000; padding: 4px; width: 55px;">${cumT[i].toFixed(4).replace('.',',')}</td>`;
      }
      tableHtml += `</tr><tr><td style="border: 1px solid #000; text-align: left; padding: 4px; font-weight: normal; width: 140px;">Porc. Acumulado Real</td>`;
      
      // Si la real es menor en longitud, rellenamos con vacios o ceros. La imagen muestra ceros cuando todavia no hay avance real. Muestra 0,0000.
      for(let i=0; i<cumT.length; i++) {
        let val = cumR[i] !== undefined ? cumR[i] : 0;
        tableHtml += `<td style="border: 1px solid #000; padding: 4px; width: 55px;">${val.toFixed(4).replace('.',',')}</td>`;
      }
      tableHtml += `</tr></tbody></table>`;

      document.getElementById('pdfTableContainer').innerHTML = tableHtml;

      // Render chart for PDF instantly
      const printChart = renderCurvaS('sCurveChartPrint', false);
      await new Promise(r => setTimeout(r, 600));

      // Capturar
      const template = document.getElementById('pdfTemplate');
      template.style.left = '0';
      template.style.top = '0';
      template.style.zIndex = '-9999';

      const canvas = await html2canvas(template, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      template.style.left = '-9999px';
      template.style.top = '-9999px';

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      printChart.destroy();

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, pdfHeight); 
      // 10mm top margin so it looks nice on paper
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
