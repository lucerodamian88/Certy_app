// Theme toggle and shared actions

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    const applyTheme = theme => {
      document.body.classList.toggle('dark-mode', theme === 'dark');
      toggle.textContent = theme === 'light' ? '🌞' : '🌙';
    };
    let currentTheme = 'light';
    applyTheme(currentTheme);
    toggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(currentTheme);
    });
  }

  const ua = navigator.userAgent || '';
  const isIpad2 = /iPad/.test(ua) && window.devicePixelRatio === 1;
  if (isIpad2) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'ipad2.css';
    document.head.appendChild(link);
  }
});

function installApp() {
  document.body.classList.add('big-text');
  window.open('https://lucerodamian88.github.io/Certy_app/download.html', '_blank');
}
