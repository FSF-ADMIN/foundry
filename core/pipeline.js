// The genesis pipeline, now with a self-assembling org:
//
//   ideation ──► validation ──► team ──► build ──► operate (recurring)
//
//   ideation    CEO drafts an RFS-fitting company brief
//   validation  Holdco analyst: fund only if it clearly fits a current YC RFS
//   team        CEO hires their own CMO, COO, CFO, CTO — each hire declares
//               a charter, needed integrations, and questions for the human
//   build       CTO ships the landing page · CMO writes the launch plan
//   operate     Execs run recurring ops; every few cycles an exec hires a
//               sub-agent of their own, which then joins the ops rotation
//
// Prompts always carry: the YC RFS catalog, the company brief, the org chart,
// and the latest guidance the human gave in chat.

const rfs = require('./rfs');

const STAGES = ['ideation', 'validation', 'team', 'build', 'operate'];

const EXEC_HIRES = [
  { execKey: 'cmo', label: 'CEO hires a CMO' },
  { execKey: 'coo', label: 'CEO hires a COO' },
  { execKey: 'cfo', label: 'CEO hires a CFO' },
  { execKey: 'cto', label: 'CEO hires a CTO' },
];

// Recurring exec work once a company is live
const OPS_ROTATION = [
  { type: 'growth-experiment', agentKey: 'cmo', label: 'Design growth experiment' },
  { type: 'ops-review', agentKey: 'coo', label: 'Operations review' },
  { type: 'finance-report', agentKey: 'cfo', label: 'Produce finance snapshot' },
  { type: 'product-iteration', agentKey: 'cto', label: 'Plan product iteration' },
];

// Every Nth completed ops task, the next exec in line hires a sub-agent
const HIRE_EVERY = 3;
const MAX_SUBAGENTS = 4;

function tasksForStage(stage) {
  switch (stage) {
    case 'ideation':
      return [{ type: 'draft-brief', agentKey: 'ceo', label: 'Draft RFS-fitting company brief' }];
    case 'validation':
      return [{ type: 'validate', agentKey: 'analyst', label: 'RFS fit check & investment verdict' }];
    case 'team':
      return EXEC_HIRES.map((h) => ({ type: 'hire-exec', agentKey: 'ceo', label: h.label, meta: { execKey: h.execKey } }));
    case 'build':
      return [
        { type: 'hire-devteam', agentKey: 'cto', label: 'CTO hires the dev team' },
        { type: 'launch-plan', agentKey: 'cmo', label: 'Write launch plan' },
      ];
    case 'operate':
      return []; // generated one at a time by the orchestrator
    default:
      return [];
  }
}

// ---- shared prompt context -------------------------------------------------

function orgText(node, depth = 0) {
  if (!node) return '(org not assembled yet)';
  const pad = '  '.repeat(depth);
  let out = `${pad}- ${node.title}${node.name ? ` (${node.name})` : ''}`;
  for (const r of node.reports || []) out += '\n' + orgText(r, depth + 1);
  return out;
}

function context(company) {
  const r = company.rfsId ? rfs.byId(company.rfsId) : null;
  const notes = (company.humanNotes || []).slice(0, 3)
    .map((n) => `- ${n.text}`).join('\n') || '(none yet)';
  return (
    `COMPANY: ${company.name || '(unnamed)'}\n` +
    `IDEA: ${company.idea}\n` +
    (r ? `TARGET YC RFS: [${r.id}] ${r.title} — ${r.summary}\n` : '') +
    `BRIEF: ${company.brief ? JSON.stringify(company.brief) : '(none yet)'}\n` +
    `ORG CHART:\n${orgText(company.org)}\n` +
    `LATEST HUMAN GUIDANCE (from holding-company chat):\n${notes}`
  );
}

