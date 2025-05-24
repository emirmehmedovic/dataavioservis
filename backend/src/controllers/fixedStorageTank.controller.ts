import { Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient, FixedTankStatus, Prisma, FixedTankActivityType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import path from 'path'; // Ensure path is imported
import fs from 'fs';   // Use standard fs module

const prisma = new PrismaClient();

// Define constants for file paths
const PUBLIC_UPLOADS_BASE_PATH = '/uploads/fixed_tank_documents/'; // URL base path
const FULL_UPLOADS_DIR = path.join(__dirname, '..', '..', 'public', 'uploads', 'fixed_tank_documents');

// Ensure the final upload directory exists
if (!fs.existsSync(FULL_UPLOADS_DIR)) {
  fs.mkdirSync(FULL_UPLOADS_DIR, { recursive: true });
}

// Helper function to delete a file if it exists
const deleteFileFromServer = (fileUrlPath: string | null | undefined) => {
  if (!fileUrlPath) return;
  try {
    // Convert URL path (e.g., /uploads/fixed_tank_documents/doc.pdf) to absolute system path
    // This assumes fileUrlPath starts with PUBLIC_UPLOADS_BASE_PATH
    const fileName = path.basename(fileUrlPath);
    const localPath = path.join(FULL_UPLOADS_DIR, fileName);

    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      console.log(`Successfully deleted old file: ${localPath}`);
    }
  } catch (err) {
    console.error(`Error deleting file ${fileUrlPath}:`, err);
  }
};

// Helper function to create directory if it doesn't exist
const ensureUploadDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// POST /api/fuel/fixed-tanks - Kreiranje novog fiksnog tanka
export const createFixedStorageTank: RequestHandler = async (req, res, next): Promise<void> => {
  console.log('[FixedTankController] Received request to create fixed tank. Body:', req.body);

  const {
    tank_name,
    tank_identifier,
    capacity_liters, // Value from body, could be string or number if express.json parsed it
    current_liters,  // Value from body
    fuel_type,
    location_description,
    status
  } = req.body;

  // Convert to numbers. Validators should have ensured they are valid numeric representations.
  const parsedCapacityLiters = Number(capacity_liters);
  const parsedCurrentLiters = (current_liters !== undefined && current_liters !== null && String(current_liters).trim() !== '') 
                              ? Number(current_liters) 
                              : 0;

  // Validators handle: 
  // - capacity_liters: isFloat({ gt: 0 })
  // - current_liters: optional, isFloat({ min: 0 })
  // Additional cross-field validation or specific checks can remain here:

  if (parsedCapacityLiters <= 0) { // Redundant if validator's gt:0 is effective, but safe to keep for clarity
    console.error('[FixedTankController] Non-positive capacity_liters:', parsedCapacityLiters);
    res.status(400).json({ message: 'Capacity liters must be a positive number.' });
    return;
  }

  if (parsedCurrentLiters < 0) { // Redundant if validator's min:0 is effective, but safe to keep
    console.error('[FixedTankController] Negative current_liters:', parsedCurrentLiters);
    res.status(400).json({ message: 'Current liters cannot be negative.' });
    return;
  }

  if (parsedCurrentLiters > parsedCapacityLiters) {
    console.error('[FixedTankController] current_liters > capacity_liters:', parsedCurrentLiters, parsedCapacityLiters);
    res.status(400).json({
      message: `Current liters (${parsedCurrentLiters} L) cannot exceed capacity (${parsedCapacityLiters} L).`,
    });
    return;
  }
  
  console.log('[FixedTankController] Attempting to create tank with parsed data:', {
    tank_name: tank_name,
    tank_identifier: tank_identifier,
    capacity_liters: parsedCapacityLiters,
    current_quantity_liters: parsedCurrentLiters,
    fuel_type,
    location_description,
    status
  });

  let identificationDocumentUrl: string | null = null;

  if (req.file) {
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'fixed_tank_documents');
    ensureUploadDirExists(uploadDir);
    const uniqueFilename = `identificationDocument-${Date.now()}-${Math.floor(Math.random() * 1E9)}.${req.file.originalname.split('.').pop()}`;
    const newPath = path.join(uploadDir, uniqueFilename);

    try {
      // Use fs.rename to move the file (works like move within the same filesystem)
      // Multer saves uploaded files to a temporary path (req.file.path)
      await fs.promises.rename(req.file.path, newPath);
      identificationDocumentUrl = `/uploads/fixed_tank_documents/${uniqueFilename}`;
    } catch (err) {
      console.error('Error moving uploaded file:', err);
      // Decide if you want to stop the tank creation or proceed without the document
      // For now, let's proceed but log the error and not set the URL
      // Or, return an error response:
      // return res.status(500).json({ message: 'Failed to save uploaded document.' });
    }
  }

  try {
    const newTank = await prisma.fixedStorageTanks.create({ // Reverted to fixedStorageTanks
      data: {
        tank_name: tank_name,
        tank_identifier: tank_identifier,
        capacity_liters: parsedCapacityLiters,
        current_quantity_liters: parsedCurrentLiters,
        fuel_type,
        location_description: location_description || null,
        status,
        identificationDocumentUrl: identificationDocumentUrl, // Add this field
      },
    });
    console.log('[FixedTankController] Tank created successfully:', newTank);
    res.status(201).json(newTank);
    return;
  } catch (error: any) {
    console.error('[FixedTankController] Error during prisma.create:', error); 
    if (error.code === 'P2002' && error.meta?.target?.includes('tank_identifier')) {
        res.status(409).json({ message: 'Tank with this identifier already exists.' });
        return;
    }
    next(error);
  }
};

