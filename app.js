const GRADES = {
  none_to_d: {
    label:'Nenhum → Grau D', material:'Aquamarina de Éter',
    qN:1, qS:5, fN:100000, fS:500000, bPer:1, minR:9,
    ch:{ 9:[10,20],10:[20,30],11:[70,80],12:[70,80],13:[70,80],14:[70,80],15:[70,80],16:[80,90],17:[80,90],18:[80,90],19:[80,90],20:[80,90] }
  },
  d_to_c: {
    label:'Grau D → Grau C', material:'Topázio de Éter',
    qN:1, qS:5, fN:125000, fS:625000, bPer:3, minR:10,
    ch:{ 10:[20,30],11:[60,70],12:[60,70],13:[60,70],14:[60,70],15:[60,70],16:[70,80],17:[70,80],18:[70,80],19:[70,80],20:[70,80] }
  },
  c_to_b: {
    label:'Grau C → Grau B', material:'Ametista de Éter',
    qN:1, qS:5, fN:200000, fS:1000000, bPer:5, minR:11,
    ch:{ 11:[50,60],12:[50,60],13:[50,60],14:[50,60],15:[50,60],16:[60,70],17:[60,70],18:[60,70],19:[60,70],20:[60,70] }
  },
  b_to_a: {
    label:'Grau B → Grau A', material:'Âmbar de Éter',
    qN:2, qS:10, fN:500000, fS:2500000, bPer:7, minR:11,
    ch:{ 11:[40,50],12:[40,50],13:[40,50],14:[40,50],15:[40,50],16:[50,60],17:[50,60],18:[50,60],19:[50,60],20:[50,60] }
  }
};
const CRAFT = {
  'Aquamarina de Éter':{ npc:100000, pedra:3,  gem:'Aquamarina', gemId:720      },
  'Topázio de Éter':   { npc:200000, pedra:6,  gem:'Topázio',    gemId:728      },
  'Ametista de Éter':  { npc:300000, pedra:10, gem:'Ametista',   gemId:719      },
  'Âmbar de Éter':     { npc:500000, pedra:15, gem:'Âmbar',      gemId:1000321  },
};
const GK = { none:'none_to_d', d:'d_to_c', c:'c_to_b', b:'b_to_a' };
const NG = { none:'d', d:'c', c:'b', b:'a' };
const GL = { none:'Sem Grau', d:'Grau D', c:'Grau C', b:'Grau B', a:'Grau A' };
const S  = { grade:'none', target:'d', refine:11, process:'normal', event:false, bless:0 };
const D  = () => GRADES[GK[S.grade]];

// cadeia de transições do grau atual até o alvo
function chainKeys(){ const l=[]; let g=S.grade; while(g!==S.target){ l.push(GK[g]); g=NG[g]; } return l; }
function chainMinR(){ return Math.max(...chainKeys().map(k=>GRADES[k].minR)); }

function zf(n) {
  if (n >= 1000000) return (n/1000000).toFixed(n%1000000===0?0:1).replace('.',',')+'kk z';
  return (n/1000).toFixed(0)+'k z';
}

function setProcess(p) {
  S.process = p;
  document.getElementById('btn-normal').className = 'tbtn'+(p==='normal'?' act-red':'');
  document.getElementById('btn-safe').className   = 'tbtn'+(p==='safe'?' act-green':'');
  document.getElementById('process-hint').innerHTML = p==='normal'
    ? 'Falha = item <b style="color:#f2596b">destruído permanentemente</b>. Usa 1 minério.'
    : 'Falha = item <b style="color:#5cc47e">preservado</b>. Usa 5× (ou 10×) mais minério.';
  calc();
}

function setEvent(e) {
  S.event = e;
  document.getElementById('btn-no-event').className  = 'tbtn'+(!e?' act-gold':'');
  document.getElementById('btn-yes-event').className = 'tbtn'+(e?' act-gold':'');
  document.getElementById('tbl-lbl').textContent = e ? '— Evento Ativo' : '— Sem Evento';
  buildTable(); calc();
}

function onGradeChange() {
  S.grade = document.getElementById('sel-grade').value;
  const st = document.getElementById('sel-target'), prevT = S.target;
  st.innerHTML = '';
  const opts = []; let g = NG[S.grade];
  while (true) { opts.push(g); if (g === 'a') break; g = NG[g]; }
  opts.forEach(o => {
    const el = document.createElement('option');
    el.value = o; el.textContent = GL[o];
    st.appendChild(el);
  });
  st.value = opts.includes(prevT) ? prevT : opts[0];
  onTargetChange();
}

function onTargetChange() {
  S.target = document.getElementById('sel-target').value;
  const minR = chainMinR();
  const sr = document.getElementById('sel-refine');
  const prev = parseInt(sr.value) || minR;
  sr.innerHTML = '';
  for (let r=minR;r<=20;r++){
    const o=document.createElement('option');
    o.value=r; o.textContent='+'+r;
    if(r===Math.max(prev,minR)) o.selected=true;
    sr.appendChild(o);
  }
  S.refine=parseInt(sr.value);
  const chain = chainKeys();
  const maxB = Math.max(...chain.map(k=>GRADES[k].bPer))*10;
  if (S.bless > maxB) { S.bless = maxB; document.getElementById('inp-bless').value = maxB; }
  document.getElementById('hint-bless').innerHTML = chain.length === 1
    ? `+1% a cada <b>${GRADES[chain[0]].bPer}</b> bênção(s) · Máx: +10% (${GRADES[chain[0]].bPer*10} bênçãos)`
    : chain.map(k=>`→${k.slice(-1).toUpperCase()}: 1%/<b>${GRADES[k].bPer}</b>`).join(' · ') + ' bênçãos · Máx +10% por etapa';
  buildMarketRows();
  buildTable(); calc();
}

