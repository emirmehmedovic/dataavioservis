import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiLimiter } from './middleware/rateLimit';

import authRoutes from './routes/auth';
import companyRoutes from './routes/company';
import locationRoutes from './routes/location';
import vehicleRoutes from './routes/vehicle';
import usersRoutes from './routes/users';
import profileRoutes from './routes/profile';
import serviceRecordRoutes from './routes/serviceRecords';
import fuelRoutes from './routes/fuelRoutes';
import fixedStorageTankRoutes from './routes/fixedStorageTank.routes';
import fuelIntakeRecordRoutes from './routes/fuelIntakeRecord.routes';
import { fuelIntakeRecordDocumentsRoutes, fuelDocumentRoutes } from './routes/fuelIntakeDocument.routes';
import fixedTankTransferRoutes from './routes/fixedTankTransfer.routes';
import fuelingOperationRoutes from './routes/fuelingOperation.routes';
import fuelReceiptRoutes from './routes/fuelReceipt.routes';
import fuelTransferToTankerRoutes from './routes/fuelTransferToTanker.routes'; // Nove rute
import fuelDrainRoutes from './routes/fuelDrain.routes'; // Rute za istakanje goriva
import airlineRoutes from './routes/airline.routes'; // Import airline routes
import documentRoutes from './routes/document.routes'; // Import document routes
import activityRoutes from './routes/activity.routes';
import fuelPriceRuleRoutes from './routes/fuelPriceRule.routes'; // Dodane rute za pravila o cijenama goriva
import fuelProjectionPresetRoutes from './routes/fuelProjectionPreset.routes'; // Rute za spremanje projekcija goriva

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://dataavioservis.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Apply global API rate limiter to all routes
// Privremeno isključen rate limiting za testiranje i seed skriptu
// app.use(apiLimiter);

// Služenje statičkih fajlova iz 'public' direktorijuma
// Npr. fajl public/uploads/vehicles/slika.jpg će biti dostupan na /uploads/vehicles/slika.jpg
app.use(express.static(path.join(__dirname, '../public')));

// Služenje statičkih fajlova iz 'uploads' direktorijuma (u korijenu projekta)
// Npr. fajl uploads/fuel_receipts/dokument.pdf će biti dostupan na /uploads/fuel_receipts/dokument.pdf
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profile', profileRoutes); // Register profile routes
app.use('/api', serviceRecordRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/fuel/fixed-tanks', fixedStorageTankRoutes);
// Mount document routes nested under intakes. 
// The `fuelIntakeRecordDocumentsRoutes` router uses `mergeParams: true` 
// and expects the parent parameter to be named `recordId` for its controllers.
fuelIntakeRecordRoutes.use('/:recordId/documents', fuelIntakeRecordDocumentsRoutes);
app.use('/api/fuel/intakes', fuelIntakeRecordRoutes);
app.use('/api/fuel/documents', fuelDocumentRoutes);
app.use('/api/fuel/transfers', fixedTankTransferRoutes);
app.use('/api/fuel/fueling-operations', fuelingOperationRoutes);
app.use('/api/fuel-receipts', fuelReceiptRoutes);
app.use('/api/fuel-transfers-to-tanker', fuelTransferToTankerRoutes); // Registracija novih ruta
app.use('/api/fuel/drains', fuelDrainRoutes); // Registracija ruta za istakanje goriva
app.use('/api/airlines', airlineRoutes); // Mount airline routes
app.use('/api/documents', documentRoutes); // Mount document routes for authenticated document access
app.use('/api/activities', activityRoutes);
app.use('/api/fuel-price-rules', fuelPriceRuleRoutes); // Registracija ruta za pravila o cijenama goriva
app.use('/api/fuel-projection-presets', fuelProjectionPresetRoutes);

app.get('/', (req, res) => {
  res.send('Backend radi!');
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global Error Handler caught an error:', err.stack || err); // Log the full error stack

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Include stack trace in development for easier debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
