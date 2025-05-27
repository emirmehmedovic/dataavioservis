import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Validation schema for creating/updating a fuel tank
const fuelTankSchema = z.object({
  identifier: z.string().min(1, 'Identifikator je obavezan'),
  name: z.string().min(1, 'Naziv je obavezan'),
  location: z.string().min(1, 'Lokacija je obavezna'),
  capacity_liters: z.number().positive('Kapacitet mora biti pozitivan broj'),
  current_liters: z.number().min(0, 'Trenutna količina ne može biti negativna'),
  fuel_type: z.string().min(1, 'Tip goriva je obavezan'),
});

export const getAllFuelTanks = async (req: Request, res: Response): Promise<void> => {
  try {
    const fuelTanks = await (prisma as any).fuelTank.findMany({
      orderBy: { name: 'asc' },
    });
    
    res.status(200).json(fuelTanks);
  } catch (error) {
    console.error('Error fetching fuel tanks:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju tankera' });
  }
};

export const getFuelTankById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const fuelTank = await (prisma as any).fuelTank.findUnique({
      where: { id: Number(id) },
    });
    
    if (!fuelTank) {
      res.status(404).json({ message: 'Tanker nije pronađen' });
      return;
    }
    
    res.status(200).json(fuelTank);
  } catch (error) {
    console.error('Error fetching fuel tank:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju tankera' });
  }
};

export const getTankTransactions = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if the tank exists
    const tank = await (prisma as any).fuelTank.findUnique({
      where: { id: Number(id) },
    });
    
    if (!tank) {
      res.status(404).json({ message: 'Tanker nije pronađen' });
      return;
    }
    
    // Get all transactions for this tank
    const transactions = [];
    
    // 1. Get refills from suppliers
    const supplierRefills = await (prisma as any).fuelTankRefill.findMany({
      where: { tankId: Number(id) },
      orderBy: { date: 'desc' },
    });
    
    // Map supplier refills to our transaction format
    const mappedSupplierRefills = supplierRefills.map((refill: any) => ({
      id: refill.id,
      transaction_datetime: refill.date,
      type: 'supplier_refill',
      quantity_liters: refill.quantity_liters,
      supplier_name: refill.supplier,
      invoice_number: refill.invoice_number,
      price_per_liter: refill.price_per_liter,
      notes: refill.notes,
    }));
    
    // 2. Get transfers from fixed tanks
    const fixedTankTransfers = await (prisma as any).fuelTransferToTanker.findMany({
      where: { targetFuelTankId: Number(id) },
      include: {
        sourceFixedStorageTank: {
          select: {
            id: true,
            tank_name: true,
            tank_identifier: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { dateTime: 'desc' },
    });
    
    // Map fixed tank transfers to our transaction format
    const mappedFixedTankTransfers = fixedTankTransfers.map((transfer: any) => ({
      id: transfer.id,
      transaction_datetime: transfer.dateTime,
      type: 'fixed_tank_transfer',
      quantity_liters: transfer.quantityLiters,
      source_name: transfer.sourceFixedStorageTank?.tank_name,
      source_id: transfer.sourceFixedStorageTankId,
      notes: transfer.notes,
      user: transfer.user?.username,
    }));
    
    // 3. Get fueling operations (where this tank was used to fuel aircraft)
    const fuelingOperations = await (prisma as any).fuelingOperation.findMany({
      where: { tankId: Number(id) },
      orderBy: { dateTime: 'desc' },
    });
    
    // Map fueling operations to our transaction format
    const mappedFuelingOperations = fuelingOperations.map((operation: any) => ({
      id: operation.id,
      transaction_datetime: operation.dateTime,
      type: 'aircraft_fueling',
      quantity_liters: operation.quantity_liters,
      destination_name: operation.aircraft_registration || operation.flight_number,
      destination_id: operation.id,
      notes: operation.notes,
    }));
    
    // Combine all transactions and sort by date (newest first)
    transactions.push(...mappedSupplierRefills, ...mappedFixedTankTransfers, ...mappedFuelingOperations);
    transactions.sort((a, b) => new Date(b.transaction_datetime).getTime() - new Date(a.transaction_datetime).getTime());
    
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching tank transactions:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju historije transakcija' });
  }
};

export const createFuelTank = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = fuelTankSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validacijska greška',
        errors: validationResult.error.errors,
      });
      return;
    }
    
    const { identifier, name, location, capacity_liters, current_liters, fuel_type } = validationResult.data;
    
    // Check if identifier already exists
    const existingTank = await (prisma as any).fuelTank.findFirst({
      where: { identifier },
    });
    
    if (existingTank) {
      res.status(400).json({ message: 'Tanker s ovim identifikatorom već postoji' });
      return;
    }
    
    // Validate that current_liters <= capacity_liters
    if (current_liters > capacity_liters) {
      res.status(400).json({ 
        message: 'Trenutna količina goriva ne može biti veća od kapaciteta tankera' 
      });
      return;
    }
    
    const newFuelTank = await (prisma as any).fuelTank.create({
      data: {
        identifier,
        name,
        location,
        capacity_liters,
        current_liters,
        fuel_type,
      },
    });
    
    res.status(201).json(newFuelTank);
  } catch (error) {
    console.error('Error creating fuel tank:', error);
    res.status(500).json({ message: 'Greška pri kreiranju tankera' });
  }
};

