"""
KaasFlow — Supabase Database Client
====================================
Wraps the Supabase REST API (PostgREST) using the service-role key.
Used by all Flask routes for cloud data backup and sync.
"""

import os
import requests
from functools import lru_cache

SUPABASE_URL = os.getenv("SUPABASE_URL", "")          # e.g. https://xxxx.supabase.co
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # Service Role Key (NOT anon key)


def _headers():
    return {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation",
    }


def _url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"


# ─── Generic helpers ────────────────────────────────────────────

def select(table: str, filters: dict = None, single: bool = False):
    """SELECT rows from a table.  filters = {column: value}"""
    params = {"select": "*"}
    if filters:
        for k, v in filters.items():
            params[k] = f"eq.{v}"
    if single:
        params["limit"] = "1"
    r = requests.get(_url(table), headers=_headers(), params=params, timeout=10)
    r.raise_for_status()
    rows = r.json()
    return rows[0] if (single and rows) else rows


def upsert(table: str, data: dict | list):
    """INSERT or UPDATE (upsert) one or many rows."""
    headers = {**_headers(), "Prefer": "return=representation,resolution=merge-duplicates"}
    r = requests.post(_url(table), headers=headers, json=data, timeout=10)
    r.raise_for_status()
    return r.json()


def delete(table: str, filters: dict):
    """DELETE rows matching filters."""
    params = {}
    for k, v in filters.items():
        params[k] = f"eq.{v}"
    r = requests.delete(_url(table), headers=_headers(), params=params, timeout=10)
    r.raise_for_status()
    return r.status_code


# ─── Domain helpers ─────────────────────────────────────────────

class SupabaseDB:

    # ── Users ──────────────────────────────────────────────────
    @staticmethod
    def get_user_by_email(email: str):
        rows = select("kf_users", {"email": email})
        return rows[0] if rows else None

    @staticmethod
    def upsert_user(payload: dict):
        return upsert("kf_users", payload)

    # ── Full Backup (push all local data to cloud) ─────────────
    @staticmethod
    def push_backup(user_id: str, email: str, clients: list, loans: list, payments: list, settings: dict):
        """Push entire local state to Supabase (upsert, so safe to call repeatedly)."""
        errors = []

        # Upsert User to satisfy foreign key constraints
        try:
            upsert("kf_users", {
                "id": user_id,
                "email": email,
                "financier_name": settings.get("financierName", ""),
                "business_name": settings.get("businessName", "")
            })
        except Exception as e:
            errors.append({"table": "kf_users", "error": str(e)})

        # Settings
        try:
            upsert("kf_settings", {
                "user_id":        user_id,
                "financier_name": settings.get("financierName", ""),
                "business_name":  settings.get("businessName", ""),
                "theme":          settings.get("theme", "dark"),
                "lang":           settings.get("lang", "en"),
                "extra_clients":  settings.get("extraClients", 0),
            })
        except Exception as e:
            errors.append({"table": "kf_settings", "error": str(e)})

        # Clients
        if clients:
            try:
                upsert("kf_clients", [
                    {
                        "id":         c["id"],
                        "user_id":    user_id,
                        "name":       c.get("name", ""),
                        "phone":      c.get("phone", ""),
                        "address":    c.get("address", ""),
                        "id_num":     c.get("idNum", ""),
                        "occupation": c.get("occupation", ""),
                        "created_at": c.get("createdAt", ""),
                    }
                    for c in clients
                ])
            except Exception as e:
                errors.append({"table": "kf_clients", "error": str(e)})

        # Loans
        if loans:
            try:
                upsert("kf_loans", [
                    {
                        "id":            l["id"],
                        "user_id":       user_id,
                        "client_id":     l["clientId"],
                        "principal":     l.get("principal", 0),
                        "interest_rate": l.get("interestRate", 0),
                        "duration":      l.get("duration", 0),
                        "type":          l.get("type", "monthly"),
                        "start_date":    l.get("startDate", ""),
                        "status":        l.get("status", "active"),
                        "created_at":    l.get("createdAt", ""),
                    }
                    for l in loans
                ])
            except Exception as e:
                errors.append({"table": "kf_loans", "error": str(e)})

        # Payments
        if payments:
            try:
                upsert("kf_payments", [
                    {
                        "id":         p["id"],
                        "user_id":    user_id,
                        "loan_id":    p["loanId"],
                        "amount":     p.get("amount", 0),
                        "date":       p.get("date", ""),
                        "note":       p.get("note", ""),
                        "created_at": p.get("createdAt", ""),
                    }
                    for p in payments
                ])
            except Exception as e:
                errors.append({"table": "kf_payments", "error": str(e)})

        return {"success": len(errors) == 0, "errors": errors}

    # ── Full Restore (pull all cloud data to local) ────────────
    @staticmethod
    def pull_backup(user_id: str):
        """Pull entire user data from Supabase."""
        clients  = select("kf_clients",  {"user_id": user_id})
        loans    = select("kf_loans",    {"user_id": user_id})
        payments = select("kf_payments", {"user_id": user_id})
        settings = select("kf_settings", {"user_id": user_id}, single=True) or {}

        # Remap snake_case → camelCase for the frontend
        return {
            "clients": [
                {
                    "id":         c["id"],
                    "name":       c["name"],
                    "phone":      c["phone"],
                    "address":    c.get("address", ""),
                    "idNum":      c.get("id_num", ""),
                    "occupation": c.get("occupation", ""),
                    "createdAt":  c.get("created_at", ""),
                }
                for c in clients
            ],
            "loans": [
                {
                    "id":           l["id"],
                    "clientId":     l["client_id"],
                    "principal":    float(l["principal"]),
                    "interestRate": float(l.get("interest_rate", 0)),
                    "duration":     l["duration"],
                    "type":         l.get("type", "monthly"),
                    "startDate":    l.get("start_date", ""),
                    "status":       l.get("status", "active"),
                    "createdAt":    l.get("created_at", ""),
                }
                for l in loans
            ],
            "payments": [
                {
                    "id":        p["id"],
                    "loanId":    p["loan_id"],
                    "amount":    float(p["amount"]),
                    "date":      p.get("date", ""),
                    "note":      p.get("note", ""),
                    "createdAt": p.get("created_at", ""),
                }
                for p in payments
            ],
            "settings": {
                "financierName": settings.get("financier_name", ""),
                "businessName":  settings.get("business_name", ""),
                "theme":         settings.get("theme", "dark"),
                "lang":          settings.get("lang", "en"),
                "extraClients":  settings.get("extra_clients", 0),
            }
        }
