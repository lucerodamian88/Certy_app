const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
app.use(express.json({ limit: '5mb' }));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

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

app.use('/uploads', express.static(uploadDir));

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
