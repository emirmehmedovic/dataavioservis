# Implementacija "EXD BROJ" i "K BROJ" u OperationDetailsModal

## Opis funkcionalnosti
Dodavanje dva nova polja u `OperationDetailsModal.tsx`:
- "EXD BROJ" - za unos i prikaz EXD broja
- "K BROJ" - za unos i prikaz K broja

Korisnik će moći kliknuti na dugme za dodavanje ovih brojeva, unijeti ih u mali modal, te sačuvati. Brojevi će se prikazivati u detaljima operacije i biti dostupni za eksport u MRN izvještajima.

## Bitesize zadaci

### 1. Backend - Ažuriranje baze podataka
- [x] Dodati `exd_number` (VARCHAR(50)) i `k_number` (VARCHAR(50)) kolone u tabelu `FuelingOperation` (Prisma schema)
- [x] Kreirati migraciju za izmjenu strukture baze podataka
- [x] Primijeniti migraciju na bazu podataka

### 2. Backend - Ažuriranje API-ja
- [x] Ažurirati `FuelingOperation` model u Prisma schemi da uključuje nova polja
- [x] Ažurirati `updateFuelingOperation` kontroler da prihvata i obrađuje nova polja
- [x] Dodati validaciju za nova polja (max 50 karaktera)
- [x] Ažurirati GET `/api/fuel/operations/:id` endpoint da vraća nova polja
- [ ] Ažurirati API dokumentaciju

### 3. Frontend - Ažuriranje TypeScript tipova
- [x] Ažurirati `FuelOperation` interface da uključi nova `exd_number` i `k_number` polja (opciona, string)
- [x] Ažurirati tipove za API zahtjeve ako je potrebno

### 4. Frontend - Ažuriranje API servisa
- [x] Ažurirati `updateFuelingOperation` funkciju da šalje nova polja prema backend-u

### 5. Frontend - UI komponente za unos
- [x] Kreirati komponentu `ExdKNumberEditModal.tsx` za unos brojeva
  - [x] Implementirati state za upravljanje vrijednostima polja
  - [x] Dodati validaciju unosa (max 50 karaktera)
  - [x] Implementirati save/cancel akcije

### 6. Frontend - Izmjene u OperationDetailsModal
- [x] Dodati state za praćenje stanja modala za unos brojeva
- [x] Implementirati funkcije za otvaranje modala za EXD i K broj
- [x] Dodati dugme "Uredi" za EXD i K brojeve u odgovarajućoj sekciji
- [x] Dodati prikaz unesenih vrijednosti u detaljima operacije
- [x] Implementirati funkciju za ažuriranje operacije s novim poljima
- [x] Zatvoriti modal za unos i osvježiti podatke nakon uspješnog ažuriranja

### 7. Frontend - Vizualno unapređenje i UX
- [x] Stilizirati nova dugmad u skladu s postojećim dizajnom aplikacije
- [x] Dodati ikone za nova dugmad (npr. olovka za uređivanje)
- [x] Implementirati loading stanje tijekom ažuriranja
- [x] Dodati obavijesti o uspjehu/grešci nakon ažuriranja
- [x] Osigurati responsive dizajn za mobile uređaje

### 8. MRN izvještaj - Export funkcionalnost
- [ ] Ažurirati export funkcionalnost da uključuje nova polja u MRN izvještaju
- [ ] Ažurirati formatiranje izvještaja za nova polja
- [ ] Testirati export na različitim formatima (PDF, Excel, itd.)

### 9. Testiranje
- [ ] Testirati unos validnih vrijednosti (različite dužine, karakteri)
- [ ] Testirati unos nevalidnih vrijednosti (predugački stringovi)
- [ ] Testirati prikaz vrijednosti u detaljima operacije
- [ ] Testirati ažuriranje vrijednosti (izmjena postojećih)
- [ ] Testirati export funkcionalnost s novim poljima

### 10. Dokumentacija i deploy
- [ ] Ažurirati dokumentaciju za korisnike
- [ ] Ažurirati tehničku dokumentaciju
- [ ] Deploy na testno okruženje za QA
- [ ] Deploy na produkcijsko okruženje nakon odobrenja
