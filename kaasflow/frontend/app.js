/* ============================================================
   KaasFlow — app.js
   Vanilla JS SPA · Mobile-first · localStorage business data
   Flask backend for auth only · ES6+ · Bootstrap 5 modals
   ============================================================ */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const LS = {
  session:  'kf_session',
  settings: 'kf_settings',
  clients:  'kf_clients',
  loans:    'kf_loans',
  payments: 'kf_payments',
  recycleBin: 'kf_recycle_bin',
};
const FREE_CLIENT_LIMIT = 20;

// ── SLOT PURCHASE STATE ──────────────────────────────────────
let extraSlots = 5;
let pendingExtraSlots = 0;
let pendingPaymentAmount = 0;

// ── TRANSLATIONS ─────────────────────────────────────────────
const T = {
  en: {
    dashboard: 'Dashboard', clients: 'Clients', loans: 'Loans',
    collect: 'Collect', reports: 'Reports', settings: 'Settings',
    totalClients: 'Total Clients', loanGiven: 'Loan Given',
    collected: 'Collected', pending: 'Pending',
    dueToday: 'Due Today', recentPayments: 'Recent Payments',
    monthlyCollection: 'Monthly Collection',
    noPayments: 'No payments yet', noDueToday: 'No collections due today',
    addClient: 'Add Client', editClient: 'Edit Client',
    saveClient: 'Save Client', searchClients: 'Search clients…',
    noClients: 'No clients yet', addFirstClient: 'Add your first client to get started',
    addLoan: 'Add Loan', editLoan: 'Edit Loan', saveLoan: 'Save Loan',
    noLoans: 'No loans yet', principal: 'Principal',
    interest: 'Interest', duration: 'Duration', emiType: 'EMI Type',
    monthly: 'Monthly', weekly: 'Weekly', daily: 'Daily',
    startDate: 'Start Date', emi: 'EMI', totalPayable: 'Total Payable',
    totalInterest: 'Total Interest', nextDue: 'Next Due',
    recordPayment: 'Record Payment', paymentHistory: 'Payment History',
    sendReminder: 'Send Reminder', whatsapp: 'WhatsApp',
    receipt: 'Receipt', missed: 'Missed',
    overdue: 'Overdue', active: 'Active', completed: 'Completed',
    all: 'All', dueNow: 'Due Now',
    businessName: 'Business Name', financierName: 'Your Name',
    phone: 'Phone', language: 'Language', theme: 'Theme',
    darkMode: 'Dark Mode', exportData: 'Export Data',
    importData: 'Import Data', clearData: 'Clear All Data',
    changePin: 'Change PIN', currentPlan: 'Current Plan',
    free: 'Free', upgrade: 'Upgrade',
    logout: 'Logout', reminderMsg: (name, amt) => `Dear ${name}, your EMI ₹${amt} is due today. Please pay to avoid penalties. – KaasFlow`,
    reminderMsgOverdue: (name, amt, days) => `Dear ${name}, your EMI ₹${amt} is ${days} day(s) overdue. Please pay immediately. – KaasFlow`,
    recoveryRate: 'Recovery Rate', topDefaulters: 'Top Defaulters',
    totalInterestEarned: 'Total Interest Earned',
    exportExcel: 'Export Excel', exportCSV: 'Export CSV',
    clientWiseSummary: 'Client-wise Summary',
    loadingWorkspace: 'Loading your workspace…',
    welcomeBack: 'Welcome Back',
    signInToAccount: 'Sign in to your account',
    orUseEmail: 'or use email',
    emailAddress: 'Email Address',
    password: 'Password',
    noAccount: "Don't have an account?",
    register: 'Register',
    createAccount: 'Create Account',
    startManagingLoans: 'Start managing your loans',
    fullName: 'Full Name',
    businessNameInput: 'Business / Firm Name',
    haveAccount: 'Already have an account?',
    login: 'Login',
    setSecurityPin: 'Set Security PIN',
    createPinDesc: 'Create a 4-digit PIN to protect your app',
    setPinContinue: 'Set PIN & Continue',
    pinInfoText: "You'll use this PIN every time you open the app",
    enterPin: 'Enter your 4-digit PIN',
    unlock: 'Unlock',
    switchAccount: 'Switch Account',
    notifications: 'Notifications',
    clearAll: 'Clear all',
    noNewNotifications: 'No new notifications',
    address: 'Address',
    cancel: 'Cancel',
    confirmPayment: 'Confirm Payment',
    noteOptional: 'Note (optional)',
    clientProfile: 'Client Profile',
    close: 'Close',
    confirmDelete: 'Confirm Delete',
    delete: 'Delete',
    upgradePlan: 'Upgrade Plan',
    buyClientSlots: 'Buy Client Slots',
    extraClients: 'Extra Clients'
  },
  ta: {
    dashboard: 'டாஷ்போர்டு', clients: 'வாடிக்கையாளர்கள்',
    loans: 'கடன்கள்', collect: 'வசூல்', reports: 'அறிக்கைகள்',
    settings: 'அமைப்புகள்',
    totalClients: 'மொத்த வாடிக்கையாளர்கள்', loanGiven: 'கொடுத்த கடன்',
    collected: 'வசூலித்தது', pending: 'நிலுவை',
    dueToday: 'இன்று வரவேண்டியது', recentPayments: 'சமீபத்திய கட்டணங்கள்',
    monthlyCollection: 'மாதாந்திர வசூல்',
    noPayments: 'கட்டணங்கள் இல்லை', noDueToday: 'இன்று வசூல் இல்லை',
    addClient: 'வாடிக்கையாளரை சேர்க்க', editClient: 'திருத்து',
    saveClient: 'சேமி', searchClients: 'தேடுங்கள்…',
    noClients: 'வாடிக்கையாளர்கள் இல்லை',
    addFirstClient: 'முதல் வாடிக்கையாளரை சேர்க்கவும்',
    addLoan: 'கடன் சேர்க்க', editLoan: 'கடன் திருத்து', saveLoan: 'சேமி',
    noLoans: 'கடன்கள் இல்லை', principal: 'அசல்',
    interest: 'வட்டி', duration: 'காலம்', emiType: 'EMI வகை',
    monthly: 'மாதாந்திர', weekly: 'வாராந்திர', daily: 'தினசரி',
    startDate: 'தொடக்க தேதி', emi: 'EMI', totalPayable: 'மொத்தம் செலுத்த',
    totalInterest: 'மொத்த வட்டி', nextDue: 'அடுத்த தேதி',
    recordPayment: 'கட்டணம் பதிவு', paymentHistory: 'கட்டண வரலாறு',
    sendReminder: 'நினைவூட்டல்', whatsapp: 'வாட்ஸ்அப்',
    receipt: 'ரசீது', missed: 'தவறவிட்டது',
    overdue: 'தாமதமானது', active: 'செயலில்', completed: 'முடிந்தது',
    all: 'அனைத்தும்', dueNow: 'இப்போது வரவேண்டியது',
    businessName: 'வணிக பெயர்', financierName: 'உங்கள் பெயர்',
    phone: 'தொலைபேசி', language: 'மொழி', theme: 'தீம்',
    darkMode: 'இருள் பயன்முறை', exportData: 'தரவு ஏற்றுமதி',
    importData: 'தரவு இறக்குமதி', clearData: 'அனைத்தையும் அழி',
    changePin: 'PIN மாற்று', currentPlan: 'தற்போதைய திட்டம்',
    free: 'இலவசம்', upgrade: 'மேம்படுத்து',
    logout: 'வெளியேறு',
    reminderMsg: (name, amt) => `அன்புள்ள ${name}, உங்கள் EMI ₹${amt} இன்று செலுத்த வேண்டும். – KaasFlow`,
    reminderMsgOverdue: (name, amt, days) => `அன்புள்ள ${name}, உங்கள் EMI ₹${amt} ${days} நாள் தாமதமாகிவிட்டது. உடனே செலுத்துங்கள். – KaasFlow`,
    recoveryRate: 'வசூல் விகிதம்', topDefaulters: 'முதல் நிலுவையாளர்கள்',
    totalInterestEarned: 'மொத்த வட்டி ஆதாயம்',
    exportExcel: 'Excel ஏற்றுமதி', exportCSV: 'CSV ஏற்றுமதி',
    clientWiseSummary: 'வாடிக்கையாளர் சுருக்கம்',
    loadingWorkspace: 'உங்கள் பணியிடம் ஏற்றப்படுகிறது…',
    welcomeBack: 'மீண்டும் வருக',
    signInToAccount: 'உங்கள் கணக்கில் உள்நுழைக',
    orUseEmail: 'அல்லது மின்னஞ்சலை பயன்படுத்தவும்',
    emailAddress: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    noAccount: "கணக்கு இல்லையா?",
    register: 'பதிவு செய்க',
    createAccount: 'கணக்கை உருவாக்கு',
    startManagingLoans: 'உங்கள் கடன்களை நிர்வகிக்க தொடங்குங்கள்',
    fullName: 'முழு பெயர்',
    businessNameInput: 'வணிகம் / நிறுவனத்தின் பெயர்',
    haveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    login: 'உள்நுழை',
    setSecurityPin: 'பாதுகாப்பு PIN ஐ அமைக்கவும்',
    createPinDesc: 'உங்கள் செயலியை பாதுகாக்க 4 இலக்க PIN ஐ உருவாக்கவும்',
    setPinContinue: 'PIN ஐ அமைத்து தொடரவும்',
    pinInfoText: "ஒவ்வொரு முறை செயலியை திறக்கும் போதும் இந்த PIN ஐ பயன்படுத்துவீர்கள்",
    enterPin: 'உங்கள் 4 இலக்க PIN ஐ உள்ளிடவும்',
    unlock: 'திற',
    switchAccount: 'கணக்கை மாற்று',
    notifications: 'அறிவிப்புகள்',
    clearAll: 'அனைத்தையும் அழி',
    noNewNotifications: 'புதிய அறிவிப்புகள் இல்லை',
    address: 'முகவரி',
    cancel: 'ரத்துசெய்',
    confirmPayment: 'கட்டணத்தை உறுதிப்படுத்து',
    noteOptional: 'குறிப்பு (விருப்பமானால்)',
    clientProfile: 'வாடிக்கையாளர் சுயவிவரம்',
    close: 'மூடு',
    confirmDelete: 'நீக்குவதை உறுதிசெய்க',
    delete: 'நீக்கு',
    upgradePlan: 'திட்டத்தை மேம்படுத்து',
    buyClientSlots: 'வாடிக்கையாளர் இடங்களை வாங்கவும்',
    extraClients: 'கூடுதல் வாடிக்கையாளர்கள்'
  }
};

// ── STATE ─────────────────────────────────────────────────────
const state = {
  page: 'dashboard',
  lang: 'en',
  theme: 'light',
  session: null,
  collectionFilter: 'all',
  loanFilter: 'all',
  clientSearch: '',
  charts: {},
  deleteCallback: null,
  profileClientId: null,
  currentReceiptPayment: null,
  currentReceiptLoan: null,
};

// ── HELPERS ──────────────────────────────────────────────────
const t = (key, ...args) => {
  const fn = T[state.lang][key];
  if (typeof fn === 'function') return fn(...args);
  return fn || T.en[key] || key;
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmtCur(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function daysDiff(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}

// ── LOCAL STORAGE ─────────────────────────────────────────────
const Store = {
  get: key => { try { return JSON.parse(localStorage.getItem(LS[key])) || []; } catch { return []; } },
  getObj: key => { try { return JSON.parse(localStorage.getItem(LS[key])) || {}; } catch { return {}; } },
  set: (key, val) => {
    localStorage.setItem(LS[key], JSON.stringify(val));
    if (window.KFSync && LS[key] !== 'kf_session') {
      clearTimeout(window._kfSyncTimer);
      window._kfSyncTimer = setTimeout(() => KFSync.backup(true), 2000);
    }
  },
  clients: () => Store.get('clients'),
  loans: () => Store.get('loans'),
  payments: () => Store.get('payments'),
  // [NEW] Recycle Bin
  recycleBin: () => Store.get('recycleBin'),
  settings: () => Store.getObj('settings'),
  session: () => Store.getObj('session'),
  saveClients: v => {
    const s = Store.getObj('settings');
    const plan = s.plan || 'free';
    // [NEW] Client slot limit logic
    const limit = FREE_CLIENT_LIMIT + (s.extraClients || 0);
    if (plan === 'free' && v.length > limit) {
      const existing = Store.get('clients') || [];
      if (v.length > existing.length && existing.length >= limit) {
        return; // Absolute firewall: do not allow saving more than the limit on free tier
      }
    }
    Store.set('clients', v);
  },
  saveLoans: v => Store.set('loans', v),
  savePayments: v => Store.set('payments', v),
  saveRecycleBin: v => Store.set('recycleBin', v),
  // [NEW] Recycle Bin
  saveSettings: v => Store.set('settings', v),
  saveSession: v => Store.set('session', v),
};

// ── TOAST ──────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `kf-toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
  $('#toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

// ── THEME & LANG ──────────────────────────────────────────────
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const icon = $('#theme-icon');
  // [FIX] Language change: Ensure icon doesn't change
  if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function applyLang(lang) {
  state.lang = lang;
  if (lang === 'ta') {
    document.body.classList.add('tamil-text');
  } else {
    document.body.classList.remove('tamil-text');
  }
  // [FIX] Language change: Only text language should change
  translateDOM();
}

function translateDOM() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (T[state.lang] && T[state.lang][key]) {
      el.textContent = T[state.lang][key];
    } else if (T.en[key]) {
      el.textContent = T.en[key];
    }
  });
}

