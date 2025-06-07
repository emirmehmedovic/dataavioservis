import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, Prisma, FuelIntakeRecords, FixedTankActivityType, FuelingOperation, FuelDrainRecord } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from './activity.controller';

const prisma = new PrismaClient();

// GET /api/fuel/mrn-balances - Dohvaćanje balansa goriva za sve MRN brojeve
export const getMrnBalances = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Dohvati sve zapise o unosu goriva koji imaju MRN broj
    const intakeRecords = await prisma.fuelIntakeRecords.findMany({
      where: {
        customs_declaration_number: {
          not: null
        }
      },
      select: {
        id: true,
        customs_declaration_number: true,
        quantity_liters_received: true
      }
    });
    
    // 2. Za svaki MRN broj, izračunaj balans goriva
    const mrnBalances: Record<string, { totalIntake: number, totalUsed: number, remainingFuel: number }> = {};
    
    // Inicijaliziramo objekt s podacima o unosu goriva
    for (const record of intakeRecords) {
      if (record.customs_declaration_number) {
        mrnBalances[record.customs_declaration_number] = {
          totalIntake: record.quantity_liters_received || 0,
          totalUsed: 0,
          remainingFuel: record.quantity_liters_received || 0
        };
      }
    }
    
    // 3. Dohvati sve operacije točenja goriva koje imaju mrnBreakdown podatke
    const fuelingOperations = await prisma.fuelingOperation.findMany({
      where: {
        mrnBreakdown: {
          not: null
        }
      },
      select: {
        id: true,
        mrnBreakdown: true,
        quantity_liters: true
      }
    });
    
    // 4. Dohvati sve zapise o dreniranom gorivu koje imaju mrnBreakdown podatke
    const drainedFuel = await prisma.fuelDrainRecord.findMany({
      where: {
        mrnBreakdown: {
          not: null
        }
      },
      select: {
        id: true,
        mrnBreakdown: true,
        quantityLiters: true
      }
    });
    
    // 5. Izračunaj korišteno gorivo za svaki MRN broj
    // Operacije točenja
    for (const op of fuelingOperations) {
      if (op.mrnBreakdown) {
        try {
          const mrnData = JSON.parse(op.mrnBreakdown);
          for (const entry of mrnData) {
            if (entry.mrn && mrnBalances[entry.mrn]) {
              mrnBalances[entry.mrn].totalUsed += entry.quantity || 0;
              mrnBalances[entry.mrn].remainingFuel -= entry.quantity || 0;
            }
          }
        } catch (error) {
          console.error(`Greška pri parsiranju mrnBreakdown za operaciju ${op.id}:`, error);
        }
      }
    }
    
    // Drenirano gorivo
    for (const drain of drainedFuel) {
      if (drain.mrnBreakdown) {
        try {
          const mrnData = JSON.parse(drain.mrnBreakdown);
          for (const entry of mrnData) {
            if (entry.mrn && mrnBalances[entry.mrn]) {
              mrnBalances[entry.mrn].totalUsed += entry.quantity || 0;
              mrnBalances[entry.mrn].remainingFuel -= entry.quantity || 0;
            }
          }
        } catch (error) {
          console.error(`Greška pri parsiranju mrnBreakdown za drenirano gorivo ${drain.id}:`, error);
        }
      }
    }
    
    // 6. Vrati rezultate
    res.status(200).json(mrnBalances);
    
  } catch (error) {
    console.error('Error fetching MRN balances:', error);
    res.status(500).json({ message: 'Greška prilikom dohvaćanja balansa MRN brojeva', error: String(error) });
  }
};

