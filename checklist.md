DATA-AVIOSERVIS

Kratak Opis:
Web aplikacija je sveobuhvatni administrativni portal dizajniran za efikasno vođenje evidencije, praćenje i upravljanje voznim parkom, opremom, servisnim aktivnostima, te kao buduće proširenje, evidencijom avio goriva. Sistem omogućava centralizovan pristup podacima, automatizaciju podsjetnika za održavanje, generisanje izvještaja i poboljšanje ukupne operativne efikasnosti.

Ciljevi Aplikacije:

Centralizacija Podataka: Ukloniti potrebu za vođenjem evidencije u Excel tabelama i pružiti jedinstvenu, ažurnu bazu podataka dostupnu ovlašćenim korisnicima.
Automatizacija Praćenja: Automatski pratiti rokove za zamjenu filtera, godišnje inspekcije, zamjene crijeva, kalibracije i druge periodične preglede.
Poboljšanje Održavanja: Omogućiti detaljno praćenje servisnih naloga, istorije servisa po vozilu i planiranje budućih održavanja.
Izvještavanje i Analiza: Pružiti mogućnost generisanja različitih izvještaja (PDF, Excel) za bolji uvid u status voznog parka, troškove održavanja i predstojeće obaveze.
Upravljanje Korisnicima: Definisati različite korisničke uloge sa specifičnim dozvolama za pristup i modifikaciju podataka.
Skalabilnost: Dizajnirati sistem tako da omogući laku nadogradnju i dodavanje novih modula, kao što je evidencija o avio gorivu.
Jednostavnost Korišćenja: Obezbijediti intuitivan i pregledan korisnički interfejs koji olakšava unos, pretragu i analizu podataka.
Ključne Funkcionalnosti:

Evidencija Vozila i Opreme:
Detaljan unos i pregled podataka o svakom vozilu/opremi (naziv, status, firma, lokacija, tablice, vessel plate no, itd.).
Mogućnost dodavanja jedne ili više fotografija za svako vozilo.
Specifična polja za praćenje filtera (datum ugradnje/zamjene, period važenja, tip filtera, automatski izračunat datum isteka).
Praćenje datuma godišnjih inspekcija i automatsko izračunavanje narednih.
Evidencija o zamjeni crijeva (HD 63, HD 38, TW 75) sa datumima posljednje i planirane sljedeće zamjene.
Praćenje datuma ispitivanja crijeva na nepropusnost, kalibracije volumetra, umjeravanja manometara, ispitivanja HECPV/ILCPV, i 6-mjesečnih pregleda, sa opcijom unosa perioda za ponavljanje.
Polja za slobodan unos (npr. senzor tehnologija, napomene, kontakt odgovorne osobe).
Sva izračunata polja za "broj dana do" (zamjene, inspekcije) sa vizuelnim indikatorima.
Upravljanje Servisnim Nalozima:
Kreiranje, pregled, izmjena i brisanje servisnih naloga za svako vozilo.
Servisni nalog sadrži informacije kao što su: vozilo, datum servisa, opis radova, izvršilac, status naloga (npr. otvoren, u radu, završen), utrošeni dijelovi, cijena.
Automatsko ažuriranje relevantnih datuma na vozilu (npr. datum zamjene filtera) nakon zatvaranja odgovarajućeg servisnog naloga.
Kompletna istorija servisa dostupna po vozilu.
Korisnici i Uloge:
Admin: Puni pristup svim funkcionalnostima, uključujući upravljanje korisnicima, firmama, lokacijama i konfiguracijom sistema.
Serviser: Pristup evidenciji vozila, servisnim nalozima, mogućnost unosa i izmjene podataka vezanih za održavanje. Nema mogućnost kreiranja novih korisnika.
Aviogorivo-Korisnik (buduća uloga): Pristup samo modulima, analizama i izvještajima vezanim za evidenciju avio goriva.
Upravljanje Firmama i Lokacijama:
Mogućnost unosa i upravljanja listom firmi čija se vozila prate.
Mogućnost unosa i upravljanja listom lokacija na kojima se vozila nalaze.
Povezivanje vozila sa odgovarajućom firmom i lokacijom.
Pretraga, Filtriranje i Sortiranje:
Napredna pretraga vozila po različitim kriterijumima (npr. broj tablica, naziv vozila, vessel plate no).
Filtriranje liste vozila po statusu, firmi, lokaciji, itd.
Sortiranje podataka u tabelama po većini kolona.
Izvještaji i Analitika:
Generisanje izvještaja u PDF i Excel formatu:
Lista svih vozila sa statusom.
Lista vozila kojima ističe filter/inspekcija/zamjena crijeva u narednih X dana.
Istorija servisa za određeno vozilo.
Izvještaj o troškovima servisa po vozilu/periodu (potencijalno proširenje).
Osnovne vizuelne notifikacije unutar sistema za stavke koje zahtijevaju hitnu pažnju.
Evidencija o Avio Gorivu (Buduća Nadogradnja):
Praćenje stanja goriva u tankovima i cisternama.
Evidencija inspekcija i provjera kvaliteta goriva.
Evidencija utočenog goriva (u tankove/cisterne) i istočenog goriva (u avione).
Praćenje izdatih količina prema avio kompanijama i destinacijama.
Lokacijsko praćenje tankova i cisterni.
Generisanje chartova, analiza i izvještaja specifičnih za avio gorivo (PDF download).
Tehnička Arhitektura:
Frontend: Next.js (React, TypeScript) sa Tailwind CSS za stilizovanje.
Backend: Node.js sa Express.js framework-om (TypeScript).
Baza Podataka: PostgreSQL.
ORM: Prisma.
Autentifikacija: JWT (JSON Web Tokens).
Slike Vozila: Čuvanje na fajl sistemu servera, sa putanjama u bazi podataka.
Korisnički Interfejs (UI/UX):
Aplikacija će imati čist, moderan i intuitivan korisnički interfejs, optimizovan za administrativne zadatke. Fokus će biti na preglednosti podataka, lakoj navigaciji i efikasnom unosu informacija. Dizajn će pratiti principe funkcionalnosti i jednostavnosti.