// ── AUTH ──────────────────────────────────────────────────────
async function apiAuth(endpoint, payload) {
  try {
    const API_BASE = 'http://localhost:5000';
    const url = endpoint === 'google' ? `${API_BASE}/auth/google` : `${API_BASE}/auth/${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    // Backend offline — allow offline mode
    return { success: false, offline: true, message: 'Backend offline. Using offline mode.' };
  }
}

// Google Login Callback
window.handleGoogleLogin = async function(response) {
  const res = await apiAuth('google', { token: response.credential });
  if (res.success) {
    Store.saveSession({ token: 'google-session', user: res.user });
    state.session = getSession();
    generateSampleData();
    // Check if PIN already set
    if (hasPin()) {
      showPinLock();
    } else {
      showPinSetup();
    }
  } else if (res.offline) {
    // Offline mode for Google
    showToast('Running in offline mode.', 'info');
    Store.saveSession({ token: 'google-offline', user: { email: 'google-user', financierName: 'Financier', businessName: 'My Finance', role: 'admin' } });
    state.session = getSession();
    generateSampleData();
    if (hasPin()) {
      showPinLock();
    } else {
      showPinSetup();
    }
  } else {
    const errEl = $('#login-error');
    errEl.textContent = res.error || 'Google login failed';
    errEl.classList.remove('d-none');
  }
};

function getSession() {
  return Store.session();
}

function isLoggedIn() {
  const s = getSession();
  return !!(s && s.token);
}

function hasPin() {
  const s = Store.settings();
  return !!(s && s.appPin && s.appPin.length === 4);
}

function getPin() {
  const s = Store.settings();
  return s.appPin || null;
}

function logout() {
  localStorage.removeItem(LS.session);
  state.session = null;
  showAuth();
}

// ── INIT ──────────────────────────────────────────────────────
function init() {
  const settings = Store.settings();
  applyTheme(settings.theme || 'light');
  applyLang(settings.lang || 'en');

  // ── Register Service Worker for notification action buttons ──
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(() => {
        // Listen for messages from SW (Paid / Pending button taps)
        navigator.serviceWorker.addEventListener('message', e => {
          const msg = e.data || {};
          if      (msg.type === 'NOTIF_MARK_PAID')       handleNotifMarkPaid(msg.loanId, msg.emi);
          else if (msg.type === 'NOTIF_MARK_PENDING')    handleNotifMarkPending(msg.loanId);
          else if (msg.type === 'NOTIF_OPEN_COLLECTION') navigateTo('collection');
        });
      })
      .catch(() => {}); // non-critical
  }

  if (isLoggedIn()) {
    state.session = getSession();
    if (hasPin()) {
      showPinLock();
    } else {
      showPinSetup();
    }
  } else {
    showAuth();
  }

  bindGlobal();
  scheduleNotifications();
}

// ── Notification action: ✅ Paid ──────────────────────────────
function handleNotifMarkPaid(loanId, emiAmount) {
  if (!loanId) return;
  const loan = Store.loans().find(l => l.id === loanId);
  if (!loan) { showToast('Loan not found', 'error'); return; }
  const stats   = calcLoanStats(loan);
  const amount  = emiAmount || stats.emi;
  const payment = {
    id: uid(), loanId, amount, date: today(),
    note: 'Paid via notification', createdAt: new Date().toISOString()
  };
  const payments = Store.payments();
  payments.push(payment);
  Store.savePayments(payments);
  // Auto-complete if fully paid
  if (stats.remaining - amount <= 0) {
    const loans = Store.loans();
    const idx   = loans.findIndex(l => l.id === loanId);
    if (idx !== -1) { loans[idx].status = 'completed'; Store.saveLoans(loans); }
  }
  updateNotifBadge();
  showToast(`✅ ₹${amount} recorded as Paid!`, 'success');
  navigateTo('collection');
}

// ── Notification action: ⏳ Pending ───────────────────────────
function handleNotifMarkPending(loanId) {
  showToast('⏳ Marked as Pending. Reminder will stay active.', 'info');
  navigateTo('collection');
}


// ── SCREENS ───────────────────────────────────────────────────
function showAuth() {
  $('#loading-screen').style.display = 'none';
  $('#auth-screen').style.display = '';
  $('#pin-lock-screen').style.display = 'none';
  $('#main-app').style.display = 'none';
  // Show login form, hide PIN setup and register
  $('#login-form-wrapper').style.display = '';
  $('#register-form-wrapper').style.display = 'none';
  $('#pin-setup-wrapper').style.display = 'none';
  if ($('#forgot-password-wrapper')) $('#forgot-password-wrapper').style.display = 'none';
}

function showPinSetup() {
  $('#loading-screen').style.display = 'none';
  $('#auth-screen').style.display = '';
  $('#pin-lock-screen').style.display = 'none';
  $('#main-app').style.display = 'none';
  // Hide login/register, show PIN setup
  $('#login-form-wrapper').style.display = 'none';
  $('#register-form-wrapper').style.display = 'none';
  $('#pin-setup-wrapper').style.display = '';
  if ($('#forgot-password-wrapper')) $('#forgot-password-wrapper').style.display = 'none';
  // Clear & focus first digit
  const inputs = $$('#pin-setup-inputs .pin-digit-input');
  inputs.forEach(i => { i.value = ''; i.classList.remove('shake', 'success'); });
  if (inputs[0]) inputs[0].focus();
  const errEl = $('#pin-setup-error');
  if (errEl) errEl.classList.add('d-none');
}

function showPinLock() {
  $('#loading-screen').style.display = 'none';
  $('#auth-screen').style.display = 'none';
  $('#pin-lock-screen').style.display = '';
  $('#main-app').style.display = 'none';
  // Populate user info
  const session = getSession();
  const user = session?.user;
  if (user) {
    const name = user.financierName || user.email || 'User';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarEl = $('#pin-lock-avatar');
    if (avatarEl) avatarEl.innerHTML = initials || '<i class="fa-solid fa-user"></i>';
    const nameEl = $('#pin-lock-name');
    if (nameEl) nameEl.textContent = 'Welcome, ' + (user.financierName || 'User');
    const emailEl = $('#pin-lock-email');
    if (emailEl) emailEl.textContent = user.email || '';
  }
  // Clear & focus first digit
  const inputs = $$('#pin-lock-inputs .pin-digit-input');
  inputs.forEach(i => { i.value = ''; i.classList.remove('shake', 'success'); });
  if (inputs[0]) inputs[0].focus();
  const errEl = $('#pin-lock-error');
  if (errEl) errEl.classList.add('d-none');
}

function showApp() {
  $('#loading-screen').style.display = 'none';
  $('#auth-screen').style.display = 'none';
  $('#pin-lock-screen').style.display = 'none';
  $('#main-app').style.display = '';
  updatePlanBanner();
  navigateTo(state.page || 'dashboard');
  // Fire today's payment notifications when app becomes visible
  fireTodayNotifications();
}

// ── NAVIGATION ────────────────────────────────────────────────
function navigateTo(page) {
  state.page = page;
  $$('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.page === page);
  });
  const content = $('#page-content');
  content.innerHTML = '';
  destroyCharts();

  const pages = {
    dashboard: renderDashboard,
    clients:   renderClients,
    loans:     renderLoans,
    collection: renderCollection,
    reports:   renderReports,
    settings:  renderSettings,
  };
  if (pages[page]) pages[page](content);
}

function destroyCharts() {
  Object.values(state.charts).forEach(c => { try { c.destroy(); } catch {} });
  state.charts = {};
}

// ── PLAN LOGIC ────────────────────────────────────────────────
function getPlan() {
  const s = Store.settings();
  return s.plan || 'free';
}

function getPlanExpiry() {
  const s = Store.settings();
  return s.planExpiry || null;
}

function isPlanActive() {
  const plan = getPlan();
  if (plan === 'free') return true;
  const exp = getPlanExpiry();
  if (!exp) return false;
  return new Date(exp) > new Date();
}

function canAddClient() {
  const plan = getPlan();
  if (plan !== 'free' && isPlanActive()) return true;
  const s = Store.settings();
  const limit = FREE_CLIENT_LIMIT + (s.extraClients || 0);
  return Store.clients().length < limit;
}

// Checks if the user is allowed to add secondary data like Loans
function canUsePremiumFeatures() {
  const plan = getPlan();
  if (plan !== 'free' && isPlanActive()) return true;
  const s = Store.settings();
  const limit = FREE_CLIENT_LIMIT + (s.extraClients || 0);
  return Store.clients().length <= limit;
}

function updatePlanBanner() {
  const banner = $('#plan-banner');
  if (!banner) return;
  const plan = getPlan();
  const s = Store.settings();
  const limit = FREE_CLIENT_LIMIT + (s.extraClients || 0);
  if (plan === 'free') { 
    if (Store.clients().length >= limit) {
      banner.classList.remove('d-none');
      $('#plan-banner-text').textContent = `Free trial limit reached (${limit} clients). Please upgrade to add more.`;
    } else {
      banner.classList.add('d-none');
    }
    return; 
  }
  const exp = getPlanExpiry();
  if (!exp) { banner.classList.add('d-none'); return; }
  const daysLeft = daysDiff(exp, today());
  if (daysLeft <= 30 && daysLeft > 0) {
    banner.classList.remove('d-none');
    $('#plan-banner-text').textContent = `Your ${plan} plan expires in ${daysLeft} day(s).`;
  } else if (daysLeft <= 0) {
    banner.classList.remove('d-none');
    $('#plan-banner-text').textContent = `Your plan has expired. Please renew.`;
  } else {
    banner.classList.add('d-none');
  }
}

window.KF = window.KF || {};
window.KF.upgradePro = function(planType) {
  const settings = Store.settings();
  const expDate = new Date();
  
  // Accurately calculate the exact date based on calendar months
  if (planType === 'monthly') {
    expDate.setMonth(expDate.getMonth() + 1);
  } else if (planType === 'quarterly') {
    expDate.setMonth(expDate.getMonth() + 3);
  } else if (planType === 'yearly') {
    expDate.setFullYear(expDate.getFullYear() + 1);
  } else {
    expDate.setFullYear(expDate.getFullYear() + 10); // Pay As You Go / Lifetime
  }
  
  settings.plan = planType;
  settings.planExpiry = expDate.toISOString().split('T')[0];
  Store.saveSettings(settings);
  
  const modal = bootstrap.Modal.getInstance($('#upgradeModal'));
  if (modal) modal.hide();
  
  updatePlanBanner();
  showToast(`Upgraded to ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan!`, 'success');
  
  // Immediately refresh the current page to unlock the 'Add' buttons
  navigateTo(state.page);
};

// ── SAMPLE DATA ───────────────────────────────────────────────
function generateSampleData() {
  if (Store.clients().length > 0) return;
  const clients = [
    { id: 'c1', name: 'Rajesh Kumar', phone: '9876543210', address: 'Connaught Place, Delhi', idNum: 'ABCDE1234F', occupation: 'Trader', createdAt: '2024-01-15' },
    { id: 'c2', name: 'Priya Singh', phone: '9845012345', address: 'Andheri, Mumbai', idNum: '', occupation: 'Shop Owner', createdAt: '2024-02-01' },
    { id: 'c3', name: 'Mohammed Ali', phone: '9787654321', address: 'Kothrud, Pune', idNum: 'QWERT5678G', occupation: 'Teacher', createdAt: '2024-02-20' },
    { id: 'c4', name: 'Sneha Patel', phone: '9765432109', address: 'Navrangpura, Ahmedabad', idNum: '', occupation: 'Tailor', createdAt: '2024-03-05' },
    { id: 'c5', name: 'Amit Sharma', phone: '9843210987', address: 'Bandra, Mumbai', idNum: 'ZXCVB9012H', occupation: 'Driver', createdAt: '2024-03-18' },
    { id: 'c6', name: 'Lakshmi Narayanan', phone: '9812345670', address: 'T Nagar, Chennai', idNum: '', occupation: 'IT Professional', createdAt: '2024-03-20' },
    { id: 'c7', name: 'Vikram Reddy', phone: '9823456701', address: 'Banjara Hills, Hyderabad', idNum: 'DFGHI2345J', occupation: 'Carpenter', createdAt: '2024-03-21' },
    { id: 'c8', name: 'Pooja Desai', phone: '9834567012', address: 'Salt Lake, Kolkata', idNum: '', occupation: 'Nurse', createdAt: '2024-03-22' },
    { id: 'c9', name: 'Sanjay Gupta', phone: '9845670123', address: 'MG Road, Bangalore', idNum: 'JKLMN3456K', occupation: 'Mechanic', createdAt: '2024-03-23' },
    { id: 'c10', name: 'Anita Bose', phone: '9856701234', address: 'Fort, Mumbai', idNum: '', occupation: 'Chef', createdAt: '2024-03-24' },
    { id: 'c11', name: 'Rahul Verma', phone: '9867012345', address: 'Indiranagar, Bangalore', idNum: 'PQRST4567L', occupation: 'Plumber', createdAt: '2024-03-25' },
    { id: 'c12', name: 'Kavita Iyer', phone: '9870123456', address: 'Mylapore, Chennai', idNum: '', occupation: 'Electrician', createdAt: '2024-03-26' },
    { id: 'c13', name: 'John Fernandez', phone: '9801234567', address: 'Panjim, Goa', idNum: 'UVWXY5678M', occupation: 'Manager', createdAt: '2024-03-27' },
    { id: 'c14', name: 'Meera Chopra', phone: '9812345098', address: 'Karol Bagh, Delhi', idNum: '', occupation: 'Artist', createdAt: '2024-03-28' },
    { id: 'c15', name: 'Deepak Saxena', phone: '9823456109', address: 'Gomti Nagar, Lucknow', idNum: 'ZABCD6789N', occupation: 'Receptionist', createdAt: '2024-03-29' },
    { id: 'c16', name: 'Swati Kapoor', phone: '9834567210', address: 'Vasant Kunj, Delhi', idNum: '', occupation: 'Security Guard', createdAt: '2024-03-30' },
    { id: 'c17', name: 'Anil Thakur', phone: '9845678321', address: 'Colaba, Mumbai', idNum: 'EFGHI7890O', occupation: 'Sales Executive', createdAt: '2024-03-31' },
    { id: 'c18', name: 'Divya Bhatia', phone: '9856789432', address: 'Saket, Delhi', idNum: '', occupation: 'Photographer', createdAt: '2024-04-01' },
  ];

  const td = today();
  // Dynamically generate 18 loans (one for each client)
  const loans = clients.map((c, i) => {
    const principal = [10000, 25000, 50000, 100000][i % 4];
    const interestRate = [1.5, 2, 2.5, 3][i % 4];
    const duration = [6, 10, 12, 24][i % 4];
    const type = i % 2 === 0 ? 'weekly' : 'monthly';
    const interestType = 'percentage';
    
    // Spread start dates over the last few months
    const start = new Date();
    start.setMonth(start.getMonth() - (i % 5));
    start.setDate(start.getDate() - (i * 2));
    const startDate = start.toISOString().split('T')[0];

    return {
      id: `l${i + 1}`,
      clientId: c.id,
      principal,
      interestRate,
      interestType,
      duration,
      type,
      startDate,
      status: 'active',
      createdAt: startDate
    };
  });

  // Generate exactly 18 collections (1 payment per loan) with different dates and modes
  const payments = [];
  loans.forEach((loan, li) => {
    const monthlyInterest = calcMonthlyInterest(loan.principal, loan.interestRate, loan.interestType);
    const totalPayable = loan.principal + (monthlyInterest * loan.duration);
    const installments = loan.type === 'weekly' ? loan.duration * 4 : loan.duration;
    const emi = +(totalPayable / installments).toFixed(2);
    
    const d = new Date(loan.startDate);
    if (loan.type === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (loan.type === 'weekly') d.setDate(d.getDate() + 7);
    
    // Ensure the payment date is not in the future
    const paymentDate = d <= new Date() ? d.toISOString().split('T')[0] : td;

    payments.push({
      id: uid(), loanId: loan.id,
      amount: emi,
      date: paymentDate,
      note: ['Cash', 'UPI', 'Bank Transfer'][li % 3],
      createdAt: paymentDate
    });
  });

  Store.saveClients(clients);
  Store.saveLoans(loans);
  Store.savePayments(payments);
}

// ── EMI CALCULATIONS ──────────────────────────────────────────
function calcMonthlyInterest(principal, rate, interestType) {
  if (!principal || !rate) return 0;
  if (interestType === 'fixed') {
    return (principal / 1000) * (rate * 100);
  } else {
    return principal * (rate / 100);
  }
}

function calcLoanStats(loan) {
  const duration = loan.duration || 0;
  const monthlyInterest = calcMonthlyInterest(loan.principal, loan.interestRate, loan.interestType || 'percentage');
  const totalInterest = monthlyInterest * duration;
  const totalPayable = duration > 0 ? loan.principal + totalInterest : loan.principal;
  
  let emi = 0;
  if (duration > 0) {
    const installments = loan.type === 'weekly' ? duration * 4 : duration;
    emi = +(totalPayable / installments).toFixed(2);
  }
  
  const payments = Store.payments().filter(p => p.loanId === loan.id);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalPayable - totalPaid);
  const progress = Math.min(100, Math.round((totalPaid / totalPayable) * 100));
  const nextDueDate = calcNextDue(loan, payments);
  const isOverdue = nextDueDate && nextDueDate < today() && loan.status === 'active';
  const daysOverdue = isOverdue ? daysDiff(today(), nextDueDate) : 0;
  return { emi, totalPayable, totalInterest, totalPaid, remaining, progress, nextDueDate, isOverdue, daysOverdue };
}

function calcNextDue(loan, payments = null) {
  if (!loan.duration || loan.duration <= 0) return null;
  if (!payments) payments = Store.payments().filter(p => p.loanId === loan.id);
  const d = new Date(loan.startDate);
  const typeMap = { monthly: 'month', weekly: 'week' };
  const step = typeMap[loan.type] || 'month';
  const totalInstallments = loan.type === 'weekly' ? loan.duration * 4 : loan.duration;
  let installments = 0;
  
  const monthlyInterest = calcMonthlyInterest(loan.principal, loan.interestRate, loan.interestType || 'percentage');
  const totalPayable = loan.principal + (monthlyInterest * loan.duration);
  const emi = +(totalPayable / totalInstallments).toFixed(2);
  
  while (installments < totalInstallments) {
    if (step === 'month') d.setMonth(d.getMonth() + 1);
    else if (step === 'week') d.setDate(d.getDate() + 7);
    installments++;
    const due = d.toISOString().split('T')[0];
    const paid = payments.filter(p => p.date === due).reduce((s, p) => s + p.amount, 0);
    if (paid < emi * 0.9) return due;
  }
  return null;
}

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard(container) {
  const clients = Store.clients();
  const loans = Store.loans();
  const payments = Store.payments();

  const totalLoanGiven = loans.reduce((s, l) => s + l.principal, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalPayable = loans.reduce((s, l) => s + calcLoanStats(l).totalPayable, 0);
  const pending = Math.max(0, totalPayable - totalCollected);

  const todayStr = today();
  const dueToday = loans.filter(l => l.status === 'active').map(l => {
    const stats = calcLoanStats(l);
    const client = clients.find(c => c.id === l.clientId);
    return { loan: l, stats, client };
  }).filter(({ stats }) => stats.nextDueDate <= todayStr && stats.remaining > 0);

  const recentPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  container.innerHTML = `
    <div class="page-section" data-ocid="dashboard.page">
      <div class="kpi-grid stagger-children">
        <div class="kpi-card" data-ocid="dashboard.total_clients_card">
          <div class="kpi-label">${t('totalClients')}</div>
          <div class="kpi-value">${clients.length}</div>
          <i class="fa-solid fa-users kpi-icon"></i>
        </div>
        <div class="kpi-card" data-ocid="dashboard.loan_given_card">
          <div class="kpi-label">${t('loanGiven')}</div>
          <div class="kpi-value">${fmtCur(totalLoanGiven)}</div>
          <i class="fa-solid fa-money-bill kpi-icon"></i>
        </div>
        <div class="kpi-card success" data-ocid="dashboard.collected_card">
          <div class="kpi-label">${t('collected')}</div>
          <div class="kpi-value">${fmtCur(totalCollected)}</div>
          <i class="fa-solid fa-circle-check kpi-icon"></i>
        </div>
        <div class="kpi-card danger" data-ocid="dashboard.pending_card">
          <div class="kpi-label">${t('pending')}</div>
          <div class="kpi-value">${fmtCur(pending)}</div>
          <i class="fa-solid fa-clock kpi-icon"></i>
        </div>
      </div>

      <div class="kf-card" data-ocid="dashboard.due_today_card">
        <div class="section-title"><i class="fa-solid fa-calendar-day"></i>${t('dueToday')} (${dueToday.length})</div>
        <div class="stagger-children">${dueToday.length === 0
          ? `<p class="text-muted-kf" style="font-size:.875rem;margin:0">${t('noDueToday')}</p>`
          : dueToday.slice(0, 6).map(({ loan, stats, client }, i) => `
            <div class="due-today-item" data-ocid="dashboard.due_today.item.${i + 1}">
              <div>
                <div class="due-today-name">${client ? client.name : 'Unknown'}</div>
                <div class="due-today-meta">${t(loan.type)} EMI · ${stats.isOverdue ? `<span style="color:var(--color-danger)">${stats.daysOverdue}d overdue</span>` : 'Due today'}</div>
              </div>
              <div class="due-today-amount">${fmtCur(stats.emi)}</div>
            </div>`).join('')
        }
        </div></div>

      <div class="kf-card" data-ocid="dashboard.monthly_chart_card">
        <div class="section-title"><i class="fa-solid fa-chart-bar"></i>${t('monthlyCollection')}</div>
        <div class="chart-wrapper">
          <canvas id="dash-chart" class="chart-canvas"></canvas>
        </div>
      </div>

      <div class="kf-card" data-ocid="dashboard.recent_payments_card">
        <div class="section-title"><i class="fa-solid fa-receipt"></i>${t('recentPayments')}</div>
        <div class="stagger-children">${recentPayments.length === 0
          ? `<p class="text-muted-kf" style="font-size:.875rem;margin:0">${t('noPayments')}</p>`
          : recentPayments.map((p, i) => {
              const loan = loans.find(l => l.id === p.loanId);
              const client = loan ? clients.find(c => c.id === loan.clientId) : null;
              return `<div class="payment-row" data-ocid="dashboard.payment.item.${i + 1}">
                <div>
                  <div style="font-weight:700">${client ? client.name : 'Unknown'}</div>
                  <div class="payment-row-date">${fmtDate(p.date)}${p.note ? ' · ' + p.note : ''}</div>
                </div>
                <div class="payment-row-amount">${fmtCur(p.amount)}</div>
              </div>`;
            }).join('')
        }
        </div></div>
    </div>`;

  renderMonthlyChart('dash-chart', payments);
}

function renderMonthlyChart(canvasId, payments) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const months = [];
  const amounts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-IN', { month: 'short' });
    months.push(label);
    const total = payments.filter(p => p.date && p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
    amounts.push(total);
  }
  const isDark = state.theme === 'dark';
  const chartColor = '#f59e0b';
  if (state.charts[canvasId]) { try { state.charts[canvasId].destroy(); } catch {} }
  const ctx = canvas.getContext('2d');
  let gradient = chartColor + 'cc';
  if(ctx) {
    gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
  }
  state.charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{ label: 'Collections', data: amounts, backgroundColor: gradient, hoverBackgroundColor: '#fbbf24', borderColor: 'rgba(245, 158, 11, 1)', borderWidth: 1, borderRadius: 8, barThickness: 'flex', maxBarThickness: 45 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: '#f59e0b',
          bodyColor: isDark ? '#f8fafc' : '#0f172a',
          titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
          bodyFont: { family: "'Space Grotesk', sans-serif", size: 15, weight: 'bold' },
          padding: 12,
          cornerRadius: 12,
          displayColors: false,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          callbacks: { label: v => '₹' + v.parsed.y.toLocaleString('en-IN') }
        }
      },
      scales: {
        x: { grid: { display: false, drawBorder: false }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }, border: { display: false } },
        y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', drawBorder: false, borderDash: [5, 5] }, ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }, callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }, border: { display: false } }
      },
      animation: {
        y: { duration: 1200, easing: 'easeOutQuart' }
      }
    }
  });
}

// ── CLIENTS PAGE ──────────────────────────────────────────────
function renderClients(container) {
  const clients = Store.clients();
  const loans = Store.loans();

  const plan = getPlan();
  const isFree = plan === 'free' || !isPlanActive();
  const clientsCount = clients.length;
  const s = Store.settings();
  const limit = FREE_CLIENT_LIMIT + (s.extraClients || 0);
  
  const usageIndicator = isFree ? `<div style="font-size: 0.85rem; color: ${clientsCount >= limit ? 'var(--kf-danger)' : 'var(--kf-text-muted)'}; font-weight: 600; margin-top: 4px;"><i class="fa-solid fa-chart-pie me-1"></i>${clientsCount} / ${limit} Trial Clients Used</div>` : '';

  container.innerHTML = `
    <div class="page-section" data-ocid="clients.page">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <div class="page-title mb-0"><i class="fa-solid fa-users"></i>${t('clients')}</div>
          ${usageIndicator}
        </div>
        <button class="btn-kf-primary mt-1" id="btn-add-client" data-ocid="clients.add_button" style="white-space: nowrap;">
          <i class="fa-solid fa-plus me-1"></i>${t('addClient')}
        </button>
      </div>
      <div class="search-bar-wrapper">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" class="search-input" id="client-search" placeholder="${t('searchClients')}" value="${state.clientSearch}" data-ocid="clients.search_input" />
      </div>
      <div id="clients-list" class="stagger-children"></div>
    </div>`;

  renderClientsList(clients, loans);

  $('#btn-add-client').addEventListener('click', () => {
    if (!canAddClient()) {
      bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show();
    } else {
      openClientModal();
    }
  });
  $('#client-search').addEventListener('input', e => {
    state.clientSearch = e.target.value;
    renderClientsList(Store.clients(), Store.loans());
  });
}

function renderClientsList(clients, loans) {
  const listEl = $('#clients-list');
  if (!listEl) return;
  const q = state.clientSearch.toLowerCase();
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(q) || c.phone.includes(q)
  );
  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty-state" data-ocid="clients.empty_state">
      <div class="empty-state-icon"><i class="fa-solid fa-users"></i></div>
      <h3>${t('noClients')}</h3>
      <p>${t('addFirstClient')}</p>
    </div>`;
    return;
  }
  listEl.innerHTML = filtered.map((c, i) => {
    const clientLoans = loans.filter(l => l.clientId === c.id);
    const activeLoans = clientLoans.filter(l => l.status === 'active').length;
    const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `<div class="client-card" data-ocid="clients.item.${i + 1}" data-id="${c.id}">
      <div class="client-avatar">${initials}</div>
      <div class="client-info min-w-0">
        <div class="client-name">${c.name}</div>
        <div class="client-meta">
          <span><i class="fa-solid fa-phone" style="font-size:.7rem"></i> ${c.phone}</span>
          <span>${activeLoans} active loan${activeLoans !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="client-actions">
        <button class="btn-icon primary" data-action="view" data-id="${c.id}" aria-label="View profile" data-ocid="clients.view_button.${i + 1}"><i class="fa-solid fa-eye"></i></button>
        <button class="btn-icon" data-action="download" data-id="${c.id}" aria-label="Download" data-ocid="clients.download_button.${i + 1}"><i class="fa-solid fa-download"></i></button>
        <button class="btn-icon" data-action="edit" data-id="${c.id}" aria-label="Edit" data-ocid="clients.edit_button.${i + 1}"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon danger" data-action="delete" data-id="${c.id}" aria-label="Delete" data-ocid="clients.delete_button.${i + 1}"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');

  listEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'download') downloadClientDetailsPDF(id); // [NEW] Client Section Download Option
    if (btn.dataset.action === 'view') openClientProfile(id);
    if (btn.dataset.action === 'edit') openClientModal(id);
    if (btn.dataset.action === 'delete') confirmDelete('client', id);
  });
}

function openClientModal(id = null) {
  const modal = new bootstrap.Modal($('#clientModal'));
  const titleEl = $('#clientModalLabel');
  titleEl.textContent = id ? t('editClient') : t('addClient');
  $('#client-edit-id').value = id || '';
  if (id) {
    const c = Store.clients().find(x => x.id === id);
    if (c) {
      $('#client-name').value = c.name;
      $('#client-phone').value = c.phone;
      $('#client-address').value = c.address || '';
      $('#client-id-num').value = c.idNum || '';
      $('#client-occupation').value = c.occupation || '';
    }
  } else {
    $('#client-form').reset();
  }
  modal.show();
}

// [NEW] Client Section Download Option: Open client profile and add download button
function openClientProfile(clientId) {
  state.profileClientId = clientId;
  const c = Store.clients().find(x => x.id === clientId);
  if (!c) return;
  const clientLoans = Store.loans().filter(l => l.clientId === clientId);
  const payments = Store.payments();
  $('#clientProfileName').textContent = c.name;
  // [NEW] Client Section Download Option: Add download button to client profile modal header
  const body = $('#client-profile-body');
  body.innerHTML = `
    <div class="mb-3">
      <div class="d-flex align-items-center gap-3 mb-3">
        <div class="client-avatar" style="width:56px;height:56px;font-size:1.375rem">${c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</div>
        <div>
          <div style="font-weight:700;font-size:1.0625rem">${c.name}</div>
          <div class="text-muted-kf fs-sm"><i class="fa-solid fa-phone me-1"></i>${c.phone}</div>
          ${c.address ? `<div class="text-muted-kf fs-sm"><i class="fa-solid fa-location-dot me-1"></i>${c.address}</div>` : ''}
        </div>
      </div>
      ${c.occupation ? `<div class="fs-sm text-muted-kf mb-1"><i class="fa-solid fa-briefcase me-1"></i>${c.occupation}</div>` : ''}
      ${c.idNum ? `<div class="fs-sm text-muted-kf"><i class="fa-solid fa-id-card me-1"></i>${c.idNum}</div>` : ''}
    </div>
    <div style="text-align:right; margin-bottom:1rem;">
      <button class="btn-kf-ghost" onclick="downloadClientDetailsPDF('${clientId}')" data-ocid="client.profile.download_button"><i class="fa-solid fa-download me-1"></i>Download Profile</button>
    </div>
    <div class="section-title"><i class="fa-solid fa-money-bill-wave"></i>Loans (${clientLoans.length})</div>
    ${clientLoans.length === 0 ? '<p class="text-muted-kf fs-sm">No loans yet.</p>' : clientLoans.map(l => {
      const stats = calcLoanStats(l);
      return `<div class="loan-card ${stats.isOverdue ? 'overdue' : l.status === 'completed' ? 'completed' : ''}" style="margin-bottom:.625rem">
        <div class="loan-card-header">
          <div>${fmtCur(l.principal)}${l.duration ? ` · ${l.duration}mo` : ''}</div>
          <span class="badge-kf ${stats.isOverdue ? 'badge-overdue' : l.status === 'completed' ? 'badge-completed' : 'badge-active'}">${stats.isOverdue ? 'OVERDUE' : l.status.toUpperCase()}</span>
        </div>
        <div class="loan-card-grid">
          <div class="loan-card-stat"><div class="loan-card-label">EMI</div><div class="loan-card-value">${fmtCur(stats.emi)}</div></div>
          <div class="loan-card-stat"><div class="loan-card-label">Paid</div><div class="loan-card-value">${fmtCur(stats.totalPaid)}</div></div>
          <div class="loan-card-stat"><div class="loan-card-label">Remaining</div><div class="loan-card-value">${fmtCur(stats.remaining)}</div></div>
        </div>
        <div class="kf-progress"><div class="kf-progress-fill ${stats.isOverdue ? 'danger' : ''}" style="width:${stats.progress}%"></div></div>
        <div class="loan-card-actions d-flex flex-wrap gap-2">
          <button class="btn-kf-ghost flex-grow-1" style="font-size:.8rem;min-height:36px;padding:.375rem .75rem" onclick="bootstrap.Modal.getInstance(document.getElementById('clientProfileModal'))?.hide(); setTimeout(() => openLoanInfo('${l.id}'), 300)" data-ocid="client.profile.info_loan">
            <i class="fa-solid fa-circle-info me-1"></i>About
          </button>
          <button class="btn-kf-ghost flex-grow-1" style="font-size:.8rem;min-height:36px;padding:.375rem .75rem" onclick="bootstrap.Modal.getInstance(document.getElementById('clientProfileModal'))?.hide(); setTimeout(() => openLoanModal(null, '${l.id}'), 300)" data-ocid="client.profile.edit_loan">
            <i class="fa-solid fa-pen me-1"></i>Edit
          </button>
          <button class="btn-kf-ghost flex-grow-1" style="font-size:.8rem;min-height:36px;padding:.375rem .75rem" onclick="sendReminder('${l.id}')" title="Send WhatsApp Message">
            <i class="fa-brands fa-whatsapp me-1" style="color:#25D366; font-size:1.1rem;"></i>${t('whatsapp')}
          </button>
        </div>
      </div>`;
    }).join('')}
    ${clientLoans.length > 0 ? `<div class="section-title mt-2"><i class="fa-solid fa-receipt"></i>Recent Payments</div>
      ${payments.filter(p => clientLoans.some(l => l.id === p.loanId)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(p => `
        <div class="payment-row">
          <div><div style="font-weight:600">${fmtDate(p.date)}</div>${p.note ? `<div class="text-muted-kf fs-xs">${p.note}</div>` : ''}</div>
          <div class="payment-row-amount">${fmtCur(p.amount)}</div>
        </div>`).join('') || '<p class="text-muted-kf fs-sm">No payments yet.</p>'}` : ''}`;

  const modal = new bootstrap.Modal($('#clientProfileModal'));
  modal.show();
}

// ── LOANS PAGE ────────────────────────────────────────────────
function renderLoans(container) {
  const loans = Store.loans();
  const clients = Store.clients();

  container.innerHTML = `
    <div class="page-section" data-ocid="loans.page">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div class="page-title mb-0"><i class="fa-solid fa-money-bill-wave"></i>${t('loans')}</div>
        <button class="btn-kf-primary" id="btn-add-loan" data-ocid="loans.add_button" style="white-space: nowrap;">
          <i class="fa-solid fa-plus me-1"></i>${t('addLoan')}
        </button>
      </div>
      <div class="filter-tabs">
        <button class="filter-tab ${state.loanFilter === 'all' ? 'active' : ''}" data-filter="all" data-ocid="loans.filter.all_tab">${t('all')}</button>
        <button class="filter-tab ${state.loanFilter === 'active' ? 'active' : ''}" data-filter="active" data-ocid="loans.filter.active_tab">${t('active')}</button>
        <button class="filter-tab ${state.loanFilter === 'overdue' ? 'active' : ''}" data-filter="overdue" data-ocid="loans.filter.overdue_tab">${t('overdue')}</button>
        <button class="filter-tab ${state.loanFilter === 'completed' ? 'active' : ''}" data-filter="completed" data-ocid="loans.filter.completed_tab">${t('completed')}</button>
      </div>
      <div id="loans-list" class="stagger-children"></div>
    </div>`;

  renderLoansList(loans, clients);

  $('#btn-add-loan').addEventListener('click', () => {
    if (!canUsePremiumFeatures()) {
      bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show();
    } else {
      openLoanModal();
    }
  });
  $$('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.loanFilter = btn.dataset.filter;
      $$('.filter-tab').forEach(b => b.classList.toggle('active', b.dataset.filter === state.loanFilter));
      renderLoansList(Store.loans(), Store.clients());
    });
  });
}

function renderLoansList(loans, clients) {
  const listEl = $('#loans-list');
  if (!listEl) return;
  let filtered = loans;
  if (state.loanFilter === 'active') filtered = loans.filter(l => l.status === 'active');
  if (state.loanFilter === 'overdue') filtered = loans.filter(l => calcLoanStats(l).isOverdue);
  if (state.loanFilter === 'completed') filtered = loans.filter(l => l.status === 'completed');

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty-state" data-ocid="loans.empty_state">
      <div class="empty-state-icon"><i class="fa-solid fa-money-bill-wave"></i></div>
      <h3>${t('noLoans')}</h3>
      <p>Add a loan for any client to track EMIs.</p>
    </div>`;
    return;
  }

  listEl.innerHTML = filtered.map((l, i) => {
    const stats = calcLoanStats(l);
    const client = clients.find(c => c.id === l.clientId);
    const statusClass = stats.isOverdue ? 'overdue' : l.status === 'completed' ? 'completed' : '';
    return `
    <div class="loan-card ${statusClass}" data-ocid="loans.item.${i + 1}">
      <div class="loan-card-header">
        <div class="loan-card-name">${client ? client.name : 'Unknown'}</div>
        <span class="badge-kf ${stats.isOverdue ? 'badge-overdue' : l.status === 'completed' ? 'badge-completed' : 'badge-active'}">
          ${stats.isOverdue ? 'OVERDUE' : l.status.toUpperCase()}
        </span>
      </div>
      <div class="loan-card-grid">
        <div class="loan-card-stat"><div class="loan-card-label">${t('emi')}</div><div class="loan-card-value">${fmtCur(stats.emi)}</div></div>
        <div class="loan-card-stat"><div class="loan-card-label">${t('principal')}</div><div class="loan-card-value">${fmtCur(l.principal)}</div></div>
        <div class="loan-card-stat"><div class="loan-card-label">Paid</div><div class="loan-card-value">${fmtCur(stats.totalPaid)}</div></div>
        <div class="loan-card-stat"><div class="loan-card-label">Remaining</div><div class="loan-card-value">${fmtCur(stats.remaining)}</div></div>
        <div class="loan-card-stat"><div class="loan-card-label">${t('nextDue')}</div><div class="loan-card-value" style="font-size:.8rem">${stats.nextDueDate ? fmtDate(stats.nextDueDate) : '—'}</div></div>
        <div class="loan-card-stat"><div class="loan-card-label">Progress</div><div class="loan-card-value">${stats.progress}%</div></div>
      </div>
      <div class="kf-progress"><div class="kf-progress-fill ${stats.isOverdue ? 'danger' : stats.progress === 100 ? 'success' : ''}" style="width:${stats.progress}%"></div></div>
      <div class="loan-card-actions d-flex flex-wrap gap-2">
        <button class="btn-kf-ghost" style="font-size:.8rem;min-height:36px;padding:.375rem .75rem" data-action="info" data-id="${l.id}"><i class="fa-solid fa-circle-info me-1"></i>About</button>
        <button class="btn-kf-ghost" style="font-size:.8rem;min-height:36px;padding:.375rem .75rem" data-action="edit" data-id="${l.id}" data-ocid="loans.edit_button.${i + 1}"><i class="fa-solid fa-pen me-1"></i>Edit</button>
        <button class="btn-kf-ghost" style="font-size:.8rem;min-height:36px;padding:.375rem .75rem" data-action="remind" data-id="${l.id}" title="Send WhatsApp Message" aria-label="WhatsApp Message" data-ocid="loans.remind.${i + 1}"><i class="fa-brands fa-whatsapp me-1" style="color:#25D366; font-size:1.1rem;"></i>${t('whatsapp')}</button>
        <button class="btn-icon" data-action="download" data-id="${l.id}" aria-label="Download" data-ocid="loans.download_button.${i + 1}"><i class="fa-solid fa-download"></i></button>
        <button class="btn-icon danger" data-action="delete" data-id="${l.id}" aria-label="Delete" data-ocid="loans.delete_button.${i + 1}"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');

  listEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'info') openLoanInfo(id);
    if (btn.dataset.action === 'remind') sendReminder(id);
    if (btn.dataset.action === 'edit') openLoanModal(null, id);
    if (btn.dataset.action === 'download') downloadLoanDetailsPDF(id);
    if (btn.dataset.action === 'delete') confirmDelete('loan', id);
  });
}

// ── LOAN INFO MODAL ───────────────────────────────────────────
function openLoanInfo(loanId) {
  const loan = Store.loans().find(l => l.id === loanId);
  if (!loan) return;
  const client = Store.clients().find(c => c.id === loan.clientId);
  const stats = calcLoanStats(loan);
  
  let html = `
    <div style="text-align:center; margin-bottom:1.5rem;">
      <div style="width:56px;height:56px;background:var(--gradient-green);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:1.5rem;color:#ffffff;margin-bottom:0.5rem;box-shadow:0 4px 15px var(--green-glow);">
        <i class="fa-solid fa-hand-holding-dollar"></i>
      </div>
      <h4 style="margin-bottom:4px; font-weight:700; font-family:'JetBrains Mono', monospace;">${fmtCur(loan.principal)}</h4>
      <span class="badge-kf ${stats.isOverdue ? 'badge-overdue' : loan.status === 'completed' ? 'badge-completed' : 'badge-active'}">
        ${stats.isOverdue ? 'OVERDUE' : loan.status.toUpperCase()}
      </span>
    </div>

    <div class="kf-card" style="padding:1rem; margin-bottom:1rem; background:rgba(0,0,0,0.02); box-shadow:none;">
      <div class="emi-preview-row"><span>Client</span><strong style="color:var(--color-primary);">${client ? client.name : 'Unknown'}</strong></div>
      <div class="emi-preview-row"><span>Phone</span><strong>${client ? client.phone : 'N/A'}</strong></div>
      <div class="emi-preview-row"><span>Start Date</span><strong>${fmtDate(loan.startDate)}</strong></div>
    </div>

    <div class="kf-card" style="padding:1rem; margin-bottom:1rem; background:rgba(0,0,0,0.02); box-shadow:none;">
      <div class="emi-preview-row"><span>Interest Rate</span><strong>${loan.interestRate}% (${loan.interestType === 'fixed' ? 'Fixed' : 'Percentage'})</strong></div>
      <div class="emi-preview-row"><span>Duration</span><strong>${loan.duration ? loan.duration + ' installments' : 'Open'}</strong></div>
      <div class="emi-preview-row"><span>Collection Type</span><strong style="text-transform:capitalize;">${loan.type}</strong></div>
      <div class="emi-preview-row" style="margin-top:8px; padding-top:8px; border-top:1px dashed var(--color-border-muted);">
        <span style="color:var(--color-text-muted); font-weight:600;">Collection Amount</span>
        <strong style="color:var(--color-primary); font-size:1.1rem;">${fmtCur(stats.emi)}</strong>
      </div>
    </div>

    <div class="kf-card" style="padding:1rem; background:rgba(0,0,0,0.02); box-shadow:none;">
      <div class="emi-preview-row"><span>Total Payable</span><strong>${fmtCur(stats.totalPayable)}</strong></div>
      <div class="emi-preview-row"><span>Total Paid</span><strong style="color:var(--color-success);">${fmtCur(stats.totalPaid)}</strong></div>
      <div class="emi-preview-row"><span>Remaining</span><strong style="color:var(--color-danger);">${fmtCur(stats.remaining)}</strong></div>
      
      <div style="margin-top:12px;">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--color-text-muted); margin-bottom:4px; font-weight:600;">
          <span>Progress</span><span>${stats.progress}%</span>
        </div>
        <div class="kf-progress"><div class="kf-progress-fill ${stats.isOverdue ? 'danger' : stats.progress === 100 ? 'success' : ''}" style="width:${stats.progress}%"></div></div>
      </div>
      
      ${stats.nextDueDate && loan.status === 'active' ? `
        <div class="emi-preview-row" style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--color-border-muted);">
          <span>Next Due</span><strong style="${stats.isOverdue ? 'color:var(--color-danger);' : ''}">${fmtDate(stats.nextDueDate)} ${stats.isOverdue ? '(' + stats.daysOverdue + 'd late)' : ''}</strong>
        </div>` : ''}
    </div>
  `;
  
  $('#loan-info-body').innerHTML = html;
  new bootstrap.Modal($('#loanInfoModal')).show();
}

function openLoanModal(clientId = null, loanId = null) {
  const clients = Store.clients();
  const select = $('#loan-client-select');
  select.innerHTML = '<option value="">Select client…</option>' +
    clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  $('#loanModalLabel').textContent = loanId ? t('editLoan') : t('addLoan');
  $('#loan-edit-id').value = loanId || '';
  $('#loan-start-date').value = today();
  $('#emi-preview').classList.add('d-none');

  if (loanId) {
    const l = Store.loans().find(x => x.id === loanId);
    if (l) {
      select.value = l.clientId;
      $('#loan-interest-type').value = l.interestType || 'percentage';
      const label = $('#label-loan-interest');
      if (label) label.innerHTML = (l.interestType === 'fixed' ? 'Fixed Interest Value <span class="text-danger">*</span>' : 'Interest Percentage <span class="text-danger">*</span>');
      $('#loan-principal').value = l.principal;
      $('#loan-interest').value = l.interestRate;
      $('#loan-duration').value = l.duration || '';
      $('#loan-type').value = l.type;
      $('#loan-start-date').value = l.startDate;
      updateEMIPreview();
    }
  } else {
    $('#loan-form').reset();
    $('#loan-interest-type').value = 'percentage';
    const label = $('#label-loan-interest');
    if (label) label.innerHTML = 'Interest Percentage <span class="text-danger">*</span>';
    $('#loan-start-date').value = today();
    if (clientId) select.value = clientId;
  }
  new bootstrap.Modal($('#loanModal')).show();
}

function updateEMIPreview() {
  const p = parseFloat($('#loan-principal').value);
  const r = parseFloat($('#loan-interest').value) || 0;
  const dVal = $('#loan-duration').value;
  const d = dVal ? parseInt(dVal) : 0;
  const type = $('#loan-type').value;
  const intType = $('#loan-interest-type').value || 'percentage';

  if (!p || p <= 0) { 
    $('#emi-preview').classList.add('d-none'); 
    return; 
  }

  const monthlyInterest = calcMonthlyInterest(p, r, intType);
  const weeklyInterest = monthlyInterest / 4;

  if (!d || d <= 0) {
    $('#emi-preview-monthly-interest').textContent = fmtCur(monthlyInterest);
    $('#emi-preview-weekly-interest').textContent = fmtCur(weeklyInterest);
    $('#emi-preview-amount').textContent = '—';
    $('#emi-preview-total').textContent = fmtCur(p);
    $('#emi-preview-remaining').textContent = fmtCur(p);
    $('#emi-preview').classList.remove('d-none');
    return;
  }
  
  const totalInterest = monthlyInterest * d;
  const totalPayable = p + totalInterest;
  const installments = type === 'weekly' ? d * 4 : d;
  const emi = +(totalPayable / installments).toFixed(2);

  $('#emi-preview-monthly-interest').textContent = fmtCur(monthlyInterest);
  $('#emi-preview-weekly-interest').textContent = fmtCur(weeklyInterest);
  $('#emi-preview-amount').textContent = fmtCur(emi);
  $('#emi-preview-total').textContent = fmtCur(totalPayable);
  $('#emi-preview-remaining').textContent = fmtCur(totalPayable);
  const labelEl = $('#emi-preview-collection-label');
  if (labelEl) labelEl.textContent = type === 'weekly' ? 'Weekly EMI' : 'Monthly EMI';

  $('#emi-preview').classList.remove('d-none');
}

// ── COLLECTION PAGE ───────────────────────────────────────────
function renderCollection(container) {
  const loans = Store.loans().filter(l => l.status === 'active');
  const clients = Store.clients();
  const todayStr = today();

  container.innerHTML = `
    <div class="page-section" data-ocid="collection.page">
      <div class="page-title"><i class="fa-solid fa-calendar-check"></i>Daily Collection</div>
      <div class="filter-tabs">
        <button class="filter-tab ${state.collectionFilter === 'all' ? 'active' : ''}" data-filter="all" data-ocid="collection.filter.all_tab">${t('all')}</button>
        <button class="filter-tab ${state.collectionFilter === 'overdue' ? 'active' : ''}" data-filter="overdue" data-ocid="collection.filter.overdue_tab">${t('overdue')}</button>
        <button class="filter-tab ${state.collectionFilter === 'today' ? 'active' : ''}" data-filter="today" data-ocid="collection.filter.today_tab">${t('dueToday')}</button>
      </div>
      <div id="collection-list" class="stagger-children"></div>
    </div>`;

  renderCollectionList(loans, clients, todayStr);

  $$('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.collectionFilter = btn.dataset.filter;
      $$('.filter-tab').forEach(b => b.classList.toggle('active', b.dataset.filter === state.collectionFilter));
      renderCollectionList(Store.loans().filter(l => l.status === 'active'), Store.clients(), today());
    });
  });
}

function renderCollectionList(loans, clients, todayStr) {
  const listEl = $('#collection-list');
  if (!listEl) return;
  const items = loans.map(l => {
    const stats = calcLoanStats(l);
    const client = clients.find(c => c.id === l.clientId);
    return { loan: l, stats, client };
  }).filter(({ stats }) => {
    if (state.collectionFilter === 'overdue') return stats.isOverdue;
    if (state.collectionFilter === 'today') return stats.nextDueDate === todayStr;
    return stats.nextDueDate && stats.nextDueDate <= todayStr || stats.isOverdue;
  });

  if (items.length === 0) {
    listEl.innerHTML = `<div class="empty-state" data-ocid="collection.empty_state">
      <div class="empty-state-icon"><i class="fa-solid fa-calendar-check"></i></div>
      <h3>All Clear!</h3>
      <p>No collections due${state.collectionFilter !== 'all' ? ' for this filter' : ' today'}.</p>
    </div>`;
    return;
  }

  listEl.innerHTML = items.map(({ loan, stats, client }, i) => {
    const isOverdue = stats.isOverdue;
    return `
    <div class="collection-item ${isOverdue ? 'overdue' : ''}" data-ocid="collection.item.${i + 1}">
      <div class="collection-item-header">
        <div class="collection-item-name">${client ? client.name : 'Unknown'}</div>
        <span class="badge-kf ${isOverdue ? 'badge-overdue' : 'badge-pending'}">${isOverdue ? `${stats.daysOverdue}d OVERDUE` : 'DUE'}</span>
      </div>
      <div class="collection-item-meta">${client ? client.phone : ''} · ${t(loan.type)} EMI · Next: ${fmtDate(stats.nextDueDate)}</div>
      <div class="collection-item-actions">
        <button class="btn-kf-primary" style="min-height:40px;padding:.375rem 1rem;font-size:.875rem" data-action="collect" data-id="${loan.id}" data-ocid="collection.collect_button.${i + 1}">
          <i class="fa-solid fa-check me-1"></i>${t('collect')} ${fmtCur(stats.emi)}
        </button>
        <button class="btn-kf-ghost" style="min-height:40px;padding:.375rem .875rem;font-size:.875rem" data-action="missed" data-id="${loan.id}" data-ocid="collection.missed_button.${i + 1}">
          <i class="fa-solid fa-xmark me-1"></i>${t('missed')}
        </button>
        <button class="btn-icon" data-action="download" data-id="${loan.id}" data-ocid="collection.download_button.${i + 1}"><i class="fa-solid fa-download"></i></button>
        <button class="btn-kf-ghost" style="min-height:40px;padding:.375rem .875rem;font-size:.875rem" data-action="remind" data-id="${loan.id}" title="Send WhatsApp Message" aria-label="WhatsApp Message" data-ocid="collection.remind_button.${i + 1}">
          <i class="fa-brands fa-whatsapp me-1" style="color:#25D366; font-size:1.1rem;"></i>${t('whatsapp')}
        </button>
      </div>
    </div>`;
  }).join('');

  listEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'collect') quickCollect(id);
    if (btn.dataset.action === 'missed') markMissed(id);
    if (btn.dataset.action === 'download') downloadCollectionDetailsPDF(id);
    if (btn.dataset.action === 'remind') sendReminder(id);
  });
}

function quickCollect(loanId) {
  const loan = Store.loans().find(l => l.id === loanId);
  if (!loan) return;
  const stats = calcLoanStats(loan);
  const payment = {
    id: uid(), loanId,
    amount: stats.emi,
    date: today(),
    note: 'Quick collect',
    createdAt: new Date().toISOString(),
  };
  const payments = Store.payments();
  payments.push(payment);
  Store.savePayments(payments);
  generateReceipt(payment, loan);
  showToast(`Payment of ${fmtCur(stats.emi)} recorded!`, 'success');
  renderCollectionList(Store.loans().filter(l => l.status === 'active'), Store.clients(), today());
}

function markMissed(loanId) {
  showToast('Marked as missed. Follow up with a reminder.', 'info');
}

// ── REPORTS PAGE ──────────────────────────────────────────────
function renderReports(container) {
  const payments = Store.payments();
  const loans = Store.loans();
  const clients = Store.clients();
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalPayable = loans.reduce((s, l) => s + calcLoanStats(l).totalPayable, 0);
  const recoveryRate = totalPayable > 0 ? Math.round((totalCollected / totalPayable) * 100) : 0;
  const totalInterest = loans.reduce((s, l) => s + calcLoanStats(l).totalInterest, 0);

  // Top defaulters (clients with overdue loans)
  const defaulters = clients.map(c => {
    const clientLoans = loans.filter(l => l.clientId === c.id);
    const overdueAmount = clientLoans.filter(l => calcLoanStats(l).isOverdue)
      .reduce((s, l) => s + calcLoanStats(l).remaining, 0);
    return { client: c, overdueAmount };
  }).filter(d => d.overdueAmount > 0).sort((a, b) => b.overdueAmount - a.overdueAmount).slice(0, 5);

  container.innerHTML = `
    <div class="page-section" data-ocid="reports.page">
      <div class="page-title"><i class="fa-solid fa-chart-bar"></i>${t('reports')}</div>
      <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="report-stat kf-card" data-ocid="reports.recovery_card">
          <div class="report-stat-value">${recoveryRate}%</div>
          <div class="report-stat-label">${t('recoveryRate')}</div>
        </div>
        <div class="report-stat kf-card" data-ocid="reports.interest_card">
          <div class="report-stat-value">${fmtCur(totalInterest)}</div>
          <div class="report-stat-label">${t('totalInterestEarned')}</div>
        </div>
        <div class="report-stat kf-card" data-ocid="reports.collected_card">
          <div class="report-stat-value">${fmtCur(totalCollected)}</div>
          <div class="report-stat-label">${t('collected')}</div>
        </div>
      </div>

      <div class="kf-card" data-ocid="reports.monthly_chart_card">
        <div class="section-title"><i class="fa-solid fa-chart-bar"></i>${t('monthlyCollection')}</div>
        <div class="chart-wrapper">
          <canvas id="reports-chart" class="chart-canvas"></canvas>
        </div>
      </div>

      <div class="kf-card" data-ocid="reports.export_card">
        <div class="section-title"><i class="fa-solid fa-download"></i>Export Data</div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn-kf-ghost" id="btn-export-pdf-report" data-ocid="reports.export_pdf_button"><i class="fa-solid fa-file-pdf me-1"></i>${t('exportPDF')}</button>
          <button class="btn-kf-ghost" id="btn-export-csv" data-ocid="reports.export_csv_button"><i class="fa-solid fa-file-csv me-1"></i>${t('exportCSV')}</button>
        </div>
      </div>

      <div class="kf-card" data-ocid="reports.defaulters_card">
        <div class="section-title"><i class="fa-solid fa-triangle-exclamation"></i>${t('topDefaulters')}</div>
        ${defaulters.length === 0
          ? '<p class="text-muted-kf fs-sm">No defaulters. Great recovery rate!</p>'
          : defaulters.map((d, i) => `
            <div class="payment-row" data-ocid="reports.defaulter.item.${i + 1}">
              <div><div style="font-weight:700">${d.client.name}</div><div class="text-muted-kf fs-xs">${d.client.phone}</div></div>
              <div style="color:var(--color-danger);font-weight:700">${fmtCur(d.overdueAmount)}</div>
            </div>`).join('')
        }
      </div>

      <div class="kf-card" data-ocid="reports.client_summary_card">
        <div class="section-title"><i class="fa-solid fa-table"></i>${t('clientWiseSummary')}</div>
        <div style="overflow-x:auto">
          <table style="width:100%;font-size:.8125rem;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid var(--color-border)">
                <th style="text-align:left;padding:.5rem .375rem;color:var(--color-text-muted);font-weight:600">Client</th>
                <th style="text-align:right;padding:.5rem .375rem;color:var(--color-text-muted);font-weight:600">Given</th>
                <th style="text-align:right;padding:.5rem .375rem;color:var(--color-text-muted);font-weight:600">Paid</th>
                <th style="text-align:right;padding:.5rem .375rem;color:var(--color-text-muted);font-weight:600">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${clients.map((c, i) => {
                const cloans = loans.filter(l => l.clientId === c.id);
                const given = cloans.reduce((s, l) => s + l.principal, 0);
                const paid = payments.filter(p => cloans.some(l => l.id === p.loanId)).reduce((s, p) => s + p.amount, 0);
                const pending = Math.max(0, cloans.reduce((s, l) => s + calcLoanStats(l).totalPayable, 0) - paid);
                return `<tr style="border-bottom:1px solid var(--color-border-muted)" data-ocid="reports.client.item.${i + 1}">
                  <td style="padding:.5rem .375rem;font-weight:600">${c.name}</td>
                  <td style="text-align:right;padding:.5rem .375rem">${fmtCur(given)}</td>
                  <td style="text-align:right;padding:.5rem .375rem;color:var(--color-success)">${fmtCur(paid)}</td>
                  <td style="text-align:right;padding:.5rem .375rem;color:var(--color-danger)">${fmtCur(pending)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  renderMonthlyChart('reports-chart', payments);

  $('#btn-export-pdf-report').addEventListener('click', () => exportAllDataAsPDF());
  $('#btn-export-csv').addEventListener('click', () => exportCSV());
}

// ── SETTINGS PAGE ─────────────────────────────────────────────
function renderSettings(container) {
  const settings = Store.settings();
  const session = getSession();
  const plan = getPlan();
  const planExpiry = getPlanExpiry();

  // PRO Aesthetic Settings Page
  container.innerHTML = `
    <div class="page-section" data-ocid="settings.page">
      <div class="page-title"><i class="fa-solid fa-gear"></i><span data-i18n="settings">${t('settings')}</span></div>

      <!-- PRO Profile Header -->
      <div class="pro-profile-header mb-4 mt-2">
        <div class="pro-avatar">
           <i class="fa-solid fa-crown pro-crown"></i>
           <span>${(settings.financierName || (session && session.user ? session.user.financierName : 'U')).charAt(0).toUpperCase()}</span>
        </div>
        <div class="pro-profile-info">
           <h3 class="pro-name">${settings.financierName || (session && session.user ? session.user.financierName : 'Your Name')}</h3>
           <p class="pro-business">${settings.businessName || (session && session.user ? session.user.businessName : 'Business Name')}</p>
        </div>
      </div>

      <div class="kf-card pro-card" data-ocid="settings.profile_card">
        <div class="section-title"><i class="fa-solid fa-user-pen"></i>Edit Profile</div>
        <div class="mb-3">
          <label class="form-label" data-i18n="financierName">${t('financierName')}</label>
          <input type="text" class="form-control kf-input pro-input" id="settings-name" value="${settings.financierName || (session && session.user ? session.user.financierName : '') || ''}" data-ocid="settings.name_input" />
        </div>
        <div class="mb-3">
          <label class="form-label" data-i18n="businessName">${t('businessName')}</label>
          <input type="text" class="form-control kf-input pro-input" id="settings-business" value="${settings.businessName || (session && session.user ? session.user.businessName : '') || ''}" data-ocid="settings.business_input" />
        </div>
        <button class="btn-kf-primary pro-btn w-100 mt-2" id="btn-save-profile" data-ocid="settings.save_profile_button"><i class="fa-solid fa-floppy-disk me-2"></i>Save Profile</button>
      </div>

      <div class="kf-card pro-plan-card" data-ocid="settings.plan_card">
        <div class="plan-glass-layer"></div>
        <div class="plan-content">
          <div class="section-title"><i class="fa-solid fa-star"></i><span data-i18n="currentPlan">${t('currentPlan')}</span></div>
          <div class="settings-row" style="border:none">
            <div>
              <div class="settings-row-label" style="font-size:1.15rem"><i class="fa-solid fa-circle-check" style="color:var(--color-primary)"></i> ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</div>
              ${planExpiry ? `<div class="settings-row-sub text-muted-kf">Expires: ${fmtDate(planExpiry)}</div>` : ''}
            </div>
            <button class="btn-kf-primary pro-upgrade-btn" id="btn-upgrade" data-ocid="settings.upgrade_button">
              <i class="fa-solid fa-rocket me-1"></i><span data-i18n="upgrade">${t('upgrade')}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="kf-card pro-card" data-ocid="settings.preferences_card">
        <div class="section-title"><i class="fa-solid fa-sliders"></i>Preferences</div>
        <div class="settings-row pro-row">
          <div>
            <div class="settings-row-label"><i class="fa-solid fa-moon"></i><span data-i18n="darkMode">${t('darkMode')}</span></div>
          </div>
          <label class="kf-toggle pro-toggle">
            <input type="checkbox" id="settings-dark-toggle" ${state.theme === 'dark' ? 'checked' : ''} data-ocid="settings.dark_mode_toggle" />
            <span class="kf-toggle-slider"></span>
          </label>
        </div>
        <div class="settings-row pro-row">
          <div>
            <div class="settings-row-label"><i class="fa-solid fa-language"></i><span data-i18n="language">${t('language')}</span></div>
          </div>
          <div class="lang-toggle pro-lang-toggle">
            <button class="lang-toggle-btn ${state.lang === 'en' ? 'active' : ''}" data-lang="en" data-ocid="settings.lang_en_button">English</button>
            <button class="lang-toggle-btn ${state.lang === 'ta' ? 'active' : ''}" data-lang="ta" data-ocid="settings.lang_ta_button">தமிழ்</button>
          </div>
        </div>
      </div>

      <div class="kf-card pro-card" data-ocid="settings.security_card">
        <div class="section-title"><i class="fa-solid fa-shield"></i>Security</div>
        <div class="settings-row pro-row">
          <div class="settings-row-label"><i class="fa-solid fa-key"></i><span data-i18n="changePin">${t('changePin')}</span></div>
          <button class="btn-kf-outline pro-btn-outline" style="min-height:36px;font-size:.875rem" id="btn-change-pin" data-ocid="settings.change_pin_button">Change</button>
        </div>
      </div>

    <div class="kf-card pro-card" data-ocid="settings.recycle_bin_card">
      <div class="section-title"><i class="fa-solid fa-trash-can-arrow-up"></i>Recycle Bin</div>
      <div id="settings-recycle-bin-list"></div>
    </div>

      <div class="kf-card pro-card" data-ocid="settings.data_card">
        <div class="section-title"><i class="fa-solid fa-database"></i>Data Management</div>
        <button class="btn-kf-outline pro-btn-outline w-100 mb-3" id="btn-settings-export-pdf" data-ocid="settings.export_pdf_button"><i class="fa-solid fa-file-pdf me-1"></i>Export Data (PDF)</button>
        <button class="btn-kf-outline pro-btn-outline w-100 mb-3" id="btn-load-dummy-data"><i class="fa-solid fa-users me-1"></i>Load 18 Dummy Clients</button>
        <button class="btn-kf-danger pro-btn-danger w-100" id="btn-clear-data" data-ocid="settings.clear_data_button"><i class="fa-solid fa-trash me-1"></i><span data-i18n="clearData">${t('clearData')}</span></button>
      </div>

      <!-- Legal & Contact Options -->
      <div class="kf-card pro-card" data-ocid="settings.legal_card">
        <div class="section-title"><i class="fa-solid fa-circle-info"></i>About & Legal</div>
        
        <div class="settings-option-row" onclick="openTermsModal()">
          <div class="settings-option-icon">📄</div>
          <span class="settings-option-label">Terms & Conditions</span>
          <span class="settings-option-chevron">›</span>
        </div>

        <div class="settings-option-row" onclick="openPrivacyModal()">
          <div class="settings-option-icon">🔒</div>
          <span class="settings-option-label">Privacy Policy</span>
          <span class="settings-option-chevron">›</span>
        </div>

        <div class="settings-option-row" onclick="openContactModal()">
          <div class="settings-option-icon">📞</div>
          <span class="settings-option-label">Contact Us</span>
          <span class="settings-option-chevron">›</span>
        </div>
      </div>

      <div class="mt-4 mb-4 d-flex gap-2">
        <button class="btn-kf-outline flex-grow-1" style="color:var(--color-danger); border-color:var(--color-danger); min-height:48px;" id="btn-delete-account">
          <i class="fa-solid fa-user-xmark me-2"></i>Delete Account
        </button>
        <button class="btn-kf-danger pro-btn-logout flex-grow-1" style="min-height:48px;" id="btn-logout" data-ocid="settings.logout_button">
          <i class="fa-solid fa-power-off me-2"></i><span data-i18n="logout">${t('logout')}</span>
        </button>
      </div>
    </div>`;

  translateDOM();

  renderRecycleBin();

  $('#settings-recycle-bin-list').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const binId = btn.dataset.id;
    if (!action || !binId) return;

    if (action === 'restore') {
      restoreRecycleBinItem(binId);
    } else if (action === 'delete') {
      permanentDeleteRecycleBinItem(binId);
    }
  });

  // Settings event handlers
  $('#btn-save-profile').addEventListener('click', () => {
    const s = Store.settings();
    s.financierName = $('#settings-name').value.trim();
    s.businessName = $('#settings-business').value.trim();
    Store.saveSettings(s);
    showToast('Profile saved!', 'success');
  });


  $('#settings-dark-toggle').addEventListener('change', e => {
    const theme = e.target.checked ? 'dark' : 'light';
    const s = Store.settings();
    s.theme = theme;
    Store.saveSettings(s);
    applyTheme(theme);
  });

  $$('.lang-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      const s = Store.settings();
      s.lang = lang;
      Store.saveSettings(s);
      applyLang(lang);
      $$('.lang-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
      navigateTo('settings');
    });
  });

  $('#btn-upgrade').addEventListener('click', () => bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show());
  $('#banner-upgrade-btn') && $('#banner-upgrade-btn').addEventListener('click', () => bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show());

  $('#btn-load-dummy-data')?.addEventListener('click', () => {
    state.deleteCallback = () => {
      localStorage.removeItem(LS.clients);
      localStorage.removeItem(LS.loans);
      localStorage.removeItem(LS.payments);
      localStorage.removeItem(LS.recycleBin);
      generateSampleData();
      showToast('18 Dummy clients loaded into memory!', 'success');
      navigateTo('dashboard');
    };
    $('#confirm-delete-msg').textContent = 'This will replace your current memory with 18 dummy clients, loans, and collections. Continue?';
    $('#confirm-delete-btn').textContent = 'Load Data';
    const titleEl = $('#confirmDeleteModal .modal-title');
    if (titleEl) titleEl.textContent = 'Confirm Action';
    new bootstrap.Modal($('#confirmDeleteModal')).show();
  });

  $('#btn-settings-export-pdf')?.addEventListener('click', () => exportAllDataAsPDF());
  $('#btn-change-pin').addEventListener('click', () => showChangePinFlow());
  $('#btn-clear-data').addEventListener('click', () => {
    state.deleteCallback = () => {
      requirePinToProceed('Clear Data', () => {
        localStorage.removeItem(LS.clients);
        localStorage.removeItem(LS.loans);
        localStorage.removeItem(LS.payments);
        localStorage.removeItem(LS.recycleBin);
        showToast('All data cleared!', 'info');
        navigateTo('dashboard');
      });
    };
    $('#confirm-delete-msg').textContent = 'Are you sure you want to delete ALL clients, loans and payment data? This cannot be undone.';
    $('#confirm-delete-btn').textContent = 'Clear Data';
    const titleEl = $('#confirmDeleteModal .modal-title');
    if (titleEl) titleEl.textContent = 'Confirm Clear Data';
    new bootstrap.Modal($('#confirmDeleteModal')).show();
  });

  $('#btn-logout').addEventListener('click', () => {
    state.deleteCallback = () => {
      requirePinToProceed('Logout', () => {
        logout();
      });
    };
    $('#confirm-delete-msg').textContent = 'Are you sure you want to logout?';
    $('#confirm-delete-btn').textContent = 'Logout';
    const titleEl = $('#confirmDeleteModal .modal-title');
    if (titleEl) titleEl.textContent = 'Confirm Logout';
    new bootstrap.Modal($('#confirmDeleteModal')).show();
  });

  $('#btn-delete-account')?.addEventListener('click', () => {
    state.deleteCallback = () => {
      requirePinToProceed('Account Deletion', () => {
        localStorage.clear();
        logout();
        showToast('Account and all data deleted.', 'info');
      });
    };
    $('#confirm-delete-msg').textContent = 'Are you sure you want to completely DELETE your account and ALL data? This action cannot be undone.';
    $('#confirm-delete-btn').textContent = 'Delete Account';
    const titleEl = $('#confirmDeleteModal .modal-title');
    if (titleEl) titleEl.textContent = 'Confirm Deletion';
    new bootstrap.Modal($('#confirmDeleteModal')).show();
  });
}

// ── CHANGE PIN FLOW ───────────────────────────────────────────
function showChangePinFlow() {
  const s = Store.settings();
  const currentPin = s.appPin;
  if (!currentPin) { showToast('No PIN set yet', 'error'); return; }
  const oldPin = prompt('Enter current 4-digit PIN:');
  if (!oldPin) return;
  if (oldPin !== currentPin) { showToast('Incorrect current PIN', 'error'); return; }
  const newPin = prompt('Enter new 4-digit PIN:');
  if (!newPin || !/^\d{4}$/.test(newPin)) { showToast('PIN must be exactly 4 digits', 'error'); return; }
  s.appPin = newPin;
  Store.saveSettings(s);
  showToast('🔒 PIN changed successfully!', 'success');
}

// ── PIN AUTHENTICATION HELPER ─────────────────────────────────
function requirePinToProceed(actionMsg, callback) {
  const s = Store.settings();
  if (!s.appPin) {
    callback();
    return;
  }
  const pin = prompt(`Enter your 4-digit PIN to confirm ${actionMsg}:`);
  if (pin === null) return; // User pressed cancel
  if (pin === s.appPin) {
    callback();
  } else {
    showToast('Incorrect PIN. Action cancelled.', 'error');
  }
}

// ── PAYMENT MODAL ─────────────────────────────────────────────
function openPaymentModal(loanId) {
  const loan = Store.loans().find(l => l.id === loanId);
  if (!loan) return;
  const stats = calcLoanStats(loan);
  const client = Store.clients().find(c => c.id === loan.clientId);
  $('#payment-loan-id').value = loanId;
  $('#payment-amount').value = stats.emi;
  $('#payment-date').value = today();
  $('#payment-note').value = '';
  $('#payment-loan-summary').innerHTML = `
    <div class="emi-preview-row"><span>Client</span><strong>${client ? client.name : 'Unknown'}</strong></div>
    <div class="emi-preview-row"><span>EMI</span><strong>${fmtCur(stats.emi)}</strong></div>
    <div class="emi-preview-row"><span>Remaining</span><strong>${fmtCur(stats.remaining)}</strong></div>`;
  new bootstrap.Modal($('#paymentModal')).show();
}

// ── RECEIPT MODAL & PDF ───────────────────────────────────────
function generateReceipt(payment, loan) {
  state.currentReceiptPayment = payment;
  state.currentReceiptLoan = loan;
  const client = Store.clients().find(c => c.id === loan.clientId);

  $('#receipt-modal-body').innerHTML = `
    <div class="text-center mb-4">
      <div style="width:64px;height:64px;background:rgba(16, 185, 129, 0.1);color:#10b981;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:1rem;">
        <i class="fa-solid fa-check"></i>
      </div>
      <h3 style="font-weight:800;font-size:1.75rem;margin-bottom:0.25rem;">${fmtCur(payment.amount)}</h3>
      <p class="text-muted-kf">Payment Successful</p>
    </div>
    <div class="settings-row pro-row" style="padding:8px 0;border-bottom:1px dashed var(--color-border-muted)">
      <span class="text-muted-kf fs-sm">Date</span>
      <strong class="fs-sm">${fmtDate(payment.date)}</strong>
    </div>
    <div class="settings-row pro-row" style="padding:8px 0;border-bottom:1px dashed var(--color-border-muted)">
      <span class="text-muted-kf fs-sm">Client</span>
      <strong class="fs-sm">${client ? client.name : 'Unknown'}</strong>
    </div>
    <div class="settings-row pro-row" style="padding:8px 0;border-bottom:1px dashed var(--color-border-muted)">
      <span class="text-muted-kf fs-sm">Loan ID</span>
      <strong class="fs-sm">${loan.id.toUpperCase()}</strong>
    </div>
    ${payment.note ? `
    <div class="settings-row pro-row" style="padding:8px 0;">
      <span class="text-muted-kf fs-sm">Note</span>
      <strong class="fs-sm">${payment.note}</strong>
    </div>` : ''}
  `;

  new bootstrap.Modal($('#receiptModal')).show();
}

function downloadSingleReceiptPDF(payment, loan) {
  if (typeof window.jspdf === 'undefined') {
      showToast('PDF library not loaded', 'error');
      return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'pt', 'a5');
  const client = Store.clients().find(c => c.id === loan.clientId);
  const settings = Store.settings();
  
  const pdfCur = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  doc.setFontSize(18);
  doc.setTextColor(41, 128, 185);
  doc.text(settings.businessName || 'KaasFlow Finance', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text('Payment Receipt', doc.internal.pageSize.getWidth() / 2, 65, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Receipt ID: ${payment.id.toUpperCase()}`, 20, 100);
  doc.text(`Date: ${fmtDate(payment.date)}`, 20, 115);
  
  doc.setLineWidth(1);
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 125, doc.internal.pageSize.getWidth() - 20, 125);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Received From: ${client ? client.name : 'Unknown'}`, 20, 150);
  doc.text(`Amount Paid: ${pdfCur(payment.amount)}`, 20, 175);
  doc.text(`Loan ID: ${loan.id.toUpperCase()}`, 20, 200);
  if (payment.note) doc.text(`Notes: ${payment.note}`, 20, 225);
  
  doc.line(20, 245, doc.internal.pageSize.getWidth() - 20, 245);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your payment!', doc.internal.pageSize.getWidth() / 2, 275, { align: 'center' });
  
  doc.save(`Receipt_${payment.id}.pdf`);
  showToast('Receipt Downloaded!', 'success');
}

function shareReceiptWhatsApp(payment, loan) {
  const client = Store.clients().find(c => c.id === loan.clientId);
  if (!client) return;
  const settings = Store.settings();
  const businessName = settings.businessName || 'KaasFlow Finance';
  
  const msg = `🧾 *Payment Receipt*\n\n` +
              `*${businessName}*\n` +
              `------------------------\n` +
              `*Date:* ${fmtDate(payment.date)}\n` +
              `*Amount Paid:* ₹${payment.amount.toLocaleString('en-IN')}\n` +
              `*Loan ID:* ${loan.id.toUpperCase()}\n` +
              (payment.note ? `*Note:* ${payment.note}\n` : '') +
              `------------------------\n` +
              `Thank you for your payment!`;
              
  const phone = client.phone.replace(/\D/g, '');
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ── REMINDERS & WHATSAPP ──────────────────────────────────────
function sendReminder(loanId) {
  const loan = Store.loans().find(l => l.id === loanId);
  if (!loan) return;
  const stats = calcLoanStats(loan);
  const client = Store.clients().find(c => c.id === loan.clientId);
  if (!client) return;
  const msg = stats.isOverdue
    ? t('reminderMsgOverdue', client.name, fmtCur(stats.emi), stats.daysOverdue)
    : t('reminderMsg', client.name, fmtCur(stats.emi));
  const phone = client.phone.replace(/\D/g, '');
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// [NEW] PDF Download Requirements: Improved Client Details PDF
function downloadClientDetailsPDF(clientId) {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF core library (jsPDF) not loaded', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const client = Store.clients().find(c => c.id === clientId);
    if (!client) { showToast('Client not found', 'error'); return; }
    
    const clientLoans = Store.loans().filter(l => l.clientId === clientId);
    const settings = Store.settings();

    const pdfCur = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text(settings.businessName || 'KaasFlow Finance', 14, 22);
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text(`Client Profile`, 14, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Date: ${fmtDate(today())}`, 196, 22, { align: 'right' });

    // Client Summary using AutoTable
    doc.autoTable({
        startY: 40,
        head: [['Client Details', '']],
        body: [
            ['Name', client.name],
            ['Phone', client.phone],
            ['Address', client.address || '-'],
            ['ID Number', client.idNum || '-'],
            ['Occupation', client.occupation || '-'],
            ['Registered On', fmtDate(client.createdAt)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60, fillColor: [245, 245, 245] }
        },
        styles: { fontSize: 10, cellPadding: 3 },
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : doc.autoTable.previous.finalY;

    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text(`Loans (${clientLoans.length})`, 14, finalY + 15);

    if (clientLoans.length > 0) {
        doc.autoTable({
            startY: finalY + 20,
            head: [['Principal', 'EMI', 'Duration', 'Paid', 'Balance', 'Status']],
            body: clientLoans.map(l => {
                const stats = calcLoanStats(l);
                return [
                    pdfCur(l.principal), 
                    pdfCur(stats.emi), 
                    l.duration ? `${l.duration}m` : '-', 
                    pdfCur(stats.totalPaid), 
                    pdfCur(stats.remaining), 
                    stats.isOverdue ? 'OVERDUE' : l.status.toUpperCase()
                ];
            }),
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] },
            styles: { fontSize: 9 }
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('No loans recorded for this client.', 14, finalY + 25);
    }

    doc.save(`Client-Profile-${client.name.replace(/\s/g, '_')}.pdf`);
    showToast('Profile Downloaded!', 'success');
}

// [NEW] PDF Download Requirements: Improved Loan Details PDF
function downloadLoanDetailsPDF(loanId) {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF core library (jsPDF) not loaded', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const loan = Store.loans().find(l => l.id === loanId);
    if (!loan) { showToast('Loan not found', 'error'); return; }
    const client = Store.clients().find(c => c.id === loan.clientId);
    const payments = Store.payments().filter(p => p.loanId === loanId).sort((a, b) => new Date(b.date) - new Date(a.date));
    const stats = calcLoanStats(loan);
    const settings = Store.settings();

    const pdfCur = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    // Business Name & Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Nice blue
    doc.text(settings.businessName || 'KaasFlow Finance', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('Loan Statement & Payment History', 14, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${fmtDate(today())}`, 196, 22, { align: 'right' });
    doc.text(`Loan ID: ${loan.id.toUpperCase()}`, 196, 28, { align: 'right' });

    // Client Info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Client Name: ${client ? client.name : 'Unknown'}`, 14, 45);
    doc.text(`Phone: ${client ? client.phone : 'N/A'}`, 14, 51);

    // Loan Summary using AutoTable for perfect alignment
    doc.autoTable({
        startY: 60,
        head: [['Loan Summary', '']],
        body: [
            ['Principal Amount', pdfCur(loan.principal)],
            ['Interest Rate', `${loan.interestRate || 0}% (${loan.type})`],
            ['Duration', loan.duration ? `${loan.duration} installments` : 'Open / No fixed duration'],
            ['EMI Amount', pdfCur(stats.emi)],
            ['Total Payable', pdfCur(stats.totalPayable)],
            ['Total Paid', pdfCur(stats.totalPaid)],
            ['Balance Remaining', pdfCur(stats.remaining)],
            ['Loan Status', stats.isOverdue ? `OVERDUE (${stats.daysOverdue} days)` : loan.status.toUpperCase()],
            ['Start Date', fmtDate(loan.startDate)],
            ['Next Due Date', stats.nextDueDate ? fmtDate(stats.nextDueDate) : 'N/A']
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80, fillColor: [245, 245, 245] },
            1: { cellWidth: 'auto' }
        },
        styles: { fontSize: 10, cellPadding: 3 }
    });

    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : doc.autoTable.previous.finalY;

    // Payment History Table
    doc.setFontSize(14);
    doc.setTextColor(41, 128, 185);
    doc.text('Payment History', 14, finalY + 15);

    if (payments.length === 0) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('No payments recorded yet.', 14, finalY + 25);
    } else {
        const head = [['Date', 'Amount Paid', 'Payment Mode', 'Status', 'Notes']];
        const body = payments.map(p => [
            fmtDate(p.date),
            pdfCur(p.amount),
            p.mode ? p.mode.charAt(0).toUpperCase() + p.mode.slice(1) : '-',
            p.status ? p.status.toUpperCase() : 'PAID',
            p.note || '-'
        ]);

        doc.autoTable({
            startY: finalY + 20,
            head: head,
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [240, 248, 255] }
        });
    }

    doc.save(`Loan_Statement_${client ? client.name.replace(/\s/g, '_') : 'Client'}_${loan.id.slice(-4)}.pdf`);
    showToast('Loan Statement Downloaded!', 'success');
}

// [NEW] PDF / Word Download Requirements: Collection Details PDF
function downloadCollectionDetailsPDF(loanId) {
    downloadLoanDetailsPDF(loanId);
}

// ── EXPORT / IMPORT ───────────────────────────────────────────
function exportAllDataAsPDF() {
    if (typeof window.jspdf === 'undefined') {
        showToast('PDF library not loaded', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt');
    const clients = Store.clients();
    const loans = Store.loans();
    const payments = Store.payments();
    const settings = Store.settings();

    const pdfCur = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    // Title Page / Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text(settings.businessName || 'KaasFlow Data Export', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${fmtDate(today())}`, doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });

    // Clients Table
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text('Clients', 40, 120);
    let head = [['Name', 'Phone', 'Address', 'Occupation']];
    let body = clients.map(c => [c.name, c.phone, c.address || '-', c.occupation || '-']);
    doc.autoTable({ startY: 130, head, body, theme: 'grid', headStyles: { fillColor: [41, 128, 185] } });

    // Loans Table
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Loans', 40, 40);
    head = [['Client', 'Principal', 'EMI', 'Paid', 'Remaining', 'Status']];
    body = loans.map(l => {
        const c = clients.find(cl => cl.id === l.clientId);
        const stats = calcLoanStats(l);
        return [c ? c.name : 'Unknown', pdfCur(l.principal), pdfCur(stats.emi), pdfCur(stats.totalPaid), pdfCur(stats.remaining), stats.isOverdue ? 'OVERDUE' : l.status.toUpperCase()];
    });
    doc.autoTable({ startY: 50, head, body, theme: 'grid', headStyles: { fillColor: [41, 128, 185] } });

    // Payments Table
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Payments', 40, 40);
    head = [['Date', 'Client', 'Amount', 'Mode', 'Note']];
    body = payments.sort((a,b) => b.date.localeCompare(a.date)).map(p => {
        const l = loans.find(ln => ln.id === p.loanId);
        const c = l ? clients.find(cl => cl.id === l.clientId) : null;
        return [fmtDate(p.date), c ? c.name : 'Unknown', pdfCur(p.amount), p.mode ? p.mode.charAt(0).toUpperCase() + p.mode.slice(1) : '-', p.note || '-'];
    });
    doc.autoTable({ startY: 50, head, body, theme: 'grid', headStyles: { fillColor: [41, 128, 185] } });

    doc.save(`KaasFlow-Export-${today()}.pdf`);
    showToast('PDF Report Generated!', 'success');
}

function exportCSV() {
  const clients = Store.clients();
  if (!clients.length) { showToast('No data to export', 'info'); return; }
  const headers = ['Name', 'Phone', 'Address', 'Occupation'];
  const rows = clients.map(c => [c.name, c.phone, c.address || '', c.occupation || '']);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `KaasFlow-Clients-${today()}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('CSV exported!', 'success');
}

function exportJSON() {
  const data = {
    clients: Store.clients(), loans: Store.loans(), payments: Store.payments(),
    settings: Store.settings(), exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `KaasFlow-Backup-${today()}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Backup exported!', 'success');
}

// [NEW] Import / Export Data: Import data from JSON (already implemented, ensuring clean UI)
function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.clients) {
        let imported = data.clients;
        const s = Store.settings();
        const limit = FREE_CLIENT_LIMIT + (s.extraClients || 0);
        if (getPlan() === 'free' && imported.length > limit) {
          imported = imported.slice(0, limit);
          showToast(`Free plan limit: Only first ${limit} clients imported.`, 'info');
        }
        Store.saveClients(imported);
      }
      if (data.loans) Store.saveLoans(data.loans);
      if (data.payments) Store.savePayments(data.payments);
      showToast('Data imported successfully!', 'success');
      navigateTo('dashboard');
      // [FIX] Language change: Re-apply language after import to ensure new data is translated if needed (if any text content is directly rendered from data)
      applyLang(Store.settings().lang || 'en');
    } catch { showToast('Invalid backup file', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ── RECYCLE BIN ───────────────────────────────────────────────
function renderRecycleBin() {
  const listEl = $('#settings-recycle-bin-list');
  if (!listEl) return;
  const bin = Store.recycleBin();
  if (bin.length === 0) {
    listEl.innerHTML = '<p class="text-muted-kf fs-sm mb-0">Recycle bin is empty.</p>';
    return;
  }

  let html = '';
  const clients = bin.filter(x => x.type === 'client');
  const loans = bin.filter(x => x.type === 'loan');
  const payments = bin.filter(x => x.type === 'payment');

  const renderGroup = (title, items) => {
    if (items.length === 0) return '';
    let groupHtml = `<div style="font-weight:600; margin-bottom:8px; margin-top:12px; color:var(--color-primary);">${title}</div>`;
    items.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)).forEach(entry => {
      let itemTitle = '';
      let subtitle = `Deleted: ${fmtDate(entry.deletedAt)}`;
      if (entry.type === 'client') {
        itemTitle = entry.item.name;
        subtitle += ` · Loans: ${entry.relatedLoans ? entry.relatedLoans.length : 0}`;
      } else if (entry.type === 'loan') {
        itemTitle = `${fmtCur(entry.item.principal)} Loan`;
        subtitle += ` · Payments: ${entry.relatedPayments ? entry.relatedPayments.length : 0}`;
      } else if (entry.type === 'payment') {
        itemTitle = `${fmtCur(entry.item.amount)} Payment`;
      }

      groupHtml += `
      <div class="settings-row pro-row" style="align-items:center; padding: 8px 0; border-bottom: 1px solid var(--color-border-muted);">
        <div style="flex:1; min-width:0;">
          <div class="settings-row-label" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${itemTitle}</div>
          <div class="settings-row-sub text-muted-kf" style="font-size:0.75rem">${subtitle}</div>
        </div>
        <div style="display:flex; gap:8px; flex-shrink:0;">
          <button type="button" class="btn-kf-outline pro-btn-outline" style="min-height:30px;font-size:0.75rem;padding:0.25rem 0.5rem;" data-action="restore" data-id="${entry.binId}">Restore</button>
          <button type="button" class="btn-kf-danger pro-btn-danger" style="min-height:30px;font-size:0.75rem;padding:0.25rem 0.5rem;" data-action="delete" data-id="${entry.binId}">Delete</button>
        </div>
      </div>`;
    });
    return groupHtml;
  };

  html += renderGroup('Clients', clients);
  html += renderGroup('Loans', loans);
  html += renderGroup('Payments', payments);

  listEl.innerHTML = html;
}

function restoreRecycleBinItem(binId) {
  const bin = Store.recycleBin();
  const idx = bin.findIndex(x => x.binId === binId);
  if (idx === -1) return;
  const entry = bin[idx];

  if (entry.type === 'client') {
    const clients = Store.clients();
    if (!canAddClient() && !clients.some(c => c.id === entry.item.id)) {
      showToast('Client limit reached. Cannot restore.', 'error');
      return;
    }
    if (!clients.some(c => c.id === entry.item.id)) { clients.push(entry.item); Store.saveClients(clients); }
    if (entry.relatedLoans) { const loans = Store.loans(); entry.relatedLoans.forEach(l => { if (!loans.some(xl => xl.id === l.id)) loans.push(l); }); Store.saveLoans(loans); }
    if (entry.relatedPayments) { const payments = Store.payments(); entry.relatedPayments.forEach(p => { if (!payments.some(xp => xp.id === p.id)) payments.push(p); }); Store.savePayments(payments); }
  } else if (entry.type === 'loan') {
    const loans = Store.loans();
    if (!loans.some(l => l.id === entry.item.id)) { loans.push(entry.item); Store.saveLoans(loans); }
    if (entry.relatedPayments) { const payments = Store.payments(); entry.relatedPayments.forEach(p => { if (!payments.some(xp => xp.id === p.id)) payments.push(p); }); Store.savePayments(payments); }
  } else if (entry.type === 'payment') {
    const payments = Store.payments();
    if (!payments.some(p => p.id === entry.item.id)) { payments.push(entry.item); Store.savePayments(payments); }
  }

  bin.splice(idx, 1);
  Store.saveRecycleBin(bin);
  showToast('Item restored successfully!', 'success');
  renderRecycleBin();
}

function permanentDeleteRecycleBinItem(binId) {
  if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) return;
  const bin = Store.recycleBin();
  const idx = bin.findIndex(x => x.binId === binId);
  if (idx !== -1) {
    bin.splice(idx, 1);
    Store.saveRecycleBin(bin);
    showToast('Item permanently deleted.', 'info');
    renderRecycleBin();
  }
}

// ── DELETE CONFIRM ─────────────────────────────────────────────
function confirmDelete(type, id) {
  const msgs = {
    client: 'Delete this client and all their loans and payments?',
    loan: 'Delete this loan and all its payment records?',
    payment: 'Delete this payment record?',
  };
  $('#confirm-delete-msg').textContent = msgs[type] || 'Are you sure?';
  state.deleteCallback = () => {
    const recycleBin = Store.recycleBin();
    const deletedAt = new Date().toISOString();

    if (type === 'client') {
      const client = Store.clients().find(c => c.id === id);
      const clientLoans = Store.loans().filter(l => l.clientId === id);
      const loanIds = clientLoans.map(l => l.id);
      const clientPayments = Store.payments().filter(p => loanIds.includes(p.loanId));

      if (client) {
        recycleBin.push({
          binId: uid(), type: 'client', item: client, relatedLoans: clientLoans, relatedPayments: clientPayments, deletedAt
        });
        Store.saveRecycleBin(recycleBin);
      }

      Store.saveClients(Store.clients().filter(c => c.id !== id));
      Store.saveLoans(Store.loans().filter(l => l.clientId !== id));
      Store.savePayments(Store.payments().filter(p => !loanIds.includes(p.loanId)));
      showToast('Client moved to Recycle Bin', 'info');
      if (state.page === 'clients') navigateTo('clients');
    } else if (type === 'loan') {
      const loan = Store.loans().find(l => l.id === id);
      const loanPayments = Store.payments().filter(p => p.loanId === id);

      if (loan) {
        recycleBin.push({
          binId: uid(), type: 'loan', item: loan, relatedPayments: loanPayments, deletedAt
        });
        Store.saveRecycleBin(recycleBin);
      }

      Store.saveLoans(Store.loans().filter(l => l.id !== id));
      Store.savePayments(Store.payments().filter(p => p.loanId !== id));
      showToast('Loan moved to Recycle Bin', 'info');
      if (state.page === 'loans') navigateTo('loans');
    } else if (type === 'payment') {
      const payment = Store.payments().find(p => p.id === id);
      if (payment) {
        recycleBin.push({
          binId: uid(), type: 'payment', item: payment, deletedAt
        });
        Store.saveRecycleBin(recycleBin);
      }
      Store.savePayments(Store.payments().filter(p => p.id !== id));
      showToast('Payment moved to Recycle Bin', 'info');
      if (state.page === 'reports') navigateTo('reports'); // Fallback routing if a view handles standalone payment deletion
    }
  };
  new bootstrap.Modal($('#confirmDeleteModal')).show();
}

// ── NOTIFICATIONS ───────────────────────────────────────────

// Holds the SW registration so we can call showNotification() with actions
let _swReg = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(r => { _swReg = r; });
}

/**
 * Request notification permission and schedule daily alert.
 * Called once during init().
 */
function scheduleNotifications() {
  if (!('Notification' in window)) return;

  const askAndSchedule = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    setTimeout(() => {
      localStorage.removeItem('kf_notif_sent_date');
      fireTodayNotifications();
      setInterval(() => {
        localStorage.removeItem('kf_notif_sent_date');
        fireTodayNotifications();
      }, 86400000);
    }, midnight - now);
  };

  if (Notification.permission === 'granted') {
    askAndSchedule();
  } else if (Notification.permission === 'default') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') askAndSchedule();
    }).catch(() => {});
  }
}

