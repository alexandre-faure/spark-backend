import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: cert("./serviceAccountKey.json"),
    });
}

export default admin;