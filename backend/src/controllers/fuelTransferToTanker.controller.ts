import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma, FixedTankActivityType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { removeFuelFromMrnRecords } from '../utils/mrnUtils';
import { executeFuelOperation } from '../utils/transactionUtils';

const prisma = new PrismaClient();

/**
 * Kreira zapis o transferu goriva iz fiksnog skladišnog tanka u mobilni tanker
 * Implementira FIFO logiku za praćenje MRN zapisa
 */
export const createFuelTransferToTanker = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Dohvati podatke iz zahtjeva
  const { transfer_datetime, source_fixed_tank_id, target_mobile_tank_id, quantity_liters, notes } = req.body;

  // Parsing podataka
  const parsedSourceFixedStorageTankId = parseInt(source_fixed_tank_id, 10);
  const parsedTargetMobileTankId = parseInt(target_mobile_tank_id, 10);
  const parsedQuantityLiters = parseFloat(quantity_liters);
  const parsedTransferDatetime = new Date(transfer_datetime);
  const userId = req.user!.id;

  logger.info(`Započinjem transfer ${parsedQuantityLiters} L goriva iz fiksnog tanka ${parsedSourceFixedStorageTankId} u mobilni tank ${parsedTargetMobileTankId}`);

  try {
    // Koristi executeFuelOperation funkciju za sigurno izvršavanje transakcije s gorivom
    const result = await executeFuelOperation(
      async (tx) => {
        // 1. Validacija izvornog fiksnog tanka
        const sourceTank = await tx.fixedStorageTanks.findUnique({
          where: { id: parsedSourceFixedStorageTankId },
        });

        if (!sourceTank) {
          throw new Error('Izvorni fiksni tank nije pronađen.');
        }

        if (sourceTank.current_quantity_liters < parsedQuantityLiters) { 
          throw new Error(`Nedovoljno goriva u tanku ${sourceTank.tank_name}. Trenutno stanje: ${sourceTank.current_quantity_liters} L.`);
        }

        // 2. Validacija ciljnog mobilnog tanka
        const targetMobileTank = await tx.fuelTank.findUnique({
          where: { id: parsedTargetMobileTankId },
        });

        if (!targetMobileTank) {
          throw new Error('Ciljni mobilni tanker nije pronađen.');
        }
        
        if ((targetMobileTank.current_liters + parsedQuantityLiters) > targetMobileTank.capacity_liters) {
          throw new Error('Transfer bi prekoračio kapacitet ciljnog mobilnog tankera.');
        }

        // 3. Implementacija FIFO logike za oduzimanje goriva po MRN brojevima
        logger.info(`Oduzimanje ${parsedQuantityLiters} L goriva iz fiksnog tanka ID: ${parsedSourceFixedStorageTankId} po MRN zapisima`);
        
        // Koristi utility funkciju za smanjenje količine goriva u MRN zapisima po FIFO principu
        const { updatedRecords, deductionDetails } = await removeFuelFromMrnRecords(
          tx,
          parsedSourceFixedStorageTankId,
          parsedQuantityLiters
        );
        
        // 4. Priprema MRN zapisa za transfer
        const mrnBreakdown: { mrn: string, quantity: number, date_added: Date }[] = [];
        let totalDeducted = 0;
        
        // Koristi detalje o oduzimanju koje vraća removeFuelFromMrnRecords
        for (const detail of deductionDetails) {
          // Dohvati datum dodavanja MRN zapisa
          const mrnRecord = await tx.tankFuelByCustoms.findUnique({
            where: { id: detail.id },
            select: { date_added: true }
          });
          
          // Dodaj u niz za praćenje
          if (detail.quantityDeducted > 0) {
            mrnBreakdown.push({
              mrn: detail.mrn,
              quantity: detail.quantityDeducted,
              date_added: mrnRecord?.date_added || new Date()
            });
            totalDeducted += detail.quantityDeducted;
          }
        }
        
        logger.debug(`MRN breakdown nakon oduzimanja: ${JSON.stringify(mrnBreakdown)}`);
        logger.debug(`Ukupno oduzeto goriva prema FIFO principu: ${totalDeducted} L`);
        
        // Provjeri je li sva količina uspješno raspoređena
        if (Math.abs(totalDeducted - parsedQuantityLiters) > 0.001) {
          throw new Error(`Nije moguće oduzeti svu traženu količinu goriva. Traženo: ${parsedQuantityLiters} L, oduzeto: ${totalDeducted.toFixed(3)} L.`);
        }
        
        // 5. Kreiraj zapis o transferu goriva iz fiksnog tanka
        const fuelTransferRecord = await tx.fixedTankTransfers.create({
          data: {
            activity_type: FixedTankActivityType.TANKER_TRANSFER_OUT,
            affected_fixed_tank_id: parsedSourceFixedStorageTankId,
            quantity_liters_transferred: parsedQuantityLiters,
            transfer_datetime: parsedTransferDatetime,
            notes: `Transfer u mobilni tanker ID: ${parsedTargetMobileTankId}${notes ? ` - ${notes}` : ''}`
          }
        });

        // 6. Ažuriraj stanje izvornog fiksnog tanka oduzimanjem prenesene količine
        const updatedSourceTank = await tx.fixedStorageTanks.update({
          where: { id: parsedSourceFixedStorageTankId },
          data: {
            current_quantity_liters: {
              decrement: parsedQuantityLiters
            }
          }
        });

        // 7. Ažuriraj stanje ciljnog mobilnog tanka dodavanjem prenesene količine
        const updatedTargetMobileTank = await tx.fuelTank.update({
          where: { id: parsedTargetMobileTankId },
          data: {
            current_liters: {
              increment: parsedQuantityLiters
            }
          }
        });

        // 8. Kreiraj zapise o gorivu po carinskim prijavama za mobilni tanker
        for (const mrn of mrnBreakdown) {
          // Provjeri postoji li već zapis s istim MRN brojem u mobilnom tankeru
          const existingMobileTankCustoms = await tx.mobileTankCustoms.findFirst({
            where: {
              customs_declaration_number: mrn.mrn,
              mobile_tank_id: parsedTargetMobileTankId
            }
          });

          if (existingMobileTankCustoms) {
            // Ažuriraj postojeći zapis
            await tx.mobileTankCustoms.update({
              where: { id: existingMobileTankCustoms.id },
              data: {
                remaining_quantity_liters: {
                  increment: mrn.quantity
                },
                updatedAt: new Date()
              }
            });
          } else {
            // Kreiraj novi zapis
            await tx.mobileTankCustoms.create({
              data: {
                mobile_tank_id: parsedTargetMobileTankId,
                customs_declaration_number: mrn.mrn,
                quantity_liters: mrn.quantity,
                remaining_quantity_liters: mrn.quantity,
                date_added: new Date(),
                supplier_name: `Transfer iz fiksnog tanka ${parsedSourceFixedStorageTankId}`
              }
            });
          }
        }

        // 9. Vrati rezultate transakcije
        return {
          fuelTransferRecord,
          updatedSourceTank,
          updatedTargetMobileTank,
          mrnBreakdown
        };
      },
      {
        tankIds: [parsedSourceFixedStorageTankId],
        operationType: 'TRANSFER_TO_TANKER',
        userId: userId,
        notes: `Transfer ${parsedQuantityLiters} L goriva iz fiksnog tanka u mobilni tanker ${parsedTargetMobileTankId}${notes ? ` - ${notes}` : ''}`,
        maxRetries: 3,
        requestedQuantity: parsedQuantityLiters, // Dodali smo količinu za provjeru
        skipConsistencyCheck: false // Uključujemo provjere konzistentnosti
      }
    );

    res.status(200).json({
      message: 'Transfer goriva uspješno izvršen.',
      data: result
    });
  } catch (error: any) {
    logger.error('Greška prilikom transfera goriva u tanker:', { error: error.message, stack: error.stack });
    
    if (error.message) {
      res.status(400).json({ message: error.message });
      return;
    }
    
    next(error);
  }
};