/**
 * Fire one native notification per client whose EMI is due today.
 * Uses Service Worker showNotification() so action buttons (Paid / Pending)
 * appear directly in the device notification bar.
 * Deduplication: only fires once per calendar day.
 */
function fireTodayNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const todayStr = today();
  const lastSent = localStorage.getItem('kf_notif_sent_date');
  if (lastSent === todayStr) return;

  const loans   = Store.loans().filter(l => l.status === 'active');
  const clients  = Store.clients();

  const items = loans
    .map(l => ({ loan: l, stats: calcLoanStats(l), client: clients.find(c => c.id === l.clientId) }))
    .filter(({ stats }) => stats.nextDueDate && stats.nextDueDate <= todayStr && stats.remaining > 0);

  if (items.length === 0) return;

  localStorage.setItem('kf_notif_sent_date', todayStr);

  items.forEach(({ loan, stats, client }, idx) => {
    setTimeout(() => {
      const name        = client ? client.name : 'Unknown Client';
      const amount      = fmtCur(stats.emi);
      const dueDate     = fmtDate(stats.nextDueDate);
      const isOverdue   = stats.isOverdue;

      const title = isOverdue
        ? `⚠️ Overdue — ${name}`
        : `💵 EMI Due Today — ${name}`;

      const bodyLines = [
        `Amount: ${amount}`,
        `Due Date: ${dueDate}`,
        isOverdue ? `Overdue by ${stats.daysOverdue} day(s)` : 'Pay before end of day',
      ];

      const notifOptions = {
        body:    bodyLines.join('\n'),
        icon:    'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23d4a017%22/><text y=%2272%22 x=%2250%22 text-anchor=%22middle%22 font-size=%2265%22>%E2%82%B9</text></svg>',
        badge:   'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23d4a017%22/><text y=%2272%22 x=%2250%22 text-anchor=%22middle%22 font-size=%2265%22>%E2%82%B9</text></svg>',
        tag:     `kf-due-${loan.id}-${todayStr}`,
        requireInteraction: true,  // stays on screen until user acts
        actions: [
          { action: 'paid',    title: '✅ Paid' },
          { action: 'pending', title: '⏳ Pending' },
        ],
        data: {
          loanId: loan.id,
          emi:    stats.emi,
          amount: stats.emi,
        },
        vibrate: [200, 100, 200],  // buzz pattern on Android
      };

      // Prefer SW showNotification (supports action buttons)
      // Fall back to basic Notification if SW not ready
      if (_swReg) {
        _swReg.showNotification(title, notifOptions).catch(() => {
          new Notification(title, { body: notifOptions.body, icon: notifOptions.icon });
        });
      } else {
        try { new Notification(title, { body: notifOptions.body, icon: notifOptions.icon }); }
        catch (e) {}
      }
    }, idx * 900);
  });
}

