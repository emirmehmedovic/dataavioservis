import React from 'react';
import { Vehicle } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';

interface ReportsSectionProps {
  vehicle: Vehicle;
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ vehicle }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Izvještaji vozila</h3>
          <div className="text-sm text-gray-500">
            <p>Trenutno nema dostupnih izvještaja za ovo vozilo.</p>
            <p className="mt-2">Ovdje će biti prikazani različiti izvještaji vezani za vozilo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsSection;
