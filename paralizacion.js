window.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.form-container');
  if (container) {
    container.classList.add('loaded');
  }
});

function formatearFecha(valor) {
  if (!valor) return '';
  if (typeof valor === 'string') {
    const match = valor.match(/Date\((\d+),(\d+),(\d+)\)/);
    if (match) {
      const year = match[1];
      const month = String(parseInt(match[2], 10) + 1).padStart(2, '0');
      const day = String(parseInt(match[3], 10)).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    const parts = valor.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      return `${day}/${month}/${parts[2]}`;
    }
  } else if (valor instanceof Date) {
    const day = String(valor.getDate()).padStart(2, '0');
    const month = String(valor.getMonth() + 1).padStart(2, '0');
    const year = valor.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return valor;
}

async function buscarExpediente() {
  const exp = document.getElementById('expedienteInput').value.trim();
  const alertEl = document.getElementById('alert');
  const datosDiv = document.getElementById('formularioParalizacion');
  alertEl.style.display = 'none';
  datosDiv.style.display = 'none';
  if (!exp) return;

  const sheetId = '1ZSAeRUOVsRJl5SXCV08QEQ4taLpQX686C9GcmMWpG1Q';
  const query = `select A,B,C,D,G,H where A='${exp}'`;
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Hoja1&tq=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
    if (json.table.rows.length > 0) {
      const row = json.table.rows[0].c;
      document.getElementById('obraNombre').textContent = row[1] ? row[1].v : '';
      document.getElementById('fechaInicio').textContent = row[2] ? formatearFecha(row[2].f || row[2].v) : '';
      document.getElementById('contratista').textContent = row[3] ? row[3].v : '';
      const insp1 = row[4] ? row[4].v : '';
      const insp2 = row[5] ? row[5].v : '';
      const inspectores = [insp1, insp2].filter(Boolean).join(', ');
      document.getElementById('inspectoresEncontrados').textContent = inspectores;
      datosDiv.style.display = 'block';
    } else {
      alertEl.textContent = 'Expediente no encontrado. Verifique el número y los ceros adelante.';
      alertEl.style.display = 'block';
    }
  } catch (e) {
    alertEl.textContent = 'Error al buscar el expediente.';
    alertEl.style.display = 'block';
  }
}

const formulario = document.getElementById('formularioParalizacion');
if (formulario) {
  formulario.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fechaSolicitud = document.getElementById('fechaSolicitud').value;
    const expediente = document.getElementById('expedienteInput').value.trim();
    const inspectores = document.getElementById('inspectoresEncontrados').textContent;
    const tipoAlteracion = 'Paralización';
    const nombreObra = document.getElementById('obraNombre').textContent;
    const empresa = document.getElementById('contratista').textContent;
    const adjudicadaPorTipo = document.getElementById('adjudicadaPor').value;
    const numeroAdjudicacion = document.getElementById('numeroAdjudicacion').value.trim();
    const adjudicadaPor = adjudicadaPorTipo ? `${adjudicadaPorTipo} ${numeroAdjudicacion}` : '';
    const motivo = document.getElementById('motivo').value.trim();

    const data = {
      fechaSolicitud,
      expediente,
      inspectores,
      tipoAlteracion,
      nombreObra,
      empresa,
      adjudicadaPor,
      motivo
    };
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxy6wkCltPw3nKW35c9IyGmmcFn5jeAoJ2t2V4dqc-F892XUFtGjTi2tFWCM3swNvTO/exec';

    const successEl = document.getElementById('successMessage');
    const alertEl = document.getElementById('alert');
    if (successEl) successEl.style.display = 'none';
    if (alertEl) alertEl.style.display = 'none';

    try {
      const res = await fetch(scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        if (successEl) {
          successEl.textContent = 'Formulario enviado correctamente.';
          successEl.style.display = 'block';
        }
        formulario.reset();
        document.getElementById('expedienteInput').value = '';
        document.getElementById('obraNombre').textContent = '';
        document.getElementById('fechaInicio').textContent = '';
        document.getElementById('contratista').textContent = '';
        document.getElementById('inspectoresEncontrados').textContent = '';
      } else if (alertEl) {
        alertEl.textContent = 'Error al enviar el formulario.';
        alertEl.style.display = 'block';
      }
    } catch (e) {
      if (alertEl) {
        alertEl.textContent = 'Error al enviar el formulario.';
        alertEl.style.display = 'block';
      }
    }
  });
}
