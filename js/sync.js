// Sync Manager
class SyncManager {
    constructor() {
        this.syncInProgress = false;
        this.offlineManager = new OfflineManager();
    }
    
    async syncData() {
        if (this.syncInProgress || !navigator.onLine) return;
        
        this.syncInProgress = true;
        
        try {
            const queue = await this.offlineManager.getSyncQueue();
            
            for (const item of queue) {
                try {
                    const response = await fetch(CONFIG.API_URL, {
                        method: 'POST',
                        body: new URLSearchParams({
                            action: item.action,
                            data: JSON.stringify(item.data)
                        })
                    });
                    
                    if (response.ok) {
                        // Remove from queue if successful
                        await this.removeFromQueue(item.id);
                    }
                } catch (error) {
                    console.error('Sync error for item:', error);
                }
            }
            
            // Clear successfully synced items
            const remainingQueue = await this.offlineManager.getSyncQueue();
            if (remainingQueue.length === 0) {
                console.log('All items synced successfully');
            }
            
        } finally {
            this.syncInProgress = false;
        }
    }
    
    async removeFromQueue(id) {
        return new Promise((resolve, reject) => {
            const request = this.offlineManager.db
                .transaction(['sync_queue'], 'readwrite')
                .objectStore('sync_queue')
                .delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    startAutoSync() {
        // Sync every 5 minutes when online
        setInterval(() => {
            if (navigator.onLine) {
                this.syncData();
            }
        }, 5 * 60 * 1000);
        
        // Sync when coming back online
        window.addEventListener('online', () => {
            setTimeout(() => this.syncData(), 1000);
        });
    }
}

// Initialize sync manager
document.addEventListener('DOMContentLoaded', () => {
    const syncManager = new SyncManager();
    syncManager.startAutoSync();
});
