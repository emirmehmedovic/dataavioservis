'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLocations } from '@/lib/apiService';
import { Location } from '@/types';
import withAuth from '@/components/auth/withAuth';
import { FaPlus, FaMapMarkerAlt, FaExclamationTriangle, FaBuilding, FaEdit, FaAddressCard } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const LocationsPage = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const data = await getLocations();
        setLocations(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch locations:', err);
        setError(err.message || 'Došlo je do greške prilikom preuzimanja lokacija.');
      }
      setIsLoading(false);
    };

    fetchLocations();
  }, []);

  if (isLoading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-150px)]">
      <motion.div 
        className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-lg font-medium text-muted-foreground mt-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        Učitavanje podataka o lokacijama...
      </p>
    </div>
  );

  return (
    <motion.div 
      className="space-y-6 p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-10 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-10 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              Lokacije
            </motion.h1>
            <p className="text-sm text-muted-foreground mt-1">Pregled i upravljanje lokacijama</p>
          </div>
          <Link href="/dashboard/locations/new">
            <Button 
              variant="default"
            >
              <FaPlus className="mr-2" />
              Dodaj Novu Lokaciju
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <motion.div 
          className="backdrop-blur-md bg-red-500/10 border border-red-500/30 text-red-700 px-6 py-4 rounded-xl relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          role="alert"
        >
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 mr-3 text-red-500" />
            <strong className="font-bold mr-2">Greška!</strong>
            <span className="block">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Locations List */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-5 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          {locations.length === 0 && !isLoading ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                <FaMapMarkerAlt className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Nema dostupnih lokacija
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-2">
                Nema unesenih lokacija. Kliknite na dugme iznad da dodate novu.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Naziv Lokacije</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Adresa</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">PDV Broj Kompanije</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location, index) => (
                    <motion.tr 
                      key={location.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                            <FaMapMarkerAlt className="text-blue-500/80" />
                          </div>
                          <span className="font-medium text-gray-700">{location.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaAddressCard className="mr-2 text-gray-400" />
                          <span className="text-gray-600">{location.address || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaBuilding className="mr-2 text-gray-400" />
                          <span className="text-gray-600">{location.companyTaxId || '-'}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default withAuth(LocationsPage, ['ADMIN', 'SERVICER', 'FUEL_USER']);
