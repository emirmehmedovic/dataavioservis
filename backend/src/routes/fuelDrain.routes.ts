import express from 'express';
import { createFuelDrainRecord, getAllFuelDrainRecords, getFuelDrainRecordById } from '../controllers/fuelDrain.controller';
import { reverseFuelDrainTransaction } from '../controllers/fuelDrainReverse.controller';
import { authenticateToken } from '../middleware/auth';
import { validateDrainRecord } from '../validators/fuelDrain.validator';
import { validateDrainReverseTransaction } from '../validators/fuelDrainReverse.validator';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/fuel/drains - Create a new fuel drain record (formerly /api/fuel/drain)
// Temporarily removed validateDrainRecord for debugging
router.post('/', 
  function logRequestBody(req: express.Request, res: express.Response, next: express.NextFunction): void {
    console.log('[fuelDrain.routes.ts] Inline middleware for POST / reached. Request body:', req.body);
    next();
  },
  /* validateDrainRecord, */ 
  createFuelDrainRecord
);

// GET /api/fuel/drains/records - Get all fuel drain records (formerly /api/fuel/drain-records)
router.get('/records', getAllFuelDrainRecords);

// GET /api/fuel/drains/records/:id - Get a specific fuel drain record (formerly /api/fuel/drain-records/:id)
router.get('/records/:id', getFuelDrainRecordById);

// POST /api/fuel/drains/reverse - Process a reverse transaction for drained fuel
router.post('/reverse', 
  function logRequestBody(req: express.Request, res: express.Response, next: express.NextFunction): void {
    console.log('[fuelDrain.routes.ts] Inline middleware for POST /reverse reached. Request body:', req.body);
    next();
  },
  validateDrainReverseTransaction,
  reverseFuelDrainTransaction
);

export default router;