// Legacy alias
function sendDailyNotification() { fireTodayNotifications(); }

function updateNotifBadge() {
  const loans = Store.loans().filter(l => l.status === 'active');
  const clients = Store.clients();
  const todayStr = today();
  let count = 0;
  loans.forEach(l => {
    const stats = calcLoanStats(l);
    if (stats.isOverdue) count++;
    else if (stats.nextDueDate === todayStr && stats.remaining > 0) count++;
  });
  const badge = $('#notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('d-none');
  } else {
    badge.classList.add('d-none');
  }
}

function renderNotifDropdown() {
  const loans = Store.loans().filter(l => l.status === 'active');
  const clients = Store.clients();
  const todayStr = today();

  const allItems = loans.map(l => ({
    loan: l,
    stats: calcLoanStats(l),
    client: clients.find(c => c.id === l.clientId)
  }));

  const overdue  = allItems.filter(({ stats }) => stats.isOverdue);
  const dueToday = allItems.filter(({ stats }) => !stats.isOverdue && stats.nextDueDate === todayStr && stats.remaining > 0);

  const listEl  = $('#notif-list');
  const emptyEl = $('#notif-empty');

  if (overdue.length === 0 && dueToday.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = '';
    return;
  }
  emptyEl.style.display = 'none';

  let html = '';

  // ── Overdue section
  if (overdue.length > 0) {
    html += `<div class="notif-section-header notif-overdue-hdr"><i class="fa-solid fa-circle-exclamation me-1"></i>Overdue (${overdue.length})</div>`;
    html += overdue.map(({ loan, stats, client }) => `
      <div class="notif-item notif-item-overdue" data-loan-id="${loan.id}">
        <div class="notif-item-avatar notif-avatar-danger">
          ${client ? client.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div class="notif-item-body">
          <div class="notif-item-name">${client ? client.name : 'Unknown'}</div>
          <div class="notif-item-meta"><i class="fa-solid fa-clock me-1"></i>${stats.daysOverdue} day(s) overdue · EMI ${fmtCur(stats.emi)}</div>
        </div>
        <button class="notif-action-btn notif-btn-collect" data-action="collect" data-loan-id="${loan.id}">
          <i class="fa-solid fa-hand-holding-dollar"></i>
        </button>
      </div>`);
    html += overdue.map(({ loan, stats, client }) => '').join('');
  }

  // ── Due Today section
  if (dueToday.length > 0) {
    html += `<div class="notif-section-header notif-due-hdr"><i class="fa-solid fa-calendar-day me-1"></i>Due Today (${dueToday.length})</div>`;
    html += dueToday.map(({ loan, stats, client }) => `
      <div class="notif-item notif-item-due" data-loan-id="${loan.id}">
        <div class="notif-item-avatar notif-avatar-warning">
          ${client ? client.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div class="notif-item-body">
          <div class="notif-item-name">${client ? client.name : 'Unknown'}</div>
          <div class="notif-item-meta"><i class="fa-solid fa-rupee-sign me-1"></i>EMI ${fmtCur(stats.emi)} · ${t(loan.type)}</div>
        </div>
        <button class="notif-action-btn notif-btn-collect" data-action="collect" data-loan-id="${loan.id}">
          <i class="fa-solid fa-check"></i>
        </button>
      </div>`);
  }

  listEl.innerHTML = html;

  // Collect button action inside dropdown
  listEl.querySelectorAll('[data-action="collect"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const loanId = btn.dataset.loanId;
      $('#notif-dropdown').classList.add('d-none');
      openPaymentModal(loanId);
    });
  });
}

