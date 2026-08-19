# Foundry — the company that builds companies

An autonomous AI holding company. Its thesis filter is the **current YC Requests
for Startups** (Fall 2026): the analyst passes on anything that doesn't clearly
fit an RFS. Each funded company is run by a **self-assembling AI org** — a CEO
agent who hires their own CMO/COO/CFO/CTO, whose execs later hire their own
specialist sub-agents.

## The genesis pipeline

```
idea/RFS ──► IDEATION      CEO drafts an RFS-fitting company brief
         ──► VALIDATION    Holdco analyst: fund ONLY if it fits a current YC RFS
         ──► TEAM          CEO hires CMO, COO, CFO, CTO — each hire declares a
                           charter, needed integrations, and questions for you
         ──► BUILD         CTO ships the landing page (hosted at /portfolio/<slug>/)
                           CMO writes the launch plan
         ──► OPERATE       Recurring exec ops; every 3rd cycle an exec hires a
                           sub-agent, who then joins the work rotation
```

## Human-in-the-loop

- **Chat** — agents post questions ("Can you connect Stripe?", "What's my
  marketing budget?") to the chat; your replies are stored as guidance and fed
  into every later prompt, and the CEO answers you in-thread.
- **Integrations ledger** — every hire declares the third-party services it
  needs (Stripe, GitHub, Vercel, Slack, Resend, …). Click a chip once you've
  connected one; yellow chips are treated as blockers.
- **Per-business dashboard** — `/company/<id>` gives each company its own ops
  console: brief, org chart with per-exec "Request work" buttons, investment
  memo, launch plan, integrations, task history, ops log, scoped chat, and
  Pause/Resume ops.

## Run it

```bash
npm install
node server.js          # http://localhost:4980 — mock mode, no key needed
```

Live agents: `ANTHROPIC_API_KEY=sk-ant-... node server.js`. Only `core/llm.js`
changes between modes.

## Layout

- `core/rfs.js` — YC RFS catalog (keywords for mock fit-matching + seed concepts)
- `core/roles.js` — personas: holdco analyst, CEO, C-suite, sub-agent template
- `core/pipeline.js` — stages, task prompts, ops rotation, hiring cadence
- `core/orchestrator.js` — org tree, task engine, integrations ledger, chat
- `data/state.json` — all state; `companies/` — the shipped portfolio sites

Env knobs: `FOUNDRY_PORT`, `FOUNDRY_MODEL` (default `claude-fable-5`), `FOUNDRY_MOCK=1`.
