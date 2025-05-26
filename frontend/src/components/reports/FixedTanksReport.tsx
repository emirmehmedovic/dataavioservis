'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFixedTanks, getFixedTankHistory, getTotalFixedTankIntake, getAllFixedTankIntakesList, getTotalFuelSummary } from '@/lib/apiService';
import type { FixedStorageTank, TankTransaction } from '@/types/fuel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, ChevronDown, ChevronUp, Filter, FileDown } from 'lucide-react'; 
import { BeakerIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input'; 
import { useAuth } from '@/contexts/AuthContext'; 
import jsPDF from 'jspdf';
import { autoTable, CellHookData } from 'jspdf-autotable'; 
import { notoSansRegularBase64 } from '@/lib/fonts';
import { notoSansBoldBase64 } from '@/lib/notoSansBoldBase64';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 
import AllIntakesList from '@/components/customs/AllIntakesList'; 

interface TankWithHistory extends FixedStorageTank {
  history?: TankTransaction[];
  showHistory?: boolean;
  historyLoading?: boolean;
  errorHistory?: string | null;
  filterStartDate?: string; 
  filterEndDate?: string;   
  filterTransactionType?: TankTransaction['type'] | 'all'; 
}

export default function FixedTanksReport() {
  const [tanks, setTanks] = useState<TankWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authToken } = useAuth(); 

  // State for Total Intake Summary
  const [totalIntakeStartDate, setTotalIntakeStartDate] = useState<string>('');
  const [totalIntakeEndDate, setTotalIntakeEndDate] = useState<string>('');
  const [totalIntakeAmount, setTotalIntakeAmount] = useState<number | null>(null);
  const [totalIntakeLoading, setTotalIntakeLoading] = useState<boolean>(false);
  const [totalIntakeError, setTotalIntakeError] = useState<string | null>(null);
  
  // State for fuel summary
  const [fuelSummary, setFuelSummary] = useState<{
    fixedTanksTotal: number;
    mobileTanksTotal: number;
    grandTotal: number;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Function to fetch fuel summary data
  const fetchFuelSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      const summaryData = await getTotalFuelSummary();
      setFuelSummary(summaryData);
    } catch (error) {
      console.error('Error fetching fuel summary:', error);
      setSummaryError('Greška pri učitavanju ukupnog stanja goriva');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    const fetchTanksData = async () => { 
      if (!authToken) {
        setError("Token za autentifikaciju nije pronađen. Molimo ulogirajte se ponovo.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getFixedTanks(); 
        const today = new Date();
        const defaultStartDate = format(startOfMonth(today), 'yyyy-MM-dd');
        const defaultEndDate = format(endOfMonth(today), 'yyyy-MM-dd');

        setTanks(data.map(tank => ({ 
          ...tank, 
          showHistory: false, 
          historyLoading: false, 
          filterStartDate: defaultStartDate, 
          filterEndDate: defaultEndDate,   
          filterTransactionType: 'all' 
        })));
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Greška pri dohvatu tankova');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) { 
     fetchTanksData();
     fetchFuelSummary();
    } else {
      // Handle case where authToken is not yet available or never becomes available
      // setError("Čekanje na autentifikaciju..."); 
      // setLoading(false); 
    }
  }, [authToken]);

  // Initialize total intake dates to current month
  useEffect(() => {
    const today = new Date();
    setTotalIntakeStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
    setTotalIntakeEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
  }, []); 

  // Fetch total intake data
  const fetchCombinedIntakeData = useCallback(async () => {
    if (!authToken || !totalIntakeStartDate || !totalIntakeEndDate) {
      setTotalIntakeAmount(null);
      return;
    }
    setTotalIntakeLoading(true);
    setTotalIntakeError(null);

    try {
      const totalIntake = await getTotalFixedTankIntake(totalIntakeStartDate, totalIntakeEndDate);
      setTotalIntakeAmount(totalIntake.totalIntake);
    } catch (err: any) {
      const errorMessage = err.message || 'Greška pri dohvatu podataka o prijemu.';
      setTotalIntakeError(errorMessage);
      setTotalIntakeAmount(null); 
      console.error(err);
    } finally {
      setTotalIntakeLoading(false);
    }
  }, [authToken, totalIntakeStartDate, totalIntakeEndDate]);

  // useEffect to fetch combined data when dates or token change
  useEffect(() => {
    if (totalIntakeStartDate && totalIntakeEndDate && authToken) {
      fetchCombinedIntakeData();
    }
  }, [fetchCombinedIntakeData, totalIntakeStartDate, totalIntakeEndDate, authToken]);

  const handleFilterDateChange = (tankId: number, dateType: 'startDate' | 'endDate', value: string) => {
    setTanks(prevTanks =>
      prevTanks.map(tank =>
        tank.id === tankId ? { ...tank, [dateType === 'startDate' ? 'filterStartDate' : 'filterEndDate']: value } : tank
      )
    );
  };

  const handleFilterTransactionTypeChange = (tankId: number, type: TankTransaction['type'] | 'all') => {
    setTanks(prevTanks =>
      prevTanks.map(tank =>
        tank.id === tankId ? { ...tank, filterTransactionType: type } : tank
      )
    );
    // Optionally, re-fetch or re-filter history if it's already loaded
    // For simplicity, we'll rely on the user clicking "Prikaži/Osvježi Historiju" or applying date filters again
    // or we can automatically trigger a refresh if history is shown
    const currentTank = tanks.find(t => t.id === tankId);
    if (currentTank?.showHistory) {
      toggleHistory(tankId, true); 
    }
  };

  const toggleHistory = async (tankId: number, forceFetch: boolean = false) => {
    console.log(`FixedTanksReport - toggleHistory called for tank ID ${tankId}, forceFetch: ${forceFetch}`);
    console.log(`Current filter dates: startDate=${tanks.find(t => t.id === tankId)?.filterStartDate}, endDate=${tanks.find(t => t.id === tankId)?.filterEndDate}`);
    console.log(`Current filter transaction type: ${tanks.find(t => t.id === tankId)?.filterTransactionType || 'all'}`);

    const targetTank = tanks.find(t => t.id === tankId);
    if (!targetTank) return;

    if (!targetTank.showHistory || forceFetch) {
      try {
        console.log(`FixedTanksReport - Fetching history for tank ID ${tankId}...`);
        setTanks(prev => prev.map(t => t.id === tankId ? { ...t, historyLoading: true, errorHistory: null } : t));
        if (!authToken) {
            console.log('FixedTanksReport - Authentication token not found');
            setTanks(prev => prev.map(t => t.id === tankId ? { ...t, historyLoading: false, errorHistory: 'Token za autentifikaciju nije pronađen.' } : t));
            return;
        }
        
        const historyData = await getFixedTankHistory(tankId, targetTank.filterStartDate, targetTank.filterEndDate);
        console.log(`FixedTanksReport - History data received for tank ID ${tankId}:`, historyData);
        
        // Log transaction types distribution
        const transactionTypes: Record<string, number> = {};
        historyData.forEach(transaction => {
          transactionTypes[transaction.type] = (transactionTypes[transaction.type] || 0) + 1;
        });
        console.log('FixedTanksReport - Transaction types distribution:', transactionTypes);
        
        // Check if there are any 'intake' transactions
        const intakeTransactions = historyData.filter(t => t.type === 'intake');
        console.log(`FixedTanksReport - Number of 'intake' transactions: ${intakeTransactions.length}`);
        
        setTanks(prev => prev.map(t => t.id === tankId ? { ...t, history: historyData, showHistory: true, historyLoading: false } : t));
      } catch (err: any) {
        console.error(`Greška pri dohvatu historije za tank ${tankId}:`, err);
        setTanks(prev => prev.map(t => t.id === tankId ? { ...t, showHistory: true, historyLoading: false, errorHistory: err.message || 'Greška pri dohvatu historije.' } : t));
      }
    } else {
      console.log(`FixedTanksReport - Hiding history for tank ID ${tankId}`);
      setTanks(prev => prev.map(t => t.id === tankId ? { ...t, showHistory: false } : t));
    }
  };

  const handleExportToPdf = (tank: TankWithHistory) => {
    if (!tank.history || tank.history.length === 0) {
      alert("Nema transakcija za izvoz.");
      return;
    }

    const doc = new jsPDF();
    const FONT_NAME = 'NotoSans';

    // Pravilno dodavanje i učitavanje fontova za podršku bosanskih znakova
    try {
      // Helper funkcija za uklanjanjanje prefiksa iz Base64 stringa
      const stripPrefix = (base64String: string) => {
        const prefix = 'data:font/ttf;base64,';
        if (base64String.startsWith(prefix)) {
          return base64String.substring(prefix.length);
        }
        return base64String;
      };
      
      if (notoSansRegularBase64) {
        // Dodaj font u VFS (Virtual File System) jsPDF-a
        const cleanedRegular = stripPrefix(notoSansRegularBase64);
        doc.addFileToVFS('NotoSans-Regular.ttf', cleanedRegular);
        // Registruj font za korištenje
        doc.addFont('NotoSans-Regular.ttf', FONT_NAME, 'normal');
        
        // Postavi font kao aktivni
        doc.setFont(FONT_NAME);
      } else {
        console.error("NotoSansRegular font nije dostupan");
      }
      
      if (notoSansBoldBase64) {
        // Dodaj bold font u VFS
        const cleanedBold = stripPrefix(notoSansBoldBase64);
        doc.addFileToVFS('NotoSans-Bold.ttf', cleanedBold);
        // Registruj bold font
        doc.addFont('NotoSans-Bold.ttf', FONT_NAME, 'bold');
      } else {
        console.error("NotoSansBold font nije dostupan");
      }
    } catch (e) {
      console.error("Greška prilikom postavljanja fontova:", e);
      alert("Greška: Fontovi za PDF nisu mogli biti učitani. Bosanski znakovi možda neće biti ispravno prikazani.");
    }  

    // Naslov
    const title = `Izvještaj o transakcijama za rezervoar: ${tank.tank_name} (${tank.tank_identifier})`;
    doc.setFontSize(18);
    try {
      doc.setFont(FONT_NAME, 'bold');
    } catch (e) {
      console.error("Greška pri postavljanju bold fonta za naslov:", e);
    }
    doc.text(title, 14, 22);
    
    // Vraćanje na normalni font za ostatak dokumenta
    try {
      doc.setFont(FONT_NAME, 'normal');
    } catch (e) {
      console.error("Greška pri vraćanju na normalni font:", e);
    }

    // Detalji o tanku
    doc.setFontSize(11);
    doc.text(`Rezervoar: ${tank.tank_name} (${tank.tank_identifier})`, 14, 32);
    doc.text(`Vrsta goriva: ${tank.fuel_type}`, 14, 38);
    doc.text(`Kapacitet: ${tank.capacity_liters.toLocaleString()} L`, 14, 44);
    
    let periodText = "Period: Sve prikazane transakcije";
    if (tank.filterStartDate && tank.filterEndDate) {
      periodText = `Period: ${new Date(tank.filterStartDate).toLocaleDateString()} - ${new Date(tank.filterEndDate).toLocaleDateString()}`;
    } else if (tank.filterStartDate) {
      periodText = `Period: Od ${new Date(tank.filterStartDate).toLocaleDateString()}`;
    } else if (tank.filterEndDate) {
      periodText = `Period: Do ${new Date(tank.filterEndDate).toLocaleDateString()}`;
    }
    doc.text(periodText, 14, 50);

    // Definicija za mapiranje tipova transakcija
    const transactionTypeMap: { [key: string]: string } = {
      'intake': 'ULAZ GORIVA',
      'transfer_to_mobile': 'PRETAKANJE U MOBILNI TANK',
      'adjustment_plus': 'KOREKCIJA POZITIVNA (+)',
      'adjustment_minus': 'KOREKCIJA NEGATIVNA (-)',
      'fuel_drain': 'DRENIRANO GORIVO',
      'fuel_return': 'POVRAT FILTRIRANOG GORIVA',
      'internal_transfer_in': 'INTERNI ULAZ',
      'internal_transfer_out': 'INTERNI IZLAZ'
      // Dodajte ostale tipove ako postoje
    };

    // Tablica transakcija
    const tableColumn = ["Datum i vrijeme", "Tip", "Količina (L)", "Dokument", "Izvor/Dest.", "Napomene"];
    const tableRows = tank.history
      .filter(entry => 
        tank.filterTransactionType === 'all' || !tank.filterTransactionType || entry.type === tank.filterTransactionType
      )
      .map(transaction => {
      const transactionDate = new Date(transaction.transaction_datetime);
      const formattedDateTime = `${transactionDate.toLocaleDateString('hr-HR')} ${transactionDate.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}`;
      
      const transactionTypeDisplay = transactionTypeMap[transaction.type] || transaction.type.toUpperCase();

      // Poboljšano formatiranje brojeva
      const quantity = transaction.quantityLiters;
      const formattedQuantity = quantity.toFixed(2); 
      
      let quantityPrefix = '';
      if (transaction.type === 'intake' || transaction.type === 'fuel_return') {
        quantityPrefix = '+';
      } else if (transaction.type === 'transfer_to_mobile' || transaction.type === 'fuel_drain') {
        quantityPrefix = '-';
      }

      return [
        formattedDateTime,
        transactionTypeDisplay,
        { 
          content: quantityPrefix + formattedQuantity + ' L', 
          styles: { halign: 'right' as const } 
        },
        transaction.relatedDocument || '-',
        transaction.sourceOrDestination || '-',
        transaction.notes || '-'
      ];
    });

    // Poziv autoTable kao funkcije
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows as any, 
      startY: 60,
      theme: 'grid', 
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: [255, 255, 255], 
        // fontStyle: 'bold',
      },
      willDrawCell: (data) => {
        if (data.section === 'head') {
          try {
            doc.setFont(FONT_NAME, 'bold'); 
          } catch (e) {
            console.error("Greška pri postavljanja bold fonta za zaglavlje:", e);
          }
        }
      },
      didDrawCell: (data) => {
        // Vrati na normalni font za tijelo tablice NAKON što je ćelija (ili red) zaglavlja iscrtana
        // Ovo osigurava da ostatak dokumenta koristi regular font ako nije drugačije specificirano
        if (data.section === 'head' || data.section === 'body') { 
          try {
            doc.setFont('NotoSans', 'normal'); 
          } catch (e) {
            console.error("Greška pri vraćanju na normalni font:", e);
          }
        }
      },
      columnStyles: {
        0: { cellWidth: 35 }, 
        1: { cellWidth: 50 }, 
        2: { cellWidth: 25, halign: 'right' }, 
        3: { cellWidth: 'auto' }, 
        4: { cellWidth: 'auto' }, 
        5: { cellWidth: 'auto' }, 
      },
      didDrawPage: (data) => {
        // Footer - Broj stranice
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        try {
          doc.setFont('NotoSans', 'normal');
        } catch (e) {
          console.error("Greška pri postavljanju fonta za podnožje:", e);
        }
        doc.text(
          'Stranica ' + String(data.pageNumber) + ' od ' + String(pageCount),
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });
    
    doc.save(`izvjestaj_rezervoar_${tank.tank_identifier}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <span className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium">Učitavanje izvještaja o fiksnim tankovima...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-xl shadow-md">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-red-600 dark:text-red-400 font-medium">Greška: {error}</span>
      </div>
    </div>
  );
  
  if (tanks.length === 0) return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-xl shadow-md">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-blue-600 dark:text-blue-400 font-medium">Nema dostupnih fiksnih tankova.</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      {/* Header with black glassmorphism effect */}
      <div className="p-6 text-white relative overflow-hidden">
        {/* Black glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 z-0"></div>
        {/* Glass highlight effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-0"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Izvještaj o Fiksnim Rezervoarima Goriva</h2>
            <p className="mt-1 text-indigo-100 text-sm">Pregled stanja i historije transakcija fiksnih rezervoara</p>
          </div>
          <div className="bg-white/10 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid gap-6">
          {tanks.map(tank => {
            // Calculate fill percentage for visual indicator
            const fillPercentage = tank.capacity_liters > 0 && typeof tank.current_quantity_liters === 'number' 
              ? Math.min(100, (tank.current_quantity_liters / tank.capacity_liters) * 100) 
              : 0;
              
            // Determine color based on fill level
            const fillColorClass = fillPercentage < 20 
              ? 'bg-red-500' 
              : fillPercentage < 50 
                ? 'bg-yellow-500' 
                : 'bg-green-500';
                
            return (
              <div 
                key={tank.id} 
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden"
              >
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {tank.tank_name}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 hover:bg-indigo-200">
                          {tank.fuel_type}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200">
                          Kapacitet: {tank.capacity_liters.toLocaleString()} L
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Lokacija: {tank.location_description || 'Nije specificirana'}
                      </p>
                      <div className="mb-2 md:mb-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Identifikacioni Dokument</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {tank.identificationDocumentUrl ? (
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${tank.identificationDocumentUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
                            >
                              Pogledaj Dokument
                            </a>
                          ) : (
                            'Nema dokumenta'
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Fill level indicator */}
                      {typeof tank.current_quantity_liters === 'number' && (
                        <div className="hidden sm:flex flex-col items-center">
                          <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${fillColorClass} rounded-full`} 
                              style={{ width: `${fillPercentage}%` }}
                            ></div>
                          </div>
                          <span className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                            {fillPercentage.toFixed(0)}% puno
                          </span>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => toggleHistory(tank.id)} 
                        variant="outline" 
                        size="sm"
                        className="transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                      >
                        {tank.showHistory 
                          ? <ChevronUp className="h-4 w-4 mr-1" /> 
                          : <ChevronDown className="h-4 w-4 mr-1" />
                        }
                        {tank.historyLoading 
                          ? 'Učitavanje...' 
                          : (tank.showHistory ? 'Sakrij Historiju' : 'Prikaži Historiju')
                        }
                      </Button>
                    </div>
                  </div>
                  
                  {/* Current quantity display */}
                  {typeof tank.current_quantity_liters === 'number' && (
                    <div className="mt-4 flex items-center">
                      <div className="flex-1">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {tank.current_quantity_liters.toLocaleString()}
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">L</span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-500">
                            trenutno stanje
                          </span>
                        </div>
                        
                        {/* Mobile-only progress bar */}
                        <div className="mt-2 sm:hidden w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${fillColorClass} rounded-full`} 
                            style={{ width: `${fillPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* History section */}
                {tank.showHistory && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {/* Loading state */}
                    {tank.historyLoading && (
                      <div className="p-8 flex justify-center items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span className="ml-3 text-gray-600 dark:text-gray-400">Učitavanje historije...</span>
                      </div>
                    )}
                    
                    {/* Error state */}
                    {tank.errorHistory && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                        <div className="flex items-center text-red-600 dark:text-red-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Greška: {tank.errorHistory}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* History content */}
                    {!tank.historyLoading && !tank.errorHistory && (
                      <>
                        {/* Filter controls */}
                        <CardContent>
                          {/* Filters Row */}
                          <div className="flex md:flex-row flex-col md:space-x-2 md:space-y-0 space-y-2 mb-4 items-end">
                            {/* Start Date Filter */}
                            <div className="flex-1">
                              <label htmlFor={`start-date-${tank.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Početni datum:
                              </label>
                              <Input 
                                type="date" 
                                id={`start-date-${tank.id}`}
                                value={tank.filterStartDate || ''} 
                                onChange={(e) => handleFilterDateChange(tank.id, 'startDate', e.target.value)}
                                className="w-full"
                              />
                            </div>
                            {/* End Date Filter */}
                            <div className="flex-1">
                              <label htmlFor={`end-date-${tank.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Krajnji datum:
                              </label>
                              <Input 
                                type="date" 
                                id={`end-date-${tank.id}`}
                                value={tank.filterEndDate || ''} 
                                onChange={(e) => handleFilterDateChange(tank.id, 'endDate', e.target.value)}
                                className="w-full"
                              />
                            </div>
                            {/* Transaction Type Filter */}
                            <div className="flex-1 md:mt-0 mt-2">
                              <label htmlFor={`filter-type-${tank.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tip transakcije:
                              </label>
                              <Select
                                value={tank.filterTransactionType || 'all'}
                                onValueChange={(value) => handleFilterTransactionTypeChange(tank.id, value as TankTransaction['type'] | 'all')}
                              >
                                <SelectTrigger id={`filter-type-${tank.id}`} className="w-full">
                                  <SelectValue placeholder="Svi tipovi" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Svi tipovi</SelectItem>
                                  <SelectItem value="intake">Ulaz</SelectItem>
                                  <SelectItem value="transfer_to_mobile">Izlaz (Mob.)</SelectItem>
                                  <SelectItem value="fuel_drain">Drenirano</SelectItem>
                                  <SelectItem value="fuel_return">Povrat filtriranog goriva</SelectItem>
                                  <SelectItem value="internal_transfer_in">Interni Ulaz</SelectItem>
                                  <SelectItem value="internal_transfer_out">Interni Izlaz</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex items-end space-x-2 md:mt-0 mt-2">
                              <Button onClick={() => toggleHistory(tank.id, true)} size="sm" variant="outline">
                                <Filter size={16} className="mr-2" />
                                Primijeni Filtere i Osvježi
                              </Button>
                              {tank.history && tank.history.length > 0 && (
                                <Button onClick={() => handleExportToPdf(tank)} size="sm" variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white">
                                  <FileDown size={16} className="mr-2" />
                                  Izvezi u PDF
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>

                        {/* No data message */}
                        {(!tank.history || tank.history.length === 0) ? (
                          <div className="p-8 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-4 text-gray-600 dark:text-gray-400">Nema historije transakcija za odabrani period.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow><TableHead className="w-[150px]">Datum i Vrijeme</TableHead><TableHead className="w-[100px]">Tip</TableHead><TableHead className="text-right w-[120px]">Količina (L)</TableHead><TableHead>Izvor/Odredište</TableHead><TableHead>Napomene/Dokument</TableHead></TableRow>
                              </TableHeader>
                              <TableBody>
                                {tank.history
                                  .filter(entry => 
                                    tank.filterTransactionType === 'all' || !tank.filterTransactionType || entry.type === tank.filterTransactionType
                                  )
                                  .map(entry => {
                                    // DEBUGGING: Log entry and transaction_datetime
                                    if (!entry.transaction_datetime || isNaN(new Date(entry.transaction_datetime as string | number | Date).getTime())) {
                                      console.log('FixedTanksReport - Invalid or missing transaction_datetime. Entry:', entry, 'transaction_datetime:', entry.transaction_datetime);
                                    }
                                    // END DEBUGGING
                                    return (
                                      <TableRow key={entry.id}><TableCell>
                                        {entry.transaction_datetime && !isNaN(new Date(entry.transaction_datetime as string | number | Date).getTime()) 
                                          ? format(new Date(entry.transaction_datetime as string | number | Date), 'dd.MM.yyyy HH:mm') 
                                          : 'Nevažeći datum'}
                                      </TableCell><TableCell>
                                        <Badge 
                                          className={entry.type === 'intake' 
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200' 
                                            : entry.type === 'transfer_to_mobile' 
                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200' 
                                              : entry.type === 'fuel_drain'
                                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                              : entry.type === 'fuel_return'
                                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                              : entry.type === 'internal_transfer_in'
                                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200'
                                              : entry.type === 'internal_transfer_out'
                                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200'
                                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200'}
                                        >
                                          {entry.type === 'intake' ? 'ULAZ' 
                                            : entry.type === 'transfer_to_mobile' ? 'IZLAZ (MOB.)' 
                                            : entry.type === 'fuel_drain' ? 'DRENIRANO' 
                                            : entry.type === 'fuel_return' ? 'POVRAT FILTRIRANOG GORIVA'
                                            : entry.type === 'internal_transfer_in' ? 'INTERNI ULAZ'
                                            : entry.type === 'internal_transfer_out' ? 'INTERNI IZLAZ'
                                            : entry.type.toUpperCase()}
                                        </Badge>
                                      </TableCell><TableCell className="text-right font-medium">
                                        <span className={
                                          entry.type === 'intake' ? 'text-emerald-600 dark:text-emerald-400' 
                                          : entry.type === 'transfer_to_mobile' || entry.type === 'fuel_drain' ? 'text-red-600 dark:text-red-400' 
                                          : entry.type === 'fuel_return' ? 'text-green-600 dark:text-green-400'
                                          : entry.type === 'internal_transfer_in' ? 'text-blue-600 dark:text-blue-400'
                                          : entry.type === 'internal_transfer_out' ? 'text-orange-600 dark:text-orange-400'
                                          : 'text-gray-700 dark:text-gray-300' 
                                        }>
                                          {entry.type === 'intake' || entry.type === 'fuel_return' ? '+' : entry.type === 'transfer_to_mobile' || entry.type === 'fuel_drain' ? '-' : ''}{entry.quantityLiters.toFixed(2)} L
                                        </span>
                                      </TableCell><TableCell>{entry.sourceOrDestination || 'N/A'}</TableCell><TableCell>
                                        {
                                          (entry.type === 'internal_transfer_in' && entry.notes === 'Internal transfer in')
                                            ? 'Interni prijem goriva'
                                            : (entry.type === 'internal_transfer_out' && entry.notes === 'Internal transfer out')
                                              ? 'Interni izdatak goriva'
                                              : entry.notes || entry.relatedDocument || '-'
                                        }
                                      </TableCell></TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-12 pt-8 border-t">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Sažetak Stanja Goriva tipa JET A-1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 flex items-center">
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
              <div className="mt-4">
                {summaryLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                  </div>
                ) : summaryError ? (
                  <div className="text-red-600 dark:text-red-400 py-2">
                    {summaryError}
                  </div>
                ) : fuelSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Fiksni Tankovi</div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {fuelSummary.fixedTanksTotal.toLocaleString('bs-BA')} L
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-sm">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobilni Tankovi</div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {fuelSummary.mobileTanksTotal.toLocaleString('bs-BA')} L
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg shadow-sm">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Ukupno</div>
                      <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {fuelSummary.grandTotal.toLocaleString('bs-BA')} L
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                    Nije moguće učitati podatke o ukupnom stanju goriva.
                  </div>
                )}
              </div>
            </div>
            
            <hr className="my-6 border-gray-300 dark:border-gray-600" />
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">Ukupan ulaz goriva (po periodu):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <label htmlFor="totalIntakeStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Od datuma:</label>
                  <Input
                    type="date"
                    id="totalIntakeStartDate"
                    value={totalIntakeStartDate}
                    onChange={(e) => setTotalIntakeStartDate(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label htmlFor="totalIntakeEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Do datuma:</label>
                  <Input
                    type="date"
                    id="totalIntakeEndDate"
                    value={totalIntakeEndDate}
                    onChange={(e) => setTotalIntakeEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
              <Button onClick={fetchCombinedIntakeData} disabled={totalIntakeLoading || !totalIntakeStartDate || !totalIntakeEndDate} className="mt-4 w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                {totalIntakeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />} 
                Osvježi Ukupan Ulaz
              </Button>
              
              {totalIntakeLoading && (
                <div className="mt-4 flex items-center justify-center text-gray-500 dark:text-gray-400 py-3">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Dohvaćam ukupan ulaz...</span>
                </div>
              )}
              {totalIntakeError && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400 rounded-md">
                  <p>Greška: {totalIntakeError}</p>
                </div>
              )}
              {!totalIntakeLoading && totalIntakeAmount !== null && !totalIntakeError && (
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-4">
                  {totalIntakeAmount.toFixed(2)} L
                </p>
              )}
              {!totalIntakeLoading && totalIntakeAmount === null && !totalIntakeError && totalIntakeStartDate && totalIntakeEndDate && (
                 <p className="mt-4 text-gray-500 dark:text-gray-400 py-3">Nema podataka o ulazu za odabrani period ili datumi nisu validni.</p>
              )}
               {!totalIntakeLoading && totalIntakeAmount === null && !totalIntakeError && (!totalIntakeStartDate || !totalIntakeEndDate) && (
                 <p className="mt-4 text-gray-500 dark:text-gray-400 py-3">Molimo odaberite period za prikaz ukupnog ulaza.</p>
              )}
            </div>

            {/* Section for Combined Intake List */}
            {(totalIntakeStartDate && totalIntakeEndDate) && (
              <AllIntakesList 
                startDate={totalIntakeStartDate} 
                endDate={totalIntakeEndDate} 
                title="Lista Svih Prijema Goriva u Fiksne Rezervoare (za odabrani period)"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
