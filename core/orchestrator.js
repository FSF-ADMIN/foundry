// The holding company brain. Spawns companies (each born with a lone CEO
// agent), runs tasks, applies results — which is how the org assembles
// itself: the CEO's hire-exec tasks create the C-suite, and execs' later
// hire-subagent tasks grow the tree further. Also owns the integrations
// ledger and the agent↔human chat.

const fs = require('fs');
const path = require('path');
const config = require('../config');
const store = require('./store');
const llm = require('./llm');
const { HOLDCO, PERSONAS } = require('./roles');
const pipeline = require('./pipeline');
const rfsCatalog = require('./rfs');

const COMPANIES_DIR = path.join(__dirname, '..', 'companies');

let idCounter = Date.now();
const newId = (p) => `${p}_${(idCounter++).toString(36)}`;
const now = () => new Date().toISOString();

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'venture';

// ---- org tree ---------------------------------------------------------------

function newAgent(key, title, extra = {}) {
  const persona = PERSONAS[key] || PERSONAS.sub;
  return {
    id: newId('agent'),
    key,                            // ceo | cmo | coo | cfo | cto | sub
    title: title || persona.title,
    emoji: persona.emoji,
    name: extra.name || null,
    charter: extra.charter || null,
    hiredBy: extra.hiredBy || null, // agent id of the hiring manager
    reports: [],
    hiredAt: now(),
  };
}

function findAgent(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const r of node.reports || []) {
    const hit = findAgent(r, id);
    if (hit) return hit;
  }
  return null;
}

function findByKey(node, key) {
  if (!node) return null;
  if (node.key === key) return node;
  for (const r of node.reports || []) {
    const hit = findByKey(r, key);
    if (hit) return hit;
  }
  return null;
}

function countSubs(node) {
  if (!node) return 0;
  let n = node.key === 'sub' ? 1 : 0;
  for (const r of node.reports || []) n += countSubs(r);
  return n;
}

// All dev agents in hire order. Dev #1 is the lead (site), dev #2 the product
// engineer (product) — matching how hire-devteam assigns their first tasks.
function findDevs(node, out = []) {
  if (!node) return out;
  if (node.key === 'dev') out.push(node);
  for (const r of node.reports || []) findDevs(r, out);
  return out;
}

function productDevFor(company) {
  const devs = findDevs(company.org);
  return devs.find((d) => /product/i.test(d.title)) || devs[1] || devs[0] || null;
}

function agentFor(company, task) {
  if (task.agentKey === 'analyst') return { id: 'holdco-analyst', ...HOLDCO.analyst, key: 'analyst' };
  if (task.agentId) return findAgent(company.org, task.agentId);
  return findByKey(company.org, task.agentKey);
}

function systemPromptFor(agent) {
  if (agent.key === 'analyst') return HOLDCO.analyst.systemPrompt;
  const persona = PERSONAS[agent.key] || PERSONAS.sub;
  let sys = persona.systemPrompt;
  if (agent.key === 'sub' || agent.key === 'dev') sys += ` Your title is ${agent.title}.` + (agent.charter ? ` Your charter: ${agent.charter}` : '');
  return sys;
}

// ---- chat + integrations ----------------------------------------------------

function postChat(company, { from, agent, kind, text }) {
  store.get().messages.unshift({
    id: newId('msg'),
    companyId: company.id,
    from,                                  // 'agent' | 'user'
    agentTitle: agent ? `${agent.title}${agent.name ? ' ' + agent.name : ''}` : null,
    agentEmoji: agent ? agent.emoji : null,
    kind: kind || 'info',                  // 'question' | 'info' | 'reply' | 'user'
    text,
    at: now(),
  });
  store.get().messages = store.get().messages.slice(0, 200);
}

function addIntegrations(company, list, requestedBy) {
  for (const item of list || []) {
    if (!item || !item.name) continue;
    const existing = company.integrations.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
    if (existing) continue;
    company.integrations.push({
      name: item.name,
      purpose: item.purpose || '',
      requestedBy,
      status: 'needed',
      addedAt: now(),
    });
  }
}

// ---- lifecycle ---------------------------------------------------------------