// GET /api/fuel/fixed-tanks - Dobijanje liste svih fiksnih tankova
export const getAllFixedStorageTanks: RequestHandler = async (req, res, next) => {
  try {
    const { status, fuel_type } = req.query;
    const filters: any = {};
    if (status) filters.status = status as string;
    if (fuel_type) filters.fuel_type = fuel_type as string;

    const tanks = await prisma.fixedStorageTanks.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc',
      }
    });
    res.status(200).json(tanks);
  } catch (error: any) {
    next(error);
  }
};

// GET /api/fuel/fixed-tanks/:id - Dobijanje detalja specifičnog fiksnog tanka
export const getFixedStorageTankById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tank = await prisma.fixedStorageTanks.findUnique({
      where: { id: parseInt(id) },
    });
    if (!tank) {
      res.status(404).json({ message: 'Fixed storage tank not found' });
      return;
    }
    res.status(200).json(tank);
  } catch (error: any) {
    next(error);
  }
};

// PUT /api/fuel/fixed-tanks/:id - Ažuriranje fiksnog tanka
export const updateFixedStorageTank: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Note: tank_name, fuel_type, etc. are now coming from req.body, not directly destructured if using FormData
    // When using multer with FormData, non-file fields are in req.body
    const { 
      tank_name, 
      // tank_identifier should not be updatable after creation, handle this logic if needed
      capacity_liters,
      // current_quantity_liters, // This should be managed by transactions, not direct update typically
      fuel_type, 
      location_description, 
      status,
      remove_document // Expect 'true' or '1' if client wants to remove existing doc without uploading new
    } = req.body;

    const tankId = parseInt(id);
    if (isNaN(tankId)) {
      res.status(400).json({ message: 'Invalid tank ID.' });
      return;
    }

    const existingTank = await prisma.fixedStorageTanks.findUnique({
      where: { id: tankId },
    });

    if (!existingTank) {
      // If a file was uploaded but tank not found, delete the uploaded temp file
      if (req.file) {
        // req.file.path is the path to the temporary file saved by multer
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
      }
      res.status(404).json({ message: 'Fixed storage tank not found for update.' });
      return;
    }
    
    const updateData: any = {}; // Prisma's FixedStorageTanksUpdateInput type would be better

    if (tank_name !== undefined) updateData.tank_name = String(tank_name);
    // tank_identifier is generally not updated. If it needs to be, add specific logic.
    // For now, we assume it's fixed after creation.

    if (capacity_liters !== undefined) updateData.capacity_liters = parseFloat(String(capacity_liters));
    // current_quantity_liters should ideally be updated via transactions (intake, transfer, drain)
    // Direct updates can lead to data inconsistency. For now, removing direct update.
    // if (current_quantity_liters !== undefined) updateData.current_quantity_liters = parseFloat(String(current_quantity_liters));
    
    if (fuel_type !== undefined) updateData.fuel_type = String(fuel_type);
    if (location_description !== undefined) {
      updateData.location_description = location_description === "" || location_description === null ? null : String(location_description);
    }
    if (status !== undefined) updateData.status = String(status);

    // Handle document upload/removal
    let oldDocumentUrl: string | null = existingTank.identificationDocumentUrl;

    if (req.file) { // New file uploaded
      // Delete old document if it exists
      if (oldDocumentUrl) {
        deleteFileFromServer(oldDocumentUrl);
      }

      const newFileName = req.file.filename; // Multer provides unique name in temp
      const finalFilePath = path.join(FULL_UPLOADS_DIR, newFileName);
      const tempFilePath = req.file.path;

      try {
        fs.renameSync(tempFilePath, finalFilePath); // Move from temp to final destination
        updateData.identificationDocumentUrl = `${PUBLIC_UPLOADS_BASE_PATH}${newFileName}`; // Store URL path
      } catch (fsError) {
        console.error('Error moving uploaded file:', fsError);
        // Attempt to clean up temp file if move fails
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        // Do not proceed with DB update for document if file system operation failed
        // but continue with other field updates if any.
        // Or, decide to fail the whole request:
        // return res.status(500).json({ message: 'Error processing uploaded file.' });
      }
    } else if (remove_document === 'true' || remove_document === '1') {
      if (oldDocumentUrl) {
        deleteFileFromServer(oldDocumentUrl);
        updateData.identificationDocumentUrl = null; // Set to null in DB
      }
    }

    // Validate capacity vs current quantity (if either is changing or already set)
    const finalCapacity = updateData.capacity_liters !== undefined ? updateData.capacity_liters : existingTank.capacity_liters;
    // Since current_quantity_liters is not directly updatable here, use existing value for validation
    const currentLiters = existingTank.current_quantity_liters;

    if (currentLiters > finalCapacity) {
      // If a file was uploaded but validation fails, delete the newly moved file
      if (req.file && updateData.identificationDocumentUrl) {
         deleteFileFromServer(updateData.identificationDocumentUrl);
         // also ensure updateData.identificationDocumentUrl is not set for the DB update
         delete updateData.identificationDocumentUrl;
      }
      res.status(400).json({
        message: `Current liters (${currentLiters} L) cannot exceed capacity (${finalCapacity} L).`,
      });
      return;
    }

    if (Object.keys(updateData).length === 0 && !req.file && !(remove_document === 'true' || remove_document === '1')) {
      // If a file was uploaded but no other data, it would have been handled above.
      // This means no actual changes are being made.
      res.status(200).json(existingTank); // Or 304 Not Modified, or 400 if no changes is an error
      return;
    }

    const updatedTank = await prisma.fixedStorageTanks.update({
      where: { id: tankId },
      data: updateData,
    });
    res.status(200).json(updatedTank);
  } catch (error: any) {
    // If an error occurs and a file was uploaded and moved, attempt to delete it to prevent orphans
    if (req.file && error) { 
        // Check if the file was successfully moved to its final destination
        const finalFilePathToCheck = path.join(FULL_UPLOADS_DIR, req.file.filename);
        if (fs.existsSync(finalFilePathToCheck)) {
            deleteFileFromServer(`${PUBLIC_UPLOADS_BASE_PATH}${req.file.filename}`);
        } else if (fs.existsSync(req.file.path)) { // if it's still in temp (e.g. move failed)
            fs.unlinkSync(req.file.path);
        }
    }

    if (error.code === 'P2002' && error.meta?.target?.includes('tank_identifier')) {
        res.status(409).json({ message: 'Another tank with this identifier already exists.' });
        return;
    }
    // Add more specific error handling if needed
    console.error("Update Fixed Tank Error:", error);
    next(error);
  }
};

