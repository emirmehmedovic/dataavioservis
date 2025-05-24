"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FuelType, FixedStorageTank, FuelIntakeRecord } from '../../types/fuel';
import {
  getFixedTanks,
  createFuelIntake,
  uploadFuelIntakeDocument,
  CreateFuelIntakePayload
} from '../../lib/apiService';
import { Trash2, UploadCloud, Edit3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// TODO: Import necessary types: FuelIntakeRecord, FixedStorageTank, FuelType etc.
// TODO: Import API service functions: getFixedTanks, createFuelIntake, uploadFuelIntakeDocument

const STEPS = {
  DELIVERY_DETAILS: 1,
  TANK_DISTRIBUTION: 2,
  DOCUMENT_UPLOAD: 3,
  REVIEW_SUBMIT: 4, // Enabled Review Step
};

interface TankDistributionData {
  tank_id?: number;
  quantity_liters?: number;
  // Potentially add tank_name or identifier here for easier display, but keep data minimal for submission
}

interface DocumentUploadData {
  file: File;
  document_type: string;
  // previewUrl?: string; // Optional: for image previews, not implemented yet
}

// Placeholder for form data structure - will be expanded
interface IntakeFormData {
  // Step 1
  delivery_vehicle_plate?: string;
  delivery_vehicle_driver_name?: string;
  intake_datetime?: string; // Using string for datetime-local input
  quantity_liters_received?: number;
  quantity_kg_received?: number;
  specific_gravity?: number;
  fuel_type?: FuelType;
  supplier_name?: string;
  delivery_note_number?: string;
  customs_declaration_number?: string;
  
  // Step 2
  tank_distributions?: TankDistributionData[];

  // Step 3
  document_uploads?: DocumentUploadData[]; // Added for Step 3
}

// Updated FormErrors to better handle indexed errors for tank_distributions and document_uploads
type FormErrors = Partial<Record<keyof Omit<IntakeFormData, 'tank_distributions' | 'document_uploads'>, string>> & {
  tank_distributions?: {
    [index: number]: Partial<Record<keyof TankDistributionData, string>>;
  };
  document_uploads?: {
    [index: number]: Partial<Record<keyof DocumentUploadData, string>>;
  };
  general_tank_distribution?: string; // For errors like overall quantity mismatch
  general_document_upload?: string; // For general file upload errors
};

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function NewFuelIntakeFormWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEPS.DELIVERY_DETAILS);
  const [formData, setFormData] = useState<Partial<IntakeFormData>>({
    tank_distributions: [{}],
    document_uploads: [], // Initialize document_uploads
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [availableTanks, setAvailableTanks] = useState<FixedStorageTank[]>([]);
  const [tanksLoading, setTanksLoading] = useState<boolean>(false);
  const [tanksError, setTanksError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch fixed tanks on component mount
  useEffect(() => {
    const fetchTanks = async () => {
      setTanksLoading(true);
      setTanksError(null);
      try {
        const tanks = await getFixedTanks();
        // Filter tanks by fuel type if fuel_type is already selected in Step 1?
        // For now, fetching all. Can be refined.
        setAvailableTanks(tanks);
      } catch (err: any) {
        console.error("Failed to fetch fixed tanks:", err);
        setTanksError(err.message || "Greška pri dohvatanju fiksnih tankova.");
      }
      setTanksLoading(false);
    };
    fetchTanks();
  }, []); // Empty dependency array means it runs once on mount

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
    fieldName?: keyof IntakeFormData // For Select or custom components
  ) => {
    let name: keyof IntakeFormData;
    let value: any;

    if (typeof e === 'string') {
      // This case is for Select where e is the value and fieldName is provided
      if (!fieldName) return; // Should not happen if used correctly
      name = fieldName;
      value = e;
    } else {
      // This case is for standard HTML input elements
      name = e.target.name as keyof IntakeFormData;
      const target = e.target as HTMLInputElement;
      value = target.type === 'checkbox' ? target.checked : target.value;
    }

    const numericFields: (keyof IntakeFormData)[] = ['quantity_liters_received', 'quantity_kg_received', 'specific_gravity'];

    if (numericFields.includes(name)) {
      value = value === '' ? undefined : parseFloat(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field when user starts typing
    if (formErrors[name as keyof Omit<IntakeFormData, 'tank_distributions' | 'document_uploads'>]) {
      setFormErrors(prev => ({ ...prev, [name as keyof Omit<IntakeFormData, 'tank_distributions' | 'document_uploads'>]: undefined }));
    }
  };

  useEffect(() => {
    const { quantity_liters_received, quantity_kg_received } = formData;

    const qL = typeof quantity_liters_received === 'number' && !isNaN(quantity_liters_received) ? quantity_liters_received : null;
    const qKg = typeof quantity_kg_received === 'number' && !isNaN(quantity_kg_received) ? quantity_kg_received : null;

    // Only calculate if both values are valid and positive
    if (qL !== null && qL > 0 && qKg !== null && qKg > 0) {
      // Calculate specific gravity from liters and kg
      const calculatedSg = parseFloat((qKg / qL).toFixed(3));
      
      // Update only if different from current value
      if (calculatedSg !== formData.specific_gravity) {
        setFormData(prev => ({
          ...prev,
          specific_gravity: calculatedSg
        }));
      }
    }
  }, [formData.quantity_liters_received, formData.quantity_kg_received]);  // Only depend on the two input values

  // --- Tank Distribution Handlers ---
  const handleAddTankDistribution = () => {
    setFormData(prev => ({
      ...prev,
      tank_distributions: [...(prev.tank_distributions || []), {}],
    }));
  };

  const handleRemoveTankDistribution = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tank_distributions: prev.tank_distributions?.filter((_, i) => i !== index),
    }));
    // Clear errors for this specific index if any
    if (formErrors.tank_distributions && formErrors.tank_distributions[index]) {
        const newTankErrors = { ...formErrors.tank_distributions };
        delete newTankErrors[index];
        setFormErrors(prev => ({ ...prev, tank_distributions: newTankErrors }));
    }
  };

  const handleTankDistributionChange = (index: number, field: keyof TankDistributionData, value: string | number) => {
    setFormData(prev => {
      const newDistributions = [...(prev.tank_distributions || [])];
      const currentEntry = { ...newDistributions[index] };
      
      if (field === 'quantity_liters') {
        currentEntry[field] = value === '' ? undefined : parseFloat(value as string);
      } else if (field === 'tank_id') {
        currentEntry[field] = value === '' ? undefined : parseInt(value as string, 10);
      }
      newDistributions[index] = currentEntry;
      return { ...prev, tank_distributions: newDistributions };
    });
    // Clear validation error for this specific field
    if (formErrors.tank_distributions && formErrors.tank_distributions[index] && formErrors.tank_distributions[index][field]) {
        const newTankErrors = { ...formErrors.tank_distributions };
        const newIndexErrors = { ...newTankErrors[index] };
        delete newIndexErrors[field];
        newTankErrors[index] = newIndexErrors;
        if (Object.keys(newTankErrors[index]).length === 0) delete newTankErrors[index];
        setFormErrors(prev => ({ ...prev, tank_distributions: newTankErrors }));
    }
  };

  // Memoized filtered tanks for Step 2 dropdowns
  const filteredAvailableTanks = useMemo(() => {
    if (!formData.fuel_type) return availableTanks; // Show all if fuel type in step 1 not chosen
    return availableTanks.filter(tank => tank.fuel_type === formData.fuel_type);
  }, [availableTanks, formData.fuel_type]);

  const getTankDisplayInfo = (tankId?: number) => {
    const tank = availableTanks.find(t => t.id === tankId);
    if (!tank) return 'N/A';
    const freeCapacity = tank.capacity_liters - tank.current_quantity_liters;
    return `${tank.tank_name} (${tank.tank_identifier}) / ${tank.fuel_type} / Kap: ${tank.capacity_liters.toFixed(0)}L / Tren: ${tank.current_quantity_liters.toFixed(0)}L / Slob: ${freeCapacity.toFixed(0)}L`;
  };

  const totalDistributedQuantity = useMemo(() => {
    return formData.tank_distributions?.reduce((sum, dist) => sum + (dist.quantity_liters || 0), 0) || 0;
  }, [formData.tank_distributions]);

  const validateStep1 = (): boolean => {
    const errors: FormErrors = {};
    if (!formData.delivery_vehicle_plate?.trim()) {
      errors.delivery_vehicle_plate = "Registarska oznaka je obavezna.";
    }
    if (!formData.intake_datetime) {
      errors.intake_datetime = "Datum i vrijeme ulaza su obavezni.";
    }
    if (!formData.fuel_type) {
      errors.fuel_type = "Tip goriva je obavezan.";
    }

    const qL = formData.quantity_liters_received;
    const qKg = formData.quantity_kg_received;
    
    // Sada zahtijevamo samo litre i kilograme
    if (!qL || !qKg) {
      if (!qL) errors.quantity_liters_received = "Količina (L) je obavezna.";
      if (!qKg) errors.quantity_kg_received = "Količina (KG) je obavezna.";
    } else {
      if (qL <= 0) errors.quantity_liters_received = "Količina (L) mora biti pozitivna.";
      if (qKg <= 0) errors.quantity_kg_received = "Količina (KG) mora biti pozitivna.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: FormErrors = { ...formErrors, tank_distributions: {}, general_tank_distribution: undefined }; // Preserve other step errors
    let isValid = true;
    const EPSILON = 0.005; // Tolerance for floating point comparisons (0.005 to be safe with 2 decimal places)

    if (!formData.tank_distributions || formData.tank_distributions.length === 0) {
      if ((formData.quantity_liters_received || 0) > 0) {
        errors.general_tank_distribution = "Morate rasporediti primljenu količinu goriva.";
        isValid = false;
      }
    } else {
      const selectedTankIds = new Set<number>();
      formData.tank_distributions.forEach((dist, index) => {
        const itemErrors: Partial<Record<keyof TankDistributionData, string>> = {};
        if (dist.tank_id === undefined) {
          itemErrors.tank_id = "Odaberite tank.";
          isValid = false;
        } else {
          if (selectedTankIds.has(dist.tank_id)) {
            itemErrors.tank_id = "Ovaj tank je već odabran.";
            isValid = false;
          }
          selectedTankIds.add(dist.tank_id);
          const tankDetails = availableTanks.find(t => t.id === dist.tank_id);
          if (tankDetails && formData.fuel_type && tankDetails.fuel_type !== formData.fuel_type) {
            itemErrors.tank_id = `Tank ${tankDetails.tank_name} ne podržava ${formData.fuel_type}.`;
            isValid = false;
          }
          if (tankDetails && dist.quantity_liters !== undefined && dist.quantity_liters > (tankDetails.capacity_liters - tankDetails.current_quantity_liters)) {
            itemErrors.quantity_liters = `Količina premašuje slobodni kapacitet tanka (${(tankDetails.capacity_liters - tankDetails.current_quantity_liters).toFixed(2)} L).`;
            isValid = false;
          }
        }
        if (dist.quantity_liters === undefined || dist.quantity_liters <= 0) {
          itemErrors.quantity_liters = "Unesite pozitivnu količinu.";
          isValid = false;
        }
        if (Object.keys(itemErrors).length > 0) {
          if (!errors.tank_distributions) errors.tank_distributions = {};
          errors.tank_distributions[index] = itemErrors;
        }
      });
    }

    // Adjust for potential floating point inaccuracies
    const receivedQty = formData.quantity_liters_received || 0;

    if (totalDistributedQuantity > receivedQty + EPSILON) {
      errors.general_tank_distribution = `Ukupno raspoređena količina (${totalDistributedQuantity.toFixed(2)} L) ne može premašiti primljenu količinu (${receivedQty.toFixed(2)} L).`;
      isValid = false;
    }
    // Check if not fully distributed, allowing for small negative Epsilon due to prior calculation (e.g. remaining is -0.00001)
    // The display already shows toFixed(2) for remaining, so a very small negative is displayed as -0.00 or 0.00.
    // We want to ensure it's not significantly less.
    const remainingForDistribution = receivedQty - totalDistributedQuantity;
    if (remainingForDistribution > EPSILON && receivedQty > 0) { // If significantly more than EPSILON remains to be distributed
      errors.general_tank_distribution = `Morate rasporediti cjelokupnu primljenu količinu. Preostalo: ${remainingForDistribution.toFixed(2)} L.`;
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // --- Document Upload Handlers (Step 3) ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newUploads: DocumentUploadData[] = Array.from(files).map(file => ({
        file,
        document_type: '', // Default empty type, user needs to fill this
      }));
      setFormData(prev => ({
        ...prev,
        document_uploads: [...(prev.document_uploads || []), ...newUploads],
      }));
      // Clear general file upload error if any
      if (formErrors.general_document_upload) {
        setFormErrors(prev => ({ ...prev, general_document_upload: undefined }));
      }
    }
    // Reset file input to allow selecting the same file again if removed and re-added
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveDocument = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      document_uploads: prev.document_uploads?.filter((_, index) => index !== indexToRemove),
    }));
    // Clear errors for this specific document index if any
    if (formErrors.document_uploads && formErrors.document_uploads[indexToRemove]) {
      const newDocErrors = { ...formErrors.document_uploads };
      delete newDocErrors[indexToRemove];
      setFormErrors(prev => ({ ...prev, document_uploads: newDocErrors }));
    }
  };

  const handleDocumentTypeChange = (indexToUpdate: number, type: string) => {
    setFormData(prev => ({
      ...prev,
      document_uploads: prev.document_uploads?.map((doc, index) => 
        index === indexToUpdate ? { ...doc, document_type: type } : doc
      ),
    }));
    // Clear validation error for this specific document's type field
    if (formErrors.document_uploads && 
        formErrors.document_uploads[indexToUpdate] && 
        formErrors.document_uploads[indexToUpdate].document_type) {
      const newDocErrors = { ...formErrors.document_uploads };
      const newIndexErrors = { ...newDocErrors[indexToUpdate] };
      delete newIndexErrors.document_type;
      newDocErrors[indexToUpdate] = newIndexErrors;
      if (Object.keys(newDocErrors[indexToUpdate]).length === 0) delete newDocErrors[indexToUpdate];
      setFormErrors(prev => ({ ...prev, document_uploads: newDocErrors }));
    }
  };

  const validateStep3 = (): boolean => {
    const errors: FormErrors = { ...formErrors, document_uploads: {}, general_document_upload: undefined }; 
    let isValid = true;

    if (formData.document_uploads && formData.document_uploads.length > 0) {
      formData.document_uploads.forEach((doc, index) => {
        const itemErrors: Partial<Record<keyof DocumentUploadData, string>> = {};
        if (!doc.document_type.trim()) {
          itemErrors.document_type = "Tip dokumenta je obavezan.";
          isValid = false;
        }
        // Add other file-specific validations here if needed (e.g., size, type)
        // For now, just checking document_type

        if (Object.keys(itemErrors).length > 0) {
          if (!errors.document_uploads) errors.document_uploads = {};
          errors.document_uploads[index] = itemErrors;
        }
      });
    } 
    // No specific general error for step 3 yet, unless e.g. no documents uploaded when required.
    // For now, it's optional to upload documents.

    setFormErrors(errors);
    return isValid;
  };

  const goToStep = (step: number) => {
    setError(null); // Clear general errors when navigating
    // Potentially clear step-specific errors if needed, or rely on re-validation
    setCurrentStep(step);
  };

  const handleNext = () => {
    setError(null); 
    let stepIsValid = false;
    if (currentStep === STEPS.DELIVERY_DETAILS) {
      stepIsValid = validateStep1();
    } else if (currentStep === STEPS.TANK_DISTRIBUTION) {
      stepIsValid = validateStep2();
    } else if (currentStep === STEPS.DOCUMENT_UPLOAD) {
      stepIsValid = validateStep3();
    } else if (currentStep === STEPS.REVIEW_SUBMIT) {
      // This case should ideally not be hit if button is "Submit"
      // but if it is, we proceed to handleSubmit
      handleSubmit();
      return;
    }

    if (stepIsValid) {
      // Clear errors for the validated step (simplified placeholder)
      if (currentStep === STEPS.DELIVERY_DETAILS) setFormErrors(prev => ({...prev, delivery_vehicle_plate: undefined, intake_datetime: undefined, fuel_type: undefined, quantity_liters_received: undefined, quantity_kg_received: undefined, specific_gravity: undefined }));
      if (currentStep === STEPS.TANK_DISTRIBUTION) setFormErrors(prev => ({...prev, tank_distributions: {}, general_tank_distribution: undefined }));
      if (currentStep === STEPS.DOCUMENT_UPLOAD) setFormErrors(prev => ({...prev, document_uploads: {}, general_document_upload: undefined }));
      
      const nextStep = currentStep + 1;
      if (nextStep <= STEPS.REVIEW_SUBMIT) { 
           setCurrentStep(nextStep);
       }
    } 
  };

  const handleBack = () => {
    setError(null);
    setSuccessMessage(null);
    // Clear specific errors for the step being left, if applicable
    if (currentStep === STEPS.REVIEW_SUBMIT) { /* No specific errors for review step itself */ }
    else if (currentStep === STEPS.DOCUMENT_UPLOAD) setFormErrors(prev => ({...prev, document_uploads: {}, general_document_upload: undefined }));
    else if (currentStep === STEPS.TANK_DISTRIBUTION) setFormErrors(prev => ({...prev, tank_distributions: {}, general_tank_distribution: undefined }));
    
    if (currentStep > STEPS.DELIVERY_DETAILS) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
        goToStep(STEPS.DELIVERY_DETAILS);
        setError("Molimo ispravite greške u Koraku 1: Detalji Dostave.");
        setSuccessMessage(null);
        return;
    }
    if (!validateStep2()) {
        goToStep(STEPS.TANK_DISTRIBUTION);
        setError("Molimo ispravite greške u Koraku 2: Raspodjela u Tankove.");
        setSuccessMessage(null);
        return;
    }
    if (!validateStep3()) {
        goToStep(STEPS.DOCUMENT_UPLOAD);
        setError("Molimo ispravite greške u Koraku 3: Upload Dokumenata.");
        setSuccessMessage(null);
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    // setFormErrors({}); // All specific errors should be cleared by validation success or fixed by user navigating back
    console.log("Form Data to submit (including files):", formData);

    try {
      // Prepare payload for createFuelIntake
      // Ensure all required fields for the payload are present and correctly typed.
      // The backend will also validate, but good to ensure structure here.
      if (!formData.delivery_vehicle_plate || !formData.intake_datetime || !formData.fuel_type ||
          formData.quantity_liters_received === undefined || formData.quantity_kg_received === undefined || formData.specific_gravity === undefined) {
        setError("Nedostaju obavezni podaci za kreiranje zapisa. Molimo provjerite Korak 1.");
        setSuccessMessage(null);
        setCurrentStep(STEPS.DELIVERY_DETAILS);
        setIsLoading(false);
        return;
      }

      const mainDataPayload: CreateFuelIntakePayload = {
        delivery_vehicle_plate: formData.delivery_vehicle_plate,
        delivery_vehicle_driver_name: formData.delivery_vehicle_driver_name || null,
        intake_datetime: new Date(formData.intake_datetime).toISOString(), // Ensure ISO format
        quantity_liters_received: formData.quantity_liters_received,
        quantity_kg_received: formData.quantity_kg_received,
        specific_gravity: formData.specific_gravity,
        fuel_type: formData.fuel_type,
        supplier_name: formData.supplier_name || null,
        delivery_note_number: formData.delivery_note_number || null,
        customs_declaration_number: formData.customs_declaration_number || null,
        tank_distributions: formData.tank_distributions
          ?.filter(dist => dist.tank_id !== undefined && dist.quantity_liters !== undefined && dist.quantity_liters > 0)
          .map(dist => ({
            tank_id: dist.tank_id!,
            quantity_liters: dist.quantity_liters!,
          })) || [],
      };

      console.log("Submitting main data:", mainDataPayload);
      const intakeRecord: FuelIntakeRecord = await createFuelIntake(mainDataPayload);
      const intakeRecordId = intakeRecord.id;
      console.log("Fuel intake record created successfully, ID:", intakeRecordId);
      // TODO: Use toast.success('Zapis o ulazu goriva uspješno kreiran!');

      const documentUploadErrorMessages: string[] = []; // Change to const
      if (formData.document_uploads && formData.document_uploads.length > 0) {
        console.log(`Attempting to upload ${formData.document_uploads.length} documents.`);
        for (const docUpload of formData.document_uploads) { // Ensure loop is correct
          try {
            console.log(`Uploading document: ${docUpload.file.name}, Type: ${docUpload.document_type}`);
            await uploadFuelIntakeDocument(intakeRecordId, docUpload.file, docUpload.document_type);
            console.log(`Successfully uploaded ${docUpload.file.name}.`);
            // TODO: toast.success(`Dokument ${docUpload.file.name} uspješno uploadovan.`);
          } catch (uploadError: any) {
            console.error(`Failed to upload document ${docUpload.file.name}:`, uploadError);
            // TODO: toast.error(`Greška pri uploadu dokumenta ${docUpload.file.name}: ${uploadError.message}`);
            documentUploadErrorMessages.push(`Greška pri uploadu '${docUpload.file.name}': ${uploadError.message}`); // Use .push
          }
        }
      }

      if (documentUploadErrorMessages.length > 0) { // Use .length
        // Partial success: main record created, some documents failed
        setError(`Zapis je kreiran (ID: ${intakeRecordId}), ali neki dokumenti nisu mogli biti uploadovani: ${documentUploadErrorMessages.join(', ')}`); // Use .join
        setSuccessMessage(null);
        // Optionally, still redirect or offer to retry uploads
        // For now, just shows an error and stays on the form.
        // router.push(`/dashboard/fuel/intakes/${intakeRecordId}`); // Or redirect to a page where they can manage documents
      } else {
        // Full success
        setSuccessMessage('Zapis o ulazu goriva i svi dokumenti uspješno sačuvani!');
        setError(null);
        // TODO: Implement toast.success('Zapis o ulazu goriva i svi dokumenti uspješno sačuvani!')
        router.push('/dashboard/fuel'); // Corrected redirect path
      }

    } catch (err: any) {
      console.error("Submission process error:", err);
      let errorMessage = 'Došlo je do greške prilikom čuvanja zapisa o ulazu goriva.';
      if (err.responseBody && err.responseBody.errors && Array.isArray(err.responseBody.errors)) {
        errorMessage = err.responseBody.errors.map((e: any) => e.msg || e.message).join('; ');
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setSuccessMessage(null);
      // TODO: Use toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };  
  
  // Helper component for Review Section Title
  const ReviewSection = ({ title, step, children }: { title: string, step: number, children: React.ReactNode }) => (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-semibold text-gray-700">{title}</h4>
        <Button variant="outline" size="sm" onClick={() => goToStep(step)} className="flex items-center">
          <Edit3 className="h-4 w-4 mr-2" /> Izmijeni
        </Button>
      </div>
      {children}
    </div>
  );

  // Helper to display a value or a placeholder if empty
  const displayValue = (value: string | number | undefined | null, placeholder: string = "Nije unešeno") => 
    value !== undefined && value !== null && value !== '' ? String(value) : <span className="text-gray-500 italic">{placeholder}</span>;


  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.DELIVERY_DETAILS:
        return (
          <div>
            <h3 className="text-lg font-medium mb-6">Korak 1: Osnovni Podaci o Dostavi</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_vehicle_plate">Registarska oznaka dostavne cisterne</Label>
                  <Input 
                    id="delivery_vehicle_plate" 
                    name="delivery_vehicle_plate" 
                    value={formData.delivery_vehicle_plate || ''} 
                    onChange={handleInputChange} 
                    className={`mt-1 ${formErrors.delivery_vehicle_plate ? 'border-red-500' : ''}`}
                  />
                  {formErrors.delivery_vehicle_plate && <p className="text-xs text-red-500 mt-1">{formErrors.delivery_vehicle_plate}</p>}
                </div>
                <div>
                  <Label htmlFor="delivery_vehicle_driver_name">Ime vozača (opciono)</Label>
                  <Input 
                    id="delivery_vehicle_driver_name" 
                    name="delivery_vehicle_driver_name" 
                    value={formData.delivery_vehicle_driver_name || ''} 
                    onChange={handleInputChange} 
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="intake_datetime">Datum i vrijeme ulaza</Label>
                <Input 
                  id="intake_datetime" 
                  name="intake_datetime" 
                  type="datetime-local" 
                  value={formData.intake_datetime || ''} 
                  onChange={handleInputChange} 
                  className={`mt-1 ${formErrors.intake_datetime ? 'border-red-500' : ''}`}
                />
                {formErrors.intake_datetime && <p className="text-xs text-red-500 mt-1">{formErrors.intake_datetime}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity_liters_received">Količina (L)</Label>
                  <Input 
                    id="quantity_liters_received" 
                    name="quantity_liters_received" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.quantity_liters_received || ''} 
                    onChange={handleInputChange}
                    className={formErrors.quantity_liters_received ? "border-red-500" : ""}
                  />
                  {formErrors.quantity_liters_received && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.quantity_liters_received}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="quantity_kg_received">Količina (KG)</Label>
                  <Input 
                    id="quantity_kg_received" 
                    name="quantity_kg_received" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.quantity_kg_received || ''} 
                    onChange={handleInputChange}
                    className={formErrors.quantity_kg_received ? "border-red-500" : ""}
                  />
                  {formErrors.quantity_kg_received && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.quantity_kg_received}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="specific_gravity">Spec. gustoća (kg/L)</Label>
                  <Input 
                    id="specific_gravity" 
                    name="specific_gravity" 
                    type="number" 
                    step="0.001"
                    min="0"
                    value={formData.specific_gravity || ''} 
                    readOnly
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Automatski izračunato</p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500">Unesite količinu u litrama i kilogramima, a specifična gustoća će biti automatski izračunata.</p>

              <div>
                <Label htmlFor="fuel_type">Tip goriva</Label>
                <Select 
                  name="fuel_type"
                  onValueChange={(value: string) => handleInputChange(value, 'fuel_type')}
                  value={formData.fuel_type || ''}
                >
                  <SelectTrigger className={`w-full mt-1 ${formErrors.fuel_type ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Odaberite tip goriva" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FuelType).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.fuel_type && <p className="text-xs text-red-500 mt-1">{formErrors.fuel_type}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="supplier_name">Dobavljač (opciono)</Label>
                  <Input 
                    id="supplier_name" 
                    name="supplier_name" 
                    value={formData.supplier_name || ''} 
                    onChange={handleInputChange} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_note_number">Broj dostavnice (opciono)</Label>
                  <Input 
                    id="delivery_note_number" 
                    name="delivery_note_number" 
                    value={formData.delivery_note_number || ''} 
                    onChange={handleInputChange} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customs_declaration_number">Broj carinske deklaracije (opciono)</Label>
                  <Input 
                    id="customs_declaration_number" 
                    name="customs_declaration_number" 
                    value={formData.customs_declaration_number || ''} 
                    onChange={handleInputChange} 
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case STEPS.TANK_DISTRIBUTION:
        if (tanksLoading) return <p>Učitavanje dostupnih tankova...</p>;
        if (tanksError) return <p className="text-red-500">Greška pri učitavanju tankova: {tanksError}</p>;
        
        const selectedFuelType = formData.fuel_type;
        if (!selectedFuelType) {
          return (
            <div>
              <h3 className="text-lg font-medium mb-4">Korak 2: Raspodjela u Fiksne Tankove</h3>
              <p className="text-orange-600 bg-orange-100 p-3 rounded mb-4">Molimo odaberite tip goriva u Koraku 1 da biste nastavili sa raspodjelom.</p>
            </div>
          );
        }

        const tanksForSelectedFuelType = filteredAvailableTanks;
        const currentlySelectedTankIdsInStep2 = new Set(formData.tank_distributions?.map(d => d.tank_id).filter(id => id !== undefined));

        return (
          <div>
            <h3 className="text-lg font-medium mb-6">Korak 2: Raspodjela u Fiksne Tankove</h3>
            <div className="mb-4 p-4 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-700">Ukupno primljeno goriva (Tip: {selectedFuelType}): 
                <strong className="text-blue-600"> {formData.quantity_liters_received?.toFixed(2) || '0.00'} L</strong>
              </p>
              <p className="text-sm text-gray-700">Ukupno raspoređeno do sada: 
                <strong className={totalDistributedQuantity > (formData.quantity_liters_received || 0) ? 'text-red-600' : 'text-green-600'}>
                  {totalDistributedQuantity.toFixed(2)} L
                </strong>
              </p>
              <p className="text-sm text-gray-700">Preostalo za raspodjelu: 
                <strong className={( (formData.quantity_liters_received || 0) - totalDistributedQuantity) < 0 ? 'text-red-600' : 'text-gray-800' }>
                  {((formData.quantity_liters_received || 0) - totalDistributedQuantity).toFixed(2)} L
                </strong>
              </p>
            </div>

            {formErrors.general_tank_distribution && 
                <p className="text-sm text-red-500 bg-red-100 p-2 rounded mb-3">{formErrors.general_tank_distribution}</p>}

            {formData.tank_distributions?.map((distribution, index) => {
              const tankError = formErrors.tank_distributions?.[index]?.tank_id;
              const qtyError = formErrors.tank_distributions?.[index]?.quantity_liters;
              const currentTankId = distribution.tank_id;

              const selectableTanks = tanksForSelectedFuelType.filter(
                tank => tank.status === 'ACTIVE' && (tank.id === currentTankId || !currentlySelectedTankIdsInStep2.has(tank.id))
              );
              
              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end border p-4 rounded-md mb-3 relative">
                  <div className="col-span-1 md:col-span-1">
                    <Label htmlFor={`tank_id_${index}`}>Odaberite Tank (Tip: {selectedFuelType})</Label>
                    <Select
                      name={`tank_id_${index}`}
                      value={distribution.tank_id?.toString() || ''}
                      onValueChange={(value: string) => handleTankDistributionChange(index, 'tank_id', value)}
                    >
                      <SelectTrigger className={`w-full mt-1 ${tankError ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Odaberite fiksni tank..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableTanks.length === 0 && !currentTankId && <SelectItem value="" disabled>Nema dostupnih tankova ovog tipa ili su svi već odabrani.</SelectItem>}
                        {selectableTanks.map(tank => (
                          <SelectItem key={tank.id} value={tank.id.toString()}>
                            {getTankDisplayInfo(tank.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {tankError && <p className="text-xs text-red-500 mt-1">{tankError}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-1">
                    <Label htmlFor={`quantity_liters_${index}`}>Količina za ovaj tank (L)</Label>
                    <Input
                      id={`quantity_liters_${index}`}
                      name={`quantity_liters_${index}`}
                      type="number"
                      value={distribution.quantity_liters === undefined ? '' : distribution.quantity_liters}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTankDistributionChange(index, 'quantity_liters', e.target.value)}
                      placeholder="npr. 500"
                      step="0.01"
                      className={`mt-1 ${qtyError ? 'border-red-500' : ''}`}
                    />
                    {qtyError && <p className="text-xs text-red-500 mt-1">{qtyError}</p>}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveTankDistribution(index)} 
                    className="text-red-500 hover:text-red-700 md:self-end md:mb-1" // Aligns button with input field bottom
                    aria-label="Ukloni raspodjelu"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              );
            })}

            {tanksForSelectedFuelType.length > (formData.tank_distributions?.length || 0) && (
                 <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddTankDistribution} 
                    className="mt-4"
                 >
                    Dodaj Tank za Raspodjelu
                </Button>
            )}
            {tanksForSelectedFuelType.length === 0 && !tanksLoading && (
                 <p className="text-sm text-gray-600 mt-4">Nema dostupnih aktivnih fiksnih tankova za tip goriva: <span className="font-semibold">{selectedFuelType}</span>.</p>
            )}

          </div>
        );
      case STEPS.DOCUMENT_UPLOAD:
        return (
          <div>
            <h3 className="text-lg font-medium mb-6">Korak 3: Upload Dokumenata</h3>
            
            <div className="mb-6">
              <Label 
                htmlFor="file-upload-input"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Kliknite za upload</span> ili prevucite fajlove</p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG, DOCX (MAX. 5MB po fajlu - primjer)</p>
                </div>
                <input 
                  id="file-upload-input" 
                  ref={fileInputRef} 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileSelect}
                  // accept=".pdf,.jpg,.jpeg,.png,.docx" // Example accept types
                />
              </Label>
              {formErrors.general_document_upload && 
                <p className="text-xs text-red-500 mt-1">{formErrors.general_document_upload}</p>}
            </div>

            {formData.document_uploads && formData.document_uploads.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-medium">Odabrani fajlovi:</h4>
                {formData.document_uploads.map((docUpload, index) => {
                  const docError = formErrors.document_uploads?.[index]?.document_type;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-white shadow-sm">
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-700">{docUpload.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(docUpload.file.size)}</p>
                        <Input 
                          type="text"
                          placeholder="Unesite tip dokumenta (npr. Dostavnica)"
                          value={docUpload.document_type}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDocumentTypeChange(index, e.target.value)}
                          className={`mt-2 text-sm ${docError ? 'border-red-500' : ''}`}
                        />
                        {docError && <p className="text-xs text-red-500 mt-1">{docError}</p>}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveDocument(index)}
                        className="ml-4 text-red-500 hover:text-red-700"
                        aria-label="Ukloni dokument"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case STEPS.REVIEW_SUBMIT:
        return (
          <div>
            <h3 className="text-xl font-semibold mb-6 text-center">Korak 4: Pregled i Slanje</h3>
            <p className="text-sm text-center text-gray-600 mb-8">Molimo pregledajte sve unesene podatke prije finalnog slanja.</p>

            <ReviewSection title="Detalji Dostave" step={STEPS.DELIVERY_DETAILS}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <p><strong>Reg. dost. cisterne:</strong> {displayValue(formData.delivery_vehicle_plate)}</p>
                <p><strong>Vozač:</strong> {displayValue(formData.delivery_vehicle_driver_name)}</p>
                <p><strong>Datum i vrijeme ulaza:</strong> {displayValue(formData.intake_datetime ? new Date(formData.intake_datetime).toLocaleString() : undefined)}</p>
                <p><strong>Tip goriva:</strong> {displayValue(formData.fuel_type)}</p>
                <p><strong>Količina (L):</strong> {displayValue(formData.quantity_liters_received?.toFixed(2))}</p>
                <p><strong>Količina (KG):</strong> {displayValue(formData.quantity_kg_received?.toFixed(2))}</p>
                <p><strong>Spec. gustoća (kg/L):</strong> {displayValue(formData.specific_gravity?.toFixed(3))}</p>
                <p><strong>Dobavljač:</strong> {displayValue(formData.supplier_name)}</p>
                <p><strong>Br. dostavnice:</strong> {displayValue(formData.delivery_note_number)}</p>
                <p><strong>Br. car. deklaracije:</strong> {displayValue(formData.customs_declaration_number)}</p>
              </div>
            </ReviewSection>

            <ReviewSection title="Raspodjela u Fiksne Tankove" step={STEPS.TANK_DISTRIBUTION}>
              {(!formData.tank_distributions || formData.tank_distributions.length === 0 || formData.tank_distributions.every(d => !d.tank_id)) ? (
                <p className="text-gray-500 italic">Nema raspodjele u tankove.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {formData.tank_distributions.filter(dist => dist.tank_id).map((dist, index) => (
                    <li key={index} className="p-2 border-b border-gray-100">
                      <span className="font-medium">{getTankDisplayInfo(dist.tank_id)}:</span> {displayValue(dist.quantity_liters?.toFixed(2))} L
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-sm font-semibold">Ukupno raspoređeno: {totalDistributedQuantity.toFixed(2)} L</p>
            </ReviewSection>

            <ReviewSection title="Priloženi Dokumenti" step={STEPS.DOCUMENT_UPLOAD}>
              {(!formData.document_uploads || formData.document_uploads.length === 0) ? (
                <p className="text-gray-500 italic">Nema priloženih dokumenata.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {formData.document_uploads.map((doc, index) => (
                    <li key={index} className="p-2 border-b border-gray-100">
                      <span className="font-medium">{doc.file.name}</span> ({formatFileSize(doc.file.size)}) - Tip: {displayValue(doc.document_type)}
                    </li>
                  ))}
                </ul>
              )}
            </ReviewSection>
            
            {error && <p className="text-red-600 bg-red-100 p-3 rounded-md mt-6 text-sm">Greška: {error}</p>} 
          </div>
        );
      default:
        return <p>Nepoznat korak.</p>;
    }
  };

  // Determine the maximum step available (if review step is conditional)
  const maxSteps = STEPS.REVIEW_SUBMIT;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Novi Zapis o Ulazu Goriva - Korak {currentStep} od {maxSteps}</h2>
      
      {/* Display general error message at the top if not on review step, review step has its own error display spot */}
      {error && currentStep !== STEPS.REVIEW_SUBMIT && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">Greška: {error}</p>}

      {/* Display success message at the top if not on review step, review step has its own success display spot */}
      {successMessage && currentStep !== STEPS.REVIEW_SUBMIT && <p className="text-green-500 bg-green-100 p-3 rounded mb-4">Uspjeh: {successMessage}</p>}

      <div className="mb-8">
        {renderStepContent()}
      </div>

      <div className="flex justify-between mt-8">
        <Button 
          onClick={handleBack} 
          variant="outline" 
          disabled={currentStep === STEPS.DELIVERY_DETAILS || isLoading}
        >
          Nazad
        </Button>
        {currentStep < maxSteps ? (
          <Button onClick={handleNext} disabled={isLoading || (currentStep === STEPS.TANK_DISTRIBUTION && tanksLoading)}>
            Naprijed
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Slanje...' : 'Sačuvaj Zapis'}
          </Button>
        )}
      </div>
    </div>
  );
} 