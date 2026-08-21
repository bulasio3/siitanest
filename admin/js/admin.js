// ---------- Small helpers ----------
function $(id) { return document.getElementById(id); }

function toast(message, isError = false) {
  const el = $('toast');
  el.textContent = message;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 3200);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options
  });
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Not authenticated');
  }
  let data = null;
  try { data = await res.json(); } catch (_) { /* no body */ }
  if (!res.ok) {
    throw new Error((data && data.error) || 'Something went wrong. Please try again.');
  }
  return data;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Uploads a single image and returns its public URL, updating a preview box + status label along the way.
async function uploadImage(fileInput, folder, previewEl, statusEl) {
  const file = fileInput.files[0];
  if (!file) return null;
  statusEl.textContent = 'Uploading…';
  const formData = new FormData();
  formData.append('image', file);
  try {
    const data = await api(`/api/admin/upload?folder=${encodeURIComponent(folder)}`, {
      method: 'POST',
      body: formData
    });
    if (previewEl) previewEl.style.backgroundImage = `url('${data.url}')`;
    statusEl.textContent = 'Uploaded ✓';
    return data.url;
  } catch (err) {
    statusEl.textContent = '';
    toast(err.message, true);
    return null;
  }
}

// Uploads a background video and returns its public URL, previewing it inline.
async function uploadVideo(fileInput, previewEl, statusEl) {
  const file = fileInput.files[0];
  if (!file) return null;
  statusEl.textContent = 'Uploading… (this may take a moment)';
  const formData = new FormData();
  formData.append('video', file);
  try {
    const data = await api('/api/admin/upload-video', { method: 'POST', body: formData });
    if (previewEl) { previewEl.src = data.url; previewEl.play().catch(() => {}); }
    statusEl.textContent = 'Uploaded ✓';
    return data.url;
  } catch (err) {
    statusEl.textContent = '';
    toast(err.message, true);
    return null;
  }
}

