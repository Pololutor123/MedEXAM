// ══════════════════════════════════════════════════════
// STUDENT EXAM LIST
// ══════════════════════════════════════════════════════
function renderExamList() {
const el = document.getElementById('exam-list');
if (!exams.length) { el.innerHTML=`<div class="empty-state"><div class="icon">📋</div><p>Aucune épreuve disponible.</p></div>`; return; }
el.innerHTML = exams.map(ex=>`
<div class="card" style="margin-bottom:12px">
<div class="flex items-center gap-12">
<div style="flex:1;min-width:0">
<div style="font-weight:800;font-size:1rem;margin-bottom:4px">${esc(ex.title)}</div>
${ex.description?`<div style="color:var(--text3);font-size:.82rem;margin-bottom:8px">${esc(ex.description)}</div>`:''}
<div class="flex gap-8 items-center" style="flex-wrap:wrap">
${ex.dossiers.map(d=>`<span class="badge badge-${kindBadge(d.kind)}">${d.kind}</span>`).join('')}
${ex.timerMinutes>0?`<span style="font-size:.75rem;color:var(--text3)">⏱ ${ex.timerMinutes} min</span>`:''}
<span style="font-size:.72rem;color:var(--text3)">${ex.dossiers.length} dossier(s) · ${ex.dossiers.reduce((s,d)=>s+d.questions.length,0)} questions</span>
</div>
</div>
<button class="btn btn-primary" onclick="startSession('${ex.id}')">Commencer →</button>
</div>
</div>`).join('');
}

// ══════════════════════════════════════════════════════
// SESSION
// ══════════════════════════════════════════════════════
let sessionExam = null;
let sessionAnswers = {}; // {di: {qi: answer}}
let sessionRevealedIdx = {}; // {di: revealedIdx}
let sessionSubmittedMap = {}; // {di: {qi: true}}
let sessionDoneMap = {}; // {di: true}
let sessionActiveDossier = 0;
let sessionForceSubmit = false;
let timerInterval = null;
let timerRemaining = 0;

function startSession(examId) {
sessionExam = exams.find(e=>e.id===examId);
if (!sessionExam) return;
sessionAnswers = {}; sessionRevealedIdx = {}; sessionSubmittedMap = {}; sessionDoneMap = {};
sessionActiveDossier = 0; sessionForceSubmit = false;
sessionExam.dossiers.forEach((_,i)=>{ sessionRevealedIdx[i]=0; sessionSubmittedMap[i]={}; sessionAnswers[i]={}; });
document.getElementById('exam-list-view').classList.add('hidden');
document.getElementById('results-view').classList.add('hidden');
document.getElementById('session-view').classList.remove('hidden');
renderSession();
if (sessionExam.timerMinutes>0) startTimer(sessionExam.timerMinutes*60);
}

function startTimer(seconds) {
clearInterval(timerInterval);
timerRemaining = seconds;
updateTimerUI();
timerInterval = setInterval(()=>{
timerRemaining--;
updateTimerUI();
if (timerRemaining<=0) { clearInterval(timerInterval); forceFinish(); }
},1000);
}

