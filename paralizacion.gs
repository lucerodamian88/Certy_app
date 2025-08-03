function doPost(e) {
  const ss = SpreadsheetApp.openById('1vwRWuYRmiAmw4FPKh7n-4t6W4mcWn_wSo8MlLJ9P0fk');
  const sheet = ss.getSheetByName('Paralizacion') || ss.getActiveSheet();
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
