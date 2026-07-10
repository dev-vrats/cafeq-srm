import {
  auth, db,
  onAuthStateChanged,
  getUserProfile,
  getOwnerId,
  doc, updateDoc
} from './firebase.js';

const btnCustomer = document.getElementById('btn-customer');
const btnOwner    = document.getElementById('btn-owner');
const errorBox    = document.getElementById('role-error');

let currentUser = null;

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.replace('index.html');
    return;
  }
  currentUser = user;
  
  // If role is already owner, just let them in to owner dashboard directly
  const profile = await getUserProfile(user.uid);
  if (profile?.role === 'owner') {
    window.location.replace('owner.html');
  }
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

function setLoading(btn, isLoading) {
  if (isLoading) {
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';
  } else {
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  }
}

btnCustomer.addEventListener('click', async () => {
  if (!currentUser) return;
  setLoading(btnCustomer, true);
  
  // Ensure role is student
  const profile = await getUserProfile(currentUser.uid);
  if (profile?.role !== 'student') {
    await updateDoc(doc(db, 'users', currentUser.uid), { role: 'student' });
  }
  
  window.location.replace('home.html');
});

btnOwner.addEventListener('click', async () => {
  if (!currentUser) return;
  setLoading(btnOwner, true);
  errorBox.style.display = 'none';

  try {
    const ownerId = await getOwnerId();
    
    if (ownerId && ownerId !== currentUser.uid) {
      showError("An owner is already registered. You can't be owner now.");
      setLoading(btnOwner, false);
      return;
    }
    
    // If no owner exists (or it's already them), set role to owner
    if (!ownerId) {
      await updateDoc(doc(db, 'users', currentUser.uid), { role: 'owner' });
    }
    
    window.location.replace('owner.html');
  } catch (err) {
    console.error(err);
    showError("Something went wrong. Please try again.");
    setLoading(btnOwner, false);
  }
});
