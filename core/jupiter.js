// Bridge to Jupiter — the AI-employee platform (localhost:3000) that executes
// Foundry's agent tasks. Each task is delegated to Jupiter's external API,
// which registers the agent as a Jupiter employee, records the task with a
// full audit trail, and runs it through Jupiter's model layer: the platform's
// real Claude key when one is configured, Jupiter-recorded simulation
// otherwise. If Jupiter is down, the caller falls back to the local simulator.

const config = require('../config');

let status = {
  enabled: config.JUPITER_ENABLED,
  url: config.JUPITER_URL,
  connected: false,
  mode: null, // 'live' | 'simulation' (Jupiter-side execution mode)
  lastError: null,
  tasksDelegated: 0,
  checkedAt: null,
};

function agentNameFor(agent, company) {
  const companyName = company.name || 'Foundry';
  const person = agent.name ? ` (${agent.name})` : '';
  return `${companyName} — ${agent.title}${person}`;
}

async function execute({ system, prompt, maxTokens, task, company, agent, fallback }) {
  if (!config.JUPITER_ENABLED) return null;
  try {
    const res = await fetch(`${config.JUPITER_URL}/api/external/tasks`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.JUPITER_TOKEN ? { authorization: `Bearer ${config.JUPITER_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        source: 'foundry',
        agentName: agentNameFor(agent, company),
        agentRole: `${agent.title} · ${company.name || 'incubating venture'}`,
        taskType: task.type,
        label: task.label,
        system,
        prompt,
        maxTokens,
        fallback,
      }),
      signal: AbortSignal.timeout(config.JUPITER_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Jupiter API HTTP ${res.status}`);
    const data = await res.json();
    status = {
      ...status,
      connected: true,
      mode: data.mode,
      lastError: null,
      tasksDelegated: status.tasksDelegated + 1,
      checkedAt: new Date().toISOString(),
    };
    return typeof data.result === 'string' ? data.result : null;
  } catch (err) {
    status = {
      ...status,
      connected: false,
      mode: null,
      lastError: String(err.message || err).slice(0, 200),
      checkedAt: new Date().toISOString(),
    };
    return null;
  }
}

const getStatus = () => status;

module.exports = { execute, getStatus };
