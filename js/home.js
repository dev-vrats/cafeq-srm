// ============================================================
// CaféQ — Home Page Logic (Customer App)
// ============================================================
import {
  auth,
  onAuthStateChanged, signOut,
  getUserProfile, listenToKioskStatus, listenToUserOrders,
  placeOrder, addLoyaltyPunch, updateUserProfilePhoto
} from './firebase.js';
import { MENU_CATEGORIES, MENU_ITEMS, COMBOS, TIME_SLOTS, getItemById, getItemsByCategory } from './menu-data.js';
import { getAISuggestions } from './ai-suggest.js';

// ── State ──
let currentUser = null;
let userProfile = null;
let cart = {};
let selectedSlot = null;
let activeTab = 'home';
let activeCategory = 'coffee';
let rushLevel = 'relaxed';
let kioskOpen = true;
let activeOrders = [];
let unsubscribers = [];
let groupOrderId = null;

// ── DOM Refs ──
const $ = id => document.getElementById(id);

// ── Auth Guard ──
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.replace('index.html'); return; }
  currentUser = user;
  userProfile = await getUserProfile(user.uid);
  if (userProfile?.role === 'owner') { window.location.replace('owner.html'); return; }
  initApp();
});

function initApp() {
  renderUserUI();
  setupNav();
  setupKioskListener();
  setupOrdersListener();
  loadHomeTab();
}

// ── User UI ──
function renderUserUI() {
  const name = userProfile?.name || currentUser.email.split('@')[0];
  $('user-greeting').innerHTML = `Hey ${name.split(' ')[0]} <span class="material-symbols-rounded" style="font-size:1.25rem;color:var(--gold)">waving_hand</span>`;
  
  if (userProfile?.photoUrl) {
    $('avatar-img').src = userProfile.photoUrl;
    $('avatar-img').style.display = 'block';
    $('avatar-initials').style.display = 'none';
  } else {
    $('avatar-initials').textContent = name.charAt(0).toUpperCase();
    $('avatar-img').style.display = 'none';
    $('avatar-initials').style.display = 'block';
  }
  
  $('profile-name-text').textContent = name;
  $('profile-email-text').textContent = currentUser.email;
  updateLoyaltyUI();
}

// ── Navigation ──
function setupNav() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  $('avatar-btn').addEventListener('click', () => openProfileSheet());
  $('close-profile').addEventListener('click', closeProfileSheet);
  $('profile-overlay').addEventListener('click', closeProfileSheet);
  $('logout-btn').addEventListener('click', async () => {
    unsubscribers.forEach(u => u());
    await signOut(auth);
    window.location.replace('index.html');
  });
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));

  if (tab === 'menu') renderMenu();
  if (tab === 'orders') renderOrders();
  if (tab === 'loyalty') renderLoyalty();
  if (tab === 'group') renderGroupTab();
}

// ── Kiosk Listener ──
function setupKioskListener() {
  const unsub = listenToKioskStatus(status => {
    rushLevel = status.rushLevel || 'relaxed';
    kioskOpen = status.isOpen !== false;
    updateRushUI();
  });
  unsubscribers.push(unsub);
}

function updateRushUI() {
  const rushCard = $('rush-level-badge');
  const rushFill = $('rush-fill');
  const rushTip  = $('rush-tip');
  if (!rushCard) return;

  const config = {
    relaxed:     { label: '🟢 Relaxed', width: '30%', tip: 'Kiosk is chill right now. Perfect time to grab your order!' },
    busy:        { label: '🟡 Busy', width: '65%', tip: 'Moderate rush at the kiosk. Expect ~5-10 min wait.' },
    super_jammed:{ label: '🔴 Super Jammed', width: '100%', tip: 'Very busy right now! Pre-order and pick up a later slot.' },
  };

  const c = config[rushLevel] || config.relaxed;
  rushCard.className = `rush-level-badge ${rushLevel}`;
  rushCard.innerHTML = `<span class="rush-dot"></span>${c.label}`;
  rushFill.className = `rush-fill ${rushLevel}`;
  rushFill.style.width = c.width;
  if (rushTip) rushTip.textContent = c.tip;
}

