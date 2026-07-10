// ============================================================
// CaféQ — Owner Dashboard Logic
// ============================================================
import {
  auth,
  onAuthStateChanged, signOut,
  getUserProfile, listenToAllOrders, updateOrderStatus,
  updateKioskStatus, listenToKioskStatus
} from './firebase.js';

// ── State ──
let currentUser = null;
let userProfile  = null;
let allOrders    = [];
let filterStatus = 'active';
let rushLevel    = 'relaxed';
let kioskOpen    = true;

// Persist known order IDs across soft reloads in sessionStorage
// so reconnects don't re-fire notifications for old orders
const SESSION_KEY = 'cafeq_known_orders';
const knownOrderIds = new Set(
  JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]')
);
function persistKnownIds() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify([...knownOrderIds]));
}

const $ = id => document.getElementById(id);

// ── Auth Guard ──
onAuthStateChanged(auth, async user => {
  if (!user) { window.location.replace('index.html'); return; }
  currentUser = user;
  userProfile  = await getUserProfile(user.uid);
  if (userProfile?.role !== 'owner') { window.location.replace('home.html'); return; }
  initDashboard();
});

function initDashboard() {
  setupKioskControls();
  setupOrderListener();
  setupFilters();
  setupLogout();
}

// ── Kiosk Controls ──
function setupKioskControls() {
  // Open/Close toggle
  const toggle = $('kiosk-open-toggle');
  toggle?.addEventListener('change', async () => {
    kioskOpen = toggle.checked;
    await updateKioskStatus({ isOpen: kioskOpen, rushLevel });
    updateKioskDot();
    showToast(kioskOpen ? '✅ Kiosk is now Open' : '🔒 Kiosk marked as Closed');
  });

  // Rush selector
  document.querySelectorAll('.rush-sel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      rushLevel = btn.dataset.level;
      document.querySelectorAll('.rush-sel-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await updateKioskStatus({ rushLevel, isOpen: kioskOpen });
      showToast(`📊 Rush level set to ${rushLevel.replace('_', ' ')}`);
    });
  });

  // Listen to current status
  listenToKioskStatus(status => {
    rushLevel = status.rushLevel || 'relaxed';
    kioskOpen = status.isOpen !== false;
    if (toggle) toggle.checked = kioskOpen;
    updateKioskDot();
    document.querySelectorAll('.rush-sel-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === rushLevel);
    });
  }, err => {
    console.error("Kiosk status listener failed:", err);
    showToast(`⚠️ Kiosk status sync failed: ${err.message}`, 'error');
  });
}

function updateKioskDot() {
  const dot = $('kiosk-status-dot');
  const label = $('kiosk-status-label');
  if (dot) dot.className = `kiosk-dot${kioskOpen ? '' : ' closed'}`;
  if (label) label.textContent = kioskOpen ? 'Open' : 'Closed';
}

// ── Order Listener ──
function setupOrderListener() {
  let firstLoad = true;
  listenToAllOrders(orders => {
    orders.forEach(o => {
      // Only notify for BRAND NEW orders (status === 'placed') not previously seen
      // This prevents re-notification on page reload or status updates
      if (!knownOrderIds.has(o.id) && !firstLoad && o.status === 'placed') {
        playNotification();
        showToast(`🔔 New order from ${o.userName}!`, 'info');
      }
      knownOrderIds.add(o.id);
    });
    persistKnownIds();
    firstLoad = false;

    allOrders = orders;
    renderOrders();
    updateStats();
    renderSlotsTimeline();
  }, err => {
    console.error("Orders listener failed:", err);
    showToast(`⚠️ Orders dashboard sync failed: ${err.message}`, 'error');
  });
}

// ── Filters ──
function setupFilters() {
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      filterStatus = btn.dataset.filter;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderOrders();
    });
  });
}