function updateTimerUI() {
const el = document.getElementById('session-timer');
if (!el) return;
const m=Math.floor(timerRemaining/60), s=timerRemaining%60;
el.textContent=`⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
const pct = timerRemaining/(sessionExam.timerMinutes*60);
el.className='timer'+(pct<0.2?' urgent':pct<0.4?' warning':'');
}

function forceFinish() {
sessionForceSubmit = true;
sessionExam.dossiers.forEach((_,i)=>{
if (sessionExam.dossiers[i].kind!=='QI') {
const qs = sessionExam.dossiers[i].questions;
qs.forEach((_,qi)=>{ sessionSubmittedMap[i][qi]=true; });
sessionRevealedIdx[i] = qs.length-1;
sessionDoneMap[i]=true;
}
});
finishSession();
}

function sessionAnswered(di, qi) {
const q = sessionExam.dossiers[di].questions[qi];
const a = sessionAnswers[di]?.[qi];
if (!a) return false;
if (q.type==='QROC') return typeof a==='string'&&a.trim().length>0;
return Array.isArray(a)&&a.length>0;
}

function totalAnswered() {
let t=0;
sessionExam.dossiers.forEach((d,di)=>{
d.questions.forEach((_,qi)=>{ if(sessionAnswered(di,qi)) t++; });
});
return t;
}
function totalQuestions() { return sessionExam.dossiers.reduce((s,d)=>s+d.questions.length,0); }

function dossierAnsweredCount(di) {
const d=sessionExam.dossiers[di];
return d.questions.filter((_,qi)=>sessionAnswered(di,qi)).length;
}

function renderSession() {
const sv = document.getElementById('session-view');
const total=totalQuestions(), answered=totalAnswered();
const pct=total>0?Math.round(answered/total*100):0;
const timerHtml = sessionExam.timerMinutes>0?`<div class="timer" id="session-timer">⏱ --:--</div>`:'';

sv.innerHTML=`
<div class="session-layout">
<aside class="session-sidebar" id="session-sidebar"></aside>
<div class="session-main">
<div class="session-topbar">
<div class="progress-wrap">
<div class="progress-labels"><span>Progression</span><span id="prog-label">${answered}/${total} (${pct}%)</span></div>
<div class="progress-bar-bg"><div class="progress-bar-fill" id="prog-fill" style="width:${pct}%"></div></div>
</div>
${timerHtml}
<button class="btn btn-primary btn-sm" onclick="finishSession()">Terminer →</button>
</div>
<div class="session-content" id="session-content"></div>
</div>
</div>`;

renderSidebar();
renderActiveDossier();
if (sessionExam.timerMinutes>0) {
// re-attach timer display to already-running interval
updateTimerUI();
}
}

function renderSidebar() {
const sb = document.getElementById('session-sidebar');
if (!sb) return;
sb.innerHTML=`<div class="sidebar-title">Dossiers</div>`+sessionExam.dossiers.map((d,i)=>{
const done=dossierAnsweredCount(i), total=d.questions.length;
const pct=total>0?Math.round(done/total*100):0;
const isActive=i===sessionActiveDossier;
const kindCls=d.kind.toLowerCase();
return `<button class="sidebar-btn${isActive?' active':''}" onclick="switchDossier(${i})">
<div class="flex items-center gap-8">
<span class="sidebar-kind ${isActive?'':kindCls}">${d.kind}</span>
${done===total&&total>0?`<span class="sidebar-check">✓</span>`:''}
</div>
<span class="sidebar-dos-title">${esc(d.title)||'Dossier '+(i+1)}</span>
<div class="sidebar-mini-progress">
<div class="sidebar-mini-bar"><div class="sidebar-mini-fill" style="width:${pct}%"></div></div>
<span class="sidebar-mini-count">${done}/${total}</span>
</div>
</button>`;
}).join('');
}

function switchDossier(i) {
sessionActiveDossier=i;
renderSidebar();
renderActiveDossier();
}

function renderActiveDossier() {
const sc = document.getElementById('session-content');
if (!sc) return;
const d = sessionExam.dossiers[sessionActiveDossier];
const di = sessionActiveDossier;

let html=`<div class="dos-card">
<div class="dos-header ${d.kind.toLowerCase()}">
<span class="dos-kind">${d.kind}</span>
<span class="dos-title-text">${esc(d.title)||'Dossier '+(di+1)}</span>
<span class="dos-qcount">${d.kind==='QI'?d.questions.length+' q.':''}</span>
</div>
<div class="dos-body">`;

if (d.context) html+=`<div class="context-box"><div class="context-label">Contexte clinique</div><div class="context-text">${esc(d.context)}</div>${d.contextImageUrl?`<img src="${esc(d.contextImageUrl)}" style="max-height:200px;margin-top:10px">`:''}
</div>`;

if (d.kind==='QI') {
html+=`<div class="qi-hint">💡 Ces questions sont modifiables librement jusqu'à la fin de l'épreuve.</div>`;
d.questions.forEach((q,qi)=>{ html+=renderStudentQuestion(q,qi,di,false,false,null); });
} else {
const revealed=sessionRevealedIdx[di];
const done=sessionDoneMap[di];
// Show validated (locked, not result mode)
for (let i=0;i<revealed;i++) {
html+=renderStudentQuestion(d.questions[i],i,di,true,false,null);
}
if (!done) {
html+=renderStudentQuestion(d.questions[revealed],revealed,di,false,false,null);
html+=`<div style="display:flex;justify-content:flex-end;margin-top:12px">
<button class="btn btn-primary" id="validate-btn" onclick="validateQuestion(${di})" ${sessionAnswered(di,revealed)?'':'disabled'}>
${revealed<d.questions.length-1?'Valider et continuer →':'Terminer ce dossier'}
</button></div>`;
} else {
html+=`<div class="done-banner">✓ Dossier terminé</div>`;
}
}

html+=`</div></div>`;
sc.innerHTML=html;
}

function renderStudentQuestion(q, qi, di, locked, showResult, score) {
const answer = sessionAnswers[di]?.[qi];
let html=`<div class="q-student${locked?' locked':''}" id="qblock-${di}-${qi}">
<div class="q-student-head">
<div class="q-num-circle">${qi+1}</div>
<div style="flex:1">
<div class="q-meta">
<span class="badge badge-${typeBadge(q.type)}">${q.type}</span>
${q.type==='QRP'?`<span style="font-size:.75rem;color:var(--purple)">${q.qrpExpectedCount} vraie(s) sur ${q.propositions.length}</span>`:''}
${q.type==='QCM'?`<span style="font-size:.75rem;color:#1d4ed8">Plusieurs réponses</span>`:''}
${q.type==='QRU'?`<span style="font-size:.75rem;color:var(--emerald)">Une seule réponse</span>`:''}
${locked&&!showResult?`<span class="q-lock-label">🔒 Validée</span>`:''}
</div>
<div class="q-text">${esc(q.text)}</div>
${q.imageUrl?`<img src="${esc(q.imageUrl)}" style="max-height:180px;margin-top:8px">`:''}
${q.videoUrl?`<video src="${esc(q.videoUrl)}" controls style="max-height:180px;width:100%;margin-top:8px"></video>`:''}
</div>
</div>
<div class="q-body">`;

if (q.type==='QROC') {
const val=typeof answer==='string'?answer:'';
let cls='qroc-input';
if(showResult) cls+=score===1?' res-ok':' res-wrong';
html+=`<input type="text" class="${cls}" value="${esc(val)}" placeholder="${locked?'—':'Votre réponse…'}" ${locked?'disabled':''}
oninput="setQROCAnswer(${di},${qi},this.value)">`;
if(showResult&&score<1) html+=`<div class="qroc-expected">Attendu : ${esc((q.correctTexts||[]).filter(t=>t.trim()).join(', '))}</div>`;
if(showResult&&score===1) {
const g=(val||'').trim().toLowerCase();
const match=(q.correctTexts||[]).find(t=>levenshtein(g,t.trim().toLowerCase())<=2)||'';
const hasTypo = match && levenshtein(g,match.trim().toLowerCase())>0;
html+=`<div class="qroc-ok-msg">✓ Bonne réponse${hasTypo?' (faute tolérée)':''}</div>`;
}
} else {
q.propositions.forEach((p,i)=>{
const chosen=(Array.isArray(answer)&&answer.includes(i));
const isCorrect=q.correctIndices.includes(i);
let cls='prop-option';
if(locked||showResult) cls+=' locked-opt';
if(showResult){
if(isCorrect&&chosen) cls+=' res-correct-chosen';
else if(isCorrect&&!chosen) cls+=' res-correct-missing';
else if(!isCorrect&&chosen) cls+=' res-wrong-chosen';
else cls+=' res-neutral';
} else if(chosen) cls+=' selected';
const boxType=q.type==='QRU'?'radio':'';
html+=`<div class="${cls}" ${!locked&&!showResult?`onclick="toggleAnswer(${di},${qi},${i},${q.type==='QRU'})"`:''}">
<div class="prop-box ${boxType}${chosen?' checked':''}"></div>
<span class="prop-label">${esc(p)}</span>
${showResult&&isCorrect?`<span class="prop-correct-mark">✓</span>`:''}
</div>`;
});
}

html+=`</div>`; // q-body

if(showResult) {
const s=score??0;
const cls=s===1?'perfect':s>0?'partial':'zero';
html+=`<div class="q-score ${cls}">${s===1?'✓':s>0?'~':'✗'} ${Math.round(s*100)/100}/1</div>`;
}

html+=`</div>`; // q-student
return html;
}

function toggleAnswer(di, qi, idx, single) {
const q = sessionExam.dossiers[di].questions[qi];
let ans = sessionAnswers[di]?.[qi];
if (!Array.isArray(ans)) ans=[];
if (single) { ans=[idx]; }
else { ans=ans.includes(idx)?ans.filter(x=>x!==idx):[...ans,idx]; }
sessionAnswers[di][qi]=ans;
updateProgress();
// re-render just the dossier (keeps focus area current)
renderActiveDossier();
renderSidebar();
}

function setQROCAnswer(di, qi, val) {
sessionAnswers[di][qi]=val;
updateProgress();
updateValidateBtn(di, qi);
renderSidebar();
}

function updateValidateBtn(di, qi) {
const btn=document.getElementById('validate-btn');
if(btn) btn.disabled=!sessionAnswered(di,qi);
}

function updateProgress() {
const answered=totalAnswered(), total=totalQuestions();
const pct=total>0?Math.round(answered/total*100):0;
const lbl=document.getElementById('prog-label'); if(lbl) lbl.textContent=`${answered}/${total} (${pct}%)`;
const fill=document.getElementById('prog-fill'); if(fill) fill.style.width=pct+'%';
}

function validateQuestion(di) {
const d=sessionExam.dossiers[di];
const qi=sessionRevealedIdx[di];
sessionSubmittedMap[di][qi]=true;
if(qi<d.questions.length-1) {
sessionRevealedIdx[di]=qi+1;
} else {
sessionDoneMap[di]=true;
}
renderActiveDossier();
renderSidebar();
}

async function finishSession() {
clearInterval(timerInterval);
document.getElementById('session-view').classList.add('hidden');
const rv=document.getElementById('results-view');
rv.classList.remove('hidden');
rv.innerHTML=buildResultsHTML(null);
const error = await saveSessionResult();
rv.innerHTML=buildResultsHTML(error);
}

function buildResultsHTML(saveError) {
let total=0, max=0;
sessionExam.dossiers.forEach((d,di)=>{
d.questions.forEach((q,qi)=>{ total+=computeScore(q,sessionAnswers[di]?.[qi]); max++; });
});
const pct=max>0?Math.round(total/max*100):0;
const color=pct>=80?'emerald':pct>=60?'indigo':pct>=40?'amber':'rose';
const barColor=pct>=80?'var(--emerald)':pct>=60?'var(--indigo)':pct>=40?'var(--amber)':'var(--rose)';
const savedLabel = saveError===null ? '… enregistrement en cours' : saveError ? '⚠ Échec de l\'enregistrement du résultat' : '✓ Résultat enregistré';

let html=`<div class="results-hero">
<div class="results-name">${esc(currentUser.pseudo)}</div>
<div class="results-exam-title">${esc(sessionExam.title)}</div>
<div class="results-score color-${color}">${Math.round(total*100)/100}<span>/${max}</span></div>
<div class="results-pct color-${color}">${pct}%</div>
<div class="results-bar-wrap"><div class="results-bar" style="width:${pct}%;background:${barColor}"></div></div>
<div class="results-saved">${savedLabel}</div>
</div>`;

sessionExam.dossiers.forEach((d,di)=>{
let dTotal=0;
d.questions.forEach((q,qi)=>dTotal+=computeScore(q,sessionAnswers[di]?.[qi]));
html+=`<div class="dos-card" style="margin-bottom:12px">
<div class="dos-header ${d.kind.toLowerCase()}">
<span class="dos-kind">${d.kind}</span>
<span class="dos-title-text">${esc(d.title)||'Dossier '+(di+1)}</span>
<span class="dos-qcount">${Math.round(dTotal*100)/100}/${d.questions.length}</span>
</div>
<div class="dos-body">`;
d.questions.forEach((q,qi)=>{
const s=computeScore(q,sessionAnswers[di]?.[qi]);
html+=renderStudentQuestion(q,qi,di,true,true,s);
});
html+=`</div></div>`;
});

html+=`<div style="text-align:center;padding:24px 0">
<button class="btn btn-secondary" onclick="backToList()">← Retour aux épreuves</button>
</div>`;
return html;
}

async function saveSessionResult() {
const total = sessionExam.dossiers.reduce((s,d,di)=>s+d.questions.reduce((ss,q,qi)=>ss+computeScore(q,sessionAnswers[di]?.[qi]),0),0);
const max = sessionExam.dossiers.reduce((s,d)=>s+d.questions.length,0);
const pct = max>0?Math.round(total/max*100):0;
const { error } = await sb.from('resultats').insert({
id:uid(), utilisateur_id:currentUser.id, pseudo:currentUser.pseudo,
epreuve_id:sessionExam.id, titre_epreuve:sessionExam.title,
score:Math.round(total*100)/100, score_max:max, pourcentage:pct
});
if (error) console.error(error);
return error;
}

function backToList() {
document.getElementById('results-view').classList.add('hidden');
document.getElementById('exam-list-view').classList.remove('hidden');
renderExamList();
}
