// Agent brain. One function — complete() — that either calls the Claude API
// (live mode) or delegates to Jupiter, the AI-employee platform that executes
// Foundry's tasks (with the local mock as offline fallback). Everything above
// this layer is identical in every mode, so the demo→live flip is just an env var.

const config = require('../config');
const mock = require('./mock');
const jupiter = require('./jupiter');

async function complete({ system, prompt, taskType, company, task, agent, maxTokens }) {
  if (config.MOCK_MODE) {
    // Simulate a little latency so the dashboard feels alive
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 600));
    const fallback = mock.respond(taskType, company, task);
    // Jupiter runs the task as one of its AI employees (audit trail + usage
    // tracking there; real model output when Jupiter's platform key is set).
    if (agent) {
      const viaJupiter = await jupiter.execute({
        system,
        prompt,
        maxTokens: maxTokens || config.MAX_TOKENS,
        task,
        company,
        agent,
        fallback,
      });
      if (viaJupiter !== null) return viaJupiter;
    }
    return fallback;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.MODEL,
      max_tokens: maxTokens || config.MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

// Parse JSON out of a model response, tolerating markdown fences / stray prose.
function parseJson(text) {
  if (typeof text !== 'string') return text;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.search(/[{[]/);
  if (start > 0) t = t.slice(start);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

module.exports = { complete, parseJson };
