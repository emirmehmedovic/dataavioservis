'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Company } from '@/types';
import { getCompanies, deleteCompany } from '@/lib/apiService';
import withAuth from '@/components/auth/withAuth';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimesCircle, FaBuilding, FaCar, FaExclamationTriangle } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal'; 
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const data = await getCompanies();
        setCompanies(data);
        setFilteredCompanies(data);
      } catch (err: any) {
        console.error('Failed to fetch companies', err);
        const errorMessage = err.message || 'Greška prilikom dobavljanja firmi.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    const results = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(results);
  }, [searchTerm, companies]);

  const openDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteCompany(companyToDelete.id);
      setCompanies(prevCompanies => prevCompanies.filter(comp => comp.id !== companyToDelete.id));
      toast.success(`Firma "${companyToDelete.name}" uspješno obrisana.`);
    } catch (err: any) {
      console.error('Failed to delete company', err);
      const errorMessage = err.message || 'Greška prilikom brisanja firme.';
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
      setShowConfirmModal(false);
      setCompanyToDelete(null);
    }
  };

  if (loading && companies.length === 0) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-150px)]">
      <motion.div 
        className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-lg font-medium text-muted-foreground mt-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        Učitavanje podataka o firmama...
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
              Firme
            </motion.h1>
            <p className="text-sm text-muted-foreground mt-1">Upravljajte firmama i njihovim vozilima</p>
          </div>
          <Link href="/dashboard/companies/new">
            <Button 
              variant="default"
            >
              <FaPlus className="mr-2 h-4 w-4" /> {/* Ikona kao dijete */}
              Dodaj Novu Firmu
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

      {/* Search Box */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-md rounded-xl p-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
        
        <div className="relative z-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Pretraži firme po nazivu..."
              className="w-full py-3 px-4 pr-12 text-gray-700 bg-white/80 backdrop-blur-md rounded-lg border border-white/20 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {searchTerm ? (
                <FaTimesCircle 
                  className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  onClick={() => setSearchTerm('')}
                />
              ) : (
                <FaSearch className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="relative overflow-hidden border border-white/10 backdrop-blur-md bg-gradient-to-br from-white/60 to-white/20 shadow-lg rounded-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full filter blur-3xl opacity-5 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full filter blur-3xl opacity-5 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          {filteredCompanies.length === 0 && !loading ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                <FaBuilding className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Nema pronađenih firmi
              </h3>
              {companies.length > 0 && searchTerm && (
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  Pokušajte sa drugim terminom pretrage.
                </p>
              )}
              {companies.length === 0 && !searchTerm && (
                <p className="text-muted-foreground max-w-md mx-auto mb-2">
                  Nema unesenih firmi. Kliknite na dugme iznad da dodate novu.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Naziv Firme</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">Broj Vozila</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company, index) => (
                    <motion.tr 
                      key={company.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-colors duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaBuilding className="mr-3 text-blue-500/80" />
                          <span className="font-medium text-gray-700">{company.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-full px-3 py-1 inline-flex items-center">
                            <FaCar className="mr-2 text-blue-500/80 h-3 w-3" />
                            <span className="text-gray-700">{company.vehicles ? company.vehicles.length : '0'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Link href={`/dashboard/companies/edit/${company.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-500 hover:text-blue-600 border border-white/10 hover:bg-blue-500/10"
                              aria-label="Uredi firmu"
                            >
                              <FaEdit size={16} />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 border border-white/10 hover:bg-red-500/10"
                            onClick={() => openDeleteModal(company)}
                            aria-label="Obriši firmu"
                          >
                            <FaTrash size={16} />
                          </Button>
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

      {showConfirmModal && companyToDelete && (
        <ConfirmModal
          title={`Potvrdi Brisanje Firme`}
          message={`Da li ste sigurni da želite obrisati firmu "${companyToDelete.name}"? Ova akcija je nepovratna.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirmModal(false)}
          confirmButtonText="Obriši"
          cancelButtonText="Otkaži"
          isLoading={deleteLoading}
        />
      )}
    </motion.div>
  );
};

// Protect page and specify allowed roles (e.g., ADMIN for full access, others for view only)
// For now, allowing ADMIN, SERVICER, FUEL_USER to view. Edit/Delete/Add will be ADMIN only on respective pages/actions.
export default withAuth(CompaniesPage, ['ADMIN', 'SERVICER', 'FUEL_USER']);