// linhas de preço de gema — uma por etapa da jornada
const mktCache = {};
function cacheMktPrice(name, el){ mktCache[name] = el.value; }
function buildMarketRows(){
  document.querySelectorAll('#gem-rows input').forEach(el=>{ if(el.dataset.name) mktCache[el.dataset.name]=el.value; });
  document.getElementById('gem-rows').innerHTML = chainKeys().map(k=>{
    const mat = CRAFT[GRADES[k].material];
    const val = mktCache[mat.gem] ? ` value="${mktCache[mat.gem]}"` : '';
    return `<div class="ipc">`
      + `<img class="ipc-icon" src="https://www.divine-pride.net/img/items/collection/iRO/${mat.gemId}" alt="${mat.gem}" onerror="this.style.visibility='hidden'">`
      + `<span class="ipc-name">${mat.gem}</span>`
      + `<div class="ipc-input"><input type="text" id="p-gem-${slug(mat.gem)}" data-name="${mat.gem}"${val}`
      + ` oninput="formatPrice(this);cacheMktPrice(this.dataset.name,this);calc()" placeholder="0" autocomplete="off">`
      + `<span class="price-unit">z</span></div></div>`;
  }).join('');
}

function onRefineChange() {
  S.refine=parseInt(document.getElementById('sel-refine').value);
  buildTable(); calc();
}

function onBlessChange() {
  const max=Math.max(...chainKeys().map(k=>GRADES[k].bPer))*10;
  let v=parseInt(document.getElementById('inp-bless').value)||0;
  if(v<0)v=0; if(v>max){v=max;document.getElementById('inp-bless').value=max;}
  S.bless=v; calc();
}

function gv(id) {
  const raw = document.getElementById(id).value.replace(/\./g,'').replace(/\D/g,'');
  return raw === '' ? 0 : parseInt(raw, 10);
}

function formatPrice(input) {
  const raw = input.value.replace(/\./g,'').replace(/\D/g,'');
  if (!raw) { input.value = ''; return; }
  const n = parseInt(raw, 10);
  input.value = n.toLocaleString('pt-BR');
}

