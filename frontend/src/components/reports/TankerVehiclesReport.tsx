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
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 dark:text-purple-400" />
            <span className="mt-4 text-purple-600 dark:text-purple-400 font-medium">Učitavanje podataka o cisternama...</span>
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
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Izvještaj o Stanju Avio Cisterni</h2>
            <p className="mt-1 text-purple-100 text-sm">Pregled trenutnog stanja mobilnih cisterni za gorivo</p>
          </div>
          <div className="bg-white/10 p-3 rounded-full">
            <TruckIcon className="h-8 w-8 text-white" />
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
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center">
                <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-full mr-4">
                  <TruckIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Ukupno cisterni</p>
                  <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{tankers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center">
                <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full mr-4">
                  <DropletIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Ukupni kapacitet</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {tankers.reduce((sum, tanker) => sum + tanker.capacity_liters, 0).toLocaleString()} L
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full mr-4">
                  <GaugeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Trenutno goriva</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {tankers.reduce((sum, tanker) => sum + tanker.current_liters, 0).toLocaleString()} L
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center">
                <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-full mr-4">
                  <MapPinIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Prosječna popunjenost</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {(tankers.reduce((sum, tanker) => {
                      return sum + getFillPercentage(tanker.current_liters, tanker.capacity_liters);
                    }, 0) / tankers.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Data table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow><TableHead className="bg-gray-50 dark:bg-gray-800">Identifikator</TableHead><TableHead className="bg-gray-50 dark:bg-gray-800">Naziv</TableHead><TableHead className="bg-gray-50 dark:bg-gray-800">Lokacija</TableHead><TableHead className="bg-gray-50 dark:bg-gray-800">Tip Goriva</TableHead><TableHead className="bg-gray-50 dark:bg-gray-800 text-right">Kapacitet (L)</TableHead><TableHead className="bg-gray-50 dark:bg-gray-800 text-right">Trenutno (L)</TableHead><TableHead className="bg-gray-50 dark:bg-gray-800 text-right">Popunjenost</TableHead><TableHead className="bg-gray-50 dark:bg-gray-800 text-center">Status</TableHead></TableRow>
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
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">
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
                        <Badge className={`${fillPercentage < 20 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : fillPercentage < 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
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
