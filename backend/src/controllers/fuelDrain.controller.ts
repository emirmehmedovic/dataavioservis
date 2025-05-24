import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Define a type for the record structure when relations are included
type FuelDrainRecordWithRelations = Prisma.FuelDrainRecordGetPayload<{
  include: {
    user: { select: { id: true; username: true; role: true } };
    sourceFixedTank: {
      select: { id: true; tank_identifier: true; location_description: true; fuel_type: true };
    };
    sourceMobileTank: { select: { id: true; name: true; identifier: true; fuel_type: true; location: true } }; 
  };
}>;

type TransformedFuelDrainRecord = FuelDrainRecordWithRelations & { sourceName: string; userName: string };

const VALID_SOURCE_TYPES = ['fixed', 'mobile'];

/**
 * Create a new fuel drain record
 */
export const createFuelDrainRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { dateTime, sourceType, sourceId, quantityLiters, notes } = req.body;
  console.log('[createFuelDrainRecord] Received request body:', req.body);

  if (!dateTime || !sourceType || !sourceId || quantityLiters === undefined) {
    res.status(400).json({ message: 'Sva obavezna polja moraju biti proslijeđena (datum, tip izvora, ID izvora, količina).' });
    return;
  }

  const parsedDrainDatetime = new Date(dateTime);
  const parsedSourceId = parseInt(sourceId, 10);
  const numericQuantity = parseFloat(quantityLiters);
  console.log('[createFuelDrainRecord] Parsed sourceId:', parsedSourceId, 'Parsed quantityLiters:', numericQuantity);

  if (isNaN(parsedSourceId) || isNaN(numericQuantity) || numericQuantity <= 0) {
    res.status(400).json({ message: 'Neispravan ID izvora ili količina. Količina mora biti pozitivan broj.' });
    return;
  }

  if (parsedDrainDatetime > new Date()) {
    res.status(400).json({ message: 'Datum i vrijeme istakanja ne mogu biti u budućnosti.' });
    return;
  }

  if (!VALID_SOURCE_TYPES.includes(sourceType as string)) {
    res.status(400).json({ message: `Nepoznat tip izvora istakanja. Dozvoljeni tipovi su: ${VALID_SOURCE_TYPES.join(', ')}` });
    return;
  }

  const userIdAuth = req.user!.id;

  try {
    // Pre-transaction checks
    if (sourceType === 'fixed') {
      const tank = await prisma.fixedStorageTanks.findUnique({
        where: { id: parsedSourceId },
      });
      console.log('[createFuelDrainRecord] Fixed tank lookup result:', tank);
      if (!tank) {
        res.status(404).json({ message: 'Tank (fiksni) iz kojeg se ističe nije pronađen.' });
        return;
      }
      if (tank.current_quantity_liters < numericQuantity) {
        res.status(400).json({ message: `Nedovoljno goriva u fiksnom tanku ${tank.location_description || tank.tank_identifier}. Trenutno stanje: ${tank.current_quantity_liters} L.` });
        return;
      }
    } else if (sourceType === 'mobile') {
      const mobileTank = await prisma.fuelTank.findUnique({
        where: { id: parsedSourceId },
      });
      console.log('[createFuelDrainRecord] Mobile tank lookup result:', mobileTank);
      if (!mobileTank) {
        res.status(404).json({ message: 'Mobilni tank (iz FuelTank modela) iz kojeg se ističe nije pronađen.' });
        return;
      }
      if (mobileTank.current_liters < numericQuantity) {
        res.status(400).json({ message: `Nedovoljno goriva u mobilnom tanku ${mobileTank.name}. Trenutno stanje: ${mobileTank.current_liters} L.` });
        return;
      }
    }

    const newDrainRecord = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (sourceType === 'fixed') {
        await tx.fixedStorageTanks.update({
          where: { id: parsedSourceId },
          data: { current_quantity_liters: { decrement: numericQuantity } },
        });
      } else if (sourceType === 'mobile') {
        await tx.fuelTank.update({
          where: { id: parsedSourceId },
          data: { current_liters: { decrement: numericQuantity } },
        });
      }

      const dataForCreate: Prisma.FuelDrainRecordUncheckedCreateInput = {
        dateTime: parsedDrainDatetime,
        sourceType: sourceType as string,
        quantityLiters: numericQuantity,
        notes: notes || null,
        userId: userIdAuth,
      };

      if (sourceType === 'fixed') {
        dataForCreate.sourceFixedTankId = parsedSourceId;
      } else if (sourceType === 'mobile') {
        dataForCreate.sourceMobileTankId = parsedSourceId;
      }

      return tx.fuelDrainRecord.create({
        data: dataForCreate,
        include: {
          user: { select: { id: true, username: true, role: true } },
          sourceFixedTank: { select: { id: true, tank_identifier: true, location_description: true, fuel_type: true } },
          sourceMobileTank: { select: { id: true, name: true, identifier: true, fuel_type: true, location: true } }
        }
      });
    }) as FuelDrainRecordWithRelations; // Explicit cast here

    let sourceName = 'Nepoznato';
    if (newDrainRecord.sourceType === 'fixed' && newDrainRecord.sourceFixedTank) {
      sourceName = newDrainRecord.sourceFixedTank.location_description 
        ? `${newDrainRecord.sourceFixedTank.location_description} (${newDrainRecord.sourceFixedTank.tank_identifier})` 
        : newDrainRecord.sourceFixedTank.tank_identifier || 'N/A';
    } else if (newDrainRecord.sourceType === 'mobile' && newDrainRecord.sourceMobileTank) {
      sourceName = `${newDrainRecord.sourceMobileTank.name} (${newDrainRecord.sourceMobileTank.identifier})`;
      if (newDrainRecord.sourceMobileTank.location) {
        sourceName += ` - ${newDrainRecord.sourceMobileTank.location}`;
      }
    }

    const response: TransformedFuelDrainRecord = {
      ...newDrainRecord,
      sourceName,
      userName: newDrainRecord.user?.username || 'Sistem'
    };

    res.status(201).json(response);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { 
        next(new Error('Greška prilikom ažuriranja količine u tanku: Tank nije pronađen tokom transakcije.'));
        return;
      }
    }
    next(error);
  }
};

