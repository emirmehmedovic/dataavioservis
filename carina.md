# Plan implementacije praćenja goriva po carinskim prijavama (MRN)

## Uvod
Ovaj dokument opisuje plan implementacije funkcionalnosti za praćenje količine goriva u tankovima prema carinskim prijavama (MRN brojevima). Sistem će omogućiti praćenje ulaza goriva po carinskoj prijavi, distribuciju u tankove, te izlaz goriva po FIFO principu.

## Checklist implementacije

### 1. Izmjene u bazi podataka
- [x] 1.1. Kreirati novu tabelu `TankFuelByCustoms` u Prisma shemi
  - [x] 1.1.1. Dodati polja: id, fixed_tank_id, customs_declaration_number, original_quantity_liters, remaining_quantity_liters, date_added, fuel_intake_record_id
  - [x] 1.1.2. Dodati relacije prema `FixedStorageTank` i `FuelIntakeRecord`
  - [x] 1.1.3. Dodati indekse za optimizaciju upita
- [x] 1.2. Generirati i primijeniti migraciju
  - [x] 1.2.1. Izvršiti `npx prisma migrate dev --name add_tank_fuel_by_customs`
  - [x] 1.2.2. Provjeriti da je migracija uspješno primijenjena

### 2. Backend izmjene
- [x] 2.1. Ažuriranje kontrolera za unos goriva (`createFuelIntake`)
  - [x] 2.1.1. Modificirati da za svaku raspodjelu u tank kreira zapis u `TankFuelByCustoms`
  - [x] 2.1.2. Validirati MRN broj prije kreiranja zapisa
- [x] 2.2. Kreirati novi kontroler `getTankFuelByCustoms`
  - [x] 2.2.1. Implementirati dohvaćanje podataka o gorivu po MRN za specifični tank
  - [x] 2.2.2. Sortirati rezultate po datumu unosa (FIFO)
- [x] 2.3. Ažuriranje kontrolera za izdavanje goriva
  - [x] 2.3.1. Implementirati FIFO logiku za točenje goriva u mobilne tankere
  - [x] 2.3.2. Implementirati FIFO logiku za interne transfere između fiksnih tankova
  - [x] 2.3.3. Implementirati FIFO logiku za drenažu goriva
- [x] 2.4. Kreirati nove API endpointe
  - [x] 2.4.1. Dodati `/api/fuel/fixed-tanks/:id/customs-breakdown` za dohvaćanje raščlanjenog stanja
  - [x] 2.4.2. Dodati endpoint za historiju izdavanja goriva po MRN
- [x] 2.5. Ažurirati postojeće API endpointe za izvještaje
  - [x] 2.5.1. Dodati informacije o MRN u endpoint za historiju tanka
  - [x] 2.5.2. Dodati informacije o MRN u endpoint za operacije točenja

### 3. Frontend izmjene - Osnovne komponente
- [x] 3.1. Ažuriranje `NewFuelIntakeFormWizard.tsx`
  - [x] 3.1.1. Osigurati da se MRN broj pravilno šalje u API poziv
  - [x] 3.1.2. Dodati validaciju MRN broja (format, obavezno polje)
- [x] 3.2. Ažuriranje `FixedTankDetailsModal.tsx`
  - [x] 3.2.1. Dodati novu sekciju "Stanje goriva po carinskim prijavama"
  - [x] 3.2.2. Implementirati fetch podataka s novog API endpointa
  - [x] 3.2.3. Prikazati tabelu s kolonama: MRN broj, Količina (L), Datum unosa
- [x] 3.3. Implementacija prikaza MRN podataka u komponentama za fiksne tankove
  - [x] 3.3.1. Dodati prikaz raščlanjenog stanja goriva po MRN u `FixedTankDetailsModal.tsx`
  - [x] 3.3.2. Implementirati vizualni prikaz (bar chart) za količine po MRN

### 4. Frontend izmjene - Izvještaji
- [ ] 4.1. Ažuriranje `FixedTanksReport.tsx`
  - [ ] 4.1.1. Dodati kolonu za MRN broj u tabeli transakcija
  - [ ] 4.1.2. Implementirati filtriranje po MRN broju
  - [ ] 4.1.3. Ažurirati PDF export da uključuje MRN podatke
- [ ] 4.2. Ažuriranje `FuelIntakeReport.tsx`
  - [ ] 4.2.1. Dodati prikaz MRN broja u detaljima unosa goriva
  - [ ] 4.2.2. Implementirati filtriranje po MRN broju
  - [ ] 4.2.3. Ažurirati PDF export da naglasi MRN broj
- [ ] 4.3. Ažuriranje `TankerVehiclesReport.tsx`
  - [ ] 4.3.1. Dodati informacije o MRN brojevima za gorivo u mobilnim tankerima
  - [ ] 4.3.2. Prikazati historiju punjenja s MRN podacima
- [ ] 4.4. Ažuriranje `FuelOperationsReport.tsx`
  - [ ] 4.4.1. Dodati kolonu za MRN broj u tabeli operacija točenja
  - [ ] 4.4.2. Implementirati filtriranje po MRN broju
  - [ ] 4.4.3. Ažurirati PDF export da uključuje MRN podatke

### 5. Ažuriranje TypeScript tipova
- [ ] 5.1. Dodati nove interfejse u `types.ts`
  - [ ] 5.1.1. Kreirati `TankFuelByCustoms` interfejs
  - [ ] 5.1.2. Ažurirati `TankTransaction` da uključuje MRN podatke
  - [ ] 5.1.3. Ažurirati `FuelOperation` da uključuje MRN podatke
