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
  const widget = document.querySelector('.weather-widget');
  if (!widget) return;
  
  fetch('https://api.open-meteo.com/v1/forecast?latitude=-38.9516&longitude=-68.0591&current_weather=true&daily=weathercode,temperature_2m_max&timezone=America%2FArgentina%2FBuenos_Aires')
    .then(res => res.json())
    .then(data => {
      const daysEls = widget.querySelectorAll('.weather-day');
      if (daysEls.length > 0) {
        const daily = data.daily;
        if (!daily || !daily.temperature_2m_max) return;
        
        const labels = ['Hoy', 'Mañana', 'Pasado'];
        
        daysEls.forEach((el, index) => {
           if (index < 3) {
              const maxTemp = Math.round(daily.temperature_2m_max[index]);
              const code = daily.weathercode[index];
              el.innerHTML = `<span>${labels[index]}: ${maxTemp}°C</span>` + weatherIconHTML(code);
           }
        });
      } else {
        const current = data.current_weather;
        if (!current) return;
        const temp = Math.round(current.temperature);
        widget.innerHTML = weatherIconHTML(current.weathercode) + ` <span>Neuquén: ${temp}°C</span>`;
      }
    })
    .catch(err => console.error("Error al obtener clima:", err));
}

function weatherIconHTML(code) {
  if ([0].includes(code)) return '<i class="fa-solid fa-sun" style="color: #FFD700;"></i>';
  if ([1, 2].includes(code)) return '<i class="fa-solid fa-cloud-sun" style="color: #F6C85F;"></i>';
  if ([3].includes(code)) return '<i class="fa-solid fa-cloud" style="color: #A0AEC0;"></i>';
  if ([45, 48].includes(code)) return '<i class="fa-solid fa-smog" style="color: #A0AEC0;"></i>';
  if ([51, 53, 55, 56, 57].includes(code)) return '<i class="fa-solid fa-cloud-rain" style="color: #63B3ED;"></i>';
  if ([61, 63, 65, 80, 81, 82].includes(code)) return '<i class="fa-solid fa-cloud-showers-heavy" style="color: #4299E1;"></i>';
  if ([71, 73, 75, 85, 86].includes(code)) return '<i class="fa-solid fa-snowflake" style="color: #90CDF4;"></i>';
  if ([95, 96, 99].includes(code)) return '<i class="fa-solid fa-cloud-bolt" style="color: #ECC94B;"></i>';
  return '<i class="fa-solid fa-cloud-sun-rain" style="color: #A0AEC0;"></i>';
}

// Custom Alert Implementation
window.alert = function (message) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'certy-modal-overlay';

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'certy-modal';

  // Create content
  modal.innerHTML = `
        <img src="Certy_advertencia.png" alt="Certy Advertencia">
        <p>${message}</p>
        <button class="certy-modal-btn">Entendido</button>
    `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close function
  const closeScale = () => {
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(0.8)';
    setTimeout(() => overlay.remove(), 300);
  };

  modal.querySelector('.certy-modal-btn').onclick = closeScale;
  overlay.onclick = (e) => { if (e.target === overlay) closeScale(); };
};