function calc() {
  const ei=S.event?1:0, div=document.getElementById('results');
  const chain=chainKeys(), n=chain.length, isSafe=S.process==='safe';
  const pPo=gv('p-po'), pFerr=gv('p-ferr');
  document.getElementById('pr-ferr-row').style.display = S.bless>0 ? 'flex' : 'none';

  // dados de cada etapa da jornada
  const steps=[];
  for(const k of chain){
    const d=GRADES[k], ca=d.ch[S.refine];
    if(!ca){
      div.innerHTML=`<div class="warn-box">Refino +${S.refine} inválido para esta jornada. Mínimo: <b>+${chainMinR()}</b></div>`;
      document.getElementById('market-total').innerHTML='';
      return;
    }
    const base=ca[ei], bonus=Math.min(10,Math.floor(S.bless/d.bPer)), total=Math.min(100,base+bonus);
    const qty=isSafe?d.qS:d.qN, fee=isSafe?d.fS:d.fN;
    const mat=CRAFT[d.material];
    const po=(mat.pedra*qty)*5 + S.bless*5;
    const npc=fee+(mat.npc+mat.pedra*100000)*qty+S.bless*100000;
    const pGem=gv('p-gem-'+slug(mat.gem));
    steps.push({d,base,bonus,total,p:total/100,qty,mat,po,npc,market:po*pPo+qty*pGem+S.bless*pFerr,hasGem:pGem>0});
  }

  // tentativas esperadas por etapa:
  //  seguro: 1/p (item preservado, etapas independentes)
  //  normal: falha destrói o item e a jornada recomeça — V_i = 1/(p_i*p_{i+1}*...*p_n)
  const V=new Array(n);
  if(isSafe){ for(let i=0;i<n;i++) V[i]=steps[i].p>0?1/steps[i].p:Infinity; }
  else{ let acc=1; for(let i=n-1;i>=0;i--){ acc*=steps[i].p; V[i]=acc>0?1/acc:Infinity; } }
  const finite=V.every(isFinite);
  const attempts=V.reduce((a,v)=>a+v,0);
  const expNPC=steps.reduce((a,s,i)=>a+V[i]*s.npc,0);
  const expMkt=steps.reduce((a,s,i)=>a+V[i]*s.market,0);
  const hasMarket=pPo>0||pFerr>0||steps.some(s=>s.hasGem);
  const direct=Math.round(steps.reduce((a,s)=>a*s.p,1)*100);
  const itemsUsed=isSafe?1:steps.reduce((a,s,i)=>a+V[i]*(1-s.p),0)+1;
  const first=steps[0];
  const fmt=v=>finite?zf(Math.round(v)):'∞';
  const fcnt=v=>finite?Math.ceil(v).toLocaleString('pt-BR'):'∞';

  // ── market total panel (col 2) ──
  const mt=document.getElementById('market-total');
  if(n===1){
    mt.innerHTML=`
    <div class="sub-lbl" style="margin-top:0;margin-bottom:6px">Por tentativa</div>
    <div class="zeny-row"><span class="zeny-k">NPC (taxas + craft)</span><span class="zeny-v">${zf(first.npc)}</span></div>
    <div class="zeny-row"><span class="zeny-k">Mercado (gemas + pó${S.bless>0?' + bênçãos':''})</span><span class="zeny-v">${hasMarket?zf(first.market):'—'}</span></div>
    <div class="zeny-row zeny-total"><span class="zeny-k">Total / tentativa</span><span class="zeny-v">${zf(first.npc+(hasMarket?first.market:0))}</span></div>
    ${finite?`
    <div class="sub-lbl" style="margin-top:10px;margin-bottom:6px">Esperado (~${V[0].toFixed(1)} tentativas)</div>
    <div class="zeny-row"><span class="zeny-k">NPC esperado</span><span class="zeny-v">${fmt(expNPC)}</span></div>
    ${hasMarket?`<div class="zeny-row"><span class="zeny-k">Mercado esperado</span><span class="zeny-v">${fmt(expMkt)}</span></div>`:''}
    <div class="zeny-row zeny-total"><span class="zeny-k">TOTAL esperado</span><span class="zeny-v v-gold">${fmt(expNPC+(hasMarket?expMkt:0))}</span></div>
    `:''}
    ${!hasMarket?`<div class="hint" style="margin-top:6px">Insira preços de mercado acima para ver o custo total real.</div>`:''}`;
  } else {
    mt.innerHTML=`
    <div class="sub-lbl" style="margin-top:0;margin-bottom:6px">Custo esperado por etapa</div>
    ${steps.map((s,i)=>`<div class="zeny-row"><span class="zeny-k">${s.d.label}</span><span class="zeny-v">${fmt(V[i]*(s.npc+s.market))}</span></div>`).join('')}
    <div class="sub-lbl" style="margin-top:10px;margin-bottom:6px">Jornada completa (~${finite?attempts.toFixed(1):'∞'} tentativas)</div>
    <div class="zeny-row"><span class="zeny-k">NPC esperado</span><span class="zeny-v">${fmt(expNPC)}</span></div>
    ${hasMarket?`<div class="zeny-row"><span class="zeny-k">Mercado esperado</span><span class="zeny-v">${fmt(expMkt)}</span></div>`:''}
    <div class="zeny-row zeny-total"><span class="zeny-k">TOTAL esperado</span><span class="zeny-v v-gold">${fmt(expNPC+(hasMarket?expMkt:0))}</span></div>
    ${!hasMarket?`<div class="hint" style="margin-top:6px">Insira preços de mercado acima para ver o custo total real.</div>`:''}`;
  }

  // ── results panel (col 3) ──
  if(n===1){
    const rc=first.total>=60?'rg-good':first.total>=35?'rg-mid':'rg-bad';
    div.innerHTML=`
    <div class="res-top">
      <div class="chance-ring ${rc}">
        <div class="ring-pct">${first.total}%</div>
        <div class="ring-lbl">Sucesso</div>
      </div>
      <div class="kv-list">
        <div class="kv"><span class="kv-k">Transição</span><span class="kv-v">${first.d.label}</span></div>
        <div class="kv"><span class="kv-k">Refino</span><span class="kv-v">+${S.refine}</span></div>
        <div class="kv"><span class="kv-k">Chance base</span><span class="kv-v">${first.base}%</span></div>
        <div class="kv"><span class="kv-k">Bônus bênçãos</span><span class="kv-v v-green">+${first.bonus}%</span></div>
        <div class="kv"><span class="kv-k">Chance total</span><span class="kv-v v-gold">${first.total}%</span></div>
        <div class="kv"><span class="kv-k">Em caso de falha</span><span class="kv-v ${isSafe?'v-green':'v-red'}">${isSafe?'Item preservado':'Item DESTRUÍDO'}</span></div>
        <div class="kv"><span class="kv-k">Tentativas esperadas</span><span class="kv-v">${finite?'~'+V[0].toFixed(2):'∞'}</span></div>
      </div>
    </div>
    <hr class="div">
    <div class="sub-lbl">Materiais por tentativa — ${isSafe?'Seguro':'Normal'}</div>
    <div class="mat-row"><span>${first.d.material}</span><span class="mat-qty">× ${first.qty}</span></div>
    ${S.bless>0?`<div class="mat-row"><span>Bênção de Éter</span><span class="mat-qty">× ${S.bless}</span></div>`:''}
    <div class="raw-box">
      <div class="raw-title">Materiais brutos</div>
      <div class="mat-row"><span>Pó de Éter</span><span class="mat-qty">× ${first.po}</span></div>
      <div class="mat-row"><span>${first.mat.gem} <span style="color:var(--muted);font-size:.85em">(mercado)</span></span><span class="mat-qty">× ${first.qty}</span></div>
      ${S.bless>0?`<div class="mat-row"><span>Bênção de Éter</span><span class="mat-qty">× ${S.bless}</span></div>`:''}
    </div>
    <div class="pbar-track" style="margin-top:10px"><div class="pbar-fill" style="width:${first.total}%"></div></div>
    <div class="exp-note" style="margin-top:6px">${isSafe
      ?'Processo seguro: item nunca é destruído.'
      :'⚠ Processo normal: item destruído em falha.'
    }</div>`;
  } else {
    const rc=direct>=60?'rg-good':direct>=35?'rg-mid':'rg-bad';
    div.innerHTML=`
    <div class="res-top">
      <div class="chance-ring ${rc}">
        <div class="ring-pct" style="font-size:1.5em">${direct}%</div>
        <div class="ring-lbl">sem falhar</div>
      </div>
      <div class="kv-list">
        <div class="kv"><span class="kv-k">Jornada</span><span class="kv-v">${GL[S.grade]} → ${GL[S.target]}</span></div>
        <div class="kv"><span class="kv-k">Refino</span><span class="kv-v">+${S.refine}</span></div>
        ${steps.map(s=>`<div class="kv"><span class="kv-k">${s.d.label}</span><span class="kv-v">${s.total}%${s.bonus>0?` <span class="v-green">(+${s.bonus}%)</span>`:''}</span></div>`).join('')}
        <div class="kv"><span class="kv-k">Tentativas esperadas</span><span class="kv-v v-gold">${finite?'~'+attempts.toFixed(1):'∞'}</span></div>
        <div class="kv"><span class="kv-k">Em caso de falha</span><span class="kv-v ${isSafe?'v-green':'v-red'}">${isSafe?'Item preservado':'Item DESTRUÍDO'}</span></div>
        ${!isSafe&&finite?`<div class="kv"><span class="kv-k">Itens gastos (média)</span><span class="kv-v v-red">~${itemsUsed.toFixed(2)}</span></div>`:''}
      </div>
    </div>
    <hr class="div">
    <div class="sub-lbl">Materiais esperados — jornada completa (${isSafe?'Seguro':'Normal'})</div>
    ${steps.map((s,i)=>`<div class="mat-row"><span>${s.d.material}</span><span class="mat-qty">× ${fcnt(V[i]*s.qty)}</span></div>`).join('')}
    ${S.bless>0?`<div class="mat-row"><span>Bênção de Éter</span><span class="mat-qty">× ${fcnt(S.bless*attempts)}</span></div>`:''}
    <div class="raw-box">
      <div class="raw-title">Materiais brutos esperados</div>
      <div class="mat-row"><span>Pó de Éter</span><span class="mat-qty">× ${fcnt(steps.reduce((a,s,i)=>a+V[i]*s.po,0))}</span></div>
      ${steps.map((s,i)=>`<div class="mat-row"><span>${s.mat.gem} <span style="color:var(--muted);font-size:.85em">(mercado)</span></span><span class="mat-qty">× ${fcnt(V[i]*s.qty)}</span></div>`).join('')}
    </div>
    <div class="pbar-track" style="margin-top:10px"><div class="pbar-fill" style="width:${direct}%"></div></div>
    <div class="exp-note" style="margin-top:6px">${isSafe
      ?'Processo seguro: o item nunca é destruído — o esperado soma as etapas de forma independente.'
      :'⚠ Processo normal: falha em QUALQUER etapa destrói o item e a jornada recomeça do zero — o cálculo já inclui refazer as etapas anteriores.'
    }</div>`;
  }
}

