import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { body } from 'express-validator';
import * as LocationController from '../controllers/location.controller';

const router = Router();

const locationValidationRules = [
  body('name').trim().notEmpty().withMessage('Naziv lokacije je obavezan.'),
  body('address').optional().trim(),
  body('companyTaxId').optional().trim().isString().withMessage('Poreski broj kompanije mora biti string.'),
];

const locationUpdateValidationRules = [
  body('name').optional().trim().notEmpty().withMessage('Naziv lokacije je obavezan.'),
  body('address').optional().trim(),
  body('companyTaxId').optional().trim().isString().withMessage('Poreski broj kompanije mora biti string.'),
];

// Get all locations
router.get('/', authenticateToken, LocationController.getAllLocations);

// Get location by id
router.get('/:id', authenticateToken, LocationController.getLocationById);

// Create location (ADMIN only)
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  locationValidationRules,
  LocationController.createLocation
);

// Update location (ADMIN only)
router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  locationUpdateValidationRules,
  LocationController.updateLocation
);

// Delete location (ADMIN only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  LocationController.deleteLocation
);

export default router;
