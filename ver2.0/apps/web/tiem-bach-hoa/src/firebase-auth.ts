import { getAuth } from 'firebase/auth';
import { app, firebaseApiKey } from './firebase-base';

export const auth = getAuth(app);
export { app as firebaseApp, firebaseApiKey };
