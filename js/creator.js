// ══════════════════════════════════════════════════════
// CREATOR
// ══════════════════════════════════════════════════════
let creatorDossierState=[]; // [{id,kind,title,context,contextImageUrl,questions:[]}]
let editingExamId = null;

function addDossier(kind) {
const d={id:uid(),kind,title:'',context:'',contextImageUrl:'',questions:[newQuestion('QCM')]};
creatorDossierState.push(d);
renderCreatorDossiers();
}

function newQuestion(type) {
return {id:uid(),type,text:'',imageUrl:'',videoUrl:'',propositions:['',''],correctIndices:[],correctTexts:[],qrpExpectedCount:2};
}

function renderCreatorDossiers() {
const container=document.getElementById('creator-dossiers');
container.innerHTML=creatorDossierState.map((d,di)=>buildDossierEditorHTML(d,di)).join('');
}

function buildDossierEditorHTML(d,di) {
const kindCls=d.kind.toLowerCase();
const label={DP:'Dossier Progressif',KFP:'Key Feature Problem',QI:'Questions Isolées'}[d.kind];
let html=`<div class="dossier-block" id="dos-block-${d.id}">
<div class="dossier-header ${kindCls}" onclick="toggleDossierBody('${d.id}')">
<span class="dossier-kind-label">${d.kind} ${di+1}</span>
<input type="text" value="${esc(d.title)}" placeholder="Titre — ${label}…" onclick="event.stopPropagation()" oninput="updateDossierField('${d.id}','title',this.value)" style="max-width:300px">
<span class="dossier-count">${d.questions.length} q.</span>
<span class="dossier-toggle" id="dtog-${d.id}">▼</span>
<button class="dossier-del" onclick="event.stopPropagation();deleteDossier('${d.id}')">✕</button>
</div>
<div class="dossier-body open" id="dbody-${d.id}">`;

if(d.kind!=='QI') {
html+=`<div class="form-group"><label class="form-label">Contexte clinique</label>
<textarea rows="3" placeholder="Texte du cas clinique…" oninput="updateDossierField('${d.id}','context',this.value)">${esc(d.context)}</textarea>
<div class="flex gap-8" style="margin-top:6px">
<input type="text" id="ctximg-${d.id}" value="${esc(d.contextImageUrl)}" placeholder="URL image du contexte (optionnel)" oninput="updateDossierField('${d.id}','contextImageUrl',this.value)">
<label class="btn btn-secondary btn-sm" style="cursor:pointer">📤<input type="file" accept="image/*" style="display:none" onchange="uploadDossierMedia(event,'${d.id}')"></label>
</div></div>`;
} else {
html+=`<div class="qi-hint" style="margin-bottom:12px">💡 Questions librement modifiables jusqu'à la fin de l'épreuve.</div>`;
}

html+=`<span class="section-label">Questions</span>`;
html+=d.questions.map((q,qi)=>buildQuestionEditorHTML(d.id,di,q,qi)).join('');
html+=`<div class="flex gap-8 mt-12" style="flex-wrap:wrap">
${['QCM','QRU','QRP','QROC'].map(t=>`<button class="btn btn-secondary btn-sm" onclick="addQuestion('${d.id}','${t}')">+ ${t}</button>`).join('')}
</div>`;
html+=`</div></div>`;
return html;
}

