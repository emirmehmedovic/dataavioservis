import React from 'react';
import { FuelingOperation } from '../types';
import { formatDate, API_BASE_URL, generatePDFInvoice } from '../utils/helpers';
import { generateXMLInvoice, downloadXML } from '../utils/xmlInvoice';
import { generateDomesticPDFInvoice } from '../utils/domesticInvoice';
import { downloadDocument } from '@/lib/apiService';
import { toast } from 'react-hot-toast';

interface OperationDetailsModalProps {
  operation: FuelingOperation;
  onClose: () => void;
}

const OperationDetailsModal: React.FC<OperationDetailsModalProps> = ({ operation, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0">
        {/* Header with black glassmorphism effect */}
        <div className="p-6 text-white relative overflow-hidden">
          {/* Black glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 z-0"></div>
          {/* Glass highlight effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-0"></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="flex flex-col space-y-1">
              <h2 className="text-2xl font-bold flex items-center">
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 20V4M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 14C20 14 18 10 12 10C6 10 4 14 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Detalji Operacije Točenja
              </h2>
              <p className="text-sm opacity-80">
                Pregled informacija o operaciji točenja goriva
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-md text-xs font-medium backdrop-blur-sm">ID: {operation.id}</span>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Osnovni Podaci */}
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center text-gray-800">
                <svg className="w-5 h-5 mr-2 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V9.41421C21 9.149 20.8946 8.89464 20.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Osnovni Podaci
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Datum i Vrijeme:</span>
                  <span className="font-medium text-gray-900">{formatDate(operation.dateTime)}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Registracija Aviona:</span>
                  <span className="font-medium text-gray-900">{operation.aircraft_registration || 'N/A (Sistemska letjelica)'}</span>
                </div>
                {operation.aircraft && (
                  <div className="flex items-start">
                    <span className="text-gray-500 w-40 flex-shrink-0">Sistemska Letjelica:</span>
                    <span className="font-medium text-gray-900">{operation.aircraft.vehicle_name} ({operation.aircraft.license_plate})</span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Avio Kompanija:</span>
                  <span className="font-medium text-gray-900">{operation.airline.name}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Destinacija:</span>
                  <span className="font-medium text-gray-900">{operation.destination}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Tip Goriva:</span>
                  <span className="font-medium text-gray-900 flex items-center">
                    {operation.tank?.fuel_type?.toLowerCase() === 'jet a-1'.toLowerCase() ? (
                      <>
                        <img 
                          src="/JET A-1.svg" 
                          alt="JET A-1" 
                          className="w-12 h-12 object-contain mr-2" 
                        />
                        JET A-1
                      </>
                    ) : (
                      operation.tank?.fuel_type || 'N/A'
                    )}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Broj Leta:</span>
                  <span className="font-medium text-gray-900">{operation.flight_number || 'N/A'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Količina (L):</span>
                  <span className="font-medium text-gray-900">{(operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} L</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Gustoća:</span>
                  <span className="font-medium text-gray-900">{(operation.specific_density || 0).toLocaleString('hr-HR', { minimumFractionDigits: 3 })}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Količina (kg):</span>
                  <span className="font-medium text-gray-900">{(operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} kg</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Cijena po kg:</span>
                  <span className="font-medium text-gray-900">{(operation.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} {operation.currency || 'BAM'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Ukupan iznos:</span>
                  <span className="font-medium text-gray-900">{(operation.total_amount || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} {operation.currency || 'BAM'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Avio Cisterna:</span>
                  <span className="font-medium text-gray-900">{operation.tank?.identifier || 'N/A'} - {operation.tank?.name || 'N/A'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Tip Saobraćaja:</span>
                  {operation.tip_saobracaja ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {operation.tip_saobracaja}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-40 flex-shrink-0">Operater:</span>
                  <span className="font-medium text-gray-900">{operation.operator_name}</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* Napomene */}
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center text-gray-800">
                <svg className="w-5 h-5 mr-2 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15M9 16H15M9 8H15M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Napomene
              </h3>
            </div>
            <div className="p-4">
              {operation.notes ? (
                <p className="text-gray-700">{operation.notes}</p>
              ) : (
                <p className="text-gray-500 italic">Nema napomena za ovu operaciju.</p>
              )}
            </div>
          </section>
          
          {/* Priloženi Dokument */}
          {operation.documents && operation.documents.length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center text-gray-800">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="rgba(99, 102, 241, 0.1)"/>
                    <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Priloženi Dokumenti ({operation.documents?.length || 0})
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {operation.documents?.map((doc) => (
                    <div key={doc.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center">
                          <svg className="w-8 h-8 text-indigo-500 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="rgba(99, 102, 241, 0.1)"/>
                            <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate" title={doc.originalFilename}>
                              {doc.originalFilename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(doc.sizeBytes / (1024*1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button 
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
                          className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors rounded-md flex items-center justify-center shadow-sm self-center sm:self-end" 
                          title="Preuzmi dokument"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 10V17M12 17L9 14M12 17L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M17 17V19C17 20.1046 16.1046 21 15 21H9C7.89543 21 7 20.1046 7 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 3V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer with document generation options */}
        <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generisanje Dokumenata
            </h3>
            <p className="text-xs text-gray-500">Izaberite tip dokumenta koji želite generisati za ovu operaciju točenja</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Export PDF Invoice Card */}
            <button
              type="button"
              onClick={() => generatePDFInvoice(operation)}
              className="group relative bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left flex flex-col h-full"
              title="Standardna faktura za izvoz"
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">PDF Faktura</h4>
                  <p className="text-xs text-gray-500">Za izvoz</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2 flex-grow">Standardna faktura bez PDV-a za izvozne operacije točenja goriva</p>
              <div className="flex justify-end">
                <span className="inline-flex items-center text-xs font-medium text-green-600 group-hover:text-green-700">
                  Generiši
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </button>

            {/* Domestic PDF Invoice Card */}
            <button
              type="button"
              onClick={() => generateDomesticPDFInvoice(operation)}
              className="group relative bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left flex flex-col h-full"
              title="Faktura za unutarnji saobraćaj sa PDV-om"
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15V9" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12h-6" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Domaća Faktura</h4>
                  <p className="text-xs text-gray-500">Sa PDV-om</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2 flex-grow">Faktura sa obračunatim PDV-om za unutarnji saobraćaj</p>
              <div className="flex justify-end">
                <span className="inline-flex items-center text-xs font-medium text-purple-600 group-hover:text-purple-700">
                  Generiši
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
            </button>

            {/* XML Invoice Card */}
            <button
              type="button"
              onClick={() => {
                const xmlContent = generateXMLInvoice(operation);
                downloadXML(xmlContent, `Faktura-XML-${operation.id}.xml`);
              }}
              className="group relative bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 text-left flex flex-col h-full"
              title="XML faktura za sistemsku integraciju"
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">XML Faktura</h4>
                  <p className="text-xs text-gray-500">Za integraciju</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2 flex-grow">Strukturirani XML dokument za integraciju sa drugim sistemima</p>
              <div className="flex justify-end">
                <span className="inline-flex items-center text-xs font-medium text-blue-600 group-hover:text-blue-700">
                  Preuzmi
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </span>
              </div>
            </button>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center font-medium shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Zatvori
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationDetailsModal;