// DELETE /api/fuel/fixed-tanks/:id - Logičko brisanje ili deaktivacija fiksnog tanka
// For this example, we'll implement a status change to 'Neaktivan' or 'Na održavanju'
// A true delete might be: await prisma.fixedStorageTanks.delete({ where: { id: parseInt(id) } });
export const deleteFixedStorageTank: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Option 1: Change status to 'Neaktivan' (logical delete)
    const deactivatedTank = await prisma.fixedStorageTanks.update({
      where: { id: parseInt(id) },
      data: { status: FixedTankStatus.INACTIVE }, // Or some other status indicating it's not in use
    });
    // Option 2: Actual delete (if preferred and safe considering relations)
    // await prisma.fixedStorageTanks.delete({ where: { id: parseInt(id) } });
    
    res.status(200).json({ message: 'Fixed storage tank status set to Neaktivan (logically deleted).', tank: deactivatedTank });
  } catch (error: any) {
    if (error.code === 'P2025') {
        res.status(404).json({ message: 'Fixed storage tank not found for deactivation/deletion.' });
        return;
    }
    next(error);
  }
};

// GET /api/fuel/fixed-tanks/:tankId/history - Get transaction history for a fixed tank
export const getFixedTankHistory: RequestHandler = async (req, res, next): Promise<void> => {
  const { tankId } = req.params;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  if (isNaN(parseInt(tankId))) {
    res.status(400).json({ message: 'Invalid Tank ID provided.' });
    return;
  }

  try {
    const parsedTankId = parseInt(tankId);

    const dateFiltersCondition: any = {};

    // Validate and parse startDate
    if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        dateFiltersCondition.gte = parsedStartDate;
      } else {
        console.warn(`Invalid startDate format received: ${startDate}`);
      }
    }

    // Validate and parse endDate
    if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        parsedEndDate.setHours(23, 59, 59, 999); // Set to end of day
        dateFiltersCondition.lte = parsedEndDate;
      } else {
        console.warn(`Invalid endDate format received: ${endDate}`);
      }
    }

    const intakeWhereConditions: any = {
      affected_fixed_tank_id: parsedTankId,
      activity_type: FixedTankActivityType.INTAKE, // ADDED THIS LINE
    };
    if (Object.keys(dateFiltersCondition).length > 0) {
      intakeWhereConditions.transfer_datetime = dateFiltersCondition;
    }

    const transferToMobileWhereConditions: any = { // Renamed for clarity
      sourceFixedStorageTankId: parsedTankId,
    };
    if (Object.keys(dateFiltersCondition).length > 0) {
      transferToMobileWhereConditions.dateTime = dateFiltersCondition;
    }

    const drainWhereConditions: any = {
      sourceFixedTankId: parsedTankId, 
      sourceType: 'fixed', 
    };
    if (Object.keys(dateFiltersCondition).length > 0) {
      drainWhereConditions.dateTime = dateFiltersCondition; 
    }

    // New: Conditions for FixedTankActivities (Internal Transfers)
    const internalTransferActivitiesWhereConditions: Prisma.FixedTankTransfersWhereInput = {
      OR: [
        { // Current tank is the one receiving fuel
          affected_fixed_tank_id: parsedTankId,
          activity_type: FixedTankActivityType.INTERNAL_TRANSFER_IN,
        },
        { // Current tank is the one sending fuel
          affected_fixed_tank_id: parsedTankId, // This might need to be counterparty_fixed_tank_id if schema implies affected_fixed_tank_id is always the 'main' tank in the record
          activity_type: FixedTankActivityType.INTERNAL_TRANSFER_OUT,
        },
        // If the schema implies affected_fixed_tank_id is always the one receiving for INTERNAL_TRANSFER_IN
        // and source for INTERNAL_TRANSFER_OUT, then we might need to query differently for OUT transfers
        // For now, assuming affected_fixed_tank_id is the tank whose history we are viewing.
      ],
    };
    if (Object.keys(dateFiltersCondition).length > 0) {
      internalTransferActivitiesWhereConditions.transfer_datetime = dateFiltersCondition;
    }

    const intakeRecords = await prisma.fixedTankTransfers.findMany({
      where: intakeWhereConditions, 
      include: {
        fuelIntakeRecord: { 
          select: {
            delivery_note_number: true,
            supplier_name: true,
            delivery_vehicle_plate: true,
          },
        },
        affectedFixedTank: { 
          select: {
            tank_name: true,
          },
        },
      },
      orderBy: {
        transfer_datetime: 'desc',
      },
    });

    const transfersToMobileTankers = await prisma.fuelTransferToTanker.findMany({
      where: transferToMobileWhereConditions, // Updated variable name
      include: {
        targetFuelTank: { 
          select: {
            name: true, 
            identifier: true,
          },
        },
      },
      orderBy: {
        dateTime: 'desc',
      },
    });

    const drainRecords = await prisma.fuelDrainRecord.findMany({
      where: drainWhereConditions,
      include: {
        user: { select: { username: true } }, 
      },
      orderBy: {
        dateTime: 'desc', 
      },
    });

    // New: Fetch FixedTankActivities for internal transfers
    const internalTransferActivities = await prisma.fixedTankTransfers.findMany({
      where: internalTransferActivitiesWhereConditions,
      include: {
        affectedFixedTank: { select: { tank_name: true } }, // Corrected: select specific field
        counterpartyFixedTank: { select: { tank_name: true, tank_identifier: true } }, // Corrected: select specific fields
        // Potentially include fuelIntakeRecord if relevant, though likely not for internal transfers
      },
      orderBy: {
        transfer_datetime: 'desc',
      }
    });

    const formattedIntakes = intakeRecords.map(intake => ({
      id: `intake-${intake.id}`,
      type: 'intake' as const, 
      transaction_datetime: intake.transfer_datetime ? intake.transfer_datetime.toISOString() : null, 
      quantityLiters: intake.quantity_liters_transferred, 
      relatedDocument: intake.fuelIntakeRecord?.delivery_note_number || 'N/A',
      sourceOrDestination: `${intake.fuelIntakeRecord?.supplier_name || 'Dobavljač N/A'} (Vozilo: ${intake.fuelIntakeRecord?.delivery_vehicle_plate || 'N/A'})`,
      notes: intake.notes || undefined,
      tankName: intake.affectedFixedTank?.tank_name || 'Nepoznat rezervoar',
    }));

    const formattedTransfersToMobile = transfersToMobileTankers.map(transfer => ({
      id: `transfer-out-${transfer.id}`,
      type: 'transfer_to_mobile' as const, 
      transaction_datetime: transfer.dateTime ? transfer.dateTime.toISOString() : null, 
      quantityLiters: -transfer.quantityLiters, // Ensure negative for outgoing
      relatedDocument: `Transfer ID: ${transfer.id}`,
      sourceOrDestination: `Mobilni Tanker: ${transfer.targetFuelTank?.name || 'N/A'} (${transfer.targetFuelTank?.identifier || 'N/A'})`,
      notes: transfer.notes || undefined,
    }));

    const formattedDrains = drainRecords.map(drain => {
      // Check if this is a reverse transaction (negative quantity in the database indicates a reverse transaction)
      const isReverseTransaction = drain.quantityLiters < 0;
      
      return {
        id: `fuel-drain-${drain.id}`,
        // Use a different type for reverse transactions to display them differently in the UI
        type: isReverseTransaction ? 'fuel_return' as const : 'fuel_drain' as const,
        transaction_datetime: drain.dateTime ? drain.dateTime.toISOString() : null,
        // For reverse transactions, we want to show the positive quantity
        // For regular drains, we want to show the negative quantity
        quantityLiters: isReverseTransaction ? Math.abs(drain.quantityLiters) : -drain.quantityLiters,
        relatedDocument: drain.notes || 'N/A',
        // Different description for reverse transactions
        sourceOrDestination: isReverseTransaction 
          ? `Povrat filtriranog goriva (Korisnik: ${drain.user?.username || 'N/A'})` 
          : `Drenirano iz tanka (Korisnik: ${drain.user?.username || 'N/A'})`,
        notes: drain.notes || undefined,
      };
    });

    // New: Format internal transfer activities
    type InternalTransferRecord = Prisma.FixedTankTransfersGetPayload<{
      include: {
        affectedFixedTank: { select: { tank_name: true } }; // Corrected
        counterpartyFixedTank: { select: { tank_name: true, tank_identifier: true } }; // Corrected
      }
    }>;
    const formattedInternalTransfers = internalTransferActivities.map((activity: InternalTransferRecord) => {
      let type: 'internal_transfer_in' | 'internal_transfer_out' = activity.activity_type === FixedTankActivityType.INTERNAL_TRANSFER_IN ? 'internal_transfer_in' : 'internal_transfer_out';
      let sourceOrDestInfo = 'N/A';
      let quantity = activity.quantity_liters_transferred; // Default, assuming positive for IN, negative for OUT based on activity_type logic

      if (activity.activity_type === FixedTankActivityType.INTERNAL_TRANSFER_IN) {
        // Fuel is coming IN to parsedTankId from counterpartyFixedTank
        sourceOrDestInfo = `Iz tanka: ${activity.counterpartyFixedTank?.tank_name || 'N/A'} (${activity.counterpartyFixedTank?.tank_identifier || 'N/A'})`;
        // quantity_liters_transferred should be positive
      } else if (activity.activity_type === FixedTankActivityType.INTERNAL_TRANSFER_OUT) {
        // Fuel is going OUT from parsedTankId to counterpartyFixedTank
        sourceOrDestInfo = `U tank: ${activity.counterpartyFixedTank?.tank_name || 'N/A'} (${activity.counterpartyFixedTank?.tank_identifier || 'N/A'})`;
        quantity = -Math.abs(activity.quantity_liters_transferred); // Ensure negative for OUT
      }

      return {
        id: `internal-transfer-${activity.id}`,
        type: type,
        transaction_datetime: activity.transfer_datetime ? activity.transfer_datetime.toISOString() : null,
        quantityLiters: quantity, 
        relatedDocument: `Interni Transfer ID: ${activity.id}`,
        sourceOrDestination: sourceOrDestInfo,
        notes: activity.notes || undefined,
      };
    });

    const combinedHistory = [
      ...formattedIntakes, 
      ...formattedTransfersToMobile, 
      ...formattedDrains,
      ...formattedInternalTransfers // Add new formatted transfers
    ];

    combinedHistory.sort((a, b) => new Date(b.transaction_datetime || 0).getTime() - new Date(a.transaction_datetime || 0).getTime());

    res.status(200).json(combinedHistory);

  } catch (error: any) {
    console.error("[FixedTankHistory] Error fetching tank history:", error);
    next(error);
  }
};

