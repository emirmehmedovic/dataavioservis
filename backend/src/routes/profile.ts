import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { body } from 'express-validator';
import { updateUserPassword } from '../controllers/profile.controller';

const router = Router();

// PUT /profile/password - Update current user's password
router.put('/password', 
  authenticateToken,
  [
    body('currentPassword').isLength({ min: 6 }).withMessage('Trenutna lozinka mora imati najmanje 6 karaktera.'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nova lozinka mora imati najmanje 6 karaktera.')
  ],
  updateUserPassword
);

export default router;
