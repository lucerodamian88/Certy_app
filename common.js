// Theme toggle and robot interaction

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

  const robot = document.getElementById('robot');
  const audio = document.getElementById('robotSound');
  if (robot) {
    const wave = () => {
      robot.classList.add('wave');
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      setTimeout(() => robot.classList.remove('wave'), 1000);
    };

    const start = () => {
      robot.classList.add('enter');
      setTimeout(wave, 1500);
      setTimeout(() => robot.classList.add('exit'), 3000);
      setTimeout(() => robot.classList.remove('enter', 'exit'), 5000);
    };

    const randomPeek = () => {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      robot.classList.add(`peek-${side}`);
      wave();
      setTimeout(() => robot.classList.remove(`peek-${side}`), 3000);
    };

    let idleTimer;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(randomPeek, 10000);
    };
    document.addEventListener('mousemove', resetIdle);
    document.addEventListener('keydown', resetIdle);
    resetIdle();

    start();
  }
});
