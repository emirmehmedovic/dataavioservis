'use client';

import React, { useState } from 'react';
import { ServiceRecord } from '@/types';
import { FaEye, FaTrash, FaPlus, FaFileMedical } from 'react-icons/fa';
import { formatServiceCategory, formatDateForDisplay } from './serviceHelpers';
import Card from './Card';
import { toast } from 'react-toastify';
import { deleteServiceRecord } from '@/lib/apiService';
import { Loader2 } from 'lucide-react';

interface ServiceRecordsSectionProps {
  vehicleId: number;
  serviceRecords: ServiceRecord[];
  isLoading: boolean;
  onViewRecord: (record: ServiceRecord) => void;
  onAddRecord: () => void;
  onRecordDeleted: () => void;
}

const ServiceRecordsSection: React.FC<ServiceRecordsSectionProps> = ({
  vehicleId,
  serviceRecords,
  isLoading,
  onViewRecord,
  onAddRecord,
  onRecordDeleted
}) => {
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);

  const handleDeleteServiceRecord = async (recordId: number) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj servisni zapis?')) {
      return;
    }
    
    setDeletingRecordId(recordId);
    try {
      await deleteServiceRecord(vehicleId.toString(), recordId.toString());
      toast.success('Servisni zapis uspješno obrisan!');
      onRecordDeleted();
    } catch (error) {
      console.error("Greška pri brisanju servisnog zapisa:", error);
      toast.error('Greška pri brisanju servisnog zapisa.');
    } finally {
      setDeletingRecordId(null);
    }
  };

  return (
    <Card title="Servisni zapisi" icon={<FaFileMedical />} className="mb-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">Historija servisa</h3>
        <button
          onClick={onAddRecord}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md bg-[#F08080]/30 border border-white/20 rounded-xl hover:bg-[#F08080]/40 transition-colors shadow-lg"
        >
          <FaPlus className="mr-1.5" /> Dodaj servis
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : serviceRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nema servisnih zapisa za ovo vozilo.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategorija</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dokument</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serviceRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateForDisplay(record.serviceDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatServiceCategory(record.category)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {record.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.documentUrl ? (
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${record.documentUrl}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Preuzmi
                      </a>
                    ) : (
                      <span className="text-gray-400">Nema</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewRecord(record)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      aria-label="Pregledaj servisni zapis"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleDeleteServiceRecord(record.id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label="Obriši servisni zapis"
                      disabled={deletingRecordId === record.id}
                    >
                      {deletingRecordId === record.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default ServiceRecordsSection;
