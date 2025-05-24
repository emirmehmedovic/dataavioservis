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
    - [x] Postavljanje osnovne strukture direktorijuma (components, pages, lib, styles, itd.).
    - [x] Inicijalizacija Git repozitorijuma.
- [ ] Zadatak 0.2: Inicijalizacija Node.js/Express.js Projekta (Backend)
    - [x] Kreiranje package.json (npm init).
    - [x] Instalacija osnovnih zavisnosti (Express, TypeScript, ts-node, nodemon).
    - [x] Konfiguracija tsconfig.json za backend.
    - [x] Postavljanje osnovne strukture direktorijuma (src, routes, controllers, services, middlewares, config, itd.).
    - [x] Kreiranje osnovnog Express servera (app.ts ili index.ts).
    - [x] Inicijalizacija Git repozitorijuma (ili dodavanje u postojeći monorepo).
- [ ] Zadatak 0.3: Postavka PostgreSQL Baze Podataka
    - [x] Instalacija PostgreSQL servera (lokalno ili na razvojnom serveru).
    - [x] Kreiranje nove baze podataka za projekat.
    - [x] Kreiranje korisnika baze podataka sa odgovarajućim dozvolama.
- [ ] Zadatak 0.4: Integracija Prisma ORM-a u Backend Projekat
    - [x] Instalacija Prisma CLI i Prisma Client (npm install prisma --save-dev, npm install @prisma/client).
    - [x] Inicijalizacija Prisma u projektu (npx prisma init --datasource-provider postgresql).
    - [x] Konfiguracija .env fajla sa konekcionim stringom za bazu.
- [ ] Zadatak 0.5: Dizajn Prisma Šeme (schema.prisma) (MVP Fokus)
    - [x] Definisanje User modela (polja: id, username, passwordHash, role (Enum: ADMIN, SERVICER, FUEL_USER), createdAt, updatedAt).
    - [x] Definisanje Company modela (polja: id, name, createdAt, updatedAt, relacija ka Vehicle).
    - [x] Definisanje Location modela (polja: id, name, address (opciono), createdAt, updatedAt, relacija ka Company (opciono), relacija ka Vehicle).
- [x] Definisanje Vehicle modela:
    - [x] Osnovna polja (id, status (Enum), vehicle_name, license_plate (unique), chassis_number (opciono), vessel_plate_no (opciono), notes).
    - [x] Polja za filter (filter_installed (Boolean), filter_installation_date (DateTime?), filter_validity_period_months (Int), filter_expiry_date (DateTime - izračunato/uneseno), filter_type_plate_no).
    - [x] Polja za inspekciju (last_annual_inspection_date (DateTime), next_annual_inspection_date (DateTime - izračunato)).
    - [x] Polja za senzore (sensor_technology (String?)).
    - [x] Polja za crijeva (npr. last_hose_hd63_replacement_date, next_hose_hd63_replacement_date, last_hose_hd38_replacement_date, itd., last_hose_leak_test_date, next_hose_leak_test_date).
    - [x] Polja za kalibraciju/umjeravanje (last_volumeter_calibration_date, next_volumeter_calibration_date, last_manometer_calibration_date, next_manometer_calibration_date, last_hecpv_ilcpv_test_date, next_hecpv_ilcpv_test_date).
    - [x] Polje za 6-mjesečni pregled (last_6_month_check_date, next_6_month_check_date).
    - [x] Kontakt (responsible_person_contact (String?)).
    - [x] Relacije: companyId -> Company, locationId -> Location.
    - [x] Polja za datume (createdAt, updatedAt).
Definisanje VehicleImage modela (polja: id, imageUrl (String), vehicleId -> Vehicle, uploadedAt).
Definisanje ServiceLog modela (polja: id, vehicleId -> Vehicle, service_date (DateTime), description (String), performed_by (String?), status (String?), cost (Decimal?), createdAt, updatedAt).
Osnovna definicija modela za avio gorivo (placeholderi):
FuelTank (polja: id, name, location, capacity, current_level).
FuelTransaction (polja: id, tankId (opciono), vehicleId (cisterna, opciono), transaction_type (Enum: IN, OUT_TO_AIRCRAFT, OUT_TO_VEHICLE), quantity, date, aircraft_registration (opciono), destination_company (opciono)).
~~- [x] Pokretanje prve migracije (npx prisma migrate dev --name init).~~
Zadatak 0.6: Odluka i Implementacija Osnovne Logike za Čuvanje Fotografija
Odluka: Fajl sistem servera.
Definisanje strukture direktorijuma za slike na serveru (npr. uploads/vehicle_images/).
Instalacija multer ili slične biblioteke u backend za rukovanje file upload-om.
Osnovna konfiguracija multer-a (destinacija, limit veličine fajla, filtriranje tipa fajla).
FAZA 1: Backend Razvoj - Jezgro (Vozila, Korisnici, Firme, Lokacije)

Zadatak 1.1: API Endpoints za User (Refaktorisano u Controller/Service slojeve)
    - [x] Implementacija POST /auth/register (samo za Admina da kreira nove korisnike) - heširanje lozinke.
    - [x] Implementacija POST /auth/login - generisanje JWT tokena.
    - [x] Middleware za autentifikaciju (provjera JWT tokena).
    - [x] Middleware za autorizaciju (provjera uloge korisnika).
    - [x] Implementacija GET /users (samo Admin, lista korisnika).
    - [x] Implementacija GET /users/:id (samo Admin, detalji korisnika).
    - [x] Implementacija PUT /users/:id (samo Admin, izmjena korisnika).
    - [x] Implementacija DELETE /users/:id (samo Admin, brisanje korisnika).
    - [x] Implementacija GET /auth/me (dohvatanje podataka o trenutno ulogovanom korisniku).
