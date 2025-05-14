import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth';
import companyRoutes from './routes/company';
import locationRoutes from './routes/location';
import vehicleRoutes from './routes/vehicle';
import usersRoutes from './routes/users';
import serviceRecordRoutes from './routes/serviceRecords';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Služenje statičkih fajlova iz 'public' direktorijuma
// Npr. fajl public/uploads/vehicles/slika.jpg će biti dostupan na /uploads/vehicles/slika.jpg
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', serviceRecordRoutes);

app.get('/', (req, res) => {
  res.send('Backend radi!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
