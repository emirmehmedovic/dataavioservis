import {
  User as ImportedUser,
  LoginResponse as ImportedLoginResponse,
  Vehicle,
  Company,
  Location,
  CreateVehiclePayload, // For creating new vehicles
  CreateLocationPayload, // For creating new locations
  VehicleImage, // Added VehicleImage
  ServiceRecord,
  CreateServiceRecordPayload,
  UserRole,             // Added UserRole
  CreateUserPayload,    // Added CreateUserPayload
  UpdateUserPayload     // Added UpdateUserPayload
} from '@/types';
import {
  FixedStorageTank,
  TankTransaction,
  FuelIntakeRecord,      // Added FuelIntakeRecord
  FuelIntakeFilters,     // Added FuelIntakeFilters
  FuelIntakeDocument,    // Added FuelIntakeDocument (proactively, might be needed soon)
  FixedTankTransfer,      // Added FixedTankTransfer (proactively)
  FuelType,              // Ensure FuelType is imported for the payload type
  FixedTankStatus        // Added FixedTankStatus
} from '@/types/fuel';

// Re-export the types needed by other components
export type LoginResponse = ImportedLoginResponse;
export type User = ImportedUser;

// Type for login credentials, can also be moved to @/types if used elsewhere
interface LoginCredentials {
  username: string;
  password: string;
}

// Payload for fixed tank to fixed tank transfer
export interface FixedTankToFixedTankTransferPayload {
  sourceTankId: number;
  destinationTankId: number;
  quantityLiters: number;
}

// API_BASE_URL should be the pure base, e.g., http://localhost:3001
// The '/api' part will be added in each function call or within fetchWithAuth if preferred.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Modifikovana fetchWithAuth da bude generička
interface FetchWithAuthOptions extends RequestInit {
  returnRawResponse?: boolean;
}

export async function fetchWithAuth<T>(urlPath: string, options: FetchWithAuthOptions = {}): Promise<T> {
  // Check both possible token storage locations
  let token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  // If token not found in 'authToken', try 'token' as fallback
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token');
    if (token) {
      console.log('Using token from localStorage.token instead of localStorage.authToken');
    }
  }
  
  // Destructure our custom option and spread the rest for native fetch
  const { returnRawResponse, ...nativeFetchOptions } = options;

  let fullUrl = urlPath;
  // Check if urlPath is relative (starts with '/') and prepend API_BASE_URL
  if (urlPath.startsWith('/')) {
    fullUrl = `${API_BASE_URL}${urlPath}`;
  }

  // Podrazumevani headeri
  const defaultHeaders: HeadersInit = {};
  if (!(nativeFetchOptions.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No authentication token found in localStorage');
  }

  const headers = {
    ...defaultHeaders,
    ...nativeFetchOptions.headers, // Use headers from nativeFetchOptions
  };

  const response = await fetch(fullUrl, { ...nativeFetchOptions, headers }); // Use fullUrl

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, use status text
      errorData = { message: response.statusText };
    }
    console.error('API Error:', errorData, 'URL:', fullUrl); // Use fullUrl
    const errorMessage = errorData.message || 
                        (errorData.errors && errorData.errors.length > 0 ? 
                         errorData.errors.map((e: any) => e.msg).join(', ') : 
                         `Server error (${response.status})`);
    
    const errorToThrow = new Error(errorMessage);
    // Dodajemo cijelo parsirano tijelo greške na error objekt za lakši pristup u catch blokovima
    (errorToThrow as any).responseBody = errorData; 
    throw errorToThrow;
  }
  
  // If returnRawResponse is true, return the raw response object
  // This is useful for file downloads where we need the blob, not JSON
  if (returnRawResponse) { // Use the destructured custom option
    return response as unknown as T; // Cast to T, caller must handle it as Response
  }

  // Handle 204 No Content specifically
  if (response.status === 204) {
    // For 204, it's common to return an empty array if an array is expected (e.g., list endpoints)
    // Or null/undefined if an object is expected and 204 means 'not found' or 'no data'.
    // Returning [] as T is a common safe default for list operations.
    return [] as unknown as T;
  }

  // Ako status nije OK, ali nema JSON tijela, response.json() će baciti grešku koju će uhvatiti viši catch blok.
  // Ako je status OK, ali tijelo nije JSON, također će baciti grešku.
  try {
    // For other OK statuses (e.g., 200), expect a JSON body.
    const jsonData = await response.json();
    return jsonData;
  } catch (e) {
    // This catch block handles errors if response.json() fails for an OK status
    // (e.g., 200 OK but the body is not valid JSON).
    console.error(
      `Error parsing JSON response for an OK status (Status: ${response.status}) from URL: ${fullUrl}. Error:`, e
    );
    throw new Error(
      `API returned an OK status (${response.status}) but failed to provide valid JSON from ${fullUrl}.`
    );
  }
}

