// frontend/src/components/fuel/types.ts

// From FuelProjections.tsx
export interface ProjectionInputRow {
  id: string;
  airlineId: string;
  destination: string;
  operations: number;
  availableDestinations: string[];
}

export interface ProjectionResult {
  airlineName: string;
  destination: string;
  averageFuelPerOperation: number;
  operationsPerMonth: number;
  monthlyConsumption: number;
  quarterlyConsumption: number;
  yearlyConsumption: number;
  operationsAnalyzed: number;
}

export interface TotalProjection {
  monthly: number;
  quarterly: number;
  yearly: number;
}

// From fuelingOperationsService.ts (or to be defined here)
export interface FuelProjectionPresetData {
  airlineId: string;
  destination: string;
  operations: number;
}

export interface CalculatedResultsData {
  projectionResults: ProjectionResult[];
  totalProjection: TotalProjection | null;
  inputs?: ProjectionInputRow[]; 
}

export interface FullFuelProjectionPreset {
  id: number;
  name: string;
  description?: string | null;
  presetData: FuelProjectionPresetData[];
  calculatedResultsData?: CalculatedResultsData | null;
  createdAt: string;
  updatedAt: string;
}

// Placeholder/Basic definitions for other types used in this module
// Ideally, these should be accurately defined based on your API and data structures
export interface AirlineFE {
  id: number;
  name: string;
  operatingDestinations?: string[]; // Added based on usage in FuelProjections
  // ... other properties
}

export interface FuelTankFE {
  id: number;
  name: string;
  // ... other properties
}

export interface FuelingOperation {
  id: number;
  quantity_liters?: number;
  delivery_note_number?: string | null; // Added based on usage in service
  dateTime: string; // Added for sorting historical operations
  // ... other properties like airline, destination, date, etc.
}

export interface FuelingOperationsApiResponse {
  operations: FuelingOperation[];
  totalLiters: number;
  // ... other properties like pagination details if any
}