function buildTable() {
  const ei=S.event?1:0, tb=document.getElementById('chances-body');
  tb.innerHTML='';
  for(let r=9;r<=20;r++){
    const nd=GRADES.none_to_d.ch[r], dc=GRADES.d_to_c.ch[r],
          cb=GRADES.c_to_b.ch[r],   ba=GRADES.b_to_a.ch[r];
    const hl=r===S.refine;
    const tr=document.createElement('tr');
    if(hl) tr.className='hl';
    const c=a=>a?`<td>${a[ei]}%</td>`:`<td class="na">—</td>`;
    tr.innerHTML=`<td>+${r}</td>${c(nd)}${c(dc)}${c(cb)}${c(ba)}`;
    tb.appendChild(tr);
  }
}

function init(){
  onGradeChange();
  setProcess('normal');
  setEvent(false);
}
init();

// ── dicas (modal) ──
function openGuide(sec){
  document.getElementById('guide-overlay').classList.add('open');
  const el=document.getElementById(sec);
  if(el && el.scrollIntoView) el.scrollIntoView({block:'start'});
}
function closeGuide(){ document.getElementById('guide-overlay').classList.remove('open'); }
document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeGuide(); tourStop(); } });

// ── tour guiado "ver na prática" ─────────────────────────
const TOUR = { steps:null, i:-1, timer:null, dur:0, paused:false, active:false };
const tourWait = ms => new Promise(r=>setTimeout(r,ms));
function tourZ(){ return parseFloat(getComputedStyle(document.body).zoom)||1; }

// digita um preço dígito a dígito, disparando o oninput real do campo
async function typePrice(id, digits){
  const el=document.getElementById(id); if(!el) return;
  el.value='';
  for(const ch of digits){
    el.value=el.value.replace(/\./g,'')+ch;
    el.dispatchEvent(new Event('input'));
    await tourWait(75);
  }
}

function tourStart(steps){
  tourStop(); closeGuide(); unlockAllSteps();
  if(!document.getElementById('tour-spot')){
    const s=document.createElement('div'); s.id='tour-spot'; document.body.appendChild(s);
    const t=document.createElement('div'); t.id='tour-tip'; document.body.appendChild(t);
  }
  TOUR.steps=steps; TOUR.i=-1; TOUR.active=true; TOUR.paused=false;
  tourNext();
}

async function tourRun(){
  const st=TOUR.steps[TOUR.i];
  if(st.do){ try{ await st.do(); }catch(e){} }
  await tourWait(60);
  const el=st.el?document.querySelector(st.el):null;
  if(el && el.scrollIntoView){ el.scrollIntoView({behavior:'smooth',block:'center'}); await tourWait(430); }
  if(!TOUR.active) return;
  const tip=document.getElementById('tour-tip');
  TOUR.dur = st.ms || Math.max(3400, 2200 + st.text.length*32);
  tip.innerHTML=`<div class="tt-step">Passo ${TOUR.i+1} de ${TOUR.steps.length}</div>
    <div class="tt-text">${st.text}</div>
    <div class="tt-btns">
      <div class="tt-btn" onclick="tourStop()">✕ Sair</div>
      <div class="tt-btn" id="tt-pause" onclick="tourPause()">⏸ Pausar</div>
      <div class="tt-btn primary" onclick="tourNext()">Avançar ▸</div>
    </div>
    <div class="tt-bar"><div id="tt-bar" style="animation:ttbar ${TOUR.dur}ms linear forwards"></div></div>`;
  tourPos();
  clearTimeout(TOUR.timer);
  if(!TOUR.paused) TOUR.timer=setTimeout(tourNext, TOUR.dur);
}

function tourPos(){
  if(!TOUR.active || TOUR.i<0) return;
  const st=TOUR.steps[TOUR.i];
  const spot=document.getElementById('tour-spot'), tip=document.getElementById('tour-tip');
  if(!spot||!tip) return;
  const Z=tourZ(), vw=window.innerWidth/Z, vh=window.innerHeight/Z;
  const el=st.el?document.querySelector(st.el):null;
  if(el){
    const r=el.getBoundingClientRect();
    spot.style.display='block';
    spot.style.left=(r.left/Z-6)+'px'; spot.style.top=(r.top/Z-6)+'px';
    spot.style.width=(r.width/Z+12)+'px'; spot.style.height=(r.height/Z+12)+'px';
  } else spot.style.display='none';
  const tw=tip.offsetWidth, th=tip.offsetHeight;
  let tl, tt;
  if(el){
    const r=el.getBoundingClientRect(), rl=r.left/Z, rt=r.top/Z, rh=r.height/Z;
    tl=Math.min(Math.max(10,rl), vw-tw-10);
    tt=rt+rh+16;
    if(tt+th>vh-10) tt=rt-th-16;
    if(tt<10) tt=10;
  } else { tl=(vw-tw)/2; tt=(vh-th)/2; }
  tip.style.left=tl+'px'; tip.style.top=tt+'px';
}
window.addEventListener('resize', tourPos);
window.addEventListener('scroll', tourPos, true);

function tourNext(){
  if(!TOUR.active) return;
  clearTimeout(TOUR.timer);
  TOUR.i++;
  if(TOUR.i>=TOUR.steps.length){ tourStop(); return; }
  tourRun();
}

function tourPause(){
  if(!TOUR.active) return;
  TOUR.paused=!TOUR.paused;
  const b=document.getElementById('tt-pause'), bar=document.getElementById('tt-bar');
  if(b) b.textContent=TOUR.paused?'▶ Continuar':'⏸ Pausar';
  if(bar) bar.style.animationPlayState=TOUR.paused?'paused':'running';
  clearTimeout(TOUR.timer);
  if(!TOUR.paused) TOUR.timer=setTimeout(tourNext, Math.max(2000, TOUR.dur/2));
}

