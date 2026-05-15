/**
 * KaasFlow Client Limit Enforcement
 * STRICT: Free tier = 20 clients MAX
 * Add this to your app.js to enforce the limit
 */

// ============================================================
// 1. BEFORE ADDING CLIENT - CHECK LIMIT
// ============================================================

// Find your "Add Client" button click handler and wrap it like this:

function handleAddClientClick() {
  // GET CURRENT CLIENT COUNT
  const clients = JSON.parse(localStorage.getItem('kf_clients') || '[]');
  const currentCount = clients.length;
  
  // CHECK SUBSCRIPTION LIMIT
  const canAdd = window.KFSubscription.canAddClient(currentCount);
  
  if (!canAdd) {
    // BLOCK: Show upgrade modal
    const plan = window.KFSubscription.getCurrentPlan();
    const limit = window.KFSubscription.getClientLimit();
    
    // Show error message
    showToast('error', `❌ Client limit reached! You have ${currentCount}/${limit} clients on ${plan.name}`);
    
    // Show upgrade modal after 1 second
    setTimeout(() => {
      window.KFSubscription.ui.showUpgradeModal();
    }, 500);
    
    return false; // STOP HERE - DO NOT ADD CLIENT
  }
  
  // ALLOWED: Open add client modal
  const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));
  clientModal.show();
}

// ============================================================
// 2. WHEN SAVING CLIENT - VERIFY LIMIT AGAIN
// ============================================================

function saveClient() {
  // Validate form
  const form = document.getElementById('client-form');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  
  // GET CURRENT CLIENTS
  const clients = JSON.parse(localStorage.getItem('kf_clients') || '[]');
  const currentCount = clients.length;
  
  // FINAL CHECK: Verify limit before saving
  if (!window.KFSubscription.canAddClient(currentCount)) {
    showToast('error', `❌ Cannot add more clients! Limit reached at ${currentCount} clients`);
    return false;
  }
  
  // Get form data
  const clientData = {
    id: Date.now(),
    name: document.getElementById('client-name').value,
    phone: document.getElementById('client-phone').value,
    address: document.getElementById('client-address').value,
    idNum: document.getElementById('client-id-num').value,
    occupation: document.getElementById('client-occupation').value,
    createdAt: new Date().toISOString()
  };
  
  // ADD CLIENT
  clients.push(clientData);
  localStorage.setItem('kf_clients', JSON.stringify(clients));
  
  // SHOW SUCCESS
  showToast('success', `✅ Client added! (${clients.length}/${window.KFSubscription.getClientLimit()})`);
  
  // CLOSE MODAL
  const modal = bootstrap.Modal.getInstance(document.getElementById('clientModal'));
  modal.hide();
  
  // REFRESH UI
  renderClientsPage();
  
  // CHECK IF APPROACHING LIMIT
  const limit = window.KFSubscription.getClientLimit();
  const remaining = limit - clients.length;
  
  if (remaining <= 3 && remaining > 0) {
    setTimeout(() => {
      showToast('warning', `⚠️ Only ${remaining} client slots remaining!`);
    }, 1000);
  }
  
  return true;
}

// ============================================================
// 3. DISPLAY CLIENT COUNT IN UI
// ============================================================