// ── Home Tab ──
function loadHomeTab() {
  updateRushUI();
  loadAISuggestions();
  renderFeaturedCombos();
}

async function loadAISuggestions() {
  const container = $('ai-suggestions');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:60px;border-radius:12px;margin-bottom:8px"></div><div class="skeleton" style="height:60px;border-radius:12px"></div>';

  const suggestions = await getAISuggestions(null);
  container.innerHTML = '';
  suggestions.forEach(s => {
    const el = document.createElement('div');
    el.className = 'ai-suggestion-item animate-fade-up';
    el.innerHTML = `
      <span class="material-symbols-rounded ai-sugg-emoji" style="color:var(--gold)">${s.icon || 'auto_awesome'}</span>
      <div class="ai-sugg-body">
        <div class="ai-sugg-combo">${s.combo}</div>
        <div class="ai-sugg-reason">${s.reason}</div>
      </div>
      <div class="ai-sugg-right">
        <span class="badge badge-gold" style="font-size:0.6rem">${s.tag}</span>
        <span style="font-size:0.875rem;font-weight:700;color:var(--gold)">₹${s.price}</span>
      </div>`;
    el.addEventListener('click', () => { switchTab('menu'); });
    container.appendChild(el);
  });
}

function renderFeaturedCombos() {
  const container = $('featured-combos');
  if (!container) return;
  container.innerHTML = '';
  COMBOS.slice(0, 3).forEach((combo, i) => {
    const item1 = getItemById(combo.items[0]);
    const item2 = getItemById(combo.items[1]);
    const el = document.createElement('div');
    el.className = `glass-card animate-fade-up stagger-${i+1}`;
    el.style.cssText = 'padding:16px;cursor:pointer;flex-shrink:0;width:220px';
    el.innerHTML = `
      <div style="font-size:1.75rem;margin-bottom:8px"><span class="material-symbols-rounded" style="color:var(--gold)">${combo.icon}</span></div>
      <div style="font-weight:700;font-size:0.9rem;margin-bottom:4px">${combo.name}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:10px">${combo.description}</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <span style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--gold)">₹${combo.comboPrice}</span>
          <span style="font-size:0.7rem;color:var(--text-muted);text-decoration:line-through;margin-left:4px">₹${combo.originalPrice}</span>
        </div>
        <span class="badge badge-gold" style="font-size:0.55rem">${combo.tag}</span>
      </div>`;
    el.addEventListener('click', () => {
      if (item1) addToCart(item1);
      if (item2) addToCart(item2);
      showToast(`✅ ${combo.name} added to cart!`);
      updateCartFAB();
    });
    container.appendChild(el);
  });
}

// ── Menu Tab ──
function renderMenu() {
  renderCategories();
  renderMenuItems(activeCategory);
}

function renderCategories() {
  const container = $('cat-pills');
  if (!container) return;
  container.innerHTML = '';
  MENU_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `cat-pill${cat.id === activeCategory ? ' active' : ''}`;
    btn.innerHTML = `<span class="material-symbols-rounded" style="font-size:1.1rem">${cat.icon}</span> ${cat.label}`;
    btn.addEventListener('click', () => {
      activeCategory = cat.id;
      container.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenuItems(cat.id);
    });
    container.appendChild(btn);
  });
}


