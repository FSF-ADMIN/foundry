// The product engineer's app generator (mock mode). Unlike site-builder (the
// marketing site), this ships the PRODUCT: a genuinely working single-file web
// application — records CRUD with localStorage persistence, computed dashboard
// KPIs, activity feed, and a feature set that grows with every product-update:
//
//   v1  core workspace: records, dashboard, activity
//   v2  + 7-day activity chart
//   v3  + automations (real rules applied to the data)
//   v4  + reports & JSON export
//   v5  + command palette (Ctrl/Cmd-K)
//   v6  + integrations panel (baked from the company's integration ledger)
//   v7+ refinement passes
//
// First line of the output is a `<!-- SHIPPED: ... -->` marker the
// orchestrator reads into the ops log.

// Domain flavor per YC RFS so sibling products don't feel identical.
const DOMAINS = {
  primer: { entity: 'Lesson', entities: 'Lessons', kpi: 'Lessons mastered', seeds: ['Phonics: blends & digraphs', 'Fractions on a number line', 'The water cycle', 'Reading: inference practice', 'Times tables sprint'] },
  'small-software-cloud': { entity: 'App', entities: 'Apps', kpi: 'Apps online', seeds: ['recipe-box', 'chore-wheel', 'plant-tracker', 'book-club-votes', 'family-calendar'] },
  'multiplayer-ai': { entity: 'Session', entities: 'Sessions', kpi: 'Live sessions', seeds: ['Q3 roadmap workshop', 'Support macro rewrite', 'Pricing page brainstorm', 'Bug triage w/ agent', 'Launch checklist review'] },
  aging: { entity: 'Care task', entities: 'Care tasks', kpi: 'Tasks handled', seeds: ['Refill blood-pressure meds', 'Cardiology visit 10am Tue', 'Call from Sarah (weekly)', 'Grocery delivery setup', 'PT exercises — morning'] },
  compliance: { entity: 'Control', entities: 'Controls', kpi: 'Controls passing', seeds: ['Access reviews — quarterly', 'Encryption at rest', 'Vendor risk: new CRM', 'Incident response drill', 'Employee offboarding'] },
  'self-maintaining-apis': { entity: 'Endpoint', entities: 'Endpoints', kpi: 'Endpoints healthy', seeds: ['GET /v2/invoices', 'POST /v2/payments', 'GET /v2/customers', 'webhooks/delivery', 'GET /v2/reports/daily'] },
  defense: { entity: 'Mission task', entities: 'Mission tasks', kpi: 'Tasks cleared', seeds: ['Sensor feed triage', 'Supply route re-plan', 'Maintenance forecast', 'Comms window schedule', 'After-action summary'] },
  'consumer-ai': { entity: 'Routine', entities: 'Routines', kpi: 'Routines active', seeds: ['Morning briefing 7am', 'Meal plan for the week', 'Commute re-router', 'Budget check-in', 'Language practice 10min'] },
  'physical-os': { entity: 'Work order', entities: 'Work orders', kpi: 'Orders closed', seeds: ['Dock 3 sensor swap', 'Forklift battery rotation', 'Cold-room temp audit', 'Pallet re-slotting', 'Night-shift walkthrough'] },
  crypto: { entity: 'Position', entities: 'Positions', kpi: 'Positions tracked', seeds: ['Treasury: USDC ladder', 'Payroll stream #14', 'LP: stable pool', 'Invoice escrow #88', 'Gas budget monitor'] },
  'real-world-data': { entity: 'Dataset', entities: 'Datasets', kpi: 'Datasets fresh', seeds: ['Retail shelf photos — west', 'Traffic counts: 5th Ave', 'Crop moisture — plot 12', 'Warehouse scan pass', 'Sidewalk audit batch'] },
  'proof-of-human': { entity: 'Verification', entities: 'Verifications', kpi: 'Humans verified', seeds: ['Signup flow — acme.com', 'Comment gate — forum', 'Ticket queue check', 'Creator payout KYC', 'Poll integrity sweep'] },
};
const DEFAULT_DOMAIN = { entity: 'Task', entities: 'Tasks', kpi: 'Tasks done', seeds: ['Kickoff checklist', 'First customer onboarding', 'Weekly metrics review', 'Support inbox sweep', 'Roadmap grooming'] };

