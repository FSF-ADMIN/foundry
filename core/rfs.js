// YC Requests for Startups — Fall 2026 batch (ycombinator.com/rfs).
// Foundry's thesis filter: the analyst passes on any concept that doesn't
// clearly fit one of these. Each entry carries keywords (for mock-mode fit
// matching) and seed concepts (for "found from RFS" auto-ideation).

const RFS = [
  {
    id: 'primer',
    title: 'The Primer',
    author: 'Andrew Miklas',
    summary: 'An adaptive AI tutor that teaches young children to read, write, and do arithmetic at private-tutor quality, at consumer scale.',
    keywords: ['tutor', 'education', 'learning', 'teach', 'children', 'kids', 'reading', 'school', 'homework', 'primer'],
    concepts: ['Adaptive AI reading tutor that grows with a child from phonics to essays', 'Story-driven arithmetic coach that builds daily lessons around a kid\'s own interests'],
  },
  {
    id: 'defense',
    title: 'The Future of American Defense',
    author: 'Daniel P. Driscoll, US Secretary of the Army',
    summary: 'Low-cost interceptors, next-gen sensors/software/payloads for open system architectures, drones, resilient logistics, advanced manufacturing.',
    keywords: ['defense', 'army', 'military', 'drone', 'sensor', 'interceptor', 'logistics', 'payload'],
    concepts: ['Modular sensor-fusion software for open-architecture ground systems', 'Resilient last-mile logistics planner for contested environments'],
  },
  {
    id: 'small-software-cloud',
    title: 'A Cloud for Small Software',
    author: 'Pete Koomen',
    summary: 'A cloud designed for deploying and sharing agent-built personal/team software as easily as sharing a Google Doc.',
    keywords: ['cloud', 'deploy', 'hosting', 'internal tools', 'personal software', 'small software', 'share', 'apps'],
    concepts: ['One-click secure host for agent-written team tools with built-in auth', 'A "Google Docs for apps" where small software is shared by link'],
  },
  {
    id: 'multiplayer-ai',
    title: 'Multiplayer AI',
    author: 'Aaron Epstein',
    summary: 'AI that is multiplayer by default — shared live agent sessions a whole team can watch, redirect, and hand off.',
    keywords: ['multiplayer', 'collaboration', 'team', 'shared', 'realtime', 'session', 'agents', 'coop'],
    concepts: ['Shared live agent sessions for sales teams working a deal together', 'Multiplayer AI workspace where a team steers one long-running agent'],
  },
  {
    id: 'compute-at-sea',
    title: 'Compute at Sea',
    author: 'Francois Chaubard',
    summary: 'Offshore compute flotillas — standardized modular vessels operating together as one global cloud.',
    keywords: ['datacenter', 'ocean', 'offshore', 'compute', 'energy', 'cooling', 'vessel', 'flotilla'],
    concepts: ['Fleet-orchestration software for modular offshore compute vessels', 'Thermal + power telemetry platform for ocean-based data centers'],
  },
  {
    id: 'consumer-ai',
    title: 'AI-Powered Consumer Products for 1 Billion People',
    author: 'Raphael Schaad',
    summary: 'Consumer-scale AI products: how we get things done, get around, learn, stay healthy, manage money, play, and connect.',
    keywords: ['consumer', 'app', 'personal', 'health', 'money', 'social', 'lifestyle', 'assistant', 'mobile'],
    concepts: ['An AI personal chief-of-staff app priced for everyone', 'AI money copilot that manages bills, subscriptions and savings automatically'],
  },
  {
    id: 'aging',
    title: 'AI for the Aging Population',
    author: 'Max Kolysh',
    summary: 'Voice-first AI, safety monitoring, robotics, and caregiver-coordination software for older adults.',
    keywords: ['senior', 'elderly', 'aging', 'caregiver', 'care', 'voice', 'monitoring', 'medicare', 'retirement'],
    concepts: ['Voice-first daily companion + safety check-in for seniors living alone', 'Care-coordination hub that syncs family caregivers, appointments and meds'],
  },
  {
    id: 'physical-os',
    title: 'New Operating Systems for the Physical World',
    author: 'Charlie Warren',
    summary: 'Operating systems that route work across AI agents, robots, and human field workers in construction, maintenance, and fleets.',
    keywords: ['construction', 'fleet', 'field', 'maintenance', 'dispatch', 'robots', 'workforce', 'contractor', 'trades', 'trucks'],
    concepts: ['Dispatch OS that routes jobs across agents, robots and field crews', 'AI quoting + scheduling brain for maintenance contractors'],
  },
  {
    id: 'crypto',
    title: 'The Best Time to Build in Crypto',
    author: 'Nemil Dalal',
    summary: 'Capital raising, stablecoins and their applications, agentic commerce, trading, institutional products, scalable/private chains.',
    keywords: ['crypto', 'stablecoin', 'blockchain', 'wallet', 'payments', 'tokenized', 'defi', 'onchain'],
    concepts: ['Stablecoin payout rails for AI agents that buy and sell services', 'Compliance-first stablecoin invoicing for cross-border contractors'],
  },
  {
    id: 'real-world-data',
    title: 'Data for the Real World',
    author: 'Austin Tindle & Diana Hu',
    summary: 'New ways to collect dense physical-world data (energy, agriculture, logistics, construction) that make precise modeling possible.',
    keywords: ['sensors', 'weather', 'agriculture', 'logistics', 'data collection', 'physical', 'satellite', 'farm', 'energy'],
    concepts: ['Low-cost sensor mesh + modeling platform for small farms', 'Physical-world data marketplace feeding industrial foundation models'],
  },
  {
    id: 'proof-of-human',
    title: "Proving You're Human",
    author: 'Max Kolysh',
    summary: 'Rebuilding the trust layer of the internet: verified humans on calls, messages, and transactions — without giving up privacy.',
    keywords: ['deepfake', 'verification', 'identity', 'fraud', 'trust', 'bots', 'human', 'authentication', 'scam'],
    concepts: ['Live human-verification layer for video calls that flags deepfakes', 'Privacy-preserving proof-of-human API for banks and marketplaces'],
  },
  {
    id: 'compliance',
    title: 'AI-Native Compliance Infrastructure',
    author: 'Daivik Goel',
    summary: 'AI-default compliance ops: monitoring regulatory change, licensing across jurisdictions, anomaly flagging, reports, audit trails.',
    keywords: ['compliance', 'regulatory', 'audit', 'licensing', 'finance', 'reporting', 'kyc', 'aml', 'legal', 'bookkeeping', 'tax', 'accounting'],
    concepts: ['AI compliance officer that tracks state-by-state licensing and renewals', 'Real-time regulatory-change monitor that rewrites your policies for you'],
  },
  {
    id: 'self-maintaining-apis',
    title: 'Self-Maintaining APIs',
    author: 'Harsha Gaddipati',
    summary: 'Agents that apply API changes for customers: scan codebases on a breaking change and open the fixing PR — Dependabot for APIs.',
    keywords: ['api', 'sdk', 'breaking changes', 'changelog', 'dependabot', 'integration', 'developer', 'devtools', 'migration'],
    concepts: ['Neutral update-agent that PRs fixes when any vendor API changes', '"Install our update agent" toolkit API vendors ship to customers'],
  },
];

const byId = (id) => RFS.find((r) => r.id === id) || null;

// Naive keyword fit used by mock mode (live mode lets the analyst judge)
function matchIdea(idea) {
  const text = (idea || '').toLowerCase();
  let best = null;
  let bestHits = 0;
  for (const r of RFS) {
    const hits = r.keywords.filter((k) => text.includes(k)).length;
    if (hits > bestHits) {
      best = r;
      bestHits = hits;
    }
  }
  return bestHits > 0 ? best : null;
}

const catalogText = () =>
  RFS.map((r) => `- [${r.id}] ${r.title} (${r.author}): ${r.summary}`).join('\n');

module.exports = { RFS, byId, matchIdea, catalogText };