export const updateFuelTank = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const validationResult = fuelTankSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validacijska greška',
        errors: validationResult.error.errors,
      });
      return;
    }
    
    const { identifier, name, location, capacity_liters, current_liters, fuel_type } = validationResult.data;
    
    // Check if the tank exists
    const existingTank = await (prisma as any).fuelTank.findUnique({
      where: { id: Number(id) },
    });
    
    if (!existingTank) {
      res.status(404).json({ message: 'Tanker nije pronađen' });
      return;
    }
    
    // Check if the new identifier already exists for a different tank
    const identifierExists = await (prisma as any).fuelTank.findFirst({
      where: {
        identifier,
        id: { not: Number(id) },
      },
    });
    
    if (identifierExists) {
      res.status(400).json({ message: 'Tanker s ovim identifikatorom već postoji' });
      return;
    }
    
    // Validate that current_liters <= capacity_liters
    if (current_liters > capacity_liters) {
      res.status(400).json({ 
        message: 'Trenutna količina goriva ne može biti veća od kapaciteta tankera' 
      });
      return;
    }
    
    const updatedFuelTank = await (prisma as any).fuelTank.update({
      where: { id: Number(id) },
      data: {
        identifier,
        name,
        location,
        capacity_liters,
        current_liters,
        fuel_type,
      },
    });
    
    res.status(200).json(updatedFuelTank);
  } catch (error) {
    console.error('Error updating fuel tank:', error);
    res.status(500).json({ message: 'Greška pri ažuriranju tankera' });
  }
};

export const deleteFuelTank = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if the tank exists
    const existingTank = await (prisma as any).fuelTank.findUnique({
      where: { id: Number(id) },
    });
    
    if (!existingTank) {
      res.status(404).json({ message: 'Tanker nije pronađen' });
      return;
    }
    
    // Delete related FuelingOperation records
    await (prisma as any).fuelingOperation.deleteMany({
      where: { tankId: Number(id) },
    });

    // Delete related FuelTransferToTanker records where this tank is the target
    await (prisma as any).fuelTransferToTanker.deleteMany({
      where: { targetFuelTankId: Number(id) },
    });

    // Delete related FuelTransferToTanker records where this tank is the source
    // Depending on your schema, you might also need to handle cases where the tank is a source
    // await (prisma as any).fuelTransferToTanker.deleteMany({
    //   where: { sourceFuelTankId: Number(id) },
    // });
    
    // Delete the tank image if it exists
    if (existingTank.image_url) {
      const imagePath = path.join(__dirname, '../../public', existingTank.image_url.replace(/^\/public/, ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete the FuelTank
    await (prisma as any).fuelTank.delete({
      where: { id: Number(id) },
    });
    
    res.status(200).json({ message: 'Tanker uspješno obrisan' });
  } catch (error) {
    console.error('Error deleting fuel tank:', error);
    res.status(500).json({ message: 'Greška pri brisanju tankera' });
  }
}; 

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/tanks');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Samo slike (jpeg, jpg, png, gif) su dozvoljene!'));
  },
});

// Middleware for handling single image upload
export const uploadTankImage = upload.single('image');

// Controller function for uploading tank image
export const handleTankImageUpload = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Check if the tank exists
    const existingTank = await (prisma as any).fuelTank.findUnique({
      where: { id: Number(id) },
    });
    
    if (!existingTank) {
      res.status(404).json({ message: 'Tanker nije pronađen' });
      return;
    }
    
    if (!req.file) {
      res.status(400).json({ message: 'Slika nije priložena' });
      return;
    }
    
    // Delete old image if it exists
    if (existingTank.image_url) {
      const oldImagePath = path.join(__dirname, '../../public', existingTank.image_url.replace(/^\/public/, ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Create image URL for database
    const imageUrl = `/public/uploads/tanks/${req.file.filename}`;
    
    // Update tank with new image URL
    const updatedTank = await (prisma as any).fuelTank.update({
      where: { id: Number(id) },
      data: { image_url: imageUrl },
    });
    
    res.status(200).json({ 
      message: 'Slika uspješno uploadana', 
      image_url: imageUrl,
      tank: updatedTank
    });
  } catch (error) {
    console.error('Error uploading tank image:', error);
    res.status(500).json({ message: 'Greška pri uploadu slike tankera' });
  }
}; 