// ══════════════════════════════════════════════════════
// STORAGE (Supabase)
// ══════════════════════════════════════════════════════
async function loadExams() {
const { data, error } = await sb.from('epreuves').select('*').order('date_creation');
if (error) { console.error(error); return []; }
return data.map(row => ({ id:row.id, title:row.titre, description:row.description||'', timerMinutes:row.duree_minutes||0, dossiers:row.dossiers }));
}
async function saveExamToDB(exam) {
const { error } = await sb.from('epreuves').upsert({
id:exam.id, titre:exam.title, description:exam.description, duree_minutes:exam.timerMinutes,
dossiers:exam.dossiers, cree_par:currentUser.id
});
return error;
}
async function deleteExamFromDB(id) {
const { error } = await sb.from('epreuves').delete().eq('id', id);
return error;
}
async function loadResultsForDashboard() {
const { data, error } = await sb.from('resultats').select('*').order('date_passage', { ascending:false });
if (error) { console.error(error); return []; }
return data.map(r => ({ id:r.id, userId:r.utilisateur_id, pseudo:r.pseudo, examId:r.epreuve_id, examTitle:r.titre_epreuve, score:r.score, max:r.score_max, pct:r.pourcentage, date:r.date_passage }));
}
async function deleteResultFromDB(id) {
const { error } = await sb.from('resultats').delete().eq('id', id);
return error;
}
async function deleteAllResultsFromDB() {
const { error } = await sb.from('resultats').delete().not('id','is',null);
return error;
}
