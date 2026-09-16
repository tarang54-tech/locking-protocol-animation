/**
 * history.js — Simulation History Manager
 * Uses SQLite via REST API (fetch). Falls back to localStorage if server unavailable.
 */
class HistoryManager {
  constructor(storageKey = 'lockingProtocolHistory') {
    this.storageKey = storageKey;
    this.cache = [];       // in-memory cache for sync access
    this.useAPI = true;    // optimistically try API first
  }

  _uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /* ──────── SAVE ──────── */
  async save(entry) {
    entry.id = entry.id || this._uuid();
    entry.timestamp = entry.timestamp || new Date().toISOString();

    try {
      const resp = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      if (!resp.ok) throw new Error('API error');
      this.useAPI = true;
    } catch (e) {
      this.useAPI = false;
      this._saveLocal(entry);
    }
    return entry.id;
  }

  /* ──────── GET ALL ──────── */
  async getAll() {
    try {
      const resp = await fetch('/api/history');
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      this.cache = data;
      this.useAPI = true;
      return data;
    } catch (e) {
      this.useAPI = false;
      return this._getAllLocal();
    }
  }

  /* ──────── GET BY ID ──────── */
  async getById(id) {
    try {
      const resp = await fetch(`/api/history/${id}`);
      if (!resp.ok) throw new Error('API error');
      return await resp.json();
    } catch (e) {
      this.useAPI = false;
      return this._getAllLocal().find(entry => entry.id === id) || null;
    }
  }

  /* ──────── DELETE BY ID ──────── */
  async deleteById(id) {
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
    } catch (e) {
      this.useAPI = false;
      let history = this._getAllLocal().filter(entry => entry.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    }
  }

  /* ──────── CLEAR ALL ──────── */
  async clearAll() {
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (e) {
      this.useAPI = false;
      localStorage.removeItem(this.storageKey);
    }
  }

  /* ──────── COUNT ──────── */
  async getCount() {
    const entries = await this.getAll();
    return entries.length;
  }

  /* ──────── localStorage Fallbacks ──────── */
  _saveLocal(entry) {
    let history = this._getAllLocal();
    history.unshift(entry);
    if (history.length > 50) history = history.slice(0, 50);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  _getAllLocal() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
}

window.HistoryManager = HistoryManager;
