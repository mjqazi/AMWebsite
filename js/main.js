// Advanced Mechanix — site JS

// Lead-form endpoint. All forms (#consultation-form on index, contact,
// BEP template and vendor checklist pages) POST JSON here via fetch().
// FormSubmit (https://formsubmit.co) relays the submission by email; the
// first submission triggers a one-time activation email to the address.
// To switch providers, change this one constant — e.g. a Formspree form
// ('https://formspree.io/f/XXXX') or a HubSpot/Cloudflare Worker endpoint
// that accepts JSON and returns a 2xx response.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/company@advancedmechanix.com';
const CONTACT_EMAIL = 'company@advancedmechanix.com';
const CONTACT_PHONE_E164 = '+14084120717';
const CONTACT_PHONE_DISPLAY = '+1 408 412 0717';

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
    // Close menu on Escape and return focus to the toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Sticky header lifts with a shadow once the sheet scrolls (CSS: .is-scrolled)
  const header = document.querySelector('.site-header');
  if (header) {
    let scrolled = false;
    let ticking = false;
    const update = () => {
      const s = window.scrollY > 4;
      if (s !== scrolled) {
        scrolled = s;
        header.classList.toggle('is-scrolled', s);
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
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

  // Lead forms (#consultation-form) — submitted with fetch() as JSON to
  // FORM_ENDPOINT (top of file). Each form can set data-form-subject and
  // data-form-name; a hidden _honey input traps bots.
  const form = document.getElementById('consultation-form');
  if (form) {
    const success = document.getElementById('form-success');
    let errorBox = document.getElementById('form-error');
    if (!errorBox) {
      errorBox = document.createElement('div');
      errorBox.id = 'form-error';
      errorBox.className = 'form-error';
      errorBox.setAttribute('role', 'alert');
      errorBox.style.marginTop = '16px';
      form.appendChild(errorBox);
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';

    // Pre-select the service dropdown from ?service=… (e.g. contact.html?service=timesheet)
    const serviceSelect = form.querySelector('select[name="service"]');
    const wanted = new URLSearchParams(location.search).get('service');
    if (serviceSelect && wanted) {
      const needle = wanted.toLowerCase().replace(/[-_+]/g, ' ').trim().replace(/s$/, '');
      const match = needle && Array.from(serviceSelect.options).find(o =>
        o.value && (o.value.toLowerCase().includes(needle) || o.text.toLowerCase().includes(needle)));
      if (match) serviceSelect.value = match.value;
    }

    const showError = (fallbackIntro) => {
      errorBox.innerHTML = '';
      errorBox.append(document.createTextNode(fallbackIntro + ' Please email '));
      const mail = document.createElement('a');
      mail.href = 'mailto:' + CONTACT_EMAIL;
      mail.textContent = CONTACT_EMAIL;
      errorBox.append(mail, document.createTextNode(' or call '));
      const tel = document.createElement('a');
      tel.href = 'tel:' + CONTACT_PHONE_E164;
      tel.textContent = CONTACT_PHONE_DISPLAY;
      errorBox.append(tel, document.createTextNode('.'));
      errorBox.style.display = 'block';
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    const showValidation = (msg) => {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    };
    const hideError = () => { errorBox.style.display = 'none'; };
    const showSuccess = () => {
      if (!success) return;
      success.classList.add('show');
      success.style.display = 'block';
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { success.classList.remove('show'); success.style.display = ''; }, 12000);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(f => {
        if (!f.value.trim()) { f.style.borderColor = '#E11D48'; valid = false; }
        else { f.style.borderColor = ''; }
      });
      if (!valid) { showValidation('Please complete the required fields.'); return; }

      const fd = new FormData(form);
      // Honeypot filled in → silently "succeed" without sending anything.
      if ((fd.get('_honey') || '').toString().trim() || (fd.get('website') || '').toString().trim()) {
        form.reset(); showSuccess(); return;
      }
      const payload = {};
      fd.forEach((v, k) => { if (k !== 'website') payload[k] = v; });
      payload._subject = form.dataset.formSubject || 'New consultation request — advancedmechanix.com';
      payload._template = 'table';
      payload._captcha = 'false';
      payload._honey = '';
      payload.form = form.dataset.formName || 'consultation';
      payload.page = location.href;

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        let data = {};
        try { data = await res.json(); } catch (_) {}
        // FormSubmit replies {"success":"true"|"false", "message": "..."}
        // (string or boolean depending on version). Accept either form;
        // other providers (Formspree) just return 2xx with {ok:true}.
        const okFlag = data.success !== undefined ? String(data.success) === 'true'
                     : data.ok !== undefined ? Boolean(data.ok) : true;
        if (!res.ok || !okFlag) {
          showError('Sorry — your message could not be sent.');
          return;
        }
        window.amTrack('form_submit', { form: payload.form, page: location.pathname });
        form.reset();
        showSuccess();
      } catch (err) {
        showError('Network error — your message could not be sent.');
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
