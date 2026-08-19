// Agent brain. One function — complete() — that either calls the Claude API
// (live mode) or routes to the mock responder (offline mode). Everything above
// this layer is identical in both modes, so the demo→live flip is just an env var.

const config = require('../config');
const mock = require('./mock');

async function complete({ system, prompt, taskType, company, task, maxTokens }) {
  if (config.MOCK_MODE) {
    // Simulate a little latency so the dashboard feels alive
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 600));
    return mock.respond(taskType, company, task);
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
