// Theme toggle and shared actions

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    const applyTheme = theme => {
      document.body.classList.toggle('dark-mode', theme === 'dark');
      toggle.textContent = theme === 'light' ? '🌞' : '🌙';
    };
    const saved = localStorage.getItem('theme') || 'light';
    applyTheme(saved);
    toggle.addEventListener('click', () => {
      const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    });
  }

});

function installApp() {
  document.body.classList.add('big-text');
  window.open('https://lucerodamian88.github.io/Certy_app/download.html', '_blank');
}