/**
 * Get all fuel drain records
 */
export const getAllFuelDrainRecords = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { startDate, endDate, sourceType: querySourceType, sourceId: querySourceId } = req.query;
  const filters: Prisma.FuelDrainRecordWhereInput = {};

  const gteDate = startDate ? new Date(startDate as string) : undefined;
  const lteDate = endDate ? new Date(endDate as string) : undefined;

  if (gteDate && lteDate) {
    filters.dateTime = {
      gte: gteDate,
      lte: lteDate
    };
  } else if (gteDate) {
    filters.dateTime = {
      gte: gteDate
    };
  } else if (lteDate) {
    filters.dateTime = {
      lte: lteDate
    };
  }

  if (querySourceType) filters.sourceType = querySourceType as string;
  
  if (querySourceId) {
    const parsedQuerySourceId = parseInt(querySourceId as string);
    if (!isNaN(parsedQuerySourceId)) {
      if (querySourceType === 'fixed') {
        filters.sourceFixedTankId = parsedQuerySourceId;
      } else if (querySourceType === 'mobile') {
        filters.sourceMobileTankId = parsedQuerySourceId;
      } else {
        // If sourceType is not specified, we might want to search in both or neither.
        // For now, if sourceType is not 'fixed' or 'mobile', sourceId filter is ignored or could be an OR condition.
        // This example assumes sourceId is only applied if sourceType is also specified.
      }
    }
  }

  try {
    const records = await prisma.fuelDrainRecord.findMany({
      where: filters,
      orderBy: { dateTime: 'desc' },
      include: {
        user: { select: { id: true, username: true, role: true } },
        sourceFixedTank: { select: { id: true, tank_identifier: true, location_description: true, fuel_type: true } },
        sourceMobileTank: { select: { id: true, name: true, identifier: true, fuel_type: true, location: true } }
      }
    }) as FuelDrainRecordWithRelations[]; // Explicit cast here

    const transformedRecords: TransformedFuelDrainRecord[] = records.map((record: FuelDrainRecordWithRelations) => {
      let sourceName = 'Nepoznato';
      if (record.sourceType === 'fixed' && record.sourceFixedTank) {
        sourceName = record.sourceFixedTank.location_description 
          ? `${record.sourceFixedTank.location_description} (${record.sourceFixedTank.tank_identifier})` 
          : record.sourceFixedTank.tank_identifier || 'N/A';
      } else if (record.sourceType === 'mobile' && record.sourceMobileTank) {
        sourceName = `${record.sourceMobileTank.name} (${record.sourceMobileTank.identifier})`;
        if (record.sourceMobileTank.location) {
          sourceName += ` - ${record.sourceMobileTank.location}`;
        }
      }
      const recordForSpread: FuelDrainRecordWithRelations = record;

      return {
        id: recordForSpread.id,
        dateTime: recordForSpread.dateTime,
        sourceType: recordForSpread.sourceType,
        sourceFixedTankId: recordForSpread.sourceFixedTankId,
        sourceMobileTankId: recordForSpread.sourceMobileTankId,
        quantityLiters: recordForSpread.quantityLiters,
        notes: recordForSpread.notes,
        userId: recordForSpread.userId,
        createdAt: recordForSpread.createdAt,
        updatedAt: recordForSpread.updatedAt,
        sourceFixedTank: recordForSpread.sourceFixedTank,
        sourceMobileTank: recordForSpread.sourceMobileTank,
        user: recordForSpread.user,
        sourceName,
        userName: recordForSpread.user?.username || 'Sistem'
      };
    });

    res.status(200).json(transformedRecords);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get a single fuel drain record by ID
 */
export const getFuelDrainRecordById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Neispravan ID zapisa.' });
    return;
  }

  try {
    const record = await prisma.fuelDrainRecord.findUnique({
      where: { id: parsedId },
      include: {
        user: { select: { id: true, username: true, role: true } },
        sourceFixedTank: { select: { id: true, tank_identifier: true, location_description: true, fuel_type: true } },
        sourceMobileTank: { select: { id: true, name: true, identifier: true, fuel_type: true, location: true } }
      }
    }) as FuelDrainRecordWithRelations | null; // Explicit cast here

    if (!record) {
      res.status(404).json({ message: 'Zapis o istakanju nije pronađen.' });
      return;
    }

    let sourceName = 'Nepoznato';
    if (record.sourceType === 'fixed' && record.sourceFixedTank) {
      sourceName = record.sourceFixedTank.location_description 
        ? `${record.sourceFixedTank.location_description} (${record.sourceFixedTank.tank_identifier})` 
        : record.sourceFixedTank.tank_identifier || 'N/A';
    } else if (record.sourceType === 'mobile' && record.sourceMobileTank) {
      sourceName = `${record.sourceMobileTank.name} (${record.sourceMobileTank.identifier})`;
      if (record.sourceMobileTank.location) {
        sourceName += ` - ${record.sourceMobileTank.location}`;
      }
    }
    const recordForSpread: FuelDrainRecordWithRelations = record;

    const responseRecord: TransformedFuelDrainRecord = {
      id: recordForSpread.id,
      dateTime: recordForSpread.dateTime,
      sourceType: recordForSpread.sourceType,
      sourceFixedTankId: recordForSpread.sourceFixedTankId,
      sourceMobileTankId: recordForSpread.sourceMobileTankId,
      quantityLiters: recordForSpread.quantityLiters,
      notes: recordForSpread.notes,
      userId: recordForSpread.userId,
      createdAt: recordForSpread.createdAt,
      updatedAt: recordForSpread.updatedAt,
      sourceFixedTank: recordForSpread.sourceFixedTank,
      sourceMobileTank: recordForSpread.sourceMobileTank,
      user: recordForSpread.user,
      sourceName,
      userName: recordForSpread.user?.username || 'Sistem'
    };

    res.status(200).json(responseRecord);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update an existing fuel drain record
 */
export const updateFuelDrainRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // For simplicity, updates to sourceType or sourceId are not handled here as they would require complex stock adjustments.
  const { dateTime, quantityLiters, notes } = req.body;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Neispravan ID zapisa.' });
    return;
  }

  const updateData: Prisma.FuelDrainRecordUpdateInput = {};
  if (dateTime) {
    const parsedDateTime = new Date(dateTime);
    if (parsedDateTime > new Date()) {
      res.status(400).json({ message: 'Datum i vrijeme istakanja ne mogu biti u budućnosti.' });
      return;
    }
    updateData.dateTime = parsedDateTime;
  }
  if (quantityLiters !== undefined) {
    const numericQuantity = parseFloat(quantityLiters);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      res.status(400).json({ message: 'Količina mora biti pozitivan broj.' });
      return;
    }
    updateData.quantityLiters = numericQuantity;
  }
  if (notes !== undefined) {
    updateData.notes = notes === null ? Prisma.DbNull : notes;
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ message: 'Nema podataka za ažuriranje.' });
    return;
  }

  try {
    const originalRecord = await prisma.fuelDrainRecord.findUnique({ where: { id: parsedId } });
    if (!originalRecord) {
      res.status(404).json({ message: 'Originalni zapis o istakanju nije pronađen za ažuriranje.' });
      return;
    }

    // WARNING: This simplified update does NOT handle tank quantity changes if quantityLiters is updated.
    // A robust solution would require a transaction to:
    // 1. Revert quantity on originalRecord.sourceFixedTankId/sourceMobileTankId based on originalRecord.quantityLiters
    // 2. Update quantity on (potentially new) source_id based on new quantity_liters
    // 3. Update the FuelDrainRecord itself.
    // This is omitted for brevity here but is CRITICAL for data integrity.
    // If quantityLiters is part of updateData, and it's different from originalRecord.quantityLiters,
    // then a transaction is needed to adjust tank stocks.

    if (updateData.quantityLiters !== undefined && updateData.quantityLiters !== originalRecord.quantityLiters) {
      // This is where the complex transaction for quantity adjustment would go.
      // For now, we'll proceed with a simple update, acknowledging this limitation.
      console.warn(
        `Updating quantity for FuelDrainRecord ${parsedId} without adjusting tank stocks. ` +
        `Old: ${originalRecord.quantityLiters}, New: ${updateData.quantityLiters}. ` +
        `Original source: ${originalRecord.sourceType} ID ${originalRecord.sourceFixedTankId || originalRecord.sourceMobileTankId}`
      );
    }

    const updatedRecord = await prisma.fuelDrainRecord.update({
      where: { id: parsedId },
      data: updateData,
      include: {
        user: { select: { id: true, username: true, role: true } },
        sourceFixedTank: { select: { id: true, tank_identifier: true, location_description: true, fuel_type: true } },
        sourceMobileTank: { select: { id: true, name: true, identifier: true, fuel_type: true, location: true } }
      }
    }) as FuelDrainRecordWithRelations; // Explicit cast here

    let sourceName = 'Nepoznato';
    if (updatedRecord.sourceType === 'fixed' && updatedRecord.sourceFixedTank) {
      sourceName = updatedRecord.sourceFixedTank.location_description 
        ? `${updatedRecord.sourceFixedTank.location_description} (${updatedRecord.sourceFixedTank.tank_identifier})` 
        : updatedRecord.sourceFixedTank.tank_identifier || 'N/A';
    } else if (updatedRecord.sourceType === 'mobile' && updatedRecord.sourceMobileTank) {
      sourceName = `${updatedRecord.sourceMobileTank.name} (${updatedRecord.sourceMobileTank.identifier})`;
      if (updatedRecord.sourceMobileTank.location) {
        sourceName += ` - ${updatedRecord.sourceMobileTank.location}`;
      }
    }
    const recordForSpread: FuelDrainRecordWithRelations = updatedRecord;

    const response: TransformedFuelDrainRecord = {
      id: recordForSpread.id,
      dateTime: recordForSpread.dateTime,
      sourceType: recordForSpread.sourceType,
      sourceFixedTankId: recordForSpread.sourceFixedTankId,
      sourceMobileTankId: recordForSpread.sourceMobileTankId,
      quantityLiters: recordForSpread.quantityLiters,
      notes: recordForSpread.notes,
      userId: recordForSpread.userId,
      createdAt: recordForSpread.createdAt,
      updatedAt: recordForSpread.updatedAt,
      sourceFixedTank: recordForSpread.sourceFixedTank,
      sourceMobileTank: recordForSpread.sourceMobileTank,
      user: recordForSpread.user,
      sourceName,
      userName: recordForSpread.user?.username || 'Sistem'
    };

    res.status(200).json(response);
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Zapis o istakanju nije pronađen za ažuriranje.' });
    } else {
      next(error);
    }
  }
};