Očekivane Prednosti:

Značajno smanjenje vremena potrebnog za administrativne poslove vezane za vozni park.
Povećana transparentnost i dostupnost informacija.
Proaktivno održavanje vozila zahvaljujući automatskim podsjetnicima.
Smanjenje rizika od propuštanja važnih rokova za servise i inspekcije.
Bolja kontrola troškova održavanja.
Osnova za dalji razvoj i integraciju dodatnih funkcionalnosti.

FAZA 0: Osnovna Postavka i Dizajn Baze

- [ ] Zadatak 0.1: Inicijalizacija Next.js Projekta (Frontend)
    - [x] Kreiranje novog Next.js projekta (create-next-app).
    - [x] Dodavanje TypeScript-a u projekat.
    - [x] Instalacija i konfiguracija Tailwind CSS-a.
    - [ ] Postavljanje osnovne strukture direktorijuma (components, pages, lib, styles, itd.).
    - [x] Inicijalizacija Git repozitorijuma.
- [ ] Zadatak 0.2: Inicijalizacija Node.js/Express.js Projekta (Backend)
    - [x] Kreiranje package.json (npm init).
    - [x] Instalacija osnovnih zavisnosti (Express, TypeScript, ts-node, nodemon).
    - [x] Konfiguracija tsconfig.json za backend.
    - [x] Postavljanje osnovne strukture direktorijuma (src, routes, controllers, services, middlewares, config, itd.).
    - [x] Kreiranje osnovnog Express servera (app.ts ili index.ts).
    - [ ] Inicijalizacija Git repozitorijuma (ili dodavanje u postojeći monorepo).
- [ ] Zadatak 0.3: Postavka PostgreSQL Baze Podataka
    - [ ] Instalacija PostgreSQL servera (lokalno ili na razvojnom serveru).
    - [ ] Kreiranje nove baze podataka za projekat.
    - [ ] Kreiranje korisnika baze podataka sa odgovarajućim dozvolama.
- [ ] Zadatak 0.4: Integracija Prisma ORM-a u Backend Projekat
    - [ ] Instalacija Prisma CLI i Prisma Client (npm install prisma --save-dev, npm install @prisma/client).
    - [ ] Inicijalizacija Prisma u projektu (npx prisma init --datasource-provider postgresql).
    - [ ] Konfiguracija .env fajla sa konekcionim stringom za bazu.
