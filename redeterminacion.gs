const SPREADSHEET_ID_REDET = '1oGUQY-kEEj5q6LLHdvVOyNZSlTonp0vUpg0hLrrZviM';
const SHEET_NAME_REDET = 'Respuestas';
const CAMPOS_REDET = [
  'expediente',
  'tipoRedeterminacion',
  'empresa',
  'representante',
  'domicilio',
  'obraNombre',
  'aprobadaPor',
  'numeroAdjudicacion',
  'periodoDesde',
  'periodoHasta',
  'numeroRedeterminacion',
  'saltosFri',
  'montoRedeterminacion',
  'montoRedeterminacionLetras',
  'montoContrato',
  'montoConAdicionales',
  'montoObraAcumulada',
  'saldoAnticipo',
  'ultimoFri',
  'ultimoFriAprobado',
  'incrementoFri',
  'baseContratacion',
  'montoGarantizarSaldoObra',
  'montoCertificadoRedeterminacion',
  'montoGarantizarRedeterminacion',
  'montoTotalGarantizar',
  'polizaQueCorresponde',
  'montoPoliza',
  'montoPolizaLetras'
];

function doPost(e) {
  try {
    const params = (e && e.parameter) || {};
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID_REDET);
    const sheet = ss.getSheetByName(SHEET_NAME_REDET) || ss.getSheets()[0];
    if (!sheet) {
      throw new Error(`No se encontró la hoja "${SHEET_NAME_REDET}" en la planilla.`);
    }
    const fila = construirFilaRedeterminacion(params);
    sheet.appendRow(fila);
    return crearRespuestaRedeterminacion({ success: true });
  } catch (error) {
    const mensaje = error && error.message ? error.message : 'Error al registrar la solicitud';
    return crearRespuestaRedeterminacion({ success: false, error: mensaje });
  }
}

function construirFilaRedeterminacion(params) {
  const fila = [new Date()];
  CAMPOS_REDET.forEach(campo => {
    const valor = campo in params ? params[campo] : '';
    const texto = Array.isArray(valor) ? valor.join(', ') : valor;
    fila.push(typeof texto === 'string' ? texto.trim() : String(texto || ''));
  });
  return fila;
}

function crearRespuestaRedeterminacion(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}
