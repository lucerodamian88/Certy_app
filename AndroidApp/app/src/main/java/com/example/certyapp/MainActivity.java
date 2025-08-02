package com.example.certyapp;

import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import android.view.View;
import android.widget.Button;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

public class MainActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button printButton = findViewById(R.id.printButton);
        printButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    File pdfFile = generatePdf();
                    openPdf(pdfFile);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    private File generatePdf() throws IOException {
        String fileName = "Reporte" + System.currentTimeMillis() + ".pdf";
        File pdfDir = new File(getFilesDir(), "pdfs");
        if (!pdfDir.exists()) {
            pdfDir.mkdirs();
        }
        File pdfFile = new File(pdfDir, fileName);

        PdfDocument document = new PdfDocument();
        PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(300, 300, 1).create();
        PdfDocument.Page page = document.startPage(pageInfo);
        Canvas canvas = page.getCanvas();
        Paint paint = new Paint();
        paint.setTextSize(16);
        canvas.drawText("Contenido del reporte", 50, 50, paint);
        document.finishPage(page);

        FileOutputStream fos = new FileOutputStream(pdfFile);
        document.writeTo(fos);
        document.close();
        fos.close();

        return pdfFile;
    }

    private void openPdf(File pdfFile) {
        Context context = this;
        Uri uri = FileProvider.getUriForFile(context, BuildConfig.APPLICATION_ID + ".provider", pdfFile);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/pdf");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivity(intent);
    }
}

