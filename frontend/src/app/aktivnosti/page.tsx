'use client';

import React from 'react';
import ActivityLog from '@/components/activities/ActivityLog';

export default function AktivnostiPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Evidencija Aktivnosti</h1>
      </div>
      
      <ActivityLog />
    </div>
  );
}
