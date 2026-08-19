// Tiny JSON persistence layer. All state lives in data/state.json so the
// whole holding company survives restarts. No DB dependency by design.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

const defaults = () => ({
  companies: [],   // portfolio
  tasks: [],       // every unit of agent work, across all companies
  messages: [],    // agent ↔ human chat, across all companies
  autopilot: false,
  stats: { tasksCompleted: 0, companiesFounded: 0 },
});

let state = defaults();

function load() {
  try {
    state = { ...defaults(), ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
  } catch {
    state = defaults();
  }
  return state;
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }, 150);
}

function get() {
  return state;
}

module.exports = { load, save, get };
