import React from 'react';
import { AirlineFE, FuelTankFE, FuelingOperationFormData } from '../types';

interface AddOperationFormProps {
  formData: FuelingOperationFormData;
  textInputs?: {
    quantity_liters: string;
    quantity_kg: string;
    price_per_kg: string;
    discount_percentage: string;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleAddOperation: (e: React.FormEvent) => void;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  modalAvailableDestinations: string[];
  airlines: AirlineFE[];
  tanks: FuelTankFE[];
  onCancel: () => void;
}

const AddOperationForm: React.FC<AddOperationFormProps> = ({
  formData,
  textInputs = {
    quantity_liters: '',
    quantity_kg: '',
    price_per_kg: '',
    discount_percentage: ''
  },
  handleInputChange,
  handleAddOperation,
  selectedFiles,
  setSelectedFiles,
  modalAvailableDestinations,
  airlines,
  tanks,
  onCancel
}) => {
  return (
    <form onSubmit={handleAddOperation} className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-100">
    
        
        {/* Main form content */}
        <div className="space-y-8">
          {/* Flight Information Section */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Informacije o Letu
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
                  Datum i Vrijeme
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    name="dateTime"
                    id="dateTime"
                    value={formData.dateTime}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="aircraft_registration" className="block text-sm font-medium text-gray-700">
                  Registracija Aviona
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="aircraft_registration"
                    id="aircraft_registration"
                    value={formData.aircraft_registration}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="flight_number" className="block text-sm font-medium text-gray-700">
                  Broj Leta
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="flight_number"
                    id="flight_number"
                    value={formData.flight_number}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="airlineId" className="block text-sm font-medium text-gray-700">Avio Kompanija</label>
                <div className="mt-1">
                  <select
                    id="airlineId"
                    name="airlineId"
                    value={formData.airlineId}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Odaberite avio kompaniju</option>
                    {airlines.map((airline) => (
                      <option key={airline.id} value={airline.id}>
                        {airline.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destinacija</label>
                <div className="mt-1">
                  {(modalAvailableDestinations || []).length > 0 ? (
                    <select
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Odaberite destinaciju</option>
                      {(modalAvailableDestinations || []).map((dest) => (
                        <option key={dest} value={dest}>
                          {dest}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="destination"
                      id="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                      placeholder="Unesite destinaciju ručno"
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="tip_saobracaja" className="block text-sm font-medium text-gray-700">
                  Tip Saobraćaja
                </label>
                <div className="mt-1">
                  <select
                    id="tip_saobracaja"
                    name="tip_saobracaja"
                    value={formData.tip_saobracaja}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="Izvoz">Izvoz</option>
                    <option value="Unutarnji saobraćaj">Unutarnji saobraćaj</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Fuel Information Section */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Informacije o Gorivu
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <div>
                <label htmlFor="tankId" className="block text-sm font-medium text-gray-700">
                  Tanker
                </label>
                <div className="mt-1">
                  <select
                    id="tankId"
                    name="tankId"
                    value={formData.tankId}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Odaberite tanker</option>
                    {tanks.map((tank) => (
                      <option key={tank.id} value={tank.id} disabled={tank.current_liters <= 0}>
                        {tank.identifier} - {tank.name} ({tank.current_liters.toLocaleString('hr-HR')} L)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="quantity_liters" className="block text-sm font-medium text-gray-700">
                  Količina (litara)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="quantity_liters"
                    id="quantity_liters"
                    pattern="^\d*(\.\d{0,2})?$"
                    placeholder="npr. 0.55"
                    value={textInputs.quantity_liters}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md pr-12"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">L</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="specific_density" className="block text-sm font-medium text-gray-700">
                  Specifična gustoća (kg/L)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="specific_density"
                    id="specific_density"
                    min="0.1"
                    step="0.001"
                    value={isNaN(formData.specific_density) ? '0.000' : formData.specific_density.toFixed(3)}
                    readOnly
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                    title="Automatski izračunato iz količine u kg i litrama"
                  />
                  <p className="mt-1 text-xs text-gray-500">Automatski izračunato: kg ÷ L</p>
                </div>
              </div>

              <div>
                <label htmlFor="quantity_kg" className="block text-sm font-medium text-gray-700">
                  Količina (kg)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="quantity_kg"
                    id="quantity_kg"
                    pattern="^\d*(\.\d{0,2})?$"
                    placeholder="npr. 0.55"
                    value={textInputs.quantity_kg}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md pr-12"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informacije o Plaćanju
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <div>
                <label htmlFor="price_per_kg" className="block text-sm font-medium text-gray-700">
                  Cijena po kilogramu
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="price_per_kg"
                    id="price_per_kg"
                    pattern="^\d*(\.\d{0,5})?$"
                    placeholder="npr. 0.55"
                    value={textInputs.price_per_kg}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">{formData.currency}</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700">
                  Rabat (%)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="text"
                    name="discount_percentage"
                    id="discount_percentage"
                    pattern="^\d*(\.\d{0,2})?$"
                    placeholder="0"
                    value={textInputs.discount_percentage}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Valuta plaćanja
                </label>
                <div className="mt-1">
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="BAM">BAM (Konvertibilna marka)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Američki dolar)</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ukupan iznos plaćanja
                </label>
                <div className="text-2xl font-bold text-gray-900 flex items-center justify-between">
                  <span>{(formData.total_amount || 0).toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span>
                  <span className="text-lg font-medium text-gray-500">{formData.currency}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Izračunato na osnovu: {(formData.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} kg × {(formData.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 5 })} {formData.currency}/kg
                  {formData.discount_percentage > 0 && (
                    <span className="ml-1 text-indigo-600"> - {formData.discount_percentage}% rabat</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dodatne Informacije
            </h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <div>
                <label htmlFor="operator_name" className="block text-sm font-medium text-gray-700">
                  Ime Operatera
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="operator_name"
                    id="operator_name"
                    value={formData.operator_name}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="delivery_note_number" className="block text-sm font-medium text-gray-700">
                  Broj dostavnice
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="delivery_note_number"
                    id="delivery_note_number"
                    value={formData.delivery_note_number}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Napomene
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="text-md font-medium text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dokumenti
            </h3>
            
            <div className="mt-1">
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-2">
                Dokumenti (Opcionalno)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-indigo-300 transition-colors">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="document" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Odaberite datoteke</span>
                      <input
                        type="file"
                        name="document"
                        id="document"
                        onChange={handleInputChange}
                        className="sr-only"
                        accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                        multiple
                      />
                    </label>
                    <p className="pl-1">ili ih prevucite ovdje</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, Word, TXT, PNG, JPG do 10MB</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Možete odabrati više dokumenata odjednom</p>
            </div>
            
            {(selectedFiles || []).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Odabrani dokumenti:</h4>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded mb-1 hover:bg-indigo-50 transition-colors">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-indigo-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 21H17C18.1046 21 19 20.1046 19 19V9.41421C19 9.149 18.8946 8.89464 18.7071 8.70711L13.2929 3.29289C13.1054 3.10536 12.851 3 12.5858 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="rgba(99, 102, 241, 0.1)"/>
                          <path d="M13 3V8C13 8.55228 13.4477 9 14 9H19" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Odustani
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Spremi
        </button>
      </div>
    </form>
  );
};

export default AddOperationForm;