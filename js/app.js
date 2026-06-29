// ══════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════
let currentUser = null;
let exams = [];

// ══════════════════════════════════════════════════════
// AUTH GUARD (appelé par les pages protégées)
// ══════════════════════════════════════════════════════
async function requireAuth(opts={}) {
const { data:{ session } } = await sb.auth.getSession();
if (!session) { location.href='index.html'; return null; }
const { data:profile, error } = await sb.from('profils').select('*').eq('id', session.user.id).single();
if (error || !profile) { location.href='index.html'; return null; }
currentUser = { id:session.user.id, email:session.user.email, pseudo:profile.pseudo, role:profile.role };
if (opts.adminOnly && currentUser.role!=='admin') { location.href='epreuves.html'; return null; }
document.getElementById('header-username').textContent = currentUser.pseudo;
document.getElementById('header-role').textContent = currentUser.role==='admin'?'Administrateur':'Étudiant';
return currentUser;
}
