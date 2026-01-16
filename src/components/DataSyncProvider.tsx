import React from 'react';
import { useDataSync } from '../hooks/useDataSync';

// This component initializes the data sync
// Just needs to be mounted inside FirebaseAuthProvider
export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize the sync hook
  useDataSync();
  
  return <>{children}</>;
};
