const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Single combined payload the public homepage fetches on load.
router.get('/site-data', (req, res) => {
  const data = db.getState();
  res.json({
    settings: data.settings,
    stats: data.stats,
    programs: data.programs,
    gallery: data.gallery,
    stories: (data.stories || []).filter((s) => s.published !== false),
    news: (data.news || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  });
});

router.get('/settings', (req, res) => res.json(db.get('settings').value()));
router.get('/stats', (req, res) => res.json(db.get('stats').value()));
router.get('/programs', (req, res) => res.json(db.get('programs').value()));
router.get('/gallery', (req, res) => res.json(db.get('gallery').value()));
router.get('/team', (req, res) => res.json(db.get('team').value()));
router.get('/stories', (req, res) =>
  res.json(db.get('stories').filter((s) => s.published !== false).value())
);
router.get('/news', (req, res) => res.json(db.get('news').value()));

// ---------- Public inquiry form (Volunteer / Partner With Us / general contact) ----------
router.post('/inquiries', express.json(), (req, res) => {
  const { name, email, phone, type, message, website } = req.body || {};

  // Simple honeypot: a hidden field named "website" that real visitors never
  // fill in — if it has a value, silently pretend success and drop it.
  if (website) return res.json({ ok: true });

  if (!name || !name.trim()) return res.status(400).json({ error: 'Please enter your name.' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'Please enter your email.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Please enter a message.' });
  if (name.length > 200 || email.length > 200 || message.length > 5000) {
    return res.status(400).json({ error: 'One of the fields is too long.' });
  }

  const crypto = require('crypto');
  const item = {
    id: `inquiries-${crypto.randomBytes(6).toString('hex')}`,
    createdAt: new Date().toISOString(),
    read: false,
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    type: type || 'General',
    message: message.trim()
  };
  db.get('inquiries').push(item).write();
  res.status(201).json({ ok: true });
});

module.exports = router;
