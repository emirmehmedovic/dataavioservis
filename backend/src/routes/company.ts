import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { body } from 'express-validator';
import * as CompanyController from '../controllers/company.controller';

const router = Router();

// Get all companies
router.get('/', authenticateToken, CompanyController.getAllCompanies);

// Get company by id
router.get('/:id', authenticateToken, CompanyController.getCompanyById);

// Create company (ADMIN only)
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  [
    body('name').isLength({ min: 2 }).withMessage('Ime firme mora imati najmanje 2 karaktera.')
  ],
  CompanyController.createCompany
);

// Update company (ADMIN only)
router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  [
    body('name').optional().isLength({ min: 2 }).withMessage('Ime firme mora imati najmanje 2 karaktera.')
  ],
  CompanyController.updateCompany
);

// Delete company (ADMIN only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  CompanyController.deleteCompany
);

export default router;
