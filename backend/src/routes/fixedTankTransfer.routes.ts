import { Router } from 'express';
import {
  createFixedTankTransfer,
  getAllFixedTankTransfers,
  getFixedTankTransferById,
  updateFixedTankTransfer,
  deleteFixedTankTransfer,
} from '../controllers/fixedTankTransfer.controller';

const router = Router();

// Base path for these routes will be /api/fuel/transfers

router.post('/', createFixedTankTransfer);
router.get('/', getAllFixedTankTransfers);
router.get('/:id', getFixedTankTransferById);
router.put('/:id', updateFixedTankTransfer);
router.delete('/:id', deleteFixedTankTransfer);

export default router;
