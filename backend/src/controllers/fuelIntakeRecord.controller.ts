import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, Prisma, FuelIntakeRecords } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from './activity.controller';

const prisma = new PrismaClient();

// POST /api/fuel/intake-records - Kreiranje novog zapisa o prijemu goriva
export const createFuelIntakeRecord: RequestHandler<unknown, unknown, any, unknown> = async (req, res, next): Promise<void> => {
  console.log("createFuelIntakeRecord controller invoked. Body:", req.body);
  const {
    delivery_vehicle_plate,
    delivery_vehicle_driver_name,
    intake_datetime,
    quantity_liters_received,
    quantity_kg_received,
    specific_gravity,
    fuel_type,
    fuel_category,
    supplier_name,
    delivery_note_number,
    customs_declaration_number,
    tank_distributions,
  } = req.body;

  if (
    !delivery_vehicle_plate ||
    !intake_datetime ||
    quantity_liters_received == null ||
    quantity_kg_received == null ||
    specific_gravity == null ||
    !fuel_type
  ) {
    console.log("Validation failed: Missing required fields for main record.");
    res.status(400).json({
      message:
        'Missing required fields: delivery_vehicle_plate, intake_datetime, quantity_liters_received, quantity_kg_received, specific_gravity, fuel_type are required.',
    });
    return; 
  }

  if (!Array.isArray(tank_distributions) || tank_distributions.length === 0) {
    if (parseFloat(quantity_liters_received) > 0) {
        console.log("Validation failed: tank_distributions is missing or empty but quantity received is > 0.");
        res.status(400).json({ message: 'Tank distributions are required if quantity is received.' });
        return;
    }
  }

  let totalDistributedLiters = 0;
  if (Array.isArray(tank_distributions)) {
    for (const dist of tank_distributions) {
      if (dist.tank_id == null || dist.quantity_liters == null || parseFloat(dist.quantity_liters) <= 0) {
        console.log("Validation failed: Invalid tank distribution entry:", dist);
        res.status(400).json({ message: 'Each tank distribution must have a valid tank_id and a positive quantity_liters.' });
        return;
      }
      totalDistributedLiters += parseFloat(dist.quantity_liters);
    }
  }
  
  if (Math.abs(totalDistributedLiters - parseFloat(quantity_liters_received)) > 0.01 && parseFloat(quantity_liters_received) > 0) {
    console.log(`Validation failed: Distributed liters (${totalDistributedLiters} L) do not match received liters (${quantity_liters_received} L).`);
    res.status(400).json({
      message: `Total distributed quantity (${totalDistributedLiters.toFixed(2)} L) must match received quantity (${parseFloat(quantity_liters_received).toFixed(2)} L).`,
    });
    return;
  }

  try {
    console.log("Starting Prisma transaction for fuel intake.");
    const result = await prisma.$transaction(async (tx) => {
      console.log("Inside transaction: Creating FuelIntakeRecords entry.");
      // Create data object with all fields
      const recordData: any = {
        delivery_vehicle_plate,
        delivery_vehicle_driver_name,
        intake_datetime: new Date(intake_datetime),
        quantity_liters_received: parseFloat(quantity_liters_received),
        quantity_kg_received: parseFloat(quantity_kg_received),
        specific_gravity: parseFloat(specific_gravity),
        fuel_type,
        fuel_category: fuel_category || 'Domaće tržište',
        supplier_name,
        delivery_note_number,
        customs_declaration_number,
      };

      const newFuelIntakeRecord = await tx.fuelIntakeRecords.create({
        data: recordData,
      });
      console.log("FuelIntakeRecords entry created, ID:", newFuelIntakeRecord.id);

      if (Array.isArray(tank_distributions) && tank_distributions.length > 0) {
        for (const dist of tank_distributions) {
          const tankId = parseInt(dist.tank_id);
          const quantityLitersTransferred = parseFloat(dist.quantity_liters);

          console.log(`Processing distribution to tank ID: ${tankId}, Quantity: ${quantityLitersTransferred} L.`);

          const tank = await tx.fixedStorageTanks.findUnique({
            where: { id: tankId },
          });

          if (!tank) {
            console.error(`Transaction rollback: Tank with ID ${tankId} not found.`);
            throw new Error(`Tank with ID ${tankId} not found.`);
          }
          
          if (tank.fuel_type !== fuel_type) {
             console.error(`Transaction rollback: Tank ${tank.tank_name} (ID: ${tankId}) fuel type ${tank.fuel_type} does not match intake fuel type ${fuel_type}.`);
            throw new Error(`Tank ${tank.tank_name} (ID: ${tankId}) is for ${tank.fuel_type}, but intake is for ${fuel_type}.`);
          }

          const newCurrentLiters = tank.current_quantity_liters + quantityLitersTransferred;
          if (newCurrentLiters > tank.capacity_liters) {
            console.error(`Transaction rollback: Transfer to tank ID ${tankId} exceeds capacity.`);
            throw new Error(
              `Transferring ${quantityLitersTransferred} L to tank ${tank.tank_name} (ID: ${tankId}) would exceed its capacity of ${tank.capacity_liters} L. Current: ${tank.current_quantity_liters} L, Free: ${tank.capacity_liters - tank.current_quantity_liters} L.`
            );
          }
          
          console.log(`Creating FixedTankTransfers entry for tank ID: ${tankId}.`);
          await tx.fixedTankTransfers.create({
            data: {
              activity_type: 'INTAKE',
              fuel_intake_record_id: newFuelIntakeRecord.id,
              affected_fixed_tank_id: tankId,
              quantity_liters_transferred: quantityLitersTransferred,
              transfer_datetime: new Date(intake_datetime),
              notes: `Automatski unos iz zaprimanja ${newFuelIntakeRecord.id}`
            },
          });
          console.log("FixedTankTransfers entry created.");

          console.log(`Updating FixedStorageTanks current_quantity_liters for tank ID: ${tankId}.`);
          await tx.fixedStorageTanks.update({
            where: { id: tankId },
            data: { current_quantity_liters: newCurrentLiters }, 
          });
          console.log("FixedStorageTanks current_quantity_liters updated.");
        }
      }
      
      console.log("Fetching newly created record with relations.");
      const finalRecord = await tx.fuelIntakeRecords.findUnique({
          where: { id: newFuelIntakeRecord.id },
          include: {
              fixedTankTransfers: {
                include: {
                  affectedFixedTank: {
                    select: {
                      tank_name: true,
                      tank_identifier: true
                    }
                  }
                }
              },
              documents: true 
          }
      });
      console.log("Transaction completed successfully.");
      return finalRecord;
    });

    console.log("Sending 201 response with result:", result);
    res.status(201).json(result);
    return;

  } catch (error: any) {
    console.error("Error in createFuelIntakeRecord transaction or final response:", error.message, error.stack);
    next(error);
    return;
  }
};

