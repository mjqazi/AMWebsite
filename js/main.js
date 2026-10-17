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

  // "Offshore worries" block: open every answer on wider screens
  if (window.matchMedia('(min-width: 769px)').matches) {
    document.querySelectorAll('.objections details').forEach(d => { d.open = true; });
  }

  // Platform tab list: drop the right-edge fade once scrolled to the end
  document.querySelectorAll('.platform-tab-list').forEach(list => {
    const edge = () => list.classList.toggle('at-end',
      list.scrollLeft + list.clientWidth >= list.scrollWidth - 4);
    list.addEventListener('scroll', edge, { passive: true });
    window.addEventListener('resize', edge);
    edge();
  });

  // Sticky mobile CTA bar (CSS shows it at <= 768px). Not on the contact
  // page itself. <body data-cta-href> overrides the target (homepage uses
  // its own #contact form); <body data-service> preselects the service.
  if (!document.body.hasAttribute('data-no-mobile-cta') && !/\/contact(\.html)?$/.test(location.pathname)) {
    const svc = document.body.dataset.service;
    const href = document.body.dataset.ctaHref || ('/contact.html' + (svc ? '?service=' + encodeURIComponent(svc) : ''));
    const bar = document.createElement('div');
    bar.className = 'mobile-cta-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Quick contact');
    const cta = document.createElement('a');
    cta.className = 'btn';
    cta.href = href;
    cta.textContent = 'Send us one drawing \u2014 free';
    cta.dataset.cta = 'primary';
    const call = document.createElement('a');
    call.className = 'mobile-cta-call';
    call.href = 'tel:' + CONTACT_PHONE_E164;
    call.setAttribute('aria-label', 'Call ' + CONTACT_PHONE_DISPLAY);
    call.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>';
    bar.append(cta, call);
    document.body.appendChild(bar);
    document.body.classList.add('has-mobile-cta');
    // Get out of the way while any lead form is on screen
    if ('IntersectionObserver' in window) {
      const visible = new Set();
      const fio = new IntersectionObserver(entries => {
        entries.forEach(en => en.isIntersecting ? visible.add(en.target) : visible.delete(en.target));
        bar.classList.toggle('is-hidden', visible.size > 0);
      }, { threshold: 0 });
      document.querySelectorAll('form').forEach(f => fio.observe(f));
    }
  }

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

    // Pre-select the service dropdown from ?service=<slug> (every CTA on the
    // site links to contact.html?service=<slug>; option values are the slugs).
    const serviceSelect = form.querySelector('select[name="service"]');
    const wanted = (new URLSearchParams(location.search).get('service') || '').toLowerCase().trim();
    if (serviceSelect && wanted) {
      const aliases = { timesheets: 'timesheet', 'arc-flash-study': 'arc-flash', arcflash: 'arc-flash',
        modeling: 'bim', '3d': 'bim', revit: 'bim', 'solar-permit': 'solar', permits: 'solar',
        drafting: 'electrical', 'control-panels': 'control-panel', plc: 'control-panel' };
      const slug = aliases[wanted] || wanted;
      const opts = Array.from(serviceSelect.options);
      let match = opts.find(o => o.value && o.value.toLowerCase() === slug);
      if (!match) {
        const needle = slug.replace(/[-_+]/g, ' ').replace(/s$/, '');
        match = needle && opts.find(o => o.value && o.text.toLowerCase().includes(needle));
      }
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
      if (serviceSelect && serviceSelect.value) {
        payload.service = serviceSelect.options[serviceSelect.selectedIndex].text + ' [' + serviceSelect.value + ']';
      }
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
