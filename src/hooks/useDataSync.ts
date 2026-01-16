import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { toast } from 'sonner';

// All localStorage keys used by the app
const STORAGE_KEYS = {
  planner: 'planner_data',
  finance: 'finance_data',
  fitness: 'fitness_data',
  meals: 'meal_data',
  college: 'college_data',
  notebook: 'notebook_data',
  budget: 'budget_data',
};

/**
 * Hook to handle syncing ALL app data with Firebase
 * Data is split across multiple documents to avoid 1MB limit
 */
export function useDataSync() {
  const { user, loading } = useFirebaseAuth();
  const hasInitialized = useRef(false);
  const lastSyncRef = useRef<Record<string, string>>({});

  // Get document reference for a specific data type
  const getDocRef = useCallback((dataType: string) => {
    if (!user) return null;
    return doc(db, 'users', user.uid, 'appData', dataType);
  }, [user]);

  // Save all localStorage data to Firestore (split across documents)
  const saveToCloud = useCallback(async () => {
    if (!user) {
      console.error('No user - not logged in');
      throw new Error('Not logged in');
    }

    const batch = writeBatch(db);
    let hasChanges = false;

    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        // Skip if data hasn't changed
        if (lastSyncRef.current[key] === stored) continue;
        
        try {
          const data = JSON.parse(stored);
          const docRef = doc(db, 'users', user.uid, 'appData', key);
          batch.set(docRef, {
            data,
            updatedAt: new Date().toISOString(),
          });
          lastSyncRef.current[key] = stored;
          hasChanges = true;
          console.log(`Queued ${key} for upload`);
        } catch (e) {
          console.error(`Failed to parse ${key}:`, e);
        }
      }
    }

    if (hasChanges) {
      try {
        await batch.commit();
        console.log('All data synced to cloud successfully!');
      } catch (error) {
        console.error('Error saving to cloud:', error);
        throw error;
      }
    } else {
      console.log('No changes to sync');
    }
  }, [user]);

  // Load data from Firestore into localStorage
  const loadFromCloud = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    let loadedAny = false;

    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      try {
        const docRef = doc(db, 'users', user.uid, 'appData', key);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const cloudData = docSnap.data().data;
          if (cloudData) {
            localStorage.setItem(storageKey, JSON.stringify(cloudData));
            lastSyncRef.current[key] = JSON.stringify(cloudData);
            loadedAny = true;
            console.log(`Loaded ${key} from cloud`);
          }
        }
      } catch (error) {
        console.error(`Error loading ${key} from cloud:`, error);
      }
    }

    return loadedAny;
  }, [user]);

  // Migrate existing localStorage data to Firestore (first-time sync)
  const migrateToCloud = useCallback(async () => {
    if (!user) return;

    try {
      // Check if cloud already has any data (check planner as indicator)
      const plannerRef = doc(db, 'users', user.uid, 'appData', 'planner');
      const docSnap = await getDoc(plannerRef);
      
      if (docSnap.exists()) {
        // Cloud has data - load it (this overwrites local)
        const loaded = await loadFromCloud();
        if (loaded) {
          toast.success('Data synced from cloud! ☁️', {
            description: 'Your data has been loaded from your account.',
          });
          // Trigger page reload to refresh all contexts
          window.location.reload();
        }
      } else {
        // No cloud data - upload localStorage data
        await saveToCloud();
        toast.success('Data backed up to cloud! ☁️', {
          description: 'Your local data has been synced to your account.',
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Could not sync your data.',
      });
    }
  }, [user, loadFromCloud, saveToCloud]);

  // Listen for changes in localStorage and sync to cloud (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const scheduleSync = useCallback(() => {
    if (!user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToCloud().catch(console.error);
    }, 2000); // Debounce saves by 2 seconds
  }, [user, saveToCloud]);

  // Initial sync when user logs in
  useEffect(() => {
    if (!user || loading || hasInitialized.current) return;

    hasInitialized.current = true;
    migrateToCloud();
  }, [user, loading, migrateToCloud]);

  // Listen for localStorage changes (from context updates)
  useEffect(() => {
    if (!user) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
        scheduleSync();
      }
    };

    // Also listen for custom event when contexts save
    const handleLocalSave = () => {
      scheduleSync();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localDataSaved', handleLocalSave);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localDataSaved', handleLocalSave);
    };
  }, [user, scheduleSync]);

  // Manual sync trigger - upload local data to cloud
  const forceSync = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to sync');
      return;
    }

    try {
      await saveToCloud();
      toast.success('Data uploaded to cloud! ☁️');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Sync failed');
    }
  }, [user, saveToCloud]);

  // Force download from cloud
  const forceDownload = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to sync');
      return;
    }

    try {
      const loaded = await loadFromCloud();
      if (loaded) {
        toast.success('Data downloaded from cloud! ☁️', {
          description: 'Refreshing page to load data...',
        });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.info('No cloud data found');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  }, [user, loadFromCloud]);

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    forceSync,
    forceDownload,
    loadFromCloud,
  };
}

// Helper to dispatch event when data is saved locally
export const notifyDataSaved = () => {
  window.dispatchEvent(new CustomEvent('localDataSaved'));
};
