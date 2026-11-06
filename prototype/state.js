// App state, pet economy, coach behaviour, all user actions (A.*).
// Loaded as a classic script: top-level consts are shared with the other files.

/* ---------- State ---------- */
function defaultTerms(){ return { earn:true, level:0, unlocked:0, mine:['understand','analyze'], rules:[
  { id:'A', ...RULE_SUGGESTIONS[1] }, { id:'B', ...RULE_SUGGESTIONS[2] } ] }; }
function seedEnvs(){ return [
  { id:'la', course:'Linear Algebra', kind:'fox', petName:'Juniper', hunger:9, status:'garden', when:'Spring 2026', finished:true, hat:'cap', terms:defaultTerms(), sheet:null, sess:null },
  { id:'dm', course:'Discrete Mathematics', kind:'sprout', petName:'Moss', hunger:8, status:'garden', when:'Fall 2025', finished:true, hat:'cap', terms:defaultTerms(), sheet:null, sess:null },
  { id:'an', course:'Analysis I', kind:'frog', petName:'Bo', hunger:0, status:'lost', when:'Fall 2025', finished:true, hat:'none', terms:defaultTerms(), sheet:null, sess:null }
]; }
function freshWiz(){ return { step:0, course:'', kind:'cat', name:'Pip', nameTouched:false, terms:defaultTerms() }; }
let S;
function resetAll(){
  S = { route:'new', envs:seedEnvs(), cur:null, wiz:freshWiz(), collapsed:false, search:'', menu:false, test:false,
        toast:null, justMoved:null, chatInput:'', ruleDraft:'', warmInput:'', levelOpen:false, selEx:null };
  try { S.collapsed = localStorage.getItem('pets-side')==='1'; } catch(e){}
}
resetAll();
const env = () => S.envs.find(e => e.id===S.cur);
const sess = () => env() && env().sess;
const maxLevel = t => t.earn ? t.unlocked : 4;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){ S.toast=msg; clearTimeout(toast.t); toast.t=setTimeout(()=>{S.toast=null;render();},2600); }

/* ---------- Pet economy ---------- */
function feed(d, say){
  const e=env(); if (e.status==='lost') return;
  e.hunger=Math.max(0,Math.min(10,e.hunger+d));
  e.petSay=(d>0?'+':'')+d+'  '+say; e.petNeg=d<0;
  if (e.hunger===0){ e.status='lost'; e.petSay='fainted'; toast(e.petName+' fainted. This course’s pet can’t move into the garden any more.'); }
}
function ruleStatus(id, st, note){ const s=sess(); if (s.ruleStatus[id]!=='broken') s.ruleStatus[id]=st; s.ruleNotes[id]=note; }