// ── Render Orders (diff-render to prevent flicker) ──
function renderOrders() {
  const feed = $('orders-feed');
  if (!feed) return;

  let filtered = allOrders;
  if (filterStatus === 'active') {
    filtered = allOrders.filter(o => !['completed','cancelled'].includes(o.status));
  } else if (filterStatus === 'ready') {
    filtered = allOrders.filter(o => o.status === 'ready');
  } else if (filterStatus === 'completed') {
    filtered = allOrders.filter(o => o.status === 'completed');
  }

  // Update active count badge
  const activeCount = allOrders.filter(o => !['completed','cancelled'].includes(o.status)).length;
  const countBadge = $('active-orders-count');
  if (countBadge) countBadge.textContent = `${activeCount} active`;

  if (filtered.length === 0) {
    feed.innerHTML = `<div class="orders-empty">
      <span class="material-symbols-rounded orders-empty-emoji">local_cafe</span>
      <div class="orders-empty-text">No ${filterStatus === 'active' ? 'active' : filterStatus} orders right now.<br>Sit back and enjoy the calm.</div>
    </div>`;
    return;
  }

  // Remove empty-state if present
  const emptyState = feed.querySelector('.orders-empty');
  if (emptyState) emptyState.remove();

  // Build lookup of existing cards
  const existingCards = new Map();
  feed.querySelectorAll('[data-order-id]').forEach(el => {
    existingCards.set(el.dataset.orderId, el);
  });

  const renderedIds = new Set();

  filtered.forEach((order, i) => {
    renderedIds.add(order.id);
    const existing = existingCards.get(order.id);

    if (existing) {
      // Only re-render if status actually changed (avoids flash)
      if (existing.dataset.status !== order.status) {
        const card = buildOwnerOrderCard(order);
        feed.insertBefore(card, existing);
        existing.remove();
      }
      // Else leave it alone — no flicker
    } else {
      // New card — insert at correct position
      const card = buildOwnerOrderCard(order);
      const allCards = [...feed.children];
      if (allCards[i]) {
        feed.insertBefore(card, allCards[i]);
      } else {
        feed.appendChild(card);
      }
    }
  });

  // Remove stale cards no longer in filtered
  existingCards.forEach((el, id) => {
    if (!renderedIds.has(id)) el.remove();
  });
}

function buildOwnerOrderCard(order) {
  const card = document.createElement('div');
  card.className = 'glass-card order-card animate-fade-up';
  card.dataset.status = order.status;
  card.dataset.orderId = order.id;

  const initials = (order.userName || '?').charAt(0).toUpperCase();
  const createdAt = order.createdAt?.toDate?.() || new Date();
  const timeAgo = getTimeAgo(createdAt);

  const statusLabel = {
    placed:    '<span class="material-symbols-rounded" style="font-size:0.875rem">schedule</span> Waiting',
    accepted:  '<span class="material-symbols-rounded" style="font-size:0.875rem">check</span> Accepted',
    preparing: '<span class="material-symbols-rounded" style="font-size:0.875rem">autorenew</span> Preparing',
    ready:     '<span class="material-symbols-rounded" style="font-size:0.875rem">check_circle</span> Ready',
    completed: '<span class="material-symbols-rounded" style="font-size:0.875rem">task_alt</span> Done',
  }[order.status] || order.status;

  const itemChips = order.items.map(item =>
    `<span class="order-item-chip">${item.name} ×${item.qty}</span>`
  ).join('');

  const actionBtns = getActionButtons(order);

  card.innerHTML = `
    <div class="order-card-header">
      <div class="order-customer">
        <div class="order-avatar">${initials}</div>
        <div>
          <div class="order-customer-name">${order.userName || 'Customer'}</div>
          <div class="order-customer-meta">
            <span>#${order.id.slice(-6).toUpperCase()}</span>
            <span>·</span>
            <span>${timeAgo}</span>
          </div>
        </div>
      </div>
      <div class="order-right">
        <span class="order-amount">₹${order.totalAmount || order.total || '0'}</span>
        <span class="badge ${getBadgeClass(order.status)}">${statusLabel === 'pickedup' ? '<span class="material-symbols-rounded" style="font-size:0.875rem">task_alt</span> Done' : statusLabel}</span>
      </div>
    </div>

    <div class="order-items-grid">${itemChips}</div>

    ${order.slot ? `
      <div class="order-slot-info">
        <span class="material-symbols-rounded order-slot-icon" style="font-size:1rem">schedule</span>
        <span>Pickup Slot: <strong>${order.slot.label}</strong></span>
      </div>` : ''}

    <div class="order-actions">${actionBtns}</div>`;

  // Wire action buttons
  card.querySelectorAll('.action-btn[data-next-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nextStatus = btn.dataset.nextStatus;
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-flex"></div>';
      try {
        await updateOrderStatus(order.id, nextStatus);
        showToast(getStatusToast(nextStatus, order.userName));
      } catch (e) {
        showToast('❌ Failed to update order', 'error');
        btn.disabled = false;
      }
    });
  });

  return card;
}

