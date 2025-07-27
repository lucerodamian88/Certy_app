// Theme toggle and shared actions

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    const applyTheme = theme => {
      document.body.classList.toggle('light-mode', theme === 'light');
      toggle.textContent = theme === 'light' ? '🌞' : '🌙';
    };
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved);
    toggle.addEventListener('click', () => {
      const newTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    });
  }

});

function installApp() {
  document.body.classList.add('big-text');
  window.open('https://lucerodamian88.github.io/Certy_app/download.html', '_blank');
}
