Odlično, proširujemo funkcionalnost sa preciznim praćenjem ulaza i carinjenja goriva, kao i upravljanjem fiksnim skladišnim tankovima. Ovo je ključno za potpunu sljedivost i kontrolu.

Evo ažuriranog task.md sa "bite-sized" zadacima za frontend i backend:

task.md - Modul za Upravljanje Avio Gorivom - Proširenje: Ulaz, Carinjenje i Fiksni Tankovi

Naziv Proširenja: FuelFlow Manager - Enhanced Intake & Storage

Cilj Proširenja: Omogućiti detaljno evidentiranje procesa ulaska goriva, uključujući podatke o dostavnoj cisterni, carinske informacije sa uploadom dokumenata, te upravljanje fiksnim skladišnim tankovima iz kojih se gorivo kasnije pretače u mobilne cisterne (koje već postoje u sistemu).

I. Backend Zadaci (Node.js / PostgreSQL)

1. Modeliranje Baze Podataka (PostgreSQL):

- [x] Zadatak B1.1: Kreiranje Tabele FixedStorageTanks

Polja: id (SERIAL PRIMARY KEY), tank_name (VARCHAR, npr. "Glavni Tank A1"), tank_identifier (VARCHAR, UNIQUE, npr. "FS-001"), capacity_liters (NUMERIC), current_liters (NUMERIC, DEFAULT 0), fuel_type (VARCHAR, npr. "Jet A-1", "Avgas 100LL"), location_description (TEXT, opciono), status (VARCHAR, npr. "Aktivan", "Neaktivan", "Na održavanju"), created_at (TIMESTAMPZ), updated_at (TIMESTAMPZ).

Definisati indekse za tank_identifier i fuel_type.

- [x] Zadatak B1.2: Kreiranje Tabele FuelIntakeRecords

Polja: id (SERIAL PRIMARY KEY), delivery_vehicle_plate (VARCHAR, registracija cisterne koja je dovezla gorivo), delivery_vehicle_driver_name (VARCHAR, opciono), intake_datetime (TIMESTAMPZ), quantity_liters_received (NUMERIC), quantity_kg_received (NUMERIC), specific_gravity (NUMERIC, npr. kg/l ), fuel_type (VARCHAR), supplier_name (VARCHAR, opciono), delivery_note_number (VARCHAR, opciono), customs_declaration_number (VARCHAR, opciono), created_at (TIMESTAMPZ), updated_at (TIMESTAMPZ).

Definisati indekse za intake_datetime, fuel_type.

- [x] Zadatak B1.3: Kreiranje Tabele FuelIntakeDocuments (za upload fajlova)

Polja: id (SERIAL PRIMARY KEY), fuel_intake_record_id (INTEGER, FOREIGN KEY REFERENCES FuelIntakeRecords(id) ON DELETE CASCADE), document_name (VARCHAR, originalno ime fajla), document_path (VARCHAR, putanja na serveru ili cloud storage URL), document_type (VARCHAR, npr. "Carinska Deklaracija", "Dostavnica", "Analiza Kvaliteta"), file_size_bytes (INTEGER), mime_type (VARCHAR), uploaded_at (TIMESTAMPZ).

Definisati indeks za fuel_intake_record_id.

- [x] Zadatak B1.4: Kreiranje Tabele FixedTankTransfers (Evidencija istovara u fiksne tankove)

Polja: id (SERIAL PRIMARY KEY), fuel_intake_record_id (INTEGER, FOREIGN KEY REFERENCES FuelIntakeRecords(id) ON DELETE CASCADE), fixed_storage_tank_id (INTEGER, FOREIGN KEY REFERENCES FixedStorageTanks(id)), quantity_liters_transferred (NUMERIC), transfer_datetime (TIMESTAMPZ, DEFAULT NOW()), notes (TEXT, opciono).

Definisati indekse za fuel_intake_record_id i fixed_storage_tank_id.

- [x] Zadatak B1.5: Ažuriranje Tabele FuelReplenishment (ako već postoji za mobilne cisterne)

Razmotriti da li postojeća tabela FuelReplenishment (ili TankRefill) treba da se preimenuje/modifikuje da označava pretakanje iz fiksnog tanka u mobilnu cisternu.

Ako je potrebno, dodati polje source_fixed_tank_id (INTEGER, FOREIGN KEY REFERENCES FixedStorageTanks(id)) da se zna odakle je gorivo pretočeno u mobilnu cisternu.

Ovaj zadatak zavisi od postojeće strukture. Alternativno, kreirati novu tabelu MobileTankRefills.

2. API Endpoints (Node.js / Express ili sličan framework):

- [x] Zadatak B2.1: CRUD Endpoints za FixedStorageTanks

POST /api/fuel/fixed-tanks (Kreiranje novog fiksnog tanka)

