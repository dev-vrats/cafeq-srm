// ============================================================
// CaféQ — Auth Logic (Login / Sign Up)
// ============================================================
import {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  createUserProfile,
  getUserProfile
} from './firebase.js';

// ── DOM refs ──
const loginTab     = document.getElementById('login-tab');
const signupTab    = document.getElementById('signup-tab');
const loginPanel   = document.getElementById('login-panel');
const signupPanel  = document.getElementById('signup-panel');

// Login panel
const emailInput   = document.getElementById('email-input');
const passInput    = document.getElementById('pass-input');
const eyeBtn       = document.getElementById('eye-btn');
const submitBtn    = document.getElementById('auth-submit');

// Signup panel
const nameInput    = document.getElementById('name-input');
const signupEmail  = document.getElementById('signup-email');
const signupPass   = document.getElementById('signup-pass');
const eyeBtn2      = document.getElementById('eye-btn-2');
const signupSubmit = document.getElementById('signup-submit');

const errorBox     = document.getElementById('auth-error');
const errorMsg     = document.getElementById('error-msg');

let isLogin = true;
let isAuthHandling = false;

// ── Auto-redirect if already logged in ──
onAuthStateChanged(auth, async user => {
  if (user && !isAuthHandling) {
    const profile = await getUserProfile(user.uid);
    if (profile?.role === 'owner') {
      window.location.replace('owner.html');
    } else {
      window.location.replace('home.html');
    }
  }
});

// ── Tab switching ──
loginTab?.addEventListener('click', () => switchMode(true));
signupTab?.addEventListener('click', () => switchMode(false));

function switchMode(toLogin) {
  isLogin = toLogin;
  loginTab?.classList.toggle('active', toLogin);
  signupTab?.classList.toggle('active', !toLogin);
  loginPanel?.classList.toggle('active', toLogin);
  signupPanel?.classList.toggle('active', !toLogin);
  hideError();
}

// ── Password visibility toggles ──
eyeBtn?.addEventListener('click', () => {
  const isPass = passInput.type === 'password';
  passInput.type = isPass ? 'text' : 'password';
  const icon = document.getElementById('eye-icon');
  if (icon) icon.textContent = isPass ? 'visibility_off' : 'visibility';
});

eyeBtn2?.addEventListener('click', () => {
  const isPass = signupPass.type === 'password';
  signupPass.type = isPass ? 'text' : 'password';
  const icon = document.getElementById('eye-icon-2');
  if (icon) icon.textContent = isPass ? 'visibility_off' : 'visibility';
});

// ── Form submit ──
submitBtn?.addEventListener('click', handleLogin);
signupSubmit?.addEventListener('click', handleSignup);

[emailInput, passInput].forEach(el => {
  el?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
});
[nameInput, signupEmail, signupPass].forEach(el => {
  el?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });
});

async function handleLogin() {
  const email = emailInput?.value.trim();
  const pass  = passInput?.value;

  hideError();
  if (!email || !pass) { showError('Please fill in all fields.'); return; }
  if (pass.length < 6)  { showError('Password must be at least 6 characters.'); return; }

  setLoading(submitBtn, true);
  isAuthHandling = true;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await getUserProfile(cred.user.uid);
    if (profile?.role === 'owner') {
      window.location.replace('owner.html');
    } else {
      window.location.replace('home.html');
    }
  } catch (err) {
    setLoading(submitBtn, false);
    isAuthHandling = false;
    showError(friendlyError(err.code));
  }
}

async function handleSignup() {
  const name  = nameInput?.value.trim();
  const email = signupEmail?.value.trim();
  const pass  = signupPass?.value;

  hideError();
  if (!name)         { showError('Please enter your name.'); return; }
  if (!email || !pass){ showError('Please fill in all fields.'); return; }
  if (pass.length < 6){ showError('Password must be at least 6 characters.'); return; }

  setLoading(signupSubmit, true);
  isAuthHandling = true;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await createUserProfile(cred.user.uid, name, email, 'student');
    window.location.replace('home.html');
  } catch (err) {
    setLoading(signupSubmit, false);
    isAuthHandling = false;
    showError(friendlyError(err.code));
  }
}

function setLoading(btn, on) {
  if (!btn) return;
  btn.disabled = on;
  const text   = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  if (text)   text.style.display   = on ? 'none' : '';
  if (loader) loader.style.display = on ? 'flex' : 'none';
}

function showError(msg) {
  if (errorMsg) errorMsg.textContent = msg;
  if (errorBox) errorBox.classList.add('visible');
}
function hideError() {
  if (errorBox) errorBox.classList.remove('visible');
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Try again.',
    'auth/invalid-credential':     'Invalid email or password.',
    'auth/email-already-in-use':   'This email is already registered.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many attempts. Please wait a moment.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
