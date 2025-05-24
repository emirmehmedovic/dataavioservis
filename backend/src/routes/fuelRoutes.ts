import express from 'express';
import * as fuelTankController from '../controllers/fuelTankController';
import * as fuelTankRefillController from '../controllers/fuelTankRefillController';
import * as airlineController from '../controllers/airlineController';
import * as fuelReportController from '../controllers/fuelReportController';
import * as fuelIntakeRecordController from '../controllers/fuelIntakeRecord.controller';
import { authenticateToken, checkRole } from '../middleware/auth';
import fuelTransferToTankerRoutes from './fuelTransferToTanker.routes';
import fuelingOperationRoutes from './fuelingOperation.routes';

const router = express.Router();

// Fuel Tank routes
router.get('/tanks', authenticateToken, fuelTankController.getAllFuelTanks);
router.get('/tanks/:id', authenticateToken, fuelTankController.getFuelTankById);
router.post('/tanks', authenticateToken, checkRole(['ADMIN', 'FUEL_OPERATOR']), fuelTankController.createFuelTank);
router.put('/tanks/:id', authenticateToken, checkRole(['ADMIN', 'FUEL_OPERATOR']), fuelTankController.updateFuelTank);
router.delete('/tanks/:id', authenticateToken, checkRole(['ADMIN']), fuelTankController.deleteFuelTank);

// Fuel Tank Refill routes
router.get('/tanks/:id/refills', authenticateToken, fuelTankRefillController.getTankRefills);
router.post('/tanks/:id/refills', authenticateToken, checkRole(['ADMIN', 'FUEL_OPERATOR']), fuelTankRefillController.createTankRefill);

// Mount Fueling Operation routes
router.use('/operations', authenticateToken, checkRole(['ADMIN', 'FUEL_OPERATOR']), fuelingOperationRoutes);

// Airline routes
router.get('/airlines', authenticateToken, airlineController.getAllAirlines);
router.get('/airlines/:id', authenticateToken, airlineController.getAirlineById);
router.post('/airlines', authenticateToken, checkRole(['ADMIN', 'FUEL_OPERATOR']), airlineController.createAirline);
router.put('/airlines/:id', authenticateToken, checkRole(['ADMIN', 'FUEL_OPERATOR']), airlineController.updateAirline);
router.delete('/airlines/:id', authenticateToken, checkRole(['ADMIN']), airlineController.deleteAirline);

// Fuel Intake Record routes
router.post('/intake-records', 
    authenticateToken, 
    checkRole(['ADMIN', 'FUEL_OPERATOR']),
    fuelIntakeRecordController.createFuelIntakeRecord
);
router.get('/intake-records', 
    authenticateToken, 
    fuelIntakeRecordController.getAllFuelIntakeRecords
);
router.get('/intake-records/:id', 
    authenticateToken, 
    fuelIntakeRecordController.getFuelIntakeRecordById
);
router.put('/intake-records/:id', 
    authenticateToken, 
    checkRole(['ADMIN', 'FUEL_OPERATOR']),
    fuelIntakeRecordController.updateFuelIntakeRecord
);
router.delete('/intake-records/:id', 
    authenticateToken, 
    checkRole(['ADMIN']),
    fuelIntakeRecordController.deleteFuelIntakeRecord
);

// Fuel Reports routes
router.get('/reports/statistics', authenticateToken, (req, res) => fuelReportController.getFuelStatistics(req, res));
router.get('/reports/export', authenticateToken, (req, res) => fuelReportController.exportFuelData(req, res));

// Mount the Fixed-to-Mobile transfer routes
router.use('/transfers/fixed-to-mobile', authenticateToken, checkRole(['ADMIN', 'FUEL_OPERATOR']), fuelTransferToTankerRoutes);

export default router; 