function promptFor(task, company) {
  const ctx = context(company);
  switch (task.type) {
    case 'draft-brief':
      return `${ctx}\n\nCURRENT YC REQUESTS FOR STARTUPS:\n${rfs.catalogText()}\n\n` +
        `You are founding this company. ${company.idea.startsWith('Auto-concept') ?
          'Invent a sharp company concept that squarely fits the TARGET YC RFS above.' :
          'Shape the idea into a company that squarely fits ONE of the RFS categories above (pick the best fit).'}\n` +
        `Return ONLY JSON with keys: name (2 words max, brandable), tagline (under 10 words), oneLiner, ` +
        `product (2-3 sentences), icp, revenueModel, pricing (e.g. "$29/mo"), rfsId (the [id] of the RFS it fits), ` +
        `rfsFitReason (1 sentence).`;
    case 'validate':
      return `${ctx}\n\nCURRENT YC REQUESTS FOR STARTUPS:\n${rfs.catalogText()}\n\n` +
        `Foundry ONLY funds companies that clearly fit one of these RFS categories. Judge this brief. ` +
        `Return ONLY JSON with keys: score (0-100), verdict ("fund" or "pass"), rfsId (best-fit id or null), ` +
        `fitReason, strengths (array of 3), risks (array of 3), recommendation (1-2 sentences). ` +
        `Verdict MUST be "pass" if the concept does not clearly fit an RFS, or cannot be operated by AI employees.`;
    case 'hire-exec': {
      const k = task.meta.execKey.toUpperCase();
      return `${ctx}\n\nYou are hiring your ${k}. Define the role for THIS company specifically. ` +
        `Return ONLY JSON with keys: name (a human-style first name for the agent), charter (2 sentences: what this ${k} owns here), ` +
        `integrations (array of {name, purpose} — the real third-party services/APIs this ${k} needs connected, 2-3 items), ` +
        `questionsForHuman (array of 1-2 short questions this ${k} needs the human operator to answer — credentials, budget, approvals, preferences).`;
    }
    case 'hire-devteam':
      return `${ctx}\n\nHire your development team: a Lead Frontend Engineer and a Product Engineer. ` +
        `Return ONLY JSON with keys: devs (array of exactly 2 objects {title, name (human-style first name)}), ` +
        `note (1 sentence on the build plan).`;
    case 'build-site':
    case 'site-update': {
      const themes = require('./themes');
      const art = themes.themeFor(company.slug || company.id);
      return `${ctx}\n\n${task.type === 'site-update' ?
          'Ship an improved iteration of the production website for this company.' :
          'Build the production website for this company.'} ` +
        `It must be a genuinely interactive, polished MULTI-PAGE product site — not a single landing page.\n\n` +
        `ART DIRECTION (commit to it fully; make this site visually unmistakable from sibling portfolio sites): ${art.hint}\n\n` +
        `HOUSE DESIGN RULES (non-negotiable): design like the sites people cite for great UI — Linear, Stripe, Notion, ` +
        `Vercel. NO gradient text, NO glowing orbs or blurred blobs, NO purple-teal-on-black duotones, NO emoji as ` +
        `icons or decoration. Restrained palette (one accent), real typographic hierarchy, hairline borders, ` +
        `generous whitespace.\n\n` +
        `PAGES (each a complete standalone HTML document sharing the same nav, styling, and footer):\n` +
        `- index.html — animated hero, live "AI org activity" ticker referencing the actual agents in the ORG CHART ` +
        `above, stats band with counters that animate up on scroll, 3 highlight cards, waitlist form (email → success ` +
        `state, persisted to localStorage)\n` +
        `- features.html — 6 feature cards with hover effects + a 3-step "how it works"\n` +
        `- demo.html — an INTERACTIVE demo relevant to the product (e.g. ROI calculator with range sliders that ` +
        `recompute live)\n` +
        `- pricing.html — working monthly/annual toggle (annual = 20% off, derived from BRIEF pricing)\n` +
        `- faq.html — accordion (4 items, click to expand) + waitlist form\n\n` +
        `Every page: sticky top nav linking all five pages with the CURRENT page highlighted, scroll-reveal animations ` +
        `via IntersectionObserver, fully responsive, inline CSS/JS only (no external assets), footer crediting ` +
        `"A Foundry portfolio company · founded, built & operated by AI".\n\n` +
        `OUTPUT FORMAT: return index.html first, then each additional page preceded by a marker line exactly like:\n` +
        `<!-- PAGE: features.html -->\n` +
        `No markdown fences, no commentary — just the documents and markers.`;
    }
    case 'launch-plan':
      return `${ctx}\n\nWrite the launch plan. Return ONLY JSON with keys: positioning, channels (array of 4), ` +
        `firstWeekTargets (object with signups, demos, payingCustomers), hook (one killer launch line).`;
    case 'hire-subagent': {
      return `${ctx}\n\nYou need leverage. Hire ONE specialist sub-agent who reports to you. ` +
        `Return ONLY JSON with keys: title (specific role title, e.g. "Content Lead" or "Onboarding Engineer"), ` +
        `name (human-style first name), charter (1-2 sentences), integrations (array of {name, purpose}, 0-2 items), ` +
        `firstTask (one sentence describing their first deliverable).`;
    }
    case 'growth-experiment':
      return `${ctx}\n\nDesign ONE new growth experiment. Return ONLY JSON with keys: experiment, channel, hypothesis, successMetric.`;
    case 'ops-review':
      return `${ctx}\n\nRun this period's operations review. Return ONLY JSON with keys: status (1 sentence), ` +
        `bottleneck, fix, toolingChange (or null).`;
    case 'finance-report':
      return `${ctx}\n\nProduce this period's finance snapshot for an AI-operated startup. Return ONLY JSON with keys: ` +
        `period, mrr, burn, runway, note, action.`;
    case 'product-iteration':
      return `${ctx}\n\nPlan the next product iteration. Return ONLY JSON with keys: shipping (1 sentence), why, ` +
        `metric, eta (e.g. "3 days").`;
    case 'subagent-work':
      return `${ctx}\n\nYour charter: ${task.meta.charter || 'specialist work'}. Execute your next deliverable. ` +
        `Return ONLY JSON with keys: deliverable (1 sentence), detail (2-3 sentences), needsFromHuman (question string or null).`;
    case 'chat-reply':
      return `${ctx}\n\nThe human operator of the holding company just said in chat: "${task.meta.userText}"\n` +
        `Recent chat:\n${task.meta.history || '(none)'}\n\n` +
        `Reply as the CEO — acknowledge, answer, and say what you'll do differently. If they answered a pending question, ` +
        `confirm it's unblocked. Return ONLY JSON with keys: reply (2-3 sentences, conversational).`;
    default:
      return `${ctx}\n\nComplete task "${task.type}".`;
  }
}

function nextStage(stage) {
  const i = STAGES.indexOf(stage);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : stage;
}

module.exports = { STAGES, OPS_ROTATION, EXEC_HIRES, HIRE_EVERY, MAX_SUBAGENTS, tasksForStage, promptFor, nextStage };
