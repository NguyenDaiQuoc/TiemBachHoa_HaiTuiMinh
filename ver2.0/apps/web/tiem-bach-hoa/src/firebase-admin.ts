import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { app as clientApp } from './firebase-base';

// Create a named admin app to avoid conflicts
const adminApp = initializeApp((clientApp as any).options || (clientApp as any), 'admin');

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
