// Offline agent simulator — produces plausible, RFS-aware output for every
// task type so the full pipeline (org assembly, chat, dev team, interactive
// site builds) runs end-to-end with no API key.

const rfs = require('./rfs');
const { buildSiteHtml } = require('./site-builder');
const { buildProductHtml } = require('./product-builder');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const SUFFIXES = ['Labs', 'HQ', 'Pilot', 'Loop', 'Desk', 'Forge', 'Works'];
const NAMES = ['Ava', 'Miles', 'Nora', 'Theo', 'Iris', 'Jude', 'Wren', 'Ezra', 'Lena', 'Kai', 'Remy', 'Sage'];

function nameFromIdea(idea) {
  const words = (idea || 'autonomous venture')
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['that', 'with', 'from', 'using', 'their', 'this', 'into', 'auto', 'concept'].includes(w.toLowerCase()));
  const core = words.length ? words[0][0].toUpperCase() + words[0].slice(1).toLowerCase() : 'Venture';
  return `${core} ${pick(SUFFIXES)}`;
}

const EXEC_INTEGRATIONS = {
  cmo: [
    { name: 'Google Analytics', purpose: 'Track site traffic and conversion' },
    { name: 'Resend', purpose: 'Transactional + campaign email' },
    { name: 'X (Twitter) API', purpose: 'Automated build-in-public posting' },
    { name: 'Buffer', purpose: 'Schedule social content' },
  ],
  coo: [
    { name: 'Slack', purpose: 'Ops alerts and escalations to the human' },
    { name: 'Notion', purpose: 'SOPs and internal documentation' },
    { name: 'Zapier', purpose: 'Glue between tools without code' },
    { name: 'Intercom', purpose: 'Customer support inbox' },
  ],
  cfo: [
    { name: 'Stripe', purpose: 'Billing, subscriptions, and payouts' },
    { name: 'Mercury', purpose: 'Company bank account' },
    { name: 'QuickBooks', purpose: 'Books and tax prep' },
  ],
  cto: [
    { name: 'GitHub', purpose: 'Code hosting and CI' },
    { name: 'Vercel', purpose: 'Production hosting and previews' },
    { name: 'Sentry', purpose: 'Error monitoring' },
    { name: 'Anthropic API', purpose: 'The product’s own AI brain' },
  ],
};

const EXEC_QUESTIONS = {
  cmo: ['What monthly marketing budget am I approved to spend?', 'Any channels you want us to avoid (e.g. paid ads)?'],
  coo: ['Which Slack channel should ops alerts go to?', 'Do you want weekly or daily ops digests?'],
  cfo: ['Can you connect a Stripe account so I can turn on billing?', 'What price point feels right to you for v1?'],
  cto: ['Do we have a domain name you want me to use?', 'Can you add an Anthropic API key so the product itself can go live?'],
};

const SUB_HIRES = {
  cmo: [{ title: 'Content Lead', firstTask: 'Draft the launch-week content calendar' }, { title: 'SEO Specialist', firstTask: 'Ship 5 programmatic landing pages' }],
  coo: [{ title: 'Support Agent', firstTask: 'Write the tier-1 support macro set' }, { title: 'QA Analyst', firstTask: 'Build the weekly quality checklist' }],
  cfo: [{ title: 'Billing Analyst', firstTask: 'Reconcile Stripe events against the ledger' }, { title: 'Pricing Researcher', firstTask: 'Benchmark 5 competitor price points' }],
  cto: [{ title: 'Onboarding Engineer', firstTask: 'Cut signup-to-value time to under 2 minutes' }, { title: 'Data Engineer', firstTask: 'Stand up the product analytics pipeline' }],
};

