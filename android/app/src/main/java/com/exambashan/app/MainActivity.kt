package com.exambashan.app

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.util.Base64
import android.webkit.DownloadListener
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private val appUrl = "https://exam-bashan.pages.dev/"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)

        // إعدادات الـ WebView
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = true
            builtInZoomControls = false
            displayZoomControls = false
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                swipeRefreshLayout.isRefreshing = true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                swipeRefreshLayout.isRefreshing = false
            }
        }

        // دعم التحميل
        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
            try {
                if (url.startsWith("data:")) {
                    // معالجة Data URL (للصور المُصدّرة)
                    saveDataUrl(url)
                } else {
                    // تحميل عادي
                    val request = DownloadManager.Request(Uri.parse(url))
                    request.setMimeType(mimeType)
                    request.addRequestHeader("User-Agent", userAgent)
                    request.setDescription("جاري التحميل...")
                    request.setTitle("نتيجة الامتحان")
                    request.allowScanningByMediaScanner()
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    request.setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS,
                        "نتيجة_${System.currentTimeMillis()}.png"
                    )
                    
                    val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                    dm.enqueue(request)
                    Toast.makeText(this, "جاري تحميل الصورة...", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this, "فشل التحميل: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }

        // إعداد التحديث عند السحب
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
        }

        // تحميل الرابط
        if (savedInstanceState == null) {
            webView.loadUrl(appUrl)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    // حفظ Data URL كصورة
    private fun saveDataUrl(dataUrl: String) {
        try {
            val base64Data = dataUrl.substringAfter(",")
            val imageBytes = Base64.decode(base64Data, Base64.DEFAULT)
            
            val fileName = "نتيجة_${System.currentTimeMillis()}.png"
            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val file = File(downloadsDir, fileName)
            
            FileOutputStream(file).use { fos ->
                fos.write(imageBytes)
            }
            
            // إعلام المعرض بالصورة الجديدة
            val intent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
            intent.data = Uri.fromFile(file)
            sendBroadcast(intent)
            
            Toast.makeText(this, "تم حفظ الصورة في Downloads ✓", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            Toast.makeText(this, "فشل حفظ الصورة: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    // التعامل مع زر الرجوع
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }
}
