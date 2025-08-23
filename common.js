// Shared actions

document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('downloadAppBtn');
  if (downloadBtn) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        downloadBtn.classList.add('hide');
        setTimeout(() => {
          downloadBtn.style.display = 'none';
        }, 500);
      }, 3000);
    });
  }
});

function installApp() {
  document.body.classList.add('big-text');
  window.open('https://lucerodamian88.github.io/Certy_app/download.html', '_blank');
}

function isAndroidWebView() {
  const ua = navigator.userAgent || '';
  return /Android/.test(ua) && /; wv\)/.test(ua);
}

window.isAndroidWebView = isAndroidWebView;
