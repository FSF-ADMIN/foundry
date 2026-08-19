// The dev team's site generator (mock mode). Ships a MULTI-PAGE site —
// index / features / demo / pricing / faq — through 6 art directions that
// differ in LAYOUT ARCHITECTURE, not just palette (see core/themes.js):
//
//   linear    split hero + fact panel, stat strip, card grid
//   stripe    centered hero + browser-chrome product shot, alternating
//             feature rows, quote band
//   editorial newspaper masthead, drop-cap lede, numbered essay features,
//             pull-quote, double-ruled subscribe box
//   swiss     poster hero, giant bare numbers, bordered feature TABLE,
//             black full-width CTA band
//   terminal  rendered terminal window hero, key:value stats block,
//             man-page flag list, [ bracket buttons ]
//   warm      narrow centered column, serif display, checklist card,
//             rounded quote card
//
// Pages are returned as one string using the `<!-- PAGE: name.html -->`
// marker convention live-mode dev agents are prompted to use.

const { themeFor } = require('./themes');

const NAV_PAGES = [
  ['index.html', 'Home'],
  ['features.html', 'Features'],
  ['demo.html', 'Demo'],
  ['pricing.html', 'Pricing'],
  ['faq.html', 'FAQ'],
];

// ---- entry -------------------------------------------------------------------

function buildSiteHtml(company) {
  const b = company.brief || {};
  const C = {
    name: company.name || 'New Venture',
    tagline: b.tagline || 'A business that runs itself.',
    product: b.product || 'An AI-operated product.',
    icp: b.icp || 'Teams who want the outcome without the headcount.',
    monthly: parseInt(String(b.pricing || '$29').replace(/[^0-9]/g, ''), 10) || 29,
  };
  C.annual = Math.round(C.monthly * 0.8);
  const hue = Math.floor(Math.random() * 360);
  const theme = themeFor(company.slug || company.id);

  const agents = [];
  (function walk(n) { if (!n) return; agents.push(n); (n.reports || []).forEach(walk); })(company.org);
  const ACTIONS = ['shipped an update', 'closed a support ticket in 94s', 'ran a growth experiment', 'reconciled the books', 'reviewed the roadmap', 'published a changelog', 'answered a customer question'];
  C.ticker = agents.filter((a) => a.key !== 'ceo').slice(0, 8)
    .map((a, i) => `${a.title}${a.name ? ' ' + a.name : ''} ${ACTIONS[i % ACTIONS.length]}`);
  if (!C.ticker.length) C.ticker.push('AI org online — all systems operating');
  C.nAgents = Math.max(agents.length, 5);
  C.logoA = C.name.split(' ')[0];
  C.version = (company.siteVersion || 0) + 1;
  C.themeId = theme.id;

  C.features = [
    { t: 'Autonomous by design', p: 'Product, growth, finance, and support are executed by AI employees around the clock — no waiting on humans.' },
    { t: 'Ships daily', p: 'The dev team pushes real improvements continuously. This site was built — and is updated — by them.' },
    { t: 'Built for you', p: C.icp },
    { t: 'Compounding ops', p: 'Every support ticket, experiment, and report makes the org smarter about your workflow.' },
    { t: 'Human oversight', p: 'A human operator supervises the org, approves spend, and can pause everything with one click.' },
    { t: 'YC-thesis native', p: 'Founded against a current Y Combinator Request for Startups — built where the market is pulled.' },
  ];
  C.steps = [
    { t: 'Connect', p: 'Sign up and link your existing tools in under two minutes. The AI org takes inventory itself.' },
    { t: 'Delegate', p: 'The org takes over the workflow end-to-end and reports back in plain English.' },
    { t: 'Compound', p: 'Every week the dev team ships improvements and the ops team tunes the machine.' },
  ];
  C.faqs = [
    { q: `Is ${C.name} really run by AI?`, a: 'Yes. The CEO is an AI agent that hired its own CMO, COO, CFO, and CTO — who in turn hired their own specialists. Humans supervise at the holding-company level.' },
    { q: 'What if the AI gets something wrong?', a: 'Anything ambiguous or high-stakes is escalated to a human operator before action. You can also pause the entire org with one click.' },
    { q: 'How fast is support?', a: 'Median first response is under two minutes, around the clock — the support agent does not sleep, and escalates to the human operator when needed.' },
    { q: 'Can I cancel anytime?', a: 'Yes — one click in settings, no retention flows. Annual plans are refunded pro-rata.' },
  ];

  const L = LAYOUTS[theme.id] || LAYOUTS.linear;
  const css = L.css(hue);
  const shell = (title, active, body) => pageShell(C, L, css, title, active, body);

  const pages = {
    'index.html': shell(C.name, 'index.html', L.index(C)),
    'features.html': shell(`Features — ${C.name}`, 'features.html', L.features(C)),
    'demo.html': shell(`Demo — ${C.name}`, 'demo.html', L.demo(C)),
    'pricing.html': shell(`Pricing — ${C.name}`, 'pricing.html', L.pricing(C)),
    'faq.html': shell(`FAQ — ${C.name}`, 'faq.html', L.faq(C)),
  };

  return Object.entries(pages)
    .map(([file, html], i) => (i === 0 ? html : `<!-- PAGE: ${file} -->\n${html}`))
    .join('\n');
}

// ---- shared shell + behavior ---------------------------------------------------