// GET /api/fuel/mrn-report/:mrn - Dohvaćanje izvještaja za određeni MRN broj
export const getMrnReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mrn } = req.params;
    
    if (!mrn) {
      res.status(400).json({ message: 'MRN broj je obavezan.' });
      return;
    }
    
    // 1. Dohvati zapis o unosu goriva za dati MRN
    const intakeRecord = await prisma.fuelIntakeRecords.findFirst({
      where: { customs_declaration_number: mrn },
      include: {
        fixedTankTransfers: {
          include: {
            affectedFixedTank: true
          }
        },
        documents: true
      }
    });
    
    if (!intakeRecord) {
      res.status(404).json({ message: `Nije pronađen unos goriva za MRN: ${mrn}` });
      return;
    }
    
    // 2. Dohvati sve operacije točenja goriva povezane s ovim MRN-om
    const fuelingOperations = await prisma.fuelingOperation.findMany({
      where: { mrnBreakdown: { contains: mrn } },
      include: {
        airline: true,
        tank: true,
        documents: true
      },
      orderBy: { dateTime: 'asc' }
    });
    
    // 3. Dohvati sve zapise o dreniranom gorivu povezane s ovim MRN-om
    const drainedFuel = await prisma.fuelDrainRecord.findMany({
      where: { mrnBreakdown: { contains: mrn } },
      include: {
        user: true
      },
      orderBy: { dateTime: 'asc' }
    });
    
    // 4. Izračunaj balans goriva, uzimajući u obzir mrnBreakdown podatke
    const totalIntake = intakeRecord.quantity_liters_received || 0;
    
    // Izračunaj točnu količinu goriva iz ovog MRN-a koja je iskorištena u operacijama točenja
    let totalFuelingOperations = 0;
    for (const op of fuelingOperations) {
      if (op.mrnBreakdown) {
        try {
          const mrnData = JSON.parse(op.mrnBreakdown);
          // Tražimo točno ovaj MRN u breakdown podacima
          const mrnEntry = mrnData.find((entry: { mrn: string, quantity: number }) => entry.mrn === mrn);
          if (mrnEntry) {
            totalFuelingOperations += mrnEntry.quantity;
          }
        } catch (error) {
          console.error(`Greška pri parsiranju mrnBreakdown za operaciju ${op.id}:`, error);
          // Ako ne možemo parsirati, koristimo cijelu količinu kao fallback
          totalFuelingOperations += (op.quantity_liters || 0);
        }
      } else {
        // Ako nema mrnBreakdown podataka, koristimo cijelu količinu
        totalFuelingOperations += (op.quantity_liters || 0);
      }
    }
    
    // Izračunaj točnu količinu dreniranog goriva iz ovog MRN-a
    let totalDrained = 0;
    for (const drain of drainedFuel) {
      if (drain.mrnBreakdown) {
        try {
          const mrnData = JSON.parse(drain.mrnBreakdown);
          // Tražimo točno ovaj MRN u breakdown podacima
          const mrnEntry = mrnData.find((entry: { mrn: string, quantity: number }) => entry.mrn === mrn);
          if (mrnEntry) {
            totalDrained += mrnEntry.quantity;
          }
        } catch (error) {
          console.error(`Greška pri parsiranju mrnBreakdown za drenirano gorivo ${drain.id}:`, error);
          // Ako ne možemo parsirati, koristimo cijelu količinu kao fallback
          totalDrained += (drain.quantityLiters || 0);
        }
      } else {
        // Ako nema mrnBreakdown podataka, koristimo cijelu količinu
        totalDrained += (drain.quantityLiters || 0);
      }
    }
    
    const balance = totalIntake - totalFuelingOperations - totalDrained;
    
    // 5. Vrati kompletne podatke
    res.status(200).json({
      intake: intakeRecord,
      fuelingOperations,
      drainedFuel,
      balance: {
        totalIntake,
        totalFuelingOperations,
        totalDrained,
        remainingFuel: balance
      }
    });
    
  } catch (error) {
    console.error('Error fetching MRN report:', error);
    res.status(500).json({ message: 'Greška prilikom dohvaćanja MRN izvještaja', error: String(error) });
  }
};

/**
 * Validira format MRN broja carinske prijave
 * Standardni MRN format: 2 slova koda zemlje + 6 cifara godine i dana + 8 alfanumeričkih znakova + 1 kontrolna cifra
 * Npr. HR2305160123456C1
 * 
 * Alternativni format 1: 2 slova koda zemlje + 16 cifara (koji se koristi u nekim zemljama)
 * Npr. HR1234567899876543
 * 
 * Alternativni format 2: 2 broja + 2 slova + 12 brojeva + 1 slovo + 1 broj (format sa slike)
 * Npr. 24BA010304000120J6
 * 
 * Dozvoljava i testne/privremene MRN brojeve koji počinju sa 'TEST' ili 'UNTRACKED'
 */
