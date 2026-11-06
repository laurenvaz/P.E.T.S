// Screens (sidebar, new course, terms, course, solve, menu, garden) and the render/keyboard loop.
// Loaded as a classic script: top-level consts are shared with the other files.

/* ---------- Views ---------- */
const I = {
  side:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/></svg>',
  search:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  plus:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  leaf:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19 13 11"/></svg>',
  menu:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  up:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  file:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>',
  lock:'<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  close:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};
const kbd='<kbd>↵</kbd>';

function sidebar(){
  const growing=S.envs.filter(e=>!e.finished);
  const gardenN=S.envs.filter(e=>e.status==='garden').length;
  const res=searchResults();
  return `<aside class="side ${S.collapsed?'collapsed':''}" aria-label="Sidebar">
    <div class="side-top"><span class="brand">P.E.T.S</span><button class="iconbtn" data-act="toggleSide" aria-label="${S.collapsed?'Expand':'Collapse'} sidebar" title="${S.collapsed?'Expand':'Collapse'} sidebar">${I.side}</button></div>
    <div><div class="search">${I.search}<input id="search" placeholder="Search  ⌘K" data-model="search" data-live data-enter="searchGo" value="${esc(S.search)}" autocomplete="off"></div>
      ${res.length?`<div class="results">${res.map((r,i)=>`<button class="${i===0?'first':''}" data-act="searchGo" data-arg="${i}"><span>${esc(r.label)}</span><span class="muted">${esc(r.meta)}</span></button>`).join('')}</div>`:(S.search.trim()?'<div class="results small muted" style="padding:6px 8px">Nothing found</div>':'')}</div>
    <nav class="nav">
      <button class="navitem ${S.route==='garden'?'on':''}" data-act="nav" data-arg="garden" title="Garden"><span class="ico">${I.leaf}</span><span class="t">Garden</span><span class="sub">${gardenN}</span></button>
      <div class="nav-label">Courses</div>
      ${growing.map(e=>`<button class="navitem ${S.cur===e.id&&S.route!=='new'&&S.route!=='garden'?'on':''}" data-act="open" data-arg="${e.id}" title="${esc(e.course)}"><span class="ico">${petSVG(e.kind,moodFor(e.hunger),28,'none',e.status==='lost')}</span><span class="t">${esc(e.course)}</span></button>`).join('')}
      <button class="navitem ${S.route==='new'?'on':''}" data-act="nav" data-arg="new" title="New course"><span class="ico">${I.plus}</span><span class="t">New course</span></button>
    </nav>
    <div class="side-foot">
      ${S.test?`<div class="testzone"><div class="row">${env()?`Hunger <button data-act="hunger" data-arg="-1">−</button><button data-act="hunger" data-arg="1">+</button>`:'<span>Open a course to change hunger</span>'}</div><div class="row"><button data-act="reset">Reset prototype</button></div></div>`:''}
      <button class="link quiet small t" data-act="test" style="padding:6px 8px">${S.test?'Hide':'Show'} test controls</button>
    </div>
  </aside>`;
}

function termsView(t){
  const max=maxLevel(t);
  return `
  <div class="term">
    <h2>How much help</h2>
    <div class="seg" role="radiogroup" aria-label="Help level">${LEVELS.map((l,i)=>{const lk=i>max;return `<button role="radio" aria-checked="${t.level===i}" class="${t.level===i?'on':''} ${lk?'lock':''}" data-act="level" data-arg="${i}">${lk?I.lock:''}${l.short}</button>`;}).join('')}</div>
    <p class="small muted">${esc(LEVELS[t.level].does)}${S.lockNote?' <span style="color:var(--warn)">'+esc(S.lockNote)+'</span>':''}</p>
    <button class="toggle ${t.earn?'on':''}" data-act="earn" role="switch" aria-checked="${t.earn}"><span class="sw"></span>Earn more help by answering a quick question first</button>
  </div>
  <div class="term">
    <h2>What I do myself</h2>
    <div class="chips">${PLAN.map(p=>`<button class="chip ${t.mine.includes(p.id)?'on':''}" data-act="mine" data-arg="${p.id}" aria-pressed="${t.mine.includes(p.id)}">${p.label}</button>`).join('')}</div>
    <p class="small muted">The coach waits until you mark these done. Everything else: AI help within your level.</p>
  </div>
  <div class="term">
    <h2>My rules</h2>
    <div class="rules">${t.rules.map((r,i)=>`<div class="rule"><span class="txt">${esc(r.text)}</span><button class="strict" data-act="strict" data-arg="${i}" title="${STRICT_HELP[r.strict]} · click to change">${r.strict}</button><button class="x" data-act="rmRule" data-arg="${i}" aria-label="Remove rule">×</button></div>`).join('')}
      <div class="rule"><input id="ruleDraft" class="field left" style="border:0;padding:0" placeholder="Add your own rule…" data-model="ruleDraft" data-enter="addRule" value="${esc(S.ruleDraft)}"></div></div>
    <div class="chips">${RULE_SUGGESTIONS.filter(s=>!t.rules.some(r=>r.text===s.text)).map(s=>`<button class="chip add" data-act="sugg" data-arg="${RULE_SUGGESTIONS.indexOf(s)}">+ ${esc(s.text)}</button>`).join('')}</div>
    <p class="small muted">Remind ${STRICT_HELP.remind}. Warn ${STRICT_HELP.warn}. Block ${STRICT_HELP.block}.</p>
  </div>`;
}

function viewNew(){
  const w=S.wiz;
  const dots=`<div class="dots" aria-label="Step ${w.step+1} of 3">${[0,1,2].map(i=>`<i class="${i<=w.step?'on':''}"></i>`).join('')}</div>`;
  const back=w.step>0?`<button class="link quiet" data-act="wizBack">Back</button>`:'';
  if (w.step===0) return `<div class="col center">${dots}
    <div class="stack center"><h1>Start a course</h1><p class="lede">Each course gets its own space, its own pet and its own terms. You set them once, then just upload and solve.</p></div>
    <input id="course" class="field" placeholder="Which course is this for?" data-model="wiz.course" data-autofocus value="${esc(w.course)}" autocomplete="off">
    <button class="btn" data-act="wizNext" data-primary ${w.course.trim()?'':'disabled'}>Continue ${kbd}</button></div>`;
  if (w.step===1) return `<div class="col center">${dots}
    <div class="stack center"><h1>Choose a pet for ${esc(w.course.trim())}</h1><p class="lede">It eats when you keep your own rules. Get through the course without it fainting and it moves into your garden.</p></div>
    <div class="pets" role="radiogroup" aria-label="Pet">${Object.keys(KINDS).map(k=>`<button class="petpick ${w.kind===k?'on':''}" role="radio" aria-checked="${w.kind===k}" data-act="kind" data-arg="${k}">${petSVG(k,w.kind===k?'happy':'ok',78)}<span class="lbl">${KINDS[k].label}</span></button>`).join('')}</div>
    <input id="petname" class="field" style="max-width:280px" aria-label="Pet name" data-model="wiz.name" data-autofocus value="${esc(w.name)}" autocomplete="off">
    <div class="row" style="justify-content:center;gap:24px">${back}<button class="btn" data-act="wizNext" data-primary>Continue ${kbd}</button></div>
    <p class="small muted">← → to switch pets</p></div>`;
  return `<div class="col">${dots}
    <div class="stack center" style="text-align:center"><h1>Your terms</h1><p class="lede" style="margin:0 auto">How ${esc(w.name)}’s coach may help you in ${esc(w.course.trim())}. You can change this any time from the menu.</p></div>
    ${termsView(w.terms)}
    <div class="row" style="justify-content:center;gap:24px">${back}<button class="btn" data-act="wizNext" data-primary>Create course ${kbd}</button></div></div>`;
}

function viewTerms(){
  const e=env();
  return `<div class="col"><div class="stack"><h1>Your terms</h1><p class="lede">For ${esc(e.course)}. Changes apply from your next question.</p></div>
    ${termsView(e.terms)}
    <div><button class="btn" data-act="termsDone" data-primary>Done ${kbd}</button></div></div>`;
}

function petHeader(e, size){
  const mood=e.status==='lost'?'faint':moodFor(e.hunger);
  const line=e.status==='lost'?'Fainted. It can’t move into the garden any more.':({happy:'Happy and well fed.',ok:'Doing fine. Keep your rules to feed it.',hungry:'Getting hungry.',faint:'About to faint.'}[mood]);
  return `<div class="stack center">${petSVG(e.kind,mood,size,e.hat,e.status==='lost')}
    <div class="stack-s center"><h1>${esc(e.course)}</h1><p class="muted">${esc(e.petName)} · ${hungerBar(e.hunger)} · ${line}</p></div></div>`;
}

function viewCourse(){
  const e=env();
  const ex=e.sheet?e.sheet.exercises:[];
  const anyDone=ex.some(x=>x.done);
  return `<div class="col">${petHeader(e,120)}
    <div class="stack">
      <h2>${e.sheet?esc(e.sheet.name):'Exercises'}</h2>
      ${e.sheet?`<div class="list">${ex.map(x=>`<button class="item" data-act="pickEx" data-arg="${x.id}" ${x.workable?'':'disabled'}><span class="t"><div>${esc(x.title)}</div><div class="small muted">${esc(x.sub)}</div></span><span class="st ${x.done?'done':''}">${x.done?'Done':(x.workable?(e.sess&&e.sess.exId===x.id?'Continue':'Start')+' →':'')}</span></button>`).join('')}</div>
        <div class="row" style="justify-content:space-between"><button class="link quiet small" data-act="importSheet">Replace sheet</button>${ex.some(x=>x.workable&&!x.done)?`<button class="btn" data-act="startEx" data-primary>${e.sess?'Continue':'Start'} Binary search ${kbd}</button>`:''}</div>`
      :`<button class="drop" data-act="importSheet" data-primary>${I.file}<span>Drop an exercise sheet or slides here</span><span class="small">or press ↵ to choose a file</span></button>`}
    </div>
    <div class="stack-s" style="border-top:1px solid var(--line);padding-top:20px">
      <div class="row" style="justify-content:space-between"><span class="small muted">${e.status==='lost'?'The course can still be finished, but '+esc(e.petName)+' won’t join the garden.':'Semester over? Finishing moves '+esc(e.petName)+' into your garden.'}</span>
      <button class="link small" data-act="finish" ${anyDone?'':'disabled title="Finish at least one exercise first"'}>Finish course</button></div>
      ${anyDone?'':'<span class="small muted">Prototype: available once you have finished an exercise.</span>'}
    </div></div>`;
}

function pendingView(e,s){
  const w=s.pending; if(!w) return '';
  const pet=esc(e.petName), t=e.terms;
  if (w.kind==='warn'){
    const r=t.rules.find(x=>x.id===w.ruleId), locked=e.hunger<=2;
    const what=w.type==='offtopic'?'This isn’t part of the course, so it would break your rule.':'Giving you '+TYPE_NAME[w.type]+' would break your rule.';
    const keep=w.type==='offtopic'?`<button class="link" data-act="keep" data-arg="later">Save it for later (+1)</button><button class="link" data-act="keep" data-arg="back">Back to the exercise (+1)</button>`:`<button class="link" data-act="keep" data-arg="hint">Take a hint instead (+1)</button>`;
    return `<div class="ask"><div class="msg"><span class="tag" style="color:var(--warn)">Your rule</span><div class="body">“${esc(r?r.text:'')}”\n${what}</div></div>
      <div class="acts">${keep}<button class="link quiet" data-act="breakRule" ${locked?'disabled':''}>${locked?pet+' is too hungry to ask anyway':'Ask anyway (−2)'}</button></div></div>`;
  }
  if (w.kind==='plan'){
    const st=PLAN.find(p=>p.id===w.stepId);
    return `<div class="ask ol"><div class="msg"><span class="tag">Your plan</span><div class="body">You said you’d do “${st.label}” yourself. Done with it?</div></div>
      <div class="acts"><button class="link" data-act="planDone">Yes, it’s done. Go on</button><button class="link quiet" data-act="planAnyway">Help me anyway (−1)</button></div></div>`;
  }
  if (w.kind==='level' || w.kind==='unlock'){
    const need=w.kind==='level'?TYPE_MIN[w.type]:w.target, max=maxLevel(t), lockedNow=need>max, wu=WARMUPS[t.unlocked];
    const head=w.kind==='level'?`That needs Level ${need+1} · ${LEVELS[need].short}. You’re on ${LEVELS[t.level].short}.`:`Level ${need+1} · ${LEVELS[need].short} is locked.`;
    let body='';
    if (lockedNow && wu) body=`<div class="stack-s"><span class="small muted">Answer this to unlock Level ${t.unlocked+2}${need>t.unlocked+1?` (${need-t.unlocked} questions to go)`:''}:</span><div>${esc(wu.q)}</div>
      <div class="row"><input id="warm" class="field left" style="max-width:120px" placeholder="Your answer" data-model="warmInput" data-enter="warm" data-autofocus value="${esc(S.warmInput)}" autocomplete="off"><button class="link" data-act="warm">Check ↵</button></div>
      ${s.warmFb?`<span class="small" style="color:${s.warmOk?'var(--olive)':'var(--warn)'}">${esc(s.warmFb)}</span>`:''}</div>`;
    else if (s.warmFb) body=`<span class="small" style="color:var(--olive)">${esc(s.warmFb)}</span>`;
    const acts = w.kind==='level'
      ? `${!lockedNow?`<button class="link" data-act="raise">Switch to ${LEVELS[need].short}</button>`:''}<button class="link quiet" data-act="exception">One-time exception (−1)</button><button class="link quiet" data-act="stay">Stay at ${LEVELS[t.level].short}</button>`
      : `${!lockedNow?`<button class="link" data-act="solveLevel" data-arg="${need}">Switch to ${LEVELS[need].short}</button>`:''}<button class="link quiet" data-act="cancel">Not now</button>`;
    return `<div class="ask ol"><div class="msg"><span class="tag">Help level</span><div class="body">${head}</div></div>${body}<div class="acts">${acts}</div></div>`;
  }
  if (w.kind==='extra'){
    return `<div class="ask"><div class="msg"><span class="tag" style="color:var(--warn)">Check</span><div class="body">You’ve used your ${FREE_CHECKS} free checks for this exercise. Checking again costs ${pet} a snack, so try to find the problem yourself first.</div></div>
      <div class="acts"><button class="link" data-act="cancel">I’ll look again</button><button class="link quiet" data-act="extraCheck">Check anyway (−1)</button></div></div>`;
  }
  return '';
}

function viewSolve(){
  const e=env(), s=e.sess, t=e.terms, ex=e.sheet.exercises.find(x=>x.id===s.exId);
  const lines=s.code.split('\n').length;
  const gut=Array.from({length:Math.max(lines,10)},(_,i)=>i+1===s.highlight?`<span class="hl">${i+1}</span>`:String(i+1)).join('\n');
  const st=currentStep(), doneN=PLAN.filter(p=>s.done[p.id]).length, mine=t.mine.includes(st.id);
  const checksLeft=Math.max(0,FREE_CHECKS-(s.checks||0));
  const fb=s.feedback;
  const mood=e.status==='lost'?'faint':moodFor(e.hunger);
  const kept=t.rules.filter(r=>s.ruleStatus[r.id]!=='broken').length;
  return `<div class="topbar" id="topbar">
      <span class="crumb"><button class="link quiet" data-act="backToCourse">${esc(e.course)}</button> / <b>${esc(ex.title)}</b></span>
      <span class="petchip" title="${esc(e.petName)}">${e.petSay?`<span class="say ${e.petNeg?'neg':''}">${esc(e.petSay)}</span>`:''}${petSVG(e.kind,mood,30,'none',e.status==='lost')}${hungerBar(e.hunger)}</span>
      <button class="iconbtn" data-act="menu" aria-label="Open menu" title="Menu">${I.menu}</button>
    </div>
    <div class="col">
      <div class="stack-s"><h1>${esc(ex.title)}</h1><p class="muted">Implement <code style="font-family:var(--mono);font-size:.92em">binary_search(arr, target)</code>. Return the index of target, or -1 if it isn’t there. Then state its time complexity.</p></div>
      ${s.completed?'':`<div class="now"><span><span class="muted">Now:</span> ${st.label} · <span class="muted">${mine?'you, no AI':'AI '+st.ai+' allowed'}</span> &nbsp;<button class="link small" data-act="markStep">Mark done</button></span><span class="steps" title="${doneN} of 4 steps done">${PLAN.map(p=>`<i class="${s.done[p.id]?'d':''}"></i>`).join('')}</span></div>`}
      <div class="stack">
        <div class="editor"><div class="gutter" id="gutter" aria-hidden="true">${gut}</div><textarea id="code" spellcheck="false" aria-label="Your code" data-model="code" ${s.completed?'readonly':''}>${esc(s.code)}</textarea></div>
        <div class="under">
          <span class="row" style="gap:6px">${s.completed?'':`<button class="btn ghost" data-act="check">Check <span class="muted small">${checksLeft?checksLeft+' left':'−1 each'}</span></button><span class="small muted">⌘↵</span>`}</span>
          <span class="small">Help: <button class="link" data-act="levelOpen" aria-expanded="${S.levelOpen}">${LEVELS[t.level].short} ▾</button></span>
        </div>
        ${S.levelOpen?`<div class="stack-s"><div class="seg">${LEVELS.map((l,i)=>{const lk=i>maxLevel(t);return `<button class="${t.level===i?'on':''} ${lk?'lock':''}" data-act="solveLevel" data-arg="${i}">${lk?I.lock:''}${l.short}</button>`;}).join('')}</div><span class="small muted">${esc(LEVELS[t.level].does)} Check feedback gets more detailed with higher levels.</span></div>`:''}
        ${fb && !s.completed?`<div class="fb ${fb.kind==='bad'?'bad':''}"><span class="h">${esc(fb.title)}</span>${fb.text?`<span>${esc(fb.text)}</span>`:''}${fb.tests?`<div class="tests">${TESTS.calls.map((c,i)=>`<div>${c} → ${fb.tests[i][0]} <span style="color:${fb.tests[i][1]?'var(--olive)':'var(--bad)'}">${fb.tests[i][1]?'pass':'fail'}</span></div>`).join('')}</div>`:''}${fb.fix?`<pre>${esc(fb.fix)}</pre>`:''}</div>`:''}
      </div>
      ${s.completed?`<div class="done-block">${petSVG(e.kind,s.fed?'happy':mood,110,e.hat,e.status==='lost')}
          <h1>Exercise done</h1><p class="muted">All 4 tests pass. You kept ${kept} of ${t.rules.length} rules${s.exceptions?' and used '+s.exceptions+' exception'+(s.exceptions>1?'s':''):''}, with ${s.checks} check${s.checks>1?'s':''}.</p>
          ${e.status==='lost'?'':(s.fed?`<p style="color:var(--olive)">${esc(e.petName)} ate well.</p>`:`<button class="btn" data-act="feedEnd" data-primary>Feed ${esc(e.petName)} (+${2*kept}) ${kbd}</button>`)}
          ${s.fed||e.status==='lost'?`<button class="btn" data-act="backToCourse" data-primary>Back to ${esc(e.course)} ${kbd}</button>`:''}</div>`:''}
      <div class="thread" aria-live="polite">
        ${s.chat.map(m=>`<div class="msg ${m.from==='me'?'me':''} ${m.kind||''}">${m.from==='ai'?`<span class="tag">${esc(m.tag||'Coach')}</span>`:''}<div class="body ${m.mono?'mono':''}">${esc(m.text)}</div></div>`).join('')}
        ${pendingView(e,s)}
      </div>
    </div>
    ${s.completed?'':`<div class="composer"><div class="in"><input id="chat" placeholder="Ask the coach…" data-model="chatInput" data-enter="send" value="${esc(S.chatInput)}" autocomplete="off" ${s.pending&&s.pending.kind!=='extra'?'':'data-autofocus'}><button class="send" data-act="send" aria-label="Send">${I.up}</button></div></div>`}
    ${S.menu?menuSheet(e,s):''}`;
}

function menuSheet(e,s){
  const t=e.terms, ex=e.sheet.exercises.find(x=>x.id===s.exId);
  const mark=id=>s.ruleStatus[id]==='kept'?'<span class="m" style="color:var(--olive)">✓</span>':(s.ruleStatus[id]==='broken'?'<span class="m" style="color:var(--bad)">✗</span>':'<span class="m muted">·</span>');
  return `<div class="scrim" data-act="menu"></div><aside class="sheet" role="dialog" aria-label="Your setup so far">
    <div class="row" style="justify-content:space-between"><h2>So far</h2><button class="iconbtn" data-act="menu" aria-label="Close menu">${I.close}</button></div>
    <div class="sec"><div class="hd"><span class="n">1 · Course</span></div><div>${esc(e.course)}</div></div>
    <div class="sec"><div class="hd"><span class="n">2 · Pet</span></div><div class="row" style="gap:10px">${petSVG(e.kind,e.status==='lost'?'faint':moodFor(e.hunger),40,e.hat,e.status==='lost')}<div><div>${esc(e.petName)}, ${KINDS[e.kind].label.toLowerCase()}</div><div class="small muted">${hungerBar(e.hunger)} ${e.hunger}/10</div></div></div></div>
    <div class="sec"><div class="hd"><span class="n">3 · Your terms</span><button class="link small" data-act="editTerms">Edit</button></div>
      <div>Help: ${LEVELS[t.level].short} <span class="small muted">· ${maxLevel(t)+1} of 5 unlocked</span></div>
      <div class="small muted">You do yourself: ${t.mine.length?t.mine.map(id=>PLAN.find(p=>p.id===id).label.toLowerCase()).join(', '):'nothing'}</div>
      <ul>${t.rules.map(r=>`<li>${mark(r.id)}<span>${esc(r.text)} <span class="muted small">${r.strict}</span></span></li>`).join('')}</ul></div>
    <div class="sec"><div class="hd"><span class="n">4 · Exercise</span></div><div>${esc(ex.title)}</div><div class="small muted">${esc(e.sheet.name)}</div></div>
    <div class="sec"><div class="hd"><span class="n">5 · Progress</span></div>
      <ul>${PLAN.map(p=>`<li><span class="m" style="color:${s.done[p.id]?'var(--olive)':'var(--muted)'}">${s.done[p.id]?'✓':'○'}</span><span>${p.label}</span></li>`).join('')}</ul>
      <div class="small muted">${s.checks||0} check${s.checks===1?'':'s'} used · ${Math.max(0,FREE_CHECKS-(s.checks||0))} free left</div>
      ${s.askLater.length?`<div class="small" style="margin-top:6px">Saved for later: ${s.askLater.map(esc).join('; ')}</div>`:''}</div>
  </aside>`;
}

function viewGarden(){
  const res=S.envs.filter(e=>e.status==='garden'), lost=S.envs.filter(e=>e.status==='lost'&&e.finished), grow=S.envs.filter(e=>!e.finished);
  return `<div class="col" style="max-width:760px">
    <div class="stack center" style="text-align:center"><h1>Your garden</h1><p class="lede" style="margin:0 auto">Every pet here got through a whole course with you without fainting.</p></div>
    <div class="garden"><div class="hill"></div><div class="ground">
      ${res.map(e=>`<div class="resident ${S.justMoved===e.id?'new':''}">${petSVG(e.kind,'happy',92,e.hat)}<span class="nm">${esc(e.petName)}</span><span class="cs">${esc(e.course)} · ${esc(e.when)}</span></div>`).join('')}
      ${grow.filter(e=>e.status==='growing').slice(0,2).map(()=>'<div class="slot">soon</div>').join('')}
    </div></div>
    ${grow.length?`<div class="stack"><h2>Still growing</h2><div class="list">${grow.map(e=>`<button class="item" data-act="open" data-arg="${e.id}">${petSVG(e.kind,e.status==='lost'?'faint':moodFor(e.hunger),40,'none',e.status==='lost')}<span class="t"><div>${esc(e.petName)} · ${esc(e.course)}</div><div class="small muted">${e.status==='lost'?'Fainted':hungerBar(e.hunger)}</div></span><span class="st">Open →</span></button>`).join('')}</div></div>`:''}
    ${lost.length?`<div class="stack-s"><h2>Didn’t make it</h2><p class="small muted">${lost.map(e=>esc(e.petName)+' ('+esc(e.course)+', '+esc(e.when)+')').join(', ')}</p></div>`:''}
    <div class="center stack"><button class="btn" data-act="nav" data-arg="new" data-primary>Start a new course ${kbd}</button></div>
  </div>`;
}

/* ---------- Render loop ---------- */
let lastKey='', lastChat=0;
function render(){
  const app=document.getElementById('app');
  const a=document.activeElement, fid=a&&a.id, sel=a&&('selectionStart' in a)?[a.selectionStart,a.selectionEnd]:null;
  const main = S.route==='new'?viewNew():S.route==='garden'?viewGarden():S.route==='terms'?viewTerms():S.route==='course'?viewCourse():viewSolve();
  const scroller=document.querySelector('.main'), st=scroller?scroller.scrollTop:0;
  app.innerHTML = sidebar() + `<main class="main ${S.route==='solve'?'solve':''}" id="main">${main}</main>` + (S.toast?`<div class="toast" role="status">${esc(S.toast)}</div>`:'');
  document.documentElement.style.setProperty('--sidew', (S.collapsed?60:244)+'px');
  const m=document.getElementById('main');
  const key=S.route+'|'+S.wiz.step+'|'+S.cur+'|'+(sess()&&sess().pending?sess().pending.kind:'');
  if (key!==lastKey){
    lastKey=key; m.scrollTop = S.route==='solve' ? m.scrollHeight : 0;
    const af=[...document.querySelectorAll('[data-autofocus]')].pop(); if (af && !(fid==='search')) { af.focus({preventScroll:S.route!=='solve'}); if(af.select && af.id!=='chat') af.select(); }
    else if (fid){ const el=document.getElementById(fid); if(el) el.focus({preventScroll:true}); }
  } else {
    m.scrollTop=st;
    if (fid){ const el=document.getElementById(fid); if(el){ el.focus({preventScroll:true}); if (fid==='petname' && !S.wiz.nameTouched) el.select(); else if(sel&&el.setSelectionRange) try{el.setSelectionRange(sel[0],sel[1]);}catch(e){} } }
  }
  const s=sess();
  if (S.route==='solve' && s && s.chat.length!==lastChat){ lastChat=s.chat.length; m.scrollTop=m.scrollHeight; }
  const ce=document.getElementById('code'); if (ce){ ce.style.height='auto'; ce.style.height=ce.scrollHeight+'px'; }
  const tb=document.getElementById('topbar'); if (tb) m.onscroll=()=>tb.classList.toggle('scrolled',m.scrollTop>4);
}
function act(name,arg){ if(!A[name]) return; A[name](arg); render(); }
function setModel(path,val){ if (path.startsWith('wiz.')){ S.wiz[path.slice(4)]=val; if(path==='wiz.name') S.wiz.nameTouched=true; } else if (path==='code'){ sess().code=val; } else S[path]=val; }

document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]'); if(!b || b.disabled) return;
  act(b.dataset.act,b.dataset.arg);
});
document.addEventListener('input',ev=>{
  const el=ev.target; if(!el.dataset.model) return;
  setModel(el.dataset.model,el.value);
  if (el.id==='code'){ const n=el.value.split('\n').length; const g=document.getElementById('gutter'); if(g) g.textContent=Array.from({length:Math.max(n,10)},(_,i)=>i+1).join('\n'); el.style.height='auto'; el.style.height=el.scrollHeight+'px'; return; }
  if (el.dataset.live || el.id==='course') render();
});
document.addEventListener('keydown',ev=>{
  const t=ev.target;
  if ((ev.metaKey||ev.ctrlKey) && ev.key.toLowerCase()==='k'){ ev.preventDefault(); if(S.collapsed){S.collapsed=false;render();} document.getElementById('search').focus(); return; }
  if (ev.key==='Escape'){ if (S.menu){S.menu=false;render();} else if (S.search){S.search='';render();} else if (S.levelOpen){S.levelOpen=false;render();} return; }
  if (ev.key==='Enter' && t.id==='code' && (ev.metaKey||ev.ctrlKey)){ ev.preventDefault(); act('check'); return; }
  if (ev.key==='Tab' && t.id==='code'){ ev.preventDefault(); const s=t.selectionStart; t.setRangeText('    ',s,t.selectionEnd,'end'); setModel('code',t.value); return; }
  if (S.route==='new' && S.wiz.step===1 && (ev.key==='ArrowLeft'||ev.key==='ArrowRight') && (t.tagName!=='INPUT' || !S.wiz.nameTouched)){
    const ks=Object.keys(KINDS), i=ks.indexOf(S.wiz.kind); ev.preventDefault(); act('kind', ks[(i+(ev.key==='ArrowRight'?1:ks.length-1))%ks.length]); return; }
  if (ev.key!=='Enter' || ev.shiftKey || ev.isComposing) return;
  if (t.tagName==='TEXTAREA' || t.tagName==='BUTTON') return;
  if (t.dataset && t.dataset.enter){ ev.preventDefault(); act(t.dataset.enter,t.dataset.arg); return; }
  if (S.menu) return;
  const p=[...document.querySelectorAll('[data-primary]')].filter(b=>!b.disabled).pop();
  if (p){ ev.preventDefault(); p.click(); }
});
render();
