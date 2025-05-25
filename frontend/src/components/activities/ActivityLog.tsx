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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Evidencija Aktivnosti</h1>
      
      {/* Filters */}
      <ActivityFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        actionTypes={actionTypes}
        resourceTypes={resourceTypes}
      />
      
      {/* Activity Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">{error}</div>
      ) : activities.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <p className="text-lg">Nema aktivnosti koje odgovaraju zadanim filterima</p>
        </div>
      ) : (
        <>
          <ActivityTable activities={activities} />
          
          {/* Pagination */}
          <div className="mt-6">
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
