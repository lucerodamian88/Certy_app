const SPREADSHEET_ID = '1vwRWuYRmiAmw4FPKh7n-4t6W4mcWn_wSo8MlLJ9P0fk';
const SHEET_NAME = 'Respuestas_SParalización';

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  const p = e.parameter;
  sheet.appendRow([
    new Date(),
    p.fechaSolicitud || '',
    p.numeroExpediente || '',
    p.inspectores || '',
    p.tipoAlteracion || '',
    p.nombreObra || '',
    p.empresaContratista || '',
    p.adjudicadaPor || '',
    p.motivo || '',
    p.motivoResumido || ''
  ]);
  return ContentService.createTextOutput(
    JSON.stringify({ success: true })
  )
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}