function buildQuestionEditorHTML(did, di, q, qi) {
const noCorrect = q.type!=='QROC' && q.correctIndices.length===0;
const noTexts = q.type==='QROC' && !(q.correctTexts||[]).filter(t=>t.trim()).length;
const warn = noCorrect||noTexts;
let html=`<div class="q-editor${warn?' warn-border':''}" id="qed-${q.id}">
<div class="q-editor-head">
<span class="q-num">Q${qi+1}</span>
<select class="q-type-sel" onchange="changeQuestionType('${did}','${q.id}',this.value)">
${['QCM','QRU','QRP','QROC'].map(t=>`<option${q.type===t?' selected':''}>${t}</option>`).join('')}
</select>
<span class="badge badge-${typeBadge(q.type)}">${q.type}</span>
${q.type==='QRP'?`<span class="qrp-count">Vraies attendues:<input type="number" min="1" max="12" value="${q.qrpExpectedCount}" style="width:52px" oninput="updateQField('${did}','${q.id}','qrpExpectedCount',parseInt(this.value)||1)"></span>`:''}
${warn?`<span class="q-warn">⚠ Aucune réponse définie</span>`:''}
<button class="q-del" onclick="deleteQuestion('${did}','${q.id}')">✕</button>
</div>
<div class="form-group mb-8">
<textarea rows="2" placeholder="Texte de la question…" oninput="updateQField('${did}','${q.id}','text',this.value)">${esc(q.text)}</textarea>
</div>
<div class="form-row mb-8">
<input type="text" id="img-${q.id}" value="${esc(q.imageUrl)}" placeholder="URL image (optionnel)" oninput="updateQField('${did}','${q.id}','imageUrl',this.value)">
<label class="btn btn-secondary btn-sm" style="cursor:pointer">📤<input type="file" accept="image/*" style="display:none" onchange="uploadQMedia(event,'${did}','${q.id}','imageUrl')"></label>
<input type="text" id="vid-${q.id}" value="${esc(q.videoUrl)}" placeholder="URL vidéo (optionnel)" oninput="updateQField('${did}','${q.id}','videoUrl',this.value)">
<label class="btn btn-secondary btn-sm" style="cursor:pointer">📤<input type="file" accept="video/*" style="display:none" onchange="uploadQMedia(event,'${did}','${q.id}','videoUrl')"></label>
</div>`;

if(q.type==='QROC'){
html+=`<span class="section-label">Réponses acceptées (une par ligne, tolérance ≤2 fautes)</span>
<textarea rows="3" placeholder="Réponse 1&#10;Réponse 2&#10;…" oninput="updateQCorrectTexts('${did}','${q.id}',this.value)">${esc((q.correctTexts||[]).join('\n'))}</textarea>`;
} else {
html+=`<span class="section-label">Propositions — ${q.type==='QRU'?'une seule bonne réponse':'cochez les bonnes réponses'}${q.type==='QRP'?` (${q.qrpExpectedCount} vraies attendues)`:''}</span>`;
q.propositions.forEach((p,pi)=>{
const checked=q.correctIndices.includes(pi);
const inputType=q.type==='QRU'?'radio':'checkbox';
html+=`<div class="prop-row">
<input type="${inputType}" name="correct-${q.id}" ${checked?'checked':''} class="prop-check"
onchange="toggleCorrect('${did}','${q.id}',${pi},${q.type==='QRU'})">
<input type="text" value="${esc(p)}" placeholder="Proposition ${pi+1}" oninput="updateProposition('${did}','${q.id}',${pi},this.value)">
${q.propositions.length>2?`<button class="prop-del" onclick="removeProposition('${did}','${q.id}',${pi})">✕</button>`:''}
</div>`;
});
const max=q.type==='QRP'?12:5;
if(q.propositions.length<max) html+=`<button class="btn btn-ghost btn-sm add-prop-btn" onclick="addProposition('${did}','${q.id}')">+ Proposition</button>`;
}
html+=`</div>`;
return html;
}

// Creator state helpers
function getDossier(did) { return creatorDossierState.find(d=>d.id===did); }
function getQuestion(did,qid) { const d=getDossier(did); return d?d.questions.find(q=>q.id===qid):null; }

function toggleDossierBody(did) {
const body=document.getElementById('dbody-'+did);
const tog=document.getElementById('dtog-'+did);
const open=body.classList.toggle('open');
tog.textContent=open?'▼':'▶';
}
function updateDossierField(did,field,val) { const d=getDossier(did); if(d) d[field]=val; }
async function uploadMediaFile(file) {
const path = `${Date.now()}_${file.name}`;
const { error } = await sb.storage.from('medias-epreuves').upload(path, file);
if (error) { alert('Échec upload : '+error.message); return null; }
const { data } = sb.storage.from('medias-epreuves').getPublicUrl(path);
return data.publicUrl;
}
async function uploadDossierMedia(event, did) {
const file = event.target.files[0]; if (!file) return;
const url = await uploadMediaFile(file); if (!url) return;
updateDossierField(did,'contextImageUrl',url);
const input = document.getElementById('ctximg-'+did); if (input) input.value = url;
}
async function uploadQMedia(event, did, qid, field) {
const file = event.target.files[0]; if (!file) return;
const url = await uploadMediaFile(file); if (!url) return;
updateQField(did,qid,field,url);
const input = document.getElementById((field==='imageUrl'?'img-':'vid-')+qid); if (input) input.value = url;
}
function deleteDossier(did) {
creatorDossierState=creatorDossierState.filter(d=>d.id!==did);
renderCreatorDossiers();
}
function addQuestion(did,type) {
const d=getDossier(did); if(!d) return;
d.questions.push(newQuestion(type));
renderCreatorDossiers();
}
function deleteQuestion(did,qid) {
const d=getDossier(did); if(!d) return;
d.questions=d.questions.filter(q=>q.id!==qid);
renderCreatorDossiers();
}
function updateQField(did,qid,field,val) {
const q=getQuestion(did,qid); if(q) q[field]=val;
// refresh warning badge only
const ed=document.getElementById('qed-'+qid);
if(ed){
const noC=q.type!=='QROC'&&q.correctIndices.length===0;
const noT=q.type==='QROC'&&!(q.correctTexts||[]).filter(t=>t.trim()).length;
ed.classList.toggle('warn-border',noC||noT);
}
}
function updateQCorrectTexts(did,qid,val) {
const q=getQuestion(did,qid); if(q) q.correctTexts=val.split('\n');
updateQField(did,qid,'correctTexts',q.correctTexts);
}
function changeQuestionType(did,qid,type) {
const q=getQuestion(did,qid); if(!q) return;
q.type=type; q.correctIndices=[]; q.correctTexts=[];
renderCreatorDossiers();
}
function toggleCorrect(did,qid,idx,single) {
const q=getQuestion(did,qid); if(!q) return;
if(single){ q.correctIndices=[idx]; }
else { q.correctIndices=q.correctIndices.includes(idx)?q.correctIndices.filter(x=>x!==idx):[...q.correctIndices,idx]; }
const ed=document.getElementById('qed-'+qid);
if(ed) ed.classList.toggle('warn-border',q.correctIndices.length===0);
}
function updateProposition(did,qid,pi,val) {
const q=getQuestion(did,qid); if(q) q.propositions[pi]=val;
}
function addProposition(did,qid) {
const q=getQuestion(did,qid); if(!q) return;
const max=q.type==='QRP'?12:5;
if(q.propositions.length<max){ q.propositions.push(''); renderCreatorDossiers(); }
}
function removeProposition(did,qid,pi) {
const q=getQuestion(did,qid); if(!q) return;
q.propositions=q.propositions.filter((_,i)=>i!==pi);
q.correctIndices=q.correctIndices.filter(x=>x!==pi).map(x=>x>pi?x-1:x);
renderCreatorDossiers();
}