function tourStop(){
  if(!TOUR.active && !document.getElementById('tour-spot')) return;
  TOUR.active=false; clearTimeout(TOUR.timer);
  const s=document.getElementById('tour-spot'), t=document.getElementById('tour-tip');
  if(s) s.remove(); if(t) t.remove();
}

function tourGrau(){
  tourStart([
    {text:'Bem-vindo! Vou simular um cálculo real: <b>Sem Grau → Grau A</b> no <b>+13</b>. Os campos vão se preencher sozinhos — só observe. Use <b>⏸</b> para ler com calma ou <b>Avançar</b> para acelerar.'},
    {el:'#sel-grade', do:async()=>{ document.getElementById('sel-grade').value='none'; onGradeChange(); },
     text:'<b>Grau Atual</b>: o grau em que seu item está hoje. Vamos partir do <b>Sem Grau</b>.'},
    {el:'#sel-target', do:async()=>{ document.getElementById('sel-target').value='a'; onTargetChange(); },
     text:'<b>Grau Alvo</b>: escolhi <b>Grau A</b> — a calculadora monta a jornada completa: D → C → B → A, etapa por etapa.'},
    {el:'#sel-refine', do:async()=>{ document.getElementById('sel-refine').value='13'; onRefineChange(); },
     text:'<b>Refino</b>: quanto maior, melhor a chance de grau. No <b>+13</b> as etapas têm 70/60/50/40%. A partir do <b>+16</b> as chances sobem!'},
    {el:'#btn-normal',
     text:'<b>Processo Normal</b>: uma falha <b>destrói o item</b> para sempre. O resultado já mostra quantos itens são consumidos em média na jornada.'},
    {el:'#inp-bless', do:async()=>{ document.getElementById('inp-bless').value='35'; onBlessChange(); },
     text:'<b>Bênção de Éter</b>: coloquei 35 — cada etapa converte em bônus de até +10% (o D usa 1 por 1%, o A usa 7).'},
    {el:'#p-po', do:async()=>{ await typePrice('p-po','3500'); },
     text:'<b>Preços de mercado</b>: digitei o Pó de Éter a 3.500z. Repare no painel de custo reagindo em tempo real…'},
    {el:'#gem-rows', do:async()=>{ await typePrice('p-gem-aquamarina','80000'); await typePrice('p-gem-topazio','120000'); await typePrice('p-gem-ametista','250000'); await typePrice('p-gem-ambar','400000'); },
     text:'…e o preço das <b>gemas de cada etapa</b>. Preencha com os valores do seu servidor para um custo realista.'},
    {el:'#market-total',
     text:'Aqui a calculadora soma <b>NPC + mercado</b> e projeta o <b>custo total esperado</b> da jornada, já contando as falhas e repetições.'},
    {el:'#results',
     text:'E o <b>resultado</b>: o anel é a chance de chegar ao A <b>sem nenhuma falha</b>; abaixo, a chance de cada etapa, as tentativas esperadas e todos os materiais para separar.'},
    {text:'Agora é com você! Os valores da demonstração ficaram na tela — ajuste para o seu caso. 💡 Experimente o processo <b>Seguro</b> para comparar os custos.'},
  ]);
}

function tourSim(){
  tourStart([
    {text:'Vamos ao <b>Simulador de Refino</b>: levar uma arma gradeada do <b>+0 ao +12</b> usando BSB. Só observe — e use <b>⏸</b> se quiser ler com calma.'},
    {el:'#sim-equip', do:async()=>{ document.getElementById('sim-equip').value='weapon'; onSimConfig(); },
     text:'<b>Equipamento</b>: Arma Nv.5 usa Eteridecon/Bradium; Armadura Nv.2 usa Eterium/Carnium.'},
    {el:'#sim-target', do:async()=>{ document.getElementById('sim-start').value='0'; document.getElementById('sim-target').value='12'; onSimConfig(); },
     text:'<b>Jornada</b>: do +0 ao <b>+12</b>. Até o +3 é 100% garantido — o risco começa no +4.'},
    {el:'#sim-lowcat', do:async()=>{ document.getElementById('sim-lowcat').value='esp'; onSimConfig(); },
     text:'<b>Minério +0~+9</b>: escolhi o <b>Enriquecido</b> — mais caro, mas na falha o item cai só 1 refino em vez de 3.'},
    {el:'#sim-bsb-yes', do:async()=>{ setSimBSB(true); },
     text:'<b>BSB ativada</b>: do +7 ao +13 o item não cai nem quebra na falha. Sem ela, falhar acima do +9 <b>destrói o item gradeado</b>!'},
    {el:'#sim-ore-list', do:async()=>{ const i=document.querySelector('#sim-ore-list input'); if(i){ i.value=''; for(const c of '95000'){ i.value=i.value.replace(/\./g,'')+c; i.dispatchEvent(new Event('input')); await tourWait(75); } } },
     text:'<b>Preços</b>: informe o minério-base (a taxa do NPC já é somada automaticamente). Digitei um exemplo…'},
    {el:'#sim-bsb-price-row', do:async()=>{ await typePrice('sim-bsbprice','1200000'); },
     text:'…e o preço da <b>BSB</b>, que costuma ser o item mais pesado do custo.'},
    {el:'#sim-cost',
     text:'O <b>custo esperado</b> da jornada inteira aparece aqui: minérios + BSB.'},
    {el:'#sim-results',
     text:'E o <b>resultado</b>: tentativas esperadas, minérios por tipo e BSB consumidas. É a média matemática exata (cadeia de Markov), não um sorteio.'},
    {text:'Fim! Ajuste os campos para o seu caso real. 💡 Compare <b>Comum × Enriquecido</b> e <b>com × sem BSB</b> para achar o caminho mais barato.'},
  ]);
}

// ── Refine section ──────────────────────────────────────
const RS = { tab:'com', event:false };