function renderClientsPage() {
  const clients = JSON.parse(localStorage.getItem('kf_clients') || '[]');
  const limit = window.KFSubscription.getClientLimit();
  const plan = window.KFSubscription.getCurrentPlan();
  
  const usage = (clients.length / limit) * 100;
  const remaining = limit - clients.length;
  
  let html = `
    <div class="page-section">
      <h2 class="page-title">
        <i class="fa-solid fa-users"></i>
        Clients
      </h2>
      
      <!-- Client Usage Card -->
      <div class="kf-card mb-3">
        <div class="flex-between mb-2">
          <span class="text-muted-kf fs-sm">Client Usage</span>
          <span class="fw-700">${clients.length} / ${limit === Infinity ? '∞' : limit}</span>
        </div>
        <div class="kf-progress">
          <div class="kf-progress-fill ${usage > 90 ? 'danger' : usage > 70 ? 'warning' : ''}" 
               style="width: ${Math.min(usage, 100)}%"></div>
        </div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:0.5rem;">
          ${remaining > 0 ? `${remaining} slots remaining` : 'Limit reached - Upgrade to add more'}
        </div>
      </div>
  `;
  
  // Show upgrade banner if approaching limit
  if (plan.id === 'free' && clients.length >= 18) {
    html += `
      <div class="kf-card mb-3" style="background:rgba(212,160,23,0.1);border-left:3px solid var(--color-primary);">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="font-size:1.5rem;">⚠️</div>
          <div>
            <div style="font-weight:700;color:var(--color-text);">Running out of space!</div>
            <div style="font-size:0.8rem;color:var(--color-text-muted);">You have ${remaining} client slots left</div>
          </div>
          <button class="btn-kf-primary" style="margin-left:auto;white-space:nowrap;" 
                  onclick="window.KFSubscription.ui.showUpgradeModal()">
            Upgrade
          </button>
        </div>
      </div>
    `;
  }
  
  // Add Client Button
  html += `
    <div class="mb-3">
      <button class="btn-kf-primary w-100" onclick="handleAddClientClick()">
        <i class="fa-solid fa-user-plus me-2"></i>
        Add Client ${remaining <= 0 ? '(Limit Reached)' : `(${remaining} slots left)`}
      </button>
    </div>
  `;
  
  // Disable button if limit reached
  if (remaining <= 0) {
    html = html.replace('onclick="handleAddClientClick()"', 'onclick="handleAddClientClick()" disabled style="opacity:0.6;cursor:not-allowed;"');
  }
  
  // List clients
  html += `
    <div class="section-title">
      <i class="fa-solid fa-list"></i>
      All Clients (${clients.length})
    </div>
  `;
  
  if (clients.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">
          <i class="fa-solid fa-users"></i>
        </div>
        <h3>No Clients Yet</h3>
        <p>Add your first client to get started</p>
      </div>
    `;
  } else {
    clients.forEach(client => {
      html += `
        <div class="client-card">
          <div class="client-avatar">${client.name.charAt(0).toUpperCase()}</div>
          <div class="client-info">
            <div class="client-name">${client.name}</div>
            <div class="client-meta">
              <span><i class="fa-solid fa-phone"></i> ${client.phone}</span>
            </div>
          </div>
          <div class="client-actions">
            <button class="btn-icon primary" onclick="editClient('${client.id}')">
              <i class="fa-solid fa-edit"></i>
            </button>
            <button class="btn-icon danger" onclick="deleteClient('${client.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
  }
  
  html += `</div>`;
  
  document.getElementById('page-content').innerHTML = html;
}

// ============================================================
// 4. DASHBOARD - SHOW CLIENT USAGE
// ============================================================

function renderDashboard() {
  const clients = JSON.parse(localStorage.getItem('kf_clients') || '[]');
  const limit = window.KFSubscription.getClientLimit();
  const plan = window.KFSubscription.getCurrentPlan();
  const stats = window.KFSubscription.manager.getStats();
  
  const usage = (clients.length / limit) * 100;
  const remaining = limit - clients.length;
  
  let html = `
    <div class="page-section">
      <h2 class="page-title">
        <i class="fa-solid fa-house"></i>
        Dashboard
      </h2>
  `;
  
  // KPI Cards
  html += `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Clients</div>
        <div class="kpi-value">${clients.length}</div>
        <i class="fa-solid fa-users kpi-icon"></i>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Limit</div>
        <div class="kpi-value">${limit === Infinity ? '∞' : limit}</div>
        <i class="fa-solid fa-chart-pie kpi-icon"></i>
      </div>
    </div>
  `;
  
  // Client Usage Card
  html += `
    <div class="kf-card mb-3">
      <div class="flex-between mb-2">
        <span class="text-muted-kf fs-sm">Client Usage</span>
        <span class="fw-700">${clients.length} / ${limit === Infinity ? '∞' : limit}</span>
      </div>
      <div class="kf-progress">
        <div class="kf-progress-fill ${usage > 90 ? 'danger' : usage > 70 ? 'warning' : ''}" 
             style="width: ${Math.min(usage, 100)}%"></div>
      </div>
  `;
  
  // Show upgrade banner if on free plan and approaching limit
  if (plan.id === 'free' && clients.length >= 15) {
    html += `
      <div style="margin-top:1rem;padding:1rem;background:rgba(212,160,23,0.1);border-radius:var(--radius-sm);border-left:3px solid var(--color-primary);">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
          <i class="fa-solid fa-crown" style="font-size:1.25rem;color:var(--color-primary);"></i>
          <div>
            <div style="font-weight:700;color:var(--color-text);">Upgrade to add more clients</div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);">You have ${remaining} slots remaining</div>
          </div>
        </div>
        <button class="btn-kf-primary w-100" onclick="window.KFSubscription.ui.showUpgradeModal()">
          <i class="fa-solid fa-arrow-up me-2"></i>Upgrade Now
        </button>
      </div>
    `;
  }
  
  html += `</div>`;
  
  // Plan Info
  html += `
    <h6 class="section-title">
      <i class="fa-solid fa-crown"></i>
      Subscription Plan
    </h6>
    ${window.KFSubscription.renderPlanInfo()}
  `;
  
  html += `</div>`;
  
  document.getElementById('page-content').innerHTML = html;
}