function respond(taskType, company, task = {}) {
  const idea = company.idea || 'an AI-operated business';
  const meta = task.meta || {};

  switch (taskType) {
    case 'discovery-questions': {
      const gist = idea.length > 70 ? idea.slice(0, 70).replace(/\s+\S*$/, '') + '…' : idea;
      const pool = [
        `Who is the very first user of "${gist}" — and what are they using today instead?`,
        'What is the ONE core workflow the MVP absolutely must nail on day one?',
        'Any must-have integrations or data sources (Stripe, Slack, a spreadsheet, an API…)?',
        'How should this make money — flat subscription, usage-based, or something else?',
        'Any hard constraints or deal-breakers I should know before the team starts building?',
      ];
      return JSON.stringify({
        note: `Love the concept. Before I put the team on it, a few quick questions so we build exactly what you mean — answer in this chat.`,
        questions: pool.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2)),
      });
    }
    case 'draft-brief': {
      const target = company.rfsId ? rfs.byId(company.rfsId) : rfs.matchIdea(idea);
      const concept = company.rfsId && idea.startsWith('Auto-concept') && target
        ? pick(target.concepts) : idea;
      const name = nameFromIdea(concept);
      return JSON.stringify({
        name,
        tagline: concept.length > 62 ? concept.slice(0, 62).replace(/\s+\S*$/, '') : concept,
        oneLiner: `${name}: ${concept}.`,
        product: `A self-serve product that delivers "${concept}" end-to-end, operated day-to-day by an AI org.`,
        icp: target ? `Early adopters inside the "${target.title}" thesis.` : 'Small teams and solo operators.',
        revenueModel: 'Monthly SaaS subscription',
        pricing: `$${pick([19, 29, 49, 99])}/mo`,
        rfsId: target ? target.id : null,
        rfsFitReason: target
          ? `Direct hit on "${target.title}" — ${target.summary.split('.')[0].toLowerCase()}.`
          : 'No clear fit against the current RFS batch.',
      });
    }

    case 'validate': {
      const target = (company.brief && company.brief.rfsId) ? rfs.byId(company.brief.rfsId) : null;
      if (!target && company.thesis === 'founder') {
        // Founder-directed companies are judged on buildability, not RFS fit
        return JSON.stringify({
          score: 70 + Math.floor(Math.random() * 22),
          verdict: 'fund',
          rfsId: null,
          fitReason: 'Founder-directed build — validated against the founder\'s stated requirements, not the RFS thesis.',
          strengths: ['Founder answered the requirement questions directly', 'Scoped to an AI-operable MVP', 'Clear first user'],
          risks: ['No RFS tailwind — distribution is on us', 'Requirements may evolve mid-build', 'Founder availability for future questions'],
          recommendation: 'Fund. Assemble the exec team and build precisely what the founder specified.',
        });
      }
      if (!target) {
        return JSON.stringify({
          score: 20 + Math.floor(Math.random() * 15),
          verdict: 'pass',
          rfsId: null,
          fitReason: 'Does not clearly fit any current YC RFS category — off-thesis for Foundry.',
          strengths: ['Founder conviction'],
          risks: ['Off-thesis', 'No RFS tailwind', 'Distribution unproven'],
          recommendation: 'Pass. Re-pitch with a concept that squarely targets a current RFS.',
        });
      }
      return JSON.stringify({
        score: 68 + Math.floor(Math.random() * 27),
        verdict: 'fund',
        rfsId: target.id,
        fitReason: `Squarely inside "${target.title}".`,
        strengths: ['Clear RFS tailwind — YC is explicitly asking for this', 'AI-operable from day one', 'Fast path to a live demo'],
        risks: ['Crowded RFS category — speed matters', 'Distribution unproven', 'Integration setup depends on the human operator'],
        recommendation: `Fund. Have the CEO assemble the exec team and ship inside "${target.title}".`,
      });
    }

    case 'hire-exec': {
      const k = meta.execKey || 'coo';
      const ints = [...EXEC_INTEGRATIONS[k]].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
      return JSON.stringify({
        name: pick(NAMES),
        charter: `Owns ${k === 'cmo' ? 'positioning, launch, and growth' : k === 'coo' ? 'operations, support, and tooling' : k === 'cfo' ? 'pricing, billing, and financial reporting' : 'product, infrastructure, and shipping velocity'} for ${company.name || 'the company'}. Reports to the CEO, hires specialists as needed.`,
        integrations: ints,
        questionsForHuman: [pick(EXEC_QUESTIONS[k])],
      });
    }

    case 'hire-devteam':
      return JSON.stringify({
        devs: [
          { title: 'Lead Frontend Engineer', name: pick(NAMES) },
          { title: 'Product Engineer', name: pick(NAMES) },
        ],
        note: 'Dev team assembled — shipping a fully interactive site next.',
      });

    case 'build-site':
    case 'site-update':
      return buildSiteHtml(company);

    case 'build-product':
    case 'product-update':
      return buildProductHtml(company);

    case 'launch-plan':
      return JSON.stringify({
        positioning: `${company.name} — a business that runs itself.`,
        channels: ['X/Twitter build-in-public thread', 'Product Hunt launch', 'Cold outreach to 50 ICP accounts', 'SEO page per workflow'],
        firstWeekTargets: { signups: 100, demos: 10, payingCustomers: 3 },
        hook: `We didn't hire a team to build ${company.name}. The CEO is an AI — and it hired its own C-suite.`,
      });

    case 'hire-subagent': {
      const k = meta.execKey || 'coo';
      const h = pick(SUB_HIRES[k]);
      return JSON.stringify({
        title: h.title,
        name: pick(NAMES),
        charter: `${h.title} reporting to the ${k.toUpperCase()}. ${h.firstTask}.`,
        integrations: Math.random() > 0.6 ? [pick(EXEC_INTEGRATIONS[k])] : [],
        firstTask: h.firstTask,
      });
    }

    case 'growth-experiment':
      return JSON.stringify({
        experiment: pick(['Interactive ROI calculator as a lead magnet', '7-day build-in-public thread showing the AI org working', 'Comparison page vs. the manual workflow', 'Concierge onboarding for the first 10 customers']),
        channel: pick(['X/Twitter', 'LinkedIn', 'Product Hunt', 'SEO']),
        hypothesis: 'Showing the autonomous org directly converts better than describing it.',
        successMetric: `${pick([25, 50, 100])} new signups in 7 days`,
      });

    case 'ops-review':
      return JSON.stringify({
        status: 'Systems nominal; all agents completing tasks on schedule.',
        bottleneck: pick(['Waiting on human to connect Stripe', 'Support volume routing needs a macro set', 'No domain connected yet', 'Analytics not wired into decisions']),
        fix: pick(['Escalated to human via chat', 'Assigning to a specialist sub-agent', 'Automating with a scheduled task']),
        toolingChange: pick([null, 'Adopt Zapier for tool glue', 'Move SOPs into Notion']),
      });

    case 'finance-report':
      return JSON.stringify({
        period: 'Current period',
        mrr: `$${pick([0, 87, 245, 640, 1180])}`,
        burn: '$42/mo (infra + API tokens)',
        runway: 'Effectively unlimited — no payroll',
        note: 'Unit economics dominated by token spend; margin improves as ops tasks are cached.',
        action: pick(['Hold pricing', 'Test a higher annual tier', 'Add usage-based add-on']),
      });

    case 'product-iteration':
      return JSON.stringify({
        shipping: pick(['Self-serve onboarding flow', 'Usage dashboard for customers', 'API access for power users', 'Weekly digest email']),
        why: 'Highest-leverage gap between signups and activation.',
        metric: 'Activation rate',
        eta: `${pick([2, 3, 5])} days`,
      });

    case 'subagent-work':
      return JSON.stringify({
        deliverable: meta.firstTask || 'Specialist deliverable completed.',
        detail: 'Executed against charter; results logged and handed to my exec for review.',
        needsFromHuman: Math.random() > 0.7 ? 'Quick approval needed on the draft before it goes public.' : null,
      });

    case 'chat-reply':
      return JSON.stringify({
        reply: pick([
          `Got it — noted and passing that to the team now. ${meta.userText && meta.userText.length < 80 ? 'That unblocks us.' : 'We\'ll adjust course accordingly.'}`,
          'Understood. I\'ve updated our plan and briefed the exec team — you\'ll see it reflected in the next ops cycle.',
          'Thanks — that answers what we were blocked on. I\'ll have the relevant exec act on it this cycle.',
        ]),
      });

    default:
      return JSON.stringify({ note: `Mock output for ${taskType}` });
  }
}

module.exports = { respond, nameFromIdea };
