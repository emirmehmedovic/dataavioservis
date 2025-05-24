import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';

const prisma = new PrismaClient();

// Validation schema for creating a tank refill
const tankRefillSchema = z.object({
  date: z.string().refine((val: string) => !isNaN(Date.parse(val)), {
    message: 'Datum mora biti validan',
  }),
  quantity_liters: z.number().positive('Količina mora biti pozitivan broj'),
  supplier: z.string().min(1, 'Dobavljač je obavezan'),
  invoice_number: z.string().optional(),
  price_per_liter: z.number().optional(),
  notes: z.string().optional(),
});

export const getTankRefills = async (req: Request, res: Response): Promise<void> => {
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
    
    // Get all refills for the tank
    const refills = await (prisma as any).fuelTankRefill.findMany({
      where: { tankId: Number(id) },
      orderBy: { date: 'desc' },
    });
    
    res.status(200).json(refills);
  } catch (error) {
    console.error('Error fetching tank refills:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju dopuna tankera' });
  }
};

export const createTankRefill = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const validationResult = tankRefillSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validacijska greška',
        errors: validationResult.error.errors,
      });
      return;
    }
    
    const { date, quantity_liters, supplier, invoice_number, price_per_liter, notes } = validationResult.data;
    
    // Check if the tank exists
    const tank = await (prisma as any).fuelTank.findUnique({
      where: { id: Number(id) },
    });
    
    if (!tank) {
      res.status(404).json({ message: 'Tanker nije pronađen' });
      return;
    }
    
    // Check if the refill would exceed the tank's capacity
    const newAmount = tank.current_liters + quantity_liters;
    if (newAmount > tank.capacity_liters) {
      res.status(400).json({ 
        message: `Dopuna prekoračuje kapacitet tankera za ${(newAmount - tank.capacity_liters).toFixed(2)} litara` 
      });
      return;
    }
    
    // Use a transaction to ensure both operations succeed or fail together
    const [refill, _] = await (prisma as any).$transaction([
      // Create the refill record
      (prisma as any).fuelTankRefill.create({
        data: {
          tankId: Number(id),
          date: new Date(date),
          quantity_liters,
          supplier,
          invoice_number,
          price_per_liter,
          notes,
        },
      }),
      
      // Update the tank's current level
      (prisma as any).fuelTank.update({
        where: { id: Number(id) },
        data: {
          current_liters: { increment: quantity_liters },
        },
      }),
    ]);
    
    res.status(201).json(refill);
  } catch (error) {
    console.error('Error creating tank refill:', error);
    res.status(500).json({ message: 'Greška pri evidentiranju dopune tankera' });
  }
}; 