// Shared actions
const PAGE_TRANSITION_DURATION = 500;
const TRANSITION_CLASS_ENTER = 'page-transition-enter';
const TRANSITION_CLASS_EXIT = 'page-transition-exit';
const prefersReducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;
let transitionInProgress = false;
let pageTransitionWait = PAGE_TRANSITION_DURATION;

document.addEventListener('DOMContentLoaded', () => {
  setupPageTransitions();

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

  fetchWeather();
});

window.addEventListener('pageshow', (event) => {
  transitionInProgress = false;
  if (event.persisted) {
    document.body.classList.remove(TRANSITION_CLASS_EXIT);
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
    .catch(() => {});
}

function weatherIcon(code) {
  if ([0].includes(code)) return '☀️';
  if ([1,2,3].includes(code)) return '⛅';
  if ([45,48].includes(code)) return '🌫️';
  if ([51,53,55,56,57].includes(code)) return '🌦️';
  if ([61,63,65,80,81,82].includes(code)) return '🌧️';
  if ([71,73,75,85,86].includes(code)) return '❄️';
  if ([95,96,99].includes(code)) return '⛈️';
  return 'ℹ️';
}

function setupPageTransitions() {
  const body = document.body;
  if (!body) return;

  body.classList.remove(TRANSITION_CLASS_EXIT);
  body.classList.add('page-transition-ready');

  const selectors = [
    'header', 'main', 'footer', 'section', 'article', 'nav', '.container', '.form-wrapper',
    '.card-grid', '.card-button', '.card-content', '.hero-info', '.hero-img', '.hero-claim',
    '.hero-subclaim', '.site-footer', '.site-header', '.intro', '.asistente-header', 'form',
    'fieldset', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'a', 'button',
    'img[src$=".png"]'
  ].join(',');

  const items = Array.from(document.querySelectorAll(selectors))
    .filter((el) => el.offsetParent !== null || el.closest('header, main, footer, section, article, nav'));

  items.forEach((el, index) => {
    el.classList.add('page-transition-item');
    el.style.setProperty('--transition-order', index);
  });

  const maxOrder = Math.max(items.length - 1, 0);
  const baseDelayStep = maxOrder > 0 ? Math.min(0.01, 0.2 / maxOrder) : 0;
  const delayStep = prefersReducedMotion ? 0 : baseDelayStep;
  pageTransitionWait = prefersReducedMotion ? 0 : PAGE_TRANSITION_DURATION + Math.round(delayStep * maxOrder * 1000);
  body.style.setProperty('--page-transition-delay-step', `${delayStep}s`);

  requestAnimationFrame(() => {
    body.classList.add(TRANSITION_CLASS_ENTER);
    setTimeout(() => {
      body.classList.remove(TRANSITION_CLASS_ENTER);
    }, pageTransitionWait);
  });

  document.addEventListener('click', handleTransitionClick, true);
}

function handleTransitionClick(event) {
  if (transitionInProgress) return;

  const link = event.target.closest('a[href]');
  if (link && shouldHandleLink(link)) {
    event.preventDefault();
    startPageExit(link.href);
    return;
  }

  const button = event.target.closest('[data-transition-href]');
  if (button) {
    const url = button.getAttribute('data-transition-href');
    if (!url) return;
    event.preventDefault();
    startPageExit(url);
  }
}

function shouldHandleLink(link) {
  if (link.hasAttribute('download')) return false;
  const target = link.getAttribute('target');
  if (target && target !== '_self') return false;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#')) return false;

  try {
    const url = new URL(link.href, window.location.href);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
    return true;
  } catch (error) {
    return false;
  }
}

function startPageExit(url) {
  if (transitionInProgress) return;
  transitionInProgress = true;
  document.body.classList.remove(TRANSITION_CLASS_ENTER);
  document.body.classList.add(TRANSITION_CLASS_EXIT);

  setTimeout(() => {
    window.location.href = url;
  }, pageTransitionWait);
}