function validateMRNNumber(mrn: string): boolean {
  // Provjera za testne/privremene MRN brojeve
  if (mrn.startsWith('TEST') || mrn.startsWith('UNTRACKED')) {
    return true;
  }
  
  // Standardni regex za MRN format (17 znakova)
  const standardMrnRegex = /^[A-Z]{2}\d{6}[A-Z0-9]{8}\d{1}$/;
  
  // Alternativni regex za MRN format (2 slova + 16 cifara = 18 znakova)
  const alternativeMrnRegex = /^[A-Z]{2}\d{16}$/;
  
  // Alternativni regex za MRN format sa slike (2 broja + 2 slova + 12 brojeva + 1 slovo + 1 broj = 18 znakova)
  const alternativeMrnRegex2 = /^\d{2}[A-Z]{2}\d{12}[A-Z]{1}\d{1}$/;
  
  // Provjera svih formata
  if (!standardMrnRegex.test(mrn) && !alternativeMrnRegex.test(mrn) && !alternativeMrnRegex2.test(mrn)) {
    console.log(`MRN validacija nije uspjela za: ${mrn}`); // Dodano za debugging
    return false;
  }
  
  // Dodatne provjere se mogu implementirati po potrebi
  // npr. validacija kontrolne cifre, provjera koda zemlje, itd.
  
  return true;
}

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
    refinery_name,
    supplier_name,
    delivery_note_number,
    customs_declaration_number,
    price_per_kg,
    currency,
    total_price,
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
  
  // Validacija MRN broja (carinske prijave) ako je unesen
  if (customs_declaration_number && !validateMRNNumber(customs_declaration_number)) {
    console.log("Validation failed: Invalid customs declaration (MRN) number format.");
    res.status(400).json({
      message: 'Neispravan format MRN broja carinske prijave.',
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
        refinery_name,
        supplier_name,
        delivery_note_number,
        customs_declaration_number,
        price_per_kg: price_per_kg ? parseFloat(price_per_kg) : null,
        currency: currency || null,
        total_price: total_price ? parseFloat(total_price) : null,
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
          
          console.log(`Creating transfer record for this tank`);
          const transferRecord = await tx.fixedTankTransfers.create({
            data: {
              activity_type: FixedTankActivityType.INTAKE,
              affected_fixed_tank_id: tankId,
              quantity_liters_transferred: parseFloat(dist.quantity_liters),
              transfer_datetime: new Date(intake_datetime),
              fuel_intake_record_id: newFuelIntakeRecord.id,
              notes: `Prijem goriva: ${delivery_note_number || 'Bez otpremnice'}${customs_declaration_number ? `, MRN: ${customs_declaration_number}` : ''}`,
            },
          });
          console.log(`Created transfer record for tank ID ${tankId}, quantity: ${dist.quantity_liters} L`);
          
          // Kreiraj zapis u TankFuelByCustoms tabeli za praćenje goriva po MRN
          const mrnNumber = customs_declaration_number || `UNTRACKED-INTAKE-${newFuelIntakeRecord.id}`;
          const quantityLiters = parseFloat(dist.quantity_liters);
          
          // Koristi raw SQL upit umjesto Prisma modela koji možda nije prepoznat
          await tx.$executeRaw`
            INSERT INTO "TankFuelByCustoms" (
              fixed_tank_id, 
              customs_declaration_number, 
              quantity_liters, 
              remaining_quantity_liters, 
              fuel_intake_record_id,
              date_added,
              "createdAt",
              "updatedAt"
            ) VALUES (
              ${tankId}, 
              ${mrnNumber}, 
              ${quantityLiters}, 
              ${quantityLiters}, 
              ${newFuelIntakeRecord.id},
              ${new Date(intake_datetime)},
              NOW(),
              NOW()
            )
          `;
          console.log(`Created customs tracking record for tank ID ${tankId}, MRN: ${mrnNumber}, quantity: ${dist.quantity_liters} L`);
          
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
    console.log('Query parameters received:', req.query);
    
    const { fuel_type, supplier_name, delivery_vehicle_plate, startDate, endDate, fuel_category, refinery_name, customs_declaration_number, currency, delivery_note_number } = req.query;
    const filters: any = {};

    if (fuel_type) filters.fuel_type = fuel_type as string;
    if (supplier_name) filters.supplier_name = supplier_name as string;
    if (delivery_vehicle_plate) filters.delivery_vehicle_plate = delivery_vehicle_plate as string;
    if (fuel_category) filters.fuel_category = fuel_category as string;
    // Debug customs_declaration_number filter
    if (customs_declaration_number) {
      console.log('Filtering by customs_declaration_number:', customs_declaration_number);
      filters.customs_declaration_number = {
        contains: customs_declaration_number as string,
        mode: 'insensitive' // Case-insensitive search
      };
    }
    
    // Debug currency filter
    if (currency) {
      console.log('Filtering by currency:', currency);
      filters.currency = {
        contains: currency as string,
        mode: 'insensitive' // Case-insensitive search
      };
    }
    if (delivery_note_number) filters.delivery_note_number = delivery_note_number as string;
    if (refinery_name) {
      filters.refinery_name = {
        contains: refinery_name as string,
        mode: 'insensitive' // Case-insensitive search
      };
    }
    if (startDate && endDate) {
      filters.intake_datetime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }
    
    console.log('Constructed filters for Prisma:', filters);

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
