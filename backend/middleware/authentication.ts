import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: any; // Replace 'any' with a proper User type
}

interface DecodedToken {
  id: string;
}

async function authentication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    req.user = undefined;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as DecodedToken;
    const user = await User.findById(decoded.id).select('-password -refresh_token').lean().exec();
    req.user = user || undefined; // If user not found, set undefined
  } catch (err) {
    req.user = undefined;
  }

  return next();
}

export default authentication;

