'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import FixedTanksReport from '@/components/reports/FixedTanksReport';
import TankerVehiclesReport from '@/components/reports/TankerVehiclesReport';
import FuelIntakeReport from '@/components/reports/FuelIntakeReport';
import FuelOperationsReport from '@/components/reports/FuelOperationsReport';
import FuelReports from '../../../../components/fuel/FuelReports';
import FuelDrainReport from '@/components/reports/FuelDrainReport';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  TruckIcon, 
  BeakerIcon,
  ArrowsRightLeftIcon,
  DocumentDuplicateIcon,
  ArchiveBoxXMarkIcon
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const { authUser, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('fixed-tanks');

  useEffect(() => {
    if (!isLoading && authUser) {
      if (authUser.role !== 'ADMIN' && authUser.role !== 'KONTROLA') {
        router.push('/dashboard'); // Or a dedicated 'access-denied' page
      }
    }
    if (!isLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, isLoading, router]);

  if (isLoading || (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'KONTROLA'))) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-indigo-200 dark:bg-indigo-700 mb-4"></div>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium">Učitavanje ili provjera pristupa...</p>
        </div>
      </div>
    );
  }

  // Define the tabs for our reports
  const tabs = [
    { id: 'fixed-tanks', label: 'Fiksni Tankovi', icon: <BeakerIcon className="h-5 w-5" /> },
    { id: 'tanker-vehicles', label: 'Avio Cisterne', icon: <TruckIcon className="h-5 w-5" /> },
    { id: 'fuel-intake', label: 'Ulaz Goriva', icon: <ArrowsRightLeftIcon className="h-5 w-5" /> },
    { id: 'fuel-operations', label: 'Operacije Točenja', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'drained-fuel', label: 'Drenirano Gorivo', icon: <ArchiveBoxXMarkIcon className="h-5 w-5" /> },
    { id: 'statistika', label: 'Statistika', icon: <DocumentDuplicateIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-12 w-full overflow-x-hidden">
      <div className="px-2 sm:px-4 md:px-6 py-6">
        {/* Header with black glassmorphism effect */}
        <div className="rounded-2xl shadow-xl mb-8 p-6 sm:p-8 text-white relative overflow-hidden">
          {/* Black glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 z-0"></div>
          {/* Glass highlight effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent z-0"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Izvještaji i Statistika</h1>
              <p className="mt-2 text-indigo-100 text-sm sm:text-base">Pregled svih ključnih podataka o gorivu i operacijama</p>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-2 self-start">
              <ChartBarIcon className="h-8 w-8 text-white/90" />
              <span className="text-white font-medium hidden sm:inline">Analitika</span>
            </div>
          </div>
        </div>
        
        {/* Tabbed Navigation - Dodatno optimizirana za mobilne uređaje */}
        <div className="mb-6 overflow-x-auto scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
          <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-md min-w-max w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 whitespace-nowrap flex-shrink-0
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#E60026] to-[#B3001F] text-white shadow-md dark:from-[#B3001F] dark:to-[#800014]'
                    : 'text-gray-600 hover:text-[#E60026] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-[#E60026]'}`}
              >
                <span className="mr-1 sm:mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="inline sm:hidden">{tab.id === 'fuel-operations' ? 'Točenje' : tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab - Responsive container */}
        <div className="transition-all duration-300 max-w-full overflow-hidden">
          {/* Fixed Tanks Tab */}
          {activeTab === 'fixed-tanks' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-0 sm:p-2 md:p-4">
                <FixedTanksReport />
              </div>
            </div>
          )}
          
          {/* Tanker Vehicles Tab */}
          {activeTab === 'tanker-vehicles' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-0 sm:p-2 md:p-4">
                <TankerVehiclesReport />
              </div>
            </div>
          )}
          
          {/* Fuel Intake Tab */}
          {activeTab === 'fuel-intake' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-0 sm:p-2 md:p-4">
                <FuelIntakeReport />
              </div>
            </div>
          )}
          
          {/* Fuel Operations Tab */}
          {activeTab === 'fuel-operations' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-0 sm:p-2 md:p-4">
                <FuelOperationsReport />
              </div>
            </div>
          )}
          
          {/* Drained Fuel Tab */}
          {activeTab === 'drained-fuel' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-0 sm:p-2 md:p-4">
                <FuelDrainReport />
              </div>
            </div>
          )}
          
          {/* Statistika Tab */}
          {activeTab === 'statistika' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-0 sm:p-2 md:p-4">
                <FuelReports />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