function renderMenuItems(category) {
  const grid = $('menu-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const items = getItemsByCategory(category);
  items.forEach((item, i) => {
    const qtyInCart = cart[item.id]?.qty || 0;
    const card = document.createElement('div');
    card.className = `glass-card menu-item-card animate-fade-up stagger-${(i % 5) + 1}`;
    card.dataset.itemId = item.id;

    // Image: use <img> if path exists, else placeholder with emoji
    const imgHtml = item.image
      ? `<img src="${item.image}" alt="${item.name}" class="menu-item-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
         <div class="menu-item-img-placeholder" style="display:none"><span class="material-symbols-rounded">${item.icon}</span></div>`
      : `<div class="menu-item-img-placeholder"><span class="material-symbols-rounded">${item.icon}</span></div>`;

    card.innerHTML = `
      ${item.isPopular ? `<span class="badge badge-gold popular-badge" style="display:flex;align-items:center;gap:3px"><span class="material-symbols-rounded" style="font-size:0.75rem">local_fire_department</span> Popular</span>` : ''}
      ${imgHtml}
      <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-desc">${item.description}</div>
      <div class="menu-item-footer">
        <span class="menu-item-price">&#8377;${item.price}</span>
        ${qtyInCart > 0
          ? `<div class="qty-controls">
              <button class="qty-btn" data-action="dec" data-id="${item.id}"><span class="material-symbols-rounded" style="font-size:1rem">remove</span></button>
              <span class="qty-num">${qtyInCart}</span>
              <button class="qty-btn" data-action="inc" data-id="${item.id}"><span class="material-symbols-rounded" style="font-size:1rem">add</span></button>
            </div>`
          : `<button class="add-btn" data-id="${item.id}"><span class="material-symbols-rounded" style="font-size:1.125rem;pointer-events:none">add</span></button>`
        }
      </div>`;
    grid.appendChild(card);
  });

  // Bind events — use closest to handle icon child clicks
  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = btn.dataset.id;
      const item = getItemById(id);
      if (item) { addToCart(item); renderMenuItems(category); updateCartFAB(); }
    });
  });
  grid.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const { action, id } = btn.dataset;
      const item = getItemById(id);
      if (!item) return;
      if (action === 'inc') addToCart(item);
      else removeFromCart(item.id);
      renderMenuItems(category);
      updateCartFAB();
    });
  });
}

// ── Cart ──
function addToCart(item) {
  if (cart[item.id]) {
    cart[item.id].qty++;
  } else {
    cart[item.id] = { ...item, qty: 1 };
  }
}

function removeFromCart(itemId) {
  if (!cart[itemId]) return;
  cart[itemId].qty--;
  if (cart[itemId].qty <= 0) delete cart[itemId];
}

function getCartTotal() {
  return Object.values(cart).reduce((s, i) => s + i.price * i.qty, 0);
}

function getCartCount() {
  return Object.values(cart).reduce((s, i) => s + i.qty, 0);
}

function updateCartFAB() {
  const fab  = $('cart-fab');
  const badge = $('cart-nav-badge');
  const count = getCartCount();

  if (count > 0) {
    fab.classList.remove('hidden');
    $('cart-fab-count').textContent = `${count} item${count > 1 ? 's' : ''}`;
    $('cart-fab-total').textContent = `₹${getCartTotal()}`;
    if (badge) { badge.classList.remove('hidden'); badge.textContent = count; }
  } else {
    fab.classList.add('hidden');
    if (badge) badge.classList.add('hidden');
  }
}

// ── Cart Drawer ──
function openCart() {
  $('cart-overlay').classList.add('open');
  $('cart-drawer').classList.add('open');
  renderCartDrawer();
}

function closeCart() {
  $('cart-overlay').classList.remove('open');
  $('cart-drawer').classList.remove('open');
}

