function renderAboutContent(settings) {
  document.getElementById('about-title').textContent = settings.aboutTitle || 'Who We Are';
  document.getElementById('about-text').textContent = settings.aboutText || '';
  document.getElementById('about-image').src = settings.aboutImage || '/images/about-default.svg';

  const historySection = document.getElementById('history-section');
  if (settings.historyText) {
    document.getElementById('history-title').textContent = settings.historyTitle || 'Our History';
    document.getElementById('history-text').textContent = settings.historyText;
  } else {
    historySection.style.display = 'none';
  }

  document.getElementById('mission-text').textContent = settings.missionText || '';
  document.getElementById('vision-text').textContent = settings.visionText || '';
}

function renderTeam(team) {
  const grid = document.getElementById('team-grid');
  const section = document.getElementById('team-section');
  if (!team || !team.length) {
    section.style.display = 'none';
    return;
  }
  grid.innerHTML = team
    .map(
      (t) => `
    <div class="team-card">
      <img src="${escapeHtml(t.image || '/images/about-default.svg')}" alt="${escapeHtml(t.name)}">
      <h4>${escapeHtml(t.name)}</h4>
      ${t.role ? `<div class="team-role">${escapeHtml(t.role)}</div>` : ''}
      ${t.bio ? `<p class="team-bio">${escapeHtml(t.bio)}</p>` : ''}
    </div>`
    )
    .join('');
}

(async function init() {
  try {
    const [settings, team] = await Promise.all([
      loadSettings(),
      fetch('/api/team').then((r) => (r.ok ? r.json() : []))
    ]);
    renderChrome(settings);
    renderAboutContent(settings);
    renderTeam(team);
    const programsRes = await fetch('/api/programs');
    if (programsRes.ok) renderFooterPrograms(await programsRes.json());
  } catch (err) {
    console.error(err);
  }
  initFloatingStats();
})();
