/**
 * KaasFlow Subscription System - STRICT FREE LIMIT
 * Free: 20 clients max (BLOCKED after 20)
 * Paid: Monthly/Quarterly/Yearly subscriptions for unlimited clients
 */

(function() {
  'use strict';

  // ─── YOUR RAZORPAY KEY ID (replace with your actual key) ─────
  const RAZORPAY_KEY = 'rzp_test_YourKeyHere'; // e.g. rzp_live_xxxxxxxxxxxxxx

  const PLANS = {
    FREE: {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      clientLimit: 20,
      duration: null,
      features: {
        clients: 20,
        loans: true,
        basicReports: true,
        collection: false,
        whatsappReminders: false,
        excelExport: false,
        pdfReceipts: false,
        dataBackup: false,
        advancedReports: false
      },
      badge: null
    },
    MONTHLY: {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 299,
      clientLimit: Infinity,
      duration: 30,
      features: {
        clients: Infinity,
        loans: true,
        basicReports: true,
        collection: true,
        whatsappReminders: true,
        excelExport: true,
        pdfReceipts: true,
        dataBackup: true,
        advancedReports: true
      },
      badge: 'PRO'
    },
    QUARTERLY: {
      id: 'quarterly',
      name: 'Quarterly Plan',
      price: 799,
      clientLimit: Infinity,
      duration: 90,
      features: {
        clients: Infinity,
        loans: true,
        basicReports: true,
        collection: true,
        whatsappReminders: true,
        excelExport: true,
        pdfReceipts: true,
        dataBackup: true,
        advancedReports: true
      },
      badge: 'PRO',
      savings: 'Save ₹98'
    },
    YEARLY: {
      id: 'yearly',
      name: 'Yearly Plan',
      price: 2999,
      clientLimit: Infinity,
      duration: 365,
      features: {
        clients: Infinity,
        loans: true,
        basicReports: true,
        collection: true,
        whatsappReminders: true,
        excelExport: true,
        pdfReceipts: true,
        dataBackup: true,
        advancedReports: true
      },
      badge: 'PRO',
      savings: 'Save ₹589'
    }
  };

  // Subscription Manager
  class SubscriptionManager {
    constructor() {
      this.storageKey = 'kf_subscription';
      this.init();
    }

    init() {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        this.setDefaultPlan();
      }
    }

    setDefaultPlan() {
      const defaultSub = {
        planId: 'free',
        startDate: new Date().toISOString(),
        expiryDate: null,
        totalPaid: 0,
        paymentHistory: []
      };
      localStorage.setItem(this.storageKey, JSON.stringify(defaultSub));
    }

    getCurrentSubscription() {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    }

    getCurrentPlan() {
      const sub = this.getCurrentSubscription();
      
      // If subscription expired, return FREE plan
      if (this.isSubscriptionExpired()) {
        return PLANS.FREE;
      }
      
      return PLANS[sub.planId.toUpperCase()] || PLANS.FREE;
    }

    getClientLimit() {
      const plan = this.getCurrentPlan();
      
      // Check if subscription is expired
      if (this.isSubscriptionExpired()) {
        return 20; // Revert to free limit if expired
      }
      
      return plan.clientLimit;
    }

    isSubscriptionExpired() {
      const sub = this.getCurrentSubscription();
      if (!sub.expiryDate) return false;
      
      const now = new Date();
      const expiry = new Date(sub.expiryDate);
      return now > expiry;
    }

    canAddClient(currentClientCount) {
      const limit = this.getClientLimit();
      const plan = this.getCurrentPlan();
      
      // STRICT: Free plan cannot exceed 20 clients
      if (plan.id === 'free' && currentClientCount >= 20) {
        return false;
      }
      
      // Check if expired
      if (this.isSubscriptionExpired() && currentClientCount >= 20) {
        return false;
      }
      
      return currentClientCount < limit;
    }

    hasFeature(featureName) {
      const plan = this.getCurrentPlan();
      
      // If expired, only basic features
      if (this.isSubscriptionExpired()) {
        return PLANS.FREE.features[featureName] === true;
      }
      
      return plan.features[featureName] === true;
    }

    upgradeToPlan(planId) {
      const sub = this.getCurrentSubscription();
      const plan = PLANS[planId.toUpperCase()];
      
      if (!plan || plan.id === 'free') {
        return { success: false, error: 'Invalid plan' };
      }
      
      const payment = {
        date: new Date().toISOString(),
        amount: plan.price,
        planId: plan.id,
        planName: plan.name,
        type: 'subscription'
      };

      // Calculate expiry date
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + plan.duration);

      sub.planId = plan.id;
      sub.startDate = startDate.toISOString();
      sub.expiryDate = expiryDate.toISOString();
      sub.totalPaid += plan.price;
      sub.paymentHistory.push(payment);

      localStorage.setItem(this.storageKey, JSON.stringify(sub));
      return { 
        success: true, 
        cost: plan.price, 
        planName: plan.name,
        expiryDate: expiryDate.toISOString()
      };
    }

    getStats() {
      const sub = this.getCurrentSubscription();
      const plan = this.getCurrentPlan();
      const isExpired = this.isSubscriptionExpired();
      
      return {
        planName: isExpired ? 'Free Plan (Expired)' : plan.name,
        planBadge: isExpired ? null : plan.badge,
        clientLimit: this.getClientLimit(),
        totalPaid: sub.totalPaid,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        isExpired: isExpired,
        daysRemaining: this.getDaysRemaining(),
        paymentHistory: sub.paymentHistory
      };
    }

    getDaysRemaining() {
      const sub = this.getCurrentSubscription();
      if (!sub.expiryDate) return null;
      
      const now = new Date();
      const expiry = new Date(sub.expiryDate);
      const diff = expiry - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      return days > 0 ? days : 0;
    }
  }

  // UI Manager
  class SubscriptionUI {
    constructor(manager) {
      this.manager = manager;
      this.upgradeModal = null;
      this.paymentModal = null;
    }

    init() {
      this.updateUpgradeModal();
      this.createPaymentModal();
      this.updateHeaderBadge();
      this.attachEventListeners();
      this.checkExpiry();
    }

    updateUpgradeModal() {
      // Update the existing upgrade modal with new plans
      const modalBody = document.querySelector('#upgradeModal .modal-body');
      if (!modalBody) return;
      
      const currentPlan = this.manager.getCurrentPlan();
      
      modalBody.innerHTML = `
        <p class="text-center text-muted-kf mb-3">Choose a plan to unlock unlimited clients & all features</p>
        <div class="plan-cards-wrapper">
          ${this.renderPlanCard(PLANS.MONTHLY, currentPlan.id === 'monthly')}
          ${this.renderPlanCard(PLANS.QUARTERLY, currentPlan.id === 'quarterly')}
          ${this.renderPlanCard(PLANS.YEARLY, currentPlan.id === 'yearly')}
        </div>
        <p class="text-center text-muted-kf mt-3" style="font-size:0.75rem;">
          Free plan: up to 20 clients only. Upgrade to add unlimited clients.
        </p>
      `;
    }

    renderPlanCard(plan, isCurrent) {
      const isRecommended = plan.id === 'yearly';
      
      return `
        <div class="plan-card ${isRecommended ? 'plan-card-featured' : ''} ${isCurrent ? 'plan-card-current' : ''}">
          ${isRecommended ? '<div class="plan-badge-top">Best Value ⭐</div>' : ''}
          ${isCurrent ? '<div class="plan-badge-current">Current Plan</div>' : ''}
          <div class="plan-label">${plan.name}</div>
          <div class="plan-price">₹${plan.price}<span>/${plan.duration} days</span></div>
          ${plan.savings ? `<div class="plan-saving-badge">${plan.savings}</div>` : ''}
          <ul class="plan-features">
            <li><i class="fa-solid fa-check"></i> Unlimited clients</li>
            <li><i class="fa-solid fa-check"></i> All features unlocked</li>
            <li><i class="fa-solid fa-check"></i> Collection mode</li>
            <li><i class="fa-solid fa-check"></i> WhatsApp reminders</li>
            <li><i class="fa-solid fa-check"></i> Excel & PDF export</li>
            <li><i class="fa-solid fa-check"></i> Data backup</li>
          </ul>
          <button type="button" 
                  class="btn-plan-choose ${isRecommended ? 'btn-plan-choose-featured' : ''}" 
                  onclick="window.KFSubscription.selectPlan('${plan.id}')"
                  ${isCurrent ? 'disabled' : ''}>
            ${isCurrent ? 'Current Plan' : 'Choose Plan'}
          </button>
        </div>
      `;
    }

    createPaymentModal() {
      // Razorpay handles its own UI – we don't need a custom modal
      // Keep a minimal confirmation modal for post-payment verification
    }

    attachEventListeners() {
      // Event listeners added dynamically via openRazorpay
    }

    /** Open Razorpay checkout for a given plan */
    openRazorpay(planId) {
      const plan = PLANS[planId.toUpperCase()];
      if (!plan) return;

      if (typeof Razorpay === 'undefined') {
        this.showToast('error', 'Payment gateway not loaded. Please check your internet connection.');
        return;
      }

      const session = JSON.parse(localStorage.getItem('kf_session') || '{}');
      const user = session.user || {};

      const options = {
        key: RAZORPAY_KEY,
        amount: plan.price * 100, // Razorpay expects paise
        currency: 'INR',
        name: 'KaasFlow',
        description: `${plan.name} – ${plan.duration} Days`,
        image: '', // your logo URL
        prefill: {
          name:  user.financierName || '',
          email: user.email || '',
          contact: ''
        },
        notes: {
          planId: plan.id,
          planName: plan.name
        },
        theme: { color: '#d4a017' },
        handler: (response) => {
          // Payment successful – activate plan
          const result = this.manager.upgradeToPlan(planId);
          result.razorpay_payment_id = response.razorpay_payment_id;
          if (result.success) {
            this.showSuccessScreen(result);
            this.updateHeaderBadge();
            this.updateUpgradeModal();
            // Close upgrade modal
            const upgradeModalEl = document.getElementById('upgradeModal');
            if (upgradeModalEl) {
              const upgradeModalInst = bootstrap.Modal.getInstance(upgradeModalEl);
              if (upgradeModalInst) upgradeModalInst.hide();
            }
            if (window.KF && window.KF.refreshCurrentPage) {
              window.KF.refreshCurrentPage();
            }
          }
        },
        modal: {
          ondismiss: () => {
            this.showToast('info', 'Payment cancelled.');
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response) => {
        this.showToast('error', `Payment failed: ${response.error.description}`);
      });
      rzp.open();
    }


    updateHeaderBadge() {
      const stats = this.manager.getStats();
      const headerLeft = document.querySelector('.header-left');
      if (!headerLeft) return;
      
      const existingBadge = headerLeft.querySelector('.plan-badge');
      if (existingBadge) existingBadge.remove();
      
      if (stats.planBadge && !stats.isExpired) {
        const badge = document.createElement('span');
        badge.className = 'plan-badge';
        badge.textContent = stats.planBadge;
        headerLeft.appendChild(badge);
      }
    }

    checkExpiry() {
      const stats = this.manager.getStats();
      
      if (stats.isExpired) {
        this.showToast('warning', 'Your subscription has expired. Upgrade to continue adding clients.');
      } else if (stats.daysRemaining && stats.daysRemaining <= 7) {
        this.showToast('info', `Your subscription expires in ${stats.daysRemaining} days`);
      }
    }

    showUpgradePrompt(currentClientCount) {
      const plan = this.manager.getCurrentPlan();
      
      if (plan.id === 'free' && currentClientCount >= 20) {
        this.showUpgradeModal();
      } else if (this.manager.isSubscriptionExpired()) {
        this.showUpgradeModal();
      }
    }

    showUpgradeModal() {
      this.updateUpgradeModal();
      const modal = new bootstrap.Modal(document.getElementById('upgradeModal'));
      modal.show();
    }

    showPaymentModal(planId) {
      // Use Razorpay instead of custom modal
      this.openRazorpay(planId);
    }

    processPayment() {
      // Legacy – kept for compatibility, actual payment now handled via Razorpay
      this.showToast('info', 'Please use Razorpay to complete payment.');
    }

    showSuccessScreen(result) {
      const expiryDate = new Date(result.expiryDate);
      const formattedDate = expiryDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      const modalHTML = `
        <div class="modal fade" id="successModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content kf-modal-content">
              <div class="modal-body text-center" style="padding: 2rem;">
                <div class="success-icon">
                  <i class="fa-solid fa-circle-check"></i>
                </div>
                <h3 class="success-title">Payment Successful!</h3>
                <p class="success-message">
                  Welcome to ${result.planName}! You can now add unlimited clients.
                </p>
                <div class="success-details">
                  <div class="success-detail-row">
                    <span>Amount Paid</span>
                    <strong>₹${result.cost}</strong>
                  </div>
                  <div class="success-detail-row">
                    <span>Plan</span>
                    <strong>${result.planName}</strong>
                  </div>
                  <div class="success-detail-row">
                    <span>Valid Until</span>
                    <strong>${formattedDate}</strong>
                  </div>
                </div>
                <button type="button" class="btn-kf-primary w-100 mt-3" data-bs-dismiss="modal">
                  <i class="fa-solid fa-check me-2"></i>Start Adding Clients
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      const existing = document.getElementById('successModal');
      if (existing) existing.remove();
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      const modal = new bootstrap.Modal(document.getElementById('successModal'));
      modal.show();
      
      this.showToast('success', 'Subscription activated successfully!');
    }

    showLockedFeatureTooltip(featureName) {
      this.showToast('info', `🔒 Upgrade to Pro to unlock ${featureName}`);
    }

    showToast(type, message) {
      if (window.KF && window.KF.showToast) {
        window.KF.showToast(type, message);
      } else {
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
    }

    renderPlanInfo() {
      const stats = this.manager.getStats();
      const plan = this.manager.getCurrentPlan();
      
      return `
        <div class="kf-card">
          <div class="plan-info-header">
            <div class="plan-info-icon">
              <i class="fa-solid fa-crown"></i>
            </div>
            <div>
              <div class="plan-info-name">${stats.planName}</div>
              ${stats.planBadge ? `<span class="badge-kf badge-active">${stats.planBadge}</span>` : ''}
              ${stats.isExpired ? '<span class="badge-kf badge-overdue">Expired</span>' : ''}
            </div>
          </div>
          
          <div class="plan-info-stats">
            <div class="plan-stat">
              <div class="plan-stat-label">Client Limit</div>
              <div class="plan-stat-value">${stats.clientLimit === Infinity ? 'Unlimited' : stats.clientLimit}</div>
            </div>
            ${stats.expiryDate ? `
              <div class="plan-stat">
                <div class="plan-stat-label">${stats.isExpired ? 'Expired' : 'Days Left'}</div>
                <div class="plan-stat-value ${stats.isExpired ? 'text-danger-kf' : ''}">${stats.daysRemaining || 0}</div>
              </div>
            ` : ''}
            ${stats.totalPaid > 0 ? `
              <div class="plan-stat">
                <div class="plan-stat-label">Total Spent</div>
                <div class="plan-stat-value">₹${stats.totalPaid}</div>
              </div>
            ` : ''}
          </div>
          
          ${plan.id === 'free' || stats.isExpired ? `
            <button type="button" class="btn-kf-primary w-100 mt-3" onclick="window.KFSubscription.ui.showUpgradeModal()">
              <i class="fa-solid fa-arrow-up me-2"></i>Upgrade Plan
            </button>
          ` : `
            <div class="alert alert-success mt-3" style="font-size:0.875rem;margin-bottom:0;">
              <i class="fa-solid fa-check-circle me-2"></i>
              Active subscription - Add unlimited clients!
            </div>
          `}
        </div>
        
        ${stats.paymentHistory.length > 0 ? `
          <div class="kf-card mt-3">
            <h6 class="section-title">
              <i class="fa-solid fa-receipt"></i>
              Payment History
            </h6>
            ${stats.paymentHistory.slice(-5).reverse().map(payment => `
              <div class="payment-history-row">
                <div>
                  <div class="payment-history-desc">${payment.planName}</div>
                  <div class="payment-history-date">
                    ${new Date(payment.date).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div class="payment-history-amount">
                  <div>₹${payment.amount}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;
    }
  }

  // Initialize
  const manager = new SubscriptionManager();
  const ui = new SubscriptionUI(manager);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ui.init());
  } else {
    ui.init();
  }

  // Expose globally
  window.KFSubscription = {
    manager,
    ui,
    PLANS,
    
    canAddClient: (count) => manager.canAddClient(count),
    hasFeature: (feature) => manager.hasFeature(feature),
    showUpgradePrompt: (count) => ui.showUpgradePrompt(count),
    getClientLimit: () => manager.getClientLimit(),
    getCurrentPlan: () => manager.getCurrentPlan(),
    renderPlanInfo: () => ui.renderPlanInfo(),
    selectPlan: (planId) => ui.showPaymentModal(planId)
  };

})();
