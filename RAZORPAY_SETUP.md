# Razorpay Plan Activation - Complete Setup Guide

## Overview
This integration automatically activates user plans (Monthly/Quarterly/Yearly) after successful Razorpay payment.

## Files Created
1. `backend/razorpay_integration.py` - Payment processing & verification
2. `backend/plan_manager.py` - Plan activation logic
3. `backend/schema.sql` - Database schema
4. `frontend/razorpay.js` - Frontend payment handler
5. `frontend/subscription.html` - Subscription page UI

## Setup Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Razorpay Credentials
Create `.env` file:
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```

Get credentials from: https://dashboard.razorpay.com/app/keys

### 3. Setup Database
```bash
sqlite3 kaasflow.db < backend/schema.sql
```

### 4. Update plan_manager.py with Database
Replace TODO sections with actual database code:

```python
import sqlite3
from datetime import datetime, timedelta

def get_db():
    conn = sqlite3.connect('kaasflow.db')
    conn.row_factory = sqlite3.Row
    return conn

@staticmethod
def activate_plan(user_id, plan_type, payment_id):
    if plan_type not in PlanManager.PLANS:
        return {'success': False, 'error': 'Invalid plan type'}
    
    plan = PlanManager.PLANS[plan_type]
    start_date = datetime.now()
    end_date = start_date + timedelta(days=plan['duration_days'])
    
    db = get_db()
    cursor = db.cursor()
    
    # Insert subscription
    cursor.execute('''
        INSERT INTO subscriptions 
        (user_id, plan_type, plan_name, start_date, end_date, payment_id, amount_paid, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    ''', (user_id, plan_type, plan['name'], start_date, end_date, payment_id, plan['price']))
    
    db.commit()
    db.close()
    
    return {
        'success': True,
        'subscription': {
            'plan_type': plan_type,
            'end_date': end_date.isoformat()
        },
        'message': f'{plan["name"]} activated until {end_date.strftime("%Y-%m-%d")}'
    }

@staticmethod
def check_plan_status(user_id):
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT * FROM subscriptions 
        WHERE user_id = ? AND status = 'active'
        ORDER BY end_date DESC LIMIT 1
    ''', (user_id,))
    
    subscription = cursor.fetchone()
    db.close()
    
    if subscription:
        end_date = datetime.fromisoformat(subscription['end_date'])
        if datetime.now() > end_date:
            return {'active': False, 'expired': True}
        return {
            'active': True,
            'end_date': end_date.isoformat(),
            'plan_type': subscription['plan_type']
        }
    
    return {'active': False}
```

### 5. Register Routes in Flask App
```python
from flask import Flask
from razorpay_integration import payment_routes
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
app.secret_key = 'your-secret-key'

payment_routes(app)

if __name__ == '__main__':
    app.run(debug=True)
```

### 6. Add to HTML
In your `index.html` or main HTML file:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script src="razorpay.js"></script>
```

## Usage

### Frontend - Subscribe to Plan
```javascript
// Initialize
RazorpayPayment.init('rzp_test_YOUR_KEY_ID');

// Subscribe to monthly plan
RazorpayPayment.payForPlan('monthly', {
  prefill: {
    name: 'Customer Name',
    email: 'customer@example.com',
    contact: '9876543210'
  },
  onSuccess: (response) => {
    console.log('Plan activated:', response.subscription);
    alert(response.message); // "Monthly Plan activated until 2024-02-15"
  },
  onError: (error) => {
    console.error('Payment failed:', error);
  }
});
```

### Check Subscription Status
```javascript
const status = await RazorpayPayment.checkSubscriptionStatus();
if (status.active) {
  console.log('Plan active until:', status.end_date);
} else {
  console.log('No active plan');
}
```

## Plan Details
- **Monthly**: ₹500 for 30 days
- **Quarterly**: ₹1,200 for 90 days (Save ₹300)
- **Yearly**: ₹4,000 for 365 days (Save ₹2,000)

## Flow
1. User clicks "Subscribe" button
2. Frontend calls `RazorpayPayment.payForPlan(planType)`
3. Backend creates Razorpay order with plan details
4. Razorpay checkout opens
5. User completes payment
6. Backend verifies payment signature
7. **Plan automatically activated** in database
8. User gets access for plan duration
9. Frontend shows success message with expiry date

## Testing
Use Razorpay test cards:
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

## Production Checklist
- [ ] Replace test keys with live keys
- [ ] Update RAZORPAY_KEY_ID in frontend
- [ ] Enable webhook for payment notifications
- [ ] Add cron job to check expired subscriptions
- [ ] Add email notifications for plan expiry
- [ ] Implement plan renewal reminders
