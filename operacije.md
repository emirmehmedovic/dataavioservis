# Task Lista: Implementacija Finansijskih Funkcionalnosti u Operacijama Točenja Goriva

## I. Priprema i Konfiguracija

- [x] **Definisati `FuelType` model u Prisma šemi:**
    - [x] Model treba da sadrži polja: `id`, `name` (npr. "JET A1", jedinstveno), `reference_density` (DECIMAL, kg/L, za predloženu vrijednost na frontendu).
- [x] **Ažurirati `FixedStorageTanks` i `FuelTank` modele:**
    - [x] Ukloniti postojeće string polje `fuel_type`.
    - [x] Dodati `fuelTypeId` (INT) kao strani ključ na novi `FuelType` model.
    - [x] Dodati `@relation` za povezivanje sa `FuelType`.
- [x] **Popuniti `FuelType` tabelu u bazi:**
    - [x] Unijeti osnovne tipove goriva (npr. JET A1, AVGAS 100LL) i njihove referentne gustine.
- [x] **Migrirati postojeće podatke u `FixedStorageTanks` i `FuelTank`:**
    - [x] Ažurirati sve postojeće zapise da koriste odgovarajući `fuelTypeId` umjesto starog stringa `fuel_type`.

## II. Backend Razvoj

### A. Ažuriranje Prisma Modela (`schema.prisma`)

- [x] **Implementirati `FuelType` model** (kako je definisano u Sekciji I).
- [x] **Ažurirati `FixedStorageTanks` i `FuelTank` modele** (kako je definisano u Sekciji I).
- [x] **Proširiti `FuelingOperation` model:**
    - [x] Dodati `density_kg_per_liter` (DECIMAL) - vrijednost koju unosi korisnik.
    - [x] Dodati `quantity_kg` (DECIMAL) - izračunava se: `quantity_liters * density_kg_per_liter`.
    - [x] Dodati `price_per_kg` (DECIMAL) - iz cjenovnika.
    - [x] Dodati `currency` (Enum: `BAM`, `EUR`, `USD`).
    - [x] Dodati `total_amount_excluding_vat` (DECIMAL).
    - [x] Dodati `vat_rate` (DECIMAL, npr. 0.17 ili 0).
    - [x] Dodati `vat_amount` (DECIMAL).
    - [x] Dodati `total_amount_including_vat` (DECIMAL).
    - [x] Dodati `invoice_number` (STRING, opciono).
    - [x] Dodati `invoice_generated_at` (DATETIME, opciono).
    - [x] Dodati `invoice_document_id` (INT, opciono, strani ključ na `AttachedDocument`).
    - [x] Dodati `statement_document_id` (INT, opciono, strani ključ na `AttachedDocument` - za Izjave).
- [x] **Kreirati novi model `PriceList` (Cjenovnik):**
    - [x] `id` (INT, primary key, auto-increment).
    - [x] `fuelTypeId` (INT, strani ključ na `FuelType` model).
    - [x] `traffic_type` (Enum: `DOMESTIC`, `INTERNATIONAL`).
    - [x] `price_per_kg` (DECIMAL).
    - [x] `currency` (Enum: `BAM`, `EUR`, `USD`).
    - [x] `valid_from` (DATETIME) - Datum od kada cijena važi.
    - [x] `valid_to` (DATETIME, opciono) - Datum do kada cijena važi.
    - [x] `created_at`, `updated_at`.
- [x] **Definisati Enum-e u Prisma šemi (ako već ne postoje):**
    - [x] `Currency { BAM, EUR, USD }`
    - [x] `TrafficType { DOMESTIC, INTERNATIONAL }` (Mapirati na postojeće vrijednosti `tip_saobracaja` ako je potrebno, npr. `UNUTRASNJI`, `IZVOZ`).
- [x] **Pokrenuti `npx prisma migrate dev --name add_financials_fueltypes_pricelist`**.
- [x] **Pokrenuti `npx prisma generate`**.

### B. Logika za Cjenovnike (Novi Modul: `priceList.controller.ts`, `priceList.routes.ts`, `priceList.service.ts`)

- [x] **Kreirati `priceList.routes.ts`:**
    - [x] `POST /api/pricelists`
    - [x] `GET /api/pricelists`
    - [x] `GET /api/pricelists/:id`
    - [x] `PUT /api/pricelists/:id`
    - [x] `DELETE /api/pricelists/:id`
