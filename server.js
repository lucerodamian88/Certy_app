const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
app.use(express.json({ limit: '5mb' }));

const SHEET_ID = '1oGUQY-kEEj5q6LLHdvVOyNZSlTonp0vUpg0hLrrZviM';
const SHEET_TAB = 'Respuestas';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

async function registrarFilaRedeterminacion(datos) {
  const token = await obtenerTokenSheets();
  const fila = construirFilaRedeterminacion(datos);
  const rango = encodeURIComponent(`${SHEET_TAB}!A:AB`);
  const url = `${SHEETS_BASE_URL}/${SHEET_ID}/values/${rango}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ values: [fila] })
  });
  if (!respuesta.ok) {
    const texto = await respuesta.text();
    throw new Error(`Error al actualizar la planilla: ${respuesta.status} ${texto}`);
  }
}

let cachedToken = null;
let tokenExpiration = 0;

async function obtenerTokenSheets() {
  const ahora = Math.floor(Date.now() / 1000);
  if (cachedToken && ahora < tokenExpiration - 60) {
    return cachedToken;
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !privateKey) {
    throw new Error('Credenciales de Google Sheets no configuradas');
  }
  const jwt = crearJwtDeServicio(email, privateKey, ahora);
  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  params.append('assertion', jwt);

  const respuesta = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!respuesta.ok) {
    const texto = await respuesta.text();
    throw new Error(`Error obteniendo token de Google: ${respuesta.status} ${texto}`);
  }
  const cuerpo = await respuesta.json();
  cachedToken = cuerpo.access_token;
  tokenExpiration = ahora + (cuerpo.expires_in || 3600);
  return cachedToken;
}

function crearJwtDeServicio(email, privateKey, issuedAt) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: issuedAt,
    exp: issuedAt + 3600
  };
  const segmentos = [
    base64UrlEncode(Buffer.from(JSON.stringify(header))),
    base64UrlEncode(Buffer.from(JSON.stringify(payload)))
  ];
  const signingInput = segmentos.join('.');
  const signature = firmarJwtSegmentos(signingInput, privateKey);
  return `${signingInput}.${signature}`;
}

function firmarJwtSegmentos(input, privateKey) {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(input);
  signer.end();
  const key = privateKey.replace(/\\n/g, '\n');
  const signature = signer.sign(key);
  return base64UrlEncode(signature);
}

function base64UrlEncode(buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function construirFilaRedeterminacion(datos) {
  const timestamp = obtenerMarcaTemporal();
  const fila = [
    timestamp,
    datos.expediente,
    datos.tipoRedeterminacion,
    datos.empresa,
    datos.representante,
    datos.domicilio,
    datos.obraNombre,
    datos.aprobadaPor,
    datos.numeroAdjudicacion,
    datos.periodoDesde,
    datos.periodoHasta,
    datos.numeroRedeterminacion,
    datos.montoRedeterminacion,
    datos.montoRedeterminacionLetras,
    datos.montoContrato,
    datos.montoConAdicionales,
    datos.montoObraAcumulada,
    datos.saldoAnticipo,
    datos.ultimoFri,
    datos.ultimoFriAprobado,
    datos.incrementoFri,
    datos.baseContratacion,
    datos.montoGarantizarSaldoObra,
    datos.montoGarantizarRedeterminacion,
    datos.montoTotalGarantizar,
    datos.polizaQueCorresponde,
    datos.montoPoliza,
    datos.montoPolizaLetras
  ];
  return fila.map(normalizarValorCelda);
}

function normalizarValorCelda(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'string') return valor.trim();
  return String(valor);
}

function obtenerMarcaTemporal() {
  const formateador = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Argentina/Buenos_Aires'
  });
  return formateador.format(new Date());
}

function validarDatosRedeterminacion(datos) {
  const requeridos = ['expediente', 'empresa', 'obraNombre'];
  const faltantes = requeridos.filter(campo => !tieneValor(datos[campo]));
  return faltantes;
}

function tieneValor(valor) {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string') return valor.trim() !== '';
  return true;
}

app.post('/pdf', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    console.error('Error processing PDF upload:', err);
    res.status(500).json({ error: 'Error al procesar el PDF' });
  }
});

app.post('/generate-pdf', (req, res) => {
  try {
    const { html } = req.body || {};
    if (!html) {
      return res.status(400).json({ error: 'No HTML provided' });
    }
    const text = html.replace(/<[^>]+>/g, '');
    const fileName = `${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    const escapePdf = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r?\n/g, '\\n');
    const content = escapePdf(text);

    const header = '%PDF-1.3\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n';
    const streamStr = `BT /F1 12 Tf 50 800 Td (${content}) Tj ET`;
    const obj4 = `4 0 obj\n<< /Length ${streamStr.length} >>\nstream\n${streamStr}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    const objects = [obj1, obj2, obj3, obj4, obj5];

    let pdf = header;
    const offsets = [0];
    objects.forEach(obj => {
      offsets.push(pdf.length);
      pdf += obj;
    });
    const xrefPos = pdf.length;
    pdf += 'xref\n0 6\n';
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) {
      pdf += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
    }
    pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';

    fs.writeFileSync(filePath, pdf);
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    res.json({ url: fileUrl });
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Error generando el PDF' });
  }
});

app.post('/api/redeterminaciones', async (req, res) => {
  try {
    const datos = req.body || {};
    const faltantes = validarDatosRedeterminacion(datos);
    if (faltantes.length > 0) {
      return res.status(400).json({ error: `Faltan datos obligatorios: ${faltantes.join(', ')}` });
    }
    await registrarFilaRedeterminacion(datos);
    res.json({ success: true });
  } catch (err) {
    console.error('Error registrando solicitud de redeterminación:', err);
    res.status(500).json({ error: 'Error al registrar la solicitud' });
  }
});

app.use('/uploads', express.static(uploadDir));

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
