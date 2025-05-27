'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/badge';
import { 
  ExclamationTriangleIcon, 
  CalendarIcon, 
  DocumentArrowDownIcon, 
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChartBarIcon,
  PaperAirplaneIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { FileText } from 'lucide-react';
import { FuelOperation } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { hr } from 'date-fns/locale'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { notoSansRegularBase64 } from '@/lib/fonts';
import { notoSansBoldBase64 } from '@/lib/notoSansBoldBase64';
import { downloadDocument } from '@/lib/apiService';

// Import invoice generation utilities
import { generatePDFInvoice } from '@/components/fuel/utils/helpers';
import { generateConsolidatedPDFInvoice } from '@/components/fuel/utils/consolidatedInvoice';
import { generateConsolidatedXMLInvoice, downloadXML } from '@/components/fuel/utils/xmlInvoice';
import { generateConsolidatedDomesticPDFInvoice } from '@/components/fuel/utils/domesticInvoice';
import { FuelingOperation } from '@/components/fuel/types';

// Import modal component for operation details
import OperationDetailsModal from '@/components/fuel/components/OperationDetailsModal';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const FONT_NAME = 'NotoSans';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('hr-HR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
};

const registerFont = (doc: jsPDF) => {
  const stripPrefix = (base64String: string) => {
    const prefix = 'data:font/ttf;base64,';
    if (base64String.startsWith(prefix)) {
      return base64String.substring(prefix.length);
    }
    return base64String;
  };

  if (notoSansRegularBase64) {
    const cleanedRegular = stripPrefix(notoSansRegularBase64);
    doc.addFileToVFS('NotoSans-Regular.ttf', cleanedRegular);
    doc.addFont('NotoSans-Regular.ttf', FONT_NAME, 'normal');
  } else {
    console.error('Noto Sans Regular font data not loaded.');
  }

  if (notoSansBoldBase64) {
    const cleanedBold = stripPrefix(notoSansBoldBase64);
    doc.addFileToVFS('NotoSans-Bold.ttf', cleanedBold);
    doc.addFont('NotoSans-Bold.ttf', FONT_NAME, 'bold');
  } else {
    console.error('Noto Sans Bold font data not loaded.');
  }
};

export default function FuelOperationsReport() {
  const [operations, setOperations] = useState<FuelOperation[]>([]);
  const [totalLiters, setTotalLiters] = useState<number>(0);
  const [totalKg, setTotalKg] = useState<number>(0);
  const [averageDensity, setAverageDensity] = useState<number>(0);
  
  // Track revenue by currency
  const [revenueByCurrency, setRevenueByCurrency] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authUser, authToken } = useAuth();

  const [airlines, setAirlines] = useState<{ id: number; name: string }[]>([]); // For airline dropdown
  const [filterAirline, setFilterAirline] = useState<string>('__ALL__'); // Stores airline ID or '__ALL__'
  const [filterTrafficType, setFilterTrafficType] = useState<string>('__ALL__');
  // Set default date range to current month
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
  });
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
  });
  const [filterDestination, setFilterDestination] = useState<string>('__ALL__');
  // Debounce timeout reference
  const destinationDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<string>('__ALL__');
  
  // State for operation details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOperationForDetails, setSelectedOperationForDetails] = useState<FuelingOperation | null>(null);
  
  // Handle row click to show details
  const handleRowClick = (operation: FuelOperation) => {
    setSelectedOperationForDetails(convertToFuelingOperation(operation));
    setShowDetailsModal(true);
  };
  
  // Function to convert FuelOperation to FuelingOperation
  const convertToFuelingOperation = (operation: FuelOperation): FuelingOperation => {
    return {
      ...operation,
      aircraft_registration: operation.aircraft_registration || null,
      airlineId: operation.airlineId || 0,
      airline: operation.airline ? {
        id: operation.airline.id,
        name: operation.airline.name,
        taxId: operation.airline.taxId || null,
        address: operation.airline.address || null,
        contact_details: operation.airline.contact_details || null,
        operatingDestinations: operation.airline.operatingDestinations || [],
      } : {
        id: 0,
        name: 'Unknown Airline',
        taxId: null,
        address: null,
        contact_details: null,
        operatingDestinations: [],
      },
      destination: operation.destination || '',
      tankId: operation.tankId || 0,
      tank: operation.tank ? {
        id: operation.tank.id,
        identifier: operation.tank.identifier,
        name: operation.tank.name,
        location: operation.tank.location || '',
        capacity_liters: operation.tank.capacity_liters || 0,
        current_liters: operation.tank.current_liters || 0,
        fuel_type: operation.tank.fuel_type,
        createdAt: operation.tank.createdAt || '',
        updatedAt: operation.tank.updatedAt || '',
      } : {
        id: 0,
        identifier: 'Unknown',
        name: 'Unknown Tank',
        location: '',
        capacity_liters: 0,
        current_liters: 0,
        fuel_type: 'JET A-1',
        createdAt: '',
        updatedAt: '',
      },
      operator_name: operation.operator_name || '',
      documents: operation.documents ? operation.documents.map(doc => ({
        id: doc.id,
        originalFilename: doc.originalFilename,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        storagePath: doc.storagePath,
        uploadedAt: doc.uploadedAt,
        fuelReceiptId: doc.fuelReceiptId,
        fuelingOperationId: doc.fuelingOperationId || 0,
      })) : [],
      createdAt: operation.createdAt || '',
      updatedAt: operation.updatedAt || '',
    } as FuelingOperation;
  };

  useEffect(() => {
    const fetchAirlines = async () => {
      if (!authToken) return;
      try {
        const response = await fetch(`${API_URL}/api/airlines`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch airlines');
        }
        const data = await response.json();
        setAirlines([{ id: -1, name: 'Sve kompanije' }, ...data]); // Add 'All' option, use -1 or similar for ID
      } catch (err) {
        console.error('Error fetching airlines:', err);
        // Optionally set an error state for airlines fetching
      }
    };
    fetchAirlines();
  }, [authToken]);

  useEffect(() => {
    const fetchOperations = async () => {
      if (!authToken) {
        setError('Korisnik nije autentificiran ili token nije dostupan.');
        setLoading(false);
        return;
      }
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filterDateFrom) {
        // Start date should be set to the beginning of the day (00:00:00)
        const startDate = new Date(filterDateFrom);
        startDate.setHours(0, 0, 0, 0);
        queryParams.append('startDate', startDate.toISOString());
      }
      if (filterDateTo) {
        // End date should be set to the end of the day (23:59:59)
        const endDate = new Date(filterDateTo);
        endDate.setHours(23, 59, 59, 999);
        queryParams.append('endDate', endDate.toISOString());
      }
      if (filterTrafficType && filterTrafficType !== '__ALL__') {
        queryParams.append('tip_saobracaja', filterTrafficType);
      }
      if (filterAirline && filterAirline !== '__ALL__' && filterAirline !== '-1') { // -1 is 'Sve Kompanije'
        queryParams.append('airlineId', filterAirline);
      }
      if (filterDestination && filterDestination !== '__ALL__') {
        queryParams.append('destination', filterDestination);
      }
      if (filterCurrency && filterCurrency !== '__ALL__') {
        queryParams.append('currency', filterCurrency);
      }

      // Use the correct API endpoint for fueling operations
      const requestUrl = `${API_URL}/api/fuel/fueling-operations?${queryParams.toString()}`;
      console.log('Fetching operations from URL:', requestUrl);

      try {
        const response = await fetch(requestUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401) {
            setError('Neovlašten pristup. Molimo prijavite se ponovo.');
          } else {
            setError(`Greška: ${response.status}`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        console.log('Fetched operations:', responseData);
        
        // Handle both array response and object response with operations property
        if (Array.isArray(responseData)) {
          console.log('Response is an array with', responseData.length, 'operations');
          setOperations(responseData);
          // Calculate total liters from operations
          const totalLitersValue = responseData.reduce((sum, op) => sum + (op.quantity_liters || 0), 0);
          // Calculate total kg from operations
          const totalKgValue = responseData.reduce((sum, op) => sum + (op.quantity_kg || 0), 0);
          // Calculate average density (kg/L)
          const avgDensity = totalLitersValue > 0 ? totalKgValue / totalLitersValue : 0;
          
          // Calculate revenue by currency
          const currencyTotals: {[key: string]: number} = {};
          responseData.forEach(op => {
            const currency = op.currency || 'BAM';
            const revenue = (op.quantity_kg || 0) * (op.price_per_kg || 0);
            if (!currencyTotals[currency]) {
              currencyTotals[currency] = 0;
            }
            currencyTotals[currency] += revenue;
          });
          
          setTotalLiters(totalLitersValue);
          setTotalKg(totalKgValue);
          setAverageDensity(avgDensity);
          setRevenueByCurrency(currencyTotals);
        } else if (responseData && typeof responseData === 'object' && 'operations' in responseData) {
          console.log('Response has operations property');
          const operations = responseData.operations as FuelOperation[];
          setOperations(operations);
          
          // If totalLiters is provided in the response, use it; otherwise calculate
          const totalLitersValue = responseData.totalLiters as number || 
            operations.reduce((sum, op) => sum + (op.quantity_liters || 0), 0);
          
          // Calculate total kg from operations
          const totalKgValue = operations.reduce((sum, op) => sum + (op.quantity_kg || 0), 0);
          // Calculate average density (kg/L)
          const avgDensity = totalLitersValue > 0 ? totalKgValue / totalLitersValue : 0;
          
          // Calculate revenue by currency
          const currencyTotals: {[key: string]: number} = {};
          operations.forEach(op => {
            const currency = op.currency || 'BAM';
            const revenue = (op.quantity_kg || 0) * (op.price_per_kg || 0);
            if (!currencyTotals[currency]) {
              currencyTotals[currency] = 0;
            }
            currencyTotals[currency] += revenue;
          });
          
          setTotalLiters(totalLitersValue);
          setTotalKg(totalKgValue);
          setAverageDensity(avgDensity);
          setRevenueByCurrency(currencyTotals);
        } else {
          console.error('Unexpected response format:', responseData);
          setOperations([]);
          setTotalLiters(0);
          setTotalKg(0);
          setAverageDensity(0);
        }
        setError(null);
      } catch (e) {
        console.error('Greška prilikom dohvata podataka o operacijama goriva:', e);
        if (!error) { 
          setError('Nije moguće učitati podatke o operacijama goriva.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (authUser && authToken) {
        fetchOperations();
    }
  }, [authUser, authToken, filterDateFrom, filterDateTo, filterTrafficType, filterAirline, filterDestination, filterCurrency, error]);

  const trafficTypeOptions = useMemo(() => {
    // Safely extract traffic types, handling potential undefined values
    const types = new Set<string>();
    
    // Check if operations is defined and is an array before using forEach
    if (operations && Array.isArray(operations)) {
      operations.forEach(op => {
        if (op && op.tip_saobracaja) {
          types.add(op.tip_saobracaja);
        }
      });
    }
    
    return [{ value: '__ALL__', label: 'Svi tipovi' }, ...Array.from(types).sort().map(name => ({ value: name, label: name }))];
  }, [operations]);

  const destinationOptions = useMemo(() => {
    // Extract unique destinations from operations
    const destinations = new Set<string>();
    
    if (operations && Array.isArray(operations)) {
      operations.forEach(op => {
        if (op && op.destination && op.destination.trim() !== '') {
          destinations.add(op.destination);
        }
      });
    }
    
    return [{ value: '__ALL__', label: 'Sve destinacije' }, ...Array.from(destinations).sort().map(dest => ({ value: dest, label: dest }))];  
  }, [operations]);
  
  const currencyOptions = useMemo(() => {
    // Extract unique currencies from operations
    const currencies = new Set<string>();
    
    if (operations && Array.isArray(operations)) {
      operations.forEach(op => {
        if (op && op.currency) {
          currencies.add(op.currency);
        }
      });
    }
    
    return [{ value: '__ALL__', label: 'Sve valute' }, ...Array.from(currencies).sort().map(currency => ({ value: currency, label: currency }))];
  }, [operations]);

  const filteredOperations = operations;

  const generatePdf = () => {
    // Create PDF in landscape orientation
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });
  
    // Register custom font for proper display of Bosnian characters
    registerFont(doc);
    doc.setFont(FONT_NAME);

    // Set up document title with larger font
    doc.setFontSize(18);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('Izvještaj Izlaznih Operacija Goriva', 14, 22);
  
    // Set up filter information section
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'normal');
    doc.setTextColor(60, 60, 60);

    let filterInfo = 'Primijenjeni filteri:';
    if (filterAirline !== '__ALL__') filterInfo += `\n - Avio Kompanija: ${airlines.find(airline => airline.id.toString() === filterAirline)?.name || 'Nepoznata'}`;
    if (filterTrafficType !== '__ALL__') filterInfo += `\n - Tip Saobraćaja: ${filterTrafficType}`;
    if (filterDateFrom) filterInfo += `\n - Datum Od: ${format(filterDateFrom, 'dd.MM.yyyy')}`;
    if (filterDateTo) filterInfo += `\n - Datum Do: ${format(filterDateTo, 'dd.MM.yyyy')}`;
    if (filterDestination) filterInfo += `\n - Destinacija: ${filterDestination}`;
    if (filterCurrency !== '__ALL__') filterInfo += `\n - Valuta: ${filterCurrency}`;
  
    if (filterInfo === 'Primijenjeni filteri:') {
      filterInfo += ' Nijedan';
    }

    doc.text(filterInfo, 14, 32);

    // Define table columns and prepare data with full column names for landscape orientation
    const tableColumn = [
      "Datum i Vrijeme", 
      "Avion", 
      "Aviokompanija", 
      "Destinacija", 
      "Količina (L)", 
      "Gustoća", 
      "Količina (kg)", 
      "Cijena/kg", 
      "Valuta", 
      "Tip Goriva", 
      "Tank", 
      "Let", 
      "Operator", 
      "Tip Saobraćaja"
    ];
    const tableRows: any[][] = [];

    operations.forEach(op => {
      const operationData = [
        formatDate(op.dateTime),
        op.aircraft_registration || 'N/A',
        op.airline?.name || 'N/A',
        op.destination || 'N/A',
        op.quantity_liters.toLocaleString('bs-BA', { minimumFractionDigits: 2 }),
        (op.specific_density || 0).toLocaleString('bs-BA', { minimumFractionDigits: 3 }),
        (op.quantity_kg || 0).toLocaleString('bs-BA', { minimumFractionDigits: 2 }),
        (op.price_per_kg || 0).toLocaleString('bs-BA', { minimumFractionDigits: 2 }),
        op.currency || 'BAM',
        op.tank?.fuel_type || 'N/A', 
        `${op.tank?.identifier || 'N/A'} ${op.tank?.name ? `(${op.tank.name})` : ''}`.trim(),
        op.flight_number || 'N/A',
        op.operator_name || 'N/A',
        op.tip_saobracaja || 'N/A'
      ];
      tableRows.push(operationData);
    });

    // Calculate appropriate startY based on filters
    const startY = filterDateFrom || filterDateTo || filterAirline !== '__ALL__' || 
                  filterTrafficType !== '__ALL__' || filterDestination || 
                  filterCurrency !== '__ALL__' ? 60 : 45;

    // Generate table with improved styling
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      theme: 'grid',
      headStyles: { 
        fillColor: [22, 160, 133],
        font: FONT_NAME,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        minCellHeight: 14
      },
      styles: { 
        font: FONT_NAME,
        fontSize: 8, 
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        valign: 'middle'
      },
      // Column widths optimized for landscape orientation
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },  // Datum i Vrijeme
        1: { cellWidth: 15, halign: 'center' },  // Avion
        2: { cellWidth: 25, halign: 'center' },  // Aviokompanija
        3: { cellWidth: 20, halign: 'center' },  // Destinacija
        4: { cellWidth: 18, halign: 'right' },   // Količina (L)
        5: { cellWidth: 15, halign: 'right' },   // Gustoća
        6: { cellWidth: 18, halign: 'right' },   // Količina (kg)
        7: { cellWidth: 18, halign: 'right' },   // Cijena/kg
        8: { cellWidth: 12, halign: 'center' },  // Valuta
        9: { cellWidth: 18, halign: 'center' },  // Tip Goriva
        10: { cellWidth: 20, halign: 'center' }, // Tank
        11: { cellWidth: 12, halign: 'center' }, // Let
        12: { cellWidth: 20, halign: 'center' }, // Operator
        13: { cellWidth: 20, halign: 'center' }  // Tip Saobraćaja
      },
      didDrawPage: function (data) {
        // Add footer with total information
        doc.setFont(FONT_NAME, 'bold');
        doc.setFontSize(10);
        
        // Display totals in the footer
        const footerY = doc.internal.pageSize.height - 20; // Increased space for more lines
        doc.text(`Ukupno Litara: ${totalLiters.toLocaleString('bs-BA')} L`, data.settings.margin.left, footerY - 8);
        doc.text(`Ukupno Kilograma: ${totalKg.toLocaleString('bs-BA')} kg`, data.settings.margin.left, footerY - 4);
        doc.text(`Prosječna Gustoća: ${averageDensity.toLocaleString('bs-BA', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg/L`, data.settings.margin.left, footerY);
        
        // Display revenue by currency
        const currencyKeys = Object.keys(revenueByCurrency);
        if (currencyKeys.length > 0) {
          doc.text('Ukupan promet po valuti:', data.settings.margin.left + 90, footerY - 8);
          
          currencyKeys.forEach((currency, index) => {
            const amount = revenueByCurrency[currency];
            const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'KM';
            doc.text(`${currency}: ${currencySymbol} ${amount.toLocaleString('bs-BA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
              data.settings.margin.left + 90, footerY - 4 + (index * 4));
          });
          
          // Add empty entries for missing currencies
          const missingCurrencies = ['USD', 'EUR', 'BAM'].filter(c => !currencyKeys.includes(c));
          missingCurrencies.forEach((currency, index) => {
            const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'KM';
            doc.text(`${currency}: ${currencySymbol} 0.00`, 
              data.settings.margin.left + 90, footerY - 4 + ((currencyKeys.length + index) * 4));
          });
        } else {
          // If no revenue data, show zeros for all currencies
          doc.text('Ukupan promet po valuti:', data.settings.margin.left + 90, footerY - 8);
          doc.text('USD: $ 0.00', data.settings.margin.left + 90, footerY - 4);
          doc.text('EUR: € 0.00', data.settings.margin.left + 90, footerY);
          doc.text('BAM: KM 0.00', data.settings.margin.left + 90, footerY + 4);
        }
        
        // Add page number
        doc.setFont(FONT_NAME, 'normal');
        doc.setFontSize(8);
        doc.text(`Stranica ${data.pageNumber}`, doc.internal.pageSize.width - 20, footerY + 8);
      }
    });

    doc.save('izvjestaj_operacija_goriva.pdf');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Izvještaj Izlaznih Operacija Goriva</h2>
              <p className="mt-1 text-indigo-100 text-sm">Pregled svih operacija točenja goriva u avione</p>
            </div>
            <div className="bg-white/10 p-3 rounded-full">
              <PaperAirplaneIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Učitavanje podataka...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Izvještaj Izlaznih Operacija Goriva</h2>
              <p className="mt-1 text-indigo-100 text-sm">Pregled svih operacija točenja goriva u avione</p>
            </div>
            <div className="bg-white/10 p-3 rounded-full">
              <PaperAirplaneIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Greška pri učitavanju podataka</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      {/* Header with black glassmorphism effect */}
      <div className="p-6 text-white relative overflow-hidden">
        {/* Black glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 z-0"></div>
        {/* Glass highlight effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-0"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Izvještaj Izlaznih Operacija Goriva</h2>
            <p className="mt-1 text-indigo-100 text-sm">Pregled svih operacija točenja goriva u avione</p>
          </div>
          <div className="bg-white/10 p-3 rounded-full">
            <PaperAirplaneIcon className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Filteri */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <FunnelIcon className="h-5 w-5 text-indigo-500 mr-2" />
                Filteri izvještaja
              </h3>
            </div>
            
            <div className="p-5 bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="airline" className="text-sm font-medium text-gray-700 dark:text-gray-300">Avio Kompanija</label>
                  <Select 
                    value={filterAirline} 
                    onValueChange={setFilterAirline}
                    disabled={airlines.length === 0} // Disable if airlines not loaded
                  >
                    <SelectTrigger id="airline">
                      <SelectValue placeholder="Sve kompanije" />
                    </SelectTrigger>
                    <SelectContent>
                      {airlines.map(airline => (
                        <SelectItem key={airline.id.toString()} value={airline.id.toString()}>
                          {airline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="trafficType" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tip saobraćaja</label>
                  <Select value={filterTrafficType} onValueChange={setFilterTrafficType}>
                    <SelectTrigger id="trafficType">
                      <SelectValue placeholder="Svi tipovi" />
                    </SelectTrigger>
                    <SelectContent>
                      {trafficTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="dateFrom" className="text-sm font-medium text-gray-700 dark:text-gray-300">Datum Od</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal bg-gray-50 dark:bg-gray-900 ${!filterDateFrom && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDateFrom ? format(filterDateFrom, "PPP", { locale: hr }) : <span>Odaberi datum</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filterDateFrom}
                        onSelect={setFilterDateFrom}
                        initialFocus
                        locale={hr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="dateTo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Datum Do</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal bg-gray-50 dark:bg-gray-900 ${!filterDateTo && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterDateTo ? format(filterDateTo, "PPP", { locale: hr }) : <span>Odaberi datum</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filterDateTo}
                        onSelect={setFilterDateTo}
                        initialFocus
                        locale={hr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="destination" className="text-sm font-medium text-gray-700 dark:text-gray-300">Destinacija</label>
                  <Select value={filterDestination} onValueChange={setFilterDestination}>
                    <SelectTrigger id="destination">
                      <SelectValue placeholder="Sve destinacije" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="currency" className="text-sm font-medium text-gray-700 dark:text-gray-300">Valuta</label>
                  <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Sve valute" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      // Reset filters
                      setFilterAirline('__ALL__');
                      setFilterTrafficType('__ALL__');
                      setFilterDateFrom(undefined);
                      setFilterDateTo(undefined);
                      setFilterDestination('__ALL__'); // Reset to all destinations
                      setFilterCurrency('__ALL__');
                    }} 
                    variant="outline"
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700/50"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Resetuj filtere
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <ChartBarIcon className="h-5 w-5 text-indigo-500 mr-2" />
                Pregled izlaznih operacija goriva
              </h3>
            </div>
            
            {(!operations || operations.length === 0) && !loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-700 dark:text-gray-300 font-medium">Nema zabilježenih izlaznih operacija goriva.</p>
              </div>
            )}

            {operations && operations.length > 0 && (
              <>
                <div style={{ width: '100%', overflowX: 'auto', overflowY: 'auto', maxHeight: '60vh', position: 'relative' }}>
                  <table style={{ width: '100%', tableLayout: 'fixed', minWidth: '1200px', fontSize: '0.7rem' }} className="divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '8%' }}>Datum</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '7%' }}>Reg.</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '8%' }}>Avio Komp.</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '7%' }}>Dest.</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '6%' }}>Kol. (L)</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '6%' }}>Spec. Gust.</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '6%' }}>Kol. (kg)</th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '6%' }}>Cijena/kg</th>
                        <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '5%' }}>Val.</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '6%' }}>Tip Goriva</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '6%' }}>Cisterna</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '6%' }}>Br. Leta</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '7%' }}>Operater</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '7%' }}>Tip Saob.</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ wordWrap: 'break-word', width: '9%' }}>Dokumenti</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {operations.map((op) => (
                        <tr 
                          key={op.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer" 
                          onClick={() => handleRowClick(op)}
                        >
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">{formatDate(op.dateTime)}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">
                            {op.aircraft_registration ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-[0.65rem] bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                {op.aircraft_registration}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">{op.airline?.name || <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">{op.destination || <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 font-medium text-right table-cell-wrap">{op.quantity_liters.toLocaleString('hr-HR')} L</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 font-medium text-right table-cell-wrap">{(op.specific_density || 0).toLocaleString('hr-HR', { minimumFractionDigits: 3 })}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 font-medium text-right table-cell-wrap">{(op.quantity_kg || 0).toLocaleString('hr-HR')} kg</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 font-medium text-right table-cell-wrap">{(op.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 font-medium text-center table-cell-wrap">{op.currency || 'BAM'}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">
                            {op.tank?.fuel_type ? (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-[0.65rem] ${op.tank.fuel_type === 'Jet A-1' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'}`}>
                                {op.tank.fuel_type}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">{op.tank ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-[0.65rem] bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                              {op.tank.identifier || 'N/A'}
                            </span>
                          ) : <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">{op.flight_number || <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">{op.operator_name || <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>}</td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">
                            {op.tip_saobracaja ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-[0.65rem] bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                                {op.tip_saobracaja}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-[0.65rem] py-0 h-4">N/A</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[0.68rem] text-gray-700 dark:text-gray-300 table-cell-wrap">
                            {op.documents && op.documents.length > 0 ? (
                              <div className="flex flex-col space-y-1">
                                {op.documents.map((doc, index) => (
                                  <button 
                                    key={doc.id}
                                    onClick={() => {
                                      toast.promise(
                                        downloadDocument(`/api/documents/fueling-operations/${doc.id}`, doc.originalFilename),
                                        {
                                          loading: 'Preuzimanje dokumenta...',
                                          success: 'Dokument preuzet uspješno',
                                          error: 'Greška pri preuzimanju dokumenta'
                                        }
                                      );
                                    }}
                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 hover:underline"
                                    title={doc.originalFilename}
                                  >
                                    <EyeIcon className="h-4 w-4 mr-1" /> Dokument {index + 1}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[0.65rem] py-0 h-4">Nema</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Prikazano <span className="font-medium text-gray-700 dark:text-gray-300">{operations ? operations.length : 0}</span> operacija
                    </div>
                    
                    {/* Totals Summary - Inline */}
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ukupno litara</span>
                        <div className="flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            {totalLiters.toLocaleString('hr-HR')} L
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ukupno kilograma</span>
                        <div className="flex items-center px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-100 dark:border-green-800">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            {totalKg.toLocaleString('hr-HR')} kg
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prosječna gustoća</span>
                        <div className="flex items-center px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-100 dark:border-purple-800">
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            {averageDensity.toLocaleString('hr-HR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg/L
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={generatePdf} 
                      variant="outline" 
                      className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-900/20 whitespace-nowrap"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Izvezi u PDF
                    </Button>
                    
                    {/* Invoice generation buttons */}
                    <Button
                      onClick={() => {
                        // Prepare filter description
                        const filterDesc: string[] = [];
                        if (filterDateFrom) filterDesc.push(`Od: ${formatDate(filterDateFrom.toISOString())}`);
                        if (filterDateTo) filterDesc.push(`Do: ${formatDate(filterDateTo.toISOString())}`);
                        if (filterAirline && filterAirline !== '__ALL__') {
                          const airline = airlines.find(a => a.id.toString() === filterAirline);
                          if (airline) filterDesc.push(`Kompanija: ${airline.name}`);
                        }
                        if (filterDestination) filterDesc.push(`Destinacija: ${filterDestination}`);
                        if (filterTrafficType && filterTrafficType !== '__ALL__') filterDesc.push(`Tip saobraćaja: ${filterTrafficType}`);
                        if (filterCurrency && filterCurrency !== '__ALL__') filterDesc.push(`Valuta: ${filterCurrency}`);
                        
                        const filterDescription = filterDesc.length > 0 
                          ? filterDesc.join(', ') 
                          : 'Sve operacije';
                        
                        try {
                          // Convert operations to FuelingOperation type
                          const convertedOperations = operations.map(op => convertToFuelingOperation(op));
                          generateConsolidatedPDFInvoice(convertedOperations, filterDescription);
                          toast.success('Zbirna PDF faktura je uspješno generisana!');
                        } catch (error) {
                          console.error('Error generating consolidated PDF invoice:', error);
                          toast.error('Došlo je do greške prilikom generisanja zbirne PDF fakture.');
                        }
                      }}
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20 whitespace-nowrap"
                      disabled={operations.length === 0}
                      title="Standardna faktura za izvoz"
                    >
                      <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="rgba(0, 0, 0, 0)"/>
                        <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Zbirna INO Faktura
                    </Button>
                    
                    <Button
                      onClick={() => {
                        // Prepare filter description
                        const filterDesc: string[] = [];
                        if (filterDateFrom) filterDesc.push(`Od: ${formatDate(filterDateFrom.toISOString())}`);
                        if (filterDateTo) filterDesc.push(`Do: ${formatDate(filterDateTo.toISOString())}`);
                        if (filterAirline && filterAirline !== '__ALL__') {
                          const airline = airlines.find(a => a.id.toString() === filterAirline);
                          if (airline) filterDesc.push(`Kompanija: ${airline.name}`);
                        }
                        if (filterDestination) filterDesc.push(`Destinacija: ${filterDestination}`);
                        if (filterTrafficType && filterTrafficType !== '__ALL__') filterDesc.push(`Tip saobraćaja: ${filterTrafficType}`);
                        if (filterCurrency && filterCurrency !== '__ALL__') filterDesc.push(`Valuta: ${filterCurrency}`);
                        
                        const filterDescription = filterDesc.length > 0 
                          ? filterDesc.join(', ') 
                          : 'Sve operacije';
                        
                        try {
                          // Convert operations to FuelingOperation type
                          const convertedOperations = operations.map(op => convertToFuelingOperation(op));
                          generateConsolidatedDomesticPDFInvoice(convertedOperations, filterDescription);
                          toast.success('Domaća PDF faktura je uspješno generisana!');
                        } catch (error) {
                          console.error('Error generating domestic PDF invoice:', error);
                          toast.error('Došlo je do greške prilikom generisanja domaće PDF fakture.');
                        }
                      }}
                      variant="outline"
                      className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20 whitespace-nowrap"
                      disabled={operations.length === 0}
                      title="Faktura za unutarnji saobraćaj sa PDV-om"
                    >
                      <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="rgba(0, 0, 0, 0)"/>
                        <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Zbirna domaća faktura 
                    </Button>
                    
                    <Button
                      onClick={() => {
                        // Prepare filter description
                        const filterDesc: string[] = [];
                        if (filterDateFrom) filterDesc.push(`Od: ${formatDate(filterDateFrom.toISOString())}`);
                        if (filterDateTo) filterDesc.push(`Do: ${formatDate(filterDateTo.toISOString())}`);
                        if (filterAirline && filterAirline !== '__ALL__') {
                          const airline = airlines.find(a => a.id.toString() === filterAirline);
                          if (airline) filterDesc.push(`Kompanija: ${airline.name}`);
                        }
                        if (filterDestination) filterDesc.push(`Destinacija: ${filterDestination}`);
                        if (filterTrafficType && filterTrafficType !== '__ALL__') filterDesc.push(`Tip saobraćaja: ${filterTrafficType}`);
                        if (filterCurrency && filterCurrency !== '__ALL__') filterDesc.push(`Valuta: ${filterCurrency}`);
                        
                        const filterDescription = filterDesc.length > 0 
                          ? filterDesc.join(', ') 
                          : 'Sve operacije';
                        
                        try {
                          // Convert operations to FuelingOperation type
                          const convertedOperations = operations.map(op => convertToFuelingOperation(op));
                          const xmlContent = generateConsolidatedXMLInvoice(convertedOperations, filterDescription);
                          downloadXML(xmlContent, `Zbirna-Faktura-XML-${dayjs().format('YYYYMMDD')}.xml`);
                          toast.success('Zbirna XML faktura je uspješno generisana!');
                        } catch (error) {
                          console.error('Error generating consolidated XML invoice:', error);
                          toast.error('Došlo je do greške prilikom generisanja zbirne XML fakture.');
                        }
                      }}
                      variant="outline"
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 whitespace-nowrap"
                      disabled={operations.length === 0}
                      title="XML faktura za sistemsku integraciju"
                    >
                      <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 5h14v14H5V5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(0, 0, 0, 0)"/>
                        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Zbirni XML
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* All buttons are now displayed inline in the table footer */}
        
        {/* Revenue by Currency Report */}
        {!loading && !error && operations && operations.length > 0 && (
          <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Ukupan promet po valuti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(revenueByCurrency).map(([currency, amount]) => (
                <div key={currency} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        currency === 'USD' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        currency === 'EUR' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'KM'}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ukupan promet</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'KM'} {amount.toLocaleString('bs', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      currency === 'USD' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      currency === 'EUR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {currency}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* If no data for a specific currency, show empty state */}
              {!revenueByCurrency['USD'] && (
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center mr-3">$</div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ukupan promet</p>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200">$ 0.00</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!revenueByCurrency['EUR'] && (
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mr-3">€</div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ukupan promet</p>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200">€ 0.00</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!revenueByCurrency['BAM'] && (
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex items-center justify-center mr-3">KM</div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ukupan promet</p>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200">KM 0.00</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Operation Details Modal */}
        {showDetailsModal && selectedOperationForDetails && (
          <OperationDetailsModal
            operation={selectedOperationForDetails as FuelingOperation}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </div>
    </div>
  );
}
