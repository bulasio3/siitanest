function getProgramIdFromQuery() {
  return new URLSearchParams(window.location.search).get('id');
}

function renderProgram(program) {
  document.getElementById('program-loading').style.display = 'none';

  if (!program) {
    document.getElementById('program-content').innerHTML = `
      <div class="container" style="max-width:600px; text-align:center; padding:60px 0;">
        <h1 style="font-family:var(--font-display); font-size:28px; margin-bottom:12px;">Program not found</h1>
        <p style="color:var(--ink-600); margin-bottom:20px;">This program may have been removed or renamed.</p>
        <a href="/#programs" class="btn btn-primary">&larr; Back to Programs</a>
      </div>`;
    return;
  }

  document.title = `${program.title} — Siitanest Mother's Love Home`;
  document.getElementById('program-body').style.display = 'block';
  document.getElementById('program-icon-lg').className = `program-icon-lg ${program.color || 'green'}`;
  document.getElementById('program-icon-lg').innerHTML = PROGRAM_ICONS[program.icon] || PROGRAM_ICONS['heart-pulse'];
  document.getElementById('program-title').textContent = program.title;

  const details = program.details || program.summary || '';
  document.getElementById('program-details').textContent = details;

  if (program.image) {
    const img = document.getElementById('program-image');
    img.src = program.image;
    img.alt = program.title;
    img.style.display = 'block';
  }

  const list = document.getElementById('program-bullets-list');
  const bullets = program.bullets || [];
  if (bullets.length) {
    list.innerHTML = bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('');
  } else {
    document.getElementById('program-bullets-list').parentElement.style.display = 'none';
  }
}

(async function init() {
  const id = getProgramIdFromQuery();
  try {
    const [settings, programs] = await Promise.all([
      loadSettings(),
      fetch('/api/programs').then((r) => (r.ok ? r.json() : []))
    ]);
    renderChrome(settings);
    const program = programs.find((p) => p.id === id);
    renderProgram(program);
    renderFooterPrograms(programs);
  } catch (err) {
    console.error(err);
    document.getElementById('program-loading').textContent = 'Something went wrong loading this program.';
  }
  initFloatingStats();
})();