// --- Auth API --- //
export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  // Note: No 'Authorization' header needed for login
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Login API Error:', data);
    throw new Error(data.message || data.errors?.map((e: any) => e.msg).join(', ') || `Error ${response.status}`);
  }
  return data;
}

// --- Vehicle API --- //
export async function createVehicle(vehicleData: CreateVehiclePayload): Promise<Vehicle> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles`, {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
}

export async function getVehicles(): Promise<Vehicle[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles`); // Changed to /vehicles (plural)
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${id}`); // Added function, using /vehicles (plural)
}

export async function updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  });
}

// Funkcija za upload slike vozila
export const uploadVehicleImage = async (vehicleId: string, file: File): Promise<VehicleImage> => {
  const formData = new FormData();
  formData.append('image', file);

  // URL treba da bude kompletan, uključujući API_BASE_URL
  return fetchWithAuth<VehicleImage>(`${API_BASE_URL}/api/vehicles/${vehicleId}/images`, {
    method: 'POST',
    body: formData,
    // Content-Type se ne postavlja manuelno za FormData
  });
};

// Add deleteVehicle function
export async function deleteVehicle(id: number): Promise<{ message: string }> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${id}`, {
    method: 'DELETE',
  });
}

// --- Company API --- //
export async function getCompanies(): Promise<Company[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/companies`);
}

export async function getCompanyById(id: number): Promise<Company> {
  return fetchWithAuth(`${API_BASE_URL}/api/companies/${id}`);
}

export interface CreateCompanyPayload {
  name: string;
}

export async function createCompany(companyData: CreateCompanyPayload): Promise<Company> {
  return fetchWithAuth(`${API_BASE_URL}/api/companies`, {
    method: 'POST',
    body: JSON.stringify(companyData),
  });
}

export interface UpdateCompanyPayload {
  name?: string; // Made name optional
  taxId?: string;
  city?: string;
  address?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
}

export async function updateCompany(id: number, companyData: UpdateCompanyPayload): Promise<Company> {
  return fetchWithAuth(`${API_BASE_URL}/api/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(companyData),
  });
}

export async function deleteCompany(id: number): Promise<{ message: string }> { // Backend returns { message: '...' }
  return fetchWithAuth(`${API_BASE_URL}/api/companies/${id}`, {
    method: 'DELETE',
  });
}

// --- Location API --- //
export async function getLocations(): Promise<Location[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/locations`); // Changed to /locations (plural)
}

export async function createLocation(locationData: CreateLocationPayload): Promise<Location> {
  return fetchWithAuth(`${API_BASE_URL}/api/locations`, { // Changed to /locations (plural)
    method: 'POST',
    body: JSON.stringify(locationData),
  });
}

// --- User Management API --- //
export async function getUsers(): Promise<User[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/users`);
}

