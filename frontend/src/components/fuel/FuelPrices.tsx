'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import TradingViewWidget from './TradingViewWidget';
import ForexTradingViewWidget from './ForexTradingViewWidget';

// Constants for widget height
const WIDGET_HEIGHT = '500px';
const INFO_CARD_HEIGHT = '200px';

const FuelPrices: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('charts');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="charts" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts">Grafovi</TabsTrigger>
          <TabsTrigger value="info">Informacije</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crude Oil Price Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Cijena Sirove Nafte (WTI)</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: WIDGET_HEIGHT }}>
                  <TradingViewWidget />
                </div>
              </CardContent>
            </Card>

            {/* EUR/USD Exchange Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Kurs EUR/USD</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: WIDGET_HEIGHT }}>
                  <ForexTradingViewWidget />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informacije o Cijenama Goriva</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  Cijene sirove nafte (WTI - West Texas Intermediate) i kurs EUR/USD su ključni faktori koji utječu na cijene avionskog goriva.
                  Grafovi prikazuju podatke u realnom vremenu putem TradingView platforme.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-indigo-800 mb-2">Sirova Nafta (WTI)</h3>
                    <p className="text-sm">
                      WTI (West Texas Intermediate) je benchmark za cijene sirove nafte u SAD-u i globalno. 
                      Promjene u cijeni WTI nafte direktno utječu na cijene avionskog goriva.
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 mb-2">Kurs EUR/USD</h3>
                    <p className="text-sm">
                      Kurs EUR/USD je važan jer se nafta globalno trguje u američkim dolarima, 
                      dok se mnoge transakcije u Europi odvijaju u eurima.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FuelPrices;