// ══════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════
let authMode = 'signin'; // 'signin' | 'signup'

function toggleAuthMode() {
authMode = authMode==='signin' ? 'signup' : 'signin';
document.getElementById('auth-pseudo-group').classList.toggle('hidden', authMode==='signin');
document.getElementById('auth-form-title').textContent = authMode==='signin' ? 'Connexion' : 'Créer un compte';
document.getElementById('auth-submit-btn').textContent = authMode==='signin' ? 'Se connecter →' : 'Créer mon compte →';
document.getElementById('auth-toggle-label').textContent = authMode==='signin' ? 'Pas encore de compte ?' : 'Déjà inscrit ?';
document.getElementById('auth-toggle-btn').textContent = authMode==='signin' ? 'Créer un compte' : 'Se connecter';
document.getElementById('auth-err').classList.add('hidden');
}

async function submitAuth() {
const email = document.getElementById('auth-email').value.trim();
const password = document.getElementById('auth-pwd').value;
const pseudo = document.getElementById('auth-pseudo').value.trim();
if (!email||!password) { showErr('auth-err','Email et mot de passe requis.'); return; }
if (authMode==='signup') {
if (!pseudo) { showErr('auth-err','Pseudo requis.'); return; }
const { data, error } = await sb.auth.signUp({ email, password, options:{ data:{ pseudo } } });
if (error) { showErr('auth-err', error.message); return; }
if (!data.session) { showErr('auth-err','Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.'); return; }
} else {
const { error } = await sb.auth.signInWithPassword({ email, password });
if (error) { showErr('auth-err','Email ou mot de passe incorrect.'); return; }
}
location.href = 'epreuves.html';
}
function showErr(id,msg) { const el=document.getElementById(id); el.textContent=msg; el.classList.remove('hidden'); }
async function logout() { await sb.auth.signOut(); location.href = 'index.html'; }