// ── GLOBAL EVENT BINDINGS ──────────────────────────────────────
function bindGlobal() {
  // Auth form handlers
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value.trim();
    const errEl = $('#login-error');
    errEl.classList.add('d-none');
    if (!email || !email.includes('@')) {
      errEl.textContent = 'Enter a valid email address'; errEl.classList.remove('d-none'); return;
    }
    if (!password) { errEl.textContent = 'Enter your password'; errEl.classList.remove('d-none'); return; }
    const res = await apiAuth('login', { email, password });
    if (res.success) {
      Store.saveSession({ token: res.token || ('session-' + Date.now()), user: res.user });
      state.session = getSession();
      if (window.KFSync) await KFSync.restore();
      if (hasPin()) { showPinLock(); } else { showPinSetup(); }
    } else if (res.offline) {
      // Offline mode: check localStorage for existing session
      showToast('Running in offline mode. Login data not verified.', 'info');
      Store.saveSession({ token: 'offline', user: { email, financierName: 'Financier', businessName: 'My Finance', role: 'admin' } });
      state.session = getSession();
      if (window.KFSync) await KFSync.restore();
      if (hasPin()) { showPinLock(); } else { showPinSetup(); }
    } else {
      errEl.textContent = res.error || res.message || 'Login failed'; errEl.classList.remove('d-none');
    }
  });

  $('#register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#reg-name').value.trim();
    const email = $('#reg-email').value.trim();
    const password = $('#reg-password').value.trim();
    const business = $('#reg-business').value.trim();
    const errEl = $('#register-error');
    errEl.classList.add('d-none');
    if (!name) { errEl.textContent = 'Enter your name'; errEl.classList.remove('d-none'); return; }
    if (!email || !email.includes('@')) { errEl.textContent = 'Enter valid email'; errEl.classList.remove('d-none'); return; }
    if (!password || password.length < 6) { errEl.textContent = 'Password must be at least 6 characters'; errEl.classList.remove('d-none'); return; }
    const res = await apiAuth('register', { email, password, financier_name: name, business_name: business });
    if (res.success) {
      Store.saveSession({ token: 'session-' + Date.now(), user: res.user });
      state.session = getSession();
      generateSampleData();
      showPinSetup(); // New users always set PIN
    } else if (res.offline) {
      Store.saveSession({ token: 'offline', user: { email, financierName: name, businessName: business, role: 'admin' } });
      state.session = getSession();
      generateSampleData();
      showPinSetup(); // New users always set PIN
    } else {
      errEl.textContent = res.error || res.message || 'Registration failed'; errEl.classList.remove('d-none');
    }
  });

  $('#show-register').addEventListener('click', () => {
    $('#login-form-wrapper').style.display = 'none';
    $('#register-form-wrapper').style.display = '';
    $('#pin-setup-wrapper').style.display = 'none';
  });
  $('#show-login').addEventListener('click', () => {
    $('#register-form-wrapper').style.display = 'none';
    $('#login-form-wrapper').style.display = '';
    $('#pin-setup-wrapper').style.display = 'none';
  });

  // Forgot Password / Magic Link
  $('#show-forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    $('#login-form-wrapper').style.display = 'none';
    $('#register-form-wrapper').style.display = 'none';
    $('#forgot-password-wrapper').style.display = '';
    $('#pin-setup-wrapper').style.display = 'none';
  });

  $('#show-login-from-forgot')?.addEventListener('click', () => {
    $('#forgot-password-wrapper').style.display = 'none';
    $('#login-form-wrapper').style.display = '';
  });

  $('#forgot-password-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#forgot-email').value.trim();
    const errEl = $('#forgot-error');
    const succEl = $('#forgot-success');
    errEl.classList.add('d-none');
    succEl.classList.add('d-none');

    if (!email || !email.includes('@')) {
      errEl.textContent = 'Enter a valid email address';
      errEl.classList.remove('d-none');
      return;
    }

    const btn = $('#forgot-submit-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Sending...';
    btn.disabled = true;

    const res = await apiAuth('magic-link/request', { email });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (res.success) {
      succEl.textContent = 'A secure login link has been sent to your email!';
      succEl.classList.remove('d-none');
      $('#forgot-email').value = '';
    } else if (res.offline) {
      succEl.textContent = 'Running in offline mode. Magic links require internet.';
      succEl.classList.remove('d-none');
    } else {
      errEl.textContent = res.error || res.message || 'Failed to send reset link.';
      errEl.classList.remove('d-none');
    }
  });

  // ── PIN INPUT BEHAVIOR ──────────────────────────────────────
  setupPinInputBehavior('#pin-setup-inputs');
  setupPinInputBehavior('#pin-lock-inputs');

  // Confirm PIN (setup)
  $('#btn-confirm-pin')?.addEventListener('click', () => {
    const inputs = $$('#pin-setup-inputs .pin-digit-input');
    const pin = inputs.map(i => i.value).join('');
    const errEl = $('#pin-setup-error');
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      errEl.textContent = 'Enter a valid 4-digit PIN';
      errEl.classList.remove('d-none');
      inputs.forEach(i => i.classList.add('shake'));
      setTimeout(() => inputs.forEach(i => i.classList.remove('shake')), 500);
      return;
    }
    // Save PIN
    const s = Store.settings();
    s.appPin = pin;
    Store.saveSettings(s);
    // Show success animation
    inputs.forEach(i => i.classList.add('success'));
    showToast('🔒 Security PIN set successfully!', 'success');
    setTimeout(() => showApp(), 600);
  });

  // Unlock PIN (lock screen)
  $('#btn-unlock-pin')?.addEventListener('click', () => {
    const inputs = $$('#pin-lock-inputs .pin-digit-input');
    const pin = inputs.map(i => i.value).join('');
    const errEl = $('#pin-lock-error');
    const savedPin = getPin();
    if (pin.length !== 4) {
      errEl.textContent = 'Enter your 4-digit PIN';
      errEl.classList.remove('d-none');
      return;
    }
    if (pin !== savedPin) {
      errEl.textContent = 'Incorrect PIN. Try again.';
      errEl.classList.remove('d-none');
      inputs.forEach(i => { i.classList.add('shake'); i.value = ''; });
      setTimeout(() => { inputs.forEach(i => i.classList.remove('shake')); inputs[0]?.focus(); }, 500);
      return;
    }
    // PIN correct!
    errEl.classList.add('d-none');
    inputs.forEach(i => i.classList.add('success'));
    setTimeout(() => showApp(), 400);
  });

  // Switch Account (from lock screen)
  $('#btn-switch-account')?.addEventListener('click', () => {
    localStorage.removeItem(LS.session);
    const s = Store.settings();
    delete s.appPin;
    Store.saveSettings(s);
    state.session = null;
    showAuth();
  });

  // Password visibility toggle
  $$('.btn-toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      target.type = target.type === 'password' ? 'text' : 'password';
      btn.querySelector('i').className = target.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
  });

  // Bottom nav
  $$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(tab.dataset.page);
    });
  });

  // Theme toggle
  $('#theme-toggle').addEventListener('click', () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    const s = Store.settings();
    s.theme = newTheme;
    Store.saveSettings(s);
    applyTheme(newTheme);
    destroyCharts();
    navigateTo(state.page);
  });

  // Notification bell
  $('#notif-bell').addEventListener('click', e => {
    e.stopPropagation();
    const dd = $('#notif-dropdown');
    dd.classList.toggle('d-none');
    if (!dd.classList.contains('d-none')) renderNotifDropdown();
  });

  $('#clear-notifs').addEventListener('click', () => {
    $('#notif-dropdown').classList.add('d-none');
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#notif-bell') && !e.target.closest('#notif-dropdown')) {
      $('#notif-dropdown')?.classList.add('d-none');
    }
  });

  // User menu
  $('#user-avatar-btn').addEventListener('click', () => navigateTo('settings'));

  // Save client button
  $('#save-client-btn').addEventListener('click', () => {
    const name = $('#client-name').value.trim();
    const phone = $('#client-phone').value.trim();
    if (!name) { $('#client-name').classList.add('is-invalid'); return; }
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      $('#client-phone').classList.add('is-invalid'); return;
    }
    $('#client-name').classList.remove('is-invalid');
    $('#client-phone').classList.remove('is-invalid');

    const editId = $('#client-edit-id').value;
    const clients = Store.clients();
    if (editId) {
      const idx = clients.findIndex(c => c.id === editId);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], name, phone, address: $('#client-address').value.trim(), idNum: $('#client-id-num').value.trim(), occupation: $('#client-occupation').value.trim() };
      }
    } else {
      if (!canAddClient()) {
        const modal = bootstrap.Modal.getInstance($('#clientModal'));
        if (modal) modal.hide();
        bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show();
        return;
      }
      clients.push({ id: uid(), name, phone, address: $('#client-address').value.trim(), idNum: $('#client-id-num').value.trim(), occupation: $('#client-occupation').value.trim(), createdAt: today() });
    }
    Store.saveClients(clients);
    bootstrap.Modal.getInstance($('#clientModal'))?.hide();
    showToast(editId ? 'Client updated!' : 'Client added!', 'success');
    if (state.page === 'clients') navigateTo('clients');
  });

  // Client form field validation
  ['client-name', 'client-phone'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('input', () => el.classList.remove('is-invalid'));
  });

  // Save loan button
  $('#save-loan-btn').addEventListener('click', () => {
    const clientId = $('#loan-client-select').value;
    const interestType = $('#loan-interest-type').value || 'percentage';
    const principal = parseFloat($('#loan-principal').value);
    const durationVal = $('#loan-duration').value;
    const duration = durationVal ? parseInt(durationVal) : 0;
    const interestRate = parseFloat($('#loan-interest').value) || 0;
    const type = $('#loan-type').value;
    const startDate = $('#loan-start-date').value || today();
    
    if (!clientId || !principal || principal < 1) {
      showToast('Fill in required loan fields (Client & valid Principal)', 'error'); return;
    }
    if (interestRate < 0) {
      showToast('Interest cannot be negative', 'error'); return;
    }

    const editId = $('#loan-edit-id').value;
    const loans = Store.loans();
    if (editId) {
      const idx = loans.findIndex(l => l.id === editId);
      if (idx !== -1) loans[idx] = { ...loans[idx], clientId, interestType, principal, interestRate, duration, type, startDate };
    } else {
      if (!canUsePremiumFeatures()) {
        const modal = bootstrap.Modal.getInstance($('#loanModal'));
        if (modal) modal.hide();
        bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show();
        return;
      }
      loans.push({ id: uid(), clientId, interestType, principal, interestRate, duration, type, startDate, status: 'active', createdAt: today() });
    }
    Store.saveLoans(loans);
    bootstrap.Modal.getInstance($('#loanModal'))?.hide();
    showToast(editId ? 'Loan updated!' : 'Loan added!', 'success');
    if (state.page === 'loans') navigateTo('loans');
    else if (state.page === 'clients') navigateTo('clients');
  });

  // EMI Preview live calculation
  ['loan-principal', 'loan-interest', 'loan-duration', 'loan-type', 'loan-interest-type'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        if (e.target.type === 'number' && e.target.value < 0) {
          e.target.value = Math.abs(e.target.value);
        }
        updateEMIPreview();
      });
      el.addEventListener('change', updateEMIPreview);
    }
  });

  $('#loan-interest-type')?.addEventListener('change', (e) => {
    const label = $('#label-loan-interest');
    if (label) {
      label.innerHTML = e.target.value === 'fixed' ? 'Fixed Interest Value <span class="text-danger">*</span>' : 'Interest Percentage <span class="text-danger">*</span>';
    }
    updateEMIPreview();
  });

  // Add loan from client profile
  $('#add-loan-from-profile').addEventListener('click', () => {
    if (!canUsePremiumFeatures()) {
      bootstrap.Modal.getInstance($('#clientProfileModal'))?.hide();
      bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show();
      return;
    }
    bootstrap.Modal.getInstance($('#clientProfileModal'))?.hide();
    setTimeout(() => openLoanModal(state.profileClientId), 300);
  });

  // Save payment button
  $('#save-payment-btn').addEventListener('click', () => {
    const loanId = $('#payment-loan-id').value;
    const amount = parseFloat($('#payment-amount').value);
    const date = $('#payment-date').value || today();
    const note = $('#payment-note').value.trim();
    if (!loanId || !amount || amount < 1) { showToast('Enter a valid payment amount', 'error'); return; }
    const payment = { id: uid(), loanId, amount, date, note, createdAt: new Date().toISOString() };
    const payments = Store.payments();
    payments.push(payment);
    Store.savePayments(payments);
    const loan = Store.loans().find(l => l.id === loanId);
    if (loan) {
      const stats = calcLoanStats(loan);
      if (stats.remaining <= 0 || stats.progress >= 100) {
        const loans = Store.loans();
        const idx = loans.findIndex(l => l.id === loanId);
        if (idx !== -1) { loans[idx].status = 'completed'; Store.saveLoans(loans); }
      }
      generateReceipt(payment, loan);
    }
    bootstrap.Modal.getInstance($('#paymentModal'))?.hide();
    showToast(`Payment of ${fmtCur(amount)} recorded!`, 'success');
    updateNotifBadge();
    if (state.page !== 'settings') navigateTo(state.page);
  });

  // Confirm delete button
  $('#confirm-delete-btn').addEventListener('click', () => {
    if (typeof state.deleteCallback === 'function') state.deleteCallback();
    state.deleteCallback = null;
    bootstrap.Modal.getInstance($('#confirmDeleteModal'))?.hide();
  });

  // Receipt Modal actions
  $('#btn-download-receipt')?.addEventListener('click', () => {
    if (!state.currentReceiptPayment || !state.currentReceiptLoan) return;
    downloadSingleReceiptPDF(state.currentReceiptPayment, state.currentReceiptLoan);
  });

  $('#btn-whatsapp-receipt')?.addEventListener('click', () => {
    if (!state.currentReceiptPayment || !state.currentReceiptLoan) return;
    shareReceiptWhatsApp(state.currentReceiptPayment, state.currentReceiptLoan);
  });

  // Modal cleanup on hide
  ['#clientModal', '#loanModal', '#paymentModal', '#clientProfileModal', '#confirmDeleteModal', '#upgradeModal', '#modal-qr', '#receiptModal', '#loanInfoModal'].forEach(sel => {
    document.querySelector(sel)?.addEventListener('hidden.bs.modal', () => {
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    });
  });

  // Reset slot stepper when upgrade modal opens
  document.querySelector('#upgradeModal')?.addEventListener('show.bs.modal', () => {
    extraSlots = 5;
    updateSlotUI();
  });

  // Plan banner upgrade button
  $('#banner-upgrade-btn')?.addEventListener('click', () => bootstrap.Modal.getOrCreateInstance($('#upgradeModal')).show());

  // [MODIFIED] Data Management Buttons - Removed JSON import/export and general PDF export
  // $('#btn-export-pdf').addEventListener('click', () => exportAllDataAsPDF()); // Removed
  // $('#btn-export-backup').addEventListener('click', () => exportJSON()); // Removed
  // $('#btn-import-backup').addEventListener('click', () => $('#import-file-input').click()); // Removed
  // Update notification badge periodically
  updateNotifBadge();
  setInterval(updateNotifBadge, 60000);
}

