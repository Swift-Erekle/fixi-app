// NOTIFICATION BELL (in-app notifications)
// ========================================================
let notifCache = [];

async function loadNotifications() {
  if (!currentUser) return;
  try {
    const data = await api('/notifications');
    notifCache = data.notifications || [];
    renderNotifBell(data.unreadCount || 0);
    renderNotifDropdown();
  } catch (_) { /* silent */ }
}

function renderNotifBell(unreadCount) {
  const dot = document.getElementById('navBellDot');
  if (!dot) return;
  if (unreadCount > 0) {
    // ✅ Show number badge
    dot.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    dot.style.display = 'flex';
  } else {
    // ✅ Clean bell — hide badge entirely
    dot.textContent = '';
    dot.style.display = 'none';
  }
}

function renderNotifDropdown() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (!notifCache.length) {
    list.innerHTML = '<div class="notif-empty">შეტყობინება ჯერ არ არის</div>';
    return;
  }
  list.innerHTML = notifCache.map(n => {
    const ico = notifIcon(n.type);
    const time = notifRelativeTime(n.createdAt);
    return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="onNotifClick('${sanitize(n.id)}', ${n.link ? `'${sanitize(n.link)}'` : 'null'})">
  <div class="notif-ico">${ico}</div>
  <div class="notif-body">
    <div class="notif-title">${sanitize(n.title)}</div>
    ${n.body ? `<div class="notif-desc">${sanitize(n.body)}</div>` : ''}
    <div class="notif-time">${time}</div>
  </div>
</div>`;
  }).join('');
}

function notifIcon(type) {
  switch (type) {
    case 'new_offer': return '💬';
    case 'offer_accepted': return '🎉';
    case 'offer_rejected': return '❌';
    case 'new_message': return '✉️';
    case 'offer_updated': return '✏️';
    default: return '🔔';
  }
}

function notifRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'ახლახან';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + ' წუთის წინ';
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return hrs + ' სთ წინ';
  const days = Math.floor(hrs / 24);
  if (days < 7) return days + ' დღის წინ';
  return new Date(iso).toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' });
}

function toggleNotifDropdown(event) {
  if (event) event.stopPropagation();
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const isOpen = dd.classList.toggle('open');
  if (isOpen) {
    loadNotifications();
    // ✅ Mark all as read as soon as dropdown opens — badge clears
    setTimeout(() => markAllNotifRead(), 800);
    // Dismiss on outside click
    setTimeout(() => {
      document.addEventListener('click', closeNotifOnOutside, { once: true });
    }, 0);
  }
}

function closeNotifOnOutside(e) {
  const dd = document.getElementById('notifDropdown');
  if (dd && !dd.contains(e.target) && !e.target.closest('.nav-bell')) {
    dd.classList.remove('open');
  } else if (dd) {
    // Still open — re-attach listener
    setTimeout(() => {
      document.addEventListener('click', closeNotifOnOutside, { once: true });
    }, 0);
  }
}

async function onNotifClick(id, link) {
  // Mark as read
  api('/notifications/read', { method: 'POST', body: { id } }).catch(() => { });
  const n = notifCache.find(x => x.id === id);
  if (n) n.read = true;
  renderNotifBell(notifCache.filter(x => !x.read).length);
  renderNotifDropdown();

  // Follow link if present
  if (link) {
    document.getElementById('notifDropdown')?.classList.remove('open');
    // Parse link — support ?chat=xxx, ?req=yyy, ?review=handymanId, ?proposal=xxx
    const params = new URLSearchParams(link.startsWith('?') ? link.slice(1) : link);
    const chatId     = params.get('chat');
    const reqId      = params.get('req');
    const reviewId   = params.get('review');
    const proposalId = params.get('proposal');
    if (chatId)     { openChat(chatId); }
    else if (reqId) { openRequestDetail(reqId); }
    else if (proposalId) { openProposalView(proposalId); }
    else if (reviewId) {
      // Open handyman's profile and auto-focus the review form
      showProfile(reviewId);
      setTimeout(() => {
        const r = document.getElementById('revComment') || document.getElementById('reviewComment');
        if (r) { r.focus(); r.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }, 400);
    }
  }
}

async function markAllNotifRead() {
  try {
    await api('/notifications/read', { method: 'POST', body: {} });
    notifCache.forEach(n => n.read = true);
    renderNotifBell(0);
    renderNotifDropdown();
  } catch (_) { }
}

// ========================================================
