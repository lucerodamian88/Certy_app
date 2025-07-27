let bibliographyText = '';

async function loadBibliografia() {
  try {
    const pdfUrl = encodeURI('Bibliografia/Ley Nº 687-1972 Ley de Obra Pública y Decreto Nº 108-1972.pdf');
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      bibliographyText += text.items.map(t => t.str).join(' ') + ' ';
    }
  } catch (e) { console.error(e); }
  try {
    const docUrl = encodeURI('Bibliografia/Manual Práctico para Gestionar Alteraciones Contractuales en Obras Públicas.docx');
    const resp = await fetch(docUrl);
    const arrayBuffer = await resp.arrayBuffer();
    const result = await mammoth.extractRawText({arrayBuffer});
    bibliographyText += result.value + ' ';
  } catch (e) { console.error(e); }
  bibliographyText = bibliographyText.toLowerCase();
}

function searchBibliography(query) {
  query = query.toLowerCase();
  if (bibliographyText.includes(query)) {
    const idx = bibliographyText.indexOf(query);
    return bibliographyText.slice(Math.max(0, idx - 60), Math.min(bibliographyText.length, idx + query.length + 60)) + '...';
  }
  return 'Esta información no está en la bibliografía. Por favor, consulte al Director General de Certificaciones.';
}

document.addEventListener('DOMContentLoaded', () => {
  loadBibliografia();
  const toggle = document.getElementById('chatbotToggle');
  const win = document.getElementById('chatbotWindow');
  const input = document.getElementById('chatInput');
  const send = document.getElementById('chatSend');
  const content = document.getElementById('chatContent');

  toggle.addEventListener('click', () => {
    win.classList.toggle('show');
  });

  send.addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    content.innerHTML += `<div><strong>Tú:</strong> ${q}</div>`;
    const ans = searchBibliography(q);
    content.innerHTML += `<div><strong>Certy:</strong> ${ans}</div>`;
    input.value = '';
    content.scrollTop = content.scrollHeight;
  });
});
