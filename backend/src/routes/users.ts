import { Router } from 'express';
import { userManagementLimiter } from '../middleware/rateLimit';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { body } from 'express-validator';
import { getAllUsers, getUserById, updateUser, deleteUser, createUser } from '../controllers/user.controller';

const router = Router();

// GET /users (ADMIN only)
router.get('/', userManagementLimiter, authenticateToken, requireRole('ADMIN'), getAllUsers);

// POST /users (ADMIN only)
router.post('/', 
  userManagementLimiter,
  authenticateToken, 
  requireRole('ADMIN'), 
  [
    body('username').isLength({ min: 3 }).trim().escape().withMessage('Korisničko ime mora imati najmanje 3 karaktera.'),
    body('password').isLength({ min: 6 }).withMessage('Lozinka mora imati najmanje 6 karaktera.'),
    body('role').isIn(['ADMIN', 'SERVICER', 'FUEL_OPERATOR', 'KONTROLA', 'CARINA', 'AERODROM']).withMessage('Nevažeća uloga.')
  ],
  createUser
);

// GET /users/:id (ADMIN only)
router.get('/:id', userManagementLimiter, authenticateToken, requireRole('ADMIN'), getUserById);

// PUT /users/:id (ADMIN only)
router.put('/:id', userManagementLimiter, authenticateToken, requireRole('ADMIN'), [
  body('username').optional().isLength({ min: 3 }).withMessage('Username mora imati najmanje 3 karaktera.'),
  body('role').optional().isIn(['ADMIN', 'SERVICER', 'FUEL_OPERATOR', 'KONTROLA', 'CARINA', 'AERODROM']).withMessage('Nevažeća uloga.')
], updateUser);

// DELETE /users/:id (ADMIN only)
router.delete('/:id', userManagementLimiter, authenticateToken, requireRole('ADMIN'), deleteUser);

export default router;
