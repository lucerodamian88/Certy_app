package com.example.certyapp;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
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

        Button shareButton = findViewById(R.id.shareButton);
        shareButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    File pdfFile = generatePdf();
                    sharePdf(pdfFile);
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

    private void sharePdf(File pdfFile) {
        Context context = this;
        Uri uri = FileProvider.getUriForFile(context, BuildConfig.APPLICATION_ID + ".provider", pdfFile);

        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("application/pdf");
        shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        // Check if WhatsApp is installed
        PackageManager pm = getPackageManager();
        boolean hasWhatsApp;
        try {
            pm.getPackageInfo("com.whatsapp", PackageManager.GET_ACTIVITIES);
            hasWhatsApp = true;
        } catch (PackageManager.NameNotFoundException e) {
            hasWhatsApp = false;
        }

        Intent chooser;
        if (hasWhatsApp) {
            Intent whatsappIntent = new Intent(shareIntent);
            whatsappIntent.setPackage("com.whatsapp");
            chooser = Intent.createChooser(whatsappIntent, "Compartir PDF");
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[] { shareIntent });
        } else {
            chooser = Intent.createChooser(shareIntent, "Compartir PDF");
        }

        startActivity(chooser);
    }
}

