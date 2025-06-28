import { initializeApp, cert, getApps } from 'firebase-admin/app';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../../serviceAccountKey.json';

if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount as any),
    });
}

export const firebaseDb = getFirestore();
export { admin };