// ---------- Navigation ----------
function initNav() {
  const links = document.querySelectorAll('#side-nav a[data-panel]');
  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      $(`panel-${link.dataset.panel}`).classList.add('active');
    });
  });

  $('logout-btn').addEventListener('click', async () => {
    await api('/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  });
}

// ---------- Settings ----------
let currentSettings = {};

async function loadSettings() {
  currentSettings = await api('/api/admin/settings');
  const s = currentSettings;
  $('s-orgName').value = s.orgName || '';
  $('s-orgTagline').value = s.orgTagline || '';
  $('s-heroHeadline').value = s.heroHeadline || '';
  $('s-heroSubtext').value = s.heroSubtext || '';
  $('s-aboutTitle').value = s.aboutTitle || '';
  $('s-aboutText').value = s.aboutText || '';
  $('s-historyTitle').value = s.historyTitle || '';
  $('s-historyText').value = s.historyText || '';
  $('s-missionText').value = s.missionText || '';
  $('s-visionText').value = s.visionText || '';
  $('s-address').value = s.address || '';
  $('s-phone').value = s.phone || '';
  $('s-email').value = s.email || '';
  $('s-donateUrl').value = s.donateUrl && s.donateUrl !== '#donate' ? s.donateUrl : '';
  $('s-footerNote').value = s.footerNote || '';
  $('s-donateNote').value = s.donateNote || '';
  $('s-mtnNumber').value = s.mtnNumber || '';
  $('s-mtnName').value = s.mtnName || '';
  $('s-airtelNumber').value = s.airtelNumber || '';
  $('s-airtelName').value = s.airtelName || '';
  $('s-bankName').value = s.bankName || '';
  $('s-bankAccountName').value = s.bankAccountName || '';
  $('s-bankAccountNumber').value = s.bankAccountNumber || '';
  $('s-bankBranch').value = s.bankBranch || '';
  const social = s.socialLinks || {};
  $('s-social-facebook').value = social.facebook || '';
  $('s-social-instagram').value = social.instagram || '';
  $('s-social-twitter').value = social.twitter || '';
  $('s-social-youtube').value = social.youtube || '';

  if (s.heroImage) $('s-heroImage-preview').style.backgroundImage = `url('${s.heroImage}')`;
  if (s.aboutImage) $('s-aboutImage-preview').style.backgroundImage = `url('${s.aboutImage}')`;
  if (s.heroVideoUrl) $('s-heroVideo-preview').src = s.heroVideoUrl;
}

async function saveSettings() {
  const btn = $('settings-save');
  btn.disabled = true;
  try {
    const heroImageUrl = await uploadImage($('s-heroImage-file'), 'misc', $('s-heroImage-preview'), $('s-heroImage-status'));
    const aboutImageUrl = await uploadImage($('s-aboutImage-file'), 'misc', $('s-aboutImage-preview'), $('s-aboutImage-status'));
    const heroVideoUrl = await uploadVideo($('s-heroVideo-file'), $('s-heroVideo-preview'), $('s-heroVideo-status'));

    const payload = {
      orgName: $('s-orgName').value.trim(),
      orgTagline: $('s-orgTagline').value.trim(),
      heroHeadline: $('s-heroHeadline').value.trim(),
      heroSubtext: $('s-heroSubtext').value.trim(),
      aboutTitle: $('s-aboutTitle').value.trim(),
      aboutText: $('s-aboutText').value.trim(),
      historyTitle: $('s-historyTitle').value.trim(),
      historyText: $('s-historyText').value.trim(),
      missionText: $('s-missionText').value.trim(),
      visionText: $('s-visionText').value.trim(),
      address: $('s-address').value.trim(),
      phone: $('s-phone').value.trim(),
      email: $('s-email').value.trim(),
      donateUrl: $('s-donateUrl').value.trim(),
      footerNote: $('s-footerNote').value.trim(),
      donateNote: $('s-donateNote').value.trim(),
      mtnNumber: $('s-mtnNumber').value.trim(),
      mtnName: $('s-mtnName').value.trim(),
      airtelNumber: $('s-airtelNumber').value.trim(),
      airtelName: $('s-airtelName').value.trim(),
      bankName: $('s-bankName').value.trim(),
      bankAccountName: $('s-bankAccountName').value.trim(),
      bankAccountNumber: $('s-bankAccountNumber').value.trim(),
      bankBranch: $('s-bankBranch').value.trim(),
      socialLinks: {
        facebook: $('s-social-facebook').value.trim(),
        instagram: $('s-social-instagram').value.trim(),
        twitter: $('s-social-twitter').value.trim(),
        youtube: $('s-social-youtube').value.trim()
      }
    };
    if (heroImageUrl) payload.heroImage = heroImageUrl;
    if (aboutImageUrl) payload.aboutImage = aboutImageUrl;
    if (heroVideoUrl) payload.heroVideoUrl = heroVideoUrl;

    currentSettings = await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(payload) });
    toast('Site info saved.');
  } catch (err) {
    toast(err.message, true);
  } finally {
    btn.disabled = false;
  }
}

// ---------- Stats ----------
async function loadStats() {
  const stats = await api('/api/admin/stats');
  const container = $('stats-list');
  container.innerHTML = stats
    .map(
      (s, i) => `
    <div class="field">
      <label>${escapeHtml(s.label)} — value</label>
      <input data-idx="${i}" data-key="value" value="${escapeHtml(s.value)}">
    </div>
    <div class="field">
      <label>${escapeHtml(s.label)} — label</label>
      <input data-idx="${i}" data-key="label" value="${escapeHtml(s.label)}">
    </div>`
    )
    .join('');
  container.dataset.stats = JSON.stringify(stats);
}

