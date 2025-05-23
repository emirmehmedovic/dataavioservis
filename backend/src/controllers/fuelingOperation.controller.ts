import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as z from 'zod';
import * as path from 'path';

const prisma = new PrismaClient();

// Validation schema for creating a fueling operation
const fuelingOperationSchema = z.object({
  dateTime: z.string().or(z.date()),
  aircraft_registration: z.string().min(1, 'Registracija aviona je obavezna'),
  airlineId: z.number().int().positive('ID avio kompanije mora biti pozitivan broj'),
  destination: z.string().min(1, 'Destinacija je obavezna'),
  quantity_liters: z.number().positive('Količina mora biti pozitivan broj'),
  specific_density: z.number().positive('Specifična gustoća mora biti pozitivan broj').default(0.8),
  quantity_kg: z.number().positive('Količina u kilogramima mora biti pozitivan broj').optional(),
  price_per_kg: z.number().positive('Cijena po kilogramu mora biti pozitivan broj').optional(),
  currency: z.enum(['BAM', 'EUR', 'USD']).optional(),
  total_amount: z.number().positive('Ukupan iznos mora biti pozitivan broj').optional(),
  tankId: z.number().int().positive('ID tankera mora biti pozitivan broj'),
  flight_number: z.string().optional(),
  operator_name: z.string().min(1, 'Ime operatera je obavezno'),
  notes: z.string().optional(),
  tip_saobracaja: z.string().optional(),
});

export const getAllFuelingOperations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, airlineId, destination, tankId, tip_saobracaja, currency } = req.query;

    const whereClause: any = {};

    if (startDate) {
      whereClause.dateTime = { ...whereClause.dateTime, gte: new Date(startDate as string) };
    }
    if (endDate) {
      whereClause.dateTime = { ...whereClause.dateTime, lte: new Date(endDate as string) };
    }
    if (airlineId) {
      whereClause.airlineId = parseInt(airlineId as string);
    }
    if (destination) {
      whereClause.destination = { contains: destination as string, mode: 'insensitive' };
    }
    if (tankId) {
      whereClause.tankId = parseInt(tankId as string);
    }
    if (tip_saobracaja) {
      whereClause.tip_saobracaja = tip_saobracaja as string;
    }
    if (currency) {
      whereClause.currency = currency as string;
    }

    const fuelingOperations = await (prisma as any).fuelingOperation.findMany({
      where: whereClause,
      orderBy: { dateTime: 'desc' },
      include: {
        airline: true,
        tank: true,
        documents: true, // Include documents in the response
      },
    });
    
    res.status(200).json(fuelingOperations);
  } catch (error) {
    console.error('Error fetching fueling operations:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju operacija točenja' });
  }
};

export const getFuelingOperationById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const fuelingOperation = await (prisma as any).fuelingOperation.findUnique({
      where: { id: Number(id) },
      include: {
        airline: true,
        tank: true,
        documents: true, // Include documents in the response
      },
    });
    
    if (!fuelingOperation) {
      res.status(404).json({ message: 'Operacija točenja nije pronađena' });
      return;
    }
    
    res.status(200).json(fuelingOperation);
  } catch (error) {
    console.error('Error fetching fueling operation:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju operacije točenja' });
  }
};

