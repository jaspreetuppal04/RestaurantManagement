const API_BASE = 'http://localhost:3000';
const $ = (id) => document.getElementById(id);
let allOrders = [];

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}
function showNotice(message, kind = 'error') {
  const notice = $('notice');
  notice.textContent = message;
  notice.className = `notice ${kind}`;
}
function clearNotice() { $('notice').className = 'notice hidden'; }
function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }) : '—';
}
function pick(obj, keys, fallback = 0) {
  for (const key of keys) if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  return fallback;
}
function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
function normStatus(value) { return String(value || 'Placed').trim(); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function getOrderItems(order) {
  const items = order.items || order.orderItems || [];
  if (Array.isArray(items) && items.length) return items.map(it => `${it.food_name || it.name || 'Item'} × ${it.quantity || 1}`).join(', ');
  return order.item_summary || order.items_summary || '—';
}
function badge(status) {
  const cls = status.toLowerCase().replace(/[^a-z]/g, '');
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}
function renderOrders() {
  const q = $('orderSearch').value.trim().toLowerCase();
  const sf = $('statusFilter').value.toLowerCase();
  const filtered = allOrders.filter(o => {
    const id = String(pick(o, ['id', 'order_id'], ''));
    const customer = String(pick(o, ['customer_name', 'first_name', 'name', 'email'], ''));
    return (!q || `${id} ${customer} ${getOrderItems(o)}`.toLowerCase().includes(q)) &&
      (!sf || normStatus(o.status).toLowerCase() === sf);
  });
  $('ordersBody').innerHTML = filtered.length ? filtered.map(o => {
    const id = pick(o, ['id', 'order_id'], '—');
    const name = pick(o, ['customer_name', 'first_name', 'name'], 'Customer');
    const email = pick(o, ['customer_email', 'email'], '');
    const amount = pick(o, ['total_amount', 'totalAmount', 'total', 'amount'], null);
    return `<tr><td><span class="order-id">#${escapeHtml(id)}</span></td><td><span class="customer-name">${escapeHtml(name)}</span>${email ? `<span class="subcell">${escapeHtml(email)}</span>` : ''}</td><td>${escapeHtml(getOrderItems(o))}</td><td><strong>${amount === null ? '—' : money(amount)}</strong></td><td>${badge(normStatus(o.status))}</td><td>${escapeHtml(fmtDate(pick(o, ['created_at', 'createdAt', 'order_date'], null)))}</td></tr>`;
  }).join('') : `<tr><td colspan="6" class="empty">${allOrders.length ? 'No orders match these filters.' : 'No orders found.'}</td></tr>`;
}
function renderCustomers(customers) {
  $('customersBody').innerHTML = Array.isArray(customers) && customers.length ? customers.map(c => `<tr><td><span class="customer-name">${escapeHtml(c.first_name || c.name || 'Customer')}</span></td><td>${escapeHtml(c.email || '—')}</td><td>${escapeHtml(c.mobile || '—')}</td><td>${badge(c.role || 'customer')}</td></tr>`).join('') : `<tr><td colspan="4" class="empty">${Array.isArray(customers) ? 'No customers found.' : 'Could not load customer list.'}</td></tr>`;
}
function setStats(data) {
  const stats = data.stats || data;
  $('totalOrders').textContent = Number(pick(stats, ['totalOrders', 'total_orders', 'ordersCount'], 0)).toLocaleString('en-IN');
  $('totalRevenue').textContent = money(pick(stats, ['totalRevenue', 'total_revenue', 'revenue'], 0));
  $('totalCustomers').textContent = Number(pick(stats, ['totalCustomers', 'total_customers', 'customersCount'], 0)).toLocaleString('en-IN');
  $('pendingOrders').textContent = Number(pick(stats, ['pendingOrders', 'pending_orders', 'pendingCount'], 0)).toLocaleString('en-IN');
}
async function loadDashboard() {
  clearNotice();
  $('refreshBtn').disabled = true;
  $('refreshBtn').textContent = 'Refreshing…';
  try {
    const me = await api('/api/me');
    if (!me.user || me.user.role !== 'admin') {
      $('loginPanel').classList.remove('hidden');
      showNotice('This account is not an administrator. Sign in with an account whose database role is "admin".');
      return;
    }
    $('loginPanel').classList.add('hidden');
    const [stats, orderData] = await Promise.all([api('/api/admin/dashboard'), api('/api/admin/orders')]);
    setStats(stats);
    allOrders = Array.isArray(orderData) ? orderData : (Array.isArray(orderData.orders) ? orderData.orders : []);
    renderOrders();
    try {
      const customersData = await api('/api/admin/customers');
      renderCustomers(Array.isArray(customersData) ? customersData : customersData.customers);
    } catch (e) {
      renderCustomers(null);
      console.warn('Customer endpoint unavailable:', e.message);
    }
    $('lastUpdated').textContent = `Updated ${new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}`;
  } catch (e) {
    $('loginPanel').classList.remove('hidden');
    $('ordersBody').innerHTML = '<tr><td colspan="6" class="empty">Sign in to load orders.</td></tr>';
    if (e.status === 401) showNotice('Please sign in below. Use an existing account with role "admin".');
    else if (e.status === 403) showNotice('Access denied. Your account is not an admin. Promote the intended account in phpMyAdmin, then sign in again.');
    else showNotice(`${e.message}. Check that the backend is running at ${API_BASE}.`);
  } finally {
    $('refreshBtn').disabled = false;
    $('refreshBtn').textContent = '↻ Refresh';
  }
}
$('adminLoginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearNotice();
  const button = $('adminLoginForm').querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Signing in…';
  try {
    const result = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('loginEmail').value.trim(), password: $('loginPassword').value })
    });
    if (!result.user || result.user.role !== 'admin') {
      await api('/api/logout', { method: 'POST' }).catch(() => {});
      showNotice('This account is valid, but its role is not admin. No admin dashboard access was granted.');
      return;
    }
    $('loginPassword').value = '';
    showNotice('Admin sign-in successful.', 'success');
    await loadDashboard();
  } catch (e) {
    showNotice(e.message || 'Could not sign in.');
  } finally {
    button.disabled = false;
    button.textContent = 'Sign in';
  }
});
$('refreshBtn').addEventListener('click', loadDashboard);
$('orderSearch').addEventListener('input', renderOrders);
$('statusFilter').addEventListener('change', renderOrders);
$('logoutBtn').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST' }); } catch (e) { console.warn(e.message); }
  $('loginPanel').classList.remove('hidden');
  showNotice('You have been logged out.', 'success');
  await loadDashboard();
});
loadDashboard();