// [noEvent%, event%]
const REFINE_COM = {
  // common ores, Arma Nv.5 = Armadura Nv.2 (same values)
  1:[100,100],2:[100,100],3:[100,100],
  4:[60,80],5:[60,80],6:[40,60],7:[40,60],8:[20,40],9:[20,40],
  10:[9,18],11:[8,16],12:[8,16],13:[8,16],14:[8,16],
  15:[7,14],16:[7,14],17:[7,14],18:[7,14],19:[5,10],20:[5,10]
};
const REFINE_ESP = {
  // special ores, Arma Nv.5 = Armadura Nv.2
  1:[100,100],2:[100,100],3:[100,100],
  4:[90,95],5:[70,85],6:[60,70],7:[60,65],8:[40,55],9:[40,45],
  10:[25,25],11:[20,20],12:[20,20],13:[20,20],14:[20,20],
  15:[15,15],16:[15,15],17:[15,15],18:[15,15],19:[10,10],20:[10,10]
};

function setRefineTab(t) {
  RS.tab = t;
  document.getElementById('r-tab-com').className = 'tab-btn'+(t==='com'?' active':'');
  document.getElementById('r-tab-esp').className = 'tab-btn'+(t==='esp'?' active':'');
  const hint = t==='com'
    ? 'Eteridecon / Eterium (+0~+9) &nbsp;·&nbsp; Bradium de Éter / Carnium de Étel (+10~+19)'
    : 'Enriquecido (+0~+9) &nbsp;·&nbsp; Perfeito (+10~+14 ou +15~+19)';
  document.getElementById('r-hint').innerHTML = hint;
  buildRefineTable();
}

function setRefineEvent(e) {
  RS.event = e;
  document.getElementById('r-tab-nev').className = 'tab-btn'+(!e?' active':'');
  document.getElementById('r-tab-ev').className  = 'tab-btn'+(e?' active':'');
  buildRefineTable();
}

function buildRefineTable() {
  const ei = RS.event ? 1 : 0;
  const data = RS.tab === 'com' ? REFINE_COM : REFINE_ESP;
  const penLo = RS.tab === 'com' ? 'Perde 3 refinos' : 'Perde 1 refino';
  const tb = document.getElementById('refine-body');
  tb.innerHTML = '';
  for (let r = 1; r <= 20; r++) {
    const arr = data[r];
    const pct = arr[ei];
    const isHL = r === S.refine;
    const pen = r >= 10 ? 'Perde item' : (pct === 100 ? '—' : penLo);
    const penColor = pen === 'Perde item' ? '#ef6a6a' : pen === '—' ? '#4e3f66' : '#d99a3a';
    const tr = document.createElement('tr');
    if (isHL) tr.className = 'hl';
    tr.innerHTML = `<td>+${r}</td><td>${pct}%</td><td>${pct}%</td><td style="color:${penColor}">${pen}</td>`;
    tb.appendChild(tr);
  }
}

setRefineTab('com');
setRefineEvent(false);

// ══════════════════════════════════════════════════════════
// SIMULADOR DE REFINO (item gradeado)
// ══════════════════════════════════════════════════════════
const SIM = { equip:'weapon', start:0, target:11, event:false,
              lowCat:'com', hiCat:'com', useBSB:true, bsbFrom:7, bsbTo:13,
              obtain:'craft', bsbPer:1 };
const simPriceCache = {};

// receita de cada minério especial (taxa NPC + minério-base + pó de éter)
const SIM_ORE = {
  weapon: {
    low:   { com:{name:'Eteridecon',                base:'Oridecon',          npc:10000, po:1},
             esp:{name:'Eteridecon Enriquecido',    base:'Oridecon Enriq.',   npc:20000, po:2} },
    hiCom: {name:'Bradium de Éter',                 base:'Bradium',           npc:30000, po:3},
    hi10:  {name:'Eteridecon Perfeito',             base:'Oridecon Perfeito', npc:50000, po:3},
    hi15:  {name:'Bradium de Éter Perfeito',        base:'Bradium Perfeito',  npc:50000, po:3}
  },
  armor: {
    low:   { com:{name:'Eterium',                   base:'Elunium',           npc:10000, po:1},
             esp:{name:'Eterium Enriquecido',       base:'Elunium Enriq.',    npc:20000, po:2} },
    hiCom: {name:'Carnium de Étel',                 base:'Carnium',           npc:50000, po:3},
    hi10:  {name:'Eterium Perfeito',                base:'Elunium Perfeito',  npc:50000, po:3},
    hi15:  {name:'Carnium Perfeito de Étel',        base:'Carnium Perfeito',  npc:50000, po:3}
  }
};

function oreAt(r) {
  const E = SIM_ORE[SIM.equip];
  if (r <= 9) return SIM.lowCat === 'com' ? E.low.com : E.low.esp;
  if (SIM.hiCat === 'com') return E.hiCom;      // Bradium/Carnium comum +10~+19
  return r <= 14 ? E.hi10 : E.hi15;             // Perfeito +10~+14 / +15~+19
}
function catAt(r) { return r <= 9 ? SIM.lowCat : SIM.hiCat; }
function succAt(r, ei) {
  const t = catAt(r) === 'com' ? REFINE_COM : REFINE_ESP;
  return (t[r] !== undefined ? t[r][ei] : 100) / 100;   // r=0 e faixa segura = 100%
}
function bsbActive(r) { return SIM.useBSB && r >= SIM.bsbFrom && r <= SIM.bsbTo; }

function slug(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase(); }
function pval(id){ const el=document.getElementById(id); if(!el) return 0;
  const raw=el.value.replace(/\./g,'').replace(/\D/g,''); return raw===''?0:parseInt(raw,10); }
function cacheSimPrice(name,el){ simPriceCache[name]=el.value; }

// resolve A·x = b por eliminação de Gauss (n pequeno)
function linSolve(A, b){
  const n=b.length, M=A.map((row,i)=>row.slice().concat(b[i]));
  for(let c=0;c<n;c++){
    let piv=c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[piv][c])) piv=r;
    if(Math.abs(M[piv][c])<1e-12) continue;
    [M[c],M[piv]]=[M[piv],M[c]];
    const d=M[c][c]; for(let j=c;j<=n;j++) M[c][j]/=d;
    for(let r=0;r<n;r++) if(r!==c){ const f=M[r][c]; if(f) for(let j=c;j<=n;j++) M[r][j]-=f*M[c][j]; }
  }
  return M.map(row=>row[n]);
}