/* ---------- Coach ---------- */
function classify(text){
  const t=text.toLowerCase(), lv=env().terms.level;
  if (!ON_TOPIC.test(t)) return 'offtopic';
  if (/full|solution|answer|whole|entire|write (the|my) code|just give/.test(t)) return 'full';
  if (/explain|why|what is|complexity|concept|how does|detail/.test(t)) return 'concept';
  if (/next step|steps|what next|continue|how do i (write|implement)/.test(t)) return 'step';
  if (/hint/.test(t)) return 'hint';
  return LEVEL_TYPE[lv]==='question' ? 'question' : 'hint';
}
function currentStep(){ const s=sess(); return PLAN.find(p=>!s.done[p.id]) || PLAN[PLAN.length-1]; }
function ask(type, text){
  const e=env(), s=e.sess, t=e.terms;
  s.chat.push({from:'me',text}); s.pending=null;
  const matches=t.rules.filter(r=>(CAT_TYPES[r.cat]||[]).includes(type));
  if (matches.length && e.status!=='lost'){
    const top=[...matches].sort((a,b)=>STRICT_RANK[b.strict]-STRICT_RANK[a.strict])[0];
    let strict=top.strict; if (e.hunger<=2 && strict!=='block') strict='warn';
    if (strict==='block') return blockResponse(top,type);
    if (strict==='warn'){ s.pending={kind:'warn',ruleId:top.id,type,text}; return; }
    s.chat.push({from:'ai',tag:'Reminder · your rule',kind:'warn',text:`You said: “${top.text}” Going ahead, but ${e.petName} misses a snack.`});
    feed(-1,'Hmm…'); ruleStatus(top.id,'broken','You were reminded and went ahead.');
  }
  proceed(type,text,false);
}
function proceed(type,text,skipPlan){
  const e=env(), s=e.sess, t=e.terms;
  if (type==='offtopic'){ s.chat.push({from:'ai',tag:'Off-topic',text:`A short answer to “${text}” would appear here. It is outside ${e.course}, so I’m keeping it brief.`}); return; }
  const step=currentStep();
  if (!skipPlan && t.mine.includes(step.id) && !s.done[step.id]){ s.pending={kind:'plan',stepId:step.id,type,text}; return; }
  if (t.level < TYPE_MIN[type]){ s.pending={kind:'level',type,text}; S.warmInput=''; s.warmFb=''; return; }
  respond(type,false);
}
function blockResponse(rule,type){
  const s=sess(), ev=evaluate(s.code), list=QUESTIONS[ev.status];
  const q = type==='offtopic' ? 'Let’s stay with this week: what does binary search need from the array before it can work?' : list[s.qIdx % list.length];
  s.chat.push({from:'ai',tag:'Blocked, as you asked',kind:'block',text:`You said: “${rule.text}”`});
  s.chat.push({from:'ai',tag:'A question for you',text:q});
  s.qIdx++; feed(1,'Better!'); ruleStatus(rule.id,'kept','Blocked as you asked; you got a question instead.');
}
function respond(type, viaException){
  const s=sess(), ev=evaluate(s.code), once=viaException?' · one-time':'';
  let m;
  if (type==='question'){ const l=QUESTIONS[ev.status]; m={tag:'Nudge',text:'Think about this:\n'+l[s.qIdx%l.length]}; s.qIdx++; }
  else if (type==='hint'){ const l=SMALL_HINTS[ev.status]; m={tag:'Hint'+once,text:l[s.qIdx%l.length]}; s.qIdx++; }
  else if (type==='step') m={tag:'Guided steps'+once,text:GUIDED[ev.status]};
  else if (type==='concept') m={tag:'Explanation'+once,text:CONCEPT};
  else m={tag:'Full solution'+once,text:FULL,mono:true};
  m.from='ai'; s.chat.push(m); s.pending=null;
  if (viaException) s.exceptions=(s.exceptions||0)+1;
}

/* ---------- Check (now part of Solve) ---------- */
const FREE_CHECKS=3;
function runCheck(){
  const e=env(), s=e.sess, ev=evaluate(s.code), lv=e.terms.level;
  s.lastChecked=s.code; s.checks=(s.checks||0)+1; s.highlight=0;
  const res=TESTS[ev.status]||TESTS.incomplete, passed=res.filter(r=>r[1]).length;
  if (ev.status==='ok'){
    s.feedback={kind:'ok',title:'All 4 tests pass.',text:'Exercise done. Your solution runs in O(log n).'};
    s.completed=true; PLAN.forEach(p=>s.done[p.id]=true);
    const ex=e.sheet.exercises.find(x=>x.id===s.exId); if (ex) ex.done=true;
    return;
  }
  const fixes={loop:`Line ${ev.line}: use mid + 1 / mid - 1 so the window always shrinks.`,incomplete:`After line ${ev.line}:\nif arr[mid] == target: return mid\nelif target < arr[mid]: right = mid - 1\nelse: left = mid + 1`,missing:'After the loop:\nreturn -1'};
  const fb={kind:'bad',title:`Not yet. ${passed} of 4 tests pass.`,text:'',tests:lv>=3?res:null};
  if (lv>=1){ s.highlight=ev.line; fb.text='Look around line '+ev.line+'.'; }
  if (lv>=2) fb.text+=' '+ev.msg;
  if (lv>=4) fb.fix=fixes[ev.status];
  if (lv===0) fb.text='Your help level is Nudge, so the check only says yes or no.';
  s.feedback=fb;
}

