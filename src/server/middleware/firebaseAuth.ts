// src/middleware/firebaseAuth.ts
import { Request, Response, NextFunction } from 'express';
import admin from '../firebase';

export interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

export const authenticateFirebaseToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Temporarily without checking for a valid token
    // TODO: Validate the token with Firebase Admin SDK
    next();

    // try {
    //     const decodedToken = await admin.auth().verifyIdToken(token);
    //     req.user = decodedToken; // Attach user info to request
    //     next();
    // } catch (error) {
    //     return res.status(401).json({ message: 'Unauthorized', error: (error as Error).message });
    // }
};