// GET /api/fuel/fixed-tanks/summary/total-intake - Get total fuel intake across all fixed tanks for a date range
export const getTotalFixedTankIntake: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const dateFiltersCondition: Prisma.DateTimeFilter = {};

    if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        parsedStartDate.setHours(0, 0, 0, 0); // Set to start of day
        dateFiltersCondition.gte = parsedStartDate;
      } else {
        console.warn(`[TotalIntake] Invalid startDate format received: ${startDate}`);
      }
    }

    if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        parsedEndDate.setHours(23, 59, 59, 999); // Set to end of day
        dateFiltersCondition.lte = parsedEndDate;
      } else {
        console.warn(`[TotalIntake] Invalid endDate format received: ${endDate}`);
      }
    }

    const whereConditions: Prisma.FixedTankTransfersWhereInput = {
      activity_type: FixedTankActivityType.INTAKE, // Ensure only actual intakes are summed
    };
    if (Object.keys(dateFiltersCondition).length > 0) {
      whereConditions.transfer_datetime = dateFiltersCondition;
    }

    const result = await prisma.fixedTankTransfers.aggregate({
      _sum: {
        quantity_liters_transferred: true,
      },
      where: whereConditions,
    });

    res.status(200).json({ totalIntake: result._sum.quantity_liters_transferred || 0 });

  } catch (error: any) {
    console.error("[TotalIntake] Error fetching total fixed tank intake:", error);
    next(error);
  }
};