GET /api/fuel/fixed-tanks (Dobijanje liste svih fiksnih tankova, sa filterima za status, tip goriva)

GET /api/fuel/fixed-tanks/:id (Dobijanje detalja specifičnog fiksnog tanka)

PUT /api/fuel/fixed-tanks/:id (Ažuriranje fiksnog tanka)

DELETE /api/fuel/fixed-tanks/:id (Logičko brisanje ili deaktivacija fiksnog tanka)

- [x] Zadatak B2.2: CRUD Endpoints za FuelIntakeRecords

POST /api/fuel/intakes (Kreiranje novog zapisa o ulazu goriva. Request body treba da sadrži podatke za FuelIntakeRecords i niz podataka za FixedTankTransfers koji specificiraju u koje fiksne tankove i koliko je istočeno).

Logika: Prilikom kreiranja, transakciono ažurirati current_liters u relevantnim FixedStorageTanks.

GET /api/fuel/intakes (Dobijanje liste svih zapisa o ulazu, sa filterima za datum, tip goriva, dobavljača).

GET /api/fuel/intakes/:id (Dobijanje detalja specifičnog zapisa o ulazu, uključujući povezane FixedTankTransfers i FuelIntakeDocuments).

PUT /api/fuel/intakes/:id (Ažuriranje zapisa o ulazu - oprezno sa ažuriranjem količina i povezanih transfera).

- [x] Zadatak B2.3: CRUD Endpoints za FuelIntakeDocuments

POST /api/fuel/intakes/:intakeId/documents (Upload fajla vezanog za zapis o ulazu. Koristiti multer ili sličnu biblioteku za file upload. Sačuvati fajl na serveru/cloud-u i podatke u FuelIntakeDocuments).

GET /api/fuel/documents/:documentId (Download fajla).

DELETE /api/fuel/documents/:documentId (Brisanje fajla i zapisa iz baze).

- [x] Zadatak B2.4: Endpoints za FixedTankTransfers

POST /api/fuel/transfers/fixed-to-mobile

Request: source_fixed_tank_id, target_mobile_tank_id (ID postojeće mobilne cisterne), quantity_liters, transfer_datetime.

Logika: Transakciono umanjiti current_liters u FixedStorageTanks i uvećati current_liters u MobileTanks (vaša postojeća tabela za mobilne cisterne). Zapisati ovu transakciju (npr. u modifikovanu FuelReplenishment ili novu MobileTankRefills tabelu).

- [x] Zadatak B2.5: CRUD Endpoints za FuelReplenishment (točenje goriva u vozila/opremu)

3. Poslovna Logika i Validacija:

- [x] Zadatak B3.1: Validacija Ulaznih Podataka za sve endpoint-e (npr. da li su količine pozitivne, da li datumi imaju smisla, da li postoje referencirani tankovi).

    - [x] B3.1.1 Implementirati validaciju za `createFixedStorageTank` (uključujući `express-validator`, pravila u zasebnoj datoteci, ažuriranje rute, uklanjanje stare validacije iz kontrolera)
    - [x] B3.1.2 Implementirati validaciju za `updateFixedStorageTank` (slično kao za create, ali polja su opcionalna, plus provjera da `current_liters` ne prelazi `capacity_liters` u kontroleru)

- [x] Zadatak B3.2: Transakciono Ažuriranje Količina Goriva (koristiti transakcije baze podataka da se osigura konzistentnost prilikom ulaza goriva i transfera).

    - [x] B3.2.1 Implementirati validaciju za `createFuelingOperation`
    - [x] B3.2.2 Implementirati validaciju za `updateFuelingOperation` (napomena: `tankId` i `quantity_liters` se ne bi smjeli mijenjati nakon kreiranja; ako se `aircraftId` mijenja, `aircraft_registration` treba biti `null` i obrnuto)

- [x] Zadatak B3.3: Provjera Kapaciteta Tankova (ne dozvoliti prekoračenje kapaciteta prilikom ulaza ili transfera).

- [x] Zadatak B3.4: Logika za File Upload (ograničenja veličine, tipovi fajlova, sigurno čuvanje) - Implementirano za FuelReceipt. Kreće implementacija za FuelTransferToTanker.

II. Frontend Zadaci (Next.js / TypeScript / React)

1. Upravljanje Fiksnim Skladišnim Tankovima:

- [x] Zadatak F1.1: Stranica/Sekcija za Prikaz Fiksnih Tankova (struktura i API poziv postoje, blokirano zbog API greške "Not Found")

Tabelarni prikaz sa kolonama: Naziv, Identifikator, Kapacitet, Trenutna Količina (sa vizuelnim barom), Tip Goriva, Status, Akcije (Uredi, Deaktiviraj/Aktiviraj).

Mogućnost filtriranja po statusu i tipu goriva.