// ============================================================
// 5. SETTINGS PAGE - SHOW PLAN INFO
// ============================================================

function renderSettingsPage() {
  const plan = window.KFSubscription.getCurrentPlan();
  const stats = window.KFSubscription.manager.getStats();
  
  let html = `
    <div class="page-section">
      <h2 class="page-title">
        <i class="fa-solid fa-gear"></i>
        Settings
      </h2>
      
      <!-- Subscription Plan -->
      <h6 class="section-title">
        <i class="fa-solid fa-crown"></i>
        Subscription Plan
      </h6>
      ${window.KFSubscription.renderPlanInfo()}
      
      <!-- Features -->
      <h6 class="section-title mt-3">
        <i class="fa-solid fa-list-check"></i>
        Available Features
      </h6>
      <div class="kf-card">
        <div class="settings-row">
          <div class="settings-row-label">
            <i class="fa-solid fa-users"></i>
            Client Limit
          </div>
          <span class="text-primary-kf fw-700">
            ${stats.clientLimit === Infinity ? 'Unlimited' : stats.clientLimit}
          </span>
        </div>
        
        <div class="settings-row">
          <div class="settings-row-label">
            <i class="fa-solid fa-calendar-check"></i>
            Collection Mode
          </div>
          ${plan.features.collection ? 
            '<span class="badge-kf badge-active"><i class="fa-solid fa-check"></i> Unlocked</span>' : 
            '<span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span>'}
        </div>
        
        <div class="settings-row">
          <div class="settings-row-label">
;            <i class="fa-brands fa-whatsapp" style="color:#25D366; margin-right:8px; font-size:1.1rem;"></i>
            WhatsApp Reminders
          </div>
          ${plan.features.whatsappReminders ? 
            '<span class="badge-kf badge-active"><i class="fa-solid fa-check"></i> Unlocked</span>' : 
            '<span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span>'}
        </div>
        
        <div class="settings-row">
          <div class="settings-row-label">
            <i class="fa-solid fa-file-excel"></i>
            Excel Export
          </div>
          ${plan.features.excelExport ? 
            '<span class="badge-kf badge-active"><i class="fa-solid fa-check"></i> Unlocked</span>' : 
            '<span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span>'}
        </div>
        
        <div class="settings-row">
          <div class="settings-row-label">
            <i class="fa-solid fa-file-pdf"></i>
            PDF Receipts
          </div>
          ${plan.features.pdfReceipts ? 
            '<span class="badge-kf badge-active"><i class="fa-solid fa-check"></i> Unlocked</span>' : 
            '<span class="locked-badge"><i class="fa-solid fa-lock"></i> Locked</span>'}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('page-content').innerHTML = html;
}

// ============================================================
// 6. HELPER FUNCTIONS
// ============================================================

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation'
  };
  
  const toast = document.createElement('div');
  toast.className = `kf-toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type]}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function editClient(clientId) {
  const clients = JSON.parse(localStorage.getItem('kf_clients') || '[]');
  const client = clients.find(c => c.id == clientId);
  
  if (!client) return;
  
  // Populate form
  document.getElementById('client-edit-id').value = client.id;
  document.getElementById('client-name').value = client.name;
  document.getElementById('client-phone').value = client.phone;
  document.getElementById('client-address').value = client.address || '';
  document.getElementById('client-id-num').value = client.idNum || '';
  document.getElementById('client-occupation').value = client.occupation || '';
  
  // Show modal
  const modal = new bootstrap.Modal(document.getElementById('clientModal'));
  modal.show();
}

function deleteClient(clientId) {
  if (!confirm('Are you sure you want to delete this client?')) return;
  
  const clients = JSON.parse(localStorage.getItem('kf_clients') || '[]');
  const filtered = clients.filter(c => c.id != clientId);
  
  localStorage.setItem('kf_clients', JSON.stringify(filtered));
  showToast('success', 'Client deleted');
  renderClientsPage();
}

// ============================================================
// 7. INITIALIZE ON PAGE LOAD
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  // Your existing initialization code
  
  // Check subscription on load
  const plan = window.KFSubscription.getCurrentPlan();
  const stats = window.KFSubscription.manager.getStats();
  
  console.log('Current Plan:', plan.name);
  console.log('Client Limit:', stats.clientLimit);
  console.log('Days Remaining:', stats.daysRemaining);
  
  // Show expiry warning if needed
  if (stats.isExpired) {
    showToast('warning', '⚠️ Your subscription has expired. Upgrade to continue adding clients.');
  }
});