async function saveStats() {
  const container = $('stats-list');
  const stats = JSON.parse(container.dataset.stats || '[]');
  container.querySelectorAll('input').forEach((input) => {
    stats[Number(input.dataset.idx)][input.dataset.key] = input.value;
  });
  try {
    await api('/api/admin/stats', { method: 'PUT', body: JSON.stringify(stats) });
    toast('Stats saved.');
    loadStats();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Programs ----------
async function loadPrograms() {
  const programs = await api('/api/admin/programs');
  const list = $('programs-list');
  if (!programs.length) {
    list.innerHTML = '<div class="empty-state">No programs yet. Add one above.</div>';
    return;
  }
  list.innerHTML = programs
    .map(
      (p) => `
    <div class="item-row">
      <div class="info">
        <strong>${escapeHtml(p.title)}</strong>
        <span>${(p.bullets || []).join(' · ')}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm btn-secondary" data-edit="${p.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${p.id}">Delete</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const p = programs.find((x) => x.id === btn.dataset.edit);
      $('program-id').value = p.id;
      $('program-title').value = p.title;
      $('program-color').value = p.color || 'green';
      $('program-bullets').value = (p.bullets || []).join('\n');
      $('program-details').value = p.details || '';
      if (p.image) $('program-image-preview').style.backgroundImage = `url('${p.image}')`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );
  list.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this program?')) return;
      await api(`/api/admin/programs/${btn.dataset.delete}`, { method: 'DELETE' });
      toast('Program deleted.');
      loadPrograms();
    })
  );
}

function resetProgramForm() {
  $('program-form').reset();
  $('program-id').value = '';
  $('program-image-preview').style.backgroundImage = '';
  $('program-image-status').textContent = '';
}

async function submitProgramForm(e) {
  e.preventDefault();
  const id = $('program-id').value;
  const bullets = $('program-bullets').value.split('\n').map((b) => b.trim()).filter(Boolean);
  const imageUrl = await uploadImage($('program-image-file'), 'programs', $('program-image-preview'), $('program-image-status'));
  const payload = {
    title: $('program-title').value.trim(),
    color: $('program-color').value,
    bullets,
    summary: bullets.join(', '),
    details: $('program-details').value.trim()
  };
  if (imageUrl) payload.image = imageUrl;
  try {
    if (id) {
      await api(`/api/admin/programs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast('Program updated.');
    } else {
      await api('/api/admin/programs', { method: 'POST', body: JSON.stringify(payload) });
      toast('Program added.');
    }
    resetProgramForm();
    loadPrograms();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Gallery ----------
async function loadGallery() {
  const gallery = await api('/api/admin/gallery');
  const list = $('gallery-list');
  if (!gallery.length) {
    list.innerHTML = '<div class="empty-state">No photos yet. Add one above.</div>';
    return;
  }
  list.innerHTML = gallery
    .map(
      (g) => `
    <div class="item-row">
      <img class="thumb" src="${escapeHtml(g.image)}" alt="">
      <div class="info"><strong>${escapeHtml(g.caption || 'Untitled photo')}</strong></div>
      <div class="row-actions">
        <button class="btn btn-sm btn-danger" data-delete="${g.id}">Delete</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this photo from the gallery?')) return;
      await api(`/api/admin/gallery/${btn.dataset.delete}`, { method: 'DELETE' });
      toast('Photo removed.');
      loadGallery();
    })
  );
}

async function addGalleryPhoto() {
  const fileInput = $('gallery-upload-file');
  if (!fileInput.files[0]) { toast('Choose a photo first.', true); return; }
  const btn = $('gallery-add');
  btn.disabled = true;
  try {
    const url = await uploadImage(fileInput, 'gallery', $('gallery-upload-preview'), $('gallery-upload-status'));
    if (!url) return;
    await api('/api/admin/gallery', {
      method: 'POST',
      body: JSON.stringify({ image: url, caption: $('gallery-caption').value.trim() })
    });
    toast('Photo added to gallery.');
    fileInput.value = '';
    $('gallery-caption').value = '';
    $('gallery-upload-preview').style.backgroundImage = '';
    $('gallery-upload-status').textContent = '';
    loadGallery();
  } catch (err) {
    toast(err.message, true);
  } finally {
    btn.disabled = false;
  }
}

// ---------- Stories ----------
async function loadStories() {
  const stories = await api('/api/admin/stories');
  const list = $('stories-list');
  if (!stories.length) {
    list.innerHTML = '<div class="empty-state">No stories yet. Add one above.</div>';
    return;
  }
  list.innerHTML = stories
    .map(
      (s) => `
    <div class="item-row">
      <img class="thumb" src="${escapeHtml(s.image || '/images/about-default.svg')}" alt="">
      <div class="info">
        <strong>${escapeHtml(s.name)}${s.age ? ', Age ' + escapeHtml(s.age) : ''}</strong>
        <span>${escapeHtml((s.quote || '').slice(0, 70))}${(s.quote || '').length > 70 ? '…' : ''}</span>
        <div><span class="badge ${s.published !== false ? 'published' : 'draft'}">${s.published !== false ? 'Published' : 'Draft'}</span></div>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm btn-secondary" data-edit="${s.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${s.id}">Delete</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const s = stories.find((x) => x.id === btn.dataset.edit);
      $('story-id').value = s.id;
      $('story-name').value = s.name || '';
      $('story-age').value = s.age || '';
      $('story-quote').value = s.quote || '';
      $('story-full').value = s.fullStory || '';
      $('story-published').value = String(s.published !== false);
      if (s.image) $('story-image-preview').style.backgroundImage = `url('${s.image}')`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );
  list.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this story?')) return;
      await api(`/api/admin/stories/${btn.dataset.delete}`, { method: 'DELETE' });
      toast('Story deleted.');
      loadStories();
    })
  );
}

function resetStoryForm() {
  $('story-form').reset();
  $('story-id').value = '';
  $('story-image-preview').style.backgroundImage = '';
  $('story-image-status').textContent = '';
}

async function submitStoryForm(e) {
  e.preventDefault();
  const id = $('story-id').value;
  try {
    const imageUrl = await uploadImage($('story-image-file'), 'stories', $('story-image-preview'), $('story-image-status'));
    const payload = {
      name: $('story-name').value.trim(),
      age: $('story-age').value.trim(),
      quote: $('story-quote').value.trim(),
      fullStory: $('story-full').value.trim() || $('story-quote').value.trim(),
      published: $('story-published').value === 'true'
    };
    if (imageUrl) payload.image = imageUrl;

    if (id) {
      await api(`/api/admin/stories/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast('Story updated.');
    } else {
      await api('/api/admin/stories', { method: 'POST', body: JSON.stringify(payload) });
      toast('Story added.');
    }
    resetStoryForm();
    loadStories();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Team ----------
async function loadTeam() {
  const team = await api('/api/admin/team');
  const list = $('team-list');
  if (!team.length) {
    list.innerHTML = '<div class="empty-state">No team members yet. Add one above.</div>';
    return;
  }
  list.innerHTML = team
    .map(
      (t) => `
    <div class="item-row">
      <img class="thumb" src="${escapeHtml(t.image || '/images/about-default.svg')}" alt="">
      <div class="info">
        <strong>${escapeHtml(t.name)}</strong>
        <span>${escapeHtml(t.role || '')}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm btn-secondary" data-edit="${t.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${t.id}">Delete</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const t = team.find((x) => x.id === btn.dataset.edit);
      $('team-id').value = t.id;
      $('team-name').value = t.name || '';
      $('team-role').value = t.role || '';
      $('team-bio').value = t.bio || '';
      if (t.image) $('team-image-preview').style.backgroundImage = `url('${t.image}')`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );
  list.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this team member?')) return;
      await api(`/api/admin/team/${btn.dataset.delete}`, { method: 'DELETE' });
      toast('Team member removed.');
      loadTeam();
    })
  );
}

function resetTeamForm() {
  $('team-form').reset();
  $('team-id').value = '';
  $('team-image-preview').style.backgroundImage = '';
  $('team-image-status').textContent = '';
}

async function submitTeamForm(e) {
  e.preventDefault();
  const id = $('team-id').value;
  try {
    const imageUrl = await uploadImage($('team-image-file'), 'misc', $('team-image-preview'), $('team-image-status'));
    const payload = {
      name: $('team-name').value.trim(),
      role: $('team-role').value.trim(),
      bio: $('team-bio').value.trim()
    };
    if (imageUrl) payload.image = imageUrl;

    if (id) {
      await api(`/api/admin/team/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast('Team member updated.');
    } else {
      await api('/api/admin/team', { method: 'POST', body: JSON.stringify(payload) });
      toast('Team member added.');
    }
    resetTeamForm();
    loadTeam();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- News ----------
async function loadNews() {
  const news = await api('/api/admin/news');
  const list = $('news-list');
  if (!news.length) {
    list.innerHTML = '<div class="empty-state">No news items yet. Add one above.</div>';
    return;
  }
  list.innerHTML = news
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(
      (n) => `
    <div class="item-row">
      <img class="thumb" src="${escapeHtml(n.image || '/images/about-default.svg')}" alt="">
      <div class="info">
        <strong>${escapeHtml(n.title)}</strong>
        <span>${escapeHtml(new Date(n.date).toLocaleDateString())}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm btn-secondary" data-edit="${n.id}">Edit</button>
        <button class="btn btn-sm btn-danger" data-delete="${n.id}">Delete</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const n = news.find((x) => x.id === btn.dataset.edit);
      $('news-id').value = n.id;
      $('news-title').value = n.title || '';
      $('news-excerpt').value = n.excerpt || '';
      $('news-date').value = n.date ? n.date.slice(0, 10) : '';
      if (n.image) $('news-image-preview').style.backgroundImage = `url('${n.image}')`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
  );
  list.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this news item?')) return;
      await api(`/api/admin/news/${btn.dataset.delete}`, { method: 'DELETE' });
      toast('News item deleted.');
      loadNews();
    })
  );
}

