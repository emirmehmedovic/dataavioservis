import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger';

// Tip koji pokriva sve varijante transakcijskih klijenata koje koristimo
// Za jednostavnost koristimo 'any' za metode koje dodajemo Prisma TransactionClient-u
// jer nam nije potrebna stroga tipizacija za trenutne potrebe
export type AnyTransactionClient = Prisma.TransactionClient | {
  [key: string]: any;
  systemLog?: {
    create: (args: any) => Promise<any>;
  }
};

// Tip za provjere i castove, koristimo ga gdje je potrebno
export type ExtendedTransactionClient = AnyTransactionClient;

const prisma = new PrismaClient();

/**
 * Tip za rezultat provjere konzistentnosti tanka
 */
export interface TankConsistencyResult {
  tankId: number;
  tankName: string;
  isConsistent: boolean;
  currentQuantityLiters: number;
  sumMrnQuantities: number;
  difference: number;
  mrnRecords: {
    id: number;
    customsDeclarationNumber: string;
    remainingQuantityLiters: number;
  }[];
}

/**
 * Provjerava konzistentnost količine goriva u tanku sa sumom MRN zapisa
 * 
 * @param tankId ID fiksnog tanka za provjeru
 * @param tx Opcionalna Prisma transakcija
 * @returns Rezultat provjere konzistentnosti
 */
export async function verifyTankConsistency(
  tankId: number, 
  tx?: AnyTransactionClient
): Promise<TankConsistencyResult> {
  const client = tx || prisma;
  
  // Dohvati podatke o tanku
  const tank = await client.fixedStorageTanks.findUnique({
    where: { id: tankId },
    select: {
      id: true,
      tank_name: true,
      current_quantity_liters: true
    }
  });
  
  if (!tank) {
    throw new Error(`Tank s ID ${tankId} nije pronađen`);
  }
  
  // Dohvati sve MRN zapise vezane uz tank
  const mrnRecords = await client.tankFuelByCustoms.findMany({
    where: { fixed_tank_id: tankId },
    select: {
      id: true,
      customs_declaration_number: true,
      remaining_quantity_liters: true
    }
  });
  
  // Izračunaj sumu preostalih količina iz MRN zapisa
  const sumMrnQuantities = mrnRecords.reduce(
    (sum: number, record: { remaining_quantity_liters: number }) => sum + record.remaining_quantity_liters, 
    0
  );
  
  // Izračunaj razliku između količine u tanku i sume MRN zapisa
  const difference = Math.abs(tank.current_quantity_liters - sumMrnQuantities);
  
  // Provjeri je li razlika unutar tolerancije (0.1 litra)
  const isConsistent = difference <= 0.1;
  
  // Logiraj rezultat provjere
  if (!isConsistent) {
    logger.warn(`Nekonzistentnost podataka u tanku ${tank.tank_name} (ID: ${tankId}): Tank sadrži ${tank.current_quantity_liters} L, suma MRN zapisa: ${sumMrnQuantities} L, razlika: ${difference.toFixed(3)} L`);
  } else {
    logger.debug(`Tank ${tank.tank_name} (ID: ${tankId}) je konzistentan: ${tank.current_quantity_liters} L = ${sumMrnQuantities} L (razlika: ${difference.toFixed(3)} L)`);
  }
  
  return {
    tankId: tank.id,
    tankName: tank.tank_name,
    isConsistent,
    currentQuantityLiters: tank.current_quantity_liters,
    sumMrnQuantities,
    difference,
    mrnRecords: mrnRecords.map((record: { id: number; customs_declaration_number: string; remaining_quantity_liters: number }) => ({
      id: record.id,
      customsDeclarationNumber: record.customs_declaration_number,
      remainingQuantityLiters: record.remaining_quantity_liters
    }))
  };
}

/**
 * Provjerava konzistentnost podataka za više tankova
 * 
 * @param tankIds Lista ID-eva tankova za provjeru
 * @param tx Opcionalna Prisma transakcija
 * @returns Rezultati provjere za sve tankove
 */
export async function verifyMultipleTanksConsistency(
  tankIds: number[],
  tx?: AnyTransactionClient
): Promise<TankConsistencyResult[]> {
  return Promise.all(tankIds.map(tankId => verifyTankConsistency(tankId, tx)));
}

/**
 * Provjerava postoji li dovoljno goriva za operaciju i je li raspodjela po MRN zapisima moguća
 * 
 * @param tankId ID fiksnog tanka
 * @param requestedQuantity Tražena količina goriva za operaciju
 * @param tx Opcionalna Prisma transakcija
 * @returns True ako je operacija moguća, inače false
 */
export async function canPerformFuelOperation(
  tankId: number,
  requestedQuantity: number,
  tx?: AnyTransactionClient
): Promise<boolean> {
  const client = tx || prisma;
  
  // Dohvati tank
  const tank = await client.fixedStorageTanks.findUnique({
    where: { id: tankId },
    select: {
      id: true,
      current_quantity_liters: true
    }
  });
  
  if (!tank) {
    return false;
  }
  
  // Provjeri ima li dovoljno goriva u tanku
  if (tank.current_quantity_liters < requestedQuantity) {
    return false;
  }
  
  // Dohvati MRN zapise i provjeri ima li dovoljno po MRN zapisima
  const mrnRecords = await client.tankFuelByCustoms.findMany({
    where: { fixed_tank_id: tankId },
    select: {
      id: true,
      remaining_quantity_liters: true
    },
    orderBy: { date_added: 'asc' } // FIFO princip
  });
  
  // Provjeri imaju li MRN zapisi dovoljno goriva
  let remainingToAllocate = requestedQuantity;
  // Eksplicitno definiranje tipa za cjeloviti niz a ne za pojedinačni element
  for (const record of mrnRecords as Array<{ id: number, remaining_quantity_liters: number }>) {
    remainingToAllocate -= Math.min(record.remaining_quantity_liters, remainingToAllocate);
    if (remainingToAllocate <= 0) {
      return true;
    }
  }
  
  // Ako smo došli do ovdje, nema dovoljno goriva u MRN zapisima
  return false;
}
