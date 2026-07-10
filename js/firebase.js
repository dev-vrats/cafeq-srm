// ============================================================
// CaféQ — Firebase Init & Firestore Helpers
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  getDocs,
  limit,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD09oJXU30oYf4BiAIuVHqlNAO8XKUJ-kU",
  authDomain: "cafeq-67d51.firebaseapp.com",
  projectId: "cafeq-67d51",
  storageBucket: "cafeq-67d51.firebasestorage.app",
  messagingSenderId: "937852436873",
  appId: "1:937852436873:web:1606731dcc908ac9216158"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ── Re-export Firestore utilities ──
export {
  doc, setDoc, getDoc, updateDoc, addDoc,
  collection, onSnapshot, query, where, orderBy,
  serverTimestamp, increment, getDocs, limit, Timestamp,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
};

// ── User Helpers ──
export async function createUserProfile(uid, name, email, role = 'student') {
  await setDoc(doc(db, 'users', uid), {
    uid, name, email, role,
    loyaltyPunches: 0,
    coffeePassBalance: 0,
    khataBalance: 0,
    createdAt: serverTimestamp()
  });
}

export async function getUserProfile(uid) {
  const docSnap = await getDoc(doc(db, 'users', uid));
  return docSnap.exists() ? docSnap.data() : null;
}

export async function updateUserProfilePhoto(uid, photoUrl) {
  await updateDoc(doc(db, 'users', uid), { photoUrl });
}

// ── Order Helpers ──
export async function placeOrder(orderData) {
  const ref = await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: 'placed',
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export function listenToOrder(orderId, callback) {
  return onSnapshot(doc(db, 'orders', orderId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export function listenToUserOrders(userId, callback) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

export function listenToAllOrders(callback) {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
}

export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: serverTimestamp() });
}

// ── Kiosk Status ──
export function listenToKioskStatus(callback) {
  return onSnapshot(doc(db, 'kiosk_status', 'main'), snap => {
    callback(snap.exists() ? snap.data() : { rushLevel: 'relaxed', isOpen: true });
  });
}

export async function updateKioskStatus(data) {
  await setDoc(doc(db, 'kiosk_status', 'main'), {
    ...data,
    lastUpdated: serverTimestamp()
  }, { merge: true });
}

// ── Loyalty ──
export async function addLoyaltyPunch(userId) {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const punches = (snap.data().loyaltyPunches || 0) + 1;
  if (punches >= 5) {
    await updateDoc(userRef, { loyaltyPunches: 0, khataBalance: increment(1) });
    return { redeemed: true };
  } else {
    await updateDoc(userRef, { loyaltyPunches: punches });
    return { redeemed: false, punches };
  }
}

// ── Group Orders ──
export async function createGroupOrder(data) {
  const ref = await addDoc(collection(db, 'group_orders'), {
    ...data,
    status: 'collecting',
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function getGroupOrder(groupId) {
  const snap = await getDoc(doc(db, 'group_orders', groupId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function listenToGroupOrder(groupId, callback) {
  return onSnapshot(doc(db, 'group_orders', groupId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}