function resetNewsForm() {
  $('news-form').reset();
  $('news-id').value = '';
  $('news-image-preview').style.backgroundImage = '';
  $('news-image-status').textContent = '';
}

async function submitNewsForm(e) {
  e.preventDefault();
  const id = $('news-id').value;
  try {
    const imageUrl = await uploadImage($('news-image-file'), 'news', $('news-image-preview'), $('news-image-status'));
    const payload = {
      title: $('news-title').value.trim(),
      excerpt: $('news-excerpt').value.trim(),
      date: $('news-date').value ? new Date($('news-date').value).toISOString() : new Date().toISOString()
    };
    if (imageUrl) payload.image = imageUrl;

    if (id) {
      await api(`/api/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      toast('News item updated.');
    } else {
      await api('/api/admin/news', { method: 'POST', body: JSON.stringify(payload) });
      toast('News item added.');
    }
    resetNewsForm();
    loadNews();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Inquiries ----------
async function loadInquiries() {
  const inquiries = await api('/api/admin/inquiries');
  const list = $('inquiries-list');
  const badge = $('inquiries-badge');
  const unread = inquiries.filter((i) => !i.read).length;
  badge.textContent = unread > 0 ? unread : '';

  if (!inquiries.length) {
    list.innerHTML = '<div class="empty-state">No messages yet. They\'ll show up here when someone submits the "Get Involved" form on your site.</div>';
    return;
  }
  list.innerHTML = inquiries
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (i) => `
    <div class="item-row" style="align-items:flex-start;">
      <div class="info">
        <strong>${escapeHtml(i.name)} ${i.read ? '' : '<span class="badge draft" style="background:#fdecea;color:#c0392b;">New</span>'}</strong>
        <span>${escapeHtml(i.type || 'General')} · ${escapeHtml(new Date(i.createdAt).toLocaleString())}</span>
        <div style="margin-top:6px; font-size:13px;">
          <div>&#9993; <a href="mailto:${escapeHtml(i.email)}">${escapeHtml(i.email)}</a>${i.phone ? ' &nbsp; &#128222; ' + escapeHtml(i.phone) : ''}</div>
          <div style="margin-top:6px; white-space:pre-wrap; color:var(--ink-900);">${escapeHtml(i.message)}</div>
        </div>
      </div>
      <div class="row-actions">
        ${!i.read ? `<button class="btn btn-sm btn-secondary" data-read="${i.id}">Mark Read</button>` : ''}
        <button class="btn btn-sm btn-danger" data-delete="${i.id}">Delete</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-read]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      await api(`/api/admin/inquiries/${btn.dataset.read}`, { method: 'PUT', body: JSON.stringify({ read: true }) });
      loadInquiries();
    })
  );
  list.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this message?')) return;
      await api(`/api/admin/inquiries/${btn.dataset.delete}`, { method: 'DELETE' });
      toast('Message deleted.');
      loadInquiries();
    })
  );
}

