/**
 * KaasFlow — Supabase Cloud Sync Service (Frontend)
 * ===================================================
 * Talks to the Flask backend (/api/sync/*) which in turn
 * talks to Supabase using the secure service-role key.
 *
 * Usage (called from app.js):
 *   KFSync.backup()   → push all local data to cloud
 *   KFSync.restore()  → pull cloud data back + merge into localStorage
 *   KFSync.status()   → check if backend+Supabase are reachable
 */

(function (global) {
  'use strict';

  const API_BASE = '/api/sync';
  const LAST_SYNC_KEY = 'kf_last_sync';

  // ─── Auth token helper ───────────────────────────────────────
  function _token() {
    const session = JSON.parse(localStorage.getItem('kf_session') || '{}');
    return session.token || null;
  }

  function _headers() {
    const tok = _token();
    return {
      'Content-Type':  'application/json',
      'Authorization': tok ? `Bearer ${tok}` : '',
    };
  }

  // ─── Core API calls ──────────────────────────────────────────
  async function _post(endpoint, body) {
    const r = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify(body),
    });
    return r.json();
  }

  async function _get(endpoint) {
    const r = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'GET',
      headers: _headers(),
    });
    return r.json();
  }

  // ─── Public API ──────────────────────────────────────────────

  /**
   * Push all localStorage data to Supabase via backend.
   * Returns { success, errors }
   */
  async function backup(silent = false) {
    const payload = {
      clients:  JSON.parse(localStorage.getItem('kf_clients')  || '[]'),
      loans:    JSON.parse(localStorage.getItem('kf_loans')    || '[]'),
      payments: JSON.parse(localStorage.getItem('kf_payments') || '[]'),
      settings: JSON.parse(localStorage.getItem('kf_settings') || '{}'),
    };

    try {
      const result = await _post('backup', payload);
      if (result.success) {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        if (!silent) _toast('☁️ Backup saved to cloud!', 'success');
      } else {
        const errCount = (result.errors || []).length;
        if (!silent) _toast(`⚠️ Backup partial — ${errCount} table(s) had errors`, 'warning');
      }
      return result;
    } catch (e) {
      if (!silent) _toast('❌ Backup failed — check connection', 'error');
      return { success: false, errors: [String(e)] };
    }
  }

  /**
   * Pull cloud data from Supabase and merge into localStorage.
   * Cloud data WINS for any record that exists on both sides.
   * Returns the pulled data object.
   */
  async function restore() {
    try {
      const res = await _get('restore');
      if (!res.success) {
        _toast('❌ Restore failed: ' + (res.error || 'Unknown error'), 'error');
        return null;
      }

      const { clients, loans, payments, settings } = res.data;

      // Merge strategy: cloud records override local by id
      const merge = (localKey, cloudArr, idKey = 'id') => {
        const local = JSON.parse(localStorage.getItem(localKey) || '[]');
        const map   = {};
        local.forEach(r => { map[r[idKey]] = r; });
        cloudArr.forEach(r => { map[r[idKey]] = r; }); // cloud wins
        localStorage.setItem(localKey, JSON.stringify(Object.values(map)));
      };

      merge('kf_clients',  clients);
      merge('kf_loans',    loans);
      merge('kf_payments', payments);

      // Settings: merge object keys (cloud wins)
      if (settings && Object.keys(settings).length > 0) {
        const localSettings = JSON.parse(localStorage.getItem('kf_settings') || '{}');
        localStorage.setItem('kf_settings', JSON.stringify({ ...localSettings, ...settings }));
      }

      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      _toast('☁️ Data restored from cloud!', 'success');

      return res.data;
    } catch (e) {
      _toast('❌ Restore failed — check connection', 'error');
      return null;
    }
  }

  /**
   * Check if the backend + Supabase are reachable.
   */
  async function status() {
    try {
      return await _get('status');
    } catch {
      return { supabase_configured: false };
    }
  }

  /**
   * Return a formatted string of the last sync time.
   */
  function lastSyncLabel() {
    const ts = localStorage.getItem(LAST_SYNC_KEY);
    if (!ts) return 'Never synced';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  // ─── Auto-backup on page close ───────────────────────────────
  window.addEventListener('beforeunload', () => {
    if (_token()) {
      // Best-effort fire-and-forget — browsers allow a brief delay for beacon
      const payload = JSON.stringify({
        clients:  JSON.parse(localStorage.getItem('kf_clients')  || '[]'),
        loans:    JSON.parse(localStorage.getItem('kf_loans')    || '[]'),
        payments: JSON.parse(localStorage.getItem('kf_payments') || '[]'),
        settings: JSON.parse(localStorage.getItem('kf_settings') || '{}'),
      });
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon &&
        navigator.sendBeacon(`${API_BASE}/backup`, blob);
    }
  });

  // ─── Tiny toast helper (works before app.js showToast is ready) ─
  function _toast(msg, type = 'info') {
    if (typeof showToast === 'function') {
      showToast(msg, type);
    } else {
      console.info('[KFSync]', msg);
    }
  }

  // ─── Expose globally ─────────────────────────────────────────
  global.KFSync = { backup, restore, status, lastSyncLabel };

})(window);