function renderCartDrawer() {
  const body = $('cart-body');
  const items = Object.values(cart);

  if (items.length === 0) {
    body.innerHTML = `<div class="cart-empty-state">
      <span class="material-symbols-rounded cart-empty-emoji" style="font-size:3rem;display:block;text-align:center;margin-bottom:12px;color:var(--text-muted)">shopping_cart</span>
      <div style="font-weight:700;color:var(--text-secondary);text-align:center">Your cart is empty</div>
      <div style="font-size:0.875rem;color:var(--text-muted);margin-top:4px;text-align:center">Add items from the menu</div>
    </div>`;
    return;
  }

  body.innerHTML = items.map(item => `
    <div class="cart-item-row">
      ${item.image
        ? `<img src="${item.image}" alt="${item.name}" class="cart-item-thumb" />`
        : `<span class="cart-item-emoji material-symbols-rounded">${item.icon}</span>`
      }
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">
          <span class="per-unit">&#8377;${item.price}</span> &times; ${item.qty}
        </div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn cart-dec" data-id="${item.id}"><span class="material-symbols-rounded" style="font-size:1rem">remove</span></button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn cart-inc" data-id="${item.id}"><span class="material-symbols-rounded" style="font-size:1rem">add</span></button>
      </div>
      <span style="font-family:'Playfair Display',serif;font-weight:700;color:var(--gold);min-width:48px;text-align:right">&#8377;${item.price * item.qty}</span>
    </div>`).join('');

  body.querySelectorAll('.cart-inc').forEach(btn => {
    btn.addEventListener('click', () => { addToCart(getItemById(btn.dataset.id)); renderCartDrawer(); updateCartFAB(); });
  });
  body.querySelectorAll('.cart-dec').forEach(btn => {
    btn.addEventListener('click', () => { removeFromCart(btn.dataset.id); renderCartDrawer(); updateCartFAB(); if (getCartCount() === 0) closeCart(); });
  });

  $('cart-total-amount').textContent = `₹${getCartTotal()}`;
  renderSlotPicker();
}

