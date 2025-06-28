import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

const base64Key = process.env.SERVICE_ACCOUNT_KEY_BASE64;

if (!base64Key) throw new Error('Missing Firebase service account key');

const keyPath = path.join('/tmp', 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
    fs.writeFileSync(keyPath, Buffer.from(base64Key, 'base64'));
}

if (getApps().length === 0) {
    initializeApp({
        credential: cert(require(keyPath)),
    });
}

export const firebaseDb = getFirestore();