- [x] **Kreirati `priceList.controller.ts`** sa funkcijama za rute.
- [x] **Kreirati `priceList.service.ts` (ili unutar kontrolera):**
    - [x] Funkcija `getActivePrice(fuelTypeId: number, trafficType: TrafficType, operationDate: Date): Promise<{ price_per_kg: Decimal, currency: Currency } | null>`.

### C. Ažuriranje `fuelingOperation.controller.ts`

- [x] **Modifikovati `createFuelingOperation`:**
    - [x] Primiti `density_kg_per_liter` iz `req.body`.
    - [x] Validirati `density_kg_per_liter` (opciono: uporediti sa `reference_density` iz `FuelType` za odabrani tank).
    - [x] Izračunati `quantity_kg = parseFloat(req.body.quantity_liters) * parseFloat(req.body.density_kg_per_liter)`.
    - [x] Dohvatiti `sourceTank` da bi se dobio `fuelTypeId`.
    - [x] Dohvatiti aktivnu cijenu (`price_per_kg`, `currency`) koristeći `getActivePrice(fuelTypeId, req.body.tip_saobracaja, new Date(req.body.dateTime))`.
    - [x] Ako cijena nije pronađena, vratiti grešku.
    - [x] Popuniti `price_per_kg` i `currency`.
    - [x] Izračunati `total_amount_excluding_vat = quantity_kg * price_per_kg`.
    - [x] Odrediti `vat_rate` (0.17 za `DOMESTIC`/`UNUTRASNJI`, 0.00 za `INTERNATIONAL`/`IZVOZ`).
    - [x] Izračunati `vat_amount` i `total_amount_including_vat`.
    - [x] Sačuvati sva nova finansijska polja u `FuelingOperation`.
    - [x] Prilikom ažuriranja `sourceTank`, oduzeti samo `quantity_liters`.
- [x] **Modifikovati `getAllFuelingOperations` i `getFuelingOperationById`:**
    - [x] Osigurati da se nova finansijska polja i informacije o dokumentima (faktura, izjava) vraćaju.
    - [x] Konstruisati URL-ove za dokumente.
- [x] **Modifikovati `updateFuelingOperation`:**
    - [x] Ako se mijenjaju `quantity_liters`, `density_kg_per_liter`, `tankId`, `tip_saobracaja`, ili `dateTime`, ponovo izračunati sve finansijske podatke.
    - [x] **Pravilo:** Spriječiti izmjenu ovih polja ako je faktura već generisana (`invoice_number` postoji).
- [x] **Modifikovati `deleteFuelingOperation`:**
    - [x] Ako postoje, obrisati i PDF fajlove (faktura, izjava) i njihove zapise iz `AttachedDocument`.

### D. Logika za Generisanje PDF Faktura (Koristeći `jspdf` na backendu ili frontendu, preporuka backend)

- [x] **Dizajnirati templejt fakture.**
- [x] **Kreirati `invoice.service.ts` (ili slično na backendu):**
    - [x] Funkcija `generateInvoicePDF(operationId: number): Promise<{filePath: string, fileName: string}>` (ako je backend generisanje).
        - [x] Dohvatiti `FuelingOperation` i povezane podatke.
        - [x] Generisati jedinstveni `invoice_number`.
        - [x] Popuniti PDF templejt.
        - [x] Sačuvati PDF (npr. u `public/uploads/invoices/`).
- [x] **Kreirati novi endpoint u `fuelingOperation.routes.ts`:**
    - [x] `POST /api/fuel/operations/:id/generate-invoice`
- [x] **Ažurirati kontroler (`fuelingOperation.controller.ts`) za ovaj endpoint:**
    - [x] Pozvati servis za generisanje PDF-a.
    - [x] Kreirati zapis u `AttachedDocument` za fakturu.
    - [x] Ažurirati `FuelingOperation` sa `invoice_number`, `invoice_generated_at`, `invoice_document_id`.

### E. Logika za Dodatne PDF Izjave

- [x] **Ažurirati `fuelingOperation.routes.ts`:**
    - [x] Modifikovati `POST /` (kreiranje operacije) da prihvati opcioni fajl `statementDocument` (npr. koristeći `uploadFuelingDocument.fields([...])`).
    - [x] Alternativa: poseban endpoint `POST /api/fuel/operations/:id/attach-statement`.
- [x] **Ažurirati `fuelingOperation.controller.ts` (`createFuelingOperation` ili nova funkcija):**
    - [x] Logika za čuvanje fajla izjave, kreiranje `AttachedDocument`, i povezivanje `statement_document_id` u `FuelingOperation`.

### F. Ažuriranje Validacionih Pravila (`*.rules.ts`)

