// IndexedDB utility for storing large amounts of data (images, etc.)
const DB_NAME = 'LifePlannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'plannerData';

interface DBData {
  key: string;
  value: any;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✓ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          console.log('✓ IndexedDB object store created');
        }
      };
    });
  }

  async setItem(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put({ key, value });

      request.onsuccess = () => {
        console.log(`✓ Saved to IndexedDB: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to save to IndexedDB: ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  async getItem(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(key);

      request.onsuccess = () => {
        const result = request.result?.value;
        console.log(`✓ Retrieved from IndexedDB: ${key}`, result ? 'Found' : 'Not found');
        resolve(result);
      };

      request.onerror = () => {
        console.error(`❌ Failed to retrieve from IndexedDB: ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  async removeItem(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(key);

      request.onsuccess = () => {
        console.log(`✓ Removed from IndexedDB: ${key}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to remove from IndexedDB: ${key}`, request.error);
        reject(request.error);
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('✓ IndexedDB cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to clear IndexedDB', request.error);
        reject(request.error);
      };
    });
  }
}

export const indexedDB = new IndexedDBManager();