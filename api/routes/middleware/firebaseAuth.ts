import { NextFunction, Request, Response } from 'express';
import admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

export const authenticateFirebaseToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    let authHeader = req.headers.authorization;
    if (process.env.MODE === 'dev') {
        if (process.env.FIREBASE_TOKEN) {
            authHeader = `Bearer ${process.env.FIREBASE_TOKEN}`;
        }
    }
    else {
        authHeader = req.headers.authorization;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken; // Attach user info to request
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized', error: (error as Error).message });
    }
};
