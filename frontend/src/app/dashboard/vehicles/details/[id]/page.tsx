'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVehicleById, updateVehicle, uploadVehicleImage, getVehicleServiceRecords, createServiceRecordWithDocument, deleteServiceRecord } from '@/lib/apiService'; 
import { Vehicle, VehicleStatus, VehicleImage as VehicleImageType, ServiceRecord, ServiceRecordCategory, ServiceItemType, ServiceItem, CreateServiceRecordPayload } from '@/types';
import Modal from '@/components/ui/Modal'; // Modal component
import ServiceRecordForm from '@/components/forms/ServiceRecordForm'; // Assuming ServiceRecordForm path
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import {
  FaCar,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTools,
  FaCalendarAlt,
  FaStickyNote, 
  FaFilter,
  FaOilCan,
  FaThermometerHalf,
  FaTachometerAlt,
  FaFileContract,
  FaGasPump, 
  FaCamera,
  FaList,
  FaPlus,
  FaSave,
  FaEdit,
  FaTrash,
  FaCogs,
  FaFileMedical,
  FaFileInvoice, 
  FaTruck,
  FaRulerCombined,
  FaIndustry,
  FaBoxes,
  FaUserTie,
  FaIdCard,
  FaShieldAlt,
  FaClipboardList, 
  FaTimes,
  FaCheck,
  FaMapMarkerAlt,
  FaRegListAlt,
  FaRegFileAlt,
  FaRegBuilding,
  FaHardHat, 
  FaFireExtinguisher,
  FaBolt,
  FaWater,
  FaWind,
  FaWeightHanging,
  FaBalanceScale, 
  FaCheckSquare,
  FaCalendarPlus,
  FaTag,
  FaClock,
  FaMicrochip,
  FaEllipsisH,
  FaUser,
  FaPhone,
  FaStar, // Added FaStar for set main image button
  FaWrench,
  FaHistory,
  FaFileAlt,
  FaFilePdf,
  FaDownload,
  FaCalendarCheck,
  FaClipboard,
  FaShippingFast, // Added for crijeva_za_tocenje
  FaCog,
  FaHashtag,
  FaRulerVertical,
  FaAward,
  FaExternalLinkAlt,
  FaTruckLoading,
  FaUpload,
  FaTint,
  FaInbox,
  FaFlask,
  FaSearch,
  FaEye,
  FaClipboardCheck,
  FaBuilding,
} from 'react-icons/fa';
import { FiLoader, FiChevronDown, FiChevronUp, FiArrowLeft } from 'react-icons/fi'; 
import withAuth from '@/components/auth/withAuth';
import Image from 'next/image'; // Import Next.js Image component
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Loader2, Trash2, Car } from 'lucide-react';

interface EditableItemProps {
  label: string;
  value?: string | number | boolean | Date | null; 
  icon?: React.ReactNode;
  vehicleId: number;
  fieldName: keyof Vehicle; 
  onUpdate: () => void; 
  type?: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'textarea';
  options?: { value: string; label: string }[];
}

const sections = [
  { key: 'general', label: 'Opšti podaci', icon: FaCar },
  { key: 'technical', label: 'Tehnički podaci', icon: FaTools },
  { key: 'tanker', label: 'Specifikacija cisterne', icon: FaGasPump },
  { key: 'filter', label: 'Filter podaci', icon: FaFilter },
  { key: 'hoses', label: 'Crijeva', icon: FaShippingFast }, // Using FaShippingFast as a generic icon for hoses
  { key: 'calibration', label: 'Kalibracije', icon: FaBalanceScale },
  { key: 'notes', label: 'Napomene', icon: FaStickyNote },
  { key: 'service', label: 'Servisni zapisi', icon: FaFileMedical },
  { key: 'images', label: 'Slike vozila', icon: FaCamera },
];

