// Base User type from AuthContext, can be extended here if needed
export interface User {
  id: number; 
  username: string;
  email?: string; 
  role: UserRole; 
  companyId?: number | null; 
  createdAt?: string; 
  updatedAt?: string; 
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SERVICER = 'SERVICER',
  FUEL_OPERATOR = 'FUEL_OPERATOR',
  KONTROLA = 'KONTROLA',
  CARINA = 'CARINA',      // New role for customs access
  AERODROM = 'AERODROM'   // New role for airport access
}

export type CreateUserPayload = Pick<User, 'username' | 'role'> & {
  password?: string; 
};

export type UpdateUserPayload = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> & {
  password?: string; 
};

export interface LoginResponse {
  token: string;
  user: User;
}

// Define VehicleStatus Enum
export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',         // Usklađeno sa Prisma
  MAINTENANCE = 'MAINTENANCE',   // Usklađeno sa Prisma
  OUT_OF_SERVICE = 'OUT_OF_SERVICE' // Usklađeno sa Prisma
}

// Interfejs za sliku vozila, prema Prisma šemi
export interface VehicleImage {
  id: number;
  imageUrl: string;
  vehicleId: number;
  isMainImage?: boolean;
  uploadedAt?: string | Date; // Opciono, ako ga šaljemo na frontend
}

// Based on VehicleData from apiService.ts
export interface Vehicle {
  id: number; 
  vehicle_name: string;
  license_plate: string;
  status: VehicleStatus; 
  companyId: number;
  company?: Company;
  locationId: number; 
  location?: Location;
  filter_installed: boolean; 
  chassis_number?: string | null;
  vessel_plate_no?: string | null;
  notes?: string | null;
  image_url?: string | null;
  filter_installation_date?: Date | null; 
  filter_validity_period_months?: number | null;
  filter_type_plate_no?: string | null;
  last_annual_inspection_date?: Date | null; 
  sensor_technology?: string | null;
  last_hose_hd63_replacement_date?: Date | null;
  next_hose_hd63_replacement_date?: Date | null;
  last_hose_hd38_replacement_date?: Date | null;
  next_hose_hd38_replacement_date?: Date | null;
  last_hose_tw75_replacement_date?: Date | null;
  next_hose_tw75_replacement_date?: Date | null;
  last_hose_leak_test_date?: Date | null;
  next_hose_leak_test_date?: Date | null;
  last_volumeter_calibration_date?: Date | null;
  next_volumeter_calibration_date?: Date | null;
  last_manometer_calibration_date?: Date | null;
  next_manometer_calibration_date?: Date | null;
  last_hecpv_ilcpv_test_date?: Date | null;
  next_hecpv_ilcpv_test_date?: Date | null;
  last_6_month_check_date?: Date | null;
  next_6_month_check_date?: Date | null;

  // New fields for tanker specifics and additional validity dates
  kapacitet_cisterne?: number | null;
  tip_filtera?: string | null;          // General filter type (e.g., cartridge, sock)
  crijeva_za_tocenje?: string | null;     // Hose type (e.g., "PODKRILNO", "NADKRILNO")
  registrovano_do?: Date | null;        // Vehicle registration valid until
  adr_vazi_do?: Date | null;            // ADR certificate valid until
  periodicni_pregled_vazi_do?: Date | string | null; // Date for API, string for form input

  // Fields from uncommented tanker section
  tanker_type?: string | null;
  tanker_compartments?: number | null;
  tanker_material?: string | null;
  tanker_last_pressure_test_date?: Date | string | null;
  tanker_next_pressure_test_date?: Date | string | null;
  tanker_last_fire_safety_test_date?: Date | string | null;
  tanker_next_fire_safety_test_date?: Date | string | null;

  // Enhanced Filter Information
  filter_vessel_number?: string | null;
  filter_annual_inspection_date?: Date | string | null;
  filter_next_annual_inspection_date?: Date | string | null;
  filter_ew_sensor_inspection_date?: Date | string | null;
  calculated_filter_expiry_date?: Date | string | null; // For frontend display

  // Hose Details
  broj_crijeva_hd63?: string | null;
  godina_proizvodnje_crijeva_hd63?: number | null;
  datum_testiranja_pritiska_crijeva_hd63?: Date | string | null;
  broj_crijeva_hd38?: string | null;
  godina_proizvodnje_crijeva_hd38?: number | null;
  datum_testiranja_pritiska_crijeva_hd38?: Date | string | null;
  broj_crijeva_tw75?: string | null;
  godina_proizvodnje_crijeva_tw75?: number | null;
  datum_testiranja_pritiska_crijeva_tw75?: Date | string | null;

