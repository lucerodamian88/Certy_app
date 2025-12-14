// Shared actions

document.addEventListener('DOMContentLoaded', () => {
  const downloadBtn = document.getElementById('downloadAppBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', installApp);
    window.addEventListener('load', () => {
      setTimeout(() => {
        downloadBtn.classList.add('hide');
        setTimeout(() => {
          downloadBtn.style.display = 'none';
        }, 500);
      }, 3000);
    });
  }

  fetchWeather();
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

function fetchWeather() {
  const weatherEl = document.getElementById('weather');
  if (!weatherEl) return;
  fetch('https://api.open-meteo.com/v1/forecast?latitude=-38.9516&longitude=-68.0591&current_weather=true')
    .then(res => res.json())
    .then(data => {
      const w = data.current_weather;
      if (!w) return;
      const icon = weatherIcon(w.weathercode);
      weatherEl.textContent = `${Math.round(w.temperature)}°C ${icon}`;
    })
    .catch(() => { });
}

function weatherIcon(code) {
  if ([0].includes(code)) return '☀️';
  if ([1, 2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return 'ℹ️';
}

/* Snowflake Logic */
document.addEventListener('DOMContentLoaded', () => {
  createSnowflakes();
});

function createSnowflakes() {
  const certyImages = document.querySelectorAll('img[src*="Certy"], img[src*="logo.png"]');

  certyImages.forEach(img => {
    // Ensure parent is positioned to confine snowflakes if we want them LOCAL to the image,
    // BUT user said "sobre los logos", so wrapping them is safer to contain the effect.
    // However, changing DOM structure might break layout. 
    // Let's try appending to parent and ensuring parent has position: relative.

    const parent = img.parentElement;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.classList.add('snowflake-container'); // Add overflow hidden helper

    const numberOfSnowflakes = 10; // Number of flakes per image

    for (let i = 0; i < numberOfSnowflakes; i++) {
      const snowflake = document.createElement('div');
      snowflake.classList.add('snowflake');
      snowflake.textContent = '❄';

      // Randomize position and animation
      const left = Math.random() * 100; // % position
      const delay = Math.random() * 5; // s delay
      const duration = 3 + Math.random() * 5; // s duration
      const size = 0.5 + Math.random() * 1; // scale font size

      snowflake.style.left = `${left}%`;
      snowflake.style.animationDelay = `${delay}s, ${delay}s`;
      snowflake.style.animationDuration = `${duration}s, ${duration}s`;
      snowflake.style.fontSize = `${size}em`;

      parent.appendChild(snowflake);
    }
  });
}
