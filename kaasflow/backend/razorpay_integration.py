import razorpay
from flask import jsonify, request, session
import os
from plan_manager import PlanManager

# Initialize Razorpay client
razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_KEY_SECRET')))

def create_order(amount, currency='INR', receipt=None, plan_type=None):
    """Create a Razorpay order"""
    data = {
        'amount': int(amount * 100),  # Amount in paise
        'currency': currency,
        'receipt': receipt or f'receipt_{int(amount)}',
        'payment_capture': 1,
        'notes': {'plan_type': plan_type} if plan_type else {}
    }
    return razorpay_client.order.create(data=data)

def verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """Verify payment signature"""
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        return True
    except:
        return False

def payment_routes(app):
    """Register payment routes"""
    
    @app.route('/api/payment/create-order', methods=['POST'])
    def create_payment_order():
        data = request.json
        plan_type = data.get('plan_type')
        amount = data.get('amount') or PlanManager.get_plan_price(plan_type)
        
        try:
            order = create_order(amount, plan_type=plan_type)
            return jsonify({'success': True, 'order': order})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/api/payment/verify', methods=['POST'])
    def verify_payment_signature():
        data = request.json
        is_valid = verify_payment(
            data.get('razorpay_order_id'),
            data.get('razorpay_payment_id'),
            data.get('razorpay_signature')
        )
        
        if is_valid:
            # Activate plan after successful payment
            user_id = session.get('user_id')  # Get from session/auth
            plan_type = data.get('plan_type')
            payment_id = data.get('razorpay_payment_id')
            
            if user_id and plan_type:
                activation = PlanManager.activate_plan(user_id, plan_type, payment_id)
                return jsonify({
                    'success': True,
                    'payment_verified': True,
                    'plan_activated': activation['success'],
                    'subscription': activation.get('subscription'),
                    'message': activation.get('message')
                })
        
        return jsonify({'success': is_valid})
    
    @app.route('/api/subscription/status', methods=['GET'])
    def get_subscription_status():
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        status = PlanManager.check_plan_status(user_id)
        return jsonify(status)