// ── PIN INPUT HELPER ─────────────────────────────────────────
function setupPinInputBehavior(containerSel) {
  const container = document.querySelector(containerSel);
  if (!container) return;
  const inputs = [...container.querySelectorAll('.pin-digit-input')];

  inputs.forEach((input, idx) => {
    // Only allow digits
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(0, 1);
      if (val && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }
      // Auto-submit on last digit if in lock screen
      if (val && idx === inputs.length - 1 && containerSel === '#pin-lock-inputs') {
        setTimeout(() => $('#btn-unlock-pin')?.click(), 150);
      }
    });

    // Handle backspace
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!input.value && idx > 0) {
          inputs[idx - 1].focus();
          inputs[idx - 1].value = '';
        }
      }
      // Enter key
      if (e.key === 'Enter') {
        if (containerSel === '#pin-setup-inputs') {
          $('#btn-confirm-pin')?.click();
        } else {
          $('#btn-unlock-pin')?.click();
        }
      }
    });

    // Handle paste (e.g. paste "1234")
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 4);
      paste.split('').forEach((ch, i) => {
        if (inputs[i]) inputs[i].value = ch;
      });
      const nextIdx = Math.min(paste.length, inputs.length - 1);
      inputs[nextIdx].focus();
    });

    // Select all on focus
    input.addEventListener('focus', () => {
      input.select();
    });
  });
}

