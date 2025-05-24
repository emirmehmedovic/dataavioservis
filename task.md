ask.md - Modul za Upravljanje Avio Gorivom
Naziv Modula: FuelFlow Manager (ili AvioFuel Tracker, JetFuel Logistics, itd.)

Cilj Modula: Omogućiti precizno praćenje zaliha avio goriva u tankerima i cisternama, evidentiranje svake transakcije točenja goriva u avione, povezivanje tih transakcija sa avio kompanijama, destinacijama i generisanje detaljne statistike i izvještaja.

Ključne Funkcionalnosti (User Stories / Features):

Upravljanje Zalihama Goriva (Tankeri/Cisterne):

Evidencija Tankera/Cisterni:

Kao administrator, želim da mogu dodati, uređivati i brisati tankere/cisterne za skladištenje goriva.

Svaki tanker/cisterna treba da ima jedinstveni identifikator (npr. registracija, interni ID), kapacitet (u litrima), trenutnu količinu goriva, tip goriva (npr. Jet A-1, Avgas 100LL), lokaciju (ako je relevantno).

Unos Početnog Stanja:

Kao administrator, želim da mogu unijeti početnu količinu goriva za svaki novododati tanker/cisternu.

Evidencija Dopune Goriva u Tankere/Cisterne:

Kao operater, želim da mogu evidentirati svaku dopunu goriva u skladišne tankere/cisterne, uključujući datum, količinu, dobavljača, broj fakture/dostavnice i cijenu po litru (opciono, za praćenje troškova nabavke).

Sistem treba automatski da ažurira trenutnu količinu goriva u odabranom tankeru/cisterni.

Pregled Stanja Zaliha:

Kao menadžer, želim da imam jasan pregled trenutne količine goriva u svim tankerima/cisternama, sa ukupnom količinom po tipu goriva.

Vizuelni prikaz (npr. progress bar) popunjenosti svakog tankera.

Evidencija Točenja Goriva u Avione:

Kreiranje Zapisa o Točenju:

Kao operater, želim da mogu kreirati novi zapis za svako točenje goriva u avion.

Potrebni podaci:

Datum i vrijeme točenja.

Identifikacija aviona (povezivanje sa postojećim modulom vozila/aviona - registracija, tip aviona).

Avio kompanija (mogućnost odabira iz predefinisane liste ili unos nove).

Destinacija leta (tekstualno polje).

Natočena količina (u litrima).

Tanker/cisterna iz koje je gorivo istočeno (odabir sa liste).

Broj leta (opciono).

Ime operatera koji je izvršio točenje.

Napomene.

Automatsko Ažuriranje Zaliha:

Sistem treba automatski da umanji količinu goriva u odabranom tankeru/cisterni nakon evidentiranja točenja.

Validacija Količine:

Sistem treba da spriječi unos veće natočene količine nego što je dostupno u odabranom tankeru/cisterni.

Pregled i Pretraga Zapisa o Točenju:

Kao menadžer/operater, želim da mogu pregledati, pretraživati i filtrirati sve zapise o točenju goriva po datumu, avionu, avio kompaniji, destinaciji, tankeru.

Upravljanje Avio Kompanijama:

CRUD Operacije za Avio Kompanije:

Kao administrator, želim da mogu dodavati, uređivati i brisati avio kompanije (naziv, kontakt podaci - opciono).

Statistika i Izvještavanje:

Dnevni/Mjesečni/Godišnji Izvještaji o Potrošnji:

Kao menadžer, želim da mogu generisati izvještaje o ukupnoj količini natočenog goriva po periodima.

Izvještaji po Avio Kompaniji:

Prikaz ukupne količine goriva natočene za svaku avio kompaniju u odabranom periodu.

Izvještaji po Avionu:

Prikaz ukupne količine goriva natočene u specifični avion.

Izvještaji po Destinaciji:

Prikaz ukupne količine goriva natočene za letove prema određenim destinacijama.

Izvještaji o Stanju Zaliha:

Istorijski pregled stanja zaliha.

Grafički Prikazi (Dashboard):

Vizuelizacija ključnih metrika: potrošnja goriva tokom vremena, top avio kompanije po potrošnji, popunjenost tankera.

Mogućnost Izvoza Izvještaja:

Izvoz izvještaja u CSV ili PDF formatu.

Korisnički Interfejs (UI/UX):

Intuitivan i pregledan interfejs za sve gore navedene funkcionalnosti.

Responzivan dizajn za upotrebu na različitim uređajima (desktop, tablet).

Jasne forme za unos podataka sa validacijom.

Dashboard sa ključnim pokazateljima o gorivu.

Tehnički Zahtjevi (Backend & Frontend):

Backend API Endpoints:

CRUD za tankere/cisterne.

Endpoint za evidenciju dopune tankera.

CRUD za zapise o točenju goriva.

CRUD za avio kompanije.

Endpoints za generisanje statistika i izvještaja (sa filterima).

Modeli Baze Podataka:

FuelTank (ili StorageUnit): id, name, identifier, capacity_liters, current_liters, fuel_type, location, created_at, updated_at.

FuelReplenishment (ili TankRefill): id, tank_id (FK), date, quantity_liters, supplier, invoice_number, price_per_liter (opciono), created_at.

FuelingOperation (ili AircraftRefuel): id, aircraft_id (FK - veza sa postojećim Vehicle modelom), airline_id (FK), destination, fuel_type_dispensed, quantity_liters_dispensed, tank_id_dispensed_from (FK), flight_number (opciono), operator_name, operation_datetime, notes, created_at.

