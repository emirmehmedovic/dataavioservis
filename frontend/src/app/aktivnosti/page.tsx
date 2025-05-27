'use client';

import React from 'react';
import ActivityLog from '@/components/activities/ActivityLog';
import { FileText, Clock, AlertCircle } from 'lucide-react';

export default function AktivnostiPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center mb-6">
        <div className="flex items-center">
          <FileText className="h-6 w-6 text-indigo-600 mr-2" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Evidencija Aktivnosti</h1>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Prati sve promjene u sistemu</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-4 rounded-lg mb-6 border border-indigo-100 dark:border-indigo-900">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">O evidenciji aktivnosti</h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
              Ovdje možete pratiti sve aktivnosti korisnika u sistemu. Koristite filtere za pretraživanje specifičnih događaja.
            </p>
          </div>
        </div>
      </div>
      
      <ActivityLog />
    </div>
  );
}