// ── SLOT PURCHASE SYSTEM ─────────────────────────────────────
function updateSlotUI() {
  const blocks = extraSlots / 5;
  const totalPrice = blocks * 99;
  const settings = Store.settings();
  const currentExtra = settings.extraClients || 0;
  const newLimit = 20 + currentExtra + extraSlots;

  // Update stepper display
  const countDisplay = document.getElementById('slot-count-display');
  if (countDisplay) countDisplay.textContent = extraSlots;

  // Update summary box
  const extraEl = document.getElementById('slot-extra-clients');
  if (extraEl) extraEl.textContent = extraSlots;

  const blocksEl = document.getElementById('slot-blocks');
  if (blocksEl) blocksEl.textContent = blocks;

  const priceEl = document.getElementById('slot-price');
  if (priceEl) priceEl.textContent = '₹' + totalPrice;

  const limitEl = document.getElementById('slot-new-limit');
  if (limitEl) limitEl.textContent = newLimit + ' clients';

  // Update pay button
  const payBtn = document.getElementById('slot-pay-btn');
  if (payBtn) payBtn.textContent = 'Pay ₹' + totalPrice + ' via UPI →';

  // Disable minus button if at minimum
  const minusBtn = document.getElementById('slot-minus-btn');
  if (minusBtn) {
    minusBtn.disabled = extraSlots <= 5;
    minusBtn.style.opacity = extraSlots <= 5 ? '0.4' : '1';
  }
}