- [ ] Zadatak 0.5: Dizajn Prisma Šeme (schema.prisma) (MVP Fokus)
    - [ ] Definisanje User modela (polja: id, username, passwordHash, role (Enum: ADMIN, SERVICER, FUEL_USER), createdAt, updatedAt).
Definisanje Company modela (polja: id, name, createdAt, updatedAt, relacija ka Vehicle).
Definisanje Location modela (polja: id, name, address (opciono), createdAt, updatedAt, relacija ka Company (opciono), relacija ka Vehicle).
Definisanje Vehicle modela:
Osnovna polja (id, status (Enum), vehicle_name, license_plate (unique), chassis_number (opciono), vessel_plate_no (opciono), notes).
Polja za filter (filter_installed (Boolean), filter_installation_date (DateTime?), filter_validity_period_months (Int), filter_expiry_date (DateTime - izračunato/uneseno), filter_type_plate_no).
Polja za inspekciju (last_annual_inspection_date (DateTime), next_annual_inspection_date (DateTime - izračunato)).
Polja za senzore (sensor_technology (String?)).
Polja za crijeva (npr. last_hose_hd63_replacement_date, next_hose_hd63_replacement_date, last_hose_hd38_replacement_date, itd., last_hose_leak_test_date, next_hose_leak_test_date).
Polja za kalibraciju/umjeravanje (last_volumeter_calibration_date, next_volumeter_calibration_date, last_manometer_calibration_date, next_manometer_calibration_date, last_hecpv_ilcpv_test_date, next_hecpv_ilcpv_test_date).
Polje za 6-mjesečni pregled (last_6_month_check_date, next_6_month_check_date).
Kontakt (responsible_person_contact (String?)).
Relacije: companyId -> Company, locationId -> Location.
Polja za datume (createdAt, updatedAt).
Definisanje VehicleImage modela (polja: id, imageUrl (String), vehicleId -> Vehicle, uploadedAt).
Definisanje ServiceLog modela (polja: id, vehicleId -> Vehicle, service_date (DateTime), description (String), performed_by (String?), status (String?), cost (Decimal?), createdAt, updatedAt).
Osnovna definicija modela za avio gorivo (placeholderi):
FuelTank (polja: id, name, location, capacity, current_level).
FuelTransaction (polja: id, tankId (opciono), vehicleId (cisterna, opciono), transaction_type (Enum: IN, OUT_TO_AIRCRAFT, OUT_TO_VEHICLE), quantity, date, aircraft_registration (opciono), destination_company (opciono)).
Pokretanje prve migracije (npx prisma migrate dev --name init).
Zadatak 0.6: Odluka i Implementacija Osnovne Logike za Čuvanje Fotografija
Odluka: Fajl sistem servera.
Definisanje strukture direktorijuma za slike na serveru (npr. uploads/vehicle_images/).
Instalacija multer ili slične biblioteke u backend za rukovanje file upload-om.
Osnovna konfiguracija multer-a (destinacija, limit veličine fajla, filtriranje tipa fajla).
FAZA 1: Backend Razvoj - Jezgro (Vozila, Korisnici, Firme, Lokacije)

