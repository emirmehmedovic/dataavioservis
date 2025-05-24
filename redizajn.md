# Plan Vizuelnog Redizajna Aplikacije

## Važna Napomena
**Ovo je STROGO VIZUELNI REDIZAJN. Nikakve funkcionalnosti se ne mijenjaju.** Fokus je isključivo na poboljšanju vizuelnog izgleda aplikacije kroz boje, layout i stilizaciju komponenti.

## Paleta Boja

### Primarne Boje
- **Sidebar Gradient**: #363636 → #000000 → #363636
- **Accent Gradient**: #E60026 → #B3001F → #800014 → #4D000A

### Sekundarne Boje
- **Pozadina**: #F9FAFB (svijetla) / #1F2937 (tamna)
- **Kartice/Komponente**: #FFFFFF (svijetla) / #374151 (tamna)
- **Tekst**: #111827 (primarni) / #6B7280 (sekundarni)
- **Uspjeh**: #10B981
- **Upozorenje**: #F59E0B
- **Greška**: #EF4444
- **Info**: #3B82F6

## Plan Redizajna po Stranicama

### 1. Dashboard Sidebar
- Implementacija gradijenta #363636 → #000000 → #363636
- Redizajn ikona - korištenje konzistentnog seta ikona
- Poboljšanje aktivnog stanja navigacijskih linkova korištenjem accent boje
- Dodavanje suptilnih hover efekata
- Poboljšanje razmaka i hijerarhije navigacijskih elemenata

### 2. Glavni Dashboard (Home)
- Redizajn kartica sa statistikama - zaobljeni uglovi, suptilne sjene
- Implementacija accent boja za naglašavanje važnih podataka
- Poboljšanje vizualizacije podataka (grafikoni, indikatori)
- Konzistentno formatiranje brojeva i datuma
- Poboljšanje razmaka između elemenata

### 3. Stranica za Gorivo (Fuel)
- Redizajn tabova korištenjem accent boja za aktivni tab
- Poboljšanje izgleda tabela sa podacima o gorivu
- Redizajn kartica za prikaz tankova - dodavanje vizuelnih indikatora nivoa goriva
- Poboljšanje modala za unos/transfer goriva
- Konzistentno formatiranje brojčanih vrijednosti (litre, kg)

### 4. Stranica za Vozila (Vehicles)
- Redizajn liste vozila - konzistentne kartice sa boljom organizacijom informacija
- Poboljšanje prikaza detalja vozila
- Redizajn forme za unos/uređivanje vozila
- Implementacija vizuelnih indikatora statusa vozila

### 5. Stranica za Izvještaje (Reports)
- Redizajn tabela sa podacima - bolja čitljivost, konzistentne boje
- Poboljšanje filtera i kontrola za izvještaje
- Redizajn izvoznih PDF dokumenata - konzistentnost sa web interfejsom
- Implementacija vizuelnih indikatora za trendove podataka

### 6. Stranica za Carinu (Customs)
- Redizajn prikaza fiksnih tankova - konzistentno sa drugim stranicama
- Poboljšanje liste unosa goriva - bolja čitljivost i organizacija
- Implementacija filtera i kontrola u skladu sa novim dizajnom

### 7. Modalni Prozori
- Konzistentni dizajn svih modalnih prozora
- Poboljšanje zaglavlja i podnožja modala
- Redizajn formi unutar modala - bolje grupiranje polja, konzistentno formatiranje
- Implementacija animacija za otvaranje/zatvaranje

### 8. Forme i Kontrole
- Redizajn input polja, dropdown menija, checkbox-ova i radio buttona
- Konzistentno stiliziranje dugmadi korištenjem accent boja
- Poboljšanje validacijskih poruka i indikatora
- Implementacija hover i focus stanja za sve interaktivne elemente

### 9. Tabele
- Redizajn zaglavlja tabela korištenjem accent boja
- Poboljšanje čitljivosti redova - alternativne boje, hover efekti
- Redizajn paginacije i kontrola za sortiranje
- Konzistentno formatiranje sadržaja ćelija

### 10. Notifikacije i Poruke
- Redizajn toast notifikacija i poruka o greškama
- Implementacija konzistentnih ikona za različite tipove poruka
- Poboljšanje animacija za prikazivanje/sakrivanje notifikacija

### 11. Login Page
- Implementacija gradijentne pozadine koja kombinuje sidebar gradient (#363636 → #000000 → #363636) sa suptilnim elementima accent gradijenta (#E60026 → #B3001F → #800014 → #4D000A)
- Centrirana login forma sa modernim, zaobljenim karticama i suptilnim sjenama
- Animirani logo kompanije na vrhu forme
- Stilizirana input polja sa ikonama i animiranim focus efektima
- Dugme za prijavu sa gradient pozadinom iz accent palete
- Animirani indikator učitavanja tokom procesa prijave
- Responzivni dizajn koji se prilagođava svim veličinama ekrana
- Suptilne pozadinske animacije koje ne odvraćaju pažnju (npr. gradijentni valovi)
- Elegantne poruke o greškama koje se pojavljuju ispod odgovarajućih polja
- Opcija "Zapamti me" sa stiliziranim checkbox-om
- Link za resetovanje lozinke sa hover efektom
- Informacija o verziji aplikacije u podnožju
- Opcija za promjenu jezika sa dropdown menijem
- Vizuelni indikator jačine lozinke prilikom resetovanja

## Implementacijski Plan

1. **Faza 1: Osnovna Stilizacija**
   - Implementacija nove palete boja
   - Ažuriranje globalnih CSS varijabli
   - Osnovno stiliziranje zajedničkih komponenti

2. **Faza 2: Sidebar i Navigacija**
   - Redizajn sidebar-a sa novim gradijentom
   - Poboljšanje navigacijskih elemenata
   - Implementacija responsive dizajna za mobilne uređaje

3. **Faza 3: Glavne Stranice**
   - Redizajn dashboard-a
   - Redizajn stranice za gorivo
   - Redizajn stranice za vozila
   - Redizajn stranice za izvještaje
   - Redizajn stranice za carinu

4. **Faza 4: Komponente i Detalji**
   - Redizajn modalnih prozora
   - Redizajn formi i kontrola
   - Redizajn tabela i prikaza podataka
   - Redizajn notifikacija i poruka

5. **Faza 5: Finalno Poliranje**
   - Osiguravanje konzistentnosti kroz cijelu aplikaciju
   - Optimizacija za različite veličine ekrana
   - Testiranje i prilagođavanje

## Tehnički Detalji

- Koristiti CSS varijable za konzistentnost boja
- Implementirati gradijente kroz CSS
- Koristiti Tailwind utility klase gdje je moguće
- Osigurati da su sve komponente responzivne
- Zadržati postojeću strukturu komponenti, mijenjati samo stilove