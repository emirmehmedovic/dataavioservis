# Plan Realizacije: Nova Stranica "Izvještaji i statistika"

**Cilj:** Kreirati novu stranicu dostupnu samo korisnicima s rolom "Kontrola" i administratorima, koja će prikazivati različite izvještaje i statistike vezane za gorivo, tankove i operacije.

## Faza 1: Osnovna Struktura i Pristup
1.  **Korisnička Rola "Kontrola":**
    *   Provjeriti postoji li rola "Kontrola" u sustavu (backend: `UserRole` enum, baza podataka).
    *   Ako ne postoji, dogovoriti kako je dodati (izmjena enuma, migracija baze, eventualno UI za dodjelu role).
2.  **Navigacija (Sidebar):**
    *   Dodati novu stavku "Izvještaji i statistika" u `Sidebar.tsx`.
    *   Implementirati prikaz ove stavke samo za korisnike s rolom "Kontrola" ili "Admin".
3.  **Rute (Routing):**
    *   Definirati novu rutu, npr. `/dashboard/reports`, za `frontend/src/app/dashboard/reports/page.tsx`.
4.  **Osnovna Komponenta Stranice:**
    *   Kreirati osnovnu React komponentu za novu stranicu.
    *   Implementirati provjeru role na samoj stranici (npr. preusmjeravanje ili prikaz poruke o zabrani pristupa ako korisnik nema odgovarajuću rolu).

## Faza 2: Backend API Endpoints (Ako bude potrebno)
*   Analizirati jesu li postojeći API endpointi dovoljni (`getFixedTanks`, `getFixedTankHistory`, `getFuelIntakes`, `getFuelingOperations` itd.).
*   Identificirati potrebu za novim agregiranim ili filtriranim endpointima za efikasniji prikaz na stranici izvještaja.

## Faza 3: Frontend - Izvještaj Detalja Fiksnih Tankova
[x] 1.  **Prikaz Liste Fiksnih Tankova:**
    *   [x] Dohvatiti sve fiksne tankove.
    *   [x] Prikazati osnovne informacije za svaki tank (npr. Naziv, trenutna količina / kapacitet).
[x] 2.  **Prikaz Povijesti Transakcija Tanka:**
    *   [x] Za svaki tank, prikazati njegovu povijest transakcija (prilagoditi logiku iz postojećeg modala).
    *   [x] Implementiran PDF eksport povijesti transakcija.

## Faza 4: Frontend - Izvještaj Tankera i Cisterni
1.  **Definiranje "Tankera i Cisterni":** Potvrditi odnosi li se ovo na entitet `Vehicle` s određenim tipom ili na novi entitet.
2.  **Prikaz Liste Tankera/Cisterni:**
    *   Dohvatiti relevantna vozila/entitete.
    *   Prikazati ključne detalje i eventualno povezane transakcije.

## Faza 5: Frontend - Izvještaj Evidencije Ulaska Goriva
[x] 1.  **Prikaz Liste Evidencija Ulaska Goriva:**
    *   [x] Dohvatiti i prikazati sve evidencije ulaska goriva.
[x] 2.  **Integracija Modala:**
    *   [x] Prilagoditi i koristiti `FuelIntakeRecordDetailsModal.tsx` s funkcionalnošću preuzimanja dokumenata.
    *   [x] Implementiran PDF eksport pojedinačnog zapisa o ulazu goriva.

## Faza 6: Frontend - Izvještaj Izlaznih Operacija Točenja Goriva
1.  **Prikaz Liste Izlaznih Operacija:**
    *   Dohvatiti i prikazati sve izlazne operacije.
2.  **Integracija Modala:**
    *   Razviti ili prilagoditi modal za prikaz detalja izlazne operacije.

## Faza 7: Frontend - Sekcija Detaljne Statistike
1.  **Prikupljanje Zahtjeva:** Detaljno specificirati potrebne statistike.
2.  **Backend (Ako bude potrebno):** Razviti API endpoint(e) za agregirane statističke podatke.
3.  **Frontend Komponente:** Implementirati prikaz statistika (grafovi, tablice).

## Faza 8: Stilovi i Fino Podešavanje
1.  Osigurati stilsku usklađenost s ostatkom aplikacije.
2.  Sveobuhvatno testiranje i ispravljanje grešaka.

## Ograničenja:
*   Ne mijenjati niti brisati postojeće funkcije i komponente ako nije apsolutno nužno.
*   Fokusirati se na dodavanje novih prikaza za potrebe menadžerskog pregleda ("Kontrola" rola).