function spawnCompany({ idea, rfsId }) {
  const state = store.get();
  const r = rfsId ? rfsCatalog.byId(rfsId) : null;
  const finalIdea = (idea || '').trim() || (r ? `Auto-concept from RFS: ${r.title}` : '');
  const company = {
    id: newId('co'),
    idea: finalIdea,
    rfsId: r ? r.id : null,
    name: null,
    slug: null,
    status: 'active',            // active | passed
    stage: 'ideation',
    brief: null,
    validation: null,
    launchPlan: null,
    siteUrl: null,
    org: newAgent('ceo', 'CEO'),
    integrations: [],
    humanNotes: [],
    opsLog: [],
    opsCount: 0,
    createdAt: now(),
  };
  state.companies.unshift(company);
  state.stats.companiesFounded++;
  enqueueStageTasks(company);
  store.save();
  return company;
}

function enqueueTask(company, t) {
  store.get().tasks.unshift({
    id: newId('task'),
    companyId: company.id,
    type: t.type,
    agentKey: t.agentKey,
    agentId: t.agentId || null,
    label: t.label,
    meta: t.meta || {},
    status: 'pending',
    output: null,
    error: null,
    createdAt: now(),
    completedAt: null,
  });
}

function enqueueStageTasks(company) {
  for (const t of pipeline.tasksForStage(company.stage)) enqueueTask(company, t);
}

function companyTasks(company) {
  return store.get().tasks.filter((t) => t.companyId === company.id);
}

async function runTask(task, company) {
  const agent = agentFor(company, task);
  if (!agent) {
    task.status = 'failed';
    task.error = `No agent for key ${task.agentKey}`;
    return;
  }
  task.status = 'running';
  store.save();
  try {
    const isBuild = task.type === 'build-site' || task.type === 'site-update';
    const raw = await llm.complete({
      system: systemPromptFor(agent),
      prompt: pipeline.promptFor(task, company),
      taskType: task.type,
      company,
      task,
      agent,
      maxTokens: isBuild ? config.BUILD_MAX_TOKENS : undefined,
    });
    applyResult(task, company, raw, agent);
    task.status = 'done';
    task.completedAt = now();
    store.get().stats.tasksCompleted++;
  } catch (err) {
    task.status = 'failed';
    task.error = String(err.message || err).slice(0, 500);
  }
  store.save();
}