export const createFuelingOperation = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    // Parse numeric fields from strings to numbers
    const parsedBody = {
      ...req.body,
      airlineId: req.body.airlineId ? parseInt(req.body.airlineId, 10) : undefined,
      tankId: req.body.tankId ? parseInt(req.body.tankId, 10) : undefined,
      quantity_liters: req.body.quantity_liters ? parseFloat(req.body.quantity_liters) : undefined,
      specific_density: req.body.specific_density ? parseFloat(req.body.specific_density) : undefined,
      quantity_kg: req.body.quantity_kg ? parseFloat(req.body.quantity_kg) : undefined,
      price_per_kg: req.body.price_per_kg ? parseFloat(req.body.price_per_kg) : undefined,
      total_amount: req.body.total_amount ? parseFloat(req.body.total_amount) : undefined
    };
    
    const validationResult = fuelingOperationSchema.safeParse(parsedBody);
    
    if (!validationResult.success) {
      res.status(400).json({
        message: 'Validacijska greška',
        errors: validationResult.error.errors,
      });
      return;
    }
    
    const { 
      dateTime, 
      aircraft_registration, 
      airlineId, 
      destination, 
      quantity_liters, 
      specific_density = 0.8, // Default value if not provided
      quantity_kg: providedQuantityKg, 
      price_per_kg, 
      currency, 
      total_amount: providedTotalAmount, 
      tankId, 
      flight_number, 
      operator_name, 
      notes, 
      tip_saobracaja
    } = validationResult.data;
    
    // Calculate quantity_kg if not provided
    // Since we've already parsed the values to numbers in parsedBody, we can use them directly
    // Ensure we have a valid quantity_kg value
    const quantity_kg = providedQuantityKg !== null && providedQuantityKg !== undefined ? 
      providedQuantityKg : 
      +(quantity_liters * specific_density).toFixed(2);
    
    // Log the calculated values for debugging
    console.log('Calculated values:', {
      quantity_liters,
      specific_density,
      providedQuantityKg,
      quantity_kg
    });
    
    // Calculate total_amount if price_per_kg is provided but total_amount is not
    // Since we've already parsed the values to numbers in parsedBody, we can use them directly
    let total_amount = providedTotalAmount;
    if (price_per_kg && !total_amount) {
      total_amount = +(quantity_kg * price_per_kg).toFixed(2);
    }
    
    console.log('Price and total calculations:', {
      price_per_kg,
      providedTotalAmount,
      total_amount
    });
    
    // Check if the tank exists and has enough fuel
    const tank = await (prisma as any).fuelTank.findUnique({
      where: { id: tankId },
    });
    
    if (!tank) {
      res.status(404).json({ message: 'Tanker nije pronađen' });
      return;
    }
    
    if (tank.current_liters < quantity_liters) {
      res.status(400).json({ 
        message: 'Nema dovoljno goriva u tankeru za ovu operaciju točenja' 
      });
      return;
    }
    
    // Check if the airline exists
    const airline = await (prisma as any).airline.findUnique({
      where: { id: airlineId },
    });
    
    if (!airline) {
      res.status(404).json({ message: 'Avio kompanija nije pronađena' });
      return;
    }
    
    // Process uploaded documents if any
    const documents = req.files as Express.Multer.File[];
    
    // Start a transaction to ensure all operations succeed or fail together
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // Create the fueling operation
      const newFuelingOperation = await tx.fuelingOperation.create({
        data: {
          dateTime: new Date(dateTime),
          aircraft_registration,
          airline: { connect: { id: airlineId } },
          destination,
          quantity_liters,
          specific_density,
          quantity_kg,
          price_per_kg,
          currency,
          total_amount,
          tank: { connect: { id: tankId } },
          flight_number,
          operator_name,
          notes,
          tip_saobracaja,
        },
        include: {
          airline: true,
          tank: true,
          documents: true,
        }
      });
      
      // Create document records if documents were uploaded
      if (documents && documents.length > 0) {
        for (const document of documents) {
          await tx.attachedDocument.create({
            data: {
              originalFilename: document.originalname,
              mimeType: document.mimetype,
              sizeBytes: document.size,
              storagePath: document.path.replace(/^public/, ''), // Remove 'public' prefix for URL access
              fuelingOperation: { connect: { id: newFuelingOperation.id } }
            }
          });
        }
      }
      
      // Update the tank's current_liters
      await tx.fuelTank.update({
        where: { id: tankId },
        data: {
          current_liters: { decrement: quantity_liters }
        }
      });
      
      // Fetch the updated operation with documents
      return await tx.fuelingOperation.findUnique({
        where: { id: newFuelingOperation.id },
        include: {
          airline: true,
          tank: true,
          documents: true,
        }
      });
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating fueling operation:', error);
    res.status(500).json({ message: 'Greška pri kreiranju operacije točenja' });
  }
};