function pageShell(C, L, css, title, active, body) {
  const nav = NAV_PAGES.map(([file, label]) =>
    `<a href="${file}"${file === active ? ' class="active"' : ''}>${label}</a>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>${css}</style></head><body>
<nav><div class="wrap navrow">
<a class="logo" href="index.html">${C.name}</a>
<div class="navlinks">${nav}</div>
<a class="btn small" href="pricing.html">${L.cta || 'Get started'}</a>
</div></nav>
<main>
${body}
</main>
<footer><div class="wrap">A Foundry portfolio company · founded, built &amp; operated by AI · site v${C.version} · "${C.themeId}" design by the dev team</div></footer>
<script>
var tkEls=document.querySelectorAll('.tk');
if(tkEls.length){var LINES=${JSON.stringify(C.ticker)};var ti=0;
setInterval(function(){ti=(ti+1)%LINES.length;tkEls.forEach(function(el){el.style.opacity=0;});setTimeout(function(){tkEls.forEach(function(el){el.textContent=LINES[ti];el.style.opacity=1;});},200);},3200);}

function count(el){
  var end=parseFloat(el.dataset.n),suf=el.dataset.suf||'',cur=0,steps=44,inc=end/steps;
  var iv=setInterval(function(){cur+=inc;if(cur>=end){cur=end;clearInterval(iv);}
    el.textContent=(end%1!==0?cur.toFixed(1):Math.round(cur))+suf;},26);
}
var io=new IntersectionObserver(function(es){es.forEach(function(e){
  if(!e.isIntersecting)return;
  e.target.classList.add('in');
  if(e.target.dataset&&e.target.dataset.n)count(e.target);
  io.unobserve(e.target);
});},{threshold:.15});
document.querySelectorAll('.reveal,[data-n]').forEach(function(el){io.observe(el);});

if(document.getElementById('rh')){
  var calc=function(){
    var h=+document.getElementById('rh').value,r=+document.getElementById('rr').value;
    document.getElementById('oh').textContent=h+' hrs/wk';
    document.getElementById('or').textContent='$'+r+'/hr';
    document.getElementById('sv').textContent='$'+Math.round(h*52*r*0.8).toLocaleString();
  };
  document.getElementById('rh').addEventListener('input',calc);
  document.getElementById('rr').addEventListener('input',calc);
  calc();
}

var tog=document.getElementById('tog');
if(tog){var MO=${C.monthly},AN=${C.annual};
tog.addEventListener('change',function(){
  document.getElementById('pr').textContent='$'+(this.checked?AN:MO);
  document.getElementById('per').textContent=this.checked?'/mo billed annually':'/mo';
});}

document.querySelectorAll('.qa .q').forEach(function(q){
  q.addEventListener('click',function(){q.parentElement.classList.toggle('open');});
});

var wlf=document.getElementById('wlf');
if(wlf){wlf.addEventListener('submit',function(e){
  e.preventDefault();
  try{localStorage.setItem('waitlist',document.getElementById('wle').value);}catch(err){}
  this.style.display='none';
  document.getElementById('wok').style.display='block';
});}
</script>
</body></html>`;
}

// Shared CSS every layout builds on (structure-free: nav, buttons, reveal, faq, calc)
function coreCss(v) {
  return `
:root{--acc:${v.acc};--bg:${v.bg};--panel:${v.panel};--line:${v.line};--txt:${v.txt};--dim:${v.dim}}
*{margin:0;box-sizing:border-box}html{scroll-behavior:smooth}
body{font-family:${v.font};background:var(--bg);color:var(--txt);min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;overflow-x:hidden}
.wrap{max-width:${v.maxw || '1020px'};margin:0 auto;padding:0 28px;width:100%}
main{flex:1}
nav{position:sticky;top:0;z-index:50;background:${v.navBg};backdrop-filter:blur(10px);border-bottom:${v.navBorder || '1px solid var(--line)'}}
.navrow{display:flex;align-items:center;gap:24px;padding:15px 28px}
.logo{font-weight:700;font-size:16.5px;margin-right:auto;color:var(--txt);text-decoration:none;font-family:${v.headFont}}
.navlinks{display:flex;gap:22px}
.navlinks a{color:var(--dim);text-decoration:none;font-size:13.5px}
.navlinks a:hover{color:var(--txt)}
.navlinks a.active{color:var(--txt);font-weight:600}
.btn{display:inline-block;background:${v.btnBg};color:${v.btnTxt};font-weight:600;padding:11px 22px;border-radius:${v.btnRadius};text-decoration:none;border:1px solid transparent;font-size:14px;cursor:pointer;transition:opacity .15s;font-family:inherit}
.btn:hover{opacity:.88}
.btn.small{padding:8px 16px;font-size:13px}
.btn.ghost{background:transparent;color:var(--txt);border:1px solid ${v.ghostBorder || 'var(--line)'}}
h1,h2,h3{font-family:${v.headFont};color:${v.headColor}}
input[type=range]{width:100%;accent-color:var(--acc)}
input[type=email]{background:var(--bg);border:1px solid var(--line);border-radius:${v.btnRadius};padding:12px 16px;color:var(--txt);font-size:14px;font-family:inherit}
input[type=email]:focus{outline:none;border-color:var(--acc)}
.ok{display:none;margin-top:22px;color:var(--acc);font-weight:600;font-size:15px}
.qa{border-bottom:1px solid var(--line)}
.q{padding:18px 2px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;font-size:15px}
.q:after{content:'+';color:var(--dim);font-size:20px;font-weight:300;transition:transform .2s}
.qa.open .q:after{transform:rotate(45deg)}
.a{max-height:0;overflow:hidden;transition:max-height .3s ease;color:var(--dim);font-size:14.5px;line-height:1.7;padding:0 2px}
.qa.open .a{max-height:240px;padding:0 2px 20px}
.tk{transition:opacity .2s}
footer{border-top:1px solid var(--line);padding:26px 0;text-align:center;color:var(--dim);font-size:12.5px;margin-top:64px}
.reveal{opacity:0;transform:translateY(16px);transition:opacity .55s,transform .55s}
.reveal.in{opacity:1;transform:none}
@media(max-width:720px){.navlinks{display:none}}`;
}

// Shared interactive calculator markup (each layout wraps/styles it its own way)
function calcHtml(C) {
  return `<div class="calcgrid">
<div>
<label><span>Hours spent on this per week</span><b id="oh">6 hrs/wk</b></label>
<input type="range" id="rh" min="1" max="40" value="6">
<label><span>What an hour of your time is worth</span><b id="or">$60/hr</b></label>
<input type="range" id="rr" min="15" max="250" value="60">
</div>
<div class="calcout"><div class="v" id="sv">$14,976</div><div class="c">recovered per year with ${C.logoA}</div></div>
</div>`;
}

function waitlistHtml() {
  return `<form id="wlf"><input type="email" id="wle" placeholder="you@company.com" required><button class="btn" type="submit">Join</button></form>
<div class="ok" id="wok">You're on the list. The org has been notified.</div>`;
}

function faqList(C) {
  return C.faqs.map((f) => `<div class="qa reveal"><div class="q">${f.q}</div><div class="a">${f.a}</div></div>`).join('\n');
}

function priceBox(C) {
  return `<div class="pricebox reveal">
<div class="tog">Monthly <label class="sw"><input type="checkbox" id="tog"><span class="sl"></span></label> Annual <span style="color:var(--acc);font-weight:700">−20%</span></div>
<span class="pr" id="pr">$${C.monthly}</span><span class="per" id="per">/mo</span>
<ul><li>Full AI org, working 24/7</li><li>Unlimited tasks and reports</li><li>Human-oversight controls</li><li>Continuous product updates</li></ul>
<a class="btn" href="index.html#wlf" style="width:100%;text-align:center">Start free</a>
</div>`;
}

const priceCss = `
.pricebox{max-width:400px;margin:0 auto;background:var(--panel);border:1px solid var(--line);padding:38px;text-align:center}
.tog{display:flex;align-items:center;justify-content:center;gap:12px;font-size:13.5px;color:var(--dim);margin-bottom:24px}
.sw{position:relative;width:42px;height:23px;flex:none}
.sw input{opacity:0;width:0;height:0}
.sl{position:absolute;inset:0;background:var(--line);border-radius:99px;cursor:pointer;transition:.2s}
.sl:before{content:'';position:absolute;width:17px;height:17px;border-radius:50%;background:#fff;top:3px;left:3px;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.sw input:checked+.sl{background:var(--acc)}.sw input:checked+.sl:before{transform:translateX(19px)}
.pr{font-size:50px;font-weight:700}.per{color:var(--dim);font-size:14px}
.pricebox ul{list-style:none;margin:26px 0;text-align:left}
.pricebox li{padding:9px 0;color:var(--dim);font-size:14px;border-bottom:1px solid var(--line)}
.pricebox li:last-child{border-bottom:none}
.pricebox li:before{content:'—  ';color:var(--acc)}`;

const calcCss = `
.calcgrid{display:grid;grid-template-columns:1fr 1fr;gap:38px;align-items:center}
@media(max-width:760px){.calcgrid{grid-template-columns:1fr}}
.calcgrid label{display:flex;justify-content:space-between;font-size:13.5px;color:var(--dim);margin:22px 0 8px}
.calcgrid label b{color:var(--txt)}
.calcout{text-align:center;border:1px solid var(--line);padding:36px;background:var(--bg)}
.calcout .v{font-size:40px;font-weight:700;color:var(--acc)}
.calcout .c{color:var(--dim);font-size:12px;margin-top:8px;letter-spacing:.08em;text-transform:uppercase}`;

// =================================================================================
// LAYOUTS — each theme is a different site architecture
// =================================================================================

const LAYOUTS = {

  // ---- LINEAR: split hero + fact panel, stat strip, card grid ------------------
  linear: {
    cta: 'Get started',
    css(hue) {
      const v = {
        bg: '#08090b', panel: '#0e0f12', line: '#1f2126', txt: '#f7f8f8', dim: '#8a8f98',
        acc: `hsl(${hue} 42% 64%)`, headColor: '#f7f8f8',
        font: `-apple-system,'Segoe UI',sans-serif`, headFont: `-apple-system,'Segoe UI',sans-serif`,
        btnRadius: '8px', btnBg: '#f7f8f8', btnTxt: '#0b0c0e', navBg: 'rgba(8,9,11,.85)',
      };
      return coreCss(v) + priceCss + calcCss + `
body:before{content:'';position:fixed;inset:0 0 auto 0;height:55vh;z-index:-1;background:radial-gradient(48% 32% at 50% 0%,hsl(${hue} 45% 50% / .12),transparent 70%);pointer-events:none}
h1{font-size:clamp(34px,4.8vw,52px);font-weight:600;letter-spacing:-.035em;line-height:1.08}
h2{font-size:clamp(22px,2.6vw,30px);font-weight:600;letter-spacing:-.025em}
.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);font-weight:600;margin-bottom:18px}
.hero{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;padding:96px 0 60px}
@media(max-width:800px){.hero{grid-template-columns:1fr}}
.sub{margin-top:20px;max-width:520px;color:var(--dim);font-size:16px;line-height:1.7}
.ctas{margin-top:32px;display:flex;gap:12px;flex-wrap:wrap}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:24px}
.hp-row{display:flex;justify-content:space-between;padding:12px 4px;border-bottom:1px solid var(--line);font-size:14px;color:var(--dim)}
.hp-row:last-of-type{border-bottom:none}.hp-row b{color:var(--txt)}
.tickline{margin-top:16px;border:1px solid var(--line);border-radius:8px;padding:9px 14px;font-size:12.5px;color:var(--dim);display:flex;gap:9px;align-items:center;overflow:hidden;white-space:nowrap}
.dot{width:7px;height:7px;border-radius:50%;background:var(--acc);animation:pulse 1.8s infinite;flex:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border-block:1px solid var(--line)}
.stat{text-align:center;padding:40px 12px;background:var(--bg)}
.stat .n{font-size:32px;font-weight:600}.stat .l{font-size:11.5px;color:var(--dim);letter-spacing:.08em;text-transform:uppercase;margin-top:6px}
section{padding:68px 0}
.lead{color:var(--dim);max-width:520px;margin:12px auto 40px;line-height:1.7;font-size:15px;text-align:center}
.center{text-align:center}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:24px;transition:background .15s,border-color .15s}
.card:hover{background:#121317;border-color:#2a2d33}
.mark{width:9px;height:9px;background:var(--acc);border-radius:2px;margin-bottom:16px}
.card h3{font-size:15px;margin-bottom:8px}.card p{color:var(--dim);font-size:13.5px;line-height:1.65}
.band{border:1px solid var(--line);border-radius:12px;padding:46px;text-align:center;background:var(--panel);margin-bottom:8px}
.band p{color:var(--dim);margin:10px 0 24px;font-size:14.5px}
.wl form{display:flex;gap:10px;max-width:440px;margin:0 auto}
.wl input{flex:1}
.pagehead{padding:72px 0 4px;text-align:center}
.pagehead h1{font-size:clamp(26px,3.6vw,40px)}
.calcwrap{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:36px}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;counter-reset:s}
.step{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:24px}
.step:before{counter-increment:s;content:counter(s,decimal-leading-zero);font-size:12px;font-weight:700;color:var(--acc);letter-spacing:.1em}
.step h3{font-size:15px;margin:10px 0 8px}.step p{color:var(--dim);font-size:13.5px;line-height:1.6}
.faq{max-width:620px;margin:0 auto}`;
    },
    index(C) {
      return `<div class="wrap">
<section class="hero">
<div>
<div class="eyebrow">Run entirely by an AI org</div>
<h1>${C.tagline}</h1>
<p class="sub">${C.product}</p>
<div class="ctas"><a class="btn" href="pricing.html">Get started</a><a class="btn ghost" href="demo.html">See the numbers</a></div>
</div>
<div class="panel">
<div class="hp-row"><span>AI employees</span><b>${C.nAgents}</b></div>
<div class="hp-row"><span>Org uptime</span><b>99.9%</b></div>
<div class="hp-row"><span>Median support reply</span><b>94s</b></div>
<div class="tickline"><span class="dot"></span><span class="tk">${C.ticker[0]}</span></div>
</div>
</section>
</div>
<div class="stats">
<div class="stat reveal"><div class="n" data-n="${C.nAgents}">0</div><div class="l">AI employees</div></div>
<div class="stat reveal"><div class="n" data-n="140" data-suf="+">0</div><div class="l">Tasks / week</div></div>
<div class="stat reveal"><div class="n" data-n="99.9" data-suf="%">0</div><div class="l">Uptime</div></div>
</div>
<div class="wrap">
<section>
<h2 class="center reveal">Everything handled. By no one.</h2>
<p class="lead reveal">An AI CEO and its self-hired team run the whole company.</p>
<div class="cards">${C.features.slice(0, 3).map((f) => `<div class="card reveal"><div class="mark"></div><h3>${f.t}</h3><p>${f.p}</p></div>`).join('')}</div>
<div class="center" style="margin-top:30px"><a class="btn ghost" href="features.html">All features</a></div>
</section>
<div class="band reveal wl"><h2>Get early access</h2><p>Join the waitlist — the CMO will be in touch (yes, really).</p>${waitlistHtml()}</div>
</div>`;
    },
    features(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Features</div><h1>Everything the AI org handles</h1></div>
<section style="padding-top:28px">
<div class="cards">${C.features.map((f) => `<div class="card reveal"><div class="mark"></div><h3>${f.t}</h3><p>${f.p}</p></div>`).join('')}</div>
</section>
<section style="padding-top:0">
<h2 class="center reveal">How it works</h2><p class="lead reveal">Three steps, then it compounds.</p>
<div class="steps">${C.steps.map((s) => `<div class="step reveal"><h3>${s.t}</h3><p>${s.p}</p></div>`).join('')}</div>
</section>
</div>`;
    },
    demo(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Demo</div><h1>What does the manual way cost you?</h1><p class="lead">Drag the sliders — the math updates live.</p></div>
<section style="padding-top:24px"><div class="calcwrap reveal">${calcHtml(C)}</div>
<div class="center" style="margin-top:34px"><a class="btn" href="pricing.html">Worth it? See pricing</a></div></section>
</div>`;
    },
    pricing(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Pricing</div><h1>Simple pricing</h1><p class="lead">One plan. Cancel anytime.</p></div>
<section style="padding-top:24px">${priceBox(C)}</section>
</div>`;
    },
    faq(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">FAQ</div><h1>Questions, answered</h1></div>
<section style="padding-top:20px"><div class="faq">${faqList(C)}</div></section>
<div class="band reveal wl"><h2>Get early access</h2><p>Join the waitlist.</p>${waitlistHtml()}</div>
</div>`;
    },
  },

  // ---- STRIPE: centered hero + browser product shot, alt rows, quote band ------
  stripe: {
    cta: 'Start now',
    css(hue) {
      const v = {
        bg: '#ffffff', panel: '#f6f9fc', line: '#e6ebf1', txt: '#0a2540', dim: '#425466',
        acc: `hsl(${hue} 78% 56%)`, headColor: '#0a2540',
        font: `-apple-system,'Segoe UI',sans-serif`, headFont: `-apple-system,'Segoe UI',sans-serif`,
        btnRadius: '99px', btnBg: `hsl(${hue} 78% 56%)`, btnTxt: '#fff', navBg: 'rgba(255,255,255,.92)',
      };
      return coreCss(v) + priceCss + calcCss + `
h1{font-size:clamp(36px,5.4vw,58px);font-weight:700;letter-spacing:-.03em;line-height:1.05}
h2{font-size:clamp(24px,3vw,34px);font-weight:700;letter-spacing:-.02em}
.eyebrow{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--acc);font-weight:700;margin-bottom:18px}
.hero{text-align:center;padding:92px 0 40px}
.hero h1{margin:0 auto;max-width:760px}
.sub{margin:22px auto 0;max-width:580px;color:var(--dim);font-size:17px;line-height:1.7}
.ctas{margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.browser{max-width:760px;margin:56px auto 0;border-radius:12px;overflow:hidden;box-shadow:0 30px 60px -12px rgba(50,50,93,.22),0 18px 36px -18px rgba(0,0,0,.28);border:1px solid var(--line);background:#fff}
.chrome{background:#f1f4f8;border-bottom:1px solid var(--line);padding:10px 14px;display:flex;align-items:center;gap:8px}
.cdot{width:10px;height:10px;border-radius:50%}.cdot:nth-child(1){background:#f38ba0}.cdot:nth-child(2){background:#f5c26b}.cdot:nth-child(3){background:#7fd0a0}
.urlbar{flex:1;background:#fff;border:1px solid var(--line);border-radius:6px;font-size:11.5px;color:var(--dim);padding:4px 10px;text-align:center;max-width:340px;margin:0 auto}
.approws{padding:8px 0}
.approw{display:flex;gap:12px;align-items:center;padding:11px 20px;border-bottom:1px solid #f0f3f7;font-size:13px;color:var(--dim)}
.approw:last-child{border-bottom:none}
.approw .st{margin-left:auto;font-size:11px;color:hsl(150 55% 40%);background:hsl(150 55% 40% / .1);padding:3px 9px;border-radius:99px;font-weight:600}
.approw .who{color:var(--txt);font-weight:600;white-space:nowrap}
section{padding:76px 0}
.lead{text-align:center;color:var(--dim);max-width:540px;margin:12px auto 46px;line-height:1.7;font-size:15.5px}
.featrow{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;padding:44px 0}
@media(max-width:760px){.featrow{grid-template-columns:1fr}}
.featrow h3{font-size:22px;margin-bottom:12px;letter-spacing:-.01em}
.featrow p{color:var(--dim);font-size:15px;line-height:1.75}
.featrow .side{background:var(--panel);border-radius:12px;padding:34px;text-align:center;box-shadow:0 6px 18px rgba(50,50,93,.08)}
.featrow .side .big{font-size:44px;font-weight:700;color:var(--acc)}
.featrow .side .cap{color:var(--dim);font-size:12.5px;margin-top:6px;letter-spacing:.06em;text-transform:uppercase}
.quote{background:#0a2540;color:#fff;padding:84px 0;text-align:center}
.quote blockquote{font-size:clamp(20px,2.8vw,28px);font-weight:600;letter-spacing:-.015em;max-width:720px;margin:0 auto;line-height:1.45}
.quote cite{display:block;margin-top:22px;color:#8aa4c8;font-style:normal;font-size:14px}
.band{text-align:center;padding:70px 0 8px}
.band p{color:var(--dim);margin:10px 0 24px}
.wl form{display:flex;gap:10px;max-width:440px;margin:0 auto}
.wl input{flex:1}
.pagehead{padding:72px 0 4px;text-align:center}
.pagehead h1{font-size:clamp(28px,3.8vw,42px)}
.calcwrap{background:var(--panel);border-radius:14px;padding:38px;box-shadow:0 6px 18px rgba(50,50,93,.08)}
.calcout{border:none;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(50,50,93,.08)}
.pricebox{border:none;border-radius:14px;box-shadow:0 12px 34px rgba(50,50,93,.12)}
.faq{max-width:620px;margin:0 auto}
.center{text-align:center}`;
    },
    index(C) {
      const rows = C.ticker.slice(0, 4).map((t) => {
        const [who, ...rest] = t.split(' ');
        return `<div class="approw"><span class="who">${t.split(' ').slice(0, 2).join(' ')}</span><span>${t.split(' ').slice(2).join(' ')}</span><span class="st">done</span></div>`;
      }).join('');
      return `<div class="wrap">
<section class="hero">
<div class="eyebrow">Run entirely by an AI org</div>
<h1>${C.tagline}</h1>
<p class="sub">${C.product}</p>
<div class="ctas"><a class="btn" href="pricing.html">Start now</a><a class="btn ghost" href="demo.html">See the numbers</a></div>
<div class="browser reveal">
<div class="chrome"><span class="cdot"></span><span class="cdot"></span><span class="cdot"></span><div class="urlbar">${C.logoA.toLowerCase()}.com/operations — live</div></div>
<div class="approws">${rows}<div class="approw"><span class="who">Live</span><span class="tk">${C.ticker[0]}</span></div></div>
</div>
</section>
${C.features.slice(0, 3).map((f, i) => `<div class="featrow reveal" ${i % 2 ? 'style="direction:rtl"' : ''}><div style="direction:ltr"><h3>${f.t}</h3><p>${f.p}</p></div><div class="side" style="direction:ltr"><div class="big">${['24/7', '140+', '94s'][i]}</div><div class="cap">${['always operating', 'tasks per week', 'median reply'][i]}</div></div></div>`).join('')}
</div>
<div class="quote reveal"><div class="wrap"><blockquote>"We didn't hire a team to build ${C.name}. The CEO is an AI — and it hired its own C-suite."</blockquote><cite>— the launch plan, written by the CMO (also an AI)</cite></div></div>
<div class="wrap"><div class="band wl reveal"><h2>Get early access</h2><p>Join the waitlist — the CMO will be in touch (yes, really).</p>${waitlistHtml()}</div></div>`;
    },
    features(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Features</div><h1>Everything the AI org handles</h1></div>
${C.features.map((f, i) => `<div class="featrow reveal" ${i % 2 ? 'style="direction:rtl"' : ''}><div style="direction:ltr"><h3>${f.t}</h3><p>${f.p}</p></div><div class="side" style="direction:ltr"><div class="big">0${i + 1}</div><div class="cap">${C.steps[i % 3].t}</div></div></div>`).join('')}
</div>`;
    },
    demo(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Demo</div><h1>What does the manual way cost you?</h1><p class="lead">Drag the sliders — the math updates live.</p></div>
<section style="padding-top:20px"><div class="calcwrap reveal">${calcHtml(C)}</div>
<div class="center" style="margin-top:34px"><a class="btn" href="pricing.html">Worth it? See pricing</a></div></section>
</div>`;
    },
    pricing(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Pricing</div><h1>Simple pricing</h1><p class="lead">One plan. Cancel anytime.</p></div>
<section style="padding-top:20px">${priceBox(C)}</section>
</div>`;
    },
    faq(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">FAQ</div><h1>Questions, answered</h1></div>
<section style="padding-top:16px"><div class="faq">${faqList(C)}</div></section>
<div class="band wl reveal"><h2>Get early access</h2><p>Join the waitlist.</p>${waitlistHtml()}</div>
</div>`;
    },
  },

  // ---- EDITORIAL: masthead, drop-cap lede, numbered essays, pull-quote ---------
  editorial: {
    cta: 'Subscribe',
    css(hue) {
      const v = {
        bg: '#fffdf7', panel: '#fffdf7', line: '#e0d9c6', txt: '#161513', dim: '#6b655a',
        acc: `hsl(${hue % 40} 62% 34%)`, headColor: '#161513',
        font: `Georgia,'Times New Roman',serif`, headFont: `Georgia,'Times New Roman',serif`,
        btnRadius: '2px', btnBg: '#161513', btnTxt: '#fffdf7', navBg: 'rgba(255,253,247,.95)',
        navBorder: '1px solid #161513', maxw: '760px',
      };
      return coreCss(v) + priceCss + calcCss + `
h1{font-weight:400}
.masthead{text-align:center;padding:56px 0 0}
.masthead .kicker{font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
.masthead .kicker b{color:var(--acc);font-weight:600}
.masthead h1{font-size:clamp(38px,6vw,64px);line-height:1.08;margin:26px auto 0;max-width:700px}
.masthead .rule{border-top:1px solid var(--txt);margin:36px 0 0}
.lede{font-size:18.5px;line-height:1.85;color:var(--txt);margin:38px 0 0}
.lede:first-letter{font-size:64px;float:left;line-height:.85;padding:6px 10px 0 0;color:var(--acc)}
.byline{margin-top:22px;font-size:13px;color:var(--dim);font-style:italic}
.ctas{margin:34px 0 0;display:flex;gap:12px}
.essay{padding:26px 0;border-top:1px solid var(--line)}
.essay .num{font-size:12px;letter-spacing:.18em;color:var(--acc);font-weight:600}
.essay h3{font-size:23px;font-weight:400;margin:8px 0 10px}
.essay p{color:var(--dim);font-size:15.5px;line-height:1.8}
.pull{padding:64px 0;text-align:center}
.pull blockquote{font-size:clamp(22px,3vw,30px);font-style:italic;line-height:1.5;max-width:640px;margin:0 auto}
.pull cite{display:block;margin-top:18px;font-size:13px;color:var(--dim);font-style:normal;letter-spacing:.14em;text-transform:uppercase}
.subscribe{border-top:3px double var(--txt);border-bottom:3px double var(--txt);padding:44px 0;text-align:center;margin:30px 0 10px}
.subscribe h2{font-size:26px;font-weight:400}
.subscribe p{color:var(--dim);margin:10px 0 22px;font-style:italic;font-size:15px}
.wl form{display:flex;gap:10px;max-width:420px;margin:0 auto}
.wl input{flex:1}
.pagehead{padding:64px 0 8px;text-align:center}
.pagehead .kicker{font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--acc);font-weight:600}
.pagehead h1{font-size:clamp(30px,4.4vw,46px);margin-top:14px}
.pagehead .lead{color:var(--dim);font-style:italic;margin-top:14px;font-size:15.5px}
section{padding:44px 0}
.calcwrap{border:1px solid var(--txt);padding:36px;margin-top:10px}
.calcout{border:1px solid var(--line);background:var(--bg)}
.pricebox{border:3px double var(--txt)}
.stat-inline{display:flex;justify-content:space-between;border-top:1px solid var(--txt);border-bottom:1px solid var(--txt);padding:20px 0;margin-top:44px}
.stat-inline div{text-align:center;flex:1}
.stat-inline .n{font-size:30px}
.stat-inline .l{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin-top:4px}
.center{text-align:center}
.faq{max-width:640px;margin:0 auto}`;
    },
    index(C) {
      return `<div class="wrap">
<div class="masthead">
<div class="kicker">Vol. 1 — <b>${C.name}</b> — an AI-run company</div>
<h1>${C.tagline}</h1>
<div class="rule"></div>
</div>
<p class="lede">${C.product} It is founded, staffed, and operated by artificial employees — a chief executive that hired its own chief officers, who in turn hired their own specialists.</p>
<div class="byline">Reported live by the org itself · <span class="tk">${C.ticker[0]}</span></div>
<div class="ctas"><a class="btn" href="pricing.html">Subscribe</a><a class="btn ghost" href="demo.html">Run the numbers</a></div>
<div class="stat-inline reveal">
<div><div class="n" data-n="${C.nAgents}">0</div><div class="l">AI employees</div></div>
<div><div class="n" data-n="140" data-suf="+">0</div><div class="l">Tasks weekly</div></div>
<div><div class="n" data-n="99.9" data-suf="%">0</div><div class="l">Uptime</div></div>
</div>
<section>
${C.features.slice(0, 3).map((f, i) => `<div class="essay reveal"><div class="num">No. ${i + 1}</div><h3>${f.t}</h3><p>${f.p}</p></div>`).join('')}
<div class="center" style="margin-top:26px"><a class="btn ghost" href="features.html">Continue reading</a></div>
</section>
<div class="pull reveal"><blockquote>"We didn't hire a team to build ${C.name}. The chief executive is an AI — and it hired its own C-suite."</blockquote><cite>The launch plan</cite></div>
<div class="subscribe wl reveal"><h2>Get early access</h2><p>Join the list — the head of growth will write to you personally. It types fast.</p>${waitlistHtml()}</div>
</div>`;
    },
    features(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="kicker">Features</div><h1>Everything the org handles</h1><p class="lead">An inventory of the work you will never do again.</p></div>
<section>
${C.features.map((f, i) => `<div class="essay reveal"><div class="num">No. ${i + 1}</div><h3>${f.t}</h3><p>${f.p}</p></div>`).join('')}
</section>
<section style="padding-top:0">
${C.steps.map((s, i) => `<div class="essay reveal"><div class="num">Step ${i + 1}</div><h3>${s.t}</h3><p>${s.p}</p></div>`).join('')}
</section>
</div>`;
    },
    demo(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="kicker">The arithmetic</div><h1>What does the manual way cost you?</h1><p class="lead">Drag the sliders — the figures update as you read.</p></div>
<section><div class="calcwrap reveal">${calcHtml(C)}</div>
<div class="center" style="margin-top:30px"><a class="btn" href="pricing.html">Worth it? See pricing</a></div></section>
</div>`;
    },
    pricing(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="kicker">Rates</div><h1>Simple pricing</h1><p class="lead">One plan. Cancel anytime — no retention theater.</p></div>
<section>${priceBox(C)}</section>
</div>`;
    },
    faq(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="kicker">Correspondence</div><h1>Questions, answered</h1><p class="lead">By the support desk, naturally.</p></div>
<section><div class="faq">${faqList(C)}</div></section>
<div class="subscribe wl reveal"><h2>Get early access</h2><p>Join the list.</p>${waitlistHtml()}</div>
</div>`;
    },
  },

  // ---- SWISS: poster hero, giant numbers, feature TABLE, black CTA band --------
  swiss: {
    cta: 'Start',
    css(hue) {
      const v = {
        bg: '#f4f4f0', panel: '#f4f4f0', line: '#141414', txt: '#141414', dim: '#4e4e4a',
        acc: `hsl(${hue} 82% 46%)`, headColor: '#141414',
        font: `Helvetica,'Helvetica Neue',Arial,sans-serif`, headFont: `Helvetica,'Helvetica Neue',Arial,sans-serif`,
        btnRadius: '0', btnBg: '#141414', btnTxt: '#f4f4f0', navBg: '#f4f4f0',
        navBorder: '2px solid #141414', ghostBorder: '#141414',
      };
      return coreCss(v) + calcCss + `
h1{font-size:clamp(44px,8vw,86px);font-weight:800;letter-spacing:-.035em;line-height:.98;text-transform:uppercase}
h2{font-size:clamp(22px,3vw,32px);font-weight:800;letter-spacing:-.02em;text-transform:uppercase}
.hero{padding:72px 0 0}
.accbar{width:120px;height:14px;background:var(--acc);margin-bottom:34px}
.herogrid{display:grid;grid-template-columns:2fr 1fr;gap:44px;margin-top:34px;align-items:end}
@media(max-width:760px){.herogrid{grid-template-columns:1fr}}
.sub{color:var(--dim);font-size:16px;line-height:1.7;max-width:460px}
.metafacts{font-size:12.5px;border-top:1px solid var(--txt);padding-top:12px}
.metafacts div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)}
.ctas{margin-top:36px;display:flex;gap:12px}
.bignums{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin:72px 0 0}
@media(max-width:700px){.bignums{grid-template-columns:1fr}}
.bignums>div{border-top:2px solid var(--txt);padding-top:14px}
.bignums .n{font-size:clamp(48px,7vw,76px);font-weight:800;letter-spacing:-.03em}
.bignums .l{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);margin-top:2px}
section{padding:72px 0 0}
.secttl{display:flex;align-items:baseline;gap:16px;margin-bottom:26px}
.secttl .sq{width:13px;height:13px;background:var(--acc);flex:none;align-self:center}
.feattable{border:2px solid var(--txt)}
.frow{display:grid;grid-template-columns:70px 220px 1fr;border-bottom:1px solid var(--txt)}
.frow:last-child{border-bottom:none}
.frow>div{padding:18px;font-size:14px}
.frow .fn{border-right:1px solid var(--txt);font-weight:800}
.frow .ft{border-right:1px solid var(--txt);font-weight:700;text-transform:uppercase;font-size:13px;letter-spacing:.03em}
.frow .fd{color:var(--dim);line-height:1.6}
@media(max-width:700px){.frow{grid-template-columns:50px 1fr}.frow .fd{grid-column:1/3;border-top:1px solid var(--line)}}
.blackband{background:#141414;color:#f4f4f0;padding:64px 0;margin-top:72px}
.blackband h2{color:#f4f4f0}
.blackband p{color:#9a9a94;margin:12px 0 26px;font-size:15px}
.wl form{display:flex;gap:10px;max-width:460px}
.wl input{flex:1;background:#141414;border:1px solid #4e4e4a;color:#f4f4f0}
.blackband .btn{background:var(--acc);color:#141414;font-weight:800;text-transform:uppercase}
.pagehead{padding:64px 0 0}
.pagehead h1{font-size:clamp(34px,5.6vw,58px)}
.pagehead .lead{color:var(--dim);margin-top:18px;font-size:15.5px;max-width:520px}
.calcwrap{border:2px solid var(--txt);padding:36px;margin-top:40px}
.calcout{border:2px solid var(--txt);background:var(--bg)}
.calcout .v{color:var(--acc)}
.pricebox{border:2px solid var(--txt);max-width:420px;padding:38px;margin-top:40px}
.tog{display:flex;align-items:center;gap:12px;font-size:13.5px;color:var(--dim);margin-bottom:24px}
.sw{position:relative;width:42px;height:23px;flex:none}
.sw input{opacity:0;width:0;height:0}
.sl{position:absolute;inset:0;background:#c9c9c2;cursor:pointer;transition:.2s}
.sl:before{content:'';position:absolute;width:17px;height:17px;background:#141414;top:3px;left:3px;transition:.2s}
.sw input:checked+.sl{background:var(--acc)}.sw input:checked+.sl:before{transform:translateX(19px)}
.pr{font-size:56px;font-weight:800;letter-spacing:-.03em}.per{color:var(--dim);font-size:14px}
.pricebox ul{list-style:none;margin:26px 0;text-align:left}
.pricebox li{padding:9px 0;font-size:14px;border-bottom:1px solid var(--line)}
.pricebox li:before{content:'→  ';color:var(--acc);font-weight:800}
.faq{max-width:680px;margin-top:30px}
.qa{border-bottom:2px solid var(--txt)}
.center{text-align:center}`;
    },
    index(C) {
      return `<div class="wrap">
<section class="hero">
<div class="accbar"></div>
<h1>${C.tagline}</h1>
<div class="herogrid">
<div><p class="sub">${C.product}</p>
<div class="ctas"><a class="btn" href="pricing.html">Start</a><a class="btn ghost" href="demo.html">The numbers</a></div></div>
<div class="metafacts">
<div><span>AI employees</span><b>${C.nAgents}</b></div>
<div><span>Uptime</span><b>99.9%</b></div>
<div><span>Live</span><b class="tk" style="max-width:170px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${C.ticker[0]}</b></div>
</div>
</div>
<div class="bignums">
<div class="reveal"><div class="n" data-n="${C.nAgents}">0</div><div class="l">AI employees</div></div>
<div class="reveal"><div class="n" data-n="140" data-suf="+">0</div><div class="l">Tasks / week</div></div>
<div class="reveal"><div class="n" data-n="94" data-suf="s">0</div><div class="l">Median reply</div></div>
</div>
</section>
<section>
<div class="secttl"><span class="sq"></span><h2>What it handles</h2></div>
<div class="feattable reveal">
${C.features.slice(0, 4).map((f, i) => `<div class="frow"><div class="fn">0${i + 1}</div><div class="ft">${f.t}</div><div class="fd">${f.p}</div></div>`).join('')}
</div>
<div style="margin-top:22px"><a class="btn ghost" href="features.html">Full inventory →</a></div>
</section>
</div>
<div class="blackband"><div class="wrap wl"><h2>Get early access</h2><p>Join the waitlist — the head of growth will be in touch.</p>${waitlistHtml()}</div></div>`;
    },
    features(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="accbar"></div><h1>The full inventory</h1><p class="lead">Every function, executed by the org.</p></div>
<section style="padding-top:40px">
<div class="feattable reveal">
${C.features.map((f, i) => `<div class="frow"><div class="fn">0${i + 1}</div><div class="ft">${f.t}</div><div class="fd">${f.p}</div></div>`).join('')}
</div>
</section>
<section>
<div class="secttl"><span class="sq"></span><h2>Method</h2></div>
<div class="feattable reveal">
${C.steps.map((s, i) => `<div class="frow"><div class="fn">${i + 1}</div><div class="ft">${s.t}</div><div class="fd">${s.p}</div></div>`).join('')}
</div>
</section>
</div>`;
    },
    demo(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="accbar"></div><h1>The cost of manual</h1><p class="lead">Drag the sliders. The figures update live.</p></div>
<div class="calcwrap reveal">${calcHtml(C)}</div>
<div style="margin-top:30px"><a class="btn" href="pricing.html">See pricing →</a></div>
</div>`;
    },
    pricing(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="accbar"></div><h1>One plan</h1><p class="lead">Cancel anytime. No theater.</p></div>
${priceBox(C)}
</div>`;
    },
    faq(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="accbar"></div><h1>Questions</h1></div>
<div class="faq">${faqList(C)}</div>
</div>
<div class="blackband"><div class="wrap wl"><h2>Get early access</h2><p>Join the waitlist.</p>${waitlistHtml()}</div></div>`;
    },
  },

  // ---- TERMINAL: terminal-window hero, key:value stats, man-page flags ---------
  terminal: {
    cta: '[ start ]',
    css() {
      const v = {
        bg: '#0b0e13', panel: '#11151c', line: '#242b36', txt: '#e6edf3', dim: '#7d8590',
        acc: 'hsl(140 55% 52%)', headColor: '#e6edf3',
        font: `'SF Mono',ui-monospace,Menlo,Consolas,monospace`, headFont: `'SF Mono',ui-monospace,Menlo,Consolas,monospace`,
        btnRadius: '6px', btnBg: 'hsl(140 55% 42%)', btnTxt: '#0b0e13', navBg: 'rgba(11,14,19,.94)',
        maxw: '880px',
      };
      return coreCss(v) + calcCss + `
h1{font-size:clamp(26px,4vw,40px);font-weight:600;letter-spacing:-.02em;line-height:1.2}
h2{font-size:19px;font-weight:600}
h2:before{content:'## ';color:var(--dim)}
.hero{padding:72px 0 0}
.prompt{color:var(--dim);font-size:13px;margin-bottom:16px}
.prompt b{color:var(--acc);font-weight:600}
.sub{margin-top:18px;color:var(--dim);font-size:14.5px;line-height:1.8;max-width:640px}
.sub:before{content:'$ ';color:var(--acc)}
.ctas{margin-top:30px;display:flex;gap:12px;flex-wrap:wrap}
.term{margin-top:48px;background:#0d1117;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.tbar{background:#161b22;padding:9px 14px;display:flex;gap:7px;align-items:center;border-bottom:1px solid var(--line)}
.tdot{width:11px;height:11px;border-radius:50%}.tdot:nth-child(1){background:#f85149}.tdot:nth-child(2){background:#d29922}.tdot:nth-child(3){background:#3fb950}
.tbar span{margin-left:10px;color:var(--dim);font-size:12px}
.tbody{padding:20px;font-size:13px;line-height:2}
.tbody .cmd{color:var(--txt)}
.tbody .cmd:before{content:'$ ';color:var(--acc)}
.tbody .out{color:var(--dim)}
.tbody .ok:before{content:'✓ ';color:var(--acc)}
.cursor{display:inline-block;width:8px;height:15px;background:var(--acc);vertical-align:middle;animation:blink 1.1s step-end infinite}
@keyframes blink{50%{opacity:0}}
.kv{margin-top:56px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:22px 26px;font-size:13.5px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
@media(max-width:640px){.kv{grid-template-columns:1fr}}
.kv div span{color:var(--dim)}
.kv div b{color:var(--acc);font-weight:600}
section{padding:60px 0 0}
.lead{color:var(--dim);font-size:14px;margin:12px 0 30px;line-height:1.8}
.lead:before{content:'$ ';color:var(--acc)}
.flags{border:1px solid var(--line);border-radius:8px;overflow:hidden}
.flag{display:grid;grid-template-columns:230px 1fr;border-bottom:1px solid var(--line);background:var(--panel)}
.flag:last-child{border-bottom:none}
.flag .fname{padding:16px 20px;color:var(--acc);font-size:13.5px;border-right:1px solid var(--line)}
.flag .fdesc{padding:16px 20px;color:var(--dim);font-size:13.5px;line-height:1.7}
@media(max-width:640px){.flag{grid-template-columns:1fr}.flag .fname{border-right:none;padding-bottom:0}}
.band{margin-top:64px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:36px}
.band p{color:var(--dim);font-size:13.5px;margin:8px 0 20px}
.band p:before{content:'$ join --waitlist '}
.wl form{display:flex;gap:10px;max-width:480px}
.wl input{flex:1}
.pagehead{padding:64px 0 0}
.pagehead h1:before{content:'> ';color:var(--acc)}
.calcwrap{margin-top:36px;border:1px solid var(--line);border-radius:8px;background:var(--panel);padding:32px}
.calcout{border:1px solid var(--line);background:var(--bg);border-radius:8px}
.pricebox{border:1px solid var(--line);border-radius:8px;background:var(--panel);max-width:420px;padding:36px;margin-top:36px}
.tog{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--dim);margin-bottom:22px}
.sw{position:relative;width:42px;height:23px;flex:none}
.sw input{opacity:0;width:0;height:0}
.sl{position:absolute;inset:0;background:var(--line);border-radius:99px;cursor:pointer;transition:.2s}
.sl:before{content:'';position:absolute;width:17px;height:17px;border-radius:50%;background:#e6edf3;top:3px;left:3px;transition:.2s}
.sw input:checked+.sl{background:var(--acc)}.sw input:checked+.sl:before{transform:translateX(19px)}
.pr{font-size:44px;font-weight:600}.per{color:var(--dim);font-size:13px}
.pricebox ul{list-style:none;margin:24px 0;text-align:left}
.pricebox li{padding:8px 0;color:var(--dim);font-size:13px;border-bottom:1px solid var(--line)}
.pricebox li:before{content:'-- ';color:var(--acc)}
.faq{margin-top:30px}
.q{font-size:13.5px}.q:before{content:'? ';color:var(--acc)}
.a{font-size:13px}`;
    },
    index(C) {
      const logLines = C.ticker.slice(0, 4).map((t) => `<div class="out ok">${t}</div>`).join('');
      return `<div class="wrap">
<section class="hero">
<div class="prompt">~/foundry/portfolio/<b>${C.logoA.toLowerCase()}</b></div>
<h1>${C.tagline}</h1>
<p class="sub">${C.product}</p>
<div class="ctas"><a class="btn" href="pricing.html">[ get started ]</a><a class="btn ghost" href="demo.html">[ run the numbers ]</a></div>
<div class="term reveal">
<div class="tbar"><span class="tdot"></span><span class="tdot"></span><span class="tdot"></span><span>${C.logoA.toLowerCase()} — org · live</span></div>
<div class="tbody">
<div class="cmd">${C.logoA.toLowerCase()} start --autonomous</div>
<div class="out">booting AI org… ${C.nAgents} agents online</div>
${logLines}
<div class="out"><span class="tk">${C.ticker[0]}</span></div>
<div class="cmd">&nbsp;<span class="cursor"></span></div>
</div>
</div>
<div class="kv reveal">
<div><span>agents:</span> <b data-n="${C.nAgents}">0</b></div>
<div><span>tasks_per_week:</span> <b data-n="140" data-suf="+">0</b></div>
<div><span>uptime:</span> <b data-n="99.9" data-suf="%">0</b></div>
</div>
</section>
<section>
<h2>capabilities</h2>
<div class="flags reveal">
${C.features.slice(0, 4).map((f) => `<div class="flag"><div class="fname">--${f.t.toLowerCase().replace(/[^a-z]+/g, '-')}</div><div class="fdesc">${f.p}</div></div>`).join('')}
</div>
<div style="margin-top:20px"><a class="btn ghost" href="features.html">[ man ${C.logoA.toLowerCase()} ]</a></div>
</section>
<div class="band wl reveal"><h2>early access</h2><p>you@company.com</p>${waitlistHtml()}</div>
</div>`;
    },
    features(C) {
      return `<div class="wrap">
<div class="pagehead"><h1>man ${C.logoA.toLowerCase()}</h1><p class="lead">every capability, documented</p></div>
<section style="padding-top:32px">
<div class="flags reveal">
${C.features.map((f) => `<div class="flag"><div class="fname">--${f.t.toLowerCase().replace(/[^a-z]+/g, '-')}</div><div class="fdesc">${f.p}</div></div>`).join('')}
</div>
</section>
<section>
<h2>quickstart</h2>
<div class="flags reveal">
${C.steps.map((s, i) => `<div class="flag"><div class="fname">step ${i + 1}: ${s.t.toLowerCase()}</div><div class="fdesc">${s.p}</div></div>`).join('')}
</div>
</section>
</div>`;
    },
    demo(C) {
      return `<div class="wrap">
<div class="pagehead"><h1>cost --manual</h1><p class="lead">drag the sliders — output recalculates</p></div>
<div class="calcwrap reveal">${calcHtml(C)}</div>
<div style="margin-top:28px"><a class="btn" href="pricing.html">[ see pricing ]</a></div>
</div>`;
    },
    pricing(C) {
      return `<div class="wrap">
<div class="pagehead"><h1>pricing</h1><p class="lead">one plan · cancel anytime</p></div>
${priceBox(C)}
</div>`;
    },
    faq(C) {
      return `<div class="wrap">
<div class="pagehead"><h1>faq</h1><p class="lead">answered by the support agent</p></div>
<div class="faq">${faqList(C)}</div>
<div class="band wl reveal"><h2>early access</h2><p>you@company.com</p>${waitlistHtml()}</div>
</div>`;
    },
  },

  // ---- WARM: narrow centered column, serif display, checklist card -------------
  warm: {
    cta: 'Join',
    css(hue) {
      const acc = `hsl(${16 + (hue % 24)} 66% 46%)`;
      const v = {
        bg: '#faf9f5', panel: '#ffffff', line: '#e9e4da', txt: '#1a1915', dim: '#6f6a5f',
        acc, headColor: '#1a1915',
        font: `-apple-system,'Segoe UI',sans-serif`, headFont: `Georgia,'Times New Roman',serif`,
        btnRadius: '10px', btnBg: '#1a1915', btnTxt: '#faf9f5', navBg: 'rgba(250,249,245,.94)',
        maxw: '680px',
      };
      return coreCss(v) + priceCss + calcCss + `
h1{font-size:clamp(32px,5vw,48px);font-weight:500;letter-spacing:-.02em;line-height:1.15}
h2{font-size:clamp(21px,2.6vw,27px);font-weight:500}
.hero{text-align:center;padding:88px 0 30px}
.hero h1{margin:0 auto}
.eyebrow{font-size:12.5px;color:var(--acc);font-weight:600;margin-bottom:20px}
.sub{margin:20px auto 0;max-width:540px;color:var(--dim);font-size:16.5px;line-height:1.75}
.ctas{margin-top:30px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.livecard{margin:44px auto 0;max-width:480px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 20px;font-size:13px;color:var(--dim);display:flex;gap:10px;align-items:center;box-shadow:0 1px 3px rgba(26,25,21,.05)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--acc);animation:pulse 1.8s infinite;flex:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.trio{display:flex;justify-content:center;gap:44px;margin-top:48px;flex-wrap:wrap}
.trio div{text-align:center}
.trio .n{font-size:26px;font-weight:600;font-family:Georgia,serif}
.trio .l{font-size:12px;color:var(--dim);margin-top:3px}
section{padding:58px 0 0}
.lead{text-align:center;color:var(--dim);margin:10px auto 34px;line-height:1.7;font-size:15px;max-width:480px}
.checkcard{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 26px;box-shadow:0 1px 3px rgba(26,25,21,.05)}
.check{display:flex;gap:14px;padding:17px 0;border-bottom:1px solid var(--line);align-items:baseline}
.check:last-child{border-bottom:none}
.check .tick{color:var(--acc);font-weight:700;flex:none}
.check b{font-size:14.5px}
.check span{color:var(--dim);font-size:14px;line-height:1.6}
.quotecard{margin-top:56px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:38px;text-align:center;box-shadow:0 1px 3px rgba(26,25,21,.05)}
.quotecard blockquote{font-family:Georgia,serif;font-size:19px;line-height:1.6;font-style:italic}
.quotecard cite{display:block;margin-top:16px;color:var(--dim);font-size:13px;font-style:normal}
.band{margin-top:56px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:40px;text-align:center;box-shadow:0 1px 3px rgba(26,25,21,.05)}
.band p{color:var(--dim);margin:10px 0 22px;font-size:14.5px}
.wl form{display:flex;gap:10px;max-width:420px;margin:0 auto}
.wl input{flex:1;background:var(--bg)}
.pagehead{padding:70px 0 0;text-align:center}
.pagehead h1{margin:0 auto}
.calcwrap{margin-top:36px;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:32px;box-shadow:0 1px 3px rgba(26,25,21,.05)}
.calcout{border:1px solid var(--line);background:var(--bg);border-radius:12px}
.pricebox{border-radius:14px;box-shadow:0 1px 3px rgba(26,25,21,.05);margin-top:36px}
.faq{margin-top:34px}
.center{text-align:center}`;
    },
    index(C) {
      return `<div class="wrap">
<section class="hero">
<div class="eyebrow">Run entirely by an AI org</div>
<h1>${C.tagline}</h1>
<p class="sub">${C.product}</p>
<div class="ctas"><a class="btn" href="pricing.html">Get started</a><a class="btn ghost" href="demo.html">See the numbers</a></div>
<div class="livecard"><span class="dot"></span><span class="tk">${C.ticker[0]}</span></div>
<div class="trio">
<div class="reveal"><div class="n" data-n="${C.nAgents}">0</div><div class="l">AI employees</div></div>
<div class="reveal"><div class="n" data-n="140" data-suf="+">0</div><div class="l">tasks / week</div></div>
<div class="reveal"><div class="n" data-n="99.9" data-suf="%">0</div><div class="l">uptime</div></div>
</div>
</section>
<section>
<h2 class="center reveal">What it takes off your plate</h2>
<p class="lead reveal">A team that never sleeps, never forgets, and never pads an invoice.</p>
<div class="checkcard reveal">
${C.features.slice(0, 4).map((f) => `<div class="check"><span class="tick">—</span><div><b>${f.t}.</b> <span>${f.p}</span></div></div>`).join('')}
</div>
<div class="center" style="margin-top:26px"><a class="btn ghost" href="features.html">Everything else it does</a></div>
</section>
<div class="quotecard reveal"><blockquote>"We didn't hire a team to build ${C.name}. The CEO is an AI — and it hired its own C-suite."</blockquote><cite>— the launch plan, written by the CMO (also an AI)</cite></div>
<div class="band wl reveal"><h2>Get early access</h2><p>Join the waitlist — the CMO will be in touch (yes, really).</p>${waitlistHtml()}</div>
</div>`;
    },
    features(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Features</div><h1>Everything it does</h1><p class="lead">The full checklist.</p></div>
<section style="padding-top:30px">
<div class="checkcard reveal">
${C.features.map((f) => `<div class="check"><span class="tick">—</span><div><b>${f.t}.</b> <span>${f.p}</span></div></div>`).join('')}
</div>
</section>
<section>
<h2 class="center reveal">How it works</h2>
<div class="checkcard reveal" style="margin-top:26px">
${C.steps.map((s, i) => `<div class="check"><span class="tick">${i + 1}.</span><div><b>${s.t}.</b> <span>${s.p}</span></div></div>`).join('')}
</div>
</section>
</div>`;
    },
    demo(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Demo</div><h1>What does the manual way cost?</h1><p class="lead">Drag the sliders — the math updates live.</p></div>
<div class="calcwrap reveal">${calcHtml(C)}</div>
<div class="center" style="margin-top:30px"><a class="btn" href="pricing.html">Worth it? See pricing</a></div>
</div>`;
    },
    pricing(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">Pricing</div><h1>Simple pricing</h1><p class="lead">One plan. Cancel anytime.</p></div>
${priceBox(C)}
</div>`;
    },
    faq(C) {
      return `<div class="wrap">
<div class="pagehead"><div class="eyebrow">FAQ</div><h1>Questions, answered</h1></div>
<div class="faq">${faqList(C)}</div>
<div class="band wl reveal"><h2>Get early access</h2><p>Join the waitlist.</p>${waitlistHtml()}</div>
</div>`;
    },
  },
};

module.exports = { buildSiteHtml };
