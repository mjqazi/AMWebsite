// Advanced Mechanix — site JS

// Service worker registration — deferred until after load + idle so it
// never blocks the critical path on first visit. Repeat visits and
// page-to-page navigations are then served from cache.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    if ('requestIdleCallback' in window) {
      requestIdleCallback(register, { timeout: 4000 });
    } else {
      setTimeout(register, 2000);
    }
  });
}

// Lightweight analytics shim. Replace with GA4 / GTM when wiring production.
window.amTrack = function(event, props) {
  // Google Analytics 4 (gtag) — uncomment after adding GA4 snippet
  // if (typeof gtag === 'function') gtag('event', event, props || {});
  // Plausible (alt)
  // if (typeof plausible === 'function') plausible(event, { props });
  if (window.console && console.debug) console.debug('[amTrack]', event, props || {});
};

document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle with aria
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close menu when a link is clicked
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Platform tabs with ARIA + keyboard
  const tabs = Array.from(document.querySelectorAll('.platform-tab'));
  const panels = document.querySelectorAll('.platform-panel');
  function activateTab(tab) {
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(tab.dataset.target);
    if (panel) panel.classList.add('active');
  }
  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = tabs[(idx + 1) % tabs.length];
        next.focus(); activateTab(next);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length];
        prev.focus(); activateTab(prev);
      }
    });
  });

  // Contact form — POSTs to /contact-handler.php (PHP mailer, same-origin)
  const form = document.getElementById('consultation-form');
  if (form) {
    const success = document.getElementById('form-success');
    const errorBox = document.getElementById('form-error');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';

    const showError = (msg) => {
      if (!errorBox) { alert(msg); return; }
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    const hideError = () => { if (errorBox) errorBox.style.display = 'none'; };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(f => {
        if (!f.value.trim()) { f.style.borderColor = '#E11D48'; valid = false; }
        else { f.style.borderColor = ''; }
      });
      if (!valid) { showError('Please complete the required fields.'); return; }

      const action = form.getAttribute('action') || '/contact-handler.php';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      try {
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' },
          credentials: 'same-origin'
        });
        let data = {};
        try { data = await res.json(); } catch (_) {}
        if (!res.ok || !data.ok) {
          showError(data.error || 'Could not send your message. Please email company@advancedmechanix.com.');
          return;
        }
        if (success) { success.classList.add('show'); success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        window.amTrack('form_submit', { form: form.id || 'consultation', page: location.pathname });
        form.reset();
        setTimeout(() => success && success.classList.remove('show'), 12000);
      } catch (err) {
        showError('Network error. Please try again or email company@advancedmechanix.com.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      }
    });
  }

  // CTA click tracking
  document.querySelectorAll('a.btn, [data-track-event]').forEach(el => {
    el.addEventListener('click', () => {
      const ev = el.dataset.trackEvent || 'cta_click';
      window.amTrack(ev, {
        label: (el.textContent || '').trim().slice(0, 48),
        href: el.getAttribute('href') || '',
        page: location.pathname
      });
    });
  });

  // Current year
  document.querySelectorAll('.current-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // Scroll-draw rules — each .section draws its top hairline on enter
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.section').forEach(s => io.observe(s));
  } else {
    document.querySelectorAll('.section').forEach(s => s.classList.add('in-view'));
  }
});