Zadatak 1.1: API Endpoints za User
Implementacija POST /auth/register (samo za Admina da kreira nove korisnike) - heširanje lozinke.
Implementacija POST /auth/login - generisanje JWT tokena.
Middleware za autentifikaciju (provjera JWT tokena).
Middleware za autorizaciju (provjera uloge korisnika).
Implementacija GET /users (samo Admin, lista korisnika).
Implementacija GET /users/:id (samo Admin, detalji korisnika).
Implementacija PUT /users/:id (samo Admin, izmjena korisnika).
Implementacija DELETE /users/:id (samo Admin, brisanje korisnika).
Implementacija GET /auth/me (dohvatanje podataka o trenutno ulogovanom korisniku).
Zadatak 1.2: API Endpoints za Company
Implementacija POST /companies (zaštićeno).
Implementacija GET /companies (zaštićeno).
Implementacija GET /companies/:id (zaštićeno).
Implementacija PUT /companies/:id (zaštićeno).
Implementacija DELETE /companies/:id (zaštićeno).
Zadatak 1.3: API Endpoints za Location
Implementacija POST /locations (zaštićeno).
Implementacija GET /locations (zaštićeno).
Implementacija GET /locations/:id (zaštićeno).
Implementacija PUT /locations/:id (zaštićeno).
Implementacija DELETE /locations/:id (zaštićeno).
Zadatak 1.4: API Endpoints za Vehicle
Implementacija POST /vehicles (zaštićeno).
Validacija ulaznih podataka.
Logika za automatsko izračunavanje filter_expiry_date ako su dati filter_installation_date i filter_validity_period_months.
Logika za automatsko izračunavanje next_annual_inspection_date (npr. last_annual_inspection_date + 1 godina).
Slična logika za ostale datume isteka (crijeva, kalibracije) ako su intervali poznati i fiksni, ili ako se unosi datum sledećeg.
Implementacija GET /vehicles (zaštićeno).
Mogućnost paginacije.
Mogućnost sortiranja (npr. ?sortBy=license_plate&order=asc).
Mogućnost filtriranja (npr. ?status=ACTIVE&companyId=1).
Mogućnost pretrage (npr. ?search=ABC-123).
Logika za dinamičko izračunavanje "dana do isteka" za filter, inspekciju, crijeva itd. i slanje kao dio odgovora ili omogućavanje frontendu da računa.
Implementacija GET /vehicles/:id (zaštićeno).
Dohvatanje vozila sa povezanim slikama i istorijom servisa (ako je već implementirano).
Implementacija PUT /vehicles/:id (zaštićeno).
Validacija ulaznih podataka.
Ažuriranje logike za izračunavanje datuma.
Implementacija DELETE /vehicles/:id (zaštićeno).
Razmotriti šta se dešava sa povezanim slikama i servisnim nalozima (soft delete ili kaskadno brisanje).
Zadatak 1.5: API Endpoints za VehicleImage
Implementacija POST /vehicles/:vehicleId/images (upload jedne ili više slika, koristi multer).
Čuvanje fajla na serveru.
Kreiranje zapisa u VehicleImage tabeli sa putanjom do slike.
Implementacija DELETE /vehicle-images/:imageId (brisanje slike sa servera i iz baze).
Zadatak 1.6: Middleware za Autorizaciju (proširenje)
Implementacija funkcije/middleware-a checkRole(roles_array) koja provjerava da li korisnik ima jednu od dozvoljenih uloga za pristup ruti.
Primjena middleware-a na sve relevantne rute.
FAZA 2: Frontend Razvoj - Admin Portal (Vozila, Korisnici, Firme, Lokacije)