// GET /api/fuel/intake-records - Dobijanje liste svih zapisa o prijemu goriva
export const getAllFuelIntakeRecords: RequestHandler<unknown, unknown, unknown, any> = async (req, res, next): Promise<void> => {
  try {
    const { fuel_type, supplier_name, delivery_vehicle_plate, startDate, endDate, fuel_category } = req.query;
    const filters: any = {};

    if (fuel_type) filters.fuel_type = fuel_type as string;
    if (supplier_name) filters.supplier_name = supplier_name as string;
    if (delivery_vehicle_plate) filters.delivery_vehicle_plate = delivery_vehicle_plate as string;
    if (fuel_category) filters.fuel_category = fuel_category as string;
    if (startDate && endDate) {
      filters.intake_datetime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const records = await prisma.fuelIntakeRecords.findMany({
      where: filters,
      orderBy: {
        intake_datetime: 'desc',
      },
      include: {
        documents: true,
        fixedTankTransfers: {
          include: {
            affectedFixedTank: {
              select: {
                tank_name: true,
                tank_identifier: true
              }
            }
          }
        }
      }
    });
    res.status(200).json(records);
    return;
  } catch (error: any) {
    next(error);
    return;
  }
};

// GET /api/fuel/intake-records/:id - Dobijanje detalja specifičnog zapisa
export const getFuelIntakeRecordById: RequestHandler<{ id: string }, unknown, unknown, unknown> = async (req, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`[API] getFuelIntakeRecordById: Primljen ID: ${id}`); 
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      console.log(`[API] getFuelIntakeRecordById: ID nije validan broj: ${id}`);
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    const record = await prisma.fuelIntakeRecords.findUnique({
      where: { id: parsedId }, 
      include: {
        documents: true,
        fixedTankTransfers: {
          include: {
            affectedFixedTank: {
              select: {
                tank_name: true,
                tank_identifier: true
              }
            }
          }
        }
      }
    });
    console.log(`[API] getFuelIntakeRecordById: Pronađen zapis:`, record);

    if (!record) {
      res.status(404).json({ message: 'Fuel intake record not found' });
      return;
    }
    res.status(200).json(record);
    return;
  } catch (error: any) {
    console.error(`[API] getFuelIntakeRecordById: Greška:`, error);
    next(error);
    return;
  }
};

// PUT /api/fuel/intake-records/:id - Ažuriranje zapisa o prijemu goriva
export const updateFuelIntakeRecord: RequestHandler<{ id: string }, unknown, any, unknown> = async (req, res, next): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };
    
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: 'No fields provided for update.' });
      return;
    }
    
    if (updateData.quantity_liters_received !== undefined) {
      updateData.quantity_liters_received = parseFloat(updateData.quantity_liters_received);
    }
    if (updateData.quantity_kg_received !== undefined) {
      updateData.quantity_kg_received = parseFloat(updateData.quantity_kg_received);
    }
    if (updateData.specific_gravity !== undefined) {
      updateData.specific_gravity = parseFloat(updateData.specific_gravity);
    }
    if (updateData.intake_datetime !== undefined) {
        updateData.intake_datetime = new Date(updateData.intake_datetime);
    }
    // Handle fuel_category field
    if (updateData.fuel_category === undefined || updateData.fuel_category === null) {
        updateData.fuel_category = 'Domaće tržište';
    }

    const updatedRecord = await prisma.fuelIntakeRecords.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    res.status(200).json(updatedRecord);
    return;
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Fuel intake record not found for update.' });
      return;
    }
    next(error);
    return;
  }
};

