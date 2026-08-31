const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const mongo = require('./mongo');

const DEFAULT_PATH = path.join(__dirname, '..', 'data', 'db.default.json');
const defaultData = JSON.parse(fs.readFileSync(DEFAULT_PATH, 'utf-8'));

let db;
let ready;

if (mongo.isEnabled()) {
  // ---- MongoDB-backed mode ----
  // Keeps content in memory for fast synchronous reads/writes (via lowdb's
  // chain API, unchanged everywhere else in the app), and mirrors every
  // write to MongoDB in the background so content survives restarts on
  // hosts with ephemeral disks (e.g. Render's free tier).
  class MongoBackedAdapter {
    constructor(initialData) {
      this._data = initialData;
      this._persistEnabled = false; // don't push to Mongo until initial hydration finishes
    }
    read() {
      return this._data;
    }
    write(data) {
      this._data = data;
      if (!this._persistEnabled) return;
      mongo
        .getCollection()
        .then((collection) => collection.replaceOne({ _id: 'content' }, { _id: 'content', ...data }, { upsert: true }))
        .catch((err) => console.error('MongoDB save failed (this change was not saved permanently):', err.message));
    }
  }

  const adapter = new MongoBackedAdapter(defaultData);
  db = low(adapter);
  db.defaults(defaultData).write();

  ready = (async () => {
    try {
      const collection = await mongo.getCollection();
      const existing = await collection.findOne({ _id: 'content' });
      if (existing) {
        delete existing._id;
        db.setState(existing).write();
        // Fill in any *top-level* keys that didn't exist yet (e.g. a whole
        // new collection like "inquiries") — this alone won't reach inside
        // "settings", since that key already exists as an object.
        db.defaults(defaultData).write();
        // Settings is a flat key/value object that keeps growing new fields
        // over time (e.g. adding a "poBox" or "bankSwiftCode" field later).
        // Explicitly merge those in too, without touching anything already
        // saved, so new fields don't silently stay undefined on sites whose
        // settings already existed before that field was introduced.
        db.set('settings', { ...defaultData.settings, ...db.get('settings').value() }).write();
        console.log('Loaded site content from MongoDB.');
      } else {
        await collection.insertOne({ _id: 'content', ...defaultData });
        console.log('No existing content found in MongoDB — saved the starting defaults there.');
      }
      adapter._persistEnabled = true;
    } catch (err) {
      console.error(
        'Could not connect to MongoDB. The site will run on temporary in-memory content ' +
        'until this is fixed — changes will NOT be saved permanently. Error:',
        err.message
      );
    }
  })();
} else {
  // ---- Local file mode (default for local development, no database needed) ----
  const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
  if (!fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DEFAULT_PATH, DB_PATH);
  }
  const adapter = new FileSync(DB_PATH);
  db = low(adapter);
  db.defaults(defaultData).write();
  db.set('settings', { ...defaultData.settings, ...db.get('settings').value() }).write();
  ready = Promise.resolve();
}

module.exports = db;
module.exports.ready = ready;
