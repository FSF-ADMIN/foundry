// Central config — mirrors the AppConfig pattern used across FSF projects.
// With no ANTHROPIC_API_KEY set, Foundry runs fully in MOCK mode (simulated
// agent output) so the whole pipeline is demoable offline. Set the key to go live.

const API_KEY = process.env.ANTHROPIC_API_KEY || '';

module.exports = {
  PORT: parseInt(process.env.FOUNDRY_PORT || '4980', 10),
  MODEL: process.env.FOUNDRY_MODEL || 'claude-fable-5',
  API_KEY,
  MOCK_MODE: process.env.FOUNDRY_MOCK === '1' || !API_KEY,
  MAX_TOKENS: 4096,
  // Site builds need much more room — full interactive single-file pages
  BUILD_MAX_TOKENS: 16000,
  // Autopilot: how often the orchestrator ticks (processes tasks / advances stages)
  TICK_MS: 4000,
  // Max tasks executed per tick across the whole portfolio
  TASKS_PER_TICK: 3,
  // Operate-stage: stop generating new ops tasks after this many per company
  MAX_OPS_TASKS: 12,
};
