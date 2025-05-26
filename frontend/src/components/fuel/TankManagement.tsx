import React, { useState, useEffect } from 'react';
import { PlusIcon, ArrowUpCircleIcon, PencilIcon, TrashIcon, EyeIcon, ExclamationCircleIcon, TruckIcon, BeakerIcon, MapPinIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import TankRefillForm from './TankRefillForm';
import { fetchWithAuth, uploadTankImage, getTotalFuelSummary } from '@/lib/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import TankFormWithImageUpload from './TankFormWithImageUpload';
import TankImageDisplay from './TankImageDisplay';

interface FuelTank {
  id: number;
  identifier: string;
  name: string;
  location: string;
  location_description?: string;
  capacity_liters: number;
  current_liters: number;
  current_quantity_liters?: number; // Added for compatibility
  fuel_type: string;
  last_refill_date?: string;
  last_maintenance_date?: string;
  image_url?: string; // URL to the tank image
}

export default function TankManagement() {
  const [tanks, setTanks] = useState<FuelTank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [currentTank, setCurrentTank] = useState<FuelTank | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fuel summary state
  const [fuelSummary, setFuelSummary] = useState<{
    fixedTanksTotal: number;
    mobileTanksTotal: number;
    grandTotal: number;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    identifier: '',
    name: '',
    location: '',
    capacity_liters: '',
    current_liters: '',
    fuel_type: 'Jet A-1'
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTanks();
    fetchFuelSummary();
  }, []);

  const fetchTanks = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth<FuelTank[]>('/api/fuel/tanks');
      setTanks(data);
    } catch (error) {
      console.error('Error fetching tanks:', error);
      toast.error('Greška pri učitavanju tankera');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch fuel summary data
  const fetchFuelSummary = async () => {
    try {
      setSummaryLoading(true);
      const summaryData = await getTotalFuelSummary();
      setFuelSummary(summaryData);
    } catch (error) {
      console.error('Error fetching fuel summary:', error);
      toast.error('Greška pri učitavanju ukupnog stanja goriva');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleImageUploaded = async (imageUrl: string) => {
    setImagePreview(imageUrl);
    // Refresh the tanks data to get the updated image URL
    await fetchTanks();
  };
  
  // Use the imported uploadTankImage function from apiService
  const handleTankImageUpload = async (tankId: number, file: File): Promise<string> => {
    try {
      const response = await uploadTankImage(tankId, file);
      return response.image_url;
    } catch (error) {
      console.error('Error uploading tank image:', error);
      throw error;
    }
  };

  const resetForm = () => {
    setFormData({
      identifier: '',
      name: '',
      location: '',
      capacity_liters: '',
      current_liters: '',
      fuel_type: 'Jet A-1'
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleAddTank = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Pretvaranje string vrijednosti u brojeve za API poziv
      const dataToSubmit = {
        ...formData,
        capacity_liters: parseFloat(formData.capacity_liters) || 0,
        current_liters: parseFloat(formData.current_liters) || 0
      };
      
      const newTank = await fetchWithAuth<FuelTank>('/api/fuel/tanks', {
        method: 'POST',
        body: JSON.stringify(dataToSubmit),
      });
      
      // Image upload is handled by TankFormWithImageUpload component
      if (newTank.id) {
        try {
          // Image already uploaded by the TankFormWithImageUpload component
        } catch (imageError) {
          console.error('Error uploading tank image:', imageError);
          toast.error('Tank je dodan, ali slika nije uspješno uploadana');
        }
      }
      
      toast.success('Tanker uspješno dodan');
      fetchTanks();
      fetchFuelSummary(); // Refresh fuel summary after adding a tank
      setShowAddModal(false);
      resetForm();
      fetchTanks();
    } catch (error) {
      console.error('Error adding tank:', error);
      toast.error('Greška pri dodavanju tankera');
    }
  };

  const handleEditTank = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTank) return;
    
    try {
      // Pretvaranje string vrijednosti u brojeve za API poziv
      const dataToSubmit = {
        ...formData,
        capacity_liters: parseFloat(formData.capacity_liters) || 0,
        current_liters: parseFloat(formData.current_liters) || 0
      };
      
      await fetchWithAuth<FuelTank>(`/api/fuel/tanks/${currentTank.id}`, {
        method: 'PUT',
        body: JSON.stringify(dataToSubmit),
      });
      
      // Image upload is handled by TankFormWithImageUpload component
      
      toast.success('Tanker uspješno ažuriran');
      fetchTanks();
      fetchFuelSummary(); // Refresh fuel summary after updating a tank
      setShowEditModal(false);
      resetForm();
      fetchTanks();
    } catch (error) {
      console.error('Error updating tank:', error);
      toast.error('Greška pri ažuriranju tankera');
    }
  };

  const handleDeleteTank = async (id: number) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj tanker?')) return;
    
    try {
      await fetchWithAuth<{ message: string }>(`/api/fuel/tanks/${id}`, {
        method: 'DELETE',
      });
      
      toast.success('Tanker uspješno obrisan');
      fetchTanks();
      fetchFuelSummary(); // Refresh fuel summary after deleting a tank
    } catch (error) {
      console.error('Error deleting tank:', error);
      toast.error('Greška pri brisanju tankera');
    }
  };

  const openEditModal = (tank: FuelTank) => {
    setCurrentTank(tank);
    setFormData({
      identifier: tank.identifier || '',
      name: tank.name || '',
      location: tank.location || '',
      capacity_liters: tank.capacity_liters?.toString() || '0',
      current_liters: (tank.current_liters || tank.current_quantity_liters || 0).toString(),
      fuel_type: tank.fuel_type || 'Jet A-1'
    });
    
    // Set image preview if tank has an image
    if (tank.image_url) {
      setImagePreview(tank.image_url);
    } else {
      setImagePreview(null);
    }
    
    setSelectedImage(null);
    setShowEditModal(true);
  };

  const openRefillModal = (tank: FuelTank) => {
    setCurrentTank(tank);
    setShowRefillModal(true);
  };
  
  // Calculate fill percentage
  const calculateFillPercentage = (current: number, capacity: number) => {
    return Math.min(Math.round((current / capacity) * 100), 100);
  };
  
  // Get status indicator based on fill percentage
  const getStatusIndicator = (percentage: number) => {
    if (percentage < 15) return { label: 'Nizak nivo', color: 'bg-red-500', textColor: 'text-red-800', bgColor: 'bg-red-50' };
    if (percentage < 30) return { label: 'Nizak nivo', color: 'bg-orange-500', textColor: 'text-orange-800', bgColor: 'bg-orange-50' };
    if (percentage < 50) return { label: 'Srednje', color: 'bg-yellow-500', textColor: 'text-yellow-800', bgColor: 'bg-yellow-50' };
    if (percentage < 80) return { label: 'Dobro', color: 'bg-blue-500', textColor: 'text-blue-800', bgColor: 'bg-blue-50' };
    return { label: 'Puno', color: 'bg-green-500', textColor: 'text-green-800', bgColor: 'bg-green-50' };
  };

  // Filter tanks based on search term
  const filteredTanks = tanks.filter(tank => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tank.name.toLowerCase().includes(searchLower) ||
      tank.identifier.toLowerCase().includes(searchLower) ||
      tank.location.toLowerCase().includes(searchLower) ||
      tank.fuel_type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upravljanje Tankerima</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Dodaj Novi Tank
        </button>
      </div>
      
      {/* Fuel Summary Component */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <BeakerIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Ukupno Stanje Goriva
            <button 
              onClick={fetchFuelSummary} 
              className="ml-2 text-indigo-600 hover:text-indigo-800"
              disabled={summaryLoading}
              title="Osvježi podatke"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {summaryLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
          ) : fuelSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-500">Fiksni Tankovi</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {fuelSummary.fixedTanksTotal.toLocaleString('bs-BA')} L
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-500">Mobilni Tankovi</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {fuelSummary.mobileTanksTotal.toLocaleString('bs-BA')} L
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-500">Ukupno</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {fuelSummary.grandTotal.toLocaleString('bs-BA')} L
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              Nije moguće učitati podatke o ukupnom stanju goriva.
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#B3001F] border-opacity-50 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-[#800014] rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-[#E60026] font-medium">Učitavanje podataka o cisternama...</p>
          </div>
        </div>
      ) : tanks.length === 0 ? (
        <div className="p-8 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className="mx-auto w-20 h-20 bg-[#E60026] rounded-full flex items-center justify-center mb-5 shadow-inner">
              <ExclamationCircleIcon className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nema unesenih cisterni</h3>
            <p className="text-gray-500 mb-6">Trenutno nema dostupnih podataka o avio cisternama. Dodajte prvu cisternu da započnete.</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-[#E60026] to-[#800014] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E60026] transition-colors"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
              Dodaj Prvu Cisternu
            </button>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTanks.map((tank, index) => {
              // Use current_quantity_liters if available (for compatibility), otherwise use current_liters
              const currentAmount = tank.current_quantity_liters !== undefined ? tank.current_quantity_liters : tank.current_liters;
              const fillPercentage = calculateFillPercentage(currentAmount, tank.capacity_liters);
              const status = getStatusIndicator(fillPercentage);
              const locationText = tank.location_description || tank.location;
              
              return (
                <motion.div
                  key={tank.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 relative group"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex-1 bg-white rounded-t-lg p-4 relative overflow-hidden">
                      <div className="w-full h-48 mb-2">
                        {tank.image_url ? (
                          <TankImageDisplay 
                            imageUrl={tank.image_url} 
                            tankName={tank.name} 
                            height="h-48"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <TruckIcon className="h-20 w-20 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between mt-2">
                        <div className="flex justify-between">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tank.name || 'Cisterna'}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ID: {tank.identifier}
                          </span>
                        </div>
                        <div className="text-right mt-2">
                          <span className="text-sm font-bold">{fillPercentage}%</span>
                          <span className="text-xs text-gray-500 ml-1">popunjenost</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fuel gauge visualization */}
                    <div className="p-4 pt-0">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ease-out ${status.color}`}
                          style={{ width: `${fillPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Tank details in a grid */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-gray-50 p-3 rounded-lg">
                         <p className="text-xs text-gray-500 mb-0">Tip Goriva</p>
                         <div className="flex items-start pt-0">
                          {tank.fuel_type.toLowerCase() === 'jet a-1'.toLowerCase() ? (
                            <img 
                              src="/JET A-1.svg" 
                              alt="JET A-1" 
                              className="w-14 h-14 object-contain" 
                            />
                          ) : (
                            <>
                              <span className="w-3 h-3 rounded-full bg-[#E60026] mr-2"></span>
                              <p className="font-medium text-gray-900">{tank.fuel_type}</p>
                            </>
                          )}
                        </div>
                       </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Kapacitet</p>
                        <p className="font-medium text-gray-900">{tank.capacity_liters.toLocaleString()} L</p>
                      </div>

                      
                      <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Trenutna Količina</p>
                        <p className="font-medium text-gray-900 text-lg">
                          {currentAmount.toLocaleString()} L
                          <span className="text-xs text-gray-500 ml-2">od {tank.capacity_liters.toLocaleString()} L</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-5 flex space-x-2">
                      <button
                        onClick={() => openRefillModal(tank)}
                        className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#E60026] to-[#800014] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E60026] transition-colors shadow-sm"
                      >
                        <ArrowUpCircleIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Dopuni
                      </button>
                      
                      <button
                        onClick={() => openEditModal(tank)}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E60026] transition-colors shadow-sm"
                      >
                        <PencilIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                        Uredi
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTank(tank.id)}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                      >
                        <TrashIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                        Obriši
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Tank Modal */}
      {showAddModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Dodaj Novi Tank</h3>
                <TankFormWithImageUpload
                  formData={formData}
                  onSubmit={handleAddTank}
                  onCancel={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  handleInputChange={handleInputChange}
                  onImageUploaded={handleImageUploaded}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tank Modal */}
      {showEditModal && currentTank && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Uredi Tank</h3>
                <TankFormWithImageUpload
                  isEdit={true}
                  tankId={currentTank.id}
                  existingImageUrl={currentTank.image_url}
                  formData={formData}
                  onSubmit={handleEditTank}
                  onCancel={() => setShowEditModal(false)}
                  handleInputChange={handleInputChange}
                  onImageUploaded={handleImageUploaded}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refill Tank Modal */}
      {showRefillModal && currentTank && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <TankRefillForm 
                tankId={currentTank.id} 
                onSuccess={() => {
                  setShowRefillModal(false);
                  fetchTanks();
                  fetchFuelSummary(); // Refresh fuel summary after refill
                }}
                onCancel={() => setShowRefillModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 