// cadeia de Markov: estados = níveis 0..T-1 (transitórios), T = sucesso, item quebrado = falha absorvente
function simSolve(){
  const T=SIM.target, ei=SIM.event?1:0, n=T;
  const A=Array.from({length:n},()=>new Array(n).fill(0));
  const bsuc=new Array(n).fill(0);
  let dead=false;
  for(let r=0;r<T;r++){
    const p=succAt(r,ei);
    if(r+1===T) bsuc[r]+=p; else A[r][r+1]+=p;   // sucesso → sobe 1
    const q=1-p;
    if(q>1e-12){
      let dest;
      if(bsbActive(r)) dest=r;                    // BSB: segura o nível
      else if(r<=9){ dest=Math.max(0, r-(SIM.lowCat==='com'?3:1)); } // cai N níveis
      else { dest=-1; dead=true; }                // +10 sem BSB → item quebra
      if(dest>=0) A[r][dest]+=q;
    }
  }
  // prob. de sucesso: (I−A)Q = bsuc
  const IA=Array.from({length:n},(_,i)=>A[i].map((v,j)=>(i===j?1:0)-v));
  const Q=linSolve(IA,bsuc);
  // visitas esperadas por nível: (I−Aᵀ)V = e_start
  const IAt=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>(i===j?1:0)-A[j][i]));
  const e=new Array(n).fill(0); e[Math.min(SIM.start,n-1)]=1;
  const V=linSolve(IAt,e);
  return { V, success:Q[Math.min(SIM.start,n-1)], dead };
}

// ── lista de preços dinâmica (um campo por minério da jornada) ──
function simOres(){
  const seen={}, list=[];
  for(let r=0;r<SIM.target;r++){ const o=oreAt(r); if(!seen[o.name]){ seen[o.name]=1; list.push(o); } }
  return list;
}
function buildSimPrices(){
  // guarda valores atuais antes de recriar
  document.querySelectorAll('#sim-ore-list input').forEach(el=>{ if(el.dataset.name) simPriceCache[el.dataset.name]=el.value; });
  const craft = SIM.obtain==='craft';
  const html = simOres().map(o=>{
    const label = craft
      ? `${o.base} <span style="color:var(--muted);font-size:.82em">→ ${o.name}</span>`
      : o.name;
    const val = simPriceCache[o.name] ? ` value="${simPriceCache[o.name]}"` : '';
    return `<div class="ipc"><span class="ipc-name">${label}</span>`
      + `<div class="ipc-input"><input type="text" id="sim-ore-${slug(o.name)}" data-name="${o.name}"${val}`
      + ` oninput="formatPrice(this);cacheSimPrice(this.dataset.name,this);simCalc()" placeholder="0" autocomplete="off">`
      + `<span class="price-unit">z</span></div></div>`;
  }).join('');
  document.getElementById('sim-ore-list').innerHTML = html;
  document.getElementById('sim-po-row').style.display = craft ? 'flex' : 'none';
  document.getElementById('sim-price-hint').textContent = craft
    ? 'Preço do minério-base + Pó de Éter (a taxa de NPC já está inclusa no cálculo).'
    : 'Preço do minério já pronto para refinar.';
}

function clampSim(id,min,max,def){
  const el=document.getElementById(id); let v=parseInt(el.value);
  if(isNaN(v)) return def;
  if(v>max){ v=max; el.value=max; }
  if(v<min){ v=min; el.value=min; }
  return v;
}
function readSim(){
  SIM.equip  = document.getElementById('sim-equip').value;
  SIM.lowCat = document.getElementById('sim-lowcat').value;
  SIM.hiCat  = document.getElementById('sim-hicat').value;
  SIM.start  = clampSim('sim-start',0,19,0);
  SIM.target = clampSim('sim-target',1,20,11);
  if(SIM.target<=SIM.start){ SIM.target=SIM.start+1; document.getElementById('sim-target').value=SIM.target; }
  SIM.bsbFrom= clampSim('sim-bsb-from',7,13,7);
  SIM.bsbTo  = clampSim('sim-bsb-to',7,13,13);
  if(SIM.bsbTo<SIM.bsbFrom){ SIM.bsbTo=SIM.bsbFrom; document.getElementById('sim-bsb-to').value=SIM.bsbTo; }
  SIM.bsbPer = clampSim('sim-bsbper',1,999,1);
}
function onSimConfig(){ readSim(); buildSimPrices(); simCalc(); }

function setSimEvent(e){
  SIM.event=e;
  document.getElementById('sim-ev-no').className ='tbtn'+(!e?' act-gold':'');
  document.getElementById('sim-ev-yes').className='tbtn'+( e?' act-gold':'');
  simCalc();
}
function setSimBSB(b){
  SIM.useBSB=b;
  document.getElementById('sim-bsb-no').className ='tbtn'+(!b?' act-red':'');
  document.getElementById('sim-bsb-yes').className='tbtn'+( b?' act-green':'');
  document.getElementById('sim-bsb-range').style.display    = b?'grid':'none';
  document.getElementById('sim-bsb-price-row').style.display= b?'flex':'none';
  simCalc();
}
function setSimObtain(o){
  SIM.obtain=o;
  document.getElementById('sim-obt-craft').className='tbtn'+(o==='craft'?' act-gold':'');
  document.getElementById('sim-obt-buy').className  ='tbtn'+(o==='buy'  ?' act-gold':'');
  buildSimPrices(); simCalc();
}

