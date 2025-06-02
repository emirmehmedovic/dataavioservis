'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FuelIntakeRecord, FuelType, FuelIntakeDocument } from '@/types/fuel';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, DocumentTextIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { notoSansRegularBase64 } from '@/lib/fonts';
import { notoSansBoldBase64 } from '@/lib/notoSansBoldBase64';

const FONT_NAME = 'NotoSans';

// Helper function to format date as dd.mm.yyyy HH:MM
const formatDateTimeForReport = (dateInput?: string | Date): string => {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year}. ${hours}:${minutes}`;
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

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface FuelIntakeReportFilters {
  fuel_type: FuelType | 'all';
  startDate: string;
  endDate: string;
  supplier_name: string;
  refinery_name: string;
  delivery_note_number: string;
  fuel_category: string;
}

const FuelIntakeReport: React.FC = () => {
  const [records, setRecords] = useState<FuelIntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track totals for reporting
  const [totalLiters, setTotalLiters] = useState<number>(0);
  const [totalKg, setTotalKg] = useState<number>(0);
  const [averageDensity, setAverageDensity] = useState<number>(0);
  // Helper function to get first day of current month in YYYY-MM-DD format
  const getFirstDayOfMonth = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };

  // Helper function to get last day of current month in YYYY-MM-DD format
  const getLastDayOfMonth = (): string => {
    const now = new Date();
    // Create a date for the first day of the next month, then subtract one day
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  };

  const [filters, setFilters] = useState<FuelIntakeReportFilters>({
    fuel_type: 'all',
    startDate: getFirstDayOfMonth(),
    endDate: getLastDayOfMonth(),
    supplier_name: '',
    refinery_name: '',
    delivery_note_number: '',
    fuel_category: 'all',
  });

  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const [loadingRecordDetails, setLoadingRecordDetails] = useState(false);

  const fetchIntakeRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: Record<string, string> = {};
      if (filters.fuel_type && filters.fuel_type !== 'all') {
        activeFilters.fuel_type = filters.fuel_type;
      }
      if (filters.startDate) {
        // Set start date to beginning of the day (00:00:00)
        const startDateObj = new Date(filters.startDate);
        startDateObj.setHours(0, 0, 0, 0);
        activeFilters.startDate = startDateObj.toISOString();
      }
      if (filters.endDate) {
        // Set end date to end of the day (23:59:59)
        const endDateObj = new Date(filters.endDate);
        endDateObj.setHours(23, 59, 59, 999);
        activeFilters.endDate = endDateObj.toISOString();
      }
      if (filters.supplier_name) activeFilters.supplier_name = filters.supplier_name;
      if (filters.refinery_name) activeFilters.refinery_name = filters.refinery_name;
      if (filters.delivery_note_number) activeFilters.delivery_note_number = filters.delivery_note_number;
      if (filters.fuel_category && filters.fuel_category !== 'all') activeFilters.fuel_category = filters.fuel_category;
      
      console.log('Active filters:', activeFilters);

      const queryParams = new URLSearchParams(activeFilters).toString();
      const url = `/api/fuel/intake-records${queryParams ? `?${queryParams}` : ''}`;
      const data = await fetchWithAuth<FuelIntakeRecord[]>(url);
      setRecords(data);
      
      // Calculate totals
      if (data && data.length > 0) {
        // Calculate total liters
        const totalLitersValue = data.reduce((sum, record) => sum + (record.quantity_liters_received || 0), 0);
        
        // Calculate total kg
        const totalKgValue = data.reduce((sum, record) => {
          // If kg is directly available
          if (record.quantity_kg_received) {
            return sum + record.quantity_kg_received;
          }
          // Otherwise calculate from liters and specific gravity
          else if (record.quantity_liters_received && record.specific_gravity) {
            return sum + (record.quantity_liters_received * record.specific_gravity);
          }
          return sum;
        }, 0);
        
        // Calculate average density
        const avgDensity = totalLitersValue > 0 ? totalKgValue / totalLitersValue : 0;
        
        setTotalLiters(totalLitersValue);
        setTotalKg(totalKgValue);
        setAverageDensity(avgDensity);
      } else {
        // Reset totals if no data
        setTotalLiters(0);
        setTotalKg(0);
        setAverageDensity(0);
      }
    } catch (err) {
      console.error('Error fetching fuel intake records:', err);
      const errorMessage = err instanceof Error ? err.message : 'Nepoznata greška.';
      setError(`Greška pri učitavanju zapisa o ulazu goriva: ${errorMessage}`);
      toast.error(`Greška: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchIntakeRecords();
  }, [fetchIntakeRecords]);

  const handleFilterChange = (
    filterName: keyof FuelIntakeReportFilters,
    value: string | FuelType
  ) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleDownloadDocument = async (doc: FuelIntakeDocument) => {
    if (!doc || !doc.id) {
      toast.error('ID dokumenta nedostaje.');
      return;
    }
    try {
      const response: Response = await fetchWithAuth(
        `${API_URL}/api/fuel/documents/${doc.id}/download`,
        { method: 'GET', returnRawResponse: true }
      ) as Response;

      if (!response.ok) {
        let errorMsg = `Greška (${response.status}) pri preuzimanju dokumenta.`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Zanemari ako odgovor nije JSON */ }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.document_name || `document-${doc.id}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Dokument '${doc.document_name}' uspješno preuzet.`);
    } catch (err) {
      console.error('Error downloading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Nepoznata greška prilikom preuzimanja.';
      toast.error(`Greška: ${errorMessage}`);
    } finally {
    }
  };

  const handleExportSingleRecordToPdf = (record: FuelIntakeRecord) => {
    const doc = new jsPDF();
    registerFont(doc);

    doc.setFontSize(18);
    doc.setFont(FONT_NAME, 'bold'); 
    doc.text(`Izvještaj o Ulazu Goriva - ID: ${record.id}`, 14, 22);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.setFontSize(10);

    let yPos = 35;
    const lineHeight = 8; 
    const leftMargin = 14;
    const labelValueSpacing = 50; 
    const valueX = leftMargin + labelValueSpacing;

    doc.setFontSize(14);
    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Osnovni Podaci', leftMargin, yPos);
    yPos += lineHeight + 2;
    doc.setFontSize(10);
    doc.setFont(FONT_NAME, 'normal'); 

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Datum i Vrijeme Ulaza:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(formatDateTimeForReport(record.intake_datetime), valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Tip Goriva:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.fuel_type, valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Kategorija:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.fuel_category || 'Domaće tržište', valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Dostavno Vozilo (Reg.):', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.delivery_vehicle_plate || 'N/A', valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Vozač:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.delivery_vehicle_driver_name || 'N/A', valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Količina (L):', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.quantity_liters_received.toLocaleString('bs-BA'), valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Količina (KG):', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.quantity_kg_received.toLocaleString('bs-BA'), valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Specifična Gustoća:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.specific_gravity.toLocaleString('bs-BA'), valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Dobavljač:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.supplier_name || 'N/A', valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Broj Dostavnice:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.delivery_note_number || 'N/A', valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Carinska Deklaracija:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.customs_declaration_number || 'N/A', valueX, yPos); yPos += lineHeight;

    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Rafinerija:', leftMargin, yPos);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.text(record.refinery_name || 'N/A', valueX, yPos); yPos += lineHeight;

    yPos += 10;

    if (record.fixedTankTransfers && record.fixedTankTransfers.length > 0) {
      doc.setFontSize(14);
      doc.setFont(FONT_NAME, 'bold'); 
      doc.text('Raspodjela u Fiksne Tankove', 14, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont(FONT_NAME, 'normal'); 

      const transferTableBody = record.fixedTankTransfers.map(t => [
        t.affectedFixedTank?.tank_name || 'N/A',
        t.affectedFixedTank?.tank_identifier || 'N/A',
        t.quantity_liters_transferred.toLocaleString('bs-BA'),
        formatDateTimeForReport(t.transfer_datetime)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Naziv Tanka', 'Identifikator Tanka', 'Količina (L)', 'Vrijeme Transfera']],
        body: transferTableBody,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133], font: FONT_NAME, fontStyle: 'bold', fontSize: 10 }, 
        styles: { font: FONT_NAME, fontSize: 9 }, 
        didDrawPage: (data: any) => { yPos = data.cursor.y; }
      });
      yPos += 10; 
    } else {
      doc.setFontSize(10);
      doc.setFont(FONT_NAME, 'normal'); 
      doc.text('Nema podataka o raspodjeli u fiksne tankove.', 14, yPos);
      yPos += lineHeight + 5; 
    }

    yPos += 5; 

    if (record.documents && record.documents.length > 0) {
      doc.setFontSize(14);
      doc.setFont(FONT_NAME, 'bold'); 
      doc.text('Priloženi Dokumenti', 14, yPos);
      yPos += lineHeight + 2;
      doc.setFontSize(10);
      doc.setFont(FONT_NAME, 'normal'); 

      const docTableBody = record.documents.map(d => [
        d.document_name,
        d.document_type,
        d.file_size_bytes ? `${(d.file_size_bytes / 1024).toFixed(2)} KB` : 'N/A'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Naziv Dokumenta', 'Tip Dokumenta', 'Veličina']],
        body: docTableBody,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], font: FONT_NAME, fontStyle: 'bold', fontSize: 10 }, 
        styles: { font: FONT_NAME, fontSize: 9 }, 
        didDrawPage: (data: any) => { yPos = data.cursor.y; }
      });
      yPos += 10; 
    } else {
      doc.setFontSize(10);
      doc.setFont(FONT_NAME, 'normal'); 
      doc.text('Nema priloženih dokumenata.', 14, yPos);
      yPos += lineHeight;
    }

    doc.save(`Izvjestaj_Ulaz_Goriva_ID_${record.id}.pdf`);
    toast.success('PDF izvještaj uspješno generisan.');
  };

  const handleExportAllToPdf = () => {
    if (records.length === 0) {
      toast.error('Nema podataka za izvoz u PDF.');
      return;
    }

    const doc = new jsPDF();
    registerFont(doc);

    doc.setFontSize(16);
    doc.setFont(FONT_NAME, 'bold'); 
    doc.text('Izvještaj Svih Ulaza Goriva', 14, 22);
    doc.setFont(FONT_NAME, 'normal'); 
    doc.setFontSize(10);

    const dateRangeText = filters.startDate && filters.endDate
      ? `Period: ${filters.startDate} - ${filters.endDate}`
      : 'Svi zapisi';
    doc.text(dateRangeText, 14, 32);

    const tableData = records.map(record => [
      formatDateTimeForReport(record.intake_datetime),
      record.fuel_type,
      record.fuel_category || 'Domaće tržište',
      record.quantity_liters_received.toLocaleString() + ' L',
      record.refinery_name || 'N/A',
      record.supplier_name || 'N/A',
      record.delivery_note_number || 'N/A'
    ]);

    // Calculate totals from records
    const totalLiters = records.reduce((sum, record) => sum + (record.quantity_liters_received || 0), 0);
    const totalKg = records.reduce((sum, record) => sum + (record.quantity_kg_received || 0), 0);
    const averageDensity = totalLiters > 0 ? totalKg / totalLiters : 0;

    autoTable(doc, {
      startY: 40,
      head: [['Datum', 'Tip Goriva', 'Kategorija', 'Količina', 'Rafinerija', 'Br. Otpremnice']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133], font: FONT_NAME, fontStyle: 'bold', fontSize: 10 }, 
      styles: { font: FONT_NAME, fontSize: 9 },
      didDrawPage: function(data) {
        // Add footer with total information
        doc.setFont(FONT_NAME, 'bold');
        doc.setFontSize(10);
        
        // Display totals in the footer
        const footerY = doc.internal.pageSize.height - 20;
        doc.text(`Ukupno Litara: ${totalLiters.toLocaleString('bs-BA')} L`, data.settings.margin.left, footerY - 8);
        doc.text(`Ukupno Kilograma: ${totalKg.toLocaleString('bs-BA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`, data.settings.margin.left, footerY - 4);
        doc.text(`Prosječna Gustoća: ${averageDensity.toLocaleString('bs-BA', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg/L`, data.settings.margin.left, footerY);
        
        // Add page number
        doc.setFont(FONT_NAME, 'normal');
        doc.setFontSize(8);
        doc.text(`Stranica ${data.pageNumber}`, doc.internal.pageSize.width - 20, footerY);
      }
    });

    doc.save(`Izvjestaj_Ulaz_Goriva_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF izvještaj uspješno generisan sa ukupnim količinama.');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      {/* Header with glassmorphism effect */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 backdrop-blur-md bg-gradient-to-br from-[#4d4c4c] to-[#1a1a1a] shadow-lg p-6">
        {/* Subtle red shadows in corners */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#e53e3e] rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4 z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e53e3e] rounded-full filter blur-3xl opacity-5 translate-y-1/2 -translate-x-1/4 z-0"></div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-[#e53e3e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Izvještaj o Ulazu Goriva
            </h2>
            <p className="text-gray-300 mt-1 ml-11">Pregled svih zapisa o ulazu goriva i pratećih dokumenata</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filteri izvještaja
              </h3>
            </div>
            
            <div className="p-5 bg-white dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="startDateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Datum od:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Input
                      type="date"
                      id="startDateFilter"
                      className="pl-10 bg-gray-50 dark:bg-gray-900"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="endDateFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Datum do:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Input
                      type="date"
                      id="endDateFilter"
                      className="pl-10 bg-gray-50 dark:bg-gray-900"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="fuelTypeFilterReport" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tip Goriva:</label>
                  <Select
                    value={filters.fuel_type}
                    onValueChange={(value: FuelType | 'all') => handleFilterChange('fuel_type', value)}
                  >
                    <SelectTrigger id="fuelTypeFilterReport" className="bg-gray-50 dark:bg-gray-900">
                      <SelectValue placeholder="Svi tipovi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Svi tipovi</SelectItem>
                      {Object.values(FuelType).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="categoryFilterReport" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategorija:</label>
                  <Select
                    value={filters.fuel_category}
                    onValueChange={(value: string) => handleFilterChange('fuel_category', value)}
                  >
                    <SelectTrigger id="categoryFilterReport" className="bg-gray-50 dark:bg-gray-900">
                      <SelectValue placeholder="Sve kategorije" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Sve kategorije</SelectItem>
                      <SelectItem value="Izvoz">Izvoz</SelectItem>
                      <SelectItem value="Domaće tržište">Domaće tržište</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="refineryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rafinerija:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      id="refineryFilter"
                      className="pl-10 bg-gray-50 dark:bg-gray-900"
                      placeholder="Naziv rafinerije"
                      value={filters.refinery_name}
                      onChange={(e) => handleFilterChange('refinery_name', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="supplierFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dobavljač:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      id="supplierFilter"
                      className="pl-10 bg-gray-50 dark:bg-gray-900"
                      placeholder="Naziv dobavljača"
                      value={filters.supplier_name}
                      onChange={(e) => handleFilterChange('supplier_name', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="deliveryNoteFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Br. Otpremnice:</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      id="deliveryNoteFilter"
                      className="pl-10 bg-gray-50 dark:bg-gray-900"
                      placeholder="Broj otpremnice"
                      value={filters.delivery_note_number}
                      onChange={(e) => handleFilterChange('delivery_note_number', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={fetchIntakeRecords} 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Primjenjujem...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Primijeni filtere
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Pregled ulaza goriva
              </h3>
            </div>
            
            {loading && !records.length ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Učitavanje podataka...</p>
              </div>
            ) : error && !records.length ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700 dark:text-gray-300 font-medium">Greška pri učitavanju podataka</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{error}</p>
              </div>
            ) : !records.length ? (
              <div className="flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-700 dark:text-gray-300 font-medium">Nema podataka za prikaz</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Podesite filtere i pokušajte ponovo</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto w-full">
                  <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Datum</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tip Goriva</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategorija</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Količina (L)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rafinerija</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dobavljač</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Br. Otpremnice</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Akcije</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {records.map((record) => (
                        <React.Fragment key={record.id}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateTimeForReport(record.intake_datetime)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.fuel_type === FuelType.JET_A1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'}`}>
                                {record.fuel_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(record.fuel_category === 'Izvoz') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'}`}>
                                {record.fuel_category || 'Domaće tržište'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {record.quantity_liters_received.toLocaleString('hr-HR')} L
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{record.refinery_name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{record.supplier_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{record.delivery_note_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex space-x-2">
                              {record.documents && record.documents.length > 0 && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                                  className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                                >
                                  <DocumentTextIcon className="h-4 w-4 mr-1" /> 
                                  Dokumenti ({record.documents.length})
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleExportSingleRecordToPdf(record)}
                                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                          {expandedRecordId === record.id && record.documents && record.documents.length > 0 && (
                            <tr>
                              <td colSpan={7} className="p-2 bg-gray-50 dark:bg-gray-700/50">
                                <div className="p-2">
                                  <h4 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Povezani dokumenti:</h4>
                                  <ul className="list-disc pl-5">
                                    {record.documents.map(doc => (
                                      <li key={doc.id} className="text-xs flex justify-between items-center py-1">
                                        <span className="text-gray-600 dark:text-gray-400">{doc.document_name} ({doc.document_type}, {(doc.file_size_bytes / 1024).toFixed(1)} KB)</span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleDownloadDocument(doc)}
                                          className="p-0 h-auto text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                        >
                                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Preuzmi
                                        </Button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {records.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Prikazano <span className="font-medium text-gray-700 dark:text-gray-300">{records.length}</span> zapisa
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleExportAllToPdf()}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Izvezi sve u PDF
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelIntakeReport;