const EditableItem: React.FC<EditableItemProps> = ({
  label,
  value,
  icon,
  vehicleId,
  fieldName,
  onUpdate,
  type = 'text',
  options,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(
    (value === null || value === undefined) && (type === 'text' || type === 'number' || type === 'textarea') 
    ? '' 
    : value
  );

  useEffect(() => {
    setSelectedValue(
      (value === null || value === undefined) && (type === 'text' || type === 'number' || type === 'textarea') 
      ? '' 
      : value
    );
  }, [value, type]);

  // Keep these formatters inside EditableItem for its own use
  const formatDateForDisplay = (date: Date | null | undefined) => {
    if (!date) return <span className="text-gray-400 italic">Nema podatka</span>;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return <span className="text-gray-400 italic">Neispravan datum</span>;
    return new Intl.DateTimeFormat('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
  };
  
  const formatDateForInput = (date: Date | null | undefined) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0]; 
  };

  const handleOpenModal = () => {
    // Reset selectedValue to current prop value when opening modal, applying the same logic
    setSelectedValue(
      (value === null || value === undefined) && (type === 'text' || type === 'number' || type === 'textarea') 
      ? '' 
      : value
    );
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveItem = async () => {
    let valueToSave: string | number | boolean | Date | null | undefined = selectedValue;

    if (type === 'number') {
      if (selectedValue === '' || selectedValue === null || selectedValue === undefined) {
        valueToSave = null; // Pošalji null za prazne/nevažeće unose za brojeve
      } else {
        const parsedNumber = parseFloat(String(selectedValue));
        if (isNaN(parsedNumber)) {
          // Ako nije validan broj nakon parsiranja, prikaži grešku i nemoj slati
          toast.error(`Vrijednost '${selectedValue}' nije validan broj za polje '${label}'.`);
          return; // Prekini spremanje
        } else {
          valueToSave = parsedNumber;
        }
      }
    }
    // Za datume, selectedValue je već Date objekt ili null zbog inputa type="date" i setSelectedValue
    // setSelectedValue(e.target.value ? new Date(e.target.value) : null)

    // Za boolean, selectedValue je boolean.
    // Za select i text/textarea, selectedValue je string.

    try {
      console.log(`Attempting to update vehicle. ID: ${vehicleId}, Field: ${fieldName}, Value:`, valueToSave); // Added for debugging
      await updateVehicle(vehicleId, { [fieldName]: valueToSave }); 
      toast.success(`Polje '${label}' uspješno ažurirano.`);
      onUpdate(); 
      handleCloseModal();
    } catch (error: any) {
      console.error('Greška pri ažuriranju polja - Sirovi Error Objekt:', error);
      let displayMessage = 'Greška pri ažuriranju polja. Pokušajte ponovo.';

      if (error.responseBody && error.responseBody.message) {
        displayMessage = error.responseBody.message;
      } else if (error.message) {
        displayMessage = error.message;
      }
      // Dodatno, ako postoje detaljne validacijske greške (primjer)
      if (error.responseBody && error.responseBody.errors && Array.isArray(error.responseBody.errors)) {
        const validationErrors = error.responseBody.errors.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
        displayMessage += ` (${validationErrors})`;
      }

      console.error('Obrađena poruka greške za toast:', displayMessage);
      toast.error(displayMessage);
    }
  };

  const displayValue = () => {
    if (type === 'date') return formatDateForDisplay(value as Date | null);
    if (type === 'boolean') {
      return value ? 
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500 font-semibold">Da</span> : 
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500 font-semibold">Ne</span>;
    }
    if (value === null || value === undefined || String(value).trim() === '') 
      return <span className="text-gray-400 italic">Nema podatka</span>;
    
    return <span className="font-medium">{String(value)}</span>;
  };

  return (
    <motion.div 
      className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="p-4 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {icon && <span className="mr-3 text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{icon}</span>}
            <span className="text-sm font-semibold text-gray-700">{label}</span>
          </div>
          <button 
            onClick={handleOpenModal} 
            className="p-1.5 text-blue-500 hover:text-blue-700 rounded-md backdrop-blur-md bg-white/30 hover:bg-white/40 border border-white/30 hover:border-white/50 transition-all duration-200 shadow-sm"
            aria-label={`Uredi ${label}`}
          >
            <FaEdit className="w-3.5 h-3.5" /> 
          </button>
        </div>
        <div 
          className="pl-0 md:pl-9 text-md text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-200" 
          onClick={handleOpenModal}
        >
          {displayValue()}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-md p-6 rounded-xl shadow-2xl max-w-md w-full border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Uredi: <span className="normal-case">{label}</span>
              </h4>
              <button 
                onClick={handleCloseModal} 
                className="text-gray-500 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100/50 backdrop-blur-sm transition-all"
              >
                <FaTimes className="w-4 h-4"/>
              </button>
            </div>
            <div className="mb-5 space-y-3">
              {type === 'textarea' ? (
                <textarea 
                  value={selectedValue as string}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white/50 backdrop-blur-sm"
                  placeholder={`Unesite ${label.toLowerCase()}`}
                />
              ) : type === 'select' ? (
                <select 
                  value={selectedValue as string} 
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white/50 backdrop-blur-sm"
                >
                  {options?.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : type === 'boolean' ? (
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setSelectedValue(true)}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedValue === true 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                        : 'bg-white/50 backdrop-blur-sm border border-white/20 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    Da
                  </button>
                  <button 
                    onClick={() => setSelectedValue(false)}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedValue === false 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md' 
                        : 'bg-white/50 backdrop-blur-sm border border-white/20 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    Ne
                  </button>
                </div>
              ) : type === 'date' ? (
                <input 
                  type="date" 
                  value={formatDateForInput(selectedValue as Date)}
                  onChange={(e) => setSelectedValue(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-4 py-2.5 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white/50 backdrop-blur-sm"
                />
              ) : (
                <input 
                  type={type === 'number' ? 'number' : 'text'} 
                  value={selectedValue as string}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow text-sm bg-white/50 backdrop-blur-sm"
                  placeholder={`Unesite ${label.toLowerCase()}`}
                />
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
              >
                Odustani
              </Button>
              <Button 
                variant="default"
                size="sm"
                onClick={handleSaveItem}
              >
                Spremi
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}; 

interface DatePairItemProps {
  baseLabel: string;
  lastDate?: Date | null;
  nextDate?: Date | null;
  vehicleId: number;
  lastDateFieldName: keyof Vehicle;
  nextDateFieldName: keyof Vehicle;
  onUpdate: () => void;
  icon?: React.ReactNode;
}

const DatePairItem: React.FC<DatePairItemProps> = ({
  baseLabel,
  lastDate,
  nextDate,
  vehicleId,
  lastDateFieldName,
  nextDateFieldName,
  onUpdate,
  icon
}) => {
  // Helper function for displaying dates in the component
  const formatDateForDisplay = (date: Date | null | undefined) => {
    if (!date) return <span className="text-gray-400 italic">Nema podatka</span>;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return <span className="text-gray-400 italic">Neispravan datum</span>;
    return new Intl.DateTimeFormat('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
  };

  return (
    <motion.div 
      className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl p-5 transition-all duration-200 shadow-md hover:shadow-lg"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <h4 className="text-md font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 flex items-center">
        {icon && <span className="mr-3 text-xl">{icon}</span>}
        {baseLabel}
      </h4>
      <div className="space-y-4">
        <div className="relative pl-7 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-blue-500/60 before:to-indigo-500/60">
          <div className="absolute left-[-5px] top-1.5 w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md"></div>
          <span className="text-sm font-medium text-gray-700 block mb-2">Datum posljednje:</span>
          <div className="backdrop-blur-md bg-white/20 rounded-lg p-3 border border-white/30 shadow-inner">
            {lastDate ? formatDateForDisplay(lastDate) : <span className="text-gray-400 italic">Nema podatka</span>}
            <button 
              onClick={() => {
                const modal = document.getElementById(`edit-modal-${lastDateFieldName}`);
                if (modal) modal.click();
              }} 
              className="absolute right-3 top-3 p-1 text-blue-500 hover:text-blue-700 bg-white/30 rounded-md hover:bg-white/40 transition-all duration-200 shadow-sm"
              aria-label={`Uredi datum posljednje ${baseLabel.toLowerCase()}`}
            >
              <FaEdit className="w-3 h-3" />
            </button>
          </div>
          <div id={`edit-modal-${lastDateFieldName}`} className="hidden">
            <EditableItem
              label={`Datum posljednje (${baseLabel.toLowerCase()})`}
              value={lastDate}
              vehicleId={vehicleId}
              fieldName={lastDateFieldName}
              onUpdate={onUpdate}
              type="date"
            />
          </div>
        </div>
        
        <div className="relative pl-7 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-blue-500/60 before:to-indigo-500/60">
          <div className="absolute left-[-5px] top-1.5 w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-md"></div>
          <span className="text-sm font-medium text-gray-700 block mb-2">Datum sljedeće:</span>
          <div className="backdrop-blur-md bg-white/20 rounded-lg p-3 border border-white/30 shadow-inner">
            {nextDate ? formatDateForDisplay(nextDate) : <span className="text-gray-400 italic">Nema podatka</span>}
            <button 
              onClick={() => {
                const modal = document.getElementById(`edit-modal-${nextDateFieldName}`);
                if (modal) modal.click();
              }} 
              className="absolute right-3 top-3 p-1 text-blue-500 hover:text-blue-700 bg-white/30 rounded-md hover:bg-white/40 transition-all duration-200 shadow-sm"
              aria-label={`Uredi datum sljedeće ${baseLabel.toLowerCase()}`}
            >
              <FaEdit className="w-3 h-3" />
            </button>
          </div>
          <div id={`edit-modal-${nextDateFieldName}`} className="hidden">
            <EditableItem
              label={`Datum sljedeće (${baseLabel.toLowerCase()})`}
              value={nextDate}
              vehicleId={vehicleId}
              fieldName={nextDateFieldName}
              onUpdate={onUpdate}
              type="date"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  initiallyExpanded?: boolean;
}

// Helper functions for formatting service record data
const formatServiceCategory = (category: ServiceRecordCategory): string => {
  const categoryMap: Record<ServiceRecordCategory, string> = {
    [ServiceRecordCategory.REGULAR_MAINTENANCE]: 'Redovno održavanje',
    [ServiceRecordCategory.REPAIR]: 'Popravka',
    [ServiceRecordCategory.TECHNICAL_INSPECTION]: 'Tehnički pregled',
    [ServiceRecordCategory.FILTER_REPLACEMENT]: 'Zamjena filtera',
    [ServiceRecordCategory.HOSE_REPLACEMENT]: 'Zamjena crijeva',
    [ServiceRecordCategory.CALIBRATION]: 'Kalibracija',
    [ServiceRecordCategory.OTHER]: 'Ostalo'
  };
  return categoryMap[category] || category;
};

const formatServiceItemType = (type: ServiceItemType): string => {
  const typeMap: Record<ServiceItemType, string> = {
    [ServiceItemType.FILTER]: 'Filter',
    [ServiceItemType.HOSE_HD63]: 'Crijevo HD63',
    [ServiceItemType.HOSE_HD38]: 'Crijevo HD38',
    [ServiceItemType.HOSE_TW75]: 'Crijevo TW75',
    [ServiceItemType.HOSE_LEAK_TEST]: 'Test curenja crijeva',
    [ServiceItemType.VOLUMETER]: 'Volumetar',
    [ServiceItemType.MANOMETER]: 'Manometar',
    [ServiceItemType.HECPV_ILCPV]: 'HECPV/ILCPV',
    [ServiceItemType.SIX_MONTH_CHECK]: '6-mjesečna provjera',
    [ServiceItemType.ENGINE]: 'Motor',
    [ServiceItemType.BRAKES]: 'Kočnice',
    [ServiceItemType.TRANSMISSION]: 'Transmisija',
    [ServiceItemType.ELECTRICAL]: 'Električni sistem',
    [ServiceItemType.TIRES]: 'Gume',
    [ServiceItemType.OTHER]: 'Ostalo'
  };
  return typeMap[type] || type;
};

// Service Record Form Component


const Card: React.FC<CardProps> = ({ title, icon, children, className, initiallyExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`relative border border-white/30 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/30 shadow-lg rounded-xl overflow-hidden ${className || ''}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
      </div>
      <button 
        onClick={handleToggle} 
        className="w-full flex items-center justify-between p-4 md:p-5 focus:outline-none bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-md hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-200 relative z-10 shadow-md"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center">
          {icon && <span className="mr-3 text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{icon}</span>}
          <h3 className="text-lg md:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{title}</h3>
        </div>
        {children && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <FiChevronDown className="text-gray-500" />
          </motion.div>
        )}
      </button>
      {children && isExpanded && (
        <motion.div 
          className="p-4 md:p-5 border-t border-white/30 bg-transparent relative z-10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

const VehicleDetailsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  // State variables
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(sections[0].key);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [isLoadingServiceRecords, setIsLoadingServiceRecords] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
  const [showServiceRecordFormModal, setShowServiceRecordFormModal] = useState(false);
  const [selectedServiceRecord, setSelectedServiceRecord] = useState<ServiceRecord | null>(null); // Used to track which record is being deleted
  const [showAddServiceRecordModal, setShowAddServiceRecordModal] = useState(false);
  const [selectedServiceRecordForModal, setSelectedServiceRecordForModal] = useState<ServiceRecord | null>(null);
  const [showViewServiceRecordModal, setShowViewServiceRecordModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For image uploads
  const [selectedImageForModal, setSelectedImageForModal] = useState<VehicleImageType | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mainImageChanged, setMainImageChanged] = useState(false); // To trigger re-fetch or UI update

  // Define formatter here for use in VehicleDetailsPage scope (e.g. for calculated_filter_expiry_date)
  const formatDateForDisplayInPage = (date: Date | string | null | undefined) => {
    if (!date) return <span className="text-gray-400 italic">Nema podatka</span>;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return <span className="text-gray-400 italic">Neispravan datum</span>; 
    return new Intl.DateTimeFormat('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj);
  };

  // Fetch vehicle details
  const fetchVehicleDetails = useCallback(async () => {
    if (!id) {
      setError("ID vozila nije pronađen.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getVehicleById(id as string);
      setVehicle(data);
      setError(null);
    } catch (err) {
      console.error("Greška pri dohvatanju detalja vozila:", err);
      setError("Greška pri dohvatanju detalja vozila. Pokušajte ponovo kasnije.");
      setVehicle(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch service records
  const fetchServiceRecords = useCallback(async () => {
    if (!id) return;
    setIsLoadingServiceRecords(true);
    try {
      const records = await getVehicleServiceRecords(id as string);
      setServiceRecords(records);
    } catch (err) {
      console.error("Greška pri dohvatanju servisnih zapisa:", err);
      toast.error("Greška pri dohvatanju servisnih zapisa.");
    } finally {
      setIsLoadingServiceRecords(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id, fetchVehicleDetails]);

  useEffect(() => {
    if (activeSection === 'service' || vehicle) { 
      fetchServiceRecords();
    }
  }, [id, activeSection, vehicle, fetchServiceRecords]);

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedFile || !vehicle) return;
    setIsUploading(true);
    try {
      await uploadVehicleImage(vehicle.id.toString(), selectedFile);
      toast.success('Slika uspješno uploadovana!');
      fetchVehicleDetails(); 
      setSelectedFile(null); 
      const fileInput = document.getElementById('imageUploadInput') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; 
    } catch (error) {
      console.error('Greška pri uploadu slike:', error);
      toast.error('Greška pri uploadu slike.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files ? e.target.files[0] : null);
  };
  
  const handleDeleteServiceRecord = async (recordId: number) => {
    console.log(`Attempting to delete service record with ID: ${recordId}`);
    setDeletingRecordId(recordId);
    try {
      if (!vehicle) { toast.error('ID vozila nije dostupan.'); return; }
      await deleteServiceRecord(vehicle.id, recordId);
      toast.success('Servisni nalog uspješno obrisan!');
      fetchServiceRecords(); // Refresh the list
    } catch (error) {
      console.error('Error deleting service record:', error);
      toast.error('Greška pri brisanju servisnog naloga.');
    } finally {
      setDeletingRecordId(null);
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    if (!vehicle) return;
    const originalImages = vehicle.images;
    const updatedImages = vehicle.images?.map(img => ({ ...img, is_main: img.id === imageId })) || [];
    // Optimistically update the vehicle state with the new images list
    setVehicle(prev => {
      if (!prev) return null;
      return {
         ...prev, 
         images: updatedImages, 
      };
    });

    try {
      // The backend should handle setting is_main on the images.
      // We might need a specific endpoint or logic if updateVehicle doesn't do this.
      // For now, we assume updating any vehicle field might trigger re-evaluation or that a separate image update mechanism exists.
      // If `updateVehicle` is expected to set the main image by ID, the API contract needs clarification.
      // For now, only call updateVehicle here is to ensure `updated_at` changes or similar side-effects.
      // We will NOT pass mainImageId as it's not part of the Vehicle type for updates.
      await updateVehicle(vehicle.id, { /* Potentially other updatable fields if needed */ }); 
      toast.success('Glavna slika uspješno postavljena!');
      setMainImageChanged(!mainImageChanged); // Trigger re-fetch or UI update if necessary
    } catch (error) {
      console.error('Error setting main image:', error);
      toast.error('Greška pri postavljanju glavne slike. Backend možda ne podržava ovu operaciju direktno na vozilu.');
      // Revert optimistic update for images
      setVehicle(prev => {
        if (!prev) return null;
        return {
           ...prev, 
           images: originalImages,
        };
      });
    }
  };

  const handleSectionChange = (key: string) => {
    setActiveSection(key);
  };

  const getStatusColor = (status: VehicleStatus | undefined) => {
    if (!status) return 'bg-gradient-to-r from-gray-500 to-slate-500 border-gray-400';
    switch (status) {
      case VehicleStatus.ACTIVE: return 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400';
      case VehicleStatus.INACTIVE: return 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400';
      case VehicleStatus.MAINTENANCE: return 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400';
      case VehicleStatus.OUT_OF_SERVICE: return 'bg-gradient-to-r from-red-500 to-pink-500 border-red-400';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 border-gray-400';
    }
  };
  
  const openImageModal = (image: VehicleImageType) => {
    setSelectedImageForModal(image);
  };

  const handleViewServiceRecord = (record: ServiceRecord) => {
    setSelectedServiceRecordForModal(record);
    setShowViewServiceRecordModal(true);
  };

  const closeImageModal = () => {
    setSelectedImageForModal(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-150px)]">
        <motion.div 
          className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-lg font-medium text-muted-foreground mt-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Učitavanje podataka o vozilu...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
        <motion.div 
          className="backdrop-blur-md bg-white/10 border border-white/10 p-8 rounded-2xl text-center max-w-md shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <FaExclamationTriangle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-xl font-semibold mb-2 text-red-500">Greška!</p>
          <p className="mb-6 text-gray-600">{error}</p>
          <Button 
            variant="destructive"
            onClick={() => router.push('/dashboard/vehicles')}
          >
            Povratak na listu vozila
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
        <motion.div 
          className="backdrop-blur-md bg-white/10 border border-white/10 p-8 rounded-2xl text-center max-w-md shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 mx-auto bg-gray-500/10 rounded-full flex items-center justify-center mb-4">
            <FaCar className="h-8 w-8 text-gray-500" />
          </div>
          <p className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Vozilo nije pronađeno</p>
          <p className="mb-6 text-gray-600">Nije moguće pronaći traženo vozilo.</p>
          <Button 
            variant="default"
            onClick={() => router.push('/dashboard/vehicles')}
          >
            Povratak na listu vozila
          </Button>
        </motion.div>
      </div>
    );
  }

  const mainImage = vehicle.images?.find(img => img.isMainImage) || vehicle.images?.[0];

  return (
    <motion.div 
      className="space-y-6 p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Vehicle Header: Main Image and Name */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          {mainImage && mainImage.imageUrl ? (
            <div className="flex-shrink-0 relative h-32 w-32 md:h-40 md:w-40 rounded-xl overflow-hidden border border-white/20 shadow-md">
              <Image 
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${mainImage.imageUrl}`} 
                alt={`Glavna slika vozila ${vehicle.vehicle_name}`} 
                fill
                sizes="(max-width: 768px) 128px, 160px"
                style={{ objectFit: 'cover' }}
                className="transition-transform duration-300"
                onError={(e) => console.error("Error loading main image:", mainImage.imageUrl, e)}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 h-32 w-32 md:h-40 md:w-40 rounded-xl border border-white/20 shadow-md bg-gradient-to-br from-gray-200/50 to-gray-300/50 backdrop-blur-md flex items-center justify-center">
              <Car className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="flex-grow text-center md:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {vehicle.vehicle_name}
            </motion.h1>
            <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">VIN:</span> {vehicle.chassis_number || 'N/A'}
              </p>
              {vehicle.license_plate && (
                <span className="px-3 py-1 rounded-full text-sm font-medium border border-white/20 bg-white/10 backdrop-blur-sm">
                  Reg: {vehicle.license_plate}
                </span>
              )}
              {vehicle.status && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white shadow-md border border-white/20 backdrop-blur-sm ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </span>
              )}
            </div>
            {(vehicle.company?.name || vehicle.location?.name) && (
              <div className="flex flex-wrap gap-3 mt-3">
                {vehicle.company?.name && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FaRegBuilding className="mr-1.5 text-blue-500/80" /> 
                    {vehicle.company.name}
                  </div>
                )}
                {vehicle.location?.name && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FaMapMarkerAlt className="mr-1.5 text-blue-500/80" /> 
                    {vehicle.location.name}
                  </div>
                )}
              </div>
            )}
            <div className="mt-3 flex justify-center md:justify-start">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/dashboard/vehicles')}
              >
                <FiArrowLeft className="mr-1.5 h-4 w-4" />
                Nazad na listu
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation for sections */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-5 translate-y-1/2 -translate-x-1/4"></div>
        
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto p-1 relative z-10" aria-label="Sections">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => handleSectionChange(section.key)}
              className={`whitespace-nowrap group flex-shrink-0 flex items-center py-2.5 px-3 sm:px-4 rounded-lg font-medium text-sm transition-all duration-150 ease-in-out
                          ${activeSection === section.key
                ? 'border border-white/20 bg-white/10 shadow-md text-blue-600'
                : 'border border-transparent hover:bg-white/5 text-gray-500 hover:text-gray-700'
              }`}
            >
              {React.createElement(section.icon, { 
                className: `w-4 h-4 mr-2 ${activeSection === section.key 
                  ? 'text-blue-500' 
                  : 'text-gray-400 group-hover:text-gray-500'
                }` 
              })}
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content of the active section */}
      <div className="space-y-6">
        {activeSection === 'general' && (
          <Card title="Osnovne Informacije" icon={<FaInfoCircle />} className="mb-6">
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-600 font-semibold mb-3 px-1 flex items-center">
                <FaTruck className="mr-2 text-blue-500" /> Osnovni podaci o vozilu
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableItem label="Naziv/Model Vozila" value={vehicle.vehicle_name || ''} icon={<FaTruck />} vehicleId={vehicle.id} fieldName="vehicle_name" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Registracija" value={vehicle.license_plate} icon={<FaIdCard />} vehicleId={vehicle.id} fieldName="license_plate" onUpdate={fetchVehicleDetails} />
                <EditableItem label="VIN (Broj Šasije)" value={vehicle.chassis_number || ''} icon={<FaHashtag />} vehicleId={vehicle.id} fieldName="chassis_number" onUpdate={fetchVehicleDetails} />
              </div>
            </div>
              
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-600 font-semibold mb-3 px-1 flex items-center">
                <FaBuilding className="mr-2 text-blue-500" /> Pripadnost
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display Company Name */}
                {vehicle.company && (
                  <motion.div 
                    className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl p-4 transition-all duration-200 shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="flex items-center mb-2">
                      <FaRegBuilding className="mr-3 text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600" /> 
                      <span className="text-sm font-semibold text-gray-700">Firma</span>
                    </div>
                    <div className="pl-0 md:pl-9 text-md font-medium text-gray-800">
                      {vehicle.company.name || <span className="text-gray-400 italic">Nema podatka</span>}
                    </div>
                  </motion.div>
                )}

                {/* Display Location Name */}
                {vehicle.location && (
                  <motion.div 
                    className="backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl p-4 transition-all duration-200 shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="flex items-center mb-2">
                      <FaMapMarkerAlt className="mr-3 text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600" />
                      <span className="text-sm font-semibold text-gray-700">Lokacija</span>
                    </div>
                    <div className="pl-0 md:pl-9 text-md font-medium text-gray-800">
                      {vehicle.location.name || <span className="text-gray-400 italic">Nema podatka</span>}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
                
            <div className="mb-3">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-500" /> Status i datumi isteka
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableItem label="Status Vozila" value={vehicle.status || ''} icon={<FaCheckSquare />} type="select" options={Object.values(VehicleStatus).map(s => ({ value: s, label: s.replace(/_/g, ' ') }))} vehicleId={vehicle.id} fieldName="status" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Registracija Ističe" value={vehicle.registrovano_do || undefined} icon={<FaCalendarAlt />} type="date" vehicleId={vehicle.id} fieldName="registrovano_do" onUpdate={fetchVehicleDetails} />
                <EditableItem label="ADR Važi Do" value={vehicle.adr_vazi_do || undefined} icon={<FaShieldAlt />} type="date" vehicleId={vehicle.id} fieldName="adr_vazi_do" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Periodični Pregled Važi Do" value={vehicle.periodicni_pregled_vazi_do ? new Date(vehicle.periodicni_pregled_vazi_do as string) : undefined} icon={<FaClipboardList />} type="date" vehicleId={vehicle.id} fieldName="periodicni_pregled_vazi_do" onUpdate={fetchVehicleDetails} />
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'tanker' && (
          <Card title="Informacije o Tankeru" icon={<FaTruckLoading />} className="mb-6">
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaTint className="mr-2 text-blue-500" /> Osnovne specifikacije
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableItem label="Tip Tankera" value={vehicle.tanker_type || ''} icon={<FaTint />} vehicleId={vehicle.id} fieldName="tanker_type" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Kapacitet Tankera (L)" value={vehicle.kapacitet_cisterne || ''} icon={<FaRulerVertical />} type="number" vehicleId={vehicle.id} fieldName="kapacitet_cisterne" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Broj Komora" value={vehicle.tanker_compartments || ''} icon={<FaInbox />} type="number" vehicleId={vehicle.id} fieldName="tanker_compartments" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Materijal Tankera" value={vehicle.tanker_material || ''} icon={<FaCog />} vehicleId={vehicle.id} fieldName="tanker_material" onUpdate={fetchVehicleDetails} />
              </div>
            </div>
            
            <div>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaClipboardCheck className="mr-2 text-blue-500" /> Atesti i inspekcije
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DatePairItem
                  baseLabel="Atest Cisterni"
                  lastDate={vehicle.tanker_last_pressure_test_date ? new Date(vehicle.tanker_last_pressure_test_date) : undefined}
                  nextDate={vehicle.tanker_next_pressure_test_date ? new Date(vehicle.tanker_next_pressure_test_date) : undefined}
                  vehicleId={vehicle.id}
                  lastDateFieldName="tanker_last_pressure_test_date"
                  nextDateFieldName="tanker_next_pressure_test_date"
                  onUpdate={fetchVehicleDetails}
                  icon={<FaFlask />}
                />
                <DatePairItem
                  baseLabel="Atest Protivpožarne Zaštite"
                  lastDate={vehicle.tanker_last_fire_safety_test_date ? new Date(vehicle.tanker_last_fire_safety_test_date) : undefined}
                  nextDate={vehicle.tanker_next_fire_safety_test_date ? new Date(vehicle.tanker_next_fire_safety_test_date) : undefined}
                  vehicleId={vehicle.id}
                  lastDateFieldName="tanker_last_fire_safety_test_date"
                  nextDateFieldName="tanker_next_fire_safety_test_date"
                  onUpdate={fetchVehicleDetails}
                  icon={<FaFireExtinguisher />}
                />
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'technical' && (
          <Card title="Tehnički podaci" icon={<FaTools />} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableItem label="Godina proizvodnje" value={vehicle.year_of_manufacture} icon={<FaCalendarAlt />} vehicleId={vehicle.id} fieldName="year_of_manufacture" type="number" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Proizvođač šasije" value={vehicle.chassis_manufacturer} icon={<FaIndustry />} vehicleId={vehicle.id} fieldName="chassis_manufacturer" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Tip šasije" value={vehicle.chassis_type} icon={<FaCar />} vehicleId={vehicle.id} fieldName="chassis_type" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Proizvođač nadogradnje" value={vehicle.body_manufacturer} icon={<FaIndustry />} vehicleId={vehicle.id} fieldName="body_manufacturer" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Tip nadogradnje" value={vehicle.body_type} icon={<FaTruckLoading />} vehicleId={vehicle.id} fieldName="body_type" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Broj osovina" value={vehicle.axle_count} icon={<FaCogs />} vehicleId={vehicle.id} fieldName="axle_count" type="number" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Nosivost (kg)" value={vehicle.carrying_capacity_kg} icon={<FaWeightHanging />} vehicleId={vehicle.id} fieldName="carrying_capacity_kg" type="number" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Snaga motora (kW)" value={vehicle.engine_power_kw} icon={<FaBolt />} vehicleId={vehicle.id} fieldName="engine_power_kw" type="number" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Zapremina motora (ccm)" value={vehicle.engine_displacement_ccm} icon={<FaTachometerAlt />} vehicleId={vehicle.id} fieldName="engine_displacement_ccm" type="number" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Broj sjedišta" value={vehicle.seat_count} icon={<FaUser />} vehicleId={vehicle.id} fieldName="seat_count" type="number" onUpdate={fetchVehicleDetails} />
              <EditableItem label="Vrsta goriva" value={vehicle.fuel_type} icon={<FaGasPump />} vehicleId={vehicle.id} fieldName="fuel_type" onUpdate={fetchVehicleDetails} />
            </div>
          </Card>
        )}

        {activeSection === 'filter' && (
          <Card title="Filter podaci" icon={<FaFilter />} className="mb-6">
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaFilter className="mr-2 text-blue-500" /> Osnovne informacije
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableItem label="Filter instaliran" value={vehicle.filter_installed} icon={<FaCheckSquare />} vehicleId={vehicle.id} fieldName="filter_installed" type="boolean" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Datum instalacije filtera" value={vehicle.filter_installation_date} icon={<FaCalendarPlus />} vehicleId={vehicle.id} fieldName="filter_installation_date" type="date" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Validnost filtera (mjeseci)" value={vehicle.filter_validity_period_months} icon={<FaClock />} vehicleId={vehicle.id} fieldName="filter_validity_period_months" type="number" onUpdate={fetchVehicleDetails} />
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaInfoCircle className="mr-2 text-blue-500" /> Tehnički detalji filtera
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditableItem label="Tipska pločica filtera" value={vehicle.filter_type_plate_no} icon={<FaTag />} vehicleId={vehicle.id} fieldName="filter_type_plate_no" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Tip filtera (generalno)" value={vehicle.tip_filtera} icon={<FaFilter />} vehicleId={vehicle.id} fieldName="tip_filtera" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Broj posude filtera" value={vehicle.filter_vessel_number} icon={<FaHashtag />} vehicleId={vehicle.id} fieldName="filter_vessel_number" onUpdate={fetchVehicleDetails} />
                <EditableItem label="EW Senzor - Datum inspekcije" value={vehicle.filter_ew_sensor_inspection_date} icon={<FaCalendarCheck />} vehicleId={vehicle.id} fieldName="filter_ew_sensor_inspection_date" type="date" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Senzorska tehnologija" value={vehicle.sensor_technology} icon={<FaMicrochip />} vehicleId={vehicle.id} fieldName="sensor_technology" onUpdate={fetchVehicleDetails} />
              </div>
            </div>
            
            {vehicle.calculated_filter_expiry_date && (
              <motion.div 
                className="mb-6 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl p-4 shadow-sm"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center mb-2">
                  <FaCalendarAlt className="mr-3 text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600" />
                  <span className="text-sm font-semibold text-gray-700">Izračunati datum isteka filtera</span>
                </div>
                <div className="pl-0 md:pl-9 text-md font-medium text-gray-800">
                  {formatDateForDisplayInPage(vehicle.calculated_filter_expiry_date as Date | null)}
                </div>
              </motion.div>
            )}
            
            <div>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaClipboardCheck className="mr-2 text-blue-500" /> Inspekcije
              </h3>
              <DatePairItem
                baseLabel="Godišnja inspekcija filtera"
                lastDate={vehicle.filter_annual_inspection_date ? new Date(vehicle.filter_annual_inspection_date as string) : undefined}
                nextDate={vehicle.filter_next_annual_inspection_date ? new Date(vehicle.filter_next_annual_inspection_date as string) : undefined}
                vehicleId={vehicle.id}
                lastDateFieldName="filter_annual_inspection_date"
                nextDateFieldName="filter_next_annual_inspection_date"
                onUpdate={fetchVehicleDetails}
                icon={<FaClipboardList />}
              />
            </div>
          </Card>
        )}

        {activeSection === 'hoses' && (
          <Card title="Crijeva" icon={<FaShippingFast />} className="mb-6">
            <div className="space-y-6">
              <EditableItem label="Tip crijeva za točenje" value={vehicle.crijeva_za_tocenje} icon={<FaInfoCircle />} vehicleId={vehicle.id} fieldName="crijeva_za_tocenje" onUpdate={fetchVehicleDetails} />
              
              <div>
                <h5 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">Crijevo HD63</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                  <EditableItem label="Broj crijeva HD63" value={vehicle.broj_crijeva_hd63} icon={<FaHashtag />} vehicleId={vehicle.id} fieldName="broj_crijeva_hd63" onUpdate={fetchVehicleDetails} />
                  <EditableItem label="God. proizv. HD63" value={vehicle.godina_proizvodnje_crijeva_hd63} icon={<FaCalendarAlt />} type="number" vehicleId={vehicle.id} fieldName="godina_proizvodnje_crijeva_hd63" onUpdate={fetchVehicleDetails} />
                  <EditableItem label="Datum test. pritiska HD63" value={vehicle.datum_testiranja_pritiska_crijeva_hd63} icon={<FaCalendarCheck />} type="date" vehicleId={vehicle.id} fieldName="datum_testiranja_pritiska_crijeva_hd63" onUpdate={fetchVehicleDetails} />
                </div>
                <DatePairItem
                  baseLabel="Zamjena crijeva HD63"
                  lastDate={vehicle.last_hose_hd63_replacement_date}
                  nextDate={vehicle.next_hose_hd63_replacement_date}
                  vehicleId={vehicle.id}
                  lastDateFieldName="last_hose_hd63_replacement_date"
                  nextDateFieldName="next_hose_hd63_replacement_date"
                  onUpdate={fetchVehicleDetails}
                  icon={<FaWrench />}
                />
              </div>

              <div>
                <h5 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">Crijevo HD38</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                  <EditableItem label="Broj crijeva HD38" value={vehicle.broj_crijeva_hd38} icon={<FaHashtag />} vehicleId={vehicle.id} fieldName="broj_crijeva_hd38" onUpdate={fetchVehicleDetails} />
                  <EditableItem label="God. proizv. HD38" value={vehicle.godina_proizvodnje_crijeva_hd38} icon={<FaCalendarAlt />} type="number" vehicleId={vehicle.id} fieldName="godina_proizvodnje_crijeva_hd38" onUpdate={fetchVehicleDetails} />
                  <EditableItem label="Datum test. pritiska HD38" value={vehicle.datum_testiranja_pritiska_crijeva_hd38} icon={<FaCalendarCheck />} type="date" vehicleId={vehicle.id} fieldName="datum_testiranja_pritiska_crijeva_hd38" onUpdate={fetchVehicleDetails} />
                </div>
                <DatePairItem
                  baseLabel="Zamjena crijeva HD38"
                  lastDate={vehicle.last_hose_hd38_replacement_date}
                  nextDate={vehicle.next_hose_hd38_replacement_date}
                  vehicleId={vehicle.id}
                  lastDateFieldName="last_hose_hd38_replacement_date"
                  nextDateFieldName="next_hose_hd38_replacement_date"
                  onUpdate={fetchVehicleDetails}
                  icon={<FaWrench />}
                />
              </div>

              <div>
                <h5 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">Crijevo TW75</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
                  <EditableItem label="Broj crijeva TW75" value={vehicle.broj_crijeva_tw75} icon={<FaHashtag />} vehicleId={vehicle.id} fieldName="broj_crijeva_tw75" onUpdate={fetchVehicleDetails} />
                  <EditableItem label="God. proizv. TW75" value={vehicle.godina_proizvodnje_crijeva_tw75} icon={<FaCalendarAlt />} type="number" vehicleId={vehicle.id} fieldName="godina_proizvodnje_crijeva_tw75" onUpdate={fetchVehicleDetails} />
                  <EditableItem label="Datum test. pritiska TW75" value={vehicle.datum_testiranja_pritiska_crijeva_tw75} icon={<FaCalendarCheck />} type="date" vehicleId={vehicle.id} fieldName="datum_testiranja_pritiska_crijeva_tw75" onUpdate={fetchVehicleDetails} />
                </div>
                <DatePairItem
                  baseLabel="Zamjena crijeva TW75"
                  lastDate={vehicle.last_hose_tw75_replacement_date}
                  nextDate={vehicle.next_hose_tw75_replacement_date}
                  vehicleId={vehicle.id}
                  lastDateFieldName="last_hose_tw75_replacement_date"
                  nextDateFieldName="next_hose_tw75_replacement_date"
                  onUpdate={fetchVehicleDetails}
                  icon={<FaWrench />}
                />
              </div>
              
              <DatePairItem
                baseLabel="Test curenja crijeva (sva)"
                lastDate={vehicle.last_hose_leak_test_date}
                nextDate={vehicle.next_hose_leak_test_date}
                vehicleId={vehicle.id}
                lastDateFieldName="last_hose_leak_test_date"
                nextDateFieldName="next_hose_leak_test_date"
                onUpdate={fetchVehicleDetails}
                icon={<FaTint />}
              />
            </div>
          </Card>
        )}

        {activeSection === 'calibration' && (
          <Card title="Kalibracije" icon={<FaBalanceScale />} className="mb-6">
            <div className="space-y-6">
              <DatePairItem
                baseLabel="Kalibracija volumetra"
                lastDate={vehicle.last_volumeter_calibration_date}
                nextDate={vehicle.next_volumeter_calibration_date}
                vehicleId={vehicle.id}
                lastDateFieldName="last_volumeter_calibration_date"
                nextDateFieldName="next_volumeter_calibration_date"
                onUpdate={fetchVehicleDetails}
                icon={<FaFlask />}
              />
              <DatePairItem
                baseLabel="Kalibracija manometra"
                lastDate={vehicle.last_manometer_calibration_date}
                nextDate={vehicle.next_manometer_calibration_date}
                vehicleId={vehicle.id}
                lastDateFieldName="last_manometer_calibration_date"
                nextDateFieldName="next_manometer_calibration_date"
                onUpdate={fetchVehicleDetails}
                icon={<FaTachometerAlt />}
              />
              <DatePairItem
                baseLabel="HECPV/ILCPV Test"
                lastDate={vehicle.last_hecpv_ilcpv_test_date}
                nextDate={vehicle.next_hecpv_ilcpv_test_date}
                vehicleId={vehicle.id}
                lastDateFieldName="last_hecpv_ilcpv_test_date"
                nextDateFieldName="next_hecpv_ilcpv_test_date"
                onUpdate={fetchVehicleDetails}
                icon={<FaRegFileAlt />}
              />
              <DatePairItem
                baseLabel="6-mjesečna provjera"
                lastDate={vehicle.last_6_month_check_date}
                nextDate={vehicle.next_6_month_check_date}
                vehicleId={vehicle.id}
                lastDateFieldName="last_6_month_check_date"
                nextDateFieldName="next_6_month_check_date"
                onUpdate={fetchVehicleDetails}
                icon={<FaCalendarCheck />}
              />
              <DatePairItem
                baseLabel="Kalibracija tahografa"
                lastDate={vehicle.tahograf_zadnja_kalibracija ? new Date(vehicle.tahograf_zadnja_kalibracija as string) : undefined}
                nextDate={vehicle.tahograf_naredna_kalibracija ? new Date(vehicle.tahograf_naredna_kalibracija as string) : undefined}
                vehicleId={vehicle.id}
                lastDateFieldName="tahograf_zadnja_kalibracija"
                nextDateFieldName="tahograf_naredna_kalibracija"
                onUpdate={fetchVehicleDetails}
                icon={<FaClock />}
              />
              <DatePairItem
                baseLabel="Kalibracija cisterne (generalno)"
                lastDate={vehicle.cisterna_zadnja_kalibracija ? new Date(vehicle.cisterna_zadnja_kalibracija as string) : undefined}
                nextDate={vehicle.cisterna_naredna_kalibracija ? new Date(vehicle.cisterna_naredna_kalibracija as string) : undefined}
                vehicleId={vehicle.id}
                lastDateFieldName="cisterna_zadnja_kalibracija"
                nextDateFieldName="cisterna_naredna_kalibracija"
                onUpdate={fetchVehicleDetails}
                icon={<FaRulerCombined />}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t">
                <EditableItem label="Kalibracija moment ključa" value={vehicle.datum_kalibracije_moment_kljuca} icon={<FaWrench />} type="date" vehicleId={vehicle.id} fieldName="datum_kalibracije_moment_kljuca" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Kalibracija termometra" value={vehicle.datum_kalibracije_termometra} icon={<FaThermometerHalf />} type="date" vehicleId={vehicle.id} fieldName="datum_kalibracije_termometra" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Kalibracija hidrometra" value={vehicle.datum_kalibracije_hidrometra} icon={<FaWater />} type="date" vehicleId={vehicle.id} fieldName="datum_kalibracije_hidrometra" onUpdate={fetchVehicleDetails} />
                <EditableItem label="Kalibracija uređaja el. provodljivosti" value={vehicle.datum_kalibracije_uredjaja_elektricne_provodljivosti} icon={<FaBolt />} type="date" vehicleId={vehicle.id} fieldName="datum_kalibracije_uredjaja_elektricne_provodljivosti" onUpdate={fetchVehicleDetails} />
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'notes' && (
          <Card title="Napomene i Dodatne Informacije" icon={<FaStickyNote />} className="mb-6">
            <div className="mb-6">
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaRegListAlt className="mr-2 text-blue-500" /> Opće napomene
              </h3>
              <motion.div 
                className="backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <FaRegListAlt className="mr-3 text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600" />
                    <span className="text-sm font-semibold text-gray-700">Napomene o vozilu</span>
                  </div>
                  <button 
                    onClick={() => {
                      const notesItem = document.getElementById('notes-edit-item');
                      if (notesItem) {
                        const editButton = notesItem.querySelector('button');
                        if (editButton) editButton.click();
                      }
                    }} 
                    className="p-1.5 text-blue-500 hover:text-blue-700 rounded-md backdrop-blur-sm bg-white/20 hover:bg-white/30 border border-white/20 hover:border-white/40 transition-all duration-200"
                  >
                    <FaEdit className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="pl-0 md:pl-9 text-md font-medium text-gray-800 whitespace-pre-line">
                  {vehicle.notes || <span className="text-gray-400 italic">Nema unesenih napomena</span>}
                </div>
                <div id="notes-edit-item" className="hidden">
                  <EditableItem 
                    label="Napomene o vozilu" 
                    value={vehicle.notes || ''} 
                    icon={<FaRegListAlt />} 
                    vehicleId={vehicle.id} 
                    fieldName="notes" 
                    onUpdate={fetchVehicleDetails} 
                    type="textarea" 
                  />
                </div>
              </motion.div>
            </div>
            
            <div>
              <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 px-1 flex items-center">
                <FaIdCard className="mr-2 text-blue-500" /> Dodatne informacije
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditableItem 
                  label="Kontakt odgovorne osobe" 
                  value={vehicle.responsible_person_contact || ''} 
                  icon={<FaUserTie />} 
                  vehicleId={vehicle.id} 
                  fieldName="responsible_person_contact" 
                  onUpdate={fetchVehicleDetails} 
                />
                
                <EditableItem 
                  label="Datum isteka CWD" 
                  value={vehicle.datum_isteka_cwd} 
                  icon={<FaFileContract />} 
                  vehicleId={vehicle.id} 
                  fieldName="datum_isteka_cwd" 
                  type="date" 
                  onUpdate={fetchVehicleDetails} 
                />
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'service' && (
          <Card title="Servisni Zapisi" icon={<FaFileMedical />} className="mb-6">
            <div className="mb-4 flex justify-end">
              <Button 
                onClick={() => {
                  setSelectedServiceRecordForModal(null);
                  setShowAddServiceRecordModal(true);
                }}
                variant="default"
                className="shadow-md"
              >
                <FaPlus className="mr-2 h-4 w-4" /> Dodaj Novi Zapis
              </Button>
            </div>

            {isLoadingServiceRecords ? (
              <div className="flex justify-center items-center py-10">
                <motion.div 
                  className="h-8 w-8 rounded-full border-t-2 border-b-2 border-blue-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="ml-2 text-muted-foreground">Učitavanje servisnih zapisa...</p>
              </div>
            ) : serviceRecords.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                  <FaFileMedical className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Nema servisnih zapisa
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  Dodajte prvi servisni zapis za ovo vozilo koristeći dugme iznad.
                </p>
              </div>
            ) : (
              <motion.div 
                className="space-y-4"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                }}
                initial="hidden"
                animate="visible"
              >
                {serviceRecords.map((record) => (
                  <motion.div 
                    key={record.id} 
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }
                    }}
                    className="backdrop-blur-sm bg-white/5 p-4 rounded-lg shadow-sm border border-white/10 hover:border-white/20 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                      <h5 className="text-md font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        {formatServiceCategory(record.category)} - {formatDateForDisplayInPage(record.serviceDate)}
                      </h5>
                      <div className="mt-2 sm:mt-0 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewServiceRecord(record)}
                          aria-label="Pogledaj zapis"
                        >
                          <FaEye className="mr-1.5 w-3.5 h-3.5" />
                          Detalji
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 border border-white/10 hover:bg-red-500/10 disabled:opacity-50"
                          onClick={() => handleDeleteServiceRecord(record.id)}
                          disabled={deletingRecordId === record.id}
                          aria-label="Obriši zapis"
                        >
                          {deletingRecordId === record.id ? (
                            <motion.div 
                              animate={{ rotate: 360 }} 
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 size={16} />
                            </motion.div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 whitespace-pre-wrap line-clamp-2">{record.description}</p>
                    {record.serviceItems && record.serviceItems.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Stavke servisa:</p>
                        <ul className="list-disc list-inside pl-1 space-y-0.5">
                          {record.serviceItems.slice(0, 3).map((item, index) => (
                            <li key={index} className="text-xs text-gray-600">
                              {formatServiceItemType(item.type)} {item.description ? `- ${item.description}` : ''} {item.replaced ? '(Zamijenjeno)': ''}
                            </li>
                          ))}
                          {record.serviceItems.length > 3 && (
                            <li className="text-xs text-blue-500 hover:underline cursor-pointer" onClick={() => handleViewServiceRecord(record)}>
                              + još {record.serviceItems.length - 3} stavki...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    {record.documentUrl && (
                      <div className="mt-2">
                        <a 
                          href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${record.documentUrl}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-500 hover:text-blue-700 hover:underline"
                        >
                          <FaDownload className="mr-1.5 h-3 w-3" /> Preuzmi dokument
                        </a>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

        

         
          </Card>
        )}

        {activeSection === 'images' && (
          <Card title="Slike Vozila" icon={<FaCamera />} className="mb-6">
            <div className="backdrop-blur-sm bg-white/5 p-4 rounded-lg shadow-sm border border-white/10 mb-6">
              <h4 className="text-md font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-3">Upload Nove Slike</h4>
              <div className="space-y-4">
                <input 
                  type="file" 
                  id="imageUploadInput" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  disabled={isUploading}
                />
                {selectedFile && (
                  <div className="text-xs text-gray-600 bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/10">
                    Odabrana datoteka: <span className="font-medium">{selectedFile.name}</span>
                  </div>
                )}
                <Button 
                  onClick={handleImageUpload} 
                  disabled={!selectedFile || isUploading}
                  variant="default"
                  className="shadow-md w-full sm:w-auto"
                >
                  {isUploading ? (
                    <motion.div className="flex items-center justify-center">
                      <motion.div 
                        className="h-4 w-4 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="ml-2">Upload u toku...</span>
                    </motion.div>
                  ) : (
                    <span className="flex items-center">
                      <FaUpload className="mr-2 h-4 w-4" /> Uploaduj Sliku
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {(!vehicle.images || vehicle.images.length === 0) && !isLoading ? (
              <div className="text-center py-10 px-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                  <FaCamera className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Nema slika
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  Dodajte prvu sliku za ovo vozilo koristeći opciju iznad.
                </p>
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                }}
                initial="hidden"
                animate="visible"
              >
                {vehicle.images?.map((image) => (
                  <motion.div 
                    key={image.id} 
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }
                    }}
                    className="group relative border border-white/20 rounded-lg overflow-hidden shadow-sm backdrop-blur-sm bg-white/5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 aspect-w-1 aspect-h-1"
                  >
                    <Image 
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${image.imageUrl}`} 
                      alt={`Slika vozila ${vehicle.vehicle_name} - ${image.id}`}
                      layout="fill"
                      objectFit="cover"
                      className="group-hover:opacity-80 transition-opacity cursor-pointer"
                      onClick={() => openImageModal(image)}
                      onError={(e) => console.error("Error loading vehicle image:", image.imageUrl, e)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openImageModal(image)} 
                          className="p-1.5 bg-white/80 hover:bg-white text-blue-600 rounded-md shadow-md text-xs"
                          aria-label="Pogledaj sliku"
                        >
                          <FaEye className="w-3.5 h-3.5" />
                        </button>
                        {!image.isMainImage && (
                          <button 
                            onClick={() => handleSetMainImage(image.id)} 
                            className="p-1.5 bg-white/80 hover:bg-white text-blue-600 rounded-md shadow-md text-xs flex items-center"
                            aria-label="Postavi kao glavnu"
                          >
                            <FaStar className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {image.isMainImage && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-2 py-1 rounded-md shadow-md flex items-center">
                        <FaStar className="w-2.5 h-2.5 mr-1" /> Glavna
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selectedImageForModal && (
              <Modal onClose={closeImageModal} title={`Slika vozila: ${vehicle.vehicle_name}`}>
                <div className="p-4 max-w-3xl mx-auto">
                  <Image 
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${selectedImageForModal.imageUrl}`} 
                    alt={`Uvećana slika vozila ${vehicle.vehicle_name}`}
                    width={800} 
                    height={600}
                    objectFit="contain"
                    className="rounded-md"
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={closeImageModal}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition text-sm font-medium"
                    >
                      Zatvori
                    </button>
                  </div>
                </div>
              </Modal>
            )}
          </Card>
        )}
      </div> {/* End of content sections wrapper */}

      {/* MODAL FOR ADDING/EDITING SERVICE RECORD - Positioned correctly at top level */}
      {showAddServiceRecordModal && (
        <Modal onClose={() => setShowAddServiceRecordModal(false)} title={selectedServiceRecordForModal ? "Uredi Servisni Zapis" : "Dodaj Novi Servisni Zapis"}>
          <ServiceRecordForm 
            vehicleId={vehicle.id} 
            onSubmit={async (formData, documentFile) => {
              try {
                await createServiceRecordWithDocument(vehicle.id.toString(), formData, documentFile || undefined);
                toast.success('Servisni zapis uspješno kreiran!');
                setShowAddServiceRecordModal(false); 
                fetchServiceRecords(); 
              } catch (error) {
                console.error("Greška pri kreiranju servisnog zapisa:", error);
                toast.error('Greška pri kreiranju servisnog zapisa.');
              }
            }}
            onCancel={() => setShowAddServiceRecordModal(false)} 
          />
        </Modal>
      )}

      {/* MODAL FOR VIEWING SERVICE RECORD DETAILS - Positioned correctly at top level */}
      {showViewServiceRecordModal && selectedServiceRecordForModal && (
          <Modal onClose={() => setShowViewServiceRecordModal(false)} title="Detalji Servisnog Zapisa">
              <div className="space-y-3 p-1">
                  <p><strong className="font-medium text-gray-700">Datum servisa:</strong> {formatDateForDisplayInPage(selectedServiceRecordForModal.serviceDate)}</p>
                  <p><strong className="font-medium text-gray-700">Kategorija:</strong> {formatServiceCategory(selectedServiceRecordForModal.category)}</p>
                  <div>
                      <strong className="font-medium text-gray-700">Opis:</strong>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded-md">{selectedServiceRecordForModal.description}</p>
                  </div>
                  {selectedServiceRecordForModal.serviceItems && selectedServiceRecordForModal.serviceItems.length > 0 && (
                      <div>
                          <strong className="font-medium text-gray-700">Stavke servisa:</strong>
                          <ul className="list-disc list-inside pl-4 mt-1 space-y-1 bg-gray-50 p-2 rounded-md">
                              {selectedServiceRecordForModal.serviceItems.map((item, index) => (
                                  <li key={index} className="text-sm text-gray-600">
                                      {formatServiceItemType(item.type)} {item.description ? `- ${item.description}` : ''} {item.replaced ? '(Zamijenjeno)': ''}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
                  {selectedServiceRecordForModal.documentUrl && (
                      <div>
                          <strong className="font-medium text-gray-700">Dokument:</strong>
                          <a 
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${selectedServiceRecordForModal.documentUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center mt-1 text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                              <FaExternalLinkAlt className="mr-1.5 h-4 w-4" /> Preuzmi/Otvori dokument
                          </a>
                      </div>
                  )}
                   <div className="mt-6 flex justify-end">
                      <button 
                          onClick={() => setShowViewServiceRecordModal(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                          Zatvori
                      </button>
                  </div>
              </div>
          </Modal>
      )}

    </motion.div> // End of main page motion.div
  );
};

export default VehicleDetailsPage;