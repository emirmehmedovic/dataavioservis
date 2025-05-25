import React from 'react';

interface ActivityFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    username: string;
    actionType: string;
    resourceType: string;
    resourceId: string;
  };
  onFilterChange: (filters: ActivityFiltersProps['filters']) => void;
  actionTypes: string[];
  resourceTypes: string[];
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({ 
  filters, 
  onFilterChange, 
  actionTypes, 
  resourceTypes 
}) => {
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value
    });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    onFilterChange({
      startDate: '',
      endDate: '',
      username: '',
      actionType: '',
      resourceType: '',
      resourceId: '',
    });
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Filteri</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Datum od
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Datum do
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Korisničko ime
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={filters.username}
            onChange={handleInputChange}
            placeholder="Pretraži po korisniku"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        {/* Action Type */}
        <div>
          <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">
            Tip akcije
          </label>
          <select
            id="actionType"
            name="actionType"
            value={filters.actionType}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Sve akcije</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        
        {/* Resource Type */}
        <div>
          <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 mb-1">
            Tip resursa
          </label>
          <select
            id="resourceType"
            name="resourceType"
            value={filters.resourceType}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Svi resursi</option>
            {resourceTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        {/* Resource ID */}
        <div>
          <label htmlFor="resourceId" className="block text-sm font-medium text-gray-700 mb-1">
            ID resursa
          </label>
          <input
            type="number"
            id="resourceId"
            name="resourceId"
            value={filters.resourceId}
            onChange={handleInputChange}
            placeholder="Pretraži po ID-u"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Reset Filters Button */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleResetFilters}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Resetuj filtere
        </button>
      </div>
    </div>
  );
};

export default ActivityFilters;
