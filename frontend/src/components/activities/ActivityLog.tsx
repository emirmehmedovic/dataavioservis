import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/apiService';
import { toast } from 'react-hot-toast';
import ActivityFilters from './ActivityFilters';
import ActivityTable from './ActivityTable';
import Pagination from '../common/Pagination';

// Types
interface Activity {
  id: number;
  timestamp: string;
  userId: number | null;
  username: string;
  actionType: string;
  resourceType: string;
  resourceId: number | null;
  description: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: number;
    username: string;
    role: string;
  } | null;
}

interface ActivityResponse {
  activities: Activity[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const ActivityLog: React.FC = () => {
  // State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    username: '',
    actionType: '',
    resourceType: '',
    resourceId: '',
  });
  
  // Filter visibility state
  const [showFilters, setShowFilters] = useState(false);

  // Fetch activity types for filter options
  useEffect(() => {
    const fetchActivityTypes = async () => {
      try {
        const response = await fetchWithAuth<{ actionTypes: string[], resourceTypes: string[] }>('/api/activities/types');
        setActionTypes(response.actionTypes);
        setResourceTypes(response.resourceTypes);
      } catch (err) {
        console.error('Error fetching activity types:', err);
        toast.error('Greška pri dohvaćanju tipova aktivnosti');
      }
    };

    fetchActivityTypes();
  }, []);

  // Fetch activities with pagination and filters
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query params
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
        
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.username) params.append('username', filters.username);
        if (filters.actionType) params.append('actionType', filters.actionType);
        if (filters.resourceType) params.append('resourceType', filters.resourceType);
        if (filters.resourceId) params.append('resourceId', filters.resourceId);

        const response = await fetchWithAuth<ActivityResponse>(`/api/activities?${params.toString()}`);
        
        setActivities(response.activities);
        setTotalPages(response.pagination.pages);
        setTotalItems(response.pagination.total);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Greška pri dohvaćanju aktivnosti');
        toast.error('Greška pri dohvaćanju aktivnosti');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currentPage, itemsPerPage, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Stats and Filter Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
        <div className="flex items-center space-x-4 mb-3 sm:mb-0">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-lg p-2">
            <div className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">Ukupno zapisa</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-200">{totalItems}</div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
            <div className="text-xs text-blue-600 dark:text-blue-300 font-medium">Stranica</div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-200">{currentPage} / {totalPages || 1}</div>
          </div>
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {showFilters ? 'Sakrij filtere' : 'Prikaži filtere'}
        </button>
      </div>
      
      {/* Filters - Collapsible */}
      {showFilters && (
        <div className="border-b border-gray-100 dark:border-gray-700">
          <ActivityFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            actionTypes={actionTypes}
            resourceTypes={resourceTypes}
          />
        </div>
      )}
      
      {/* Activity Table */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Učitavanje aktivnosti...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64 p-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-red-600 dark:text-red-400 font-medium">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Molimo pokušajte ponovo kasnije</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col justify-center items-center h-64 p-6">
          <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="mt-3 text-gray-700 dark:text-gray-300 font-medium">Nema rezultata</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nema aktivnosti koje odgovaraju zadanim filterima</p>
        </div>
      ) : (
        <>
          <ActivityTable activities={activities} />
          
          {/* Pagination */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/80">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityLog;