function applyResult(task, company, raw, agent) {
  switch (task.type) {
    case 'draft-brief': {
      const brief = llm.parseJson(raw) || { name: 'Unnamed Venture', tagline: company.idea, rfsId: company.rfsId };
      company.brief = brief;
      company.name = brief.name || 'Unnamed Venture';
      company.slug = slugify(company.name);
      if (brief.rfsId && rfsCatalog.byId(brief.rfsId)) company.rfsId = brief.rfsId;
      task.output = brief;
      break;
    }
    case 'validate': {
      const v = llm.parseJson(raw) || { score: 50, verdict: 'fund' };
      company.validation = v;
      task.output = v;
      if (v.verdict === 'pass') {
        company.status = 'passed';
        postChat(company, {
          from: 'agent',
          agent: { title: 'Investment Analyst', emoji: '📊' },
          kind: 'info',
          text: `Passed on ${company.name || 'this concept'}: ${v.fitReason || 'off-thesis'}. Foundry only funds current YC RFS fits.`,
        });
      }
      break;
    }
    case 'hire-exec': {
      const out = llm.parseJson(raw) || {};
      const key = task.meta.execKey;
      const exec = newAgent(key, undefined, {
        name: out.name,
        charter: out.charter,
        hiredBy: company.org.id,
      });
      company.org.reports.push(exec);
      addIntegrations(company, out.integrations, exec.title);
      for (const q of out.questionsForHuman || []) {
        postChat(company, { from: 'agent', agent: exec, kind: 'question', text: q });
      }
      task.output = out;
      break;
    }
    case 'hire-devteam': {
      const out = llm.parseJson(raw) || { devs: [{ title: 'Lead Frontend Engineer' }, { title: 'Product Engineer' }] };
      const devs = (out.devs || []).slice(0, 2);
      const hired = [];
      for (const d of devs) {
        const dev = newAgent('dev', d.title || 'Software Developer', {
          name: d.name,
          charter: `Builds and continuously improves ${company.name || 'the company'}'s interactive website and product surface.`,
          hiredBy: agent.id,
        });
        agent.reports.push(dev);
        hired.push(dev);
      }
      postChat(company, {
        from: 'agent',
        agent,
        kind: 'info',
        text: `Hired the dev team (${devs.map((d) => `${d.title}${d.name ? ' ' + d.name : ''}`).join(', ')}). ${out.note || 'Shipping the site and the product next.'}`,
      });
      // Lead ships the marketing site; the product engineer builds the actual product.
      const [lead, productDev] = [hired[0], hired[1] || hired[0]];
      if (lead) {
        enqueueTask(company, {
          type: 'build-site',
          agentKey: 'dev',
          agentId: lead.id,
          label: `${lead.title} builds the interactive site`,
        });
      }
      if (productDev) {
        enqueueTask(company, {
          type: 'build-product',
          agentKey: 'dev',
          agentId: productDev.id,
          label: `${productDev.title} builds the working product MVP`,
        });
      }
      task.output = out;
      break;
    }
    case 'build-site':
    case 'site-update': {
      let html = String(raw).trim();
      const fence = html.match(/```(?:html)?\s*([\s\S]*?)```/);
      if (fence) html = fence[1].trim();
      // Multi-page convention: first document is index.html; every further
      // page is preceded by a `<!-- PAGE: name.html -->` marker line
      const parts = html.split(/<!--\s*PAGE:\s*([\w.-]+)\s*-->/);
      const files = { 'index.html': parts[0].trim() };
      for (let i = 1; i + 1 < parts.length; i += 2) {
        const fname = parts[i].replace(/[^\w.-]/g, '');
        if (fname.endsWith('.html')) files[fname] = parts[i + 1].trim();
      }
      const dir = path.join(COMPANIES_DIR, company.slug || company.id);
      fs.mkdirSync(dir, { recursive: true });
      for (const [fname, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(dir, fname), content);
      }
      company.siteUrl = `/portfolio/${company.slug || company.id}/`;
      company.siteVersion = (company.siteVersion || 0) + 1;
      company.sitePages = Object.keys(files);
      task.output = { deployed: company.siteUrl, version: company.siteVersion, pages: Object.keys(files), bytes: html.length };
      if (task.type === 'site-update') {
        company.opsLog.unshift({ type: 'site-update', by: agent.title, at: now(), result: { deliverable: `Shipped site v${company.siteVersion}` } });
        company.opsCount++;
      }
      break;
    }
    case 'build-product':
    case 'product-update': {
      let html = String(raw).trim();
      const fence = html.match(/```(?:html)?\s*([\s\S]*?)```/);
      if (fence) html = fence[1].trim();
      const shipped = (html.match(/<!--\s*SHIPPED:\s*([\s\S]*?)-->/) || [])[1]?.trim() ||
        (task.type === 'build-product' ? 'Initial product MVP' : 'Product iteration');
      const dir = path.join(COMPANIES_DIR, company.slug || company.id, 'app');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
      company.productUrl = `/portfolio/${company.slug || company.id}/app/`;
      company.productVersion = (company.productVersion || 0) + 1;
      company.productLog = [...(company.productLog || []), shipped].slice(-12);
      task.output = { deployed: company.productUrl, version: company.productVersion, shipped, bytes: html.length };
      if (task.type === 'build-product') {
        postChat(company, {
          from: 'agent',
          agent,
          kind: 'info',
          text: `Shipped ${company.name || 'the'} product v1 — a working app, live now at ${company.productUrl}. ${shipped}`,
        });
      } else {
        company.opsLog.unshift({ type: 'product-update', by: agent.title, at: now(), result: { deliverable: `Shipped product v${company.productVersion}: ${shipped}` } });
        company.opsCount++;
      }
      break;
    }
    case 'launch-plan': {
      company.launchPlan = llm.parseJson(raw) || { raw };
      task.output = company.launchPlan;
      break;
    }
    case 'hire-subagent': {
      const out = llm.parseJson(raw) || { title: 'Specialist' };
      const sub = newAgent('sub', out.title, { name: out.name, charter: out.charter, hiredBy: agent.id });
      agent.reports.push(sub);
      addIntegrations(company, out.integrations, `${agent.title} → ${sub.title}`);
      postChat(company, {
        from: 'agent',
        agent,
        kind: 'info',
        text: `Hired ${sub.title}${sub.name ? ` (${sub.name})` : ''}: ${out.firstTask || out.charter || 'specialist support.'}`,
      });
      company.opsLog.unshift({ type: 'hire-subagent', by: agent.title, at: now(), result: out });
      task.output = out;
      break;
    }
    case 'chat-reply': {
      const out = llm.parseJson(raw) || { reply: String(raw).slice(0, 300) };
      postChat(company, { from: 'agent', agent, kind: 'reply', text: out.reply });
      task.output = out;
      break;
    }
    default: {
      // recurring ops output → ops log (+ escalate any human ask to chat)
      const parsed = llm.parseJson(raw) || { raw: String(raw).slice(0, 400) };
      task.output = parsed;
      company.opsLog.unshift({ type: task.type, by: agent.title, at: now(), result: parsed });
      company.opsLog = company.opsLog.slice(0, 30);
      company.opsCount++;
      const ask = parsed.needsFromHuman;
      if (ask && typeof ask === 'string') {
        postChat(company, { from: 'agent', agent, kind: 'question', text: ask });
      }
      break;
    }
  }
}

