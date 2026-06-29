// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
async function renderDashboard() {
const results=await loadResultsForDashboard();
document.getElementById('dash-count').textContent=results.length+' résultat(s) enregistré(s)';
const el=document.getElementById('dashboard-content');
if(!results.length){ el.innerHTML=`<div class="empty-state"><div class="icon">📊</div><p>Aucun résultat enregistré.</p><p style="font-size:.82rem;margin-top:4px">Les scores apparaîtront ici après les premières épreuves.</p></div>`; return; }

// Group by exam
const byExam={};
results.forEach(r=>{ if(!byExam[r.examId]) byExam[r.examId]={title:r.examTitle,entries:[]}; byExam[r.examId].entries.push(r); });

el.innerHTML=Object.entries(byExam).map(([eid,{title,entries}])=>{
const ranked=[...entries].sort((a,b)=>b.pct-a.pct);
const medals=['🥇','🥈','🥉'];
return `<div class="ranking-card">
<div class="ranking-header"><h3>${esc(title)}</h3><small>${entries.length} passage(s)</small></div>
${ranked.map((r,i)=>{
const color=r.pct>=80?'var(--emerald)':r.pct>=60?'var(--indigo)':r.pct>=40?'var(--amber)':'var(--rose)';
return `<div class="rank-row${i<3?' top':''}">
<span class="rank-medal">${medals[i]||i+1+'.'}</span>
<div class="rank-info"><div class="rank-name">${esc(r.pseudo)}</div><div class="rank-date">${new Date(r.date).toLocaleString('fr-FR')}</div></div>
<div class="rank-score-wrap">
<div class="rank-pct" style="color:${color}">${r.pct}%</div>
<div class="rank-pts">${r.score}/${r.max}</div>
<div class="rank-bar-wrap"><div class="rank-bar" style="width:${r.pct}%;background:${color}"></div></div>
</div>
<button class="rank-del" onclick="deleteResult('${r.id}')" title="Supprimer">✕</button>
</div>`;
}).join('')}
</div>`;
}).join('');
}

async function deleteResult(id) {
await deleteResultFromDB(id);
await renderDashboard();
}
async function clearAllResults() {
if(!confirm('Supprimer TOUS les résultats ?')) return;
await deleteAllResultsFromDB();
await renderDashboard();
}

async function exportCSV() {
const BOM = String.fromCharCode(0xFEFF);
const results=await loadResultsForDashboard();
const rows=[['Pseudo','Épreuve','Score','Sur','Pourcentage','Date'],...results.map(r=>[r.pseudo,r.examTitle,r.score,r.max,r.pct+'%',new Date(r.date).toLocaleString('fr-FR')])];
const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
const blob=new Blob([BOM+csv],{type:'text/csv;charset=utf-8'});
const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='resultats_medexam.csv'; a.click();
}
