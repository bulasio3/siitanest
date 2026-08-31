function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}
window.copyToClipboard = copyToClipboard;

function renderDonateMethods(settings) {
  const el = document.getElementById('donate-methods');
  const methods = [];

  if (settings.mtnNumber) {
    methods.push(`
      <div class="donate-method">
        <h3><span class="method-icon">M</span> MTN Mobile Money</h3>
        <div class="donate-row">
          <div><div class="label">Number</div><div class="value">${escapeHtml(settings.mtnNumber)}</div></div>
          <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(settings.mtnNumber)}', this)">Copy</button>
        </div>
        ${settings.mtnName ? `<div class="donate-row"><div><div class="label">Registered Name</div><div class="value">${escapeHtml(settings.mtnName)}</div></div></div>` : ''}
      </div>`);
  }

  if (settings.airtelNumber) {
    methods.push(`
      <div class="donate-method">
        <h3><span class="method-icon">A</span> Airtel Money</h3>
        <div class="donate-row">
          <div><div class="label">Number</div><div class="value">${escapeHtml(settings.airtelNumber)}</div></div>
          <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(settings.airtelNumber)}', this)">Copy</button>
        </div>
        ${settings.airtelName ? `<div class="donate-row"><div><div class="label">Registered Name</div><div class="value">${escapeHtml(settings.airtelName)}</div></div></div>` : ''}
      </div>`);
  }

  if (settings.bankName || settings.bankAccountNumber) {
    methods.push(`
      <div class="donate-method">
        <h3><span class="method-icon">&#127974;</span> Bank Transfer</h3>
        ${settings.bankName ? `<div class="donate-row"><div><div class="label">Bank</div><div class="value">${escapeHtml(settings.bankName)}</div></div></div>` : ''}
        ${settings.bankAccountName ? `<div class="donate-row"><div><div class="label">Account Name</div><div class="value">${escapeHtml(settings.bankAccountName)}</div></div></div>` : ''}
        ${settings.bankAccountNumber ? `
          <div class="donate-row">
            <div><div class="label">Account Number</div><div class="value">${escapeHtml(settings.bankAccountNumber)}</div></div>
            <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(settings.bankAccountNumber)}', this)">Copy</button>
          </div>` : ''}
        ${settings.bankBranch ? `<div class="donate-row"><div><div class="label">Branch</div><div class="value">${escapeHtml(settings.bankBranch)}</div></div></div>` : ''}
        ${settings.bankSwiftCode ? `
          <div class="donate-row">
            <div><div class="label">SWIFT / BIC Code</div><div class="value">${escapeHtml(settings.bankSwiftCode)}</div></div>
            <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(settings.bankSwiftCode)}', this)">Copy</button>
          </div>` : ''}
      </div>`);
  }

  if (settings.donateUrl && settings.donateUrl !== '#donate') {
    methods.push(`
      <div class="donate-method">
        <h3><span class="method-icon">&#128279;</span> Online</h3>
        <p style="margin-bottom:14px; color:var(--ink-600); font-size:14px;">Give online through our donation partner.</p>
        <a href="${escapeHtml(settings.donateUrl)}" target="_blank" rel="noopener" class="btn btn-primary">Go to Donation Page &rarr;</a>
      </div>`);
  }

  if (!methods.length) {
    el.innerHTML = `<div class="donate-method"><p style="color:var(--ink-600);">Donation details will appear here once added in the admin panel. In the meantime, please <a href="/get-involved.html">get in touch</a> and we'll be glad to help you contribute.</p></div>`;
  } else {
    el.innerHTML = methods.join('');
  }
}

(async function init() {
  try {
    const settings = await loadSettings();
    renderChrome(settings);
    if (settings.donateNote) {
      document.getElementById('donate-note').textContent = settings.donateNote;
    }
    renderDonateMethods(settings);

    const programsRes = await fetch('/api/programs');
    if (programsRes.ok) renderFooterPrograms(await programsRes.json());
  } catch (err) {
    console.error(err);
  }

  initFloatingStats();
  document.getElementById('donation-form').addEventListener('submit', handleDonationFormSubmit);
})();

function showDonationFormStatus(message, isError) {
  const el = document.getElementById('donation-form-status');
  el.className = isError ? 'form-error' : 'form-success';
  el.textContent = message;
}

async function handleDonationFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('donation-form-submit');
  const statusEl = document.getElementById('donation-form-status');
  statusEl.className = '';
  statusEl.textContent = '';

  const amount = form.amount.value.trim();
  const method = form.method.value;
  const extraMessage = form.message.value.trim();
  const combinedMessage = [
    `Donation notification — Amount: ${amount || 'not specified'}, Method: ${method}`,
    extraMessage ? `Note: ${extraMessage}` : ''
  ].filter(Boolean).join('\n');

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    type: 'Donation',
    message: combinedMessage,
    website: form.website.value // honeypot
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  try {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    form.reset();
    showDonationFormStatus("Thank you so much! We've received your notification and will follow up to confirm and thank you personally.", false);
  } catch (err) {
    showDonationFormStatus(err.message, true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '&#10084; I&#39;ve Made My Donation';
  }
}