function renderSlotPicker() {
  const grid = $('slot-grid');
  if (!grid) return;
  grid.innerHTML = TIME_SLOTS.map(slot => `
    <button class="slot-btn${selectedSlot?.id === slot.id ? ' selected' : ''}" data-slot-id="${slot.id}">
      ${slot.label}
    </button>`).join('');

  grid.querySelectorAll('.slot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSlot = TIME_SLOTS.find(s => s.id === btn.dataset.slotId);
      grid.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

async function placeOrderNow() {
  if (getCartCount() === 0) { showToast('⚠️ Add items to your cart first!', 'warn'); return; }
  if (!selectedSlot) { showToast('⏰ Please select a pickup slot!', 'warn'); return; }
  if (!kioskOpen) { showToast('😴 Kiosk is currently closed', 'warn'); return; }

  const placeBtn = $('place-order-btn');
  placeBtn.disabled = true;
  placeBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Placing...';

  try {
    const items = Object.values(cart).map(i => ({
      id: i.id, name: i.name, icon: i.icon, qty: i.qty, price: i.price
    }));

    const orderId = await placeOrder({
      userId:     currentUser.uid,
      userName:   userProfile?.name || currentUser.email.split('@')[0],
      userEmail:  currentUser.email,
      items,
      slot:       selectedSlot,
      totalAmount:getCartTotal(),
      groupOrderId: null,
    });

    // Add loyalty punch for each coffee
    const coffeeCount = items.filter(i => ['coffee','cold'].includes(
      MENU_ITEMS.find(m => m.id === i.id)?.category
    )).reduce((s, i) => s + i.qty, 0);
    if (coffeeCount > 0) {
      for (let c = 0; c < coffeeCount; c++) await addLoyaltyPunch(currentUser.uid);
      // Re-fetch profile to update loyalty UI
      userProfile = await getUserProfile(currentUser.uid);
    }

    // Reset cart
    cart = {};
    selectedSlot = null;
    updateCartFAB();
    closeCart();

    showToast('🎉 Order placed! Track it in My Orders');
    switchTab('orders');
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to place order. Try again.', 'error');
  } finally {
    placeBtn.disabled = false;
    placeBtn.innerHTML = 'Place Order • Pay at Kiosk';
  }
}

// ── Orders Tab ──
function setupOrdersListener() {
  const unsub = listenToUserOrders(currentUser.uid, orders => {
    // Sort locally because we removed orderBy to avoid missing index error
    orders.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    activeOrders = orders;
    if (activeTab === 'orders') renderOrders();
    updateOrdersBadge();
  });
  unsubscribers.push(unsub);
}

function updateOrdersBadge() {
  const active = activeOrders.filter(o => !['completed','cancelled'].includes(o.status));
  const badge = $('orders-nav-badge');
  if (badge) {
    if (active.length > 0) { badge.classList.remove('hidden'); badge.textContent = active.length; }
    else badge.classList.add('hidden');
  }
}

function renderOrders() {
  const container = $('orders-list');
  if (!container) return;

  const activeOnes = activeOrders.filter(o => o.status !== 'completed');
  const pastOnes   = activeOrders.filter(o => o.status === 'completed').slice(0, 5);

  if (activeOrders.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <span class="material-symbols-rounded empty-state-emoji">inventory_2</span>
      <div class="empty-state-title">No orders yet</div>
      <div class="empty-state-sub">Head to the menu and place your first order!</div>
    </div>`;
    return;
  }

  container.innerHTML = '';

  activeOnes.forEach(order => {
    container.appendChild(buildOrderCard(order, false));
  });

  if (pastOnes.length > 0) {
    const sep = document.createElement('div');
    sep.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:16px 0 8px">Past Orders</div>';
    container.appendChild(sep);
    pastOnes.forEach(order => container.appendChild(buildOrderCard(order, true)));
  }
}

function buildOrderCard(order, isPast) {
  const card = document.createElement('div');
  card.className = 'glass-card animate-fade-up';
  card.style.padding = 'var(--space-lg)';

  const steps = [
    { key: 'placed',    label: 'Placed',    icon: 'schedule' },
    { key: 'preparing', label: 'Preparing', icon: 'autorenew' },
    { key: 'ready',     label: 'Ready!',    icon: 'check_circle' },
  ];

  const statusIdx = { placed: 0, accepted: 0, preparing: 1, ready: 2, completed: 2 };
  const currentIdx = statusIdx[order.status] ?? 0;

  const pipeline = steps.map((step, i) => {
    const isActive    = i === currentIdx && order.status !== 'completed';
    const isCompleted = i < currentIdx || order.status === 'completed';
    const cls = isActive ? 'active' : isCompleted ? 'completed' : '';
    return `<div class="pipeline-step ${cls}">
      <div class="pipeline-icon"><span class="material-symbols-rounded" style="font-size:1.25rem">${isCompleted ? 'check' : step.icon}</span></div>
      <div class="pipeline-label">${step.label}</div>
    </div>`;
  }).join('');

  const itemsHtml = order.items.map(i => `
    <div class="order-item-line">
      <span><span class="material-symbols-rounded" style="font-size:1rem;vertical-align:middle;margin-right:4px">${i.icon || 'local_cafe'}</span> ${i.name} × ${i.qty}</span>
      <span>₹${i.price * i.qty}</span>
    </div>`).join('');

  const statusLabel = {
    placed: '⏳ Order Placed',
    accepted: '🔵 Accepted',
    preparing: '🔄 Being Prepared',
    ready: '✅ Ready for Pickup!',
    completed: '✓ Completed',
  }[order.status] || order.status;

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
      <div>
        <div style="font-weight:700;font-size:0.9375rem">Order #${order.id.slice(-6).toUpperCase()}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">
          ${order.slot ? `⏰ Pickup: ${order.slot.label}` : ''}
        </div>
      </div>
      <span class="badge ${order.status === 'ready' ? 'badge-green' : order.status === 'preparing' ? 'badge-blue' : order.status === 'completed' ? 'badge-green' : 'badge-yellow'}">${statusLabel}</span>
    </div>
    ${!isPast ? `<div class="order-pipeline" style="margin-bottom:20px">${pipeline}</div>` : ''}
    <div class="order-items-summary">${itemsHtml}
      <div class="order-item-line" style="border-top:1px solid var(--glass-border);margin-top:8px;padding-top:8px;font-weight:700">
        <span>Total</span><span style="color:var(--gold)">₹${order.totalAmount}</span>
      </div>
    </div>
    ${order.status === 'ready' ? `
      <div style="margin-top:16px;padding:12px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.3);border-radius:12px;text-align:center">
        <div style="font-weight:700;color:var(--status-green);margin-bottom:2px">🎉 Your order is Ready!</div>
        <div style="font-size:0.8125rem;color:var(--text-secondary)">Please pick it up at the Nescafé kiosk & pay there</div>
      </div>` : ''}`;

  return card;
}

// ── Loyalty Tab ──
function renderLoyalty() {
  const punches = userProfile?.loyaltyPunches || 0;
  const punchGrid = $('punch-grid');
  const punchText = $('punch-progress-text');
  if (!punchGrid) return;

  punchGrid.innerHTML = Array.from({ length: 5 }, (_, i) => `
    <div class="punch ${i < punches ? 'filled' : ''}">${i < punches ? '☕' : ''}</div>
  `).join('');

  if (punchText) {
    punchText.innerHTML = punches >= 5
      ? `<span class="punch-progress-highlight">🎉 Claim your free Maggi!</span>`
      : `<span class="punch-progress-highlight">${punches}/5 coffees</span> — ${5 - punches} more for a free Maggi!`;
  }

  // Coffee pass
  const passUsed = 30 - (userProfile?.coffeePassBalance || 0);
  const passEl = $('pass-fill');
  if (passEl) passEl.style.width = `${Math.min(100, (passUsed / 30) * 100)}%`;

  // Khata
  const khataEl = $('khata-balance');
  if (khataEl) khataEl.textContent = `₹${(userProfile?.khataBalance || 0) * 0}`;
}

// ── Group Order Tab ──
function renderGroupTab() {
  const panel = $('tab-group');
  if (!panel) return;
}

// ── Profile Sheet ──
function openProfileSheet() {
  $('profile-sheet').classList.add('open');
  renderProfileStats();
}
function closeProfileSheet() {
  $('profile-sheet').classList.remove('open');
}
function renderProfileStats() {
  const ordersCount = activeOrders.filter(o => o.status === 'completed').length;
  const el = $('profile-orders-count');
  if (el) el.textContent = ordersCount;
  const punches = $('profile-punches');
  if (punches) punches.textContent = userProfile?.loyaltyPunches || 0;
}

function updateLoyaltyUI() {
  if (activeTab === 'loyalty') renderLoyalty();
}

// ── Toast ──
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icons = { success: '✅', warn: '⚠️', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 200); }, 3000);
}