  // Calibration Dates
  datum_kalibracije_moment_kljuca?: Date | string | null;
  datum_kalibracije_termometra?: Date | string | null;
  datum_kalibracije_hidrometra?: Date | string | null;
  datum_kalibracije_uredjaja_elektricne_provodljivosti?: Date | string | null;

  // CWD Expiry Date
  datum_isteka_cwd?: Date | string | null;

  // Fields for Technical Data section
  year_of_manufacture?: number | null;
  chassis_manufacturer?: string | null;
  chassis_type?: string | null;
  body_manufacturer?: string | null;
  body_type?: string | null;
  axle_count?: number | null;
  carrying_capacity_kg?: number | null;
  engine_power_kw?: number | null;
  engine_displacement_ccm?: number | null;
  seat_count?: number | null;
  fuel_type?: string | null;

  // Fields for Calibration section (specific calibrations)
  tahograf_zadnja_kalibracija?: Date | string | null;
  tahograf_naredna_kalibracija?: Date | string | null;
  cisterna_zadnja_kalibracija?: Date | string | null;
  cisterna_naredna_kalibracija?: Date | string | null;

  responsible_person_contact?: string | null;
  created_at?: string; 
  updated_at?: string; 
  images?: VehicleImage[]; // Niz slika povezanih sa vozilom
}

export interface Company {
  id: number;
  name: string;
  taxId?: string;            // PDV broj
  city?: string;             // Mjesto
  address?: string;          // Adresa firme
  contactPersonName?: string; // Kontakt osoba
  contactPersonPhone?: string;// Broj telefona kontakt osobe
  vehicles?: Vehicle[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Location {
  id: number;
  name: string;
  address?: string | null;
  companyTaxId?: string | null;
  vehicles?: Vehicle[];
  createdAt?: string;
  updatedAt?: string;
}

// Type for creating a location, omitting id as it's auto-generated
export type CreateLocationPayload = Omit<Location, 'id' | 'vehicles' | 'createdAt' | 'updatedAt'>;

// Type for creating a vehicle, usually omits id, createdAt, updatedAt
export type CreateVehiclePayload = Omit<Vehicle, 'id' | 'company' | 'location' | 'created_at' | 'updated_at' | 'next_hose_hd63_replacement_date' | 'next_hose_hd38_replacement_date' | 'next_hose_tw75_replacement_date' | 'next_hose_leak_test_date' | 'next_volumeter_calibration_date' | 'next_manometer_calibration_date' | 'next_hecpv_ilcpv_test_date' | 'next_6_month_check_date'>;

// Extended CreateVehiclePayload to include image_url if needed during creation
export type CreateVehicleWithImagePayload = CreateVehiclePayload & { image_url?: string | null };

// Define ServiceRecordCategory Enum
export enum ServiceRecordCategory {
  REGULAR_MAINTENANCE = 'REGULAR_MAINTENANCE',
  REPAIR = 'REPAIR',
  TECHNICAL_INSPECTION = 'TECHNICAL_INSPECTION',
  FILTER_REPLACEMENT = 'FILTER_REPLACEMENT',
  HOSE_REPLACEMENT = 'HOSE_REPLACEMENT',
  CALIBRATION = 'CALIBRATION',
  OTHER = 'OTHER'
}

// Define ServiceItemType Enum - items that can be serviced
export enum ServiceItemType {
  FILTER = 'FILTER',
  HOSE_HD63 = 'HOSE_HD63',
  HOSE_HD38 = 'HOSE_HD38',
  HOSE_TW75 = 'HOSE_TW75',
  HOSE_LEAK_TEST = 'HOSE_LEAK_TEST',
  VOLUMETER = 'VOLUMETER',
  MANOMETER = 'MANOMETER',
  HECPV_ILCPV = 'HECPV_ILCPV',
  SIX_MONTH_CHECK = 'SIX_MONTH_CHECK',
  ENGINE = 'ENGINE',
  BRAKES = 'BRAKES',
  TRANSMISSION = 'TRANSMISSION',
  ELECTRICAL = 'ELECTRICAL',
  TIRES = 'TIRES',
  OTHER = 'OTHER'
}

// Interface for service items included in a service record
export interface ServiceItem {
  type: ServiceItemType;
  description?: string;
  replaced?: boolean;
}

// Interface for service records
export interface ServiceRecord {
  id: number;
  vehicleId: number;
  serviceDate: Date | string;
  description: string;
  category: ServiceRecordCategory;
  documentUrl?: string | null;
  serviceItems: ServiceItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Type for creating a service record
export type CreateServiceRecordPayload = Omit<ServiceRecord, 'id' | 'createdAt' | 'updatedAt'>;