export async function createUser(userData: CreateUserPayload): Promise<User> {
  return fetchWithAuth(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id: number, userData: UpdateUserPayload): Promise<User> {
  return fetchWithAuth(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id: number): Promise<{ message: string }> {
  return fetchWithAuth(`${API_BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
  });
}

// FIXED STORAGE TANKS -- START
export const getFixedTanks = async (): Promise<FixedStorageTank[]> => {
  const url = `${API_BASE_URL}/api/fuel/fixed-tanks`;
  console.log('Fetching fixed tanks from URL:', url); // Log the URL
  try {
    // Assuming fetchWithAuth can handle GET requests and returns the parsed JSON directly.
    // If it returns a Response object, you'll need to await response.json().
    const data = await fetchWithAuth<FixedStorageTank[]>(url);
    return data;
  } catch (error) {
    console.error('Error fetching fixed tanks:', error);
    // Rethrowing the error so the calling component can handle it (e.g., display an error message)
    throw error;
  }
};

export const createFixedTank = async (data: Partial<Omit<FixedStorageTank, 'id' | 'createdAt' | 'updatedAt' | 'current_quantity_liters'>> & { current_liters?: number } | FormData): Promise<FixedStorageTank> => {
  try {
    let response;
    if (data instanceof FormData) {
      response = await fetchWithAuth<FixedStorageTank>(`${API_BASE_URL}/api/fuel/fixed-tanks`, {
        method: 'POST',
        body: data, // Send FormData directly
      });
    } else {
      response = await fetchWithAuth<FixedStorageTank>(`${API_BASE_URL}/api/fuel/fixed-tanks`, {
        method: 'POST',
        body: JSON.stringify(data),
        // headers: { 'Content-Type': 'application/json' } // fetchWithAuth should handle this
      });
    }
    return response;
  } catch (error: any) { 
    console.error('Error creating fixed tank:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create fixed tank');
  }
};

export const updateFixedTank = async (tankId: number, data: Partial<FixedStorageTank> | FormData): Promise<FixedStorageTank> => {
  try {
    let response;
    if (data instanceof FormData) {
      // When sending FormData, browser sets the Content-Type header automatically with the correct boundary.
      // Do not set it manually to 'multipart/form-data' as it might miss the boundary string.
      response = await fetchWithAuth<FixedStorageTank>(`${API_BASE_URL}/api/fuel/fixed-tanks/${tankId}`, {
        method: 'PUT',
        body: data, // Send FormData directly
      });
    } else {
      response = await fetchWithAuth<FixedStorageTank>(`${API_BASE_URL}/api/fuel/fixed-tanks/${tankId}`, {
        method: 'PUT',
        body: JSON.stringify(data), // Existing logic for JSON payload
        // headers: { 'Content-Type': 'application/json' } // fetchWithAuth should handle this
      });
    }
    return response;
  } catch (error: any) { 
    console.error(`Error updating fixed tank with ID ${tankId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update fixed tank');
  }
};

export const deleteFixedTank = async (tankId: number): Promise<{ message: string }> => {
  return fetchWithAuth(`${API_BASE_URL}/api/fuel/fixed-tanks/${tankId}`, {
    method: 'DELETE',
  });
};

// Function for fetching tank history
export const getFixedTankHistory = async (
  tankId: number,
  startDate?: string | null, // Optional startDate
  endDate?: string | null    // Optional endDate
): Promise<TankTransaction[]> => {
  try {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/fuel/fixed-tanks/${tankId}/history${queryString ? `?${queryString}` : ''}`;

    const data = await fetchWithAuth<TankTransaction[]>(url);

    return data;

  } catch (error) {
    console.error(`Error fetching tank history for tank ID ${tankId} with params: ${JSON.stringify({startDate, endDate})}:`, error);
    throw error; // Rethrow to be handled by the calling component
  }
};

// Function for fetching total fuel intake across all fixed tanks
export const getTotalFixedTankIntake = async (
  startDate?: string | null,
  endDate?: string | null
): Promise<{ totalIntake: number }> => {
  const queryParams = new URLSearchParams();
  if (startDate) {
    queryParams.append('startDate', startDate);
  }
  if (endDate) {
    queryParams.append('endDate', endDate);
  }
  const url = `${API_BASE_URL}/api/fuel/fixed-tanks/summary/total-intake?${queryParams.toString()}`;
  return fetchWithAuth<{ totalIntake: number }>(url);
};

// Function for fetching a list of all intake transactions across all fixed tanks
export const getAllFixedTankIntakesList = async (
  startDate?: string | null,
  endDate?: string | null
): Promise<TankTransaction[]> => {
  const queryParams = new URLSearchParams();
  if (startDate) {
    queryParams.append('startDate', startDate);
  }
  if (endDate) {
    queryParams.append('endDate', endDate);
  }
  const url = `${API_BASE_URL}/api/fuel/fixed-tanks/summary/all-intakes-list?${queryParams.toString()}`;
  return fetchWithAuth<TankTransaction[]>(url);
};

// Function for transferring fuel between two fixed tanks
export const createFixedTankToFixedTankTransfer = async (
  payload: FixedTankToFixedTankTransferPayload
): Promise<any> => { // Consider a more specific return type based on backend response
  const url = `${API_BASE_URL}/api/fuel/fixed-tanks/internal-transfer`;
  return fetchWithAuth<any>(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// --- Fuel Intake API --- //

// Payload for creating a new Fuel Intake Record
// This matches the backend expectation: FuelIntakeRecord data + FixedTankTransfers array
export interface CreateFuelIntakePayload {
  delivery_vehicle_plate: string;
  delivery_vehicle_driver_name?: string | null;
  intake_datetime: string; // ISO string
  quantity_liters_received: number;
  quantity_kg_received: number;
  specific_gravity: number;
  fuel_type: FuelType;
  supplier_name?: string | null;
  delivery_note_number?: string | null;
  customs_declaration_number?: string | null;
  // Represents the FixedTankTransfers part
  tank_distributions: Array<{
    tank_id: number; // Corresponds to fixed_storage_tank_id in FixedTankTransfers model
    quantity_liters: number; // Corresponds to quantity_liters_transferred
    // transfer_datetime will be set by backend (DEFAULT NOW() or from intake_datetime)
    // notes are optional and not currently captured in the wizard's TankDistributionData
  }>;
}

export const createFuelIntake = async (payload: CreateFuelIntakePayload): Promise<FuelIntakeRecord> => {
  const url = `${API_BASE_URL}/api/fuel/intakes`;
  return fetchWithAuth<FuelIntakeRecord>(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const uploadFuelIntakeDocument = async (
  intakeRecordId: number,
  file: File,
  documentType: string
): Promise<FuelIntakeDocument> => {
  const formData = new FormData();
  formData.append('document', file); // Changed 'file' to 'document' to match backend Multer config
  formData.append('document_type', documentType);
  formData.append('document_name', file.name); // Added document_name based on original file name

  const url = `${API_BASE_URL}/api/fuel/intakes/${intakeRecordId}/documents`;
  return fetchWithAuth<FuelIntakeDocument>(url, {
    method: 'POST',
    body: formData,
    // Content-Type is not set manually for FormData, fetch handles it
  });
};

// Existing getFuelIntakes function (if any, or other fuel related functions)
export const getFuelIntakes = async (filters?: Partial<FuelIntakeFilters>): Promise<FuelIntakeRecord[]> => {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        queryParams.append(key, String(value));
      }
    });
  }
  const url = `${API_BASE_URL}/api/fuel/intakes?${queryParams.toString()}`;
  console.log('Fetching fuel intakes from URL:', url);
  try {
    const data = await fetchWithAuth<FuelIntakeRecord[]>(url);
    return data;
  } catch (error) {
    console.error('Error fetching fuel intakes:', error);
    throw error;
  }
};

// --- Service Records API --- //

// Get all service records for a vehicle
export async function getVehicleServiceRecords(vehicleId: number | string): Promise<ServiceRecord[]> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}/service-records`);
}

// Get a specific service record
export async function getServiceRecordById(vehicleId: number | string, recordId: number | string): Promise<ServiceRecord> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}/service-records/${recordId}`);
}

// Create a new service record
export async function createServiceRecord(vehicleId: number | string, serviceData: CreateServiceRecordPayload): Promise<ServiceRecord> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}/service-records`, {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
}

// Update a service record
export async function updateServiceRecord(
  vehicleId: number | string, 
  recordId: number | string, 
  serviceData: Partial<ServiceRecord>
): Promise<ServiceRecord> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}/service-records/${recordId}`, {
    method: 'PUT',
    body: JSON.stringify(serviceData),
  });
}

// Delete a service record
export async function deleteServiceRecord(vehicleId: number | string, recordId: number | string): Promise<{ message: string }> {
  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}/service-records/${recordId}`, {
    method: 'DELETE',
  });
}

// Upload a PDF document for a service record
export const uploadServiceRecordDocument = async (
  vehicleId: number | string, 
  recordId: number | string, 
  file: File
): Promise<{ documentUrl: string }> => {
  const formData = new FormData();
  formData.append('document', file);

  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}/service-records/${recordId}/document`, {
    method: 'POST',
    body: formData,
  });
};

// Upload a PDF document when creating a service record (single request with both data and file)
export const createServiceRecordWithDocument = async (
  vehicleId: number | string, 
  serviceData: Omit<CreateServiceRecordPayload, 'documentUrl'>, 
  file?: File
): Promise<ServiceRecord> => {
  const formData = new FormData();
  
  // Add service data as JSON string in a field
  formData.append('data', JSON.stringify(serviceData));
  
  // Add file if provided
  if (file) {
    formData.append('document', file);
  }

  return fetchWithAuth(`${API_BASE_URL}/api/vehicles/${vehicleId}/service-records/with-document`, {
    method: 'POST',
    body: formData,
  });
};
