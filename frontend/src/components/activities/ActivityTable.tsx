import React, { useState } from 'react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';

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

interface ActivityTableProps {
  activities: Activity[];
}

const ActivityTable: React.FC<ActivityTableProps> = ({ activities }) => {
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

  // Toggle expanded row
  const toggleExpand = (id: number) => {
    if (expandedActivity === id) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(id);
    }
  };

  // Format action type for display
  const formatActionType = (actionType: string) => {
    return actionType.replace(/_/g, ' ');
  };

  // Get badge color based on action type
  const getActionBadgeColor = (actionType: string) => {
    if (actionType.includes('DELETE')) {
      return 'bg-red-100 text-red-800';
    } else if (actionType.includes('CREATE')) {
      return 'bg-green-100 text-green-800';
    } else if (actionType.includes('UPDATE')) {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vrijeme</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Korisnik</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Akcija</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Resurs</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Opis</th>
            <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Detalji</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {activities.map((activity) => (
            <React.Fragment key={activity.id}>
              <tr className={expandedActivity === activity.id ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {format(new Date(activity.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: hr })}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="flex items-center">
                    <div className="font-medium text-gray-900">{activity.username}</div>
                    {activity.user && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {activity.user.role}
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(activity.actionType)}`}>
                    {formatActionType(activity.actionType)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {activity.resourceType}
                  {activity.resourceId && <span className="ml-1 text-xs text-gray-500">#{activity.resourceId}</span>}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 max-w-md truncate">
                  {activity.description}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                  <button
                    onClick={() => toggleExpand(activity.id)}
                    className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                  >
                    {expandedActivity === activity.id ? (
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
              
              {/* Expanded details row */}
              {expandedActivity === activity.id && (
                <tr className="bg-gray-50">
                  <td colSpan={6} className="px-3 py-4">
                    <div className="text-sm">
                      <h4 className="font-medium text-gray-900 mb-2">Detalji aktivnosti</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Osnovne informacije</h5>
                          <dl className="grid grid-cols-3 gap-x-4 gap-y-2">
                            <dt className="text-gray-500">ID:</dt>
                            <dd className="col-span-2 text-gray-900">{activity.id}</dd>
                            
                            <dt className="text-gray-500">Vrijeme:</dt>
                            <dd className="col-span-2 text-gray-900">
                              {format(new Date(activity.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: hr })}
                            </dd>
                            
                            <dt className="text-gray-500">Korisnik:</dt>
                            <dd className="col-span-2 text-gray-900">
                              {activity.username} 
                              {activity.user && <span className="ml-1 text-gray-500">({activity.user.role})</span>}
                            </dd>
                            
                            <dt className="text-gray-500">IP adresa:</dt>
                            <dd className="col-span-2 text-gray-900">{activity.ipAddress || 'N/A'}</dd>
                          </dl>
                        </div>
                        
                        {activity.metadata && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Dodatni podaci</h5>
                            <div className="bg-gray-100 rounded p-3 overflow-auto max-h-48">
                              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Opis</h5>
                        <p className="text-gray-800">{activity.description}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityTable;