// Build the live ops rotation: the 4 execs' recurring work + each sub-agent's
function opsRotation(company) {
  const rotation = [];
  for (const slot of pipeline.OPS_ROTATION) {
    const exec = findByKey(company.org, slot.agentKey);
    if (exec) rotation.push({ type: slot.type, agentKey: slot.agentKey, agentId: exec.id, label: slot.label });
  }
  let devIndex = 0;
  for (const exec of company.org.reports || []) {
    for (const sub of exec.reports || []) {
      if (sub.key === 'dev' && devIndex < 2) {
        // Dev #1 (lead) ships site iterations; dev #2 (product engineer)
        // ships real product iterations.
        const isLead = devIndex === 0;
        devIndex++;
        rotation.push(isLead
          ? { type: 'site-update', agentKey: 'dev', agentId: sub.id, label: `${sub.title}: ship site update` }
          : { type: 'product-update', agentKey: 'dev', agentId: sub.id, label: `${sub.title}: ship product update` });
        continue;
      }
      rotation.push({
        type: 'subagent-work',
        agentKey: sub.key,
        agentId: sub.id,
        label: `${sub.title}: execute charter`,
        meta: { charter: sub.charter, firstTask: sub.charter },
      });
    }
  }
  return rotation;
}

function maybeAdvance(company) {
  if (company.status !== 'active') return;
  const tasks = companyTasks(company);
  if (tasks.some((t) => t.status === 'pending' || t.status === 'running')) return;

  if (company.stage === 'operate') {
    // Retrofit: operating companies founded before the dev-team era hire one
    // now (the CTO's hire enqueues an interactive site rebuild automatically)
    const hasDev = !!(company.org.reports || []).some((e) => (e.reports || []).some((s) => s.key === 'dev'));
    if (!hasDev && !tasks.some((t) => t.type === 'hire-devteam')) {
      const cto = findByKey(company.org, 'cto');
      if (cto) {
        enqueueTask(company, { type: 'hire-devteam', agentKey: 'cto', agentId: cto.id, label: 'CTO hires the dev team' });
        return;
      }
    }
    // Retrofit: companies from before the product era get their working MVP
    // built by the product engineer now
    if (hasDev && !company.productUrl && !tasks.some((t) => t.type === 'build-product')) {
      const dev = productDevFor(company);
      if (dev) {
        enqueueTask(company, {
          type: 'build-product',
          agentKey: 'dev',
          agentId: dev.id,
          label: `${dev.title} builds the working product MVP`,
        });
        return;
      }
    }
    if (company.opsCount >= config.MAX_OPS_TASKS) return;
    // Every HIRE_EVERY ops tasks, the next exec in line hires a sub-agent
    const subs = countSubs(company.org);
    if (company.opsCount > 0 && company.opsCount % pipeline.HIRE_EVERY === 0 &&
        subs < pipeline.MAX_SUBAGENTS && !tasks.some((t) => t.type === 'hire-subagent' && t.status === 'done' && t.meta.atCount === company.opsCount)) {
      const execKeys = ['cmo', 'coo', 'cfo', 'cto'];
      const key = execKeys[subs % execKeys.length];
      const exec = findByKey(company.org, key);
      if (exec) {
        enqueueTask(company, {
          type: 'hire-subagent',
          agentKey: key,
          agentId: exec.id,
          label: `${exec.title} hires a specialist`,
          meta: { execKey: key, atCount: company.opsCount },
        });
        return;
      }
    }
    const rotation = opsRotation(company);
    if (!rotation.length) return;
    const next = rotation[company.opsCount % rotation.length];
    enqueueTask(company, next);
    return;
  }

  const stageDone = tasks
    .filter((t) => pipeline.tasksForStage(company.stage).some((s) => s.type === t.type))
    .every((t) => t.status === 'done');
  if (!stageDone) return;
  // build stage isn't done until the dev team has shipped BOTH the site and
  // the actual working product
  if (company.stage === 'build' && (!company.siteUrl || !company.productUrl)) return;

  company.stage = pipeline.nextStage(company.stage);
  enqueueStageTasks(company);
}

