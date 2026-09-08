import { Script, TeleprompterSettings, FloatingModeState } from '../types';
import { DEFAULT_SETTINGS, DEMO_SCRIPT } from '../data/demoScript';

const DB_NAME = 'teleprompter_pro_db';
const DB_VERSION = 1;
const STORE_SCRIPTS = 'scripts';
const STORE_SETTINGS = 'settings';
const KEY_LAST_SCRIPT = 'last_opened_script_id';
const KEY_FLOATING_MODE_ACTIVE = 'FLOATING_MODE_ACTIVE';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_SCRIPTS)) {
        const scriptStore = db.createObjectStore(STORE_SCRIPTS, { keyPath: 'id' });
        scriptStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        scriptStore.createIndex('isFavorite', 'isFavorite', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

export const StorageService = {
  async init(): Promise<void> {
    try {
      const scripts = await this.getScripts();
      if (scripts.length === 0) {
        // Seed demo script
        await this.saveScript(DEMO_SCRIPT);
        await this.setLastOpenedScriptId(DEMO_SCRIPT.id);
      }
    } catch (err) {
      console.warn('Failed to initialize DB, falling back to localStorage if needed', err);
    }
  },

  async getScripts(): Promise<Script[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SCRIPTS, 'readonly');
        const store = tx.objectStore(STORE_SCRIPTS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as Script[]) || [];
          list.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      const stored = localStorage.getItem('tp_scripts');
      return stored ? JSON.parse(stored) : [DEMO_SCRIPT];
    }
  },

  async getScript(id: string): Promise<Script | null> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SCRIPTS, 'readonly');
        const store = tx.objectStore(STORE_SCRIPTS);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as Script) || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      const scripts = await this.getScripts();
      return scripts.find((s) => s.id === id) || null;
    }
  },

  async saveScript(script: Script): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SCRIPTS, 'readwrite');
        const store = tx.objectStore(STORE_SCRIPTS);
        const req = store.put(script);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      const scripts = await this.getScripts();
      const idx = scripts.findIndex((s) => s.id === script.id);
      if (idx >= 0) {
        scripts[idx] = script;
      } else {
        scripts.push(script);
      }
      localStorage.setItem('tp_scripts', JSON.stringify(scripts));
    }
  },

  async deleteScript(id: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SCRIPTS, 'readwrite');
        const store = tx.objectStore(STORE_SCRIPTS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      let scripts = await this.getScripts();
      scripts = scripts.filter((s) => s.id !== id);
      localStorage.setItem('tp_scripts', JSON.stringify(scripts));
    }
  },

  async duplicateScript(id: string): Promise<Script | null> {
    const original = await this.getScript(id);
    if (!original) return null;

    const copy: Script = {
      ...original,
      id: 'script_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: `${original.title} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastPosition: 0,
    };

    await this.saveScript(copy);
    return copy;
  },

  async getSettings(): Promise<TeleprompterSettings> {
    try {
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get('global_settings');
        req.onsuccess = () => {
          if (req.result) {
            resolve({ ...DEFAULT_SETTINGS, ...req.result });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch (err) {
      const stored = localStorage.getItem('tp_settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: TeleprompterSettings): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SETTINGS, 'readwrite');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.put(settings, 'global_settings');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      localStorage.setItem('tp_settings', JSON.stringify(settings));
    }
  },

  async getLastOpenedScriptId(): Promise<string | null> {
    return localStorage.getItem(KEY_LAST_SCRIPT);
  },

  async setLastOpenedScriptId(id: string): Promise<void> {
    localStorage.setItem(KEY_LAST_SCRIPT, id);
  },

  async saveFloatingState(state: FloatingModeState): Promise<void> {
    try {
      localStorage.setItem(KEY_FLOATING_MODE_ACTIVE, JSON.stringify(state));
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readwrite');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.put(state, KEY_FLOATING_MODE_ACTIVE);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (err) {
      localStorage.setItem(KEY_FLOATING_MODE_ACTIVE, JSON.stringify(state));
    }
  },

  async getFloatingState(): Promise<FloatingModeState | null> {
    try {
      // First check localStorage for synchronous fast restore
      const local = localStorage.getItem(KEY_FLOATING_MODE_ACTIVE);
      if (local) {
        return JSON.parse(local);
      }
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readonly');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.get(KEY_FLOATING_MODE_ACTIVE);
        req.onsuccess = () => resolve((req.result as FloatingModeState) || null);
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      const local = localStorage.getItem(KEY_FLOATING_MODE_ACTIVE);
      return local ? JSON.parse(local) : null;
    }
  },

  async clearFloatingState(): Promise<void> {
    try {
      localStorage.removeItem(KEY_FLOATING_MODE_ACTIVE);
      const db = await getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_SETTINGS, 'readwrite');
        const store = tx.objectStore(STORE_SETTINGS);
        const req = store.delete(KEY_FLOATING_MODE_ACTIVE);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch (err) {
      localStorage.removeItem(KEY_FLOATING_MODE_ACTIVE);
    }
  },

  async exportAllData(): Promise<string> {
    const scripts = await this.getScripts();
    const settings = await this.getSettings();
    return JSON.stringify({ version: 1, exportedAt: Date.now(), scripts, settings }, null, 2);
  },

  async importAllData(jsonString: string): Promise<number> {
    const data = JSON.parse(jsonString);
    if (!data.scripts || !Array.isArray(data.scripts)) {
      throw new Error('Formato de backup inválido');
    }
    let count = 0;
    for (const s of data.scripts) {
      if (s && s.id && s.title) {
        await this.saveScript(s);
        count++;
      }
    }
    if (data.settings) {
      await this.saveSettings(data.settings);
    }
    return count;
  },
};