- [x] Ažurirati `createFuelingOperationRules`:
    - [x] Dodati validaciju za novo obavezno polje `density_kg_per_liter`.

## III. Frontend Razvoj (`FuelingOperations.tsx` i nove komponente)

### A. Ažuriranje Interfejsa

- [x] **Proširiti `FuelingOperation` interfejs na frontendu:**
    - [x] Dodati: `density_kg_per_liter?`, `quantity_kg?`, i sva ostala finansijska polja, `invoice_document_url?`, `statement_document_url?`.
- [x] **Kreirati interfejs `FuelTypeFE`** (sa `id`, `name`, `reference_density`).
- [x] **Kreirati interfejs `PriceListItemFE`**.

### B. Forma za Dodavanje/Izmjenu Operacije (`FuelingOperationModal.tsx` ili slično)

- [x] **Dodati novo obavezno polje za unos: "Gustina (kg/L)" (`density_kg_per_liter`).**
- [x] **Opciono:** Nakon odabira tanka (`tankId`):
    - [x] Pozvati API da se dohvati `FuelType` za odabrani tank (npr. `GET /api/fuel-types?tankId=X` ili proširiti `GET /api/fuel/tanks/:id`).
    - [x] Popuniti polje za gustinu sa `FuelType.reference_density` kao predloženom vrijednošću.
- [x] **Dodati polje za upload "Izjave" (opciono).**

### C. Prikaz Operacija u Tabeli (`FuelingOperations.tsx`)

- [x] **Dodati nove kolone u tabelu:** "Gustina Unesena", "Količina (kg)", "Cijena/kg", "Valuta", "Osnovica", "PDV (%)", "PDV Iznos", "Ukupno", "Br. Fakture".

### D. Prikaz Detalja Operacije (Modal ili Posebna Stranica)

- [x] **Prikazati sva nova finansijska i unesena polja (uključujući gustinu).**
- [x] **Prikazati link za preuzimanje fakture** (ako postoji `invoice_document_url`).
- [x] **Dugme "Generiši Fakturu"** (prikazati ako `invoice_number` ne postoji).
    - [x] Na klik, pozvati `POST /api/fuel/operations/${operation.id}/generate-invoice`.
- [x] **Prikazati link za preuzimanje Izjave** (ako postoji `statement_document_url`).

### E. Nova Stranica/Komponenta za Upravljanje Cjenovnicima (`PriceLists.tsx`)

- [x] **Kreirati UI za CRUD operacije nad cjenovnicima (`/api/pricelists`):**
    - [x] Tabela za prikaz cijena.
    - [x] Forma za dodavanje/izmjenu (odabir `FuelType` iz liste, tip saobraćaja, cijena, valuta, datumi).
    - [x] Lista `FuelType` za dropdown treba da se puni sa `GET /api/fuel-types` (treba kreirati ovaj endpoint ako ne postoji).

### F. Ažuriranje Servisnih Poziva (`fetchWithAuth` ili API sloj)

- [x] **Ažurirati funkcije za kreiranje operacije** da šalju `density_kg_per_liter` i `statementDocument`.
- [x] **Implementirati nove funkcije za:** CRUD cjenovnika, generisanje fakture, dohvat `FuelType` liste.

## IV. Testiranje

- [x] **Testirati kreiranje operacije (domaći/međunarodni saobraćaj) sa ručnim unosom gustine.**
    - [x] Provjeriti obračun kg, cijene, PDV-a, ukupnih iznosa.
- [x] **Testirati generisanje i preuzimanje fakture.**
- [x] **Testirati prilaganje i preuzimanje Izjave.**
- [x] **Testirati ažuriranje operacije** (prije i poslije generisanja fakture).
- [x] **Testirati brisanje operacije** (uključujući povezane dokumente).
- [x] **Testirati CRUD operacije za cjenovnike.**
- [x] **Testirati CRUD operacije za `FuelType` (ako se odlučite za poseban UI za to, inače samo kroz bazu).**
 
## V. Dodatna Razmatranja (Za Kasnije Faze)

- [ ] **Status fakture** (Plaćena, Neplaćena, Stornirana).
- [ ] **Napredno upravljanje brojevima faktura.**
- [ ] **Korisničke role i permisije.**
- [ ] **Izvještavanje.**
- [ ] **Kursne liste.**

## Rješavanje postojećih problema

- [x] Riješiti TypeScript greške u `fuelingOperation.controller.ts` (`Promise<Response | undefined>` vs `Promise<void>`).