// User sent a chat message aimed at a company → record as guidance + CEO replies
function userMessage(companyId, text) {
  const state = store.get();
  const company = state.companies.find((c) => c.id === companyId);
  if (!company) return null;
  postChat(company, { from: 'user', kind: 'user', text });
  company.humanNotes.unshift({ text, at: now() });
  company.humanNotes = company.humanNotes.slice(0, 10);
  const history = state.messages
    .filter((m) => m.companyId === company.id).slice(0, 6).reverse()
    .map((m) => `${m.from === 'user' ? 'Human' : m.agentTitle}: ${m.text}`).join('\n');
  enqueueTask(company, {
    type: 'chat-reply',
    agentKey: 'ceo',
    agentId: company.org.id,
    label: 'CEO replies in chat',
    meta: { userText: text, history },
  });
  store.save();
  return company;
}

// Per-company ops controls (used by the individual business dashboards)
function setPaused(companyId, paused) {
  const company = store.get().companies.find((c) => c.id === companyId);
  if (!company || company.status === 'passed') return null;
  company.status = paused ? 'paused' : 'active';
  store.save();
  return company;
}

// Human demands work from a specific exec right now (skips the rotation).
// execKey 'dev' asks the lead developer to ship a site update immediately;
// execKey 'product' asks the product engineer to ship a product update.
function requestWork(companyId, execKey) {
  const company = store.get().companies.find((c) => c.id === companyId);
  if (!company) return null;
  if (execKey === 'dev') {
    const dev = findByKey(company.org, 'dev');
    if (!dev) return null;
    enqueueTask(company, {
      type: 'site-update',
      agentKey: 'dev',
      agentId: dev.id,
      label: `${dev.title}: ship site update (requested by human)`,
    });
    store.save();
    return company;
  }
  if (execKey === 'product') {
    const dev = productDevFor(company);
    if (!dev) return null;
    enqueueTask(company, {
      type: company.productUrl ? 'product-update' : 'build-product',
      agentKey: 'dev',
      agentId: dev.id,
      label: `${dev.title}: ship product ${company.productUrl ? 'update' : 'MVP'} (requested by human)`,
    });
    store.save();
    return company;
  }
  const slot = pipeline.OPS_ROTATION.find((s) => s.agentKey === execKey);
  const exec = findByKey(company.org, execKey);
  if (!slot || !exec) return null;
  enqueueTask(company, {
    type: slot.type,
    agentKey: execKey,
    agentId: exec.id,
    label: `${slot.label} (requested by human)`,
  });
  store.save();
  return company;
}

function setIntegrationStatus(companyId, name, status) {
  const company = store.get().companies.find((c) => c.id === companyId);
  if (!company) return null;
  const integ = company.integrations.find((i) => i.name === name);
  if (!integ) return null;
  integ.status = status === 'connected' ? 'connected' : 'needed';
  store.save();
  return integ;
}

let ticking = false;
async function tick() {
  if (ticking) return { skipped: true };
  ticking = true;
  try {
    const state = store.get();
    const paused = new Set(state.companies.filter((c) => c.status === 'paused').map((c) => c.id));
    const pending = state.tasks
      .filter((t) => t.status === 'pending' && !paused.has(t.companyId))
      .slice(0, config.TASKS_PER_TICK);
    await Promise.all(
      pending.map((task) => {
        const company = state.companies.find((c) => c.id === task.companyId);
        return company ? runTask(task, company) : Promise.resolve();
      })
    );
    for (const c of state.companies) maybeAdvance(c);
    store.save();
    return { ran: pending.length };
  } finally {
    ticking = false;
  }
}

module.exports = { spawnCompany, tick, userMessage, setIntegrationStatus, setPaused, requestWork, COMPANIES_DIR };
