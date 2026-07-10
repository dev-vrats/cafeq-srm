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
const loginTab    = document.getElementById('login-tab');
const signupTab   = document.getElementById('signup-tab');
const nameField   = document.getElementById('name-field');
const nameInput   = document.getElementById('name-input');
const emailInput  = document.getElementById('email-input');
const passInput   = document.getElementById('pass-input');
const eyeBtn      = document.getElementById('eye-btn');
const submitBtn   = document.getElementById('auth-submit');
const cardTitle   = document.getElementById('card-title');
const cardSub     = document.getElementById('card-sub');
const errorBox    = document.getElementById('auth-error');
const errorMsg    = document.getElementById('error-msg');

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
loginTab.addEventListener('click', () => switchMode(true));
signupTab.addEventListener('click', () => switchMode(false));

function switchMode(toLogin) {
  isLogin = toLogin;
  loginTab.classList.toggle('active', toLogin);
  signupTab.classList.toggle('active', !toLogin);

  if (toLogin) {
    nameField.classList.remove('visible-field');
    nameField.classList.add('hidden-field');
    cardTitle.textContent = 'Welcome back';
    cardSub.textContent = 'Sign in to your CaféQ account';
    submitBtn.querySelector('.btn-text').textContent = 'Sign In';
  } else {
    nameField.classList.remove('hidden-field');
    nameField.classList.add('visible-field');
    cardTitle.textContent = 'Join CaféQ';
    cardSub.textContent = 'Create your account & start ordering';
    submitBtn.querySelector('.btn-text').textContent = 'Create Account';
  }
  hideError();
}

// ── Password visibility toggle ──
eyeBtn.addEventListener('click', () => {
  const isPass = passInput.type === 'password';
  passInput.type = isPass ? 'text' : 'password';
  const icon = document.getElementById('eye-icon');
  if (icon) icon.textContent = isPass ? 'visibility_off' : 'visibility';
});


// ── Form submit ──
submitBtn.addEventListener('click', handleAuth);

[nameInput, emailInput, passInput].forEach(el => {
  el?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
});

async function handleAuth() {
  const email = emailInput.value.trim();
  const pass  = passInput.value;
  const name  = nameInput.value.trim();

  hideError();

  if (!email || !pass) { showError('Please fill in all fields.'); return; }
  if (!isLogin && !name) { showError('Please enter your name.'); return; }
  if (pass.length < 6)  { showError('Password must be at least 6 characters.'); return; }

  setLoading(true);

  isAuthHandling = true;
  try {
    if (isLogin) {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await getUserProfile(cred.user.uid);
      if (profile?.role === 'owner') {
        window.location.replace('owner.html');
      } else {
        window.location.replace('home.html');
      }
    } else {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await createUserProfile(cred.user.uid, name, email, 'student');
      window.location.replace('home.html');
    }
  } catch (err) {
    setLoading(false);
    isAuthHandling = false;
    showError(friendlyError(err.code));
  }
}

function setLoading(on) {
  submitBtn.classList.toggle('loading', on);
  submitBtn.disabled = on;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.remove('hidden');
}
function hideError() {
  errorBox.classList.add('hidden');
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Try again.',
    'auth/invalid-credential':      'Invalid email or password.',
    'auth/email-already-in-use':    'This email is already registered.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/too-many-requests':       'Too many attempts. Please wait a moment.',
    'auth/network-request-failed':  'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