Zadatak 2.1: Osnovni Layout Admin Portala
Kreiranje Layout komponente (Next.js).
Implementacija Navbar komponente.
Implementacija Sidebar komponente (ako je potrebna).
Kreiranje "zaštićenih ruta" HOC-a ili logike u _app.tsx za provjeru autentifikacije prije prikaza stranice.
Definisanje globalnog state managementa (npr. Zustand, Redux Toolkit, React Context) za korisničku sesiju i sl.
Zadatak 2.2: Stranica za Login
Kreiranje forme za login (username, password).
Poziv API endpointa /auth/login.
Čuvanje JWT tokena (npr. u localStorage ili httpOnly kolačiću) i podataka o korisniku u globalnom stanju.
Preusmjeravanje na dashboard nakon uspješnog logina.
Prikaz grešaka pri neuspješnom loginu.
Zadatak 2.3: Komponenta/Stranica za Upravljanje Korisnicima (samo Admin)
Zaštita rute samo za Admine.
Prikaz tabele korisnika (poziv GET /users).
Forma za kreiranje novog korisnika (poziv POST /auth/register).
Mogućnost izmjene korisnika (modal/stranica sa formom, poziv PUT /users/:id).
Mogućnost brisanja korisnika (uz potvrdu, poziv DELETE /users/:id).
Zadatak 2.4: Komponenta/Stranica za Upravljanje Firmama
Prikaz liste firmi (poziv GET /companies).
Forma za dodavanje nove firme (poziv POST /companies).
Mogućnost izmjene firme (poziv PUT /companies/:id).
Mogućnost brisanja firme (poziv DELETE /companies/:id).
Zadatak 2.5: Komponenta/Stranica za Upravljanje Lokacijama
Prikaz liste lokacija (poziv GET /locations).
Forma za dodavanje nove lokacije (poziv POST /locations).
Mogućnost izmjene lokacije (poziv PUT /locations/:id).
Mogućnost brisanja lokacije (poziv DELETE /locations/:id).
Zadatak 2.6: Prikaz Liste Vozila (/vehicles)
Kreiranje stranice za prikaz liste vozila.
Implementacija tabele (npr. koristeći react-table ili custom Tailwind komponente).
Prikaz ključnih kolona (definisati koje su najvažnije).
Implementacija klijentskog ili serverskog sortiranja.
Implementacija klijentskog ili serverskog filtriranja (dropdowni za status, firmu, lokaciju).
Implementacija polja za pretragu (poziv API-ja sa search parametrom).
Vizuelno isticanje redova (npr. crvena boja za <7 dana do isteka, žuta za <30 dana).
Prikaz thumbnaila prve slike vozila (ako postoji).
Dugme/link za "Detalji" koje vodi na stranicu detalja vozila.
Dugme za "Dodaj novo vozilo".
Implementacija paginacije (klijentske ili serverske).
Zadatak 2.7: Stranica sa Detaljima Vozila (/vehicles/[id])
Dohvatanje podataka o specifičnom vozilu (poziv GET /vehicles/:id).
Prikaz svih polja o vozilu u čitljivom formatu.
Forma za izmjenu podataka o vozilu (poziv PUT /vehicles/:id pri submitu).
Sva polja iz Excela, mapirana na formu.
Odabir Firme i Lokacije iz dropdowna (pune se sa GET /companies i GET /locations).
Sekcija za prikaz slika vozila:
Prikaz galerije slika (ako ih ima više).
Mogućnost otvaranja slike u punoj veličini (lightbox).
Sekcija za upload novih slika (poziv POST /vehicles/:vehicleId/images).
Mogućnost brisanja postojećih slika (poziv DELETE /vehicle-images/:imageId).
Sekcija za prikaz istorije servisnih naloga (integracija sa Fazom 3).
Zadatak 2.8: Forma za Unos Novog Vozila (/vehicles/new)
Kreiranje stranice sa formom za unos novog vozila.
Sva relevantna polja iz Excela.
Dropdowni za odabir Firme i Lokacije.
Poziv POST /vehicles pri submitu forme.
Preusmjeravanje na listu vozila ili detalje novokreiranog vozila nakon uspješnog unosa.
FAZA 3: Servisni Nalozi i Osnovni Izvještaji

Zadatak 3.1 (Backend): API Endpoints za ServiceLog
Implementacija POST /vehicles/:vehicleId/service-logs (zaštićeno).
Prilikom kreiranja, ako servisni nalog označava zamjenu filtera, ažurirati vehicle.filter_installation_date i vehicle.filter_expiry_date.
Slična logika za godišnju inspekciju, zamjenu crijeva, itd.
Implementacija GET /vehicles/:vehicleId/service-logs (zaštićeno, lista servisa za vozilo).
Implementacija GET /service-logs/:logId (zaštićeno, detalji jednog servisa).
Implementacija PUT /service-logs/:logId (zaštićeno).
Ažurirati relevantna polja na vozilu ako se mijenja tip servisa.
Implementacija DELETE /service-logs/:logId (zaštićeno).
Zadatak 3.2 (Frontend): UI za Upravljanje Servisnim Nalozima
Na stranici detalja vozila (/vehicles/[id]):
Prikaz tabele/liste servisnih naloga za to vozilo (poziv GET /vehicles/:vehicleId/service-logs).
Dugme "Dodaj servisni nalog" koje otvara modal/formu.
Forma za unos/izmjenu servisnog naloga (datum, opis, izvršilac, status, cijena, tip servisa - ovo može biti dropdown koji utiče na ažuriranje vozila).
Mogućnost izmjene i brisanja postojećih servisnih naloga.
Zadatak 3.3 (Backend & Frontend): Generisanje Izvještaja
Backend:
Endpoint GET /reports/vehicles-status (vraća podatke za listu svih vozila sa statusom).
Endpoint GET /reports/expiring-filters?days=X (vraća vozila kojima ističe filter u X dana).
Endpoint GET /reports/expiring-inspections?days=X (vraća vozila kojima ističe inspekcija u X dana).
Endpoint GET /reports/vehicle-service-history/:vehicleId (vraća sve servisne naloge za vozilo).
Frontend:
Stranica/sekcija za izvještaje.
Dugmad za generisanje svakog tipa izvještaja.
Korišćenje biblioteka kao jspdf i xlsx (ili sheetjs) za generisanje PDF/Excel fajlova na klijentu na osnovu podataka dobijenih sa backend endpointa.
Opcija za odabir broja dana (X) za izvještaje o isteku.
Zadatak 3.4 (Frontend): Osnovne Notifikacije Unutar Sistema
Na dashboardu ili u headeru, prikaz brojača za kritične stavke (npr. "Filteri za zamjenu: 5", "Inspekcije uskoro: 3").
Opciono: Lista tih kritičnih stavki sa linkovima ka odgovarajućim vozilima.
FAZA 4: Evidencija o Avio Gorivu (MVP) (Ovo se može preklapati ili započeti nakon stabilizacije Faza 1-3)