async function saveExam() {
const title=document.getElementById('c-title').value.trim();
if(!title||creatorDossierState.length===0) {
alert('Donnez un titre et ajoutez au moins un dossier.'); return;
}
const exam={
id:editingExamId||uid(),
title,
description:document.getElementById('c-desc').value.trim(),
timerMinutes:parseInt(document.getElementById('c-timer').value)||0,
dossiers:JSON.parse(JSON.stringify(creatorDossierState))
};
const error = await saveExamToDB(exam);
if (error) { alert('Échec de l\'enregistrement : '+error.message); return; }
exams = await loadExams();
// Reset
editingExamId=null; creatorDossierState=[];
document.getElementById('c-title').value='';
document.getElementById('c-desc').value='';
document.getElementById('c-timer').value='0';
document.getElementById('creator-title-label').textContent='Nouvelle épreuve';
renderCreatorDossiers();
renderCreatorExamList();
const msg=document.getElementById('save-msg');
msg.textContent='✓ Épreuve enregistrée !'; msg.classList.remove('hidden');
setTimeout(()=>msg.classList.add('hidden'),2500);
}

function renderCreatorExamList() {
const el=document.getElementById('creator-exam-list');
if(!exams.length){ el.innerHTML=''; return; }
el.innerHTML=`<div style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">Épreuves enregistrées (${exams.length})</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
<button class="btn btn-secondary btn-sm" onclick="exportJSON()">⬇ Exporter JSON</button>
<label class="btn btn-secondary btn-sm" style="cursor:pointer">⬆ Importer JSON<input type="file" accept=".json" style="display:none" onchange="importJSON(event)"></label>
</div>
${exams.map(ex=>`<div class="flex items-center gap-12" style="padding:10px 0;border-top:1px solid var(--gray-b)">
<div style="flex:1;min-width:0">
<div style="font-weight:600;font-size:.88rem">${esc(ex.title)}</div>
<div style="font-size:.72rem;color:var(--text3)">${ex.dossiers.length} dossier(s) · ${ex.dossiers.reduce((s,d)=>s+d.questions.length,0)} q.${ex.timerMinutes>0?' · ⏱ '+ex.timerMinutes+'min':''}</div>
</div>
<button class="btn btn-secondary btn-sm" onclick="editExam('${ex.id}')">Éditer</button>
<button class="btn btn-danger btn-sm" onclick="deleteExam('${ex.id}')">Suppr.</button>
</div>`).join('')}`;
}

function editExam(id) {
const ex=exams.find(e=>e.id===id); if(!ex) return;
editingExamId=id;
document.getElementById('c-title').value=ex.title;
document.getElementById('c-desc').value=ex.description||'';
document.getElementById('c-timer').value=ex.timerMinutes||0;
document.getElementById('creator-title-label').textContent="Modifier l'épreuve";
creatorDossierState=JSON.parse(JSON.stringify(ex.dossiers));
renderCreatorDossiers();
document.getElementById('creator-form-card').scrollIntoView({behavior:'smooth'});
}

async function deleteExam(id) {
if(!confirm('Supprimer cette épreuve ?')) return;
const error = await deleteExamFromDB(id);
if (error) { alert('Échec de la suppression : '+error.message); return; }
exams = await loadExams();
renderCreatorExamList(); renderExamList();
}

function exportJSON() {
const blob=new Blob([JSON.stringify(exams,null,2)],{type:'application/json'});
const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='medexam_epreuves.json'; a.click();
}
function importJSON(e) {
const f=e.target.files[0]; if(!f) return;
const r=new FileReader();
r.onload=async ev=>{
try{
const d=JSON.parse(ev.target.result);
if(Array.isArray(d)){
for (const ex of d) {
if (!exams.find(existing=>existing.id===ex.id)) await saveExamToDB({ id:ex.id||uid(), title:ex.title, description:ex.description, timerMinutes:ex.timerMinutes, dossiers:ex.dossiers });
}
exams = await loadExams();
renderCreatorExamList(); renderExamList();
}
}catch{ alert('Fichier invalide.'); }
};
r.readAsText(f); e.target.value='';
}
