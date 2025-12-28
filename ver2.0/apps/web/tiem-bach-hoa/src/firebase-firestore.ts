import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { app } from './firebase-base';

export const db = getFirestore(app);
export const storage = getStorage(app);
// analytics may fail in some environments — export lazily if needed
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
