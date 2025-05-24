import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient, Prisma } from '@prisma/client';
// import fs from 'fs'; // fs not needed if no file upload
// import path from 'path'; // path not needed

const prisma = new PrismaClient();

export const createFuelTransferToTanker = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Updated to snake_case to match validator and frontend payload specification for B2.4
  const { transfer_datetime, source_fixed_tank_id, target_mobile_tank_id, quantity_liters, notes } = req.body;
  // const file = req.file; // Removed file handling as per B2.4 (no document for this specific transfer)

  // if (!file) { // File check removed
  //   res.status(400).json({ message: 'Dokument fajl je obavezan.' });
  //   return;
  // }

  // Parsing logic remains, but uses updated variable names
  const parsedSourceFixedStorageTankId = parseInt(source_fixed_tank_id, 10);
  const parsedTargetMobileTankId = parseInt(target_mobile_tank_id, 10); // Renamed from parsedTargetVehicleId
  const parsedQuantityLiters = parseFloat(quantity_liters);
  const parsedTransferDatetime = new Date(transfer_datetime); // Renamed from parsedDateTime
  const userId = req.user!.id;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const sourceTank = await tx.fixedStorageTanks.findUnique({
        where: { id: parsedSourceFixedStorageTankId },
      });

      if (!sourceTank) {
        throw new Error('Izvorni fiksni tank nije pronađen.');
      }

      // Corrected to use actual Prisma model fields: current_quantity_liters and name
      if (sourceTank.current_quantity_liters < parsedQuantityLiters) { 
        throw new Error(`Nedovoljno goriva u tanku ${sourceTank.tank_name}. Trenutno stanje: ${sourceTank.current_quantity_liters} L.`);
      }

      // Ensure we check the correct model for mobile tankers.
      // Based on fuelTankController, it seems mobile tankers are `FuelTank` records.
      const targetMobileTank = await tx.fuelTank.findUnique({ // Changed from tx.vehicle
        where: { id: parsedTargetMobileTankId }, 
      });

      if (!targetMobileTank) {
        throw new Error('Ciljni mobilni tanker (FuelTank) nije pronađen.');
      }
      // TODO: Add capacity check for targetMobileTank if applicable
      if ((targetMobileTank.current_liters + parsedQuantityLiters) > targetMobileTank.capacity_liters) {
        throw new Error('Transfer bi prekoračio kapacitet ciljnog mobilnog tankera.');
      }

      const updatedSourceTank = await tx.fixedStorageTanks.update({
        where: { id: parsedSourceFixedStorageTankId },
        // Corrected to use actual Prisma model field: current_quantity_liters
        data: { current_quantity_liters: { decrement: parsedQuantityLiters } }, 
      });

      // Update mobile tank quantity
      // Using `fuelTank` model and its `current_liters` field as per fuelTankController.ts
      const updatedTargetMobileTank = await tx.fuelTank.update({ // Changed from tx.vehicle
        where: { id: parsedTargetMobileTankId },
        data: { current_liters: { increment: parsedQuantityLiters } }, // Changed from current_fuel_liters
      });

      // Create a record for this transfer. 
      // Assuming FuelTransferToTanker model now uses targetFuelTankId referencing FuelTank table.
      const fuelTransferRecord = await tx.fuelTransferToTanker.create({
        data: {
          dateTime: parsedTransferDatetime, 
          sourceFixedStorageTankId: parsedSourceFixedStorageTankId,
          targetFuelTankId: parsedTargetMobileTankId, // Changed from targetVehicleId to targetFuelTankId
          quantityLiters: parsedQuantityLiters,
          notes: notes || null,
          userId: userId,
        },
      });

      // Removed AttachedDocument creation
      // const document = await tx.attachedDocument.create({ ... });

      return { fuelTransferRecord, updatedSourceTank, updatedTargetMobileTank }; // updated document to updatedTargetMobileTank
    });

    res.status(201).json({
      message: 'Pretakanje goriva uspješno zabilježeno.',
      data: result,
    });

  } catch (error: any) {
    // File deletion logic removed
    // if (file) { ... }
    next(error);
  }
};
