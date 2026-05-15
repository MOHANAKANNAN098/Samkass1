// Razorpay Payment Integration
const RazorpayPayment = {
  keyId: '', // Set from backend or config
  
  init(keyId) {
    this.keyId = keyId;
  },

  async createOrder(amount, planType) {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, plan_type: planType })
    });
    return await response.json();
  },

  async verifyPayment(paymentData) {
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return await response.json();
  },

  async checkSubscriptionStatus() {
    const response = await fetch('/api/subscription/status');
    return await response.json();
  },

  openCheckout(orderData, options = {}) {
    const rzpOptions = {
      key: this.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.id,
      name: options.name || 'KaasFlow',
      description: options.description || 'Payment',
      handler: async (response) => {
        const verification = await this.verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          plan_type: options.planType
        });
        
        if (verification.success && verification.plan_activated) {
          options.onSuccess?.({
            ...response,
            subscription: verification.subscription,
            message: verification.message
          });
        } else if (verification.success) {
          options.onSuccess?.(response);
        } else {
          options.onError?.({ error: 'Payment verification failed' });
        }
      },
      prefill: options.prefill || {},
      theme: { color: options.themeColor || '#3399cc' }
    };

    const rzp = new Razorpay(rzpOptions);
    rzp.on('payment.failed', (response) => {
      options.onError?.(response);
    });
    rzp.open();
  },

  async initiatePayment(amount, options = {}) {
    try {
      const orderResponse = await this.createOrder(amount, options.planType);
      if (orderResponse.success) {
        this.openCheckout(orderResponse.order, options);
      } else {
        options.onError?.({ error: orderResponse.error });
      }
    } catch (error) {
      options.onError?.({ error: error.message });
    }
  },

  // Plan-specific payment methods
  async payForPlan(planType, options = {}) {
    const plans = {
      'monthly': { amount: 500, name: 'Monthly Plan' },
      'quarterly': { amount: 1200, name: 'Quarterly Plan' },
      'yearly': { amount: 4000, name: 'Yearly Plan' }
    };
    
    const plan = plans[planType];
    if (!plan) {
      options.onError?.({ error: 'Invalid plan type' });
      return;
    }
    
    await this.initiatePayment(plan.amount, {
      ...options,
      planType: planType,
      description: plan.name
    });
  }
};
