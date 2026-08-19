// Art directions for portfolio sites, each modeled on a family of sites
// widely praised for UI craft (referenced as inspiration, not copied).
// Each company is assigned one stably (hash of its slug) so rebuilds keep
// the same identity while sibling companies look genuinely different.
//
// Every direction differs in LAYOUT ARCHITECTURE, not just palette:
// hero construction, how features are presented, how stats are shown,
// and overall page rhythm are all distinct per direction.
//
// House rules baked into all of them: no gradient text, no glowing orbs,
// no purple-teal-on-black duotones, no emoji as UI. Restrained palettes,
// real typographic hierarchy, generous whitespace.

const THEMES = [
  {
    id: 'linear',
    hint: 'Precision dark UI in the spirit of Linear.app: near-black neutral, hairline borders, tight letter-spacing, one desaturated indigo accent, white primary buttons, a single faint radial glow. LAYOUT: split hero (copy left, live fact-panel right), thin 3-cell stat strip, features as a 3-column card grid.',
  },
  {
    id: 'stripe',
    hint: 'Clean light system in the spirit of Stripe.com: white ground, deep navy headings, one vivid accent, pill buttons, soft layered shadows. LAYOUT: centered hero above a browser-chrome "product shot" window showing live activity rows, then alternating left/right feature rows (text beside a small stat panel), then a large customer-quote band.',
  },
  {
    id: 'editorial',
    hint: 'Modern editorial in the spirit of Medium and the NYT: warm paper, black serif display, small-caps eyebrows, hairline rules, one dark-red accent, ink buttons. LAYOUT: newspaper masthead, huge centered serif headline, drop-cap lede paragraph, features as a numbered single-column essay list separated by rules, a big centered pull-quote, a double-ruled "subscribe" box.',
  },
  {
    id: 'swiss',
    hint: 'International Typographic Style (Vignelli/Müller-Brockmann): flat light ground, massive left-aligned Helvetica headline, exposed 1px grid rules, one bold accent, zero radius, zero shadows. LAYOUT: poster hero (accent bar + giant type), stats as three enormous bare numbers over top rules, features as a strict bordered TABLE (number / name / description columns), full-width black CTA band.',
  },
  {
    id: 'terminal',
    hint: 'Refined developer-tool mono in the spirit of GitHub and Ghostty: dark slate, monospace type, muted green accent used sparingly, no CRT gimmicks. LAYOUT: a rendered terminal window (traffic-light title bar, "$ company start", streaming activity log lines, blinking cursor) as the hero visual, stats as a key:value mono block, features as a man-page style flag list (--flag  description), bracket-style [ buttons ].',
  },
  {
    id: 'warm',
    hint: 'Warm minimalism in the spirit of Notion and Anthropic.com: warm paper-white, ink text, one terracotta accent, hairline-bordered rounded cards, calm and human. LAYOUT: narrow single centered column (~660px), serif display headline, features as a checklist inside one rounded card (accent dash + title + inline description), a rounded pull-quote card, soft rounded subscribe card.',
  },
];

function themeFor(seed) {
  let h = 0;
  for (const ch of String(seed || 'venture')) h = ((h * 31) + ch.charCodeAt(0)) >>> 0;
  return THEMES[h % THEMES.length];
}

module.exports = { THEMES, themeFor };