- [ ] 5.2. Ažurirati postojeće interfejse
  - [ ] 5.2.1. Dodati MRN polje u `IntakeFormData` i `CreateFuelIntakePayload`
  - [ ] 5.2.2. Ažurirati `FuelIntakeRecord` i `FuelIntakeRecordWithDetails`

### 6. Implementacija FIFO logike za izdavanje goriva
- [x] 6.1. Implementacija u backend kontroleru
  - [x] 6.1.1. Implementirati FIFO logiku direktno u kontrolerima za drenažu i transfere
  - [x] 6.1.2. Implementirati algoritam za smanjenje količine goriva po MRN
  - [x] 6.1.3. Dodati logiranje transakcija po MRN
- [ ] 6.2. Testiranje FIFO logike
  - [ ] 6.2.1. Testirati s jednim MRN brojem
  - [ ] 6.2.2. Testirati s više MRN brojeva
  - [ ] 6.2.3. Testirati edge slučajeve (npr. točenje veće količine nego što je dostupno po jednom MRN)

### 7. Testiranje i dokumentacija
- [ ] 7.1. Testiranje backend funkcionalnosti
  - [ ] 7.1.1. Testirati API endpointe
  - [ ] 7.1.2. Testirati FIFO logiku
- [ ] 7.2. Testiranje frontend funkcionalnosti
  - [ ] 7.2.1. Testirati unos i prikaz MRN podataka
  - [ ] 7.2.2. Testirati izvještaje
- [ ] 7.3. Dokumentacija
  - [ ] 7.3.1. Ažurirati backend dokumentaciju
  - [ ] 7.3.2. Ažurirati frontend dokumentaciju
  - [ ] 7.3.3. Dodati korisničku dokumentaciju za novu funkcionalnost

## Detalji implementacije

### Prisma schema za novu tabelu

```prisma
model TankFuelByCustoms {
  id                       Int              @id @default(autoincrement())
  fixed_tank_id            Int
  customs_declaration_number String
  original_quantity_liters Float
  remaining_quantity_liters Float
  date_added               DateTime         @default(now())
  fuel_intake_record_id    Int?
  
  fixedTank                FixedStorageTank @relation(fields: [fixed_tank_id], references: [id])
  fuelIntakeRecord         FuelIntakeRecord? @relation(fields: [fuel_intake_record_id], references: [id])
  
  @@index([fixed_tank_id])
  @@index([fuel_intake_record_id])
  @@index([customs_declaration_number])
}
```

### Backend kontroler za dohvaćanje podataka

```typescript
export const getTankFuelByCustoms = async (req: Request, res: Response) => {
  const tankId = parseInt(req.params.id);
  
  try {
    const fuelByCustoms = await prisma.tankFuelByCustoms.findMany({
      where: { fixed_tank_id: tankId, remaining_quantity_liters: { gt: 0 } },
      orderBy: { date_added: 'asc' }
    });
    
    return res.status(200).json(fuelByCustoms);
  } catch (error) {
    console.error('Error fetching tank fuel by customs:', error);
    return res.status(500).json({ error: 'Failed to fetch tank fuel by customs' });
  }
};
```

### FIFO logika za izdavanje goriva

```typescript
// Implementirano direktno u kontrolerima za drenažu i transfere
// Primjer implementacije u fuelDrain.controller.ts:

let remainingQuantityToDrain = quantityLiters;

// Dohvati sve zapise o gorivu po carinskim prijavama za izvorni tank, sortirano po datumu (FIFO)
const tankCustomsFuelRecords = await tx.$queryRaw<{
  id: number, 
  customs_declaration_number: string, 
  remaining_quantity_liters: number
}[]>`
  SELECT id, customs_declaration_number, remaining_quantity_liters 
  FROM "TankFuelByCustoms" 
  WHERE fixed_tank_id = ${fixedTankId} 
    AND remaining_quantity_liters > 0 
  ORDER BY date_added ASC
`;

// Prolazi kroz zapise po FIFO principu i oduzima gorivo
for (const record of tankCustomsFuelRecords) {
  if (remainingQuantityToDrain <= 0) break;
  
  const recordId = record.id;
  const availableQuantity = parseFloat(record.remaining_quantity_liters.toString());
  const quantityToDeduct = Math.min(availableQuantity, remainingQuantityToDrain);
  
  // Smanji količinu u zapisu
  await tx.$executeRaw`
    UPDATE "TankFuelByCustoms" 
    SET remaining_quantity_liters = remaining_quantity_liters - ${quantityToDeduct} 
    WHERE id = ${recordId}
  `;
  
  remainingQuantityToDrain -= quantityToDeduct;
}
```

### Frontend prikaz u FixedTankDetailsModal.tsx

```tsx
// Novi interfejs za podatke o carinskim prijavama
interface TankFuelByCustoms {
  id: number;
  mrn_number: string;
  quantity_liters: number;
  date_added: string;
}

// U FixedTankDetailsModal.tsx
const [fuelByCustoms, setFuelByCustoms] = useState<TankFuelByCustoms[]>([]);

// Fetch podataka
useEffect(() => {
  if (tank?.id) {
    fetch(`/api/fuel/fixed-tanks/${tank.id}/customs-breakdown`)
      .then(res => res.json())
      .then(data => setFuelByCustoms(data))
      .catch(err => console.error('Error fetching customs breakdown:', err));
  }
}, [tank?.id]);

// JSX za prikaz
<div className="mt-6">
  <h3 className="text-lg font-medium text-gray-900">Stanje goriva po carinskim prijavama</h3>
  <div className="mt-2 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRN broj</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Količina (L)</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum unosa</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {fuelByCustoms.map(item => (
          <tr key={item.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.mrn_number}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity_liters.toLocaleString('bs-BA')}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(item.date_added).toLocaleDateString('bs-BA')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```