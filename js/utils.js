// ══════════════════════════════════════════════════════
// ID GENERATOR
// ══════════════════════════════════════════════════════
function uid() { return Math.random().toString(36).slice(2,10)+Date.now().toString(36); }

// ══════════════════════════════════════════════════════
// MISC HELPERS
// ══════════════════════════════════════════════════════
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function kindBadge(k) { return {DP:'indigo',KFP:'purple',QI:'teal'}[k]||'gray'; }
function typeBadge(t) { return {QCM:'blue',QRU:'green',QRP:'purple',QROC:'amber'}[t]||'gray'; }

// ══════════════════════════════════════════════════════
// LEVENSHTEIN
// ══════════════════════════════════════════════════════
function levenshtein(a, b) {
const m = a.length, n = b.length;
const dp = Array.from({length: m+1}, (_,i) => Array.from({length: n+1}, (_,j) => i===0?j:j===0?i:0));
for (let i=1;i<=m;i++) for(let j=1;j<=n;j++)
dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
return dp[m][n];
}

// ══════════════════════════════════════════════════════
// SCORING
// ══════════════════════════════════════════════════════
function scoreQCM(correct, chosen) {
if (!chosen || chosen.length===0) return 0;
const errors = correct.filter(i=>!chosen.includes(i)).length + chosen.filter(i=>!correct.includes(i)).length;
if (errors===0) return 1; if (errors===1) return 0.5; if (errors===2) return 0.2; return 0;
}
function scoreQRU(correct, chosen) {
if (!chosen || chosen.length===0) return 0;
return chosen[0]===correct[0] ? 1 : 0;
}
function scoreQRP(expectedTrue, chosen) {
if (!chosen || chosen.length===0) return 0;
const good = chosen.filter(i=>expectedTrue.includes(i)).length;
return expectedTrue.length>0 ? good/expectedTrue.length : 0;
}
function scoreQROC(correctAnswers, given) {
if (!given || given.trim()==="") return 0;
const g = given.trim().toLowerCase();
return correctAnswers.some(a => levenshtein(g, a.trim().toLowerCase()) <= 2) ? 1 : 0;
}
function computeScore(q, answer) {
switch(q.type) {
case "QCM": return scoreQCM(q.correctIndices, answer||[]);
case "QRU": return scoreQRU(q.correctIndices, answer||[]);
case "QRP": return scoreQRP(q.correctIndices, answer||[]);
case "QROC": return scoreQROC(q.correctTexts||[], answer||"");
default: return 0;
}
}
