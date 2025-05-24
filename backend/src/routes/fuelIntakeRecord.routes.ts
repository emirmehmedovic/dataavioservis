import { Router } from 'express';
import {
  createFuelIntakeRecord,
  getAllFuelIntakeRecords,
  getFuelIntakeRecordById,
  updateFuelIntakeRecord,
  deleteFuelIntakeRecord,
} from '../controllers/fuelIntakeRecord.controller';

const router = Router();

// Base path for these routes will be /api/fuel/intake-records

router.post('/', createFuelIntakeRecord);
router.get('/', getAllFuelIntakeRecords);
router.get('/:id', getFuelIntakeRecordById);
router.put('/:id', updateFuelIntakeRecord);
router.delete('/:id', deleteFuelIntakeRecord);

export default router;
