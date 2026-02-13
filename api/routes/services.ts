/** FIREBASE SERVICE*/

import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

dotenv.config();


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

/** SUPABASE SERVICE*/
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '../config/env';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
);