export const getAirlines = async (req: Request, res: Response): Promise<void> => {
  try {
    const airlines = await (prisma as any).airline.findMany({
      orderBy: { name: 'asc' },
    });
    
    res.status(200).json(airlines);
  } catch (error) {
    console.error('Error fetching airlines:', error);
    res.status(500).json({ message: 'Greška pri dohvaćanju avio kompanija' });
  }
};

// PUT /api/fuel/fueling-operations/:id - Ažuriranje zapisa o točenju
export const updateFuelingOperation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Provjeri postoji li operacija
    const existingOperation = await (prisma as any).fuelingOperation.findUnique({
      where: { id: Number(id) },
      include: {
        documents: true,
      },
    });
    
    if (!existingOperation) {
      res.status(404).json({ message: 'Operacija točenja nije pronađena' });
      return;
    }
    
    // Validiraj podatke za ažuriranje
    const updateData = req.body;
    
    // Ažuriraj operaciju
    const updatedOperation = await (prisma as any).fuelingOperation.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        airline: true,
        tank: true,
        documents: true,
      },
    });
    
    res.status(200).json(updatedOperation);
  } catch (error) {
    console.error('Error updating fueling operation:', error);
    res.status(500).json({ message: 'Greška pri ažuriranju operacije točenja' });
  }
};

// DELETE /api/fuel/fueling-operations/:id - Brisanje zapisa o točenju
export const deleteFuelingOperation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // Provjeri postoji li operacija
    const operationToDelete = await (prisma as any).fuelingOperation.findUnique({
      where: { id: Number(id) },
      include: {
        documents: true,
      },
    });
    
    if (!operationToDelete) {
      res.status(404).json({ message: 'Operacija točenja nije pronađena' });
      return;
    }
    
    // Izbriši operaciju i sve povezane dokumente
    await (prisma as any).$transaction(async (tx: any) => {
      // Prvo izbriši dokumente ako postoje
      if (operationToDelete.documents && operationToDelete.documents.length > 0) {
        // Izbriši fizičke datoteke
        for (const doc of operationToDelete.documents) {
          try {
            const fs = await import('fs').then(m => m.default);
            // Construct the full system path to the file for deletion
            const fullPathToDelete = path.join(__dirname, '../../public', doc.storagePath);
            if (fs.existsSync(fullPathToDelete)) {
              fs.unlinkSync(fullPathToDelete);
              console.log(`Deleted document file: ${fullPathToDelete}`);
            }
          } catch (fileError) {
            console.error(`Error deleting document file ${doc.storagePath}:`, fileError);
            // Nastavi s brisanjem operacije čak i ako brisanje datoteke ne uspije
          }
        }
      }
      
      // Zatim izbriši operaciju (kaskadno će izbrisati i zapise dokumenata u bazi)
      await tx.fuelingOperation.delete({
        where: { id: Number(id) },
      });

      // Vrati gorivo u tank
      const sourceTank = await tx.fuelTank.findUnique({ 
        where: { id: operationToDelete.tankId } 
      });
      
      if (sourceTank) {
        await tx.fuelTank.update({
          where: { id: operationToDelete.tankId },
          data: { 
            current_liters: sourceTank.current_liters + operationToDelete.quantity_liters 
          },
        });
      } else {
        console.warn(`Source FuelTank with ID ${operationToDelete.tankId} not found when trying to revert quantity for deleted FuelingOperation ID ${id}.`);
      }
    });
    
    res.status(200).json({ message: 'Operacija točenja uspješno izbrisana' });
  } catch (error) {
    console.error('Error deleting fueling operation:', error);
    res.status(500).json({ message: 'Greška pri brisanju operacije točenja' });
  }
}; 