function monthName(date) {
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return months[date.getMonth()];
}

function generateDoc(data) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
          paragraph: { spacing: { after: 200 } }
        }
      }
    }
  });

  const indent = { firstLine: 720 };

  const today = new Date();
  const fechaInicio = `En la ciudad de Neuquén, a los ${today.getDate()} días del mes de ${monthName(today)} de 2025, entre la MUNICIPALIDAD DE NEUQUÉN, representada en este Acto por la Sra. Subsecretaria de Gestión de Contrataciones de Obras Públicas, Cra. MIRTA VIVIANA DEN HARTOG, D.N.I. Nº 26.476.872, y por la otra parte, la empresa ${data.empresa}, C.U.I.T. Nº ${data.cuit} representada por su ${data.cargoRep} ${data.nombreRep}, D.N.I. Nº ${data.dniRep}, quienes en fecha ${data.fechaContrato} han celebrado un CONTRATO DE OBRA PÚBLICA dicen:`;

  const p1 = `Que mediante Disposición Nº ${data.dispoAdjudicacion} fue adjudicada la Contratación Directa OE Nº ${data.contratacion} para la ejecución de la obra "${data.obra}" a favor de la empresa ${data.empresa}, por un importe de PESOS ${data.montoLetras} ($${data.montoNumeros}) y un plazo de ejecución de obra de (${data.plazoOriginal}) días corridos;`;

  const p2 = `Que mediante Disposición Nº ${data.dispoAmpliacion} /2025 tramitada por Expediente OE Nº ${data.expediente} se aprobó una ampliación de plazo de obra de (${data.plazoOriginal}) días corridos, quedando establecida como fecha de finalización de la obra el día ${data.fechaFinalizacion}, resultando un total de ${data.plazoTotal} días corridos a partir del Acta de Replanteo oportunamente confeccionada;`;

  const cierre = `SEGUNDA) El Plazo de Ejecución del presente Contrato es de ${data.plazoTotal} días corridos contados a partir de la fecha del Acta de Replanteo.`;

  const fin = `Quedando las demás condiciones sin modificaciones y en prueba de conformidad, las partes suscriben la presente ADENDA en DOS (2) ejemplares de un mismo tenor y a un solo efecto en la Ciudad de Neuquén a los ${today.getDate()} días del mes de ${monthName(today)} del año 2025.-`;

  doc.addSection({
    children: [
      new Paragraph({ children: [ new TextRun({ text: 'ADENDA AL CONTRATO DE OBRA PÚBLICA', bold: true }) ], alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `"${data.obra}"`, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: fechaInicio, alignment: AlignmentType.RIGHT }),
      new Paragraph({ text: 'CONSIDERANDO:', bold: true }),
      new Paragraph({ text: p1, alignment: AlignmentType.JUSTIFIED, indent }),
      new Paragraph({ text: p2, alignment: AlignmentType.JUSTIFIED, indent }),
      new Paragraph({ text: 'Por lo expuesto, las partes convienen la siguiente modificación:' }),
      new Paragraph({ text: cierre, alignment: AlignmentType.JUSTIFIED, indent }),
      new Paragraph({ text: fin, alignment: AlignmentType.RIGHT })
    ]
  });

  Packer.toBlob(doc).then(blob => {
    const fileName = `adenda_generada+${data.expediente}+${data.obra}.docx`.replace(/\s+/g,'_');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

document.getElementById('generateBtn').addEventListener('click', () => {
  const form = document.getElementById('adendaForm');
  if (!form.reportValidity()) return;

  const data = {
    obra: document.getElementById('obra').value,
    empresa: document.getElementById('empresa').value,
    cuit: document.getElementById('cuit').value,
    cargoRep: document.getElementById('cargoRep').value,
    nombreRep: document.getElementById('nombreRep').value,
    dniRep: document.getElementById('dniRep').value,
    fechaContrato: document.getElementById('fechaContrato').value,
    dispoAdjudicacion: document.getElementById('dispoAdjudicacion').value,
    contratacion: document.getElementById('contratacion').value,
    montoLetras: document.getElementById('montoLetras').value,
    montoNumeros: document.getElementById('montoNumeros').value,
    plazoOriginal: document.getElementById('plazoOriginal').value,
    dispoAmpliacion: document.getElementById('dispoAmpliacion').value,
    expediente: document.getElementById('expediente').value,
    plazoTotal: document.getElementById('plazoTotal').value,
    fechaFinalizacion: document.getElementById('fechaFinalizacion').value
  };

  generateDoc(data);
});