Airline: id, name, contact_details (opciono), created_at, updated_at.

Frontend Komponente:

Forme za unos (tankeri, dopune, točenja, avio kompanije).

Tabele za prikaz podataka sa sortiranjem, filtriranjem i paginacijom.

Komponente za grafički prikaz statistike (koristeći npr. Chart.js, Recharts).

Dashboard prikaz.

Integracija sa postojećim modulom vozila/aviona (za odabir aviona prilikom točenja).

Notifikacije (Opciono, za budućnost):

Upozorenja o niskom nivou goriva u tankerima.

Prioriteti:

MVP (Minimum Viable Product):

Osnovno upravljanje tankerima (unos, pregled stanja).

Evidencija točenja goriva u avione sa automatskim ažuriranjem zaliha u tankeru.

Osnovni pregled zapisa o točenju.

Jednostavan izvještaj o ukupnoj potrošnji.

Druga Faza:

Upravljanje avio kompanijama.

Evidencija dopune tankera.

Napredniji izvještaji (po kompaniji, avionu, destinaciji).

Filteri za pretragu zapisa.

Treća Faza:

Grafički prikazi i dashboard.

Izvoz izvještaja.

Detaljna statistika.

Rokovi: (Definisati interno)

Odgovorne Osobe: (Definisati interno)

Prompt za AI (npr. ChatGPT, Claude, GitHub Copilot Chat)
Ovaj prompt možete koristiti da dobijete ideje za strukturu koda, UI elemente, ili čak početne dijelove koda.

**Kontekst Projekta:**
Razvijam web aplikaciju "AvioServis" koristeći Next.js, React, TypeScript za frontend, i [NAVEDITI VAŠ BACKEND STACK, npr. Node.js/Express/PostgreSQL ili Python/Django/MySQL] za backend. Aplikacija već ima modul za upravljanje vozilima/avionima (praćenje tehničkih podataka, servisa, registracija).

**Novi Modul: Upravljanje Avio Gorivom ("FuelFlow Manager")**

**Glavni Cilj Novog Modula:**
Implementirati sistem za precizno praćenje zaliha avio goriva, evidentiranje svih transakcija točenja goriva u avione, i generisanje detaljnih statistika i izvještaja o potrošnji i zalihama.

**Ključne Funkcionalnosti koje treba pokriti:**

1.  **Upravljanje Zalihama Goriva u Tankerima/Cisternama:**
    *   Definisanje tankera/cisterni (ID, kapacitet, trenutna količina, tip goriva).
    *   Evidentiranje dopune goriva u tankere (datum, količina, dobavljač).
    *   Pregled trenutnog stanja zaliha.

2.  **Evidencija Točenja Goriva u Avione:**
    *   Kreiranje zapisa o točenju: datum/vrijeme, ID aviona (iz postojećeg modula), avio kompanija, destinacija, natočena količina, tanker iz kojeg je točeno.
    *   Automatsko ažuriranje zaliha u tankeru nakon točenja.
    *   Pregled i filtriranje zapisa o točenju.

3.  **Upravljanje Avio Kompanijama:**
    *   Osnovne CRUD operacije za avio kompanije.

4.  **Statistika i Izvještavanje:**
    *   Izvještaji o potrošnji (dnevni, mjesečni, po avio kompaniji, po avionu, po destinaciji).
    *   Grafički prikaz ključnih metrika na dashboardu.
    *   Mogućnost izvoza izvještaja (CSV/PDF).

**Molim te, pomozi mi sa sljedećim (odaberi jedno ili više):**

*   **A) Dizajn Modela Baze Podataka:** Predloži šeme za tabele (SQL DDL ili opis polja i relacija) za gore navedene funkcionalnosti. Razmotri tipove podataka i indekse.
*   **B) Dizajn API Endpoints (RESTful):** Navedi ključne API endpoint-e (npr. `POST /api/fuel/tanks`, `GET /api/fuel/fueling-operations?airlineId=X`) sa očekivanim request/response strukturama (JSON).
*   **C) Prijedlozi za Frontend Komponente (React/Next.js):** Opiši ključne React komponente koje bi bile potrebne (npr. `TankStatusCard`, `FuelingLogTable`, `NewFuelingOperationForm`, `FuelConsumptionChart`). Koje state management strategije bi bile prikladne? Koje biblioteke za grafikone preporučuješ?
*   **D) Prijedlozi za UI/UX:** Kako bi organizovao korisnički interfejs za ovaj modul? Koje vrste vizuelizacija bi bile najkorisnije na dashboardu?
*   **E) Generisanje Početnog Koda (ako je AI alat sposoban):** Generiši početni TypeScript kod za modele baze podataka (npr. Prisma schema ili TypeORM entitete) ILI početne React komponente sa osnovnom strukturom i propsima.
*   **F) Ključni Izazovi i Najbolje Prakse:** Na koje potencijalne izazove bih trebao obratiti pažnju prilikom implementacije ovog modula (npr. konkurentnost pri ažuriranju zaliha, preciznost podataka, performanse izvještaja)? Koje su najbolje prakse?

**Dodatne napomene:**
*   Fokus je na preciznosti podataka i jednostavnosti korišćenja.
*   Modul treba da bude skalabilan.
*   Integracija sa postojećim modulom vozila je ključna.

---
Hvala!