// ── ImgBB Upload ──
async function handleProfileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const btn = $('avatar-btn');
  btn.style.opacity = '0.5'; // Loading state

  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // Upload to ImgBB
    const res = await fetch('https://api.imgbb.com/1/upload?key=f7a3c9fd52dcbbb94a18325f4f29f76d', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    if (data.success) {
      const url = data.data.url;
      // Save to Firebase
      await updateUserProfilePhoto(currentUser.uid, url);
      userProfile.photoUrl = url;
      renderUserUI();
      showToast('Profile photo updated!');
    } else {
      throw new Error(data.error?.message || 'Upload failed');
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to upload photo', 'error');
  } finally {
    btn.style.opacity = '1';
  }
}

// ── Wire up DOM events ──
document.addEventListener('DOMContentLoaded', () => {
  // Cart FAB
  $('cart-fab')?.addEventListener('click', openCart);
  $('cart-close')?.addEventListener('click', closeCart);
  $('cart-overlay')?.addEventListener('click', closeCart);
  $('place-order-btn')?.addEventListener('click', placeOrderNow);
  
  // Profile Photo Upload
  $('avatar-btn')?.addEventListener('click', () => {
    $('profile-photo-input')?.click();
  });
  $('profile-photo-input')?.addEventListener('change', handleProfileUpload);
});