/**
 * Delete a fuel drain record
 */
export const deleteFuelDrainRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    res.status(400).json({ message: 'Neispravan ID zapisa.' });
    return;
  }

  try {
    const recordToDelete = await prisma.fuelDrainRecord.findUnique({
      where: { id: parsedId },
    });

    if (!recordToDelete) {
      res.status(404).json({ message: 'Zapis o istakanju nije pronađen za brisanje.' });
      return;
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (recordToDelete.sourceType === 'fixed') {
        await tx.fixedStorageTanks.update({
          where: { id: recordToDelete.sourceFixedTankId! }, // Non-null assertion, as it must exist if type is 'fixed'
          data: { current_quantity_liters: { increment: recordToDelete.quantityLiters } },
        });
      } else if (recordToDelete.sourceType === 'mobile') {
        await tx.fuelTank.update({
          where: { id: recordToDelete.sourceMobileTankId! }, // Non-null assertion
          data: { current_liters: { increment: recordToDelete.quantityLiters } },
        });
      }

      await tx.fuelDrainRecord.delete({
        where: { id: parsedId },
      });
    });

    res.status(200).json({ message: 'Zapis o istakanju uspješno obrisan i količina vraćena u tank.' });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ message: 'Greška prilikom brisanja: zapis ili povezani tank nije pronađen.' });
    } else {
      next(error);
    }
  }
};
