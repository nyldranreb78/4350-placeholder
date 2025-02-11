import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include 'user'
interface AuthenticatedRequest extends Request {
    user?: { id: string }; // Adjust this type to match your actual user object
}

function auth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (req.user?.id) return next(); 

    res.sendStatus(401);
}

export default auth;


