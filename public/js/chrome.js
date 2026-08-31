// Shared across every page: header/footer rendering, escaping, and small icon maps.
// Loaded before each page's own script (index.html, donate.html, get-involved.html, gallery.html).

const SOCIAL_ICONS = {
  facebook: 'f',
  instagram: '&#128247;',
  twitter: 'X',
  youtube: '&#9654;'
};

const STAT_ICONS = {
  children: '&#128118;',
  family: '&#128106;',
  graduate: '&#127891;',
  hands: '&#129309;'
};

// Clean line-style SVG icons for the Programs cards and program detail page
// (education/nutrition/shelter/healthcare) — used instead of emoji for a
// more professional look.
const PROGRAM_ICONS = {
  graduate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>',
  bowl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M12 11V4"/><path d="M8 4a4 4 0 0 1 8 0"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
  'heart-pulse': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/><path d="M3.5 12h3l2-4 3 8 2-5h4.5"/></svg>'
};

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadSettings() {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to load site settings');
  return res.json();
}

// Fills in the header (brand name/tagline) and footer (org info, contact,
// social links, copyright line) — present in the same form on every page.
function renderChrome(settings) {
  if (!settings) return;
  document.title = `${settings.orgName || 'Siitanest'} ${settings.orgTagline || ''}`.trim();

  const brandName = document.getElementById('brand-name');
  const brandSub = document.getElementById('brand-sub');
  if (brandName) brandName.textContent = (settings.orgName || 'SIITANEST').toUpperCase();
  if (brandSub) brandSub.textContent = settings.orgTagline || '';

  const footerOrgName = document.getElementById('footer-org-name');
  const footerOrgSub = document.getElementById('footer-org-sub');
  const footerNote = document.getElementById('footer-note');
  const footerAddress = document.getElementById('footer-address');
  const footerPhone = document.getElementById('footer-phone');
  const footerEmail = document.getElementById('footer-email');
  const footerBottom = document.getElementById('footer-bottom');

  if (footerOrgName) footerOrgName.textContent = (settings.orgName || '').toUpperCase();
  if (footerOrgSub) footerOrgSub.textContent = settings.orgTagline || '';
  if (footerNote) footerNote.textContent = settings.footerNote || '';
  if (footerAddress) {
    const addressLine = [settings.address, settings.poBox ? `P.O. Box ${settings.poBox}` : '']
      .filter(Boolean)
      .join(' · ');
    footerAddress.innerHTML = `&#128205; ${escapeHtml(addressLine)}`;
  }
  if (footerPhone) {
    footerPhone.innerHTML = settings.phone
      ? `&#128222; <a href="tel:${escapeHtml(settings.phone.replace(/[^\d+]/g, ''))}">${escapeHtml(settings.phone)}</a>`
      : '&#128222;';
  }
  if (footerEmail) {
    footerEmail.innerHTML = settings.email
      ? `&#9993; <a href="mailto:${escapeHtml(settings.email)}">${escapeHtml(settings.email)}</a>`
      : '&#9993;';
  }
  if (footerBottom) {
    footerBottom.textContent = `© ${new Date().getFullYear()} ${settings.orgName || ''} ${settings.orgTagline || ''}. All Rights Reserved.`;
  }

  const social = settings.socialLinks || {};
  const socialRow = document.getElementById('social-row');
  if (socialRow) {
    socialRow.innerHTML = Object.entries(social)
      .filter(([, url]) => url)
      .map(([key, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${SOCIAL_ICONS[key] || key[0].toUpperCase()}</a>`)
      .join('');
  }
}

function renderFooterPrograms(programs) {
  const el = document.getElementById('footer-programs');
  if (!el) return;
  if (!programs || !programs.length) { el.innerHTML = ''; return; }
  el.innerHTML = programs.map((p) => `<li><a href="/#programs">${escapeHtml(p.title)}</a></li>`).join('');
}

// Slim bar fixed to the bottom of the viewport on every page, showing the
// four impact stats (Children Supported, Families Assisted, etc.).
function renderFloatingStats(stats) {
  const el = document.getElementById('floating-stats');
  if (!el) return;
  if (!stats || !stats.length) { el.innerHTML = ''; return; }
  el.innerHTML = stats
    .map(
      (s) => `
    <div class="fs-item">
      <span class="fs-icon">${STAT_ICONS[s.icon] || '&#11088;'}</span>
      <span class="fs-value">${escapeHtml(s.value)}</span>
      <span class="fs-label">${escapeHtml(s.label)}</span>
    </div>`
    )
    .join('');
}

// Call this from every page's init — fetches stats once and renders the
// floating bar, independent of whatever else that page loads.
async function initFloatingStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    renderFloatingStats(await res.json());
  } catch (err) {
    console.error(err);
  }
}

// ---------- Mobile menu ----------
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  function closeMenu() {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  }

  toggle.addEventListener('click', toggleMenu);
  // Close after tapping a link, so it doesn't stay open on the next page.
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  // Close if the window is resized back up to desktop width.
  window.addEventListener('resize', () => { if (window.innerWidth > 980) closeMenu(); });
}

// ---------- Back to top ----------
function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '&#8593;';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 500);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ---------- Newsletter signup ----------
function initNewsletterForms() {
  document.querySelectorAll('.newsletter-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const button = form.querySelector('button');
      const email = input.value.trim();
      if (!email) return;
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = '...';
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong.');
        form.reset();
        button.textContent = 'Subscribed ✓';
        setTimeout(() => { button.textContent = originalText; button.disabled = false; }, 2500);
      } catch (err) {
        alert(err.message || 'Something went wrong. Please try again.');
        button.textContent = originalText;
        button.disabled = false;
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initBackToTop();
  initNewsletterForms();
});
