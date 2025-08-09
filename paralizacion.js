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
    const numero = document.getElementById('expedienteNumero').value.trim();
    const anio = document.getElementById('expedienteAnio').value.trim();
    const exp = `${numero}-M-202${anio}`;
    const alertEl = document.getElementById('alert');
    const datosDiv = document.getElementById('formularioParalizacion');
    alertEl.style.display = 'none';
    datosDiv.style.display = 'none';
    if (!numero || !anio) return;

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