// ---------- Subscribers ----------
async function loadSubscribers() {
  const subscribers = await api('/api/admin/subscribers');
  const list = $('subscribers-list');
  $('subscribers-count').textContent = subscribers.length ? `${subscribers.length} subscriber${subscribers.length === 1 ? '' : 's'}` : '';

  if (!subscribers.length) {
    list.innerHTML = '<div class="empty-state">No subscribers yet. They\'ll show up here as people sign up through the footer newsletter form.</div>';
    return;
  }
  list.innerHTML = subscribers
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (s) => `
    <div class="item-row">
      <div class="info">
        <strong>${escapeHtml(s.email)}</strong>
        <span>${escapeHtml(new Date(s.createdAt).toLocaleDateString())}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-sm btn-danger" data-delete="${s.id}">Remove</button>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-delete]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this subscriber?')) return;
      await api(`/api/admin/subscribers/${btn.dataset.delete}`, { method: 'DELETE' });
      toast('Subscriber removed.');
      loadSubscribers();
    })
  );
}

async function copyAllSubscriberEmails() {
  try {
    const subscribers = await api('/api/admin/subscribers');
    if (!subscribers.length) { toast('No subscribers to copy yet.', true); return; }
    const emails = subscribers.map((s) => s.email).join(', ');
    await navigator.clipboard.writeText(emails);
    toast(`Copied ${subscribers.length} email address${subscribers.length === 1 ? '' : 'es'}.`);
  } catch (err) {
    toast('Could not copy emails.', true);
  }
}

// ---------- Account ----------
async function loadAccount() {
  const data = await api('/api/admin/whoami');
  $('account-username').textContent = data.username || '—';
}

async function saveAccountPassword() {
  const currentPassword = $('acc-current').value;
  const newPassword = $('acc-new').value;
  try {
    await api('/api/admin/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
    toast('Password updated.');
    $('acc-current').value = '';
    $('acc-new').value = '';
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- Init ----------
(function init() {
  initNav();
  loadSettings();
  loadStats();
  loadPrograms();
  loadGallery();
  loadTeam();
  loadStories();
  loadNews();
  loadInquiries();
  loadSubscribers();
  loadAccount();

  $('settings-save').addEventListener('click', saveSettings);
  $('stats-save').addEventListener('click', saveStats);
  $('program-form').addEventListener('submit', submitProgramForm);
  $('program-cancel').addEventListener('click', resetProgramForm);
  $('gallery-add').addEventListener('click', addGalleryPhoto);
  $('team-form').addEventListener('submit', submitTeamForm);
  $('team-cancel').addEventListener('click', resetTeamForm);
  $('story-form').addEventListener('submit', submitStoryForm);
  $('story-cancel').addEventListener('click', resetStoryForm);
  $('news-form').addEventListener('submit', submitNewsForm);
  $('news-cancel').addEventListener('click', resetNewsForm);
  $('subscribers-copy').addEventListener('click', copyAllSubscriberEmails);
  $('acc-save').addEventListener('click', saveAccountPassword);
})();