/* ---------- Actions ---------- */
const A = {
  nav(r){ S.route=r; S.menu=false; S.justMoved=r==='garden'?S.justMoved:null; if(r==='new'){ S.wiz=freshWiz(); } },
  open(id){ S.cur=id; S.route='course'; S.menu=false; S.selEx=null; S.search=''; },
  toggleSide(){ S.collapsed=!S.collapsed; try{localStorage.setItem('pets-side',S.collapsed?'1':'0');}catch(e){} },
  wizNext(){
    const w=S.wiz;
    if (w.step===0 && !w.course.trim()) return;
    if (w.step===1 && !w.name.trim()) return;
    if (w.step<2){ w.step++; return; }
    const id='c'+Date.now();
    S.envs.push({ id, course:w.course.trim(), kind:w.kind, petName:w.name.trim(), hunger:6, status:'growing', when:'Fall 2026', finished:false, hat:'none', terms:w.terms, sheet:null, sess:null, petSay:'' });
    S.cur=id; S.route='course'; toast(w.name.trim()+' is now looking after '+w.course.trim()+'.');
  },
  wizBack(){ if (S.wiz.step>0) S.wiz.step--; },
  kind(k){ const w=S.wiz; w.kind=k; if(!w.nameTouched) w.name=KINDS[k].name; },
  // terms (wizard or editing)
  level(i){ const t=T(); i=+i; if (i>maxLevel(t)){ S.lockNote='Level '+(i+1)+' unlocks while you solve: answer a short question first.'; return; } S.lockNote=''; t.level=i; },
  earn(){ const t=T(); t.earn=!t.earn; if (t.earn) t.level=Math.min(t.level,t.unlocked); S.lockNote=''; },
  mine(id){ const t=T(); t.mine=t.mine.includes(id)?t.mine.filter(x=>x!==id):t.mine.concat(id); },
  strict(i){ const r=T().rules[+i]; r.strict=STRICT_ORDER[(STRICT_ORDER.indexOf(r.strict)+1)%3]; },
  rmRule(i){ T().rules.splice(+i,1); },
  sugg(i){ const t=T(), r=RULE_SUGGESTIONS[+i]; if (t.rules.some(x=>x.text===r.text)) return; t.rules.push({id:nextId(t),...r}); },
  addRule(){
    const text=S.ruleDraft.trim(); if(!text) return; const t=T(), l=text.toLowerCase();
    let cat='full'; if (/only|rabbit|off|topic|stay|distract/.test(l)) cat='offtopic'; else if (/solve|never|exercise|code|for me|do it/.test(l)) cat='solve';
    const strict=/never|block|don't let|dont let/.test(l)?'block':(/remind/.test(l)?'remind':'warn');
    t.rules.push({id:nextId(t),text,cat,strict}); S.ruleDraft='';
  },
  editTerms(){ S.menu=false; S.route='terms'; },
  termsDone(){ S.route = sess() ? 'solve' : 'course'; S.lockNote=''; },
  // course
  importSheet(){ const e=env(); e.sheet={ name:'Week 3 – Exercise sheet.pdf', exercises:[
      {id:'e1',title:'Binary search',sub:'Graded · implement and analyse complexity',workable:true,done:false},
      {id:'e2',title:'Search range',sub:'Not part of this prototype',workable:false,done:false},
      {id:'e3',title:'Two pointers',sub:'Not part of this prototype',workable:false,done:false} ] };
    S.selEx='e1'; },
  pickEx(id){ S.selEx=id; A.startEx(); },
  startEx(){
    const e=env(); const ex=e.sheet && e.sheet.exercises.find(x=>x.id===S.selEx && x.workable); if(!ex) return;
    if (!e.sess || e.sess.exId!==ex.id) e.sess={ exId:ex.id, code:START_CODE, lastChecked:null, done:{}, chat:[greeting(e)], ruleStatus:{}, ruleNotes:{}, pending:null, qIdx:0, warmFb:'', feedback:null, completed:false, fed:false, askLater:[], highlight:0, checks:0 };
    S.route='solve'; S.chatInput='';
  },
  finish(){
    const e=env(); e.finished=true;
    if (e.status==='growing'){ e.status='garden'; e.hat='cap'; S.justMoved=e.id; toast(e.petName+' moved into your garden.'); }
    else toast(e.petName+' didn’t make it, so there’s no new pet for the garden.');
    S.route='garden'; S.cur=null;
  },
  // solve
  menu(){ S.menu=!S.menu; },
  send(){ const text=S.chatInput.trim(); if(!text) return; S.chatInput=''; ask(classify(text),text); },
  keep(mode){
    const s=sess(), w=s.pending; if(!w) return; s.pending=null; feed(1,'Yum!');
    if (mode==='later'){ ruleStatus(w.ruleId,'kept','Saved an off-topic question for later.'); s.askLater.push(w.text); s.chat.push({from:'ai',tag:'Saved for later',text:`Saved “${w.text}”. Back to the exercise.`}); return; }
    if (mode==='back'){ ruleStatus(w.ruleId,'kept','Went back to the exercise.'); s.chat.push({from:'ai',tag:'Coach',text:'Back to binary search. Where were you stuck?'}); return; }
    ruleStatus(w.ruleId,'kept','You asked for '+TYPE_NAME[w.type]+' but took a hint instead.'); respond(LEVEL_TYPE[Math.min(env().terms.level,1)],false);
  },
  breakRule(){ const e=env(), s=e.sess, w=s.pending; if(!w || e.hunger<=2) return; s.pending=null; feed(-2,'So hungry…');
    ruleStatus(w.ruleId,'broken','You asked for '+(w.type==='offtopic'?'something off-topic':TYPE_NAME[w.type])+' anyway.'); proceed(w.type,w.text,false); },
  planDone(){ const s=sess(), w=s.pending; s.done[w.stepId]=true; s.pending=null; proceed(w.type,w.text,false); },
  planAnyway(){ const s=sess(), w=s.pending; s.pending=null; feed(-1,'Hmm…'); proceed(w.type,w.text,true); },
  markStep(){ const s=sess(), st=currentStep(); s.done[st.id]=true; },
  raise(){ const s=sess(), w=s.pending; env().terms.level=TYPE_MIN[w.type]; respond(w.type,false); },
  exception(){ const s=sess(), w=s.pending; feed(-1,'One-time'); respond(w.type,true); },
  stay(){ const s=sess(); respond(LEVEL_TYPE[env().terms.level],false); },
  warm(){
    const e=env(), t=e.terms, s=e.sess, w=WARMUPS[t.unlocked]; if(!w) return;
    const ans=S.warmInput.trim().replace(/[^0-9-]/g,'');
    if (w.a.includes(ans)){ t.unlocked++; S.warmInput=''; s.warmFb='Right. Level '+(t.unlocked+1)+' · '+LEVELS[t.unlocked].short+' is unlocked.'; s.warmOk=true; }
    else { s.warmFb=w.wrong; s.warmOk=false; }
  },
  levelOpen(){ S.levelOpen=!S.levelOpen; },
  solveLevel(i){ const t=env().terms; i=+i; if (i>maxLevel(t)){ const s=sess(); s.pending={kind:'unlock',target:i}; s.warmFb=''; S.warmInput=''; S.levelOpen=false; return; } t.level=i; S.levelOpen=false; },
  check(){
    const s=sess(); if (!s || s.completed) return;
    if (s.lastChecked===s.code){ s.feedback={kind:'info',title:'Nothing changed since your last check.',text:'Change something in your code first.'}; return; }
    if (s.checks>=FREE_CHECKS){ s.pending={kind:'extra'}; return; }
    runCheck();
  },
  extraCheck(){ sess().pending=null; feed(-1,'Extra check'); runCheck(); },
  cancel(){ sess().pending=null; },
  feedEnd(){ const e=env(), s=e.sess; if (s.fed) return; const kept=e.terms.rules.filter(r=>s.ruleStatus[r.id]!=='broken').length; s.fed=true; feed(2*kept,'Thanks!'); },
  backToCourse(){ S.route='course'; S.menu=false; },
  // search
  searchGo(i){ const r=searchResults()[+(i||0)]; if(r){ S.search=''; r.go(); } },
  // test controls
  test(){ S.test=!S.test; },
  hunger(d){ const e=env(); if(!e) return; if (e.status==='lost' && +d>0){ e.status='growing'; } e.hunger=Math.max(0,Math.min(10,e.hunger+(+d))); if(e.hunger===0 && e.status==='growing'){ e.status='lost'; } },
  reset(){ resetAll(); }
};
function T(){ return S.route==='new' ? S.wiz.terms : env().terms; }
function nextId(t){ const used=t.rules.map(r=>r.id); return 'ABCDEFGHIJKLMNOP'.split('').find(l=>!used.includes(l)); }
function greeting(e){ return {from:'ai',tag:'Coach',text:`I’ll stay inside your terms for ${e.course}: ${LEVELS[e.terms.level].short.toLowerCase()} level help and your ${e.terms.rules.length} rules. Ask when you’re stuck.`}; }

function searchResults(){
  const q=S.search.trim().toLowerCase(); if(!q) return [];
  const out=[];
  S.envs.forEach(e=>{
    if ((e.course+' '+e.petName).toLowerCase().includes(q)) out.push({label:e.course,meta:e.status==='garden'?'Garden':(e.finished?'Ended':'Course'),go:()=>{ if(e.status==='garden'||e.finished){S.route='garden';S.cur=null;} else A.open(e.id); }});
    if (e.sheet) e.sheet.exercises.forEach(x=>{ if (x.title.toLowerCase().includes(q)) out.push({label:x.title,meta:e.course,go:()=>{ S.cur=e.id; if(x.workable){S.selEx=x.id;A.startEx();} else {S.route='course';} }}); });
  });
  if ('garden'.includes(q)) out.push({label:'Garden',meta:'',go:()=>A.nav('garden')});
  return out.slice(0,6);
}
