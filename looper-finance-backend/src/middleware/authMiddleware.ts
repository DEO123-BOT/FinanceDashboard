import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: string | JwtPayload;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next(); // ✅ Do not return anything
  } catch (error) {
    res.status(403).json({ message: 'Forbidden: Invalid token' });
  }
};
