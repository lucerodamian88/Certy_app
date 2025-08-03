const SPREADSHEET_ID = '1vwRWuYRmiAmw4FPKh7n-4t6W4mcWn_wSo8MlLJ9P0fk';
const SHEET_NAME = 'Respuestas_SParalización';

function doPost(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp,
    data.fechaSolicitud,
    data.expediente,
    data.inspectores,
    data.tipoAlteracion,
    data.obra,
    data.contratista,
    data.adjudicadaPor,
    data.motivo
  ]);
  return ContentService.createTextOutput(
    JSON.stringify({ result: 'success' })
  ).setMimeType(ContentService.MimeType.JSON);
}
