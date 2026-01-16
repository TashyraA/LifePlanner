import { useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

interface UseFirestoreSyncOptions<T> {
  collectionName: string;
  localStorageKey: string;
  initialData: T;
  onDataChange?: (data: T) => void;
}

/**
 * Hook to sync local state with Firestore
 * - When user is logged in: syncs to/from Firestore
 * - When user is not logged in: uses localStorage as fallback
 */
export function useFirestoreSync<T>({
  collectionName,
  localStorageKey,
  initialData,
  onDataChange,
}: UseFirestoreSyncOptions<T>) {
  const { user } = useFirebaseAuth();
  const isInitialLoad = useRef(true);

  // Get document reference for the current user
  const getDocRef = useCallback(() => {
    if (!user) return null;
    return doc(db, 'users', user.uid, collectionName, 'data');
  }, [user, collectionName]);

  // Save data to Firestore (debounced in the context that uses this)
  const saveToFirestore = useCallback(async (data: T) => {
    const docRef = getDocRef();
    if (!docRef) return;

    try {
      await setDoc(docRef, {
        data,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error saving ${collectionName} to Firestore:`, error);
    }
  }, [getDocRef, collectionName]);

  // Load data from Firestore
  const loadFromFirestore = useCallback(async (): Promise<T | null> => {
    const docRef = getDocRef();
    if (!docRef) return null;

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().data as T;
      }
    } catch (error) {
      console.error(`Error loading ${collectionName} from Firestore:`, error);
    }
    return null;
  }, [getDocRef, collectionName]);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    if (!user) {
      isInitialLoad.current = true;
      return;
    }

    const docRef = getDocRef();
    if (!docRef) return;

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && !isInitialLoad.current) {
        const firestoreData = docSnap.data().data as T;
        onDataChange?.(firestoreData);
      }
      isInitialLoad.current = false;
    }, (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
    });

    return () => unsubscribe();
  }, [user, getDocRef, collectionName, onDataChange]);

  // Migrate localStorage data to Firestore when user first logs in
  const migrateLocalStorageToFirestore = useCallback(async () => {
    if (!user) return;

    const docRef = getDocRef();
    if (!docRef) return;

    try {
      // Check if Firestore already has data
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Firestore has data, load it
        const firestoreData = docSnap.data().data as T;
        onDataChange?.(firestoreData);
        return;
      }

      // No Firestore data, check localStorage
      const localData = localStorage.getItem(localStorageKey);
      if (localData) {
        const parsedData = JSON.parse(localData);
        // Upload localStorage data to Firestore
        await setDoc(docRef, {
          data: parsedData,
          updatedAt: new Date().toISOString(),
          migratedFrom: 'localStorage',
        });
        console.log(`Migrated ${collectionName} from localStorage to Firestore`);
      }
    } catch (error) {
      console.error(`Error migrating ${collectionName}:`, error);
    }
  }, [user, getDocRef, localStorageKey, collectionName, onDataChange]);

  return {
    saveToFirestore,
    loadFromFirestore,
    migrateLocalStorageToFirestore,
    isAuthenticated: !!user,
  };
}
