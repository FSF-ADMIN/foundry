const express = require('express');
const path = require('path');
const config = require('./config');
const store = require('./core/store');
const orch = require('./core/orchestrator');
const rfs = require('./core/rfs');
const jupiter = require('./core/jupiter');

store.load();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Every portfolio company's shipped site is hosted right here
app.use('/portfolio', express.static(orch.COMPANIES_DIR));

app.get('/api/state', (req, res) => {
  const state = store.get();
  res.json({
    mode: config.MOCK_MODE ? 'mock' : 'live',
    model: config.MODEL,
    jupiter: jupiter.getStatus(),
    autopilot: state.autopilot,
    stats: state.stats,
    rfs: rfs.RFS.map((r) => ({ id: r.id, title: r.title, author: r.author, summary: r.summary })),
    companies: state.companies,
    tasks: state.tasks.slice(0, 120),
    messages: state.messages.slice(0, 60),
  });
});

// Found a company: an idea, an RFS pick, or both (idea empty → auto-concept from RFS)
app.post('/api/companies', (req, res) => {
  const { idea = '', rfsId = null } = req.body || {};
  if (!idea.trim() && !rfsId) return res.status(400).json({ error: 'Provide an idea, an RFS pick, or both' });
  if (rfsId && !rfs.byId(rfsId)) return res.status(400).json({ error: 'Unknown RFS id' });
  res.json(orch.spawnCompany({ idea, rfsId }));
});

// Human → company chat (CEO replies)
app.post('/api/chat', (req, res) => {
  const { companyId, text = '' } = req.body || {};
  if (!companyId || !text.trim()) return res.status(400).json({ error: 'companyId and text required' });
  const company = orch.userMessage(companyId, text.trim());
  if (!company) return res.status(404).json({ error: 'Unknown company' });
  res.json({ ok: true });
});

// Mark an integration connected / needed
app.post('/api/integrations', (req, res) => {
  const { companyId, name, status } = req.body || {};
  const integ = orch.setIntegrationStatus(companyId, name, status);
  if (!integ) return res.status(404).json({ error: 'Unknown company or integration' });
  res.json(integ);
});

// ---- individual business dashboards ----
app.get('/company/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'company.html'));
});

app.get('/api/companies/:id', (req, res) => {
  const state = store.get();
  const company = state.companies.find((c) => c.id === req.params.id || c.slug === req.params.id);
  if (!company) return res.status(404).json({ error: 'Unknown company' });
  res.json({
    mode: config.MOCK_MODE ? 'mock' : 'live',
    jupiter: jupiter.getStatus(),
    autopilot: state.autopilot,
    rfs: rfs.RFS.map((r) => ({ id: r.id, title: r.title, author: r.author, summary: r.summary })),
    company,
    tasks: state.tasks.filter((t) => t.companyId === company.id).slice(0, 60),
    messages: state.messages.filter((m) => m.companyId === company.id).slice(0, 60),
  });
});

// Founder skips the CEO's discovery questions — build proceeds on the pitch alone
app.post('/api/companies/:id/skip-discovery', (req, res) => {
  const company = orch.skipDiscovery(req.params.id);
  if (!company) return res.status(404).json({ error: 'Unknown company or not in discovery' });
  res.json({ ok: true });
});

app.post('/api/companies/:id/pause', (req, res) => {
  const company = orch.setPaused(req.params.id, !!(req.body && req.body.paused));
  if (!company) return res.status(404).json({ error: 'Unknown company (or passed)' });
  res.json({ status: company.status });
});

app.post('/api/companies/:id/work', (req, res) => {
  const company = orch.requestWork(req.params.id, req.body && req.body.execKey);
  if (!company) return res.status(404).json({ error: 'Unknown company or exec not hired yet' });
  res.json({ ok: true });
});

app.post('/api/tick', async (req, res) => {
  res.json(await orch.tick());
});

app.post('/api/autopilot', (req, res) => {
  const state = store.get();
  state.autopilot = !!(req.body && req.body.on);
  store.save();
  res.json({ autopilot: state.autopilot });
});

setInterval(() => {
  if (store.get().autopilot) orch.tick();
}, config.TICK_MS);

app.listen(config.PORT, () => {
  console.log(`Foundry holding company live on http://localhost:${config.PORT} [${config.MOCK_MODE ? 'MOCK' : 'LIVE'} mode, model ${config.MODEL}]`);
});
