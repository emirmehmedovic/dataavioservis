import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    res.sendStatus(401);
    return;
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    req.user = user as any;
    next();
  });
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ message: 'Nedozvoljen pristup.' });
      return;
    }
    next();
  };
}

// Nova funkcija: provjera više uloga
export function checkRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Nedozvoljen pristup.' });
      return;
    }
    next();
  };
}

