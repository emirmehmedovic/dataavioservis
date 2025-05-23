export enum FuelType {
  DIESEL = 'Dizel',
  BMB95 = 'Benzin BMB95',
  JET_A1 = 'Jet A-1',
  AVGAS_100LL = 'Avgas 100LL',
  // Add other relevant fuel types here
}

export enum FixedTankStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export interface FixedStorageTank {
  id: number;
  tank_name: string;
  tank_identifier: string;
  capacity_liters: number;
  current_quantity_liters: number;
  fuel_type: string;
  location_description: string | null;
  status: string;
  identificationDocumentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Represents a single transaction in the history of a fixed tank
export interface TankTransaction {
  id: string; // Backend generates string IDs like 'intake-123'
  transaction_datetime: string; // ISO date-time string from backend
  type: 'intake' | 'transfer_to_mobile' | 'adjustment_plus' | 'adjustment_minus' | 'fuel_drain' | 'internal_transfer_in' | 'internal_transfer_out' | string; // Transaction type from backend
  quantityLiters: number; // Quantity from backend
  relatedDocument?: string | null; // From backend
  sourceOrDestination?: string | null; // From backend, can be tank name or vehicle ID
  notes?: string | null;
  tankName?: string;      // Name of the tank involved in the transaction
  user?: string;          // User associated with the transaction
}

// Corresponds to Prisma Model FuelIntakeDocuments
export interface FuelIntakeDocument {
  id: number;
  fuel_intake_record_id: number;
  document_name: string;
  document_path: string;
  document_type: string;
  file_size_bytes: number;
  mime_type: string;
  uploaded_at: string; // ISO date-time string
}

// Corresponds to Prisma Model FixedTankTransfers
// This might be slightly different from TankTransaction if used directly
// For now, TankTransaction covers the history view well.
// We can define a more direct FixedTankTransferType if needed for other contexts.
export interface FixedTankTransfer {
  id: number;
  fuel_intake_record_id: number;
  affected_fixed_tank_id: number; 
  quantity_liters_transferred: number;
  transfer_datetime: string; // ISO date-time string
  notes?: string | null;
  affectedFixedTank?: Pick<FixedStorageTank, 'tank_name' | 'tank_identifier'>; 
}

// Corresponds to Prisma Model FuelIntakeRecords
export interface FuelIntakeRecord {
  id: number;
  delivery_vehicle_plate: string;
  delivery_vehicle_driver_name?: string | null;
  intake_datetime: string; // ISO date-time string
  quantity_liters_received: number;
  quantity_kg_received: number;
  specific_gravity: number;
  fuel_type: FuelType; // Assuming FuelType enum can be used here
  supplier_name?: string | null;
  delivery_note_number?: string | null;
  customs_declaration_number?: string | null;
  createdAt: string; // ISO date-time string
  updatedAt: string; // ISO date-time string
  documents?: FuelIntakeDocument[];      // Included by backend controller
  fixedTankTransfers?: FixedTankTransfer[]; // Included by backend controller
}

// Filters for fetching FuelIntakeRecords
export interface FuelIntakeFilters {
  fuel_type?: FuelType | string; // Allow string for 'all' or specific enum value
  supplier_name?: string;
  delivery_vehicle_plate?: string;
  startDate?: string; // ISO date string or YYYY-MM-DD
  endDate?: string;   // ISO date string or YYYY-MM-DD
  // Add other potential filters like customs_declaration_number if needed
}
