/**
 * Utility funkcije za rad s MRN zapisima (TankFuelByCustoms)
 * Implementira sigurne operacije za dodavanje i ažuriranje MRN zapisa
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

/**
 * Interfejs za podatke potrebne za upsert MRN zapisa
 */
interface MrnRecordData {
  tankId: number;
  mrnNumber: string;
  quantityLiters: number;
  fuelIntakeRecordId?: number;
  dateAdded?: Date;
}

/**
 * Upsert MRN zapisa - dodaje novi ili ažurira postojeći zapis
 * Koristi transakcijski klijent za izvršavanje unutar postojeće transakcije
 * 
 * @param tx - Prisma transakcijski klijent
 * @param data - Podaci za MRN zapis
 * @returns Promise koji se razrješava s kreiranim ili ažuriranim zapisom
 */
export async function upsertMrnRecord(
  tx: any,
  data: MrnRecordData
): Promise<any> {
  const { tankId, mrnNumber, quantityLiters, fuelIntakeRecordId, dateAdded = new Date() } = data;
  
  try {
    // Provjeri postoji li već zapis s istim MRN brojem i tank ID-em
    const existingRecord = await tx.tankFuelByCustoms.findFirst({
      where: {
        fixed_tank_id: tankId,
        customs_declaration_number: mrnNumber
      }
    });
    
    if (existingRecord) {
      logger.info(`Ažuriranje postojećeg MRN zapisa: ${mrnNumber} za tank ID ${tankId}`);
      
      // Ažuriraj postojeći zapis
      return await tx.tankFuelByCustoms.update({
        where: {
          id: existingRecord.id
        },
        data: {
          quantity_liters: existingRecord.quantity_liters + quantityLiters,
          remaining_quantity_liters: existingRecord.remaining_quantity_liters + quantityLiters,
          updatedAt: new Date()
        }
      });
    } else {
      logger.info(`Kreiranje novog MRN zapisa: ${mrnNumber} za tank ID ${tankId}`);
      
      // Kreiraj novi zapis
      return await tx.tankFuelByCustoms.create({
        data: {
          fixed_tank_id: tankId,
          customs_declaration_number: mrnNumber,
          quantity_liters: quantityLiters,
          remaining_quantity_liters: quantityLiters,
          fuel_intake_record_id: fuelIntakeRecordId,
          date_added: dateAdded,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    logger.error(`Greška prilikom upsert MRN zapisa: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Sigurno smanjenje količine goriva u MRN zapisima po FIFO principu
 * 
 * @param tx - Prisma transakcijski klijent
 * @param tankId - ID tanka iz kojeg se uzima gorivo
 * @param quantityToRemove - Količina goriva koja se uzima (u litrama)
 * @returns Promise koji se razrješava s objektom koji sadrži ažurirane MRN zapise i podatke o oduzimanju
 */
export async function removeFuelFromMrnRecords(
  tx: any,
  tankId: number,
  quantityToRemove: number
): Promise<{ 
  updatedRecords: any[], 
  deductionDetails: Array<{ 
    id: number, 
    mrn: string, 
    originalQuantity: number, 
    newQuantity: number, 
    quantityDeducted: number 
  }> 
}>  {
  try {
    // Prvo dohvatimo sve MRN zapise za tank radi debugginga
    const allMrnRecords = await tx.tankFuelByCustoms.findMany({
      where: {
        fixed_tank_id: tankId
      },
      orderBy: {
        date_added: 'asc'
      }
    });
    
    logger.debug(`MRN stanje za tank ID ${tankId} prije FIFO oduzimanja: ${JSON.stringify(allMrnRecords.map((r: any) => ({ 
      id: r.id, 
      mrn: r.customs_declaration_number, 
      preostalo: r.remaining_quantity_liters 
    })))}`);
    
    // Dohvati MRN zapise sortirane po datumu (FIFO) koji imaju preostalu količinu
    const mrnRecords = await tx.tankFuelByCustoms.findMany({
      where: {
        fixed_tank_id: tankId,
        remaining_quantity_liters: {
          gt: 0
        }
      },
      orderBy: {
        date_added: 'asc'
      }
    });
    
    logger.debug(`Pronađeno ${mrnRecords.length} MRN zapisa s preostalom količinom > 0 za tank ID ${tankId}: ${JSON.stringify(mrnRecords.map((r: any) => ({ 
      id: r.id, 
      mrn: r.customs_declaration_number, 
      preostalo: r.remaining_quantity_liters,
      typeOfPreostalo: typeof r.remaining_quantity_liters 
    })))}`);
    
    // Dodajmo još jedan upit za MRN zapise bez filtriranja po remaining_quantity_liters samo da provjerimo
    const mrnRecordsByDateOnly = await tx.tankFuelByCustoms.findMany({
      where: {
        fixed_tank_id: tankId
      },
      orderBy: {
        date_added: 'asc'
      },
      select: {
        id: true,
        customs_declaration_number: true,
        remaining_quantity_liters: true
      }
    });
    
    logger.debug(`ID 14 zapis detaljnije: ${JSON.stringify(mrnRecordsByDateOnly.filter((r: any) => r.id === 14))}`);
    logger.debug(`ID 15 zapis detaljnije: ${JSON.stringify(mrnRecordsByDateOnly.filter((r: any) => r.id === 15))}`);
    
    let remainingQuantityToRemove = quantityToRemove;
    const updatedRecords: any[] = [];
    const deductionDetails: Array<{ 
      id: number, 
      mrn: string, 
      originalQuantity: number, 
      newQuantity: number, 
      quantityDeducted: number 
    }> = [];
    
    // Prolazi kroz MRN zapise i smanjuj količinu dok ne dođeš do tražene količine
    logger.debug(`Početak obrade ${mrnRecords.length} MRN zapisa za oduzimanje ${quantityToRemove} L goriva`);
    
    for (const record of mrnRecords) {
      if (remainingQuantityToRemove <= 0) break;
      
      logger.debug(`Obrada MRN zapisa ID ${record.id} - preostalo: ${record.remaining_quantity_liters} L`);
      logger.debug(`Tip remaining_quantity_liters: ${typeof record.remaining_quantity_liters}`);
      
      // Pohrani originalnu količinu prije oduzimanja
      const originalQuantity = record.remaining_quantity_liters;
      
      const quantityToRemoveFromRecord = Math.min(originalQuantity, remainingQuantityToRemove);
      logger.debug(`Oduzimam ${quantityToRemoveFromRecord} L od MRN zapisa ID ${record.id}`);
      
      const updatedRecord = await tx.tankFuelByCustoms.update({
        where: {
          id: record.id
        },
        data: {
          remaining_quantity_liters: originalQuantity - quantityToRemoveFromRecord,
          updatedAt: new Date()
        }
      });
      
      logger.debug(`Ažuriran MRN zapis ID ${record.id} - nova preostala količina: ${updatedRecord.remaining_quantity_liters} L`);
      
      // Dodaj detalje o oduzimanju
      deductionDetails.push({
        id: record.id,
        mrn: record.customs_declaration_number,
        originalQuantity: originalQuantity, 
        newQuantity: updatedRecord.remaining_quantity_liters,
        quantityDeducted: quantityToRemoveFromRecord
      });
      
      updatedRecords.push(updatedRecord);
      remainingQuantityToRemove -= quantityToRemoveFromRecord;
      logger.debug(`Preostalo za oduzeti: ${remainingQuantityToRemove} L`);
    }
    
    // Provjeri je li sva količina uspješno raspoređena
    if (remainingQuantityToRemove > 0.001) {
      logger.warn(`Nije bilo dovoljno goriva u MRN zapisima za tank ID ${tankId}. Nedostaje ${remainingQuantityToRemove.toFixed(3)} L`);
    }
    
    const totalDeducted = deductionDetails.reduce((sum, item) => sum + item.quantityDeducted, 0);
    logger.debug(`Ukupno oduzeto goriva: ${totalDeducted} L od traženih ${quantityToRemove} L`);
    
    return { 
      updatedRecords,
      deductionDetails 
    };
  } catch (error) {
    logger.error(`Greška prilikom smanjenja količine goriva u MRN zapisima: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
