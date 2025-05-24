import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Process a reverse transaction for drained fuel
 * This allows filtered fuel to be returned to a fixed tank or mobile tanker
 */
export const reverseFuelDrainTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { dateTime, destinationType, destinationId, quantityLiters, notes, originalDrainId } = req.body;
  console.log('[reverseFuelDrainTransaction] Received request body:', req.body);

  if (!dateTime || !destinationType || !destinationId || quantityLiters === undefined || !originalDrainId) {
    res.status(400).json({ 
      message: 'Sva obavezna polja moraju biti proslijeđena (datum, tip odredišta, ID odredišta, količina, ID originalne drenaže).' 
    });
    return;
  }

  const parsedDateTime = new Date(dateTime);
  const parsedDestinationId = parseInt(destinationId, 10);
  const parsedOriginalDrainId = parseInt(originalDrainId, 10);
  const numericQuantity = parseFloat(quantityLiters);
  
  if (isNaN(parsedDestinationId) || isNaN(numericQuantity) || numericQuantity <= 0 || isNaN(parsedOriginalDrainId)) {
    res.status(400).json({ 
      message: 'Neispravan ID odredišta, ID originalne drenaže ili količina. Količina mora biti pozitivan broj.' 
    });
    return;
  }

  if (parsedDateTime > new Date()) {
    res.status(400).json({ message: 'Datum i vrijeme povrata ne mogu biti u budućnosti.' });
    return;
  }

  if (!['fixed', 'mobile'].includes(destinationType)) {
    res.status(400).json({ 
      message: 'Nepoznat tip odredišta. Dozvoljeni tipovi su: fixed, mobile' 
    });
    return;
  }

  const userIdAuth = req.user!.id;

  try {
    // Fetch the original drain record to verify it exists and check quantities
    const originalDrainRecord = await prisma.fuelDrainRecord.findUnique({
      where: { id: parsedOriginalDrainId }
    });

    if (!originalDrainRecord) {
      res.status(404).json({ message: 'Originalni zapis drenaže nije pronađen.' });
      return;
    }

    // Verify the quantity to return doesn't exceed the original drained amount
    if (numericQuantity > originalDrainRecord.quantityLiters) {
      res.status(400).json({ 
        message: `Količina za povrat ne može biti veća od originalno drenirane količine (${originalDrainRecord.quantityLiters} L).` 
      });
      return;
    }

    // Pre-transaction checks for destination capacity
    if (destinationType === 'fixed') {
      const tank = await prisma.fixedStorageTanks.findUnique({
        where: { id: parsedDestinationId },
      });
      
      if (!tank) {
        res.status(404).json({ message: 'Odredišni fiksni tank nije pronađen.' });
        return;
      }
      
      const availableCapacity = tank.capacity_liters - tank.current_quantity_liters;
      if (availableCapacity < numericQuantity) {
        res.status(400).json({ 
          message: `Nedovoljno kapaciteta u fiksnom tanku ${tank.location_description || tank.tank_identifier}. Dostupno: ${availableCapacity.toFixed(2)} L.` 
        });
        return;
      }
    } else if (destinationType === 'mobile') {
      const mobileTank = await prisma.fuelTank.findUnique({
        where: { id: parsedDestinationId },
      });
      
      if (!mobileTank) {
        res.status(404).json({ message: 'Odredišni mobilni tank nije pronađen.' });
        return;
      }
      
      const availableCapacity = mobileTank.capacity_liters - mobileTank.current_liters;
      if (availableCapacity < numericQuantity) {
        res.status(400).json({ 
          message: `Nedovoljno kapaciteta u mobilnom tanku ${mobileTank.name}. Dostupno: ${availableCapacity.toFixed(2)} L.` 
        });
        return;
      }
    }

    // Process the reverse transaction in a database transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update the destination tank quantity
      if (destinationType === 'fixed') {
        await tx.fixedStorageTanks.update({
          where: { id: parsedDestinationId },
          data: { current_quantity_liters: { increment: numericQuantity } },
        });
      } else if (destinationType === 'mobile') {
        await tx.fuelTank.update({
          where: { id: parsedDestinationId },
          data: { current_liters: { increment: numericQuantity } },
        });
      }

      // Create a record of this reverse transaction
      // We'll create a new model for tracking reverse transactions
      // For now, we'll use a simple structure with notes to track the relationship
      const reverseRecord = await tx.fuelDrainRecord.create({
        data: {
          dateTime: parsedDateTime,
          // For reverse transactions, we're creating a "negative" drain record
          // The source becomes the destination, and we're adding fuel instead of removing it
          sourceType: destinationType,
          sourceFixedTankId: destinationType === 'fixed' ? parsedDestinationId : null,
          sourceMobileTankId: destinationType === 'mobile' ? parsedDestinationId : null,
          // Store as negative quantity to indicate it's a reverse transaction
          quantityLiters: -numericQuantity,
          notes: notes || `Povrat filtriranog goriva iz drenaže ID: ${parsedOriginalDrainId}`,
          userId: userIdAuth,
        },
        include: {
          user: { select: { id: true, username: true, role: true } },
          sourceFixedTank: {
            select: { id: true, tank_identifier: true, location_description: true, fuel_type: true },
          },
          sourceMobileTank: {
            select: { id: true, name: true, identifier: true, fuel_type: true, location: true },
          },
        },
      });

      return reverseRecord;
    });

    // Format the response
    let sourceName = 'Nepoznato';
    if (result.sourceType === 'fixed' && result.sourceFixedTank) {
      sourceName = result.sourceFixedTank.location_description
        ? `${result.sourceFixedTank.location_description} (${result.sourceFixedTank.tank_identifier})`
        : result.sourceFixedTank.tank_identifier || 'N/A';
    } else if (result.sourceType === 'mobile' && result.sourceMobileTank) {
      sourceName = `${result.sourceMobileTank.name} (${result.sourceMobileTank.identifier})`;
      if (result.sourceMobileTank.location) {
        sourceName += ` - ${result.sourceMobileTank.location}`;
      }
    }

    const response = {
      ...result,
      sourceName,
      userName: result.user?.username || 'Sistem',
      // Negate the quantity for display since we stored it as negative
      quantityLiters: Math.abs(result.quantityLiters),
      isReverseTransaction: true,
      originalDrainId: parsedOriginalDrainId
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('[reverseFuelDrainTransaction] Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        res.status(404).json({ message: 'Odredišni tank ili originalna drenaža nisu pronađeni.' });
      } else {
        res.status(500).json({ message: `Greška baze podataka: ${error.message}` });
      }
    } else {
      next(error);
    }
  }
};
