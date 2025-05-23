import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

// Import types
import { 
  FuelingOperation, 
  FuelTankFE, 
  AirlineFE, 
  FuelingOperationFormData 
} from './types';

// Import components
import FilterSection from './components/FilterSection';
import OperationsTable from './components/OperationsTable';
import AddOperationForm from './components/AddOperationForm';
import OperationDetailsModal from './components/OperationDetailsModal';

// Import services and utilities
import { 
  fetchOperations, 
  fetchTanks, 
  fetchAirlines, 
  addFuelingOperation 
} from './services/fuelingOperationsService';
import { formatDate, generatePDFInvoice } from './utils/helpers';
import { generateConsolidatedPDFInvoice } from './utils/consolidatedInvoice';
import { generateConsolidatedXMLInvoice, downloadXML } from './utils/xmlInvoice';
import { generateConsolidatedDomesticPDFInvoice } from './utils/domesticInvoice';

export default function FuelingOperations() {
  // State for operations data
  const [operations, setOperations] = useState<FuelingOperation[]>([]);
  const [tanks, setTanks] = useState<FuelTankFE[]>([]);
  const [airlines, setAirlines] = useState<AirlineFE[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLiters, setTotalLiters] = useState<number>(0);
  
  // State for UI controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOperationForDetails, setSelectedOperationForDetails] = useState<FuelingOperation | null>(null);
  
  // State for filters
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedAirline, setSelectedAirline] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedTank, setSelectedTank] = useState<string>('');
  const [selectedTrafficType, setSelectedTrafficType] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  
  // State for form
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [modalAvailableDestinations, setModalAvailableDestinations] = useState<string[]>([]);
  const [formData, setFormData] = useState<FuelingOperationFormData>({
    dateTime: dayjs().format('YYYY-MM-DDTHH:mm'),
    aircraft_registration: '',
    airlineId: '',
    destination: '',
    quantity_liters: 0,
    specific_density: 0.8,
    quantity_kg: 0,
    price_per_kg: 0,
    currency: 'BAM',
    total_amount: 0,
    tankId: '',
    flight_number: '',
    operator_name: '',
    notes: '',
    tip_saobracaja: 'Izvoz',
  });

  // Fetch operations with filters
  const loadOperations = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchOperations(
        startDate,
        endDate,
        selectedAirline,
        selectedDestination,
        selectedTank,
        selectedTrafficType,
        selectedCurrency
      );
      
      setOperations(result.operations);
      setTotalLiters(result.totalLiters);
    } catch (error) {
      console.error("Failed to fetch fueling operations:", error);
      toast.error("Greška pri učitavanju operacija točenja.");
      setOperations([]);
      setTotalLiters(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedAirline, selectedDestination, selectedTank, selectedTrafficType, selectedCurrency]);

  // Load tanks
  const loadTanks = useCallback(async () => {
    try {
      const data = await fetchTanks();
      setTanks(data);
      setFormData(prev => {
        if (data.length > 0 && !prev.tankId) {
          return { ...prev, tankId: data[0].id.toString() };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching tanks:', error);
      toast.error("Greška pri učitavanju tankera.");
    }
  }, []);

  // Load airlines
  const loadAirlines = useCallback(async () => {
    try {
      const data = await fetchAirlines();
      setAirlines(data);
      setFormData(prev => {
        // Set default airline only if not already set and airlines are fetched
        if (data.length > 0 && !prev.airlineId) {
          const firstAirline = data[0];
          const destinations = firstAirline?.operatingDestinations;
          if (destinations && destinations.length > 0) {
            setModalAvailableDestinations(destinations);
            return { ...prev, airlineId: firstAirline.id.toString() };
          } else {
            setModalAvailableDestinations([]);
            return { ...prev, airlineId: firstAirline.id.toString() };
          }
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching airlines:', error);
      toast.error("Greška pri učitavanju avio kompanija.");
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadOperations();
    loadTanks();
    loadAirlines();
  }, [loadOperations, loadTanks, loadAirlines]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Start with current form data
    const newFormData = { ...formData };

    // Handle file input separately
    if (e.target.type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Dodaj nove dokumente u postojeći niz
        const newFiles = Array.from(files);
        // Filtriraj samo PDF dokumente i druge dozvoljene formate
        const allowedFiles = newFiles.filter(file => 
          file.type === 'application/pdf' || 
          file.type === 'text/plain' || 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type.startsWith('image/')
        );
        
        if (allowedFiles.length > 0) {
          setSelectedFiles(prevFiles => [...prevFiles, ...allowedFiles]);
        }
      }
      return; // Exit early for file inputs
    }

    // Update the specific field that changed
    const formKey = name as keyof typeof formData;

    // Handle numeric inputs
    if (['quantity_liters', 'specific_density', 'quantity_kg', 'price_per_kg'].includes(formKey)) {
      const numValue = parseFloat(value) || 0;
      
      // Type-safe assignment for numeric fields
      if (formKey === 'quantity_liters') {
        newFormData.quantity_liters = numValue;
        // When liters change, calculate kg based on specific density
        newFormData.quantity_kg = +(numValue * newFormData.specific_density).toFixed(2);
      } else if (formKey === 'specific_density') {
        newFormData.specific_density = numValue;
        // When specific density changes, recalculate kg based on liters
        newFormData.quantity_kg = +(newFormData.quantity_liters * numValue).toFixed(2);
      } else if (formKey === 'quantity_kg') {
        newFormData.quantity_kg = numValue;
        // When kg changes, calculate liters based on specific density
        if (newFormData.specific_density > 0) {
          newFormData.quantity_liters = +(numValue / newFormData.specific_density).toFixed(2);
        }
      } else if (formKey === 'price_per_kg') {
        newFormData.price_per_kg = numValue;
      }
      
      // Izračunaj ukupan iznos plaćanja nakon promjene količine ili cijene
      newFormData.total_amount = +(newFormData.quantity_kg * newFormData.price_per_kg).toFixed(2);
    } else {
      // Type-safe assignment for string fields
      if (formKey === 'dateTime') newFormData.dateTime = value;
      else if (formKey === 'aircraft_registration') newFormData.aircraft_registration = value;
      else if (formKey === 'airlineId') newFormData.airlineId = value;
      else if (formKey === 'destination') newFormData.destination = value;
      else if (formKey === 'tankId') newFormData.tankId = value;
      else if (formKey === 'flight_number') newFormData.flight_number = value;
      else if (formKey === 'operator_name') newFormData.operator_name = value;
      else if (formKey === 'notes') newFormData.notes = value;
      else if (formKey === 'tip_saobracaja') newFormData.tip_saobracaja = value;
      else if (formKey === 'currency') newFormData.currency = value;
    }

    // If airlineId changed, update available destinations and reset destination field
    if (formKey === 'airlineId') {
      const airlineIdNum = parseInt(value);
      const selectedAirlineData = airlines.find(a => a.id === airlineIdNum);
      
      const destinations = selectedAirlineData?.operatingDestinations;
      if (destinations && destinations.length > 0) {
        setModalAvailableDestinations(destinations);
        newFormData.destination = ''; // Reset destination
      } else {
        setModalAvailableDestinations([]);
        newFormData.destination = ''; // Reset destination
      }
    }
    
    setFormData(newFormData);
  };

  // Reset form to default values
  const resetForm = () => {
    const defaultAirlineId = (airlines || []).length > 0 ? airlines[0].id.toString() : '';
    let initialDestinations: string[] = [];
    const initialDestinationValue = '';

    if (defaultAirlineId && (airlines || []).length > 0) {
      const firstAirline = airlines.find(a => a.id.toString() === defaultAirlineId);
      const destinations = firstAirline?.operatingDestinations;
      if (destinations && destinations.length > 0) {
        initialDestinations = destinations;
      }
    }

    setFormData({
      dateTime: dayjs().format('YYYY-MM-DDTHH:mm'),
      aircraft_registration: '',
      airlineId: defaultAirlineId,
      destination: initialDestinationValue,
      quantity_liters: 0,
      specific_density: 0.8,
      quantity_kg: 0,
      price_per_kg: 0,
      currency: 'BAM',
      total_amount: 0,
      tankId: (tanks || []).length > 0 ? tanks[0].id.toString() : '',
      flight_number: '',
      operator_name: '',
      notes: '',
      tip_saobracaja: 'Izvoz',
    });
    setModalAvailableDestinations(initialDestinations);
    setSelectedFiles([]);
  };

  // Handle adding a new operation
  const handleAddOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.aircraft_registration) {
      toast.error('Unesite registraciju aviona');
      return;
    }
    if (!formData.airlineId) {
      toast.error('Odaberite avio kompaniju');
      return;
    }
    if (!formData.destination) {
      toast.error('Unesite ili odaberite destinaciju');
      return;
    }
    if (formData.quantity_liters <= 0) {
      toast.error('Količina goriva mora biti veća od 0');
      return;
    }
    if (formData.specific_density <= 0) {
      toast.error('Specifična gustoća mora biti veća od 0');
      return;
    }
    if (formData.quantity_kg <= 0) {
      toast.error('Količina u kilogramima mora biti veća od 0');
      return;
    }
    if (!formData.tankId) {
      toast.error('Odaberite tanker');
      return;
    }
    if (!formData.operator_name) {
      toast.error('Unesite ime operatera');
      return;
    }

    try {
      const submissionFormData = new FormData();
      
      // Convert string values to numbers for numeric fields
      const airlineIdNum = parseInt(formData.airlineId as string, 10);
      const tankIdNum = parseInt(formData.tankId as string, 10);
      
      // Add all form data with proper type conversion
      submissionFormData.append('dateTime', formData.dateTime);
      submissionFormData.append('aircraft_registration', formData.aircraft_registration);
      submissionFormData.append('airlineId', airlineIdNum.toString());
      submissionFormData.append('destination', formData.destination);
      submissionFormData.append('quantity_liters', formData.quantity_liters.toString());
      submissionFormData.append('specific_density', formData.specific_density.toString());
      submissionFormData.append('quantity_kg', formData.quantity_kg.toString());
      submissionFormData.append('price_per_kg', formData.price_per_kg.toString());
      submissionFormData.append('currency', formData.currency);
      submissionFormData.append('total_amount', formData.total_amount.toString());
      submissionFormData.append('tankId', tankIdNum.toString());
      submissionFormData.append('flight_number', formData.flight_number || '');
      submissionFormData.append('operator_name', formData.operator_name);
      submissionFormData.append('notes', formData.notes || '');
      submissionFormData.append('tip_saobracaja', formData.tip_saobracaja || '');
      
      // Add documents if any
      if ((selectedFiles || []).length > 0) {
        selectedFiles.forEach((file) => {
          submissionFormData.append('documents', file);
        });
      }
      
      await addFuelingOperation(submissionFormData);
      
      toast.success('Operacija točenja uspješno dodana');
      setShowAddModal(false);
      resetForm();
      loadOperations();
      loadTanks();
    } catch (error) {
      console.error('Error adding fueling operation:', error);
      toast.error('Došlo je do greške prilikom dodavanja operacije točenja');
    }
  };

  // Handle row click to show details
  const handleRowClick = (operation: FuelingOperation) => {
    setSelectedOperationForDetails(operation);
    setShowDetailsModal(true);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md">
      {/* Header with title and action buttons */}
      <div className="p-6 rounded-t-lg text-white relative overflow-hidden">
        {/* Black glassmorphism background - exactly matching tab header */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 z-0"></div>
        {/* Glass highlight effect - matching tab header */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-0"></div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 relative z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20V4M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 14C20 14 18 10 12 10C6 10 4 14 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Operacije Točenja Goriva
            </h2>
            <p className="text-sm opacity-80 mt-1">Pregled i upravljanje operacijama točenja goriva u avione</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-4 sm:mt-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur-sm border border-white/20 transition-colors flex items-center font-medium shadow-sm relative z-10"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dodaj Operaciju
          </button>
        </div>
        
        {/* Filter Section */}
        <div className="relative z-10">
          <FilterSection 
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          selectedAirline={selectedAirline}
          setSelectedAirline={setSelectedAirline}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          selectedTank={selectedTank}
          setSelectedTank={setSelectedTank}
          selectedTrafficType={selectedTrafficType}
          setSelectedTrafficType={setSelectedTrafficType}
          selectedCurrency={selectedCurrency}
          setSelectedCurrency={setSelectedCurrency}
          airlines={airlines}
          tanks={tanks}
        />
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-opacity-50 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-indigo-700 font-medium">Učitavanje operacija točenja goriva...</p>
            </div>
          </div>
        ) : (operations || []).length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nema operacija</h3>
            <p className="mt-1 text-sm text-gray-500">Nema operacija točenja goriva koje odgovaraju zadatim filterima ili nema unesenih operacija.</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Dodaj Prvu Operaciju
            </button>
          </div>
        ) : (
          <div>
            <OperationsTable 
              operations={operations} 
              handleRowClick={handleRowClick} 
            />
            
            {/* Consolidated Invoice Button */}
            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  // Prepare filter description
                  const filterDesc: string[] = [];
                  if (startDate) filterDesc.push(`Od: ${formatDate(dayjs(startDate).startOf('day').toISOString())}`);
                  if (endDate) filterDesc.push(`Do: ${formatDate(dayjs(endDate).endOf('day').toISOString())}`);
                  if (selectedAirline) {
                    const airline = airlines.find(a => a.id.toString() === selectedAirline);
                    if (airline) filterDesc.push(`Kompanija: ${airline.name}`);
                  }
                  if (selectedDestination) filterDesc.push(`Destinacija: ${selectedDestination}`);
                  if (selectedTank) {
                    const tank = tanks.find(t => t.id.toString() === selectedTank);
                    if (tank) filterDesc.push(`Tanker: ${tank.identifier} - ${tank.name}`);
                  }
                  if (selectedTrafficType) filterDesc.push(`Tip saobraćaja: ${selectedTrafficType}`);
                  if (selectedCurrency) filterDesc.push(`Valuta: ${selectedCurrency}`);
                  
                  const filterDescription = filterDesc.length > 0 
                    ? filterDesc.join(', ') 
                    : 'Sve operacije';
                  
                  try {
                    generateConsolidatedPDFInvoice(operations, filterDescription);
                    toast.success('Zbirna PDF faktura je uspješno generisana!');
                  } catch (error) {
                    console.error('Error generating consolidated PDF invoice:', error);
                    toast.error('Došlo je do greške prilikom generisanja zbirne PDF fakture.');
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center font-medium shadow-sm"
                disabled={operations.length === 0}
                title="Standardna faktura za izvoz"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="rgba(255, 255, 255, 0.1)"/>
                  <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 9H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Generiši PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  // Prepare filter description
                  const filterDesc: string[] = [];
                  if (startDate) filterDesc.push(`Od: ${formatDate(dayjs(startDate).startOf('day').toISOString())}`);
                  if (endDate) filterDesc.push(`Do: ${formatDate(dayjs(endDate).endOf('day').toISOString())}`);
                  if (selectedAirline) {
                    const airline = airlines.find(a => a.id.toString() === selectedAirline);
                    if (airline) filterDesc.push(`Kompanija: ${airline.name}`);
                  }
                  if (selectedDestination) filterDesc.push(`Destinacija: ${selectedDestination}`);
                  if (selectedTank) {
                    const tank = tanks.find(t => t.id.toString() === selectedTank);
                    if (tank) filterDesc.push(`Tanker: ${tank.identifier} - ${tank.name}`);
                  }
                  if (selectedTrafficType) filterDesc.push(`Tip saobraćaja: ${selectedTrafficType}`);
                  if (selectedCurrency) filterDesc.push(`Valuta: ${selectedCurrency}`);
                  
                  const filterDescription = filterDesc.length > 0 
                    ? filterDesc.join(', ') 
                    : 'Sve operacije';
                  
                  try {
                    generateConsolidatedDomesticPDFInvoice(operations, filterDescription);
                    toast.success('Zbirna domaća faktura je uspješno generisana!');
                  } catch (error) {
                    console.error('Error generating consolidated domestic invoice:', error);
                    toast.error('Došlo je do greške prilikom generisanja zbirne domaće fakture.');
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center font-medium shadow-sm"
                disabled={operations.length === 0}
                title="Faktura za unutarnji saobraćaj sa PDV-om"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="rgba(255, 255, 255, 0.1)"/>
                  <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M9 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Generiši Domaću Fakturu
              </button>
              <button
                type="button"
                onClick={() => {
                  // Prepare filter description
                  const filterDesc: string[] = [];
                  if (startDate) filterDesc.push(`Od: ${formatDate(dayjs(startDate).startOf('day').toISOString())}`);
                  if (endDate) filterDesc.push(`Do: ${formatDate(dayjs(endDate).endOf('day').toISOString())}`);
                  if (selectedAirline) {
                    const airline = airlines.find(a => a.id.toString() === selectedAirline);
                    if (airline) filterDesc.push(`Kompanija: ${airline.name}`);
                  }
                  if (selectedDestination) filterDesc.push(`Destinacija: ${selectedDestination}`);
                  if (selectedTank) {
                    const tank = tanks.find(t => t.id.toString() === selectedTank);
                    if (tank) filterDesc.push(`Tanker: ${tank.identifier} - ${tank.name}`);
                  }
                  if (selectedTrafficType) filterDesc.push(`Tip saobraćaja: ${selectedTrafficType}`);
                  if (selectedCurrency) filterDesc.push(`Valuta: ${selectedCurrency}`);
                  
                  const filterDescription = filterDesc.length > 0 
                    ? filterDesc.join(', ') 
                    : 'Sve operacije';
                  
                  try {
                    const xmlContent = generateConsolidatedXMLInvoice(operations, filterDescription);
                    downloadXML(xmlContent, `Zbirna-Faktura-XML-${dayjs().format('YYYYMMDD')}.xml`);
                    toast.success('Zbirna XML faktura je uspješno generisana!');
                  } catch (error) {
                    console.error('Error generating consolidated XML invoice:', error);
                    toast.error('Došlo je do greške prilikom generisanja zbirne XML fakture.');
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center font-medium shadow-sm"
                disabled={operations.length === 0}
                title="XML faktura za sistemsku integraciju"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 13V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 18H4M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Generiši XML
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Operation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dodaj Operaciju Točenja Goriva</h3>
              <AddOperationForm 
                formData={formData}
                handleInputChange={handleInputChange}
                handleAddOperation={handleAddOperation}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                modalAvailableDestinations={modalAvailableDestinations}
                airlines={airlines}
                tanks={tanks}
                onCancel={() => { setShowAddModal(false); resetForm(); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedOperationForDetails && (
        <OperationDetailsModal 
          operation={selectedOperationForDetails}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}