function simCalc(){
  const res=simSolve(), V=res.V;
  const poPrice=pval('sim-po'), bsbPrice=pval('sim-bsbprice'), craft=SIM.obtain==='craft';

  const oreCount={}; let attempts=0, poTotal=0, bsbCount=0, oreCost=0;
  for(let r=0;r<SIM.target;r++){
    const v=V[r]; if(!(v>1e-9)) continue;
    const o=oreAt(r);
    attempts+=v;
    oreCount[o.name]=(oreCount[o.name]||0)+v;
    poTotal+=v*o.po;
    if(bsbActive(r)) bsbCount+=v*SIM.bsbPer;
    const price=pval('sim-ore-'+slug(o.name));
    oreCost += v*(craft ? (o.npc + price + o.po*poPrice) : price);
  }
  const bsbCost=bsbCount*bsbPrice;
  const total=oreCost+bsbCost;
  const hasPrices = total>0;
  const success=res.success, dead=res.dead;
  const factor = (dead && success>1e-9) ? 1/success : 1;  // p/ garantir 1 item no alvo

  // ── painel de resultado (col 3) ──
  const pct=Math.round(success*100);
  const rc = success>=0.999?'rg-good':success>=0.6?'rg-mid':'rg-bad';
  const oreRows=Object.keys(oreCount).map(nm=>
    `<div class="mat-row"><span>${nm}</span><span class="mat-qty">× ${Math.ceil(oreCount[nm]*factor).toLocaleString('pt-BR')}</span></div>`).join('');

  document.getElementById('sim-results').innerHTML=`
    <div class="res-top">
      <div class="chance-ring ${rc}">
        <div class="ring-pct">${dead?pct+'%':'100%'}</div>
        <div class="ring-lbl">${dead?'chega ao alvo':'garantido'}</div>
      </div>
      <div class="kv-list">
        <div class="kv"><span class="kv-k">Jornada</span><span class="kv-v">+${SIM.start} → +${SIM.target}</span></div>
        <div class="kv"><span class="kv-k">Tentativas esperadas</span><span class="kv-v v-gold">~${(attempts*factor).toFixed(1)}</span></div>
        <div class="kv"><span class="kv-k">Minérios (total)</span><span class="kv-v">~${Math.ceil(attempts*factor).toLocaleString('pt-BR')}</span></div>
        ${SIM.useBSB?`<div class="kv"><span class="kv-k">BSB usadas</span><span class="kv-v v-green">~${Math.ceil(bsbCount*factor).toLocaleString('pt-BR')}</span></div>`:''}
        ${craft?`<div class="kv"><span class="kv-k">Pó de Éter</span><span class="kv-v">~${Math.ceil(poTotal*factor).toLocaleString('pt-BR')}</span></div>`:''}
        ${dead?`<div class="kv"><span class="kv-k">Itens gastos (média)</span><span class="kv-v v-red">~${factor.toFixed(2)}</span></div>`:''}
      </div>
    </div>
    <hr class="div">
    <div class="sub-lbl">Minérios por tipo${dead?' — para garantir 1 no +'+SIM.target:''}</div>
    ${oreRows}
    ${dead?`<div class="warn-box" style="margin-top:10px">Sem BSB acima do +9, a falha <b>destrói o item</b>. Chance de um item chegar ao +${SIM.target}: <b>${pct}%</b> — em média <b>${factor.toFixed(2)} itens</b> são consumidos. Considere usar BSB no trecho +10~+13.</div>`
      :`<div class="exp-note" style="margin-top:8px">BSB segura o nível de +${SIM.bsbFrom} a +${SIM.bsbTo}: o item nunca cai nem quebra nesse trecho.</div>`}`;

  // ── painel de custo (col 2) ──
  const zt=n=>zf(Math.round(n));
  document.getElementById('sim-cost').innerHTML = !hasPrices
    ? `<div class="hint">Insira os preços acima para ver o custo estimado${dead?' (para garantir 1 item no alvo)':''}.</div>`
    : `<div class="sub-lbl" style="margin-top:0;margin-bottom:6px">Custo esperado${dead?' — 1 item no +'+SIM.target:' — +'+SIM.start+' → +'+SIM.target}</div>
       <div class="zeny-row"><span class="zeny-k">Minérios${craft?' (base+pó+NPC)':''}</span><span class="zeny-v">${zt(oreCost*factor)}</span></div>
       ${SIM.useBSB&&bsbPrice>0?`<div class="zeny-row"><span class="zeny-k">BSB</span><span class="zeny-v">${zt(bsbCost*factor)}</span></div>`:''}
       <div class="zeny-row zeny-total"><span class="zeny-k">Total esperado</span><span class="zeny-v v-gold">${zt(total*factor)}</span></div>`;
}

function simInit(){
  readSim();
  setSimEvent(false); setSimBSB(true); setSimObtain('craft');
  buildSimPrices(); simCalc();
}
simInit();

// ══════════════════════════════════════════════════════════
// UX: passos progressivos, boas-vindas e botão de ajuda
// ══════════════════════════════════════════════════════════
const LSW='gc-welcome', LSS='gc-steps';
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

const STEP_COVERS=['g2','g3','s2','s3'];
function coverEl(n){ return document.getElementById('cover-'+n); }

function unlockStep(n){
  const c=coverEl(n); if(!c || c.classList.contains('hide')) return;
  c.classList.add('hide');
  setTimeout(()=>{ c.style.display='none'; }, 450);
  // quando todas as etapas já foram vistas uma vez, não bloqueia mais
  if(STEP_COVERS.every(x=>{ const el=coverEl(x); return !el || el.classList.contains('hide'); })) lsSet(LSS,'1');
}
function unlockAllSteps(){ STEP_COVERS.forEach(unlockStep); }

function initSteps(){
  if(lsGet(LSS)==='1'){ STEP_COVERS.forEach(n=>{ const c=coverEl(n); if(c){ c.classList.add('hide'); c.style.display='none'; } }); return; }
  const touch=(id,fn)=>{
    const el=document.getElementById(id); if(!el) return;
    ['change','input'].forEach(ev=>el.addEventListener(ev,fn));
    el.addEventListener('click', e=>{ if(e.target.closest('.tbtn')) fn(); });
  };
  touch('grau-config-card', ()=>unlockStep('g2'));  // mexeu na config → abre preços
  touch('grau-price-card',  ()=>unlockStep('g3'));  // digitou preço → abre resultado
  touch('sim-config-card',  ()=>unlockStep('s2'));
  touch('sim-price-card',   ()=>unlockStep('s3'));
}

// widget de boas-vindas (primeira visita)
function initWelcome(){
  if(!lsGet(LSW)) document.getElementById('welcome').style.display='flex';
}
function dismissWelcome(){ lsSet(LSW,'1'); document.getElementById('welcome').style.display='none'; }
function welcomeTour(){ dismissWelcome(); tourGrau(); }

// botão flutuante de ajuda
function toggleHelpMenu(){ document.getElementById('help-menu').classList.toggle('open'); }
document.addEventListener('click', e=>{
  if(!e.target.closest('#help-fab') && !e.target.closest('#help-menu'))
    document.getElementById('help-menu').classList.remove('open');
});

initSteps(); initWelcome();