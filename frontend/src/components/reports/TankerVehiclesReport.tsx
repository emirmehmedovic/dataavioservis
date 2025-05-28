import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Loader2, TruckIcon, GaugeIcon, MapPinIcon, DropletIcon } from 'lucide-react';

interface TankerVehicle {
  id: number;
  identifier: string;
  name: string;
  location: string;
  capacity_liters: number;
  current_liters: number;
  fuel_type: string;
}

const TankerVehiclesReport: React.FC = () => {
  const [tankers, setTankers] = useState<TankerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTankerData = async () => {
      try {
        setLoading(true);
        const data = await fetchWithAuth<TankerVehicle[]>('/api/fuel/tanks');
        setTankers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tanker vehicles report data:', err);
        setError('Greška pri učitavanju podataka o cisternama.');
        if (err instanceof Error) {
            toast.error(`Greška: ${err.message}`);
        } else {
            toast.error('Dogodila se nepoznata greška.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTankerData();
  }, []);

  const getFillPercentage = (current: number, capacity: number) => {
    if (capacity === 0) return 0;
    return ((current / capacity) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 20) return 'bg-red-500 dark:bg-red-600';
    if (percentage < 50) return 'bg-amber-500 dark:bg-amber-600';
    return 'bg-emerald-500 dark:bg-emerald-600';
  };
  
  const getStatusColorClass = (percentage: number) => {
    if (percentage < 20) return 'text-red-600 dark:text-red-400';
    if (percentage < 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#e53e3e]" />
            <span className="mt-4 text-[#e53e3e] font-medium">Učitavanje podataka o cisternama...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 m-6 rounded-md">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-red-600 dark:text-red-400 font-medium">{error}</span>
          </div>
        </div>
      </div>
    );
  }

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
              <TruckIcon className="h-8 w-8 mr-3 text-[#e53e3e]" />
              Izvještaj o Stanju Avio Cisterni
            </h2>
            <p className="text-gray-300 mt-1 ml-11">Pregled trenutnog stanja mobilnih cisterni za gorivo</p>
          </div>
        </div>
      </div>
      
      {tankers.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <TruckIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nema podataka o cisternama</h3>
          <p className="text-gray-500 dark:text-gray-400">Trenutno nema dostupnih podataka o avio cisternama.</p>
        </div>
      ) : (
        <div className="p-6">
          {/* Summary cards - Glassmorphism style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="relative backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#e53e3e] rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
              <div className="flex items-center relative z-10">
                <div className="bg-[#e53e3e]/20 p-3 rounded-xl mr-4 border border-white/10">
                  <TruckIcon className="h-5 w-5 text-[#e53e3e]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Ukupno cisterni</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{tankers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="relative backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4FC3C7] rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
              <div className="flex items-center relative z-10">
                <div className="bg-[#4FC3C7]/20 p-3 rounded-xl mr-4 border border-white/10">
                  <DropletIcon className="h-5 w-5 text-[#4FC3C7]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Ukupni kapacitet</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {tankers.reduce((sum, tanker) => sum + tanker.capacity_liters, 0).toLocaleString()} L
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FBBF24] rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
              <div className="flex items-center relative z-10">
                <div className="bg-[#FBBF24]/20 p-3 rounded-xl mr-4 border border-white/10">
                  <GaugeIcon className="h-5 w-5 text-[#FBBF24]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Trenutno goriva</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {tankers.reduce((sum, tanker) => sum + tanker.current_liters, 0).toLocaleString()} L
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative backdrop-blur-md bg-white/10 dark:bg-gray-800/30 rounded-xl p-4 border border-white/20 shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6] rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
              <div className="flex items-center relative z-10">
                <div className="bg-[#8B5CF6]/20 p-3 rounded-xl mr-4 border border-white/10">
                  <GaugeIcon className="h-5 w-5 text-[#8B5CF6]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Prosječna popunjenost</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {(tankers.reduce((sum, tanker) => {
                      return sum + getFillPercentage(tanker.current_liters, tanker.capacity_liters);
                    }, 0) / tankers.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Data table */}
          <div className="overflow-x-auto rounded-xl border border-white/20 backdrop-blur-md bg-white/5 dark:bg-gray-800/30 shadow-lg">
            <Table>
              <TableHeader>
                <TableRow><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10">Identifikator</TableHead><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10">Naziv</TableHead><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10">Lokacija</TableHead><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10">Tip Goriva</TableHead><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10 text-right">Kapacitet (L)</TableHead><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10 text-right">Trenutno (L)</TableHead><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10 text-right">Popunjenost</TableHead><TableHead className="bg-gradient-to-br from-[#2c2c2c] to-[#1a1a1a] text-white border-b border-white/10 text-center">Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {tankers.map((tanker) => {
                  const fillPercentage = getFillPercentage(tanker.current_liters, tanker.capacity_liters);
                  return (
                    <TableRow key={tanker.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="font-medium">{tanker.identifier}</TableCell>
                      <TableCell>{tanker.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>{tanker.location || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="backdrop-blur-md bg-[#3B82F6]/30 border border-white/20 text-white shadow-sm hover:bg-[#3B82F6]/40">
                          {tanker.fuel_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{tanker.capacity_liters.toLocaleString()} L</TableCell>
                      <TableCell className="text-right font-medium">{tanker.current_liters.toLocaleString()} L</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <span className={`mr-2 font-medium ${getStatusColorClass(fillPercentage)}`}>
                            {fillPercentage.toFixed(1)}%
                          </span>
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getStatusColor(fillPercentage)}`} 
                              style={{ width: `${fillPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`backdrop-blur-md border border-white/20 shadow-sm ${fillPercentage < 20 ? 'bg-[#e53e3e]/30 text-white' : fillPercentage < 50 ? 'bg-[#FBBF24]/30 text-white' : 'bg-[#4FC3C7]/30 text-white'}`}>
                          {fillPercentage < 20 ? 'Nisko' : fillPercentage < 50 ? 'Srednje' : 'Dobro'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TankerVehiclesReport;
