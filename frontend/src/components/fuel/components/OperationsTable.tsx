import React from 'react';
import { FuelingOperation } from '../types';
import { formatDate } from '../utils/helpers';
import { TrashIcon } from '@heroicons/react/24/outline';

interface OperationsTableProps {
  operations: FuelingOperation[];
  handleRowClick: (operation: FuelingOperation) => void;
  handleDeleteOperation?: (operation: FuelingOperation, e: React.MouseEvent) => void;
}

const OperationsTable: React.FC<OperationsTableProps> = ({ operations, handleRowClick, handleDeleteOperation }) => {
  return (
    <div className="relative border border-gray-200 rounded-lg">
      {/* Custom scrollbar styling */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
          background-color: #f5f5f5;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #888;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #555;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: #f1f1f1;
          border-radius: 5px;
        }
      `}</style>
      <div className="overflow-x-auto custom-scrollbar pb-4" style={{ 
        maxWidth: '100%',
        overflowX: 'scroll',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'auto',
        scrollbarColor: '#888 #f1f1f1'
      }}>
        <table className="w-full divide-y divide-gray-300" style={{ minWidth: '1500px' }}>
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Datum i Vrijeme</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Registracija</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Avio Kompanija</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Destinacija</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Tip goriva</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Količina (L)</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Gustoća</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Količina (kg)</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Cijena/kg</th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Rabat (%)</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Valuta</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Avio cisterna</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Broj dostavnice</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tip saobraćaja</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Operater</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Akcije</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {operations.map((operation, index) => (
            <tr 
              key={operation.id} 
              onClick={() => handleRowClick(operation)} 
              className={index % 2 === 0 ? 'bg-white hover:bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'} 
              style={{cursor: 'pointer'}}
            >
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(operation.dateTime)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19L13 4.00001L20 14.5L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 4L9.04401 13.1224C9.01443 13.1921 9.01443 13.2685 9.04401 13.3382L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 19L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {operation.aircraft_registration || 'N/A (Sistemska letjelica)'}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{operation.airline.name}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{operation.destination}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                {operation.tank?.fuel_type?.toLowerCase() === 'jet a-1'.toLowerCase() ? (
                  <div className="flex justify-center">
                    <img 
                      src="/JET A-1.svg" 
                      alt="JET A-1" 
                      className="w-10 h-10 object-contain" 
                    />
                  </div>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {operation.tank?.fuel_type || 'N/A'}
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 text-right">
                {(operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} L
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 text-right">
                {(operation.specific_density || 0).toLocaleString('hr-HR', { minimumFractionDigits: 3 })}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 text-right">
                {(operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} kg
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 text-right">
                {(operation.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 5 })}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 text-right">
                {operation.discount_percentage ? (
                  <span className="text-indigo-600">{operation.discount_percentage}%</span>
                ) : (
                  <span className="text-gray-400">0%</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900 text-center">
                {operation.currency || 'BAM'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 8H21L19 16H5L3 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 8V6C7 4.89543 7.89543 4 9 4H15C16.1046 4 17 4.89543 17 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="17" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {operation.tank?.identifier || 'N/A'} - {operation.tank?.name || 'N/A'}
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {operation.delivery_note_number ? (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 3V9H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {operation.delivery_note_number}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">N/A</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {operation.tip_saobracaja ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {operation.tip_saobracaja}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">N/A</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{operation.operator_name}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                {handleDeleteOperation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click
                      handleDeleteOperation(operation, e);
                    }}
                    className="p-1.5 bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors inline-flex items-center justify-center"
                    title="Obriši operaciju točenja"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default OperationsTable;
