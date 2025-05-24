'use client';

import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import components with no SSR
const TankManagement = dynamic(() => import('@/components/fuel/TankManagement'), { ssr: false });
const FuelingOperations = dynamic(() => import('@/components/fuel/FuelingOperations'), { ssr: false });
const DrainedFuelOperations = dynamic(() => import('@/components/fuel/DrainedFuelOperations'), { ssr: false });
const AirlineManagement = dynamic(() => import('@/components/fuel/AirlineManagement'), { ssr: false });
const FuelReports = dynamic(() => import('@/components/fuel/FuelReports'), { ssr: false });
const FixedTanksDisplay = dynamic(() => import('@/components/fuel/FixedTanksDisplay'), { ssr: false });
const FuelIntakeDisplay = dynamic(() => import('@/components/fuel/FuelIntakeDisplay'), { ssr: false });
const FuelPrices = dynamic(() => import('@/components/fuel/FuelPrices'), { ssr: false });

// Define the valid category IDs as a type
type CategoryId = 'fixed-tanks' | 'tanks' | 'fuel-intake' | 'fueling' | 'drained-fuel' | 'airlines' | 'reports' | 'fuel-prices';

// SVG Icons for categories with proper typing
const CategoryIcons: Record<CategoryId, React.ReactNode> = {
  'fixed-tanks': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 10V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V10M20 10V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V10M20 10H4M8 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 10V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'fuel-prices': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 8L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'tanks': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8H21L19 16H5L3 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 8V6C7 4.89543 7.89543 4 9 4H15C16.1046 4 17 4.89543 17 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="17" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  'fuel-intake': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 10C20 10 18 14 12 14C6 14 4 10 4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'fueling': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 20V4M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 14C20 14 18 10 12 10C6 10 4 14 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'drained-fuel': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 21L17 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 21L12 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 13L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 13L8 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 8C20 8 18 4 12 4C6 4 4 8 4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  'airlines': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19L13 4.00001L20 14.5L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 4L9.04401 13.1224C9.01443 13.1921 9.01443 13.2685 9.04401 13.3382L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 19L11 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'reports': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 12V3M12 12L9 9M12 12L15 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// No animated fuel drop component

export default function FuelManagement() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading for animation purposes
    setIsLoaded(true);
  }, []);

  // Define the category structure with proper typing
  type CategoryDetails = {
    id: CategoryId;
    description: string;
  };

  const categories: Record<string, CategoryDetails> = {
    'Rezervoari': { id: 'fixed-tanks', description: 'Upravljanje fiksnim rezervoarima za gorivo' },
    'Avio cisterne': { id: 'tanks', description: 'Pregled i upravljanje mobilnim cisternama' },
    'Ulaz Goriva': { id: 'fuel-intake', description: 'Evidencija ulaza goriva u skladište' },
    'Izlaz goriva': { id: 'fueling', description: 'Operacije točenja goriva u avione' },
    'Drenirano gorivo': { id: 'drained-fuel', description: 'Istakanja goriva iz fiksnih rezervoara i mobilnih aviocisternih' },
    'Avio Kompanije': { id: 'airlines', description: 'Upravljanje podacima avio kompanija' },
    'Statistika': { id: 'reports', description: 'Izvještaji i analitika potrošnje' },
    'Cijene goriva': { id: 'fuel-prices', description: 'Praćenje cijena nafte i tečajeva' },
  };

  // No animated background elements

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Main content */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {/* Header section removed as requested */}

        {/* Main Tab Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100"
        >
          <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
            <div className="bg-gradient-to-r from-black/40 via-black/60 to-black/40 backdrop-blur-xl border border-white/20 p-1 rounded-t-xl shadow-inner overflow-hidden relative">
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
              <Tab.List className="flex gap-1 overflow-x-auto">
                {Object.entries(categories).map(([category, { id }], idx) => (
                  <Tab
                    key={id}
                    className={({ selected }) =>
                      classNames(
                        'px-6 py-4 text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-2',
                        'focus:outline-none',
                        selected
                          ? 'bg-white text-[#E60026] rounded-t-lg shadow-lg'
                          : 'text-white hover:bg-white/10 hover:text-[#E60026]/80 rounded-t-lg'
                      )
                    }
                  >
                    <span className="text-current">{CategoryIcons[id as CategoryId]}</span>
                    <span>{category}</span>
                  </Tab>
                ))}
              </Tab.List>
            </div>

            {/* Tab content with animations */}
            <Tab.Panels>
              <AnimatePresence mode="wait">
                <Tab.Panel key="fixed-tanks" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FixedTanksDisplay />
                  </motion.div>
                </Tab.Panel>

                <Tab.Panel key="tanks" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TankManagement />
                  </motion.div>
                </Tab.Panel>

                <Tab.Panel key="fuel-intake" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FuelIntakeDisplay />
                  </motion.div>
                </Tab.Panel>
                
                <Tab.Panel key="fueling" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FuelingOperations />
                  </motion.div>
                </Tab.Panel>
                
                <Tab.Panel key="drained-fuel" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DrainedFuelOperations />
                  </motion.div>
                </Tab.Panel>
                
                <Tab.Panel key="airlines" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AirlineManagement />
                  </motion.div>
                </Tab.Panel>
                
                <Tab.Panel key="reports" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FuelReports />
                  </motion.div>
                </Tab.Panel>
                
                <Tab.Panel key="fuel-prices" className="p-8 focus:outline-none">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FuelPrices />
                  </motion.div>
                </Tab.Panel>
              </AnimatePresence>
            </Tab.Panels>
          </Tab.Group>
        </motion.div>

        {/* Footer removed */}
      </div>
    </div>
  );
}