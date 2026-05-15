from datetime import datetime, timedelta
import json

class PlanManager:
    PLANS = {
        'monthly': {
            'name': 'Monthly Plan',
            'duration_days': 30,
            'price': 500
        },
        'quarterly': {
            'name': 'Quarterly Plan',
            'duration_days': 90,
            'price': 1200
        },
        'yearly': {
            'name': 'Yearly Plan',
            'duration_days': 365,
            'price': 4000
        }
    }
    
    @staticmethod
    def activate_plan(user_id, plan_type, payment_id):
        """Activate plan for user after successful payment"""
        if plan_type not in PlanManager.PLANS:
            return {'success': False, 'error': 'Invalid plan type'}
        
        plan = PlanManager.PLANS[plan_type]
        start_date = datetime.now()
        end_date = start_date + timedelta(days=plan['duration_days'])
        
        # Store in database (example structure)
        subscription = {
            'user_id': user_id,
            'plan_type': plan_type,
            'plan_name': plan['name'],
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'payment_id': payment_id,
            'status': 'active',
            'amount_paid': plan['price']
        }
        
        # TODO: Save to your database
        # db.subscriptions.insert(subscription)
        
        return {
            'success': True,
            'subscription': subscription,
            'message': f'{plan["name"]} activated until {end_date.strftime("%Y-%m-%d")}'
        }
    
    @staticmethod
    def check_plan_status(user_id):
        """Check if user's plan is active"""
        # TODO: Fetch from database
        # subscription = db.subscriptions.find_one({'user_id': user_id, 'status': 'active'})
        
        # Example check
        # if subscription:
        #     end_date = datetime.fromisoformat(subscription['end_date'])
        #     if datetime.now() > end_date:
        #         return {'active': False, 'expired': True}
        #     return {'active': True, 'end_date': end_date.isoformat()}
        
        return {'active': False}
    
    @staticmethod
    def get_plan_price(plan_type):
        """Get price for a plan"""
        return PlanManager.PLANS.get(plan_type, {}).get('price', 0)
