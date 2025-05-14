import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import express from 'express';
import { uploadVehicleImage } from '../middleware/imageUpload'; 
import path from 'path'; 

const router = express.Router();
const prisma = new PrismaClient();

// Get all vehicles
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const vehicles = await prisma.vehicle.findMany({
    include: { company: true }
  });
  res.json(vehicles);
});

// Get vehicle by id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { company: true, images: true }
  });
  if (!vehicle) {
    res.status(404).json({ message: 'Vehicle not found' });
    return;
  }
  res.json(vehicle);
});

// Create vehicle (ADMIN only)
router.post(
  '/',
  authenticateToken,
  requireRole('ADMIN'),
  [
    body('vehicle_name').isLength({ min: 2 }).withMessage('Vehicle name is required'),
    body('license_plate').isLength({ min: 2 }).withMessage('License plate is required'),
    body('status').isString().withMessage('Status is required'),
    body('companyId').isInt().withMessage('CompanyId is required')
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const data = req.body;
      // Automatski izračunaj filter_expiry_date ako su oba polja prisutna
      if (data.filter_installation_date && data.filter_validity_period_months) {
        const installDate = new Date(data.filter_installation_date);
        const months = Number(data.filter_validity_period_months);
        const expiryDate = new Date(installDate);
        expiryDate.setMonth(expiryDate.getMonth() + months);
        data.filter_expiry_date = expiryDate;
      }
      // Automatski izračunaj next_annual_inspection_date ako je prisutan last_annual_inspection_date
      if (data.last_annual_inspection_date) {
        const last = new Date(data.last_annual_inspection_date);
        const next = new Date(last);
        next.setFullYear(next.getFullYear() + 1);
        data.next_annual_inspection_date = next;
      }
      const vehicle = await prisma.vehicle.create({ data });
      res.status(201).json(vehicle);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update vehicle (ADMIN only)
router.put(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  [
    body('vehicle_name').optional().isLength({ min: 2 }),
    body('license_plate').optional().isLength({ min: 2 }),
    body('status').optional().isString(),
    body('companyId').optional().isInt()
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      // Automatski izračunaj filter_expiry_date ako su oba polja prisutna
      if (data.filter_installation_date && data.filter_validity_period_months) {
        const installDate = new Date(data.filter_installation_date);
        const months = Number(data.filter_validity_period_months);
        const expiryDate = new Date(installDate);
        expiryDate.setMonth(expiryDate.getMonth() + months);
        data.filter_expiry_date = expiryDate;
      }
      // Automatski izračunaj next_annual_inspection_date ako je prisutan last_annual_inspection_date
      if (data.last_annual_inspection_date) {
        const last = new Date(data.last_annual_inspection_date);
        const next = new Date(last);
        next.setFullYear(next.getFullYear() + 1);
        data.next_annual_inspection_date = next;
      }
      const vehicle = await prisma.vehicle.update({
        where: { id },
        data
      });
      res.json(vehicle);
    } catch (err) {
      res.status(404).json({ message: 'Vehicle not found or error updating' });
    }
  }
);

// Delete vehicle (ADMIN only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await prisma.vehicle.delete({ where: { id } });
      res.json({ message: 'Deleted' });
    } catch (err) {
      res.status(404).json({ message: 'Vehicle not found or error deleting' });
    }
  }
);

// Endpoint za upload slike za vozilo
router.post('/:vehicleId/images', authenticateToken, uploadVehicleImage.single('image'), async (req: express.Request, res: express.Response): Promise<void> => {
  const { vehicleId } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'Nije priložen fajl za upload.' });
    return;
  }

  try {
    const vehicleExists = await prisma.vehicle.findUnique({
      where: { id: parseInt(vehicleId as string) }
    });

    if (!vehicleExists) {
      res.status(404).json({ error: 'Vozilo nije pronađeno.' });
      return;
    }

    const relativeImageUrl = path.join('/uploads/vehicles', file.filename).replace(/\\/g, '/');

    const newImage = await prisma.vehicleImage.create({
      data: {
        vehicleId: parseInt(vehicleId as string),
        imageUrl: relativeImageUrl,
      }
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error('Greška prilikom upload-a slike:', error);
    res.status(500).json({ error: 'Greška na serveru prilikom upload-a slike.' });
  }
});

export default router;
