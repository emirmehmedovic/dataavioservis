import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '@/lib/apiService';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusIcon, ArrowDownIcon, XMarkIcon, TrashIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Define interfaces for our data types
interface FixedTank {
  id: number;
  tank_name: string;
  tank_identifier: string;
  capacity_liters: number;
  current_quantity_liters: number;
  fuel_type: string;
  location_description: string;
  status: string;
}

interface MobileTank {
  id: number;
  name: string;
  identifier: string;
  capacity_liters: number;
  current_liters: number;
  fuel_type: string;
  status: string;
}

interface DrainRecord {
  id: number;
  dateTime: string;
  sourceId: number;
  sourceName: string;
  sourceType: 'fixed' | 'mobile';
  quantityLiters: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
  userName: string;
}

interface DrainFormData {
  date: string;
  sourceType: 'fixed' | 'mobile';
  sourceId: number;
  quantity_liters: string;
  notes: string;
}

interface ReverseTransactionFormData {
  date: string;
  destinationType: 'fixed' | 'mobile';
  destinationId: number;
  quantity_liters: string;
  notes: string;
  originalDrainId: number;
}

const DrainedFuelOperations: React.FC = () => {
  // State variables
  const [fixedTanks, setFixedTanks] = useState<FixedTank[]>([]);
  const [mobileTanks, setMobileTanks] = useState<MobileTank[]>([]);
  const [drainRecords, setDrainRecords] = useState<DrainRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [formData, setFormData] = useState<DrainFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    sourceType: 'fixed',
    sourceId: 0,
    quantity_liters: '',
    notes: '',
  });
  const [reverseFormData, setReverseFormData] = useState<ReverseTransactionFormData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    destinationType: 'fixed',
    destinationId: 0,
    quantity_liters: '',
    notes: '',
    originalDrainId: 0
  });
  const [selectedSource, setSelectedSource] = useState<FixedTank | MobileTank | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<FixedTank | MobileTank | null>(null);
  const [activeTab, setActiveTab] = useState<'fixed' | 'mobile'>('fixed');
  const [reverseActiveTab, setReverseActiveTab] = useState<'fixed' | 'mobile'>('fixed');
  const [selectedDrainRecord, setSelectedDrainRecord] = useState<DrainRecord | null>(null);
  
  // Summary state
  const [totalDrained, setTotalDrained] = useState<number>(0);
  const [totalReturned, setTotalReturned] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  // Fetch data functions
  const fetchFixedTanks = useCallback(async () => {
    try {
      const data = await fetchWithAuth<FixedTank[]>('/api/fuel/fixed-tanks');
      setFixedTanks(data);
    } catch (error) {
      console.error('Error fetching fixed tanks:', error);
      toast.error('Greška pri dohvaćanju fiksnih tankova');
    }
  }, []);

  const fetchMobileTanks = useCallback(async () => {
    try {
      const data = await fetchWithAuth<MobileTank[]>('/api/fuel/tanks');
      setMobileTanks(data);
    } catch (error) {
      console.error('Error fetching mobile tanks:', error);
      toast.error('Greška pri dohvaćanju mobilnih tankova');
    }
  }, []);

  const fetchDrainRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithAuth<DrainRecord[]>('/api/fuel/drains/records');
      setDrainRecords(data);
    } catch (error) {
      console.error('Error fetching drain records:', error);
      toast.error('Greška pri dohvaćanju evidencije istakanja goriva');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchFixedTanks(),
        fetchMobileTanks(),
        fetchDrainRecords()
      ]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchFixedTanks, fetchMobileTanks, fetchDrainRecords]);
  
  // Calculate summary values whenever drain records change
  useEffect(() => {
    let drainedTotal = 0;
    let returnedTotal = 0;
    
    drainRecords.forEach(record => {
      // Regular drain records have positive quantities
      if (record.quantityLiters > 0) {
        drainedTotal += record.quantityLiters;
      }
      // Reverse transactions have negative quantities in the database
      else if (record.quantityLiters < 0) {
        returnedTotal += Math.abs(record.quantityLiters);
      }
    });
    
    setTotalDrained(drainedTotal);
    setTotalReturned(returnedTotal);
    setCurrentBalance(drainedTotal - returnedTotal);
  }, [drainRecords]);

  // Effect to update selectedSource when formData.sourceId or formData.sourceType changes
  useEffect(() => {
    if (!formData.sourceId || formData.sourceId === 0) {
      setSelectedSource(null);
      return;
    }

    const source = formData.sourceType === 'fixed'
      ? fixedTanks.find(tank => tank.id === formData.sourceId)
      : mobileTanks.find(tank => tank.id === formData.sourceId);
    setSelectedSource(source || null);
  }, [formData.sourceId, formData.sourceType, fixedTanks, mobileTanks]);

  // Effect to update selectedDestination when reverseFormData.destinationId or reverseFormData.destinationType changes
  useEffect(() => {
    if (!reverseFormData.destinationId || reverseFormData.destinationId === 0) {
      setSelectedDestination(null);
      return;
    }

    const destination = reverseFormData.destinationType === 'fixed'
      ? fixedTanks.find(tank => tank.id === reverseFormData.destinationId)
      : mobileTanks.find(tank => tank.id === reverseFormData.destinationId);
    setSelectedDestination(destination || null);
  }, [reverseFormData.destinationId, reverseFormData.destinationType, fixedTanks, mobileTanks]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle reverse form input changes
  const handleReverseInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReverseFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'sourceType') {
      const newSourceType = value as 'fixed' | 'mobile';
      setFormData(prev => ({
        ...prev,
        sourceType: newSourceType,
        sourceId: 0, 
      }));
      setActiveTab(newSourceType);
    } else if (name === 'sourceId') {
      // More robust check for empty, null, undefined, or whitespace-only strings
      if (!value || value.trim() === '') { 
        setFormData(prev => ({ ...prev, sourceId: 0 })); 
        return;
      }
      const newSourceId = parseInt(value, 10);
      if (isNaN(newSourceId)) {
        // More distinct error message for debugging
        console.error(`[DEBUG V2] Invalid non-numeric string received for sourceId. Value: '${value}'`); 
        setFormData(prev => ({ ...prev, sourceId: 0 }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        sourceId: newSourceId, 
      }));
    } else if (name === 'destinationType') {
      const newDestType = value as 'fixed' | 'mobile';
      setReverseFormData(prev => ({
        ...prev,
        destinationType: newDestType,
        destinationId: 0, 
      }));
      setReverseActiveTab(newDestType);
    } else if (name === 'destinationId') {
      if (!value || value.trim() === '') { 
        setReverseFormData(prev => ({ ...prev, destinationId: 0 })); 
        return;
      }
      const newDestId = parseInt(value, 10);
      if (isNaN(newDestId)) {
        console.error(`Invalid non-numeric string received for destinationId. Value: '${value}'`); 
        setReverseFormData(prev => ({ ...prev, destinationId: 0 }));
        return;
      }
      setReverseFormData(prev => ({
        ...prev,
        destinationId: newDestId, 
      }));
    }
  };

  // Open the reverse transaction modal for a specific drain record
  const openReverseModal = (drainRecord: DrainRecord) => {
    setSelectedDrainRecord(drainRecord);
    setReverseFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      destinationType: 'fixed', // Default to fixed tank as destination
      destinationId: 0,
      quantity_liters: drainRecord.quantityLiters.toString(), // Default to the full drained amount
      notes: `Povrat filtriranog goriva iz drenaže ID: ${drainRecord.id}`,
      originalDrainId: drainRecord.id
    });
    setReverseActiveTab('fixed');
    setIsReverseModalOpen(true);
  };

  // Handle reverse transaction form submission
  const handleReverseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reverseFormData.destinationId) {
      toast.error('Molimo odaberite odredište goriva');
      return;
    }
    
    if (!reverseFormData.quantity_liters || parseFloat(reverseFormData.quantity_liters) <= 0) {
      toast.error('Molimo unesite validnu količinu goriva');
      return;
    }

    if (!selectedDrainRecord) {
      toast.error('Nije odabran zapis drenaže za povrat');
      return;
    }
    
    const quantityToReturn = parseFloat(reverseFormData.quantity_liters);
    
    // Check if quantity to return is not greater than the original drained amount
    if (quantityToReturn > selectedDrainRecord.quantityLiters) {
      toast.error(`Količina za povrat ne može biti veća od originalno drenirane količine (${selectedDrainRecord.quantityLiters} L)`);
      return;
    }
    
    // Check if destination has enough capacity
    if (reverseFormData.destinationType === 'fixed') {
      const tank = fixedTanks.find(t => t.id === reverseFormData.destinationId);
      if (!tank) {
        toast.error('Odabrani rezervoar nije pronađen');
        return;
      }
      
      const availableCapacity = tank.capacity_liters - tank.current_quantity_liters;
      if (availableCapacity < quantityToReturn) {
        toast.error(`Nedovoljno kapaciteta u rezervoaru. Dostupno: ${availableCapacity.toLocaleString()} L`);
        return;
      }
    } else {
      const tank = mobileTanks.find(t => t.id === reverseFormData.destinationId);
      if (!tank) {
        toast.error('Odabrana cisterna nije pronađena');
        return;
      }
      
      const availableCapacity = tank.capacity_liters - tank.current_liters;
      if (availableCapacity < quantityToReturn) {
        toast.error(`Nedovoljno kapaciteta u cisterni. Dostupno: ${availableCapacity.toLocaleString()} L`);
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Prepare payload for API
      const payload = {
        dateTime: new Date(reverseFormData.date + 'T' + new Date().toTimeString().split(' ')[0]).toISOString(),
        destinationType: reverseFormData.destinationType,
        destinationId: reverseFormData.destinationId,
        quantityLiters: parseFloat(reverseFormData.quantity_liters),
        notes: reverseFormData.notes || null,
        originalDrainId: reverseFormData.originalDrainId
      };
      
      // This endpoint would need to be implemented in the backend
      const response = await fetchWithAuth<any>(`/api/fuel/drains/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      toast.success('Povrat filtriranog goriva uspješno evidentiran');
      setIsReverseModalOpen(false);
      
      // Refresh data
      await Promise.all([
        fetchFixedTanks(),
        fetchMobileTanks(),
        fetchDrainRecords()
      ]);
      
      // Reset form
      setReverseFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        destinationType: 'fixed',
        destinationId: 0,
        quantity_liters: '',
        notes: '',
        originalDrainId: 0
      });
      setSelectedDestination(null);
      setSelectedDrainRecord(null);
      
    } catch (error) {
      console.error('Error submitting reverse transaction:', error);
      toast.error('Greška pri evidentiranju povrata filtriranog goriva');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sourceId) {
      toast.error('Molimo odaberite izvor goriva');
      return;
    }
    
    if (!formData.quantity_liters || parseFloat(formData.quantity_liters) <= 0) {
      toast.error('Molimo unesite validnu količinu goriva');
      return;
    }
    
    // Check if there's enough fuel in the source
    const quantityToRemove = parseFloat(formData.quantity_liters);
    
    if (formData.sourceType === 'fixed') {
      const tank = fixedTanks.find(t => t.id === formData.sourceId);
      if (!tank) {
        toast.error('Odabrani rezervoar nije pronađen');
        return;
      }
      
      if (tank.current_quantity_liters < quantityToRemove) {
        toast.error(`Nedovoljno goriva u rezervoaru. Dostupno: ${tank.current_quantity_liters} L`);
        return;
      }
    } else {
      const tank = mobileTanks.find(t => t.id === formData.sourceId);
      if (!tank) {
        toast.error('Odabrana cisterna nije pronađena');
        return;
      }
      
      if (tank.current_liters < quantityToRemove) {
        toast.error(`Nedovoljno goriva u cisterni. Dostupno: ${tank.current_liters} L`);
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      // Prepare payload for API with corrected field names
      const payload = {
        dateTime: new Date(formData.date + 'T' + new Date().toTimeString().split(' ')[0]).toISOString(),
        sourceType: formData.sourceType,
        sourceId: formData.sourceId,
        quantityLiters: parseFloat(formData.quantity_liters),
        notes: formData.notes || null
      };
      
      // This endpoint would need to be implemented in the backend
      const response = await fetchWithAuth<DrainRecord>(`/api/fuel/drains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      toast.success('Istakanje goriva uspješno evidentirano');
      setIsModalOpen(false);
      
      // Refresh data
      await Promise.all([
        fetchFixedTanks(),
        fetchMobileTanks(),
        fetchDrainRecords()
      ]);
      
      // Reset form
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        sourceType: 'fixed',
        sourceId: 0,
        quantity_liters: '',
        notes: '',
      });
      setSelectedSource(null);
      
    } catch (error) {
      console.error('Error submitting drain record:', error);
      toast.error('Greška pri evidentiranju istakanja goriva');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Drenirano gorivo</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Novo istakanje
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Ukupno drenirano</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{totalDrained.toLocaleString('bs-BA')} L</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Ukupno vraćeno</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totalReturned.toLocaleString('bs-BA')} L</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Trenutno stanje</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{currentBalance.toLocaleString('bs-BA')} L</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Evidencija istakanja goriva</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
            </div>
          ) : drainRecords.length === 0 ? (
            <div className="text-center py-10">
              <ArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Nema podataka</h3>
              <p className="mt-1 text-sm text-gray-500">
                Još nema evidentiranih istakanja goriva.
              </p>
              <div className="mt-6">
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Novo istakanje
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum i vrijeme</TableHead>
                    <TableHead>Izvor</TableHead>
                    <TableHead>Tip izvora</TableHead>
                    <TableHead className="text-right">Količina (L)</TableHead>
                    <TableHead>Napomena</TableHead>
                    <TableHead>Korisnik</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drainRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.dateTime), 'dd.MM.yyyy HH:mm')}</TableCell>
                      <TableCell>{record.sourceName}</TableCell>
                      <TableCell>
                        {record.sourceType === 'fixed' ? 'Fiksni rezervoar' : 'Mobilna cisterna'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {record.quantityLiters.toLocaleString()}
                      </TableCell>
                      <TableCell>{record.notes || '-'}</TableCell>
                      <TableCell>{record.userName}</TableCell>
                      <TableCell>
                        {/* Only show Povrat button for regular drain transactions (positive quantity) */}
                        {record.quantityLiters > 0 && (
                          <Button
                            onClick={() => openReverseModal(record)}
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            Povrat
                          </Button>
                        )}
                        {record.quantityLiters < 0 && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            Povrat
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* New Drain Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo istakanje goriva</DialogTitle>
            <DialogDescription>
              Evidentirajte istakanje goriva iz fiksnog rezervoara ili mobilne cisterne.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tip izvora</Label>
              <Tabs 
                value={activeTab} 
                onValueChange={(value: string) => handleSelectChange('sourceType', value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fixed">Fiksni rezervoar</TabsTrigger>
                  <TabsTrigger value="mobile">Mobilna cisterna</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fixed" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceId">Odaberite rezervoar</Label>
                    <Select 
                      value={formData.sourceId.toString()} 
                      onValueChange={(value) => handleSelectChange('sourceId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite rezervoar" />
                      </SelectTrigger>
                      <SelectContent>
                        {fixedTanks.map((tank) => (
                          <SelectItem key={tank.id} value={tank.id.toString()}>
                            {tank.tank_name} ({tank.tank_identifier}) - {tank.current_quantity_liters.toLocaleString('bs-BA')} L
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="mobile" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="sourceId">Odaberite cisternu</Label>
                    <Select 
                      value={formData.sourceId.toString()} 
                      onValueChange={(value) => handleSelectChange('sourceId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite cisternu" />
                      </SelectTrigger>
                      <SelectContent>
                        {mobileTanks.map((tank) => (
                          <SelectItem key={tank.id} value={tank.id.toString()}>
                            {tank.name} ({tank.identifier}) - {tank.current_liters.toLocaleString()} L
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {selectedSource && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-sm text-gray-700">Informacije o izvoru</h4>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Naziv:</span> {formData.sourceType === 'fixed' ? (selectedSource as FixedTank)?.tank_name : (selectedSource as MobileTank)?.name}
                  </div>
                  <div>
                    <span className="text-gray-500">Identifikator:</span> {formData.sourceType === 'fixed' ? (selectedSource as FixedTank)?.tank_identifier : (selectedSource as MobileTank)?.identifier}
                  </div>
                  <div>
                    <span className="text-gray-500">Tip goriva:</span> {selectedSource.fuel_type}
                  </div>
                  <div>
                    <span className="text-gray-500">Trenutna količina:</span>{' '}
                    {formData.sourceType === 'fixed' 
                      ? (selectedSource as FixedTank).current_quantity_liters.toLocaleString() 
                      : (selectedSource as MobileTank).current_liters.toLocaleString()
                    } L
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="quantity_liters">Količina (L)</Label>
              <Input
                id="quantity_liters"
                name="quantity_liters"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.quantity_liters}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Napomena</Label>
              <Input
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Opcionalno"
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                    Učitavanje...
                  </>
                ) : (
                  'Evidentiraj istakanje'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reverse Transaction Modal */}
      <Dialog open={isReverseModalOpen} onOpenChange={setIsReverseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Povrat filtriranog goriva</DialogTitle>
            <DialogDescription>
              Evidentirajte povrat filtriranog goriva u fiksni rezervoar ili mobilnu cisternu.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDrainRecord && (
            <div className="bg-amber-50 p-3 rounded-md mb-4 border border-amber-200">
              <h4 className="font-medium text-sm text-amber-800">Informacije o originalnoj drenaži</h4>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-amber-700">Izvor:</span> {selectedDrainRecord.sourceName}
                </div>
                <div>
                  <span className="text-amber-700">Tip izvora:</span> {selectedDrainRecord.sourceType === 'fixed' ? 'Fiksni rezervoar' : 'Mobilna cisterna'}
                </div>
                <div>
                  <span className="text-amber-700">Količina:</span> {selectedDrainRecord.quantityLiters.toLocaleString()} L
                </div>
                <div>
                  <span className="text-amber-700">Datum:</span> {format(new Date(selectedDrainRecord.dateTime), 'dd.MM.yyyy HH:mm')}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleReverseSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum povrata</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={reverseFormData.date}
                onChange={handleReverseInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tip odredišta</Label>
              <Tabs 
                value={reverseActiveTab} 
                onValueChange={(value: string) => handleSelectChange('destinationType', value)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fixed">Fiksni rezervoar</TabsTrigger>
                  <TabsTrigger value="mobile">Mobilna cisterna</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fixed" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="destinationId">Odaberite rezervoar</Label>
                    <Select 
                      value={reverseFormData.destinationId.toString()} 
                      onValueChange={(value) => handleSelectChange('destinationId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite rezervoar" />
                      </SelectTrigger>
                      <SelectContent>
                        {fixedTanks.map((tank) => (
                          <SelectItem key={tank.id} value={tank.id.toString()}>
                            {tank.tank_name} ({tank.tank_identifier}) - {tank.current_quantity_liters.toLocaleString('bs-BA')}/{tank.capacity_liters.toLocaleString('bs-BA')} L
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="mobile" className="mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="destinationId">Odaberite cisternu</Label>
                    <Select 
                      value={reverseFormData.destinationId.toString()} 
                      onValueChange={(value) => handleSelectChange('destinationId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite cisternu" />
                      </SelectTrigger>
                      <SelectContent>
                        {mobileTanks.map((tank) => (
                          <SelectItem key={tank.id} value={tank.id.toString()}>
                            {tank.name} ({tank.identifier}) - {tank.current_liters.toLocaleString()}/{tank.capacity_liters.toLocaleString()} L
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {selectedDestination && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-sm text-gray-700">Informacije o odredištu</h4>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Naziv:</span> {reverseFormData.destinationType === 'fixed' ? (selectedDestination as FixedTank)?.tank_name : (selectedDestination as MobileTank)?.name}
                  </div>
                  <div>
                    <span className="text-gray-500">Identifikator:</span> {reverseFormData.destinationType === 'fixed' ? (selectedDestination as FixedTank)?.tank_identifier : (selectedDestination as MobileTank)?.identifier}
                  </div>
                  <div>
                    <span className="text-gray-500">Tip goriva:</span> {selectedDestination.fuel_type}
                  </div>
                  <div>
                    <span className="text-gray-500">Raspoloživi kapacitet:</span>{' '}
                    {reverseFormData.destinationType === 'fixed' 
                      ? ((selectedDestination as FixedTank).capacity_liters - (selectedDestination as FixedTank).current_quantity_liters).toLocaleString() 
                      : ((selectedDestination as MobileTank).capacity_liters - (selectedDestination as MobileTank).current_liters).toLocaleString()
                    } L
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="quantity_liters">Količina za povrat (L)</Label>
              <Input
                id="quantity_liters"
                name="quantity_liters"
                type="number"
                step="0.01"
                min="0.01"
                value={reverseFormData.quantity_liters}
                onChange={handleReverseInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Napomena</Label>
              <Input
                id="notes"
                name="notes"
                value={reverseFormData.notes}
                onChange={handleReverseInputChange}
                placeholder="Opcionalno"
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsReverseModalOpen(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                    Učitavanje...
                  </>
                ) : (
                  'Evidentiraj povrat'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DrainedFuelOperations;
