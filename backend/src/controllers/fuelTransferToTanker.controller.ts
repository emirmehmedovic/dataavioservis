import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient, Prisma, FixedTankActivityType } from '@prisma/client';
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

      // Implementacija FIFO logike za oduzimanje goriva po MRN brojevima
      console.log(`Implementiranje FIFO logike za oduzimanje ${parsedQuantityLiters} L goriva iz fiksnog tanka ID: ${parsedSourceFixedStorageTankId}`);
      
      let remainingQuantityToTransfer = parsedQuantityLiters;
      
      // Dohvati sve zapise o gorivu po carinskim prijavama za izvorni tank, sortirano po datumu (FIFO)
      const tankCustomsFuelRecords = await tx.$queryRaw<{
        id: number, 
        customs_declaration_number: string, 
        remaining_quantity_liters: number,
        date_added: Date
      }[]>`
        SELECT id, customs_declaration_number, remaining_quantity_liters, date_added
        FROM "TankFuelByCustoms" 
        WHERE fixed_tank_id = ${parsedSourceFixedStorageTankId} 
          AND remaining_quantity_liters > 0 
        ORDER BY date_added ASC
      `;
      
      console.log(`Pronađeno ${tankCustomsFuelRecords.length} MRN zapisa za oduzimanje goriva`);
      
      // Kreiraj niz za praćenje MRN brojeva i količina za zapis u transferu
      const mrnBreakdown: { mrn: string, quantity: number, date_added: Date }[] = [];
      
      // Prolazi kroz zapise po FIFO principu i oduzima gorivo
      for (const record of tankCustomsFuelRecords) {
        if (remainingQuantityToTransfer <= 0) break;
        
        const recordId = record.id;
        const mrnNumber = record.customs_declaration_number;
        const availableQuantity = parseFloat(record.remaining_quantity_liters.toString());
        const quantityToDeduct = Math.min(availableQuantity, remainingQuantityToTransfer);
        
        console.log(`Oduzimanje ${quantityToDeduct} L od MRN: ${mrnNumber} (dostupno: ${availableQuantity} L)`);
        
        // Smanji količinu u zapisu
        await tx.$executeRaw`
          UPDATE "TankFuelByCustoms" 
          SET remaining_quantity_liters = remaining_quantity_liters - ${quantityToDeduct} 
          WHERE id = ${recordId}
        `;
        
        // Dodaj u niz za praćenje
        mrnBreakdown.push({
          mrn: mrnNumber,
          quantity: quantityToDeduct,
          date_added: record.date_added
        });
        
        remainingQuantityToTransfer -= quantityToDeduct;
      }
      
      // Provjeri da li je svo gorivo oduzeto
      if (remainingQuantityToTransfer > 0.001) {
        throw new Error(`Nije moguće oduzeti svu traženu količinu goriva. Nedostaje još ${remainingQuantityToTransfer.toFixed(2)} L.`);
      }
      
      // Kreiraj zapis o transferu goriva iz fiksnog tanka
      await tx.fixedTankTransfers.create({
        data: {
          activity_type: FixedTankActivityType.TANKER_TRANSFER_OUT,
          affected_fixed_tank_id: parsedSourceFixedStorageTankId,
          quantity_liters_transferred: parsedQuantityLiters,
          transfer_datetime: parsedTransferDatetime,
          notes: `Transfer u mobilni tanker ID: ${parsedTargetMobileTankId}${notes ? ` - ${notes}` : ''}`,
        }
      });

      // Ažuriraj stanje fiksnog tanka
      const updatedSourceTank = await tx.fixedStorageTanks.update({
        where: { id: parsedSourceFixedStorageTankId },
        data: {
          current_quantity_liters: {
            decrement: parsedQuantityLiters
          }
        }
      });

      // Ažuriraj stanje mobilnog tanka
      const updatedTargetMobileTank = await tx.fuelTank.update({ // Changed from tx.vehicle
        where: { id: parsedTargetMobileTankId },
        data: {
          current_liters: {
            increment: parsedQuantityLiters
          }
        }
      });

      // Kreiraj MRN zapise za mobilni tank na osnovu MRN breakdown-a
      console.log(`Kreiranje ${mrnBreakdown.length} MRN zapisa za mobilni tank ID: ${parsedTargetMobileTankId}`);
      
      for (const mrnRecord of mrnBreakdown) {
        // Provjeri postoji li već zapis za ovaj MRN broj u mobilnom tanku
        const existingMrnRecord = await tx.mobileTankCustoms.findFirst({
          where: {
            mobile_tank_id: parsedTargetMobileTankId,
            customs_declaration_number: mrnRecord.mrn
          }
        });

        if (existingMrnRecord) {
          // Ako zapis već postoji, samo ažuriraj količinu
          await tx.mobileTankCustoms.update({
            where: { id: existingMrnRecord.id },
            data: {
              quantity_liters: { increment: mrnRecord.quantity },
              remaining_quantity_liters: { increment: mrnRecord.quantity }
            }
          });
          
          console.log(`Ažuriran postojeći MRN zapis za mobilni tank: ${mrnRecord.mrn}, dodano: ${mrnRecord.quantity} L`);
        } else {
          // Ako zapis ne postoji, kreiraj novi
          await tx.mobileTankCustoms.create({
            data: {
              mobile_tank_id: parsedTargetMobileTankId,
              customs_declaration_number: mrnRecord.mrn,
              quantity_liters: mrnRecord.quantity,
              remaining_quantity_liters: mrnRecord.quantity,
              date_added: mrnRecord.date_added,
              supplier_name: `Transfer iz fiksnog tanka ${parsedSourceFixedStorageTankId}`
            }
          });
          
          console.log(`Kreiran novi MRN zapis za mobilni tank: ${mrnRecord.mrn}, količina: ${mrnRecord.quantity} L`);
        }
      }

      // Kreiraj zapis o transferu goriva
      const fuelTransferRecord = await tx.fuelTransferToTanker.create({
        data: {
          dateTime: parsedTransferDatetime,
          sourceFixedStorageTankId: parsedSourceFixedStorageTankId,
          targetFuelTankId: parsedTargetMobileTankId,
          quantityLiters: parsedQuantityLiters,
          userId: userId,
          notes: notes || null,
          mrnBreakdown: JSON.stringify(mrnBreakdown), // Spremamo kao JSON string
        }
      });

      return { 
        fuelTransferRecord, 
        updatedSourceTank, 
        updatedTargetMobileTank,
        mrnBreakdown // Dodaj MRN breakdown u rezultat
      };
    });

    res.status(200).json({
      message: 'Transfer goriva uspješno izvršen.',
      data: result
    });
  } catch (error: any) {
    console.error('Error during fuel transfer:', error);
    
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }
    
    next(error);
  }
}; 