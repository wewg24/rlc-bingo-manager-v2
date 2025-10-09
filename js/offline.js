// Offline functionality
class OfflineManager {
    constructor() {
        this.db = null;
        this.initDB();
    }
    
    async initDB() {
        return new Promise((resolve, reject) => {
            // Clear old database if version mismatch
            const deleteReq = indexedDB.deleteDatabase('RLCBingo');
            
            deleteReq.onsuccess = () => {
                const request = indexedDB.open('RLCBingo', 2); // Use version 2
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve();
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object stores
                    if (!db.objectStoreNames.contains('occasions')) {
                        db.createObjectStore('occasions', { keyPath: 'occasionId' });
                    }
                    
                    if (!db.objectStoreNames.contains('drafts')) {
                        db.createObjectStore('drafts', { keyPath: 'id' });
                    }
                    
                    if (!db.objectStoreNames.contains('sync_queue')) {
                        db.createObjectStore('sync_queue', { autoIncrement: true });
                    }
                };
            };
        });
    }
    
    async saveOccasion(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['occasions'], 'readwrite');
            const store = transaction.objectStore('occasions');
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getOccasions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['occasions'], 'readonly');
            const store = transaction.objectStore('occasions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveDraft(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['drafts'], 'readwrite');
            const store = transaction.objectStore('drafts');
            const request = store.put({ id: 'current', data, timestamp: new Date() });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getDraft() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['drafts'], 'readonly');
            const store = transaction.objectStore('drafts');
            const request = store.get('current');
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async addToSyncQueue(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            const request = store.add(item);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getSyncQueue() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sync_queue'], 'readonly');
            const store = transaction.objectStore('sync_queue');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async clearSyncQueue() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sync_queue'], 'readwrite');
            const store = transaction.objectStore('sync_queue');
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Detect if we're on GitHub Pages and adjust path accordingly
        const swPath = (window.location.hostname === 'wewg24.github.io' || window.location.pathname.includes('/rlc-bingo-manager/'))
            ? '/rlc-bingo-manager/sw.js' 
            : '/sw.js';
            
        navigator.serviceWorker.register(swPath)
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    });
}