Zadatak 4.1 (Backend): API Endpoints za FuelTank
POST /fuel-tanks
GET /fuel-tanks
GET /fuel-tanks/:id
PUT /fuel-tanks/:id
DELETE /fuel-tanks/:id
Zadatak 4.2 (Backend): API Endpoints za FuelTransaction
POST /fuel-transactions
Logika za ažuriranje current_level u FuelTank (ako je transakcija vezana za tank).
Logika za ažuriranje stanja goriva na cisterni (ako je Vehicle cisterna i ako se prati stanje na njoj).
GET /fuel-transactions (sa filtrima po datumu, tipu, tanku, vozilu).
GET /fuel-transactions/:id
PUT /fuel-transactions/:id (sa logikom re-kalkulacije stanja).
DELETE /fuel-transactions/:id (sa logikom re-kalkulacije stanja).
Zadatak 4.3 (Frontend): UI za Upravljanje Tankovima Goriva
Stranica za prikaz liste tankova, dodavanje, izmjenu, brisanje.
Zadatak 4.4 (Frontend): UI za Unos i Pregled Transakcija Goriva
Stranica za prikaz liste transakcija sa filterima.
Forma za unos nove transakcije (odabir tanka/cisterne, tip transakcije, količina, itd.).
Zadatak 4.5 (Frontend): Osnovni Prikazi/Izvještaji o Gorivu
Tabela sa stanjem goriva po tankovima.
Tabela sa listom transakcija i opcijom za PDF/Excel download.
Osnovni chartovi (npr. potrošnja po periodu, stanje tankova) koristeći npr. Chart.js ili Recharts.
Zadatak 4.6: Prilagođavanje FUEL_USER Uloge
Ograničiti FUEL_USER da vidi samo stranice i podatke vezane za avio gorivo.
Podesiti navigaciju za FUEL_USER.
FAZA 5: Testiranje, Optimizacija i Postavljanje (Deployment)

Zadatak 5.1: Detaljno Testiranje Svih Funkcionalnosti
Testiranje CRUD operacija za sve entitete.
Testiranje logike autentifikacije i autorizacije.
Testiranje uloga korisnika.
Testiranje uploada i prikaza slika.
Testiranje logike izračunavanja datuma i dana do isteka.
Testiranje generisanja izvještaja (PDF, Excel).
Testiranje funkcionalnosti avio goriva.
Testiranje na različitim pretraživačima (osnovno).
Testiranje responzivnosti (osnovno).
Zadatak 5.2: Optimizacija
Pregled sporih Prisma upita i njihova optimizacija (indeksi, selektivno dohvaćanje).
Optimizacija performansi frontenda (bundle size, rendering).
Code review i refaktorisanje.
Zadatak 5.3: Priprema za Produkcijsko Okruženje
Definisanje svih potrebnih varijabli okruženja (.env.production).
Podešavanje logovanja za produkciju.
