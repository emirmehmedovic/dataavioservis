"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FuelIntakeRecord,
  FuelIntakeFilters,
  FuelType,
} from '@/types/fuel';
import { fetchWithAuth } from '@/lib/apiService';
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import FuelIntakeRecordDetailsModal, { FuelIntakeRecordWithDetails } from './FuelIntakeRecordDetailsModal';

interface FuelDocument {
  id: number;
  document_name: string;
  mime_type: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('bs-BA', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

export default function FuelIntakeDisplay() {
  const router = useRouter();
  const [records, setRecords] = useState<FuelIntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<FuelIntakeFilters>>({
    fuel_type: 'all',
    startDate: '',
    endDate: '',
  });

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<FuelIntakeRecordWithDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: Record<string, string> = {};
      if (filters.fuel_type && filters.fuel_type !== 'all') {
        activeFilters.fuel_type = filters.fuel_type;
      }
      if (filters.startDate) activeFilters.startDate = filters.startDate;
      if (filters.endDate) activeFilters.endDate = filters.endDate;
      // Add other filters if they are implemented, e.g. supplier_name, delivery_vehicle_plate

      const queryParams = new URLSearchParams(activeFilters).toString();
      const url = queryParams ? `${API_URL}/api/fuel/intake-records?${queryParams}` : `${API_URL}/api/fuel/intake-records`;

      const data = await fetchWithAuth<FuelIntakeRecord[]>(
        url,
        { method: 'GET' }
      );
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Greška pri učitavanju zapisa o prijemu goriva.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterChange = (filterName: keyof FuelIntakeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const handleOpenDetailsModal = async (recordId: number) => {
    setLoadingDetails(true);
    setError(null);
    try {
      const detailedRecordData = await fetchWithAuth<FuelIntakeRecordWithDetails>(
        `${API_URL}/api/fuel/intake-records/${recordId}`,
        { method: 'GET' }
      );
      setSelectedRecordForDetails(detailedRecordData);
      setIsDetailsModalOpen(true);
    } catch (err: any) {
      console.error("Error fetching details with fetchWithAuth:", err);
      setError(err.message || 'Greška pri učitavanju detalja zapisa.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRecordForDetails(null);
  };

  const handleDownloadDocument = async (docToDownload: FuelDocument) => {
    if (!docToDownload || !docToDownload.id) {
      console.error('Document ID is missing, cannot download.');
      setError('Greška: ID dokumenta nedostaje.');
      return;
    }

    setLoadingDetails(true); 
    setError(null);

    try {
      const response: Response = await fetchWithAuth(
        `${API_URL}/api/fuel/documents/${docToDownload.id}/download`,
        { method: 'GET', returnRawResponse: true }
      );

      if (!response.ok) {
        let errorMsg = `Greška pri preuzimanju dokumenta: ${response.statusText}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (e) {
            // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = docToDownload.document_name || `document-${docToDownload.id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error("Error downloading document with fetchWithAuth:", err);
      setError(err.message || 'Greška pri preuzimanju dokumenta.');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (error) {
    return <p className="text-red-500 p-4">Greška: {error}</p>;
  }

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
                <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 10C20 10 18 14 12 14C6 14 4 10 4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Evidencija Ulaska Goriva
            </h2>
            <p className="text-sm opacity-80 mt-1">Pregled i upravljanje zapisima o ulazu goriva</p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/fuel/intakes/new')} 
            className="mt-4 sm:mt-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur-sm border border-white/20 transition-colors flex items-center font-medium shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Novi Zapis o Ulazu
          </Button>
        </div>
        
        {/* Filter Section */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-white mb-1">Datum od:</label>
              <Input 
                type="date" 
                id="startDate"
                value={filters.startDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('startDate', e.target.value)}
                className="w-full sm:w-auto bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white focus:ring-white"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-white mb-1">Datum do:</label>
              <Input 
                type="date" 
                id="endDate"
                value={filters.endDate || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('endDate', e.target.value)}
                className="w-full sm:w-auto bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white focus:ring-white"
              />
            </div>
            <div>
              <label htmlFor="fuelTypeFilter" className="block text-sm font-medium text-white mb-1">Tip Goriva:</label>
              <Select 
                value={filters.fuel_type || 'all'} 
                onValueChange={(value: string) => handleFilterChange('fuel_type', value)}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-white/20 border-white/30 text-white" id="fuelTypeFilter">
                  <SelectValue placeholder="Svi tipovi goriva" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi Tipovi Goriva</SelectItem>
                  {Object.values(FuelType).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-opacity-50 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-6 text-indigo-700 font-medium">Učitavanje zapisa o ulazu goriva...</p>
            </div>
          </div>
        )}

        {!loading && records.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nema zapisa</h3>
            <p className="mt-1 text-sm text-gray-500">Nema zapisa koji odgovaraju zadatim filterima ili nema unesenih zapisa.</p>
          </div>
        )}

        {!loading && records.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableCaption>Lista svih zapisa o ulazu goriva.</TableCaption>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Datum</TableHead>
                  <TableHead className="font-semibold">Dost. Cisterna</TableHead>
                  <TableHead className="text-right font-semibold">Količina (L)</TableHead>
                  <TableHead className="text-right font-semibold">Količina (KG)</TableHead>
                  <TableHead className="text-right font-semibold">Gustoća</TableHead>
                  <TableHead className="font-semibold">Tip Goriva</TableHead>
                  <TableHead className="font-semibold">Carinski Br.</TableHead>
                  <TableHead className="text-center font-semibold">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record, index) => (
                  <TableRow 
                    key={record.id} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <TableCell>{formatDate(record.intake_datetime)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 8H21L19 16H5L3 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 8V6C7 4.89543 7.89543 4 9 4H15C16.1046 4 17 4.89543 17 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="7" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="17" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {record.delivery_vehicle_plate}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{record.quantity_liters_received.toLocaleString()} L</TableCell>
                    <TableCell className="text-right">{record.quantity_kg_received.toLocaleString()} kg</TableCell>
                    <TableCell className="text-right">{record.specific_gravity.toFixed(4)}</TableCell>
                    <TableCell>
                      {record.fuel_type?.toLowerCase() === 'jet a-1'.toLowerCase() ? (
                        <div className="flex items-center">
                          <img 
                            src="/JET A-1.svg" 
                            alt="JET A-1" 
                            className="w-10 h-10 object-contain" 
                          />
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {record.fuel_type}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.customs_declaration_number ? (
                        <span className="text-gray-900">{record.customs_declaration_number}</span>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDetailsModal(record.id)} 
                          className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                          disabled={loadingDetails}
                        >
                          {loadingDetails && selectedRecordForDetails?.id === record.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mr-2"></div>
                              Učitavam...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Detalji
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => router.push(`/dashboard/fuel/intakes/edit/${record.id}`)} 
                          disabled={loadingDetails}
                          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H18C18.5523 20 19 19.5523 19 19V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Uredi
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      
        <FuelIntakeRecordDetailsModal 
          isOpen={isDetailsModalOpen}
          record={selectedRecordForDetails}
          onClose={handleCloseDetailsModal}
          onDownloadDocument={handleDownloadDocument}
        />
      </div>
    </div>
  );
} 