// DELETE /api/fuel/intake-records/:id - Brisanje zapisa o prijemu goriva
// OPREZ: Ovo će obrisati i sve povezane FuelIntakeDocuments i FixedTankTransfers zbog `onDelete: CASCADE`
export const deleteFuelIntakeRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      res.status(400).json({ message: "Invalid ID format." });
      return;
    }
    
    const record = await prisma.fuelIntakeRecords.findUnique({
      where: { id: parsedId },
      include: { 
        fixedTankTransfers: {
          include: {
            affectedFixedTank: {
              select: {
                tank_name: true,
                tank_identifier: true
              }
            }
          }
        }, 
        documents: true 
      }
    });

    if (!record) {
      res.status(404).json({ message: 'Fuel intake record not found.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
        // First, reverse the fuel quantities in each affected fixed tank
        for (const transfer of record.fixedTankTransfers) {
            const tankId = transfer.affected_fixed_tank_id;
            const quantityToReverse = transfer.quantity_liters_transferred;
            
            console.log(`Reversing ${quantityToReverse} liters from tank ID: ${tankId}`);
            
            // Get current tank data
            const tank = await tx.fixedStorageTanks.findUnique({
                where: { id: tankId }
            });
            
            if (!tank) {
                throw new Error(`Tank with ID ${tankId} not found when trying to reverse fuel quantity.`);
            }
            
            // Calculate new quantity (ensuring it doesn't go below 0)
            const newQuantity = Math.max(0, tank.current_quantity_liters - quantityToReverse);
            
            // Update the tank's quantity
            await tx.fixedStorageTanks.update({
                where: { id: tankId },
                data: { current_quantity_liters: newQuantity }
            });
            
            console.log(`Updated tank ${tank.tank_name} (ID: ${tankId}) quantity from ${tank.current_quantity_liters} to ${newQuantity} liters`);
        }
        
        // Then delete the fixed tank transfers
        await tx.fixedTankTransfers.deleteMany({
            where: { fuel_intake_record_id: parsedId }
        });
        console.log(`Deleted FixedTankTransfers for record ID: ${parsedId}`);

        // Delete associated documents
        await tx.fuelIntakeDocuments.deleteMany({
            where: { fuel_intake_record_id: parsedId }
        });
        console.log(`Deleted FuelIntakeDocuments for record ID: ${parsedId}`);
        
        // Finally delete the intake record itself
        await tx.fuelIntakeRecords.delete({
            where: { id: parsedId },
        });
        console.log(`Deleted FuelIntakeRecord with ID: ${parsedId}`);
    });

    // Log the activity
    if (req.user) {
      try {
        // Create metadata for activity logging
        const metadata = {
          recordId: record.id,
          intake_datetime: record.intake_datetime,
          delivery_vehicle_plate: record.delivery_vehicle_plate,
          delivery_vehicle_driver_name: record.delivery_vehicle_driver_name,
          quantity_liters_received: record.quantity_liters_received,
          quantity_kg_received: record.quantity_kg_received,
          fuel_type: record.fuel_type,
          supplier_name: record.supplier_name,
          delivery_note_number: record.delivery_note_number,
          customs_declaration_number: record.customs_declaration_number,
          tankTransfers: record.fixedTankTransfers.map(transfer => ({
            tankName: transfer.affectedFixedTank?.tank_name || 'Nepoznat tank',
            tankIdentifier: transfer.affectedFixedTank?.tank_identifier || 'Nepoznat ID',
            quantity_liters: transfer.quantity_liters_transferred
          })),
          documentCount: record.documents.length
        };

        const description = `Korisnik ${req.user.username} je obrisao zapis o prijemu goriva ${record.quantity_liters_received.toFixed(2)} litara ${record.fuel_type} goriva od dobavljača ${record.supplier_name || 'Nepoznat dobavljač'} (Vozilo: ${record.delivery_vehicle_plate}).`;

        await logActivity(
          req.user.id,
          req.user.username,
          'DELETE_FUEL_INTAKE',
          'FuelIntakeRecord',
          record.id,
          description,
          metadata,
          req
        );
        
        console.log('Activity logged successfully for fuel intake deletion');
      } catch (activityError) {
        console.error('Error logging activity for fuel intake deletion:', activityError);
      }
    } else {
      console.error('Cannot log activity: req.user is undefined');
    }

    res.status(200).json({ message: 'Fuel intake record and associated data deleted successfully.' });
    return;
  } catch (error: any) {
    console.error(`Error deleting fuel intake record:`, error);
    if (error.code === 'P2025') {
        res.status(404).json({ message: 'Fuel intake record not found for deletion.' });
        return;
    }
    next(error);
    return;
  }
};