// GET /api/fuel/fixed-tanks/summary/all-intakes-list - Get a list of all intake transactions across all fixed tanks for a date range
export const getCombinedIntakeHistoryList: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const dateFiltersCondition: Prisma.DateTimeFilter = {};

    if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        parsedStartDate.setHours(0, 0, 0, 0); // Set to start of day
        dateFiltersCondition.gte = parsedStartDate;
      } else {
        console.warn(`[CombinedIntakeList] Invalid startDate format received: ${startDate}`);
      }
    }

    if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        parsedEndDate.setHours(23, 59, 59, 999); // Set to end of day
        dateFiltersCondition.lte = parsedEndDate;
      } else {
        console.warn(`[CombinedIntakeList] Invalid endDate format received: ${endDate}`);
      }
    }

    const whereConditions: Prisma.FixedTankTransfersWhereInput = {
      activity_type: FixedTankActivityType.INTAKE, // Ensure only actual intakes are fetched
    };
    if (Object.keys(dateFiltersCondition).length > 0) {
      whereConditions.transfer_datetime = dateFiltersCondition;
    }

    const intakeTransactions = await prisma.fixedTankTransfers.findMany({
      where: whereConditions,
      include: {
        affectedFixedTank: { 
          select: { tank_name: true }     
        },
        fuelIntakeRecord: {        
          select: { delivery_note_number: true } 
        }
      },
      orderBy: {
        transfer_datetime: 'desc',
      },
    });

    const formattedIntakes = intakeTransactions.map(intake => ({
      id: String(intake.id),
      transaction_datetime: intake.transfer_datetime ? intake.transfer_datetime.toISOString() : null,
      type: 'intake' as 'intake', 
      quantityLiters: intake.quantity_liters_transferred,
      notes: intake.notes || '',
      relatedDocument: intake.fuelIntakeRecord?.delivery_note_number || '', 
      user: 'Nepoznat korisnik', 
      tankId: intake.affected_fixed_tank_id, 
      tankName: intake.affectedFixedTank?.tank_name || 'Nepoznat rezervoar' 
    }));

    res.status(200).json(formattedIntakes);
    return;

  } catch (error: any) {
    console.error("[CombinedIntakeList] Error fetching combined fixed tank intake list:", error);
    next(error);
  }
};