- [x] Zadatak 1.2: API Endpoints za Company (Refaktorisano u Controller/Service slojeve)
    - [x] Implementacija POST /companies (zaštićeno).
    - [x] Implementacija GET /companies (zaštićeno).
    - [x] Implementacija GET /companies/:id (zaštićeno).
    - [x] Implementacija PUT /companies/:id (zaštićeno).
    - [x] Implementacija DELETE /companies/:id (zaštićeno).
    - [x] Refaktorisanje u controller/service slojeve.
Zadatak 1.3: API Endpoints za Location
Implementacija POST /locations (zaštićeno).
Implementacija GET /locations (zaštićeno).
Implementacija GET /locations/:id (zaštićeno).
Implementacija PUT /locations/:id (zaštićeno).
Implementacija DELETE /locations/:id (zaštićeno).
Zadatak 1.4: API Endpoints za Vehicle
Implementacija POST /vehicles (zaštićeno).
Validacija ulaznih podataka.
- [x] Logika za automatsko izračunavanje filter_expiry_date ako su dati filter_installation_date i filter_validity_period_months.
- [x] Logika za automatsko izračunavanje next_annual_inspection_date (npr. last_annual_inspection_date + 1 godina).
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
    - [x] Implementacija funkcije/middleware-a checkRole(roles_array) koja provjerava da li korisnik ima jednu od dozvoljenih uloga za pristup ruti.
    - [x] Primjena middleware-a na sve relevantne rute.
    - [x] Refaktorisanje u controller/service slojeve.
FAZA 2: Frontend Razvoj - Admin Portal (Vozila, Korisnici, Firme, Lokacije)

Zadatak 2.1: Osnovni Layout Admin Portala
- [x] Kreiranje Layout komponente (Next.js).
- [x] Implementacija Navbar komponente.
- [x] Implementacija Sidebar komponente (ako je potrebna).
- [x] Kreiranje "zaštićenih ruta" HOC-a ili logike u _app.tsx za provjeru autentifikacije prije prikaza stranice.
- [x] Definisanje globalnog state managementa (npr. Zustand, Redux Toolkit, React Context) za korisničku sesiju i sl.
Zadatak 2.2: Stranica za Login
- [x] Kreiranje forme za login (username, password).
- [x] Poziv API endpointa /auth/login.
- [x] Čuvanje JWT tokena (npr. u localStorage ili httpOnly kolačiću) i podataka o korisniku u globalnom stanju.
- [x] Preusmjeravanje na dashboard nakon uspješnog logina.
- [x] Prikaz grešaka pri neuspješnom loginu.
Zadatak 2.3: Komponenta/Stranica za Upravljanje Korisnicima (samo Admin)
- [x] Zaštita rute samo za Admine.
- [x] Prikaz tabele korisnika (poziv GET /users).
Forma za kreiranje novog korisnika (poziv POST /auth/register).
Mogućnost izmjene korisnika (modal/stranica sa formom, poziv PUT /users/:id).
Mogućnost brisanja korisnika (uz potvrdu, poziv DELETE /users/:id).
Zadatak 2.4: Komponenta/Stranica za Upravljanje Firmama
- [x] Prikaz liste firmi (poziv GET /companies).
- [x] Forma za dodavanje nove firme (poziv POST /companies).
- [x] Mogućnost izmjene firme (poziv PUT /companies/:id).
- [x] Mogućnost brisanja firme (poziv DELETE /companies/:id).
Zadatak 2.5: Komponenta/Stranica za Upravljanje Lokacijama
- [ ] Prikaz liste lokacija (poziv GET /locations).
- [ ] Forma za dodavanje nove lokacije (poziv POST /locations).
- [ ] Mogućnost izmjene lokacije (poziv PUT /locations/:id).
- [ ] Mogućnost brisanja lokacije (uz potvrdu, poziv DELETE /locations/:id).
- [ ] Zadatak 2.6: Dashboard Core & Vehicle Management (Initial)
    - [x] Kreiranje Sidebar komponente (`frontend/src/components/layout/Sidebar.tsx`).
    - [x] Kreiranje Dashboard Layout komponente (`frontend/src/app/dashboard/layout.tsx`).
    - [x] Kreiranje osnovnog API servisa (`frontend/src/lib/apiService.ts`) sa funkcijama za vozila, firme, lokacije.
    - [x] Kreiranje stranice i forme za dodavanje novog vozila (`frontend/src/app/dashboard/vehicles/new/page.tsx`).
    - [x] Implementacija Logout funkcionalnosti u Sidebar-u.
    - [x] Povezivanje Login forme sa backendom (`/auth/login`) i čuvanje JWT tokena.
    - [x] Implementacija globalnog Authentication Context-a/State Managementa (npr. Zustand ili React Context).
    - [x] Implementacija zaštićenih ruta za dashboard koristeći Auth Context.
    - [x] Kreiranje stranice za listanje vozila (`/dashboard/vehicles`).
    - [ ] Implementacija forme za izmjenu vozila.
    - [ ] Implementacija brisanja vozila.
- [ ] Zadatak 2.7: Komponenta/Stranica za Upravljanje Vozilima (kompletno)
    - [ ] Prikaz tabele/liste vozila (poziv GET /vehicles) sa paginacijom, sortiranjem, filtriranjem.
{{ ... }}