function openQRPayment(extraCount) {
  const blocks = extraCount / 5;
  const totalPrice = blocks * 99;

  // Show correct amount in QR modal
  const qrPriceEl = document.getElementById('qr-price-text');
  if (qrPriceEl) qrPriceEl.textContent = '₹' + totalPrice;

  const qrDescEl = document.getElementById('qr-desc-text');
  if (qrDescEl) qrDescEl.textContent = extraCount + ' client slots • ' + blocks + ' block(s) × ₹99';

  // Store pending purchase
  pendingExtraSlots = extraCount;
  pendingPaymentAmount = totalPrice;

  // Generate a simple placeholder QR (data URI with UPI info)
  const qrImg = document.getElementById('qr-img');
  if (qrImg) {
    // Use a placeholder QR code SVG as data URI
    qrImg.src = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="%23f8f9fa"/>' +
      '<text x="90" y="80" text-anchor="middle" font-size="14" font-family="sans-serif" fill="%23333">UPI QR Code</text>' +
      '<text x="90" y="105" text-anchor="middle" font-size="12" font-family="sans-serif" fill="%23666">₹' + totalPrice + '</text>' +
      '<text x="90" y="130" text-anchor="middle" font-size="10" font-family="sans-serif" fill="%23999">kaasflow@upi</text></svg>'
    );
  }

  // Clear previous txn ID
  const txnInput = document.getElementById('upi-txn-id');
  if (txnInput) txnInput.value = '';

  // Close upgrade modal and open QR modal
  const upgradeModalEl = document.getElementById('upgradeModal');
  if (upgradeModalEl) {
    const upgradeInstance = bootstrap.Modal.getInstance(upgradeModalEl);
    if (upgradeInstance) upgradeInstance.hide();
  }

  // Small delay to let the first modal close cleanly
  setTimeout(() => {
    const qrModal = new bootstrap.Modal(document.getElementById('modal-qr'));
    qrModal.show();
  }, 300);
}

function confirmPayment() {
  const txnInput = document.getElementById('upi-txn-id');
  const txnId = txnInput ? txnInput.value.trim() : '';

  if (!txnId || txnId.length < 6) {
    showToast('Enter valid UPI Transaction ID (min 6 chars)', 'error');
    return;
  }

  const settings = Store.settings();

  // Add the slots
  const currentExtra = settings.extraClients || 0;
  settings.extraClients = currentExtra + pendingExtraSlots;

  // Save payment record
  if (!settings.slotPayments) {
    settings.slotPayments = [];
  }
  settings.slotPayments.push({
    date: today(),
    extraClients: pendingExtraSlots,
    blocks: pendingExtraSlots / 5,
    amount: pendingPaymentAmount,
    txnId: txnId
  });

  Store.saveSettings(settings);

  const newLimit = 20 + settings.extraClients;

  // Close QR modal
  const qrModalEl = document.getElementById('modal-qr');
  if (qrModalEl) {
    const qrInstance = bootstrap.Modal.getInstance(qrModalEl);
    if (qrInstance) qrInstance.hide();
  }

  showToast('✅ ' + pendingExtraSlots + ' slots added! New limit: ' + newLimit + ' clients', 'success');

  pendingExtraSlots = 0;
  pendingPaymentAmount = 0;

  // Refresh page to reflect changes
  updatePlanBanner();
  navigateTo(state.page);
}

// ── MODAL TOGGLES FOR SETTINGS INFO ───────────────────────────
window.openTermsModal = function() { document.getElementById('termsModal').style.display = 'flex'; }
window.openPrivacyModal = function() { document.getElementById('privacyModal').style.display = 'flex'; }
window.openContactModal = function() { document.getElementById('contactModal').style.display = 'flex'; }
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; }
window.closeContactOnOverlay = function(e) {
  if (e.target.id === 'contactModal') {
    closeModal('contactModal');
  }
}

// ── BOOT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Brief loading screen delay for smooth UX
  setTimeout(() => init(), 400); // Keep the UX delay
});