// POST /api/fuel/fixed-tanks/internal-transfer - Transfer fuel between two fixed tanks
export const transferFuelBetweenFixedTanks: RequestHandler = async (req, res, next): Promise<void> => {
  const { sourceTankId, destinationTankId, quantityLiters, notes } = req.body;

  if (sourceTankId === destinationTankId) {
    res.status(400).json({ message: 'Source and destination tanks cannot be the same.' });
    return;
  }
  if (quantityLiters <= 0) {
    res.status(400).json({ message: 'Quantity to transfer must be a positive number.' });
    return;
  }

  try {
    // Fetch both tanks in a single query if possible, or separately
    const sourceTank = await prisma.fixedStorageTanks.findUnique({
      where: { id: Number(sourceTankId) },
    });
    const destinationTank = await prisma.fixedStorageTanks.findUnique({
      where: { id: Number(destinationTankId) },
    });

    // Validations
    if (!sourceTank) {
      res.status(404).json({ message: `Source tank with ID ${sourceTankId} not found.` });
      return;
    }
    if (!destinationTank) {
      res.status(404).json({ message: `Destination tank with ID ${destinationTankId} not found.` });
      return;
    }
    if (sourceTank.status !== FixedTankStatus.ACTIVE) {
      res.status(400).json({ message: `Source tank '${sourceTank.tank_name}' is not active.` });
      return;
    }
    if (destinationTank.status !== FixedTankStatus.ACTIVE) {
      res.status(400).json({ message: `Destination tank '${destinationTank.tank_name}' is not active.` });
      return;
    }
    if (sourceTank.fuel_type !== destinationTank.fuel_type) {
      res.status(400).json({
        message: `Fuel type mismatch: Source tank has '${sourceTank.fuel_type}', destination tank has '${destinationTank.fuel_type}'.`,
      });
      return;
    }
    if (sourceTank.current_quantity_liters < quantityLiters) {
      res.status(400).json({
        message: `Insufficient fuel in source tank '${sourceTank.tank_name}'. Available: ${sourceTank.current_quantity_liters} L, Required: ${quantityLiters} L.`,
      });
      return;
    }
    const destinationTankAvailableCapacity = destinationTank.capacity_liters - destinationTank.current_quantity_liters;
    if (destinationTankAvailableCapacity < quantityLiters) {
      res.status(400).json({
        message: `Insufficient capacity in destination tank '${destinationTank.tank_name}'. Available capacity: ${destinationTankAvailableCapacity} L, Required: ${quantityLiters} L.`,
      });
      return;
    }

    const transferPairId = uuidv4();
    const transferTime = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Decrement source tank
      await tx.fixedStorageTanks.update({
        where: { id: sourceTank.id },
        data: { current_quantity_liters: { decrement: quantityLiters } },
      });

      // 2. Increment destination tank
      await tx.fixedStorageTanks.update({
        where: { id: destinationTank.id },
        data: { current_quantity_liters: { increment: quantityLiters } },
      });

      // 3. Create TRANSFER_OUT record
      await tx.fixedTankTransfers.create({
        data: {
          activity_type: FixedTankActivityType.INTERNAL_TRANSFER_OUT,
          affected_fixed_tank_id: sourceTank.id,
          counterparty_fixed_tank_id: destinationTank.id,
          internal_transfer_pair_id: transferPairId,
          quantity_liters_transferred: quantityLiters,
          transfer_datetime: transferTime,
          notes: notes || 'Interni izdatak goriva', // Translated to Bosnian
        },
      });

      // 4. Create TRANSFER_IN record
      await tx.fixedTankTransfers.create({
        data: {
          activity_type: FixedTankActivityType.INTERNAL_TRANSFER_IN,
          affected_fixed_tank_id: destinationTank.id,
          counterparty_fixed_tank_id: sourceTank.id,
          internal_transfer_pair_id: transferPairId,
          quantity_liters_transferred: quantityLiters,
          transfer_datetime: transferTime,
          notes: notes || 'Interni prijem goriva', // Translated to Bosnian
        },
      });
    });

    res.status(200).json({ message: 'Fuel transfer successful.' });
    return;

  } catch (error: any) {
    console.error('[TransferFuel] Error during fuel transfer:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle known Prisma errors, e.g., transaction failure
        res.status(500).json({ message: 'Database transaction failed.', details: error.message });
        return;
    }
    next(error);
  }
};
