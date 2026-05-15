"""
KaasFlow — Backup / Sync API Routes
=====================================
POST /api/sync/backup   → push all local data to Supabase
GET  /api/sync/restore  → pull all cloud data back to app
GET  /api/sync/status   → check last sync time
"""

from flask import Blueprint, request, jsonify
from supabase_db import SupabaseDB
import os, jwt, datetime

sync_bp = Blueprint("sync", __name__)

JWT_SECRET = os.getenv("JWT_SECRET", "changeme")


def _get_user_id(req):
    """Extract user_id and email from Authorization: Bearer <jwt> header."""
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None, None, ("Missing or invalid authorization header", 401)
    token = auth[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("id"), payload.get("sub"), None
    except jwt.ExpiredSignatureError:
        return None, None, ("Token expired", 401)
    except Exception:
        return None, None, ("Invalid token", 401)


# ─── POST /api/sync/backup ────────────────────────────────────
@sync_bp.route("/backup", methods=["POST"])
def backup():
    """
    Receive the full app state from the frontend and push to Supabase.
    Body: { clients: [...], loans: [...], payments: [...], settings: {...} }
    """
    user_id, email, err = _get_user_id(request)
    if err:
        return jsonify({"error": err[0]}), err[1]

    data = request.get_json(force=True) or {}
    result = SupabaseDB.push_backup(
        user_id=user_id,
        email=email,
        clients=data.get("clients", []),
        loans=data.get("loans", []),
        payments=data.get("payments", []),
        settings=data.get("settings", {}),
    )
    return jsonify(result), 200 if result["success"] else 207


# ─── GET /api/sync/restore ────────────────────────────────────
@sync_bp.route("/restore", methods=["GET"])
def restore():
    """Return full Supabase data for this user so the frontend can merge."""
    user_id, email, err = _get_user_id(request)
    if err:
        return jsonify({"error": err[0]}), err[1]

    try:
        data = SupabaseDB.pull_backup(user_id)
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── GET /api/sync/status ─────────────────────────────────────
@sync_bp.route("/status", methods=["GET"])
def status():
    """Quick health-check: confirms Supabase is reachable."""
    import os
    url   = os.getenv("SUPABASE_URL", "")
    ready = bool(url and os.getenv("SUPABASE_SERVICE_KEY", ""))
    return jsonify({
        "supabase_configured": ready,
        "supabase_url":        url if ready else "(not set)",
    }), 200
