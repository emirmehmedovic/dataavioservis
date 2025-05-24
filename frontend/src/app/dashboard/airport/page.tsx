"use client";

import React, { useState, useEffect } from 'react';
import FixedTanksDisplay from '@/components/fuel/FixedTanksDisplay';
import AllIntakesList from '@/components/customs/AllIntakesList'; 
import FuelOperationsReport from '@/components/reports/FuelOperationsReport';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const AirportPage = () => {
  const [intakeListStartDate, setIntakeListStartDate] = useState<string>('');
  const [intakeListEndDate, setIntakeListEndDate] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    setIntakeListStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
    setIntakeListEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Aerodrom</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Pregled fiksnih tankova i historijata ulaza goriva za aerodromske potrebe.</p>
      </header>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Status Fiksnih Tankova</CardTitle>
          </CardHeader>
          <CardContent>
            <FixedTanksDisplay 
              showAddTankButton={false}
              showTransferButton={false}
              showEditTankButton={false}
              showDetailsButton={false}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Historijat Svih Ulaza Goriva u Fiksne Tankove</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
              <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Filter po datumu</h4>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label htmlFor="intakeListStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Početni datum</label>
                  <Input
                    type="date"
                    id="intakeListStartDate"
                    value={intakeListStartDate}
                    onChange={(e) => setIntakeListStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label htmlFor="intakeListEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Krajnji datum</label>
                  <Input
                    type="date"
                    id="intakeListEndDate"
                    value={intakeListEndDate}
                    onChange={(e) => setIntakeListEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <AllIntakesList 
              startDate={intakeListStartDate} 
              endDate={intakeListEndDate} 
              title="Pregled Prijema Goriva"
              showDateFilterInfo={false} // Info is shown above the component now
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Pregled Izlaznih Operacija Goriva</CardTitle>
          </CardHeader>
          <CardContent>
            <FuelOperationsReport />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default AirportPage;