- [x] Zadatak F1.2: Forma za Dodavanje/Uređivanje Fiksnog Tanka (modal i forma postoje, funkcionalnost zavisi od F1.1)

Polja prema modelu FixedStorageTanks.

Validacija na klijentskoj strani.

- [x] Zadatak F1.3: Komponenta za Prikaz Detalja Fiksnog Tanka (modal, prikaz osnovnih detalja, API za istoriju transakcija implementiran i povezan).

Prikaz svih informacija i istorije transfera/ulaza vezanih za taj tank (zahtijeva dodatne backend endpointe za istoriju).

2. Evidencija Ulaska i Carinjenja Goriva:

- [x] Zadatak F2.1: Stranica/Sekcija za Prikaz Zapisa o Ulazu Goriva (komponenta FuelIntakeDisplay.tsx integrisana u tabove na /dashboard/fuel; akcije 'Detalji'/'Uredi' nisu implementirane).

Tabelarni prikaz: Datum, Dostavna Cisterna, Količina (L), Količina (KG), Gustoća, Tip Goriva, Carinski Broj, Akcije (Detalji, Uredi - ako je dozvoljeno).

Filtriranje po datumu, tipu goriva.

- [x] Zadatak F2.2: Višekoračna Forma (Wizard) za Novi Zapis o Ulazu Goriva

Korak 1: Osnovni Podaci o Dostavi: Datum/Vrijeme, Reg. dostavne cisterne, Vozač, Količina (L), Količina (KG), Spec. gustoća, Tip goriva, Dobavljač, Br. dostavnice, Br. carinske deklaracije.

Automatski proračun jedne od količina (L, KG, gustoća) ako su druge dvije unesene.

Korak 2: Raspodjela u Fiksne Tankove:

Mogućnost odabira jednog ili više fiksnih tankova (sa prikazom trenutnog slobodnog kapaciteta).

Unos količine koja se istovara u svaki odabrani fiksni tank.

Validacija da ukupna istočena količina ne prelazi primljenu količinu.

Korak 3: Upload Dokumenata:

Komponenta za upload više fajlova (drag & drop, odabir).

Mogućnost specificiranja tipa dokumenta za svaki fajl.

Prikaz liste uploadovanih fajlova sa opcijom brisanja prije slanja forme.

- [x] Zadatak F2.3: Komponenta za Prikaz Detalja Zapisa o Ulazu Goriva

Prikaz svih unesenih podataka.

Lista istočavanja u fiksne tankove.

Lista priloženih dokumenata sa opcijom za download.

3. Pretakanje iz Fiksnog Tanka u Mobilnu Cisternu:

- [x] Zadatak F3.1: Forma/Modal za Evidenciju Pretakanja (Fixed-to-Mobile)

Odabir izvornog fiksnog tanka (sa prikazom dostupne količine).

Odabir ciljne mobilne cisterne (iz postojećeg sistema, sa prikazom slobodnog kapaciteta).

Unos količine za pretakanje.

Datum/Vrijeme transfera.

Validacija količina.

4. Ažuriranje UI za Mobilne Cisterne:

- [ ] Zadatak F4.1: Prikaz Izvora Dopune Mobilne Cisterne

Ako je mobilna cisterna dopunjena iz fiksnog tanka, prikazati informaciju o tome (npr. "Dopunjeno iz Fiksnog Tanka X").

5. Stanje (State Management) i API Integracija:

- [x] Zadatak F5.1: Definisanje TypeScript Tipova/Interfejsa za nove entitete (FixedStorageTank - urađeno, FuelIntakeRecord, FuelIntakeDocument, FixedTankTransfer - ostaje za uraditi).

- [x] Zadatak F5.2: Kreiranje Servisnih Funkcija za API Pozive (getFixedTanks implementiran, ostali po potrebi).

- [x] Zadatak F5.3: Upravljanje Stanjem Aplikacije (loading/error stanja za FixedTanksDisplay implementirana).

- [ ] Zadatak F5.4: Implementacija Toast Notifikacija za uspješne operacije i greške.

Dodatne Napomene i Razmatranja:

Korisničke Dozvole: Razmisliti ko ima pravo da unosi/uređuje ove podatke.

Istorija Izmjena (Audit Log): Za kritične podatke, razmotriti dodavanje logovanja izmjena (ko, šta, kada).

Performanse: Posebno za liste i izvještaje, optimizovati API pozive i renderovanje na frontendu (paginacija, virtualizacija).

Testiranje: Jedinično i integraciono testiranje za backend logiku i API. E2E testiranje za ključne korisničke tokove na frontendu.

Ova podjela na manje zadatke trebala bi olakšati planiranje, dodjelu i praćenje napretka. Svaki "Zadatak X.Y.Z" je dovoljno mali da se može završiti u relativno kratkom vremenskom periodu.