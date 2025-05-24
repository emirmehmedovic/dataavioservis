"use client";

import { useEffect, useState } from 'react';
import { FixedStorageTank, FuelType } from '@/types/fuel';
import { Button } from "@/components/ui/Button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFixedTanks, createFixedTankToFixedTankTransfer } from '@/lib/apiService'; // Assuming createFixedTankToFixedTankTransfer will be created
import { toast } from 'sonner';

interface FixedToFixedTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferSuccess: () => void;
  availableTanks: FixedStorageTank[]; // Pass available tanks as a prop
}

export default function FixedToFixedTransferModal({
  isOpen,
  onClose,
  onTransferSuccess,
  availableTanks,
}: FixedToFixedTransferModalProps) {
  const [sourceTankId, setSourceTankId] = useState<string>('');
  const [destinationTankId, setDestinationTankId] = useState<string>('');
  const [quantityLiters, setQuantityLiters] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sourceTank = availableTanks.find(tank => tank.id.toString() === sourceTankId);
  const destinationTank = availableTanks.find(tank => tank.id.toString() === destinationTankId);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!sourceTankId || !destinationTankId || !quantityLiters) {
      setError('Molimo popunite sva polja.');
      return;
    }

    const quantity = parseFloat(quantityLiters);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Količina mora biti pozitivan broj.');
      return;
    }

    if (sourceTankId === destinationTankId) {
      setError('Izvorni i odredišni tank ne mogu biti isti.');
      return;
    }

    if (sourceTank && quantity > sourceTank.current_quantity_liters) {
      setError(`Nedovoljno goriva u izvornom tanku. Dostupno: ${sourceTank.current_quantity_liters.toLocaleString()} L`);
      return;
    }

    if (destinationTank && quantity > (destinationTank.capacity_liters - destinationTank.current_quantity_liters)) {
      setError(`Nema dovoljno kapaciteta u odredišnom tanku. Slobodno: ${(destinationTank.capacity_liters - destinationTank.current_quantity_liters).toLocaleString()} L`);
      return;
    }
    
    // Optional: Check for fuel type compatibility if needed in the future
    // if (sourceTank && destinationTank && sourceTank.fuel_type !== destinationTank.fuel_type) {
    //   if (!confirm(`Tipovi goriva se razlikuju (${sourceTank.fuel_type} -> ${destinationTank.fuel_type}). Jeste li sigurni da želite nastaviti?`)) {
    //     return;
    //   }
    // }

    setIsLoading(true);
    try {
      await createFixedTankToFixedTankTransfer({
        sourceTankId: parseInt(sourceTankId),
        destinationTankId: parseInt(destinationTankId),
        quantityLiters: quantity,
      });
      toast.success('Pretakanje goriva uspješno izvršeno!');
      onTransferSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Greška prilikom pretakanja goriva.');
      toast.error(err.message || 'Greška prilikom pretakanja goriva.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Pretakanje Goriva (Fiksni u Fiksni)</DialogTitle>
          <DialogDescription>
            Prebacite gorivo iz jednog fiksnog tanka u drugi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="sourceTank">Izvorni Tank</Label>
            <Select value={sourceTankId} onValueChange={setSourceTankId} required>
              <SelectTrigger id="sourceTank">
                <SelectValue placeholder="Odaberite izvorni tank" />
              </SelectTrigger>
              <SelectContent>
                {availableTanks.map(tank => (
                  <SelectItem key={tank.id} value={tank.id.toString()} disabled={tank.id.toString() === destinationTankId}>
                    {tank.tank_name} ({tank.tank_identifier}) - {tank.fuel_type} ({tank.current_quantity_liters.toLocaleString()} L)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="destinationTank">Odredišni Tank</Label>
            <Select value={destinationTankId} onValueChange={setDestinationTankId} required>
              <SelectTrigger id="destinationTank">
                <SelectValue placeholder="Odaberite odredišni tank" />
              </SelectTrigger>
              <SelectContent>
                {availableTanks.map(tank => (
                  <SelectItem key={tank.id} value={tank.id.toString()} disabled={tank.id.toString() === sourceTankId}>
                    {tank.tank_name} ({tank.tank_identifier}) - {tank.fuel_type} (Slobodno: {(tank.capacity_liters - tank.current_quantity_liters).toLocaleString()} L)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantityLiters">Količina (L)</Label>
            <Input
              id="quantityLiters"
              type="number"
              value={quantityLiters}
              onChange={(e) => setQuantityLiters(e.target.value)}
              placeholder="Unesite količinu u litrama"
              required
              min="1"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Odustani
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Pretakanje...' : 'Prebaci Gorivo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
