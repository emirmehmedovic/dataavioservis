'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { notoSansRegularBase64 } from '@/lib/fonts';
import { notoSansBoldBase64 } from '@/lib/notoSansBoldBase64';

const FONT_NAME = 'NotoSans';

// Helper function to format date as dd.mm.yyyy HH:MM
const formatDateTimeBosnian = (dateInput: string | Date): string => {
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

interface User {
  id: number;
  username: string;
  role: string;
}

interface FixedTank {
  id: number;
  tank_identifier: string;
  tank_name?: string;
  location_description: string;
  fuel_type: string;
}

interface MobileTank {
  id: number;
  identifier: string; // e.g., "VOZILO 1"
  name?: string;       // e.g., "ESTER -br. šasije 950"
  vehicle_name?: string; // Fallback or alternative name
  registration_number?: string; // Fallback or alternative identifier
  current_location?: string;
  fuel_type?: string;
}

interface FuelDrainData {
  id: number;
  dateTime: string;
  sourceType: 'fixed' | 'mobile' | string;
  sourceFixedTankId?: number | null;
  sourceMobileTankId?: number | null;
  quantityLiters: number;
  notes?: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  sourceFixedTank?: FixedTank | null;
  sourceMobileTank?: MobileTank | null;
  sourceName?: string;
  userName?: string;
}

const FuelDrainReport = () => {
  const { authUser, authToken } = useAuth();
  const [data, setData] = useState<FuelDrainData[]>([]);
  const [filteredData, setFilteredData] = useState<FuelDrainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all'); // 'all', 'fixed', 'mobile'

  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  const fetchData = useCallback(async () => {
    if (!authUser || !authToken) {
      setLoading(false);
      setError('Autentifikacija neuspješna.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/fuel/drains/records`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (Array.isArray(result)) {
        setData(result);
      } else if (result && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        setData([]); 
        console.warn('Unexpected API response structure for fuel drain records:', result);
      }
    } catch (e: any) {
      console.error('Failed to fetch fuel drain data:', e);
      setError(e.message || 'Došlo je do greške prilikom dohvaćanja podataka.');
    } finally {
      setLoading(false);
    }
  }, [authUser, authToken, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let newFilteredData = [...data];

    if (startDate) {
      const filterStartDate = new Date(startDate);
      filterStartDate.setHours(0, 0, 0, 0); 
      newFilteredData = newFilteredData.filter(item => {
        const itemDate = new Date(item.dateTime);
        return itemDate >= filterStartDate;
      });
    }

    if (endDate) {
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999); 
      newFilteredData = newFilteredData.filter(item => {
        const itemDate = new Date(item.dateTime);
        return itemDate <= filterEndDate;
      });
    }

    if (selectedSourceType !== 'all') {
      newFilteredData = newFilteredData.filter(item => item.sourceType === selectedSourceType);
    }

    setFilteredData(newFilteredData);
  }, [data, startDate, endDate, selectedSourceType]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const resetDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleSourceTypeChange = (value: string) => {
    setSelectedSourceType(value);
  };

  const resetSourceFilters = () => {
    setSelectedSourceType('all');
  };

  const calculateTotalDrained = () => {
    return filteredData.reduce((sum, item) => sum + item.quantityLiters, 0);
  };

  const handleExportAllToPdf = () => {
    const doc = new jsPDF();
    registerFont(doc);
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(18);
    doc.text('Izvještaj o Dreniranom Gorivu', 14, 22);
    doc.setFontSize(11);
    if (startDate || endDate || selectedSourceType !== 'all') {
      let filterText = 'Filteri: ';
      if (startDate) filterText += `Od: ${new Date(startDate).toLocaleDateString('bs-BA')} `;
      if (endDate) filterText += `Do: ${new Date(endDate).toLocaleDateString('bs-BA')} `;
      if (selectedSourceType !== 'all') filterText += `Tip izvora: ${selectedSourceType === 'fixed' ? 'Fiksni tank' : 'Mobilni tank'} `;
      doc.setFontSize(9);
      doc.text(filterText, 14, 28);
      doc.setFontSize(11); 
    }

    const totalDrained = calculateTotalDrained();
    const summaryText = `Ukupno drenirano: ${totalDrained.toLocaleString('bs-BA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
    const textWidth = doc.getStringUnitWidth(summaryText) * doc.getFontSize() / doc.internal.scaleFactor;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text(summaryText, pageWidth - textWidth - 14, (startDate || endDate || selectedSourceType !== 'all') ? 35-5 : 30-5); 

    autoTable(doc, {
      startY: (startDate || endDate || selectedSourceType !== 'all') ? 35 : 30, 
      head: [['Datum', 'Izvor (Tank/Vozilo)', 'Lokacija', 'Količina (L)', 'Napomena']],
      body: filteredData.map(item => {
        let sourceDisplay = item.sourceName || '-'; 
        if (item.sourceType === 'fixed' && item.sourceFixedTank) {
          sourceDisplay = item.sourceFixedTank.tank_name 
            ? `${item.sourceFixedTank.tank_name} (${item.sourceFixedTank.tank_identifier || '-'})` 
            : (item.sourceFixedTank.tank_identifier || '-'); 
        } else if (item.sourceType === 'mobile' && item.sourceMobileTank) {
          const mobileName = item.sourceMobileTank.name || item.sourceMobileTank.vehicle_name;
          const mobileIdentifier = item.sourceMobileTank.identifier || item.sourceMobileTank.registration_number;
          sourceDisplay = mobileName 
            ? `${mobileName} (${mobileIdentifier || '-'})` 
            : (mobileIdentifier || '-');
        } else if (item.sourceName) {
            sourceDisplay = item.sourceName;
        }

        let locationDisplay = '-';
        if (item.sourceType === 'fixed' && item.sourceFixedTank) {
          locationDisplay = item.sourceFixedTank.location_description || item.sourceFixedTank.tank_identifier;
        } else if (item.sourceType === 'mobile' && item.sourceMobileTank) {
          locationDisplay = item.sourceMobileTank.current_location || item.sourceMobileTank.vehicle_name || '-';
        }

        return [
          formatDateTimeBosnian(item.dateTime),
          sourceDisplay,
          locationDisplay,
          item.quantityLiters.toLocaleString('bs-BA'),
          item.notes || '-',
        ];
      }),
      styles: { font: FONT_NAME, fontStyle: 'normal' },
      headStyles: { fontStyle: 'bold', fillColor: [22, 160, 133] },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        doc.text(
          `Stranica ${data.pageNumber} od ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save('izvjestaj_drenirano_gorivo.pdf');
  };

  if (loading) return <p>Učitavanje podataka o dreniranom gorivu...</p>;
  if (error) return <p>Greška: {error}</p>;

  return (
    <Card>
      <div className="relative overflow-hidden">
        {/* Black glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 z-0"></div>
        {/* Glass highlight effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-0"></div>
        <CardHeader className="flex flex-row items-center justify-between relative z-10 text-white">
          <CardTitle>Evidencija Dreniranog Goriva</CardTitle>
        <Button onClick={handleExportAllToPdf} variant="outline" size="sm" disabled={filteredData.length === 0}>
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Preuzmi PDF (filtrirano)
        </Button>
      </CardHeader>
      </div>
      <CardContent>
        {/* Combined Filters Row */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 border rounded-md bg-gray-50 items-end">
          {/* Date Filters */}
          <div>
            <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Od datuma:</Label>
            <Input type="date" id="startDate" name="startDate" value={startDate} onChange={handleStartDateChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Do datuma:</Label>
            <Input type="date" id="endDate" name="endDate" value={endDate} onChange={handleEndDateChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <Button onClick={resetDateFilters} variant="outline" className="self-end">Poništi datume</Button>

          {/* Source Type Filter */}
          <div className="ml-auto">
            <Label htmlFor="sourceTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Tip izvora:</Label>
            <Select value={selectedSourceType} onValueChange={handleSourceTypeChange}>
              <SelectTrigger id="sourceTypeFilter" className="w-[200px]">
                <SelectValue placeholder="Odaberite tip izvora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi izvori</SelectItem>
                <SelectItem value="fixed">Fiksni tank</SelectItem>
                <SelectItem value="mobile">Mobilni tank (cisterna)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* TODO: Add dropdown for specific source ID here */}
          <Button onClick={resetSourceFilters} variant="outline" className="self-end">Poništi filter izvora</Button>
        </div>

        {filteredData.length === 0 ? (
          <p>Nema evidentiranih podataka o dreniranom gorivu za odabrane filtere.</p>
        ) : (
          <>
            <div className="mb-4 text-right font-semibold">
              Ukupno drenirano (filtrirano): {calculateTotalDrained().toLocaleString('bs-BA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Izvor (Tank/Vozilo)</TableHead>
                  <TableHead>Lokacija</TableHead>
                  <TableHead>Količina (L)</TableHead>
                  <TableHead>Napomena</TableHead>
                  <TableHead>Korisnik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => {
                  let sourceDisplay = item.sourceName || '-'; 
                  if (item.sourceType === 'fixed' && item.sourceFixedTank) {
                    sourceDisplay = item.sourceFixedTank.tank_name 
                      ? `${item.sourceFixedTank.tank_name} (${item.sourceFixedTank.tank_identifier || '-'})` 
                      : (item.sourceFixedTank.tank_identifier || '-'); 
                  } else if (item.sourceType === 'mobile' && item.sourceMobileTank) {
                    const mobileName = item.sourceMobileTank.name || item.sourceMobileTank.vehicle_name;
                    const mobileIdentifier = item.sourceMobileTank.identifier || item.sourceMobileTank.registration_number;
                    sourceDisplay = mobileName 
                      ? `${mobileName} (${mobileIdentifier || '-'})` 
                      : (mobileIdentifier || '-');
                  } else if (item.sourceName) {
                      sourceDisplay = item.sourceName;
                  }

                  let locationDisplay = '-';
                  if (item.sourceType === 'fixed' && item.sourceFixedTank) {
                    locationDisplay = item.sourceFixedTank.location_description || item.sourceFixedTank.tank_identifier;
                  } else if (item.sourceType === 'mobile' && item.sourceMobileTank) {
                    locationDisplay = item.sourceMobileTank.current_location || item.sourceMobileTank.vehicle_name || '-';
                  }

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {formatDateTimeBosnian(item.dateTime)}
                      </TableCell>
                      <TableCell>{sourceDisplay}</TableCell>
                      <TableCell>{locationDisplay}</TableCell>
                      <TableCell>{item.quantityLiters.toLocaleString('bs-BA')}</TableCell>
                      <TableCell>{item.notes || '-'}</TableCell>
                      <TableCell>{item.userName || item.user.username || '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FuelDrainReport;
