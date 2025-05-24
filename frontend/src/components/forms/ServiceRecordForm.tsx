'use client';

import React, { useState } from 'react';
import { ServiceRecordCategory, ServiceItemType, CreateServiceRecordPayload, ServiceItem } from '@/types';
import { toast } from 'react-toastify';

interface ServiceRecordFormProps {
  vehicleId: number;
  onSubmit: (formData: CreateServiceRecordPayload, documentFile?: File | null) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateServiceRecordPayload>; // For editing later, if needed
}

const ServiceRecordForm: React.FC<ServiceRecordFormProps> = ({ vehicleId, onSubmit, onCancel, initialData }) => {
  const [serviceDate, setServiceDate] = useState<string>(initialData?.serviceDate ? new Date(initialData.serviceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [category, setCategory] = useState<ServiceRecordCategory>(initialData?.category || ServiceRecordCategory.REGULAR_MAINTENANCE);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>(initialData?.serviceItems || [{ type: ServiceItemType.OTHER, description: '', replaced: false }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    setServiceItems([...serviceItems, { type: ServiceItemType.OTHER, description: '', replaced: false }]);
  };

  const handleItemChange = (index: number, field: keyof ServiceItem, value: string | boolean | ServiceItemType) => {
    const updatedItems = [...serviceItems];
    if (field === 'type') {
      updatedItems[index].type = value as ServiceItemType;
    } else if (field === 'description') {
      updatedItems[index].description = value as string;
    } else if (field === 'replaced') {
      updatedItems[index].replaced = value as boolean;
    }
    setServiceItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    if (serviceItems.length > 1) {
      const updatedItems = serviceItems.filter((_, i) => i !== index);
      setServiceItems(updatedItems);
    } else {
      toast.warn("Morate imati barem jednu servisnu stavku.");
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocumentFile(event.target.files[0]);
    } else {
      setDocumentFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!description.trim()) {
      toast.error("Opis servisnog zapisa je obavezan.");
      setIsSubmitting(false);
      return;
    }
    if (serviceItems.some(item => !item.description?.trim() && item.type !== ServiceItemType.OTHER)) {
        // Allow OTHER type to have no description, but prompt for others if empty
        if(serviceItems.some(item => !item.description?.trim() && item.type !== ServiceItemType.OTHER)){
            toast.error("Molimo unesite opis za sve servisne stavke ili odaberite tip 'Ostalo'.");
            setIsSubmitting(false);
            return;
        }
    }


    const formData: CreateServiceRecordPayload = {
      vehicleId,
      serviceDate: new Date(serviceDate),
      description,
      category,
      serviceItems,
      // documentUrl will be handled by the backend
    };

    try {
      await onSubmit(formData, documentFile);
      // onSubmit should handle success toast and closing the modal
    } catch (error) {
      // onSubmit should handle error toast
      console.error("Greška prilikom spremanja servisnog zapisa:", error);
      // Toast.error might be redundant if onSubmit handles it
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to format enum keys to readable labels
  const formatEnumLabel = (enumValue: string) => {
    return enumValue.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div>
        <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-1">
          Datum Servisa
        </label>
        <input
          type="date"
          id="serviceDate"
          value={serviceDate}
          onChange={(e) => setServiceDate(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Opis Servisa
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Unesite detaljan opis servisa..."
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Kategorija Servisa
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ServiceRecordCategory)}
          required
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white"
        >
          {Object.values(ServiceRecordCategory).map(cat => (
            <option key={cat} value={cat}>{formatEnumLabel(cat)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-md font-medium text-gray-800">Servisne Stavke</h3>
        {serviceItems.map((item, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-md space-y-3 bg-gray-50/50 relative">
            {serviceItems.length > 1 && (
                 <button 
                 type="button" 
                 onClick={() => handleRemoveItem(index)}
                 className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                 aria-label="Ukloni stavku"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            )}
            <div>
              <label htmlFor={`item-type-${index}`} className="block text-xs font-medium text-gray-600 mb-0.5">Tip Stavke</label>
              <select
                id={`item-type-${index}`}
                value={item.type}
                onChange={(e) => handleItemChange(index, 'type', e.target.value as ServiceItemType)}
                className="mt-0.5 block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md bg-white"
              >
                {Object.values(ServiceItemType).map(type => (
                  <option key={type} value={type}>{formatEnumLabel(type)}</option>
                ))}
              </select>
            </div>
            <div>
                <label htmlFor={`item-description-${index}`} className="block text-xs font-medium text-gray-600 mb-0.5">Opis Stavke</label>
                <textarea
                    id={`item-description-${index}`}
                    rows={2}
                    value={item.description || ''}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="mt-0.5 block w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Npr. Zamjena uljnog filtera, dolivanje ulja..."
                />
            </div>
            <div className="flex items-center">
              <input
                id={`item-replaced-${index}`}
                type="checkbox"
                checked={item.replaced || false}
                onChange={(e) => handleItemChange(index, 'replaced', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor={`item-replaced-${index}`} className="ml-2 block text-sm text-gray-700">
                Stavka zamijenjena/izvršena
              </label>
            </div>
          </div>
        ))}
        <button 
          type="button" 
          onClick={handleAddItem}
          className="mt-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-md border border-indigo-200 transition-colors"
        >
          + Dodaj Stavku
        </button>
      </div>

      <div>
        <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
          Priloži Dokument (Opciono)
        </label>
        <input
          type="file"
          id="document"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {documentFile && <p className="text-xs text-gray-500 mt-1">Odabrana datoteka: {documentFile.name}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Odustani
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Spremanje...' : 'Spremi Servisni Zapis'}
        </button>
      </div>
    </form>
  );
};

export default ServiceRecordForm; 