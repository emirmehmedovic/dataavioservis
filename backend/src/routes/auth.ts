import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth';
import { register, login, getMe } from '../controllers/auth.controller';

const router = Router();

// Register (samo ADMIN može registrovati nove korisnike)
router.post(
  '/register',
  authenticateToken,
  requireRole('ADMIN'),
  [
    body('username').isLength({ min: 3 }).withMessage('Username mora imati bar 3 karaktera.'),
    body('password').isLength({ min: 6 }).withMessage('Password mora imati bar 6 karaktera.'),
    body('role').isIn(['ADMIN', 'SERVICER', 'FUEL_OPERATOR']).withMessage('Nevažeća uloga.')
  ],
  register
);

// Login
router.post(
  '/login',
  [
    body('username').isLength({ min: 3 }).withMessage('Username mora imati bar 3 karaktera.'),
    body('password').isLength({ min: 6 }).withMessage('Password mora imati bar 6 karaktera.')
  ],
  login
);

// Get current user (auth required)
router.get('/me', authenticateToken, getMe);

export default router;