function getActionButtons(order) {
  if (order.status === 'placed') {
    return `<button class="action-btn action-accept" data-next-status="preparing" data-order-id="${order.id}">
      <span class="material-symbols-rounded" style="font-size:1rem">autorenew</span> Start Preparing
    </button>`;
  }
  if (order.status === 'accepted' || order.status === 'preparing') {
    return `<button class="action-btn action-ready" data-next-status="ready" data-order-id="${order.id}">
      <span class="material-symbols-rounded" style="font-size:1rem">check_circle</span> Mark as Ready
    </button>`;
  }
  if (order.status === 'ready') {
    return `<button class="action-btn action-complete" data-next-status="completed" data-order-id="${order.id}">
      <span class="material-symbols-rounded" style="font-size:1rem">task_alt</span> Mark Collected
    </button>`;
  }
  return '';
}

function getBadgeClass(status) {
  return {
    placed: 'badge-yellow', accepted: 'badge-blue', preparing: 'badge-blue',
    ready: 'badge-green', completed: 'badge-gold',
  }[status] || 'badge-gold';
}

function getStatusToast(status, name) {
  return {
    preparing: `${name}'s order is being prepared`,
    ready:     `${name}'s order is Ready for pickup!`,
    completed: `${name}'s order marked as collected`,
  }[status] || `Order updated`;
}

// ── Stats ──
function updateStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOrders = allOrders.filter(o => {
    const created = o.createdAt?.toDate?.() || new Date(0);
    return created >= today;
  });

  const revenue  = todaysOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const active   = allOrders.filter(o => !['completed','cancelled'].includes(o.status)).length;
  const ready    = allOrders.filter(o => o.status === 'ready').length;

  // Item frequency
  const itemCount = {};
  todaysOrders.forEach(o => {
    o.items?.forEach(i => { itemCount[i.name] = (itemCount[i.name] || 0) + i.qty; });
  });
  const topItem = Object.entries(itemCount).sort((a,b) => b[1]-a[1])[0];

  if ($('stat-revenue'))  $('stat-revenue').textContent  = `₹${revenue}`;
  if ($('stat-orders'))   $('stat-orders').textContent   = todaysOrders.length;
  if ($('stat-active'))   $('stat-active').textContent   = active;
  if ($('stat-ready'))    $('stat-ready').textContent    = ready;
  if ($('stat-top-item')) $('stat-top-item').textContent = topItem ? topItem[0] : '—';

  renderPopularItems(itemCount);
}

function renderPopularItems(itemCount) {
  const container = $('popular-items-list');
  if (!container) return;
  const sorted = Object.entries(itemCount).sort((a,b) => b[1]-a[1]).slice(0, 5);
  if (sorted.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.875rem">No data yet today</div>';
    return;
  }
  container.innerHTML = sorted.map(([name, count], i) => `
    <div class="popular-item-row">
      <span class="popular-rank${i === 0 ? ' top' : ''}">${i + 1}</span>
      <span class="popular-item-name">${name}</span>
      <span class="popular-item-count">${count} sold</span>
    </div>`).join('');
}

// ── Slots Timeline ──
function renderSlotsTimeline() {
  const container = $('slots-timeline');
  if (!container) return;

  const now = new Date();
  const upcoming = {};

  allOrders
    .filter(o => !['completed','cancelled'].includes(o.status) && o.slot)
    .forEach(o => {
      const slotEnd = new Date(o.slot.endTime);
      if (slotEnd > now) {
        const key = o.slot.label;
        upcoming[key] = (upcoming[key] || []).concat(o);
      }
    });

  const entries = Object.entries(upcoming).slice(0, 6);
  if (entries.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:16px">No upcoming slots</div>';
    return;
  }

  container.innerHTML = entries.map(([label, orders]) => `
    <div class="slot-timeline-item">
      <span class="slot-time-text">${label.split('–')[0].trim()}</span>
      <div class="slot-order-count">${Array.from({length: Math.min(orders.length, 6)}, () => `<span class="slot-dot"></span>`).join('')}</div>
      <span class="slot-count-label">${orders.length} order${orders.length > 1 ? 's' : ''}</span>
    </div>`).join('');
}

// ── Helpers ──
function getTimeAgo(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function playNotification() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(); osc.stop(ctx.currentTime + 0.4);
  } catch(e) {}
}

// ── Toast ──
function showToast(message, type = 'success') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icons = { success:'✅', warn:'⚠️', error:'❌', info:'🔔' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span>${message}</span>`;
  container?.appendChild(toast);
  setTimeout(() => { toast.classList.add('toast-exit'); setTimeout(() => toast.remove(), 200); }, 3500);
}

// ── Logout ──
function setupLogout() {
  $('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.replace('index.html');
  });
}
