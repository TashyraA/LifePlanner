import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc, onSnapshot, collection, writeBatch } from 'firebase/firestore';
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
 * This provides a simpler approach - sync everything at once rather than per-context
 */
export function useDataSync() {
  const { user, loading } = useFirebaseAuth();
  const hasInitialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string | null>(null);

  // Get the user's data document reference
  const getDocRef = useCallback(() => {
    if (!user) return null;
    return doc(db, 'users', user.uid, 'appData', 'sync');
  }, [user]);

  // Save all localStorage data to Firestore
  const saveToCloud = useCallback(async () => {
    const docRef = getDocRef();
    if (!docRef) {
      console.error('No document reference - user not logged in?');
      throw new Error('Not logged in');
    }

    const allData: Record<string, any> = {};
    
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          allData[key] = JSON.parse(stored);
        } catch {
          allData[key] = stored;
        }
      }
    });

    console.log('Attempting to save data:', Object.keys(allData));

    try {
      await setDoc(docRef, {
        ...allData,
        updatedAt: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
      });
      lastSyncRef.current = JSON.stringify(allData);
      console.log('Data synced to cloud successfully!');
    } catch (error) {
      console.error('Error saving to cloud:', error);
      throw error;
    }
  }, [getDocRef]);

  // Load data from Firestore into localStorage
  const loadFromCloud = useCallback(async (): Promise<boolean> => {
    const docRef = getDocRef();
    if (!docRef) return false;

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        
        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
          if (cloudData[key]) {
            localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
          }
        });

        lastSyncRef.current = JSON.stringify(cloudData);
        return true;
      }
    } catch (error) {
      console.error('Error loading from cloud:', error);
    }
    return false;
  }, [getDocRef]);

  // Migrate existing localStorage data to Firestore (first-time sync)
  const migrateToCloud = useCallback(async () => {
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      // Check if cloud already has data
      const docSnap = await getDoc(docRef);
      
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
        description: 'Could not sync your data. Please try again.',
      });
    }
  }, [getDocRef, loadFromCloud, saveToCloud]);

  // Listen for changes in localStorage and sync to cloud (debounced)
  const scheduleSync = useCallback(() => {
    if (!user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToCloud();
    }, 2000); // Debounce saves by 2 seconds
  }, [user, saveToCloud]);

  // Listen for real-time updates from Firestore (other devices)
  useEffect(() => {
    if (!user || loading) return;

    const docRef = getDocRef();
    if (!docRef) return;

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && hasInitialized.current) {
        const cloudData = docSnap.data();
        const cloudHash = JSON.stringify(cloudData);
        
        // Only update if data is different (from another device)
        if (cloudHash !== lastSyncRef.current) {
          Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
            if (cloudData[key]) {
              localStorage.setItem(storageKey, JSON.stringify(cloudData[key]));
            }
          });
          lastSyncRef.current = cloudHash;
          
          // Notify user and optionally reload
          toast.info('Data updated from another device', {
            description: 'Refresh to see the latest changes.',
            action: {
              label: 'Refresh',
              onClick: () => window.location.reload(),
            },
          });
        }
      }
    }, (error) => {
      console.error('Firestore listener error:', error);
    });

    return () => unsubscribe();
  }, [user, loading, getDocRef]);

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
