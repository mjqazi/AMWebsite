// Advanced Mechanix — site JS

// Lead-form endpoint. The homepage and contact forms POST JSON via fetch().
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

// Analytics is production-only and loads after the visitor grants permission.
// An empty ID disables that provider. Local previews never send analytics.
//   ga4:     Google Analytics 4 measurement ID, e.g. 'G-XXXXXXXXXX'
//   clarity: Microsoft Clarity project ID, e.g. 'abcd1234ef'
// Events sent to GA4: generate_lead (successful form submit),
// contact_click (tel:/mailto: links), cta_click and file downloads.
const ANALYTICS = {
  ga4: 'G-1VGM9W6RT0',
  clarity: ''
};

let analyticsAllowed = false;
let analyticsLoaded = false;
function loadAnalytics() {
  if (!analyticsAllowed || analyticsLoaded || !/^(www\.)?advancedmechanix\.com$/.test(location.hostname)) return;
  analyticsLoaded = true;
  const ga4 = (ANALYTICS.ga4 || '').trim();
  const clarity = (ANALYTICS.clarity || '').trim();
  if (/^G-[A-Z0-9]+$/i.test(ga4)) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window['ga-disable-' + ga4] = false;
    window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    let referrer = '';
    try { const url = new URL(document.referrer); referrer = url.origin + url.pathname; } catch {}
    window.gtag('config', ga4, { allow_google_signals: false, allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname, page_referrer: referrer, cookie_expires: 7776000 });
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4);
    document.head.appendChild(s);
  }
  if (/^[a-z0-9]+$/i.test(clarity)) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', clarity);
  }
}

function analyticsPreferences() {
  if ((!ANALYTICS.ga4 && !ANALYTICS.clarity) || !/^(www\.)?advancedmechanix\.com$/.test(location.hostname)) return;
  const key = 'am-analytics-choice-v1';
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && ['granted', 'denied'].includes(saved.value) &&
        Date.now() - saved.time < 15552000000) choice = saved.value;
  } catch {}
  analyticsAllowed = choice === 'granted';
  loadAnalytics();
  const panel = document.createElement('section');
  panel.className = 'analytics-preferences';
  panel.setAttribute('aria-label', 'Analytics preferences');
  panel.hidden = choice !== null;
  panel.innerHTML = '<h2>Optional analytics</h2><p>Allow Google Analytics to help us understand site visits and project enquiries? We keep form messages and contact details out of analytics.</p><p><a href="/privacy.html">Privacy policy</a></p><div class="analytics-actions"><button type="button" class="btn" data-choice="granted">Allow analytics</button><button type="button" class="btn btn-outline" data-choice="denied">Decline analytics</button></div>';
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'analytics-settings';
  settings.textContent = 'Analytics preferences';
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  (document.querySelector('footer') || document.body).appendChild(settings);
  document.body.appendChild(panel);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape' && choice !== null) { panel.hidden = true; settings.focus(); }
  });
  panel.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    choice = button.dataset.choice;
    try { localStorage.setItem(key, JSON.stringify({ value: choice, time: Date.now() })); } catch {}
    analyticsAllowed = choice === 'granted';
    if (analyticsAllowed) {
      loadAnalytics();
    } else if (analyticsLoaded) {
      window['ga-disable-' + ANALYTICS.ga4] = true;
      document.cookie.split(';').forEach(entry => {
        const name = entry.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) return;
        for (const domain of ['', '; domain=advancedmechanix.com', '; domain=.advancedmechanix.com']) {
          document.cookie = name + '=; Max-Age=0; path=/' + domain;
        }
      });
      location.reload();
      return;
    }
    panel.hidden = true;
    settings.focus();
  }));
}

// One call for every event: forwards to GA4 (and tags Clarity) when loaded.
window.amTrack = function (event, props) {
  props = props || {};
  if (analyticsAllowed && typeof window.gtag === 'function') window.gtag('event', event, props);
  if (analyticsAllowed && typeof window.clarity === 'function') window.clarity('event', event);
  if (window.console && console.debug) console.debug('[amTrack]', event, props);
};

document.addEventListener('DOMContentLoaded', () => {
  analyticsPreferences();

  // Mobile nav toggle with aria
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // Close menu when a link is clicked
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
    // Close menu on Escape and return focus to the toggle
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
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
    cta.textContent = 'Scope your project';
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
      // Resource-request templates keep their confirmation inside the form.
      // Move it out before hiding the fields, so all four forms stay visible
      // and announce the same persistent confirmation.
      if (form.contains(success)) form.before(success);
      form.hidden = true;
      form.style.display = 'none';
      success.setAttribute('role', 'status');
      success.setAttribute('tabindex', '-1');
      success.classList.add('show');
      success.style.display = 'block';
      success.focus({ preventScroll: true });
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();
      let firstInvalid;
      form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(field => {
        if (!field.willValidate || field.name === '_honey' || field.name === 'website') return;
        const errorId = field.id + '-error';
        document.getElementById(errorId)?.remove();
        const descriptions = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== errorId);
        field.removeAttribute('aria-invalid');
        if ((field.required && !field.value.trim()) || !field.validity.valid) {
          firstInvalid = firstInvalid || field;
          field.setAttribute('aria-invalid', 'true');
          const message = document.createElement('span');
          message.id = errorId;
          message.className = 'field-error';
          message.textContent = field.validity.valid ? 'Please complete this field.' : field.validationMessage;
          field.after(message);
          descriptions.push(errorId);
        }
        if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
        else field.removeAttribute('aria-describedby');
      });
      if (firstInvalid) {
        showValidation('Please check the highlighted fields. Your message has not been sent.');
        firstInvalid.focus();
        return;
      }

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
        const data = await res.json();
        // Require an explicit acknowledgement, including on HTTP 200.
        // Activation/error pages must never look like a delivered lead.
        const okFlag = data && (data.success !== undefined
          ? data.success === true || data.success === 'true'
          : data.ok === true);
        if (!res.ok || !okFlag) {
          showError('Sorry — your message could not be sent.');
          return;
        }
        window.amTrack('generate_lead', { form: payload.form, service: serviceSelect ? serviceSelect.value : '', page: location.pathname });
        form.reset();
        showSuccess();
      } catch (err) {
        showError('Network error — your message could not be sent.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      }
    });
  }

  // Phone and email clicks (topbar, footer, contact blocks, sticky bar)
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a) return;
    const href = a.getAttribute('href');
    window.amTrack('contact_click', {
      method: href.startsWith('tel:') ? 'phone' : 'email',
      link_url: href,
      page: location.pathname
    });
  });

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