const FEATURES = [
  'Core workspace — records, dashboard KPIs, and a live activity feed',
  'Activity chart — 7-day throughput, computed from your real data',
  'Automations — rules that actually run against your workspace',
  'Reports — summary table and one-click JSON export',
  'Command palette — hit Ctrl/Cmd-K anywhere',
  'Integrations panel — live status of every connected service',
];

function hueFor(s) {
  let h = 7;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function buildProductHtml(company) {
  const b = company.brief || {};
  const version = (company.productVersion || 0) + 1;
  const d = DOMAINS[company.rfsId] || DEFAULT_DOMAIN;
  const name = company.name || 'New Venture';
  const hue = hueFor(company.slug || company.id);
  const shipped = FEATURES[version - 1] || `Refinement pass v${version} — polish, speed, and fit-and-finish`;
  const slug = company.slug || company.id;
  const integrations = (company.integrations || []).map((i) => ({ name: i.name, purpose: i.purpose || '', status: i.status }));

  const CFG = JSON.stringify({
    version,
    entity: d.entity,
    entities: d.entities,
    kpi: d.kpi,
    seeds: d.seeds,
    name,
    tagline: b.tagline || 'A business that runs itself.',
    slug,
    integrations,
  });

  // NOTE: the generated app's own JS avoids template literals so this file
  // can wrap it in one big template string without escaping games.
  return `<!-- SHIPPED: ${shipped} -->
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} — App</title>
<style>
:root{--h:${hue};--bg:#0b0e13;--panel:#11151d;--panel2:#151b26;--line:#202836;--txt:#edf1f7;--dim:#8b95a7;
--acc:hsl(var(--h) 85% 62%);--acc-soft:hsl(var(--h) 85% 62% / .13);--ok:#58c48a;--warn:#d5a044}
*{margin:0;box-sizing:border-box}
body{font-family:Inter,-apple-system,'Segoe UI',sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;-webkit-font-smoothing:antialiased}
.app{display:flex;min-height:100vh}
.side{width:220px;flex-shrink:0;border-right:1px solid var(--line);padding:20px 12px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh}
.logo{display:flex;align-items:center;gap:9px;padding:0 10px 18px;font-weight:800;font-size:16px;letter-spacing:-.02em}
.logo .dot{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,hsl(var(--h) 80% 55%),hsl(var(--h) 80% 68%));flex-shrink:0}
.logo small{display:block;font-weight:500;font-size:10px;color:var(--dim)}
.side a{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:9px;color:var(--dim);font-size:13.5px;font-weight:500;text-decoration:none;cursor:pointer}
.side a:hover{color:var(--txt);background:var(--panel)}
.side a.on{color:var(--txt);background:var(--panel2)}
.side a .b{margin-left:auto;font-size:10px;background:var(--acc-soft);color:var(--acc);border-radius:99px;padding:2px 7px;font-weight:700}
.side .foot{margin-top:auto;padding:10px;font-size:10.5px;color:var(--dim);line-height:1.6}
.vtag{display:inline-block;background:var(--acc-soft);color:var(--acc);border-radius:99px;padding:2px 9px;font-weight:700;font-size:10.5px}
.main{flex:1;min-width:0;padding:26px 30px 50px;max-width:1080px}
h1{font-size:20px;letter-spacing:-.3px;margin-bottom:4px}
.sub{color:var(--dim);font-size:13px;margin-bottom:22px}
.view{display:none}.view.on{display:block}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:15px 16px}
.card .n{font-size:23px;font-weight:800}
.card .l{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-top:3px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:16px}
.panel h3{font-size:11.5px;text-transform:uppercase;letter-spacing:1.4px;color:var(--dim);margin-bottom:12px}
input[type=text]{background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:10px 13px;color:var(--txt);font-size:13.5px;font-family:inherit}
input[type=text]:focus{outline:none;border-color:var(--acc)}
button{border:none;font-weight:600;padding:10px 15px;border-radius:9px;cursor:pointer;font-size:13px;font-family:inherit;background:var(--acc);color:#fff}
button.ghost{background:var(--panel2);color:var(--txt);border:1px solid var(--line)}
.addrow{display:flex;gap:9px;margin-bottom:14px}
.addrow input{flex:1}
.tabs{display:flex;gap:7px;margin-bottom:13px;flex-wrap:wrap}
.tab{background:var(--panel2);border:1px solid var(--line);color:var(--dim);font-size:12px;font-weight:600;padding:6px 13px;border-radius:99px;cursor:pointer}
.tab.on{color:var(--acc);border-color:var(--acc);background:var(--acc-soft)}
.item{display:flex;align-items:center;gap:11px;padding:10px 4px;border-bottom:1px solid var(--line);font-size:13.5px}
.item:last-child{border-bottom:none}
.item input[type=checkbox]{width:16px;height:16px;accent-color:var(--acc);cursor:pointer}
.item .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.item.done .t{color:var(--dim);text-decoration:line-through}
.item .pr{font-size:10.5px;font-weight:700;border-radius:99px;padding:3px 9px;cursor:pointer;border:1px solid var(--line);color:var(--dim);background:none}
.item .pr.high{color:#ff8b7a;border-color:#ff8b7a55}
.item .del{background:none;border:none;color:var(--dim);cursor:pointer;font-size:15px;padding:2px 7px}
.item .del:hover{color:#ff8b7a}
.feed div{display:flex;gap:9px;padding:6px 0;font-size:12.5px;color:var(--dim);align-items:baseline}
.feed .dt{width:6px;height:6px;border-radius:99px;background:var(--acc);flex-shrink:0;position:relative;top:-1px}
.feed .w{margin-left:auto;font-size:11px;color:#5c6675;white-space:nowrap}
.chart{display:flex;gap:7px;align-items:flex-end;height:110px;padding-top:6px}
.chart .bar{flex:1;background:linear-gradient(180deg,hsl(var(--h) 80% 60%),hsl(var(--h) 70% 45%));border-radius:6px 6px 2px 2px;min-height:4px;position:relative}
.chart .bar span{position:absolute;top:-19px;left:0;right:0;text-align:center;font-size:10.5px;color:var(--dim)}
.chart .bar em{position:absolute;bottom:-20px;left:0;right:0;text-align:center;font-size:10px;color:#5c6675;font-style:normal}
.rule{display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--line);font-size:13px}
.rule:last-child{border-bottom:none}
.rule .d{color:var(--dim);font-size:11.5px}
.sw{margin-left:auto;width:38px;height:21px;border-radius:99px;background:var(--line);position:relative;cursor:pointer;flex-shrink:0;transition:.15s}
.sw.on{background:var(--acc)}
.sw::after{content:'';position:absolute;top:2.5px;left:3px;width:16px;height:16px;border-radius:99px;background:#fff;transition:.15s}
.sw.on::after{left:19px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:var(--dim);font-size:10.5px;text-transform:uppercase;letter-spacing:1px;padding:7px 4px;border-bottom:1px solid var(--line)}
td{padding:9px 4px;border-bottom:1px solid var(--line)}
tr:last-child td{border-bottom:none}
.chipline{display:flex;flex-wrap:wrap;gap:8px}
.ichip{display:flex;align-items:center;gap:7px;font-size:12.5px;padding:7px 13px;border-radius:9px;border:1px solid var(--line);background:var(--panel2)}
.ichip .st{width:7px;height:7px;border-radius:99px;background:var(--warn)}
.ichip.connected .st{background:var(--ok)}
.pal{position:fixed;inset:0;background:rgba(4,7,12,.7);display:none;align-items:flex-start;justify-content:center;padding-top:14vh;z-index:50}
.pal.on{display:flex}
.pal .box{background:var(--panel);border:1px solid var(--line);border-radius:14px;width:min(520px,90vw);overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)}
.pal input{width:100%;border:none;background:var(--panel2);padding:14px 16px;font-size:14px;color:var(--txt);border-radius:0}
.pal .opt{padding:11px 16px;font-size:13px;cursor:pointer;border-top:1px solid var(--line)}
.pal .opt:hover,.pal .opt.sel{background:var(--panel2);color:var(--acc)}
.hint{font-size:11.5px;color:var(--dim);margin-top:10px}
.empty{color:var(--dim);font-size:13px;padding:20px;text-align:center}
@media(max-width:760px){.side{display:none}.main{padding:18px 14px}}
</style>
</head>
<body>
<div class="app">
  <nav class="side" id="nav"></nav>
  <main class="main" id="main"></main>
</div>
<div class="pal" id="pal"><div class="box"><input id="palIn" placeholder="Type a command…"><div id="palOpts"></div></div></div>
<script>
var CFG=${CFG};
var KEY='foundry.product.'+CFG.slug;
var state=null;

function load(){
  try{state=JSON.parse(localStorage.getItem(KEY))}catch(e){state=null}
  if(!state||!state.items){
    var now=Date.now();
    state={items:CFG.seeds.map(function(t,i){return{id:'it'+i,title:t,done:i===0,priority:i===1?'high':'normal',createdAt:now-(i+1)*36e5*7,doneAt:i===0?now-36e5*3:null}}),
      rules:{archive:false,urgent:true},activity:[{t:'Workspace created by the AI dev team',at:now-864e5}],ws:CFG.name,nextId:100};
    save();
  }
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function logAct(t){state.activity.unshift({t:t,at:Date.now()});state.activity=state.activity.slice(0,30);save()}
function ago(at){var s=(Date.now()-at)/1e3;if(s<60)return'just now';if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago'}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

var VIEW='dash',FILTER='all',V=CFG.version;
var NAVS=[['dash','Dashboard'],['items',CFG.entities]];
if(V>=3)NAVS.push(['auto','Automations']);
if(V>=4)NAVS.push(['rep','Reports']);
if(V>=6)NAVS.push(['int','Integrations']);
NAVS.push(['set','Settings']);

function runRules(){
  if(V<3)return;
  var changed=0;
  if(state.rules.archive){
    var cut=Date.now()-7*864e5;
    var keep=state.items.filter(function(i){return!(i.done&&i.doneAt&&i.doneAt<cut)});
    changed+=state.items.length-keep.length;state.items=keep;
  }
  if(state.rules.urgent){
    state.items.forEach(function(i){if(/urgent|asap|now/i.test(i.title)&&i.priority!=='high'){i.priority='high';changed++}});
  }
  if(changed){logAct('Automations adjusted '+changed+' record'+(changed>1?'s':''));save()}
}

function render(){
  document.getElementById('nav').innerHTML=
    '<div class="logo"><div class="dot"></div><div>'+esc(state.ws||CFG.name)+'<small>'+esc(CFG.tagline)+'</small></div></div>'+
    NAVS.map(function(n){return '<a class="'+(VIEW===n[0]?'on':'')+'" onclick="go(\\''+n[0]+'\\')">'+n[1]+(n[0]==='items'?'<span class="b">'+state.items.filter(function(i){return!i.done}).length+'</span>':'')+'</a>'}).join('')+
    '<div class="foot"><span class="vtag">v'+V+'</span><br><br>Built & operated by the '+esc(CFG.name)+' AI org — a Foundry portfolio company.'+(V>=5?'<br><br>Ctrl/Cmd-K for commands.':'')+'</div>';
  var m=document.getElementById('main');
  if(VIEW==='dash')m.innerHTML=vDash();
  else if(VIEW==='items')m.innerHTML=vItems();
  else if(VIEW==='auto')m.innerHTML=vAuto();
  else if(VIEW==='rep')m.innerHTML=vRep();
  else if(VIEW==='int')m.innerHTML=vInt();
  else m.innerHTML=vSet();
}
function go(v){VIEW=v;render()}

function vDash(){
  var open=state.items.filter(function(i){return!i.done}).length;
  var done=state.items.filter(function(i){return i.done}).length;
  var high=state.items.filter(function(i){return i.priority==='high'&&!i.done}).length;
  var h='<h1>Dashboard</h1><div class="sub">'+esc(CFG.tagline)+'</div><div class="cards">'+
    '<div class="card"><div class="n">'+open+'</div><div class="l">Open '+esc(CFG.entities)+'</div></div>'+
    '<div class="card"><div class="n">'+done+'</div><div class="l">'+esc(CFG.kpi)+'</div></div>'+
    '<div class="card"><div class="n">'+high+'</div><div class="l">High priority</div></div>'+
    '<div class="card"><div class="n">'+state.activity.length+'</div><div class="l">Events</div></div></div>';
  if(V>=2){
    var days=[],max=1;
    for(var d=6;d>=0;d--){
      var day=new Date();day.setHours(0,0,0,0);day.setDate(day.getDate()-d);
      var next=day.getTime()+864e5;
      var n=state.activity.filter(function(a){return a.at>=day.getTime()&&a.at<next}).length
        +state.items.filter(function(i){return i.doneAt&&i.doneAt>=day.getTime()&&i.doneAt<next}).length;
      max=Math.max(max,n);
      days.push({n:n,l:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day.getDay()]});
    }
    h+='<div class="panel"><h3>7-day activity</h3><div class="chart">'+days.map(function(x){return '<div class="bar" style="height:'+Math.max(4,Math.round(x.n/max*100))+'%"><span>'+x.n+'</span><em>'+x.l+'</em></div>'}).join('')+'</div><div style="height:22px"></div></div>';
  }
  h+='<div class="panel"><h3>Activity</h3><div class="feed">'+(state.activity.length?state.activity.slice(0,10).map(function(a){return '<div><span class="dt"></span><span>'+esc(a.t)+'</span><span class="w">'+ago(a.at)+'</span></div>'}).join(''):'<div class="empty">Quiet so far.</div>')+'</div></div>';
  return h;
}

function vItems(){
  var list=state.items.filter(function(i){return FILTER==='all'||(FILTER==='open'?!i.done:i.done)});
  var q=(window._q||'').toLowerCase();
  if(q)list=list.filter(function(i){return i.title.toLowerCase().indexOf(q)>=0});
  return '<h1>'+esc(CFG.entities)+'</h1><div class="sub">Your live workspace — everything is saved in this browser.</div>'+
  '<div class="addrow"><input id="newT" type="text" placeholder="Add a '+esc(CFG.entity.toLowerCase())+'…" onkeydown="if(event.key===\\'Enter\\')addItem()"><button onclick="addItem()">Add</button></div>'+
  '<div class="tabs">'+['all','open','done'].map(function(f){return '<span class="tab '+(FILTER===f?'on':'')+'" onclick="FILTER=\\''+f+'\\';render()">'+f[0].toUpperCase()+f.slice(1)+'</span>'}).join('')+
  '<input type="text" placeholder="Search…" style="margin-left:auto;padding:6px 12px;font-size:12px" value="'+esc(window._q||'')+'" oninput="window._q=this.value;render()"></div>'+
  '<div class="panel">'+(list.length?list.map(function(i){return '<div class="item '+(i.done?'done':'')+'">'+
    '<input type="checkbox" '+(i.done?'checked':'')+' onchange="toggleItem(\\''+i.id+'\\')">'+
    '<span class="t">'+esc(i.title)+'</span>'+
    '<button class="pr '+(i.priority==='high'?'high':'')+'" onclick="togglePr(\\''+i.id+'\\')">'+(i.priority==='high'?'HIGH':'NORMAL')+'</button>'+
    '<button class="del" onclick="delItem(\\''+i.id+'\\')">✕</button></div>'}).join(''):'<div class="empty">Nothing here — add your first '+esc(CFG.entity.toLowerCase())+' above.</div>')+'</div>';
}
function addItem(){
  var el=document.getElementById('newT');var t=el.value.trim();if(!t)return;
  state.items.unshift({id:'it'+(state.nextId++),title:t,done:false,priority:/urgent|asap/i.test(t)&&V>=3&&state.rules.urgent?'high':'normal',createdAt:Date.now(),doneAt:null});
  logAct('Added '+CFG.entity.toLowerCase()+': '+t.slice(0,40));el.value='';render();
}
function toggleItem(id){var i=state.items.find(function(x){return x.id===id});if(!i)return;i.done=!i.done;i.doneAt=i.done?Date.now():null;logAct((i.done?'Completed':'Reopened')+': '+i.title.slice(0,40));render()}
function togglePr(id){var i=state.items.find(function(x){return x.id===id});if(!i)return;i.priority=i.priority==='high'?'normal':'high';save();render()}
function delItem(id){var i=state.items.find(function(x){return x.id===id});state.items=state.items.filter(function(x){return x.id!==id});if(i)logAct('Deleted: '+i.title.slice(0,40));render()}

function vAuto(){
  return '<h1>Automations</h1><div class="sub">Rules that run against your workspace every time the app loads.</div><div class="panel">'+
  '<div class="rule"><div><b>Auto-archive</b><div class="d">Remove completed '+esc(CFG.entities.toLowerCase())+' older than 7 days</div></div><div class="sw '+(state.rules.archive?'on':'')+'" onclick="flipRule(\\'archive\\')"></div></div>'+
  '<div class="rule"><div><b>Urgency detection</b><div class="d">Titles containing “urgent / asap / now” are flagged high priority</div></div><div class="sw '+(state.rules.urgent?'on':'')+'" onclick="flipRule(\\'urgent\\')"></div></div>'+
  '</div><div class="hint">Rules were shipped in v3 by the product engineer — they operate on your real data, not a demo.</div>';
}
function flipRule(k){state.rules[k]=!state.rules[k];logAct('Automation '+k+' turned '+(state.rules[k]?'on':'off'));runRules();render()}

function vRep(){
  var open=state.items.filter(function(i){return!i.done});
  var done=state.items.filter(function(i){return i.done});
  return '<h1>Reports</h1><div class="sub">A live summary of the workspace, exportable any time.</div>'+
  '<div class="panel"><table><tr><th>Metric</th><th>Value</th></tr>'+
  '<tr><td>Total '+esc(CFG.entities.toLowerCase())+'</td><td><b>'+state.items.length+'</b></td></tr>'+
  '<tr><td>Open</td><td><b>'+open.length+'</b></td></tr>'+
  '<tr><td>'+esc(CFG.kpi)+'</td><td><b>'+done.length+'</b></td></tr>'+
  '<tr><td>High priority open</td><td><b>'+open.filter(function(i){return i.priority==='high'}).length+'</b></td></tr>'+
  '<tr><td>Events logged</td><td><b>'+state.activity.length+'</b></td></tr></table></div>'+
  '<button onclick="exportJson()">Export workspace JSON</button>';
}
function exportJson(){
  var blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=CFG.slug+'-workspace.json';a.click();
  logAct('Exported workspace JSON');render();
}

function vInt(){
  return '<h1>Integrations</h1><div class="sub">Requested by the AI org — status mirrors the Foundry dashboard at build time.</div>'+
  '<div class="panel"><div class="chipline">'+(CFG.integrations.length?CFG.integrations.map(function(i){return '<span class="ichip '+i.status+'" title="'+esc(i.purpose)+'"><span class="st"></span>'+esc(i.name)+'</span>'}).join(''):'<div class="empty">No integrations requested yet.</div>')+'</div></div>';
}

function vSet(){
  return '<h1>Settings</h1><div class="sub">Workspace preferences.</div>'+
  '<div class="panel"><h3>Workspace name</h3><div class="addrow"><input id="wsIn" type="text" value="'+esc(state.ws||CFG.name)+'"><button onclick="saveWs()">Save</button></div></div>'+
  '<div class="panel"><h3>Danger zone</h3><button class="ghost" onclick="if(confirm(\\'Reset all workspace data?\\')){localStorage.removeItem(KEY);load();render()}">Reset workspace data</button></div>'+
  '<div class="hint">Product v'+V+' · single-file app shipped by the '+esc(CFG.name)+' product engineer. Data lives entirely in your browser.</div>';
}
function saveWs(){state.ws=document.getElementById('wsIn').value.trim()||CFG.name;logAct('Renamed workspace to '+state.ws);render()}

/* command palette (v5+) */
if(V>=5){
  var CMDS=[];
  NAVS.forEach(function(n){CMDS.push({t:'Go to '+n[1],f:function(){go(n[0])}})});
  CMDS.push({t:'Add a '+CFG.entity.toLowerCase(),f:function(){go('items');setTimeout(function(){var e=document.getElementById('newT');if(e)e.focus()},0)}});
  CMDS.push({t:'Export workspace JSON',f:exportJson});
  var sel=0;
  function openPal(){document.getElementById('pal').classList.add('on');var i=document.getElementById('palIn');i.value='';sel=0;drawPal('');i.focus()}
  function closePal(){document.getElementById('pal').classList.remove('on')}
  function drawPal(q){
    var list=CMDS.filter(function(c){return c.t.toLowerCase().indexOf(q.toLowerCase())>=0});
    document.getElementById('palOpts').innerHTML=list.map(function(c,i){return '<div class="opt '+(i===sel?'sel':'')+'" onmousedown="event.preventDefault()" onclick="window._palRun('+i+')">'+esc(c.t)+'</div>'}).join('');
    window._palList=list;
  }
  window._palRun=function(i){var c=window._palList[i];closePal();if(c)c.f()};
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPal();return}
    var pal=document.getElementById('pal');
    if(!pal.classList.contains('on'))return;
    if(e.key==='Escape')closePal();
    else if(e.key==='ArrowDown'){sel=Math.min(sel+1,(window._palList||[]).length-1);drawPal(document.getElementById('palIn').value)}
    else if(e.key==='ArrowUp'){sel=Math.max(sel-1,0);drawPal(document.getElementById('palIn').value)}
    else if(e.key==='Enter'){window._palRun(sel)}
  });
  document.getElementById('palIn').addEventListener('input',function(){sel=0;drawPal(this.value)});
  document.getElementById('pal').addEventListener('click',function(e){if(e.target===this)closePal()});
}

load();runRules();render();
</script>
</body>
</html>`;
}

module.exports = { buildProductHtml, FEATURES };
