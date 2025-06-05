import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FuelingOperation, AirlineFE } from '../types';

// Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const FONT_NAME = 'helvetica'; // Constant for the font used in PDF

/**
 * Format a date string to a localized format
 */
export const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('DD.MM.YYYY. HH:mm');
};

/**
 * Configure PDF for proper special character support (č, ć, ž, đ, š)
 */
const configurePDFForSpecialChars = (doc: jsPDF): void => {
  // Use built-in Helvetica font which has decent Unicode support
  doc.setFont('helvetica', 'normal');
  
  // Set language to Croatian which supports Bosnian special characters
  doc.setLanguage('hr');
  
  // Set font size
  doc.setFontSize(10);
};

/**
 * Generate a PDF invoice for a fueling operation
 */
export const generatePDFInvoice = (operation: FuelingOperation): void => {
  try {
    // Create a new PDF document with Unicode support
    const doc = new jsPDF({
      putOnlyUsedFonts: true,
      compress: true,
      format: 'a4'
    });
    
    // Configure PDF for special characters
    configurePDFForSpecialChars(doc);
    
    // Helper function to replace special characters with their Latin equivalents
    const replaceSpecialChars = (text: string): string => {
      return text
        .replace(/č/g, 'c')
        .replace(/ć/g, 'c')
        .replace(/ž/g, 'z')
        .replace(/đ/g, 'd')
        .replace(/š/g, 's')
        .replace(/Č/g, 'C')
        .replace(/Ć/g, 'C')
        .replace(/Ž/g, 'Z')
        .replace(/Đ/g, 'D')
        .replace(/Š/g, 'S');
    };
    
    // Override text function to handle special characters
    const originalText = doc.text.bind(doc);
    doc.text = function(text: string | string[], x: number, y: number, options?: any): jsPDF {
      if (typeof text === 'string') {
        return originalText(replaceSpecialChars(text), x, y, options);
      } else if (Array.isArray(text)) {
        return originalText(text.map(replaceSpecialChars), x, y, options);
      }
      return originalText(text, x, y, options);
    } as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Dodaj header s logom i nazivom kompanije
    doc.setFillColor(240, 240, 250);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('HIFA-PETROL d.o.o. Sarajevo', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('71320 Vogosca, Hotonj bb', 14, 28);
    doc.text('tel: 033 584 370', 14, 34);
    doc.text('fax: 033 584 382', pageWidth / 3, 34);
    doc.text('direktor: 033 584 445, 061 799 755', 2 * pageWidth / 3, 34, { align: 'center' });
    doc.text('PDV: 200999090005', 14, 40);
    doc.text('ID: 4200999090005', pageWidth / 3, 40);
    doc.text('email: info@hifapetrol.ba', 2 * pageWidth / 3, 40);
    doc.text('www.hifapetrol.ba', pageWidth - 14, 40, { align: 'right' });
    
    // Dodaj broj fakture i datum u gornjem desnom uglu
    const invoiceNumber = `INV-${operation.id}-${new Date().getFullYear()}`;
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.text('FUEL INVOICE', pageWidth - 14, 15, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice No.: ${invoiceNumber}`, pageWidth - 14, 22, { align: 'right' });
    doc.text(`Issue Date: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 28, { align: 'right' });
    doc.text(`Service Date: ${formatDate(operation.dateTime)}`, pageWidth - 14, 34, { align: 'right' });
    
    // Dodaj liniju ispod headera
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 45, pageWidth - 14, 45);
    
    // Dodaj naslov fakture
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('INVOICE FOR FUEL SERVICES', pageWidth / 2, 55, { align: 'center' });
    
    // Dodaj informacije o prodavcu (lijevo)
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text('SELLER:', 14, 70);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('HIFA-PETROL d.o.o.', 14, 77);
    doc.text('Sarajevo', 14, 83);
    doc.text('71320 Vogosca, Hotonj bb', 14, 89);
    doc.text('ID No.: 4200999090005', 14, 95);
    doc.text('VAT No.: 200999090005', 14, 101);
    doc.text('Phone: 033 584 370', 14, 107);
    doc.text('Fax: 033 584 382', 14, 113);
    doc.text('Direktor: 033 584 445, 061 799 755', 14, 119);
    doc.text('Email: info@hifapetrol.ba', 14, 125);
    doc.text('Web: www.hifapetrol.ba', 14, 131);
    // Dodaj informacije o kupcu (desno)
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text('BUYER:', pageWidth / 2 + 10, 70);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${operation.airline?.name || 'N/A'}`, pageWidth / 2 + 10, 77);
    doc.text(`${operation.airline?.address || 'N/A'}`, pageWidth / 2 + 10, 83);
    doc.text(`ID/VAT No.: ${operation.airline?.taxId || 'N/A'}`, pageWidth / 2 + 10, 89);
    doc.text(`Contact: ${operation.airline?.contact_details || 'N/A'}`, pageWidth / 2 + 10, 95);
    doc.text(`Aircraft Registration: ${operation.aircraft_registration || 'N/A'}`, pageWidth / 2 + 10, 101);
    doc.text(`Destination: ${operation.destination}`, pageWidth / 2 + 10, 107);
    doc.text(`Flight Number: ${operation.flight_number || 'N/A'}`, pageWidth / 2 + 10, 113);
    doc.text('Parity - CPT Tuzla Airport', pageWidth / 2 + 10, 119);
    
    // Dodaj dostavnicu/delivery voucher (boldirano)
    doc.setFont('helvetica', 'bold');
    // Koristimo delivery_note_number polje koje smo dodali
    doc.text(`Delivery Voucher: ${operation.delivery_note_number || 'N/A'}`, pageWidth / 2 + 10, 125);
    doc.setFont('helvetica', 'normal');
    
    // Dodaj liniju iznad tabele
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 120, pageWidth - 14, 120);
    
    // Dodaj tabelu s uslugama
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text('SERVICE DETAILS:', 14, 130);
    
    // Koristimo autoTable za tabelu usluga da bi se tekst automatski prelomio
    const baseAmount = (operation.quantity_kg || 0) * (operation.price_per_kg || 0);
    const discountAmount = baseAmount * ((operation.discount_percentage || 0) / 100);
    const netAmount = operation.total_amount || 0;
    
    // Definiramo podatke za tabelu
    const tableHeaders = [
      'Service Description', 
      'Fuel Type', 
      'Quantity (L)', 
      'Quantity (kg)', 
      'Price/kg', 
      'Discount (%)', 
      'Amount'
    ];
    
    const tableData = [
      [
        `Gorivo JET A-1 (${operation.aircraft_registration})`,
        `${operation.tank?.fuel_type || 'JET A-1'}`,
        `${(operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })}`,
        `${(operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })}`,
        `${(operation.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 5 })}`,
        `${operation.discount_percentage || '0'}%`,
        `${netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })} ${operation.currency || 'BAM'}`
      ]
    ];
    
    // Koristimo autoTable za automatsko prelomljavanje teksta i spremamo finalnu poziciju
    let finalY = 145;
    
    autoTable(doc, {
      startY: 145,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 250],
        textColor: [0, 51, 102],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 'auto' }, // Opis usluge - automatska širina
        1: { cellWidth: 25 },     // Tip goriva
        2: { cellWidth: 25 },     // Količina (L)
        3: { cellWidth: 25 },     // Količina (kg)
        4: { cellWidth: 25 },     // Cijena/kg
        5: { cellWidth: 20 },     // Rabat (%)
        6: { cellWidth: 30 }      // Iznos
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Spremamo poziciju nakon tabele, provjeravamo da li je cursor definiran
        finalY = data.cursor?.y || finalY + 30; // Ako cursor nije definiran, dodajemo 30 jedinica na početnu poziciju
      }
    });
    
    // Dodatne informacije - pozicionirane nakon tabele
    finalY += 10; // Dodajemo malo prostora nakon tabele
    doc.setFontSize(9);
    doc.text(`Traffic Type: ${operation.tip_saobracaja || 'N/A'}`, 14, finalY);
    doc.text(`Specific Density: ${(operation.specific_density || 0).toLocaleString('hr-HR', { minimumFractionDigits: 3 })}`, 14, finalY + 7);
    
    // Sekcija za ukupan iznos - pozicionirana nakon dodatnih informacija
    const summaryBoxY = finalY + 15;
    doc.setFillColor(245, 245, 255);
    doc.rect(pageWidth / 2, summaryBoxY, pageWidth / 2 - 14, 50, 'F');
    
    // Linija iznad ukupnog iznosa
    doc.setDrawColor(200, 200, 220);
    doc.line(pageWidth / 2, summaryBoxY, pageWidth - 14, summaryBoxY);
    
    // Ukupan iznos i detalji
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    let summaryY = summaryBoxY + 10;
    
    // Ako postoji rabat, prikaži osnovnu cijenu i rabat
    if (operation.discount_percentage && operation.discount_percentage > 0) {
      doc.text('Base Amount:', pageWidth / 2 + 5, summaryY);
      doc.text(`${baseAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, pageWidth - 14, summaryY, { align: 'right' });
      summaryY += 7;
      
      doc.text(`Discount (${operation.discount_percentage}%):`, pageWidth / 2 + 5, summaryY);
      doc.text(`-${discountAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, pageWidth - 14, summaryY, { align: 'right' });
      summaryY += 7;
    }
    
    // Neto iznos
    doc.text('Net Amount:', pageWidth / 2 + 5, summaryY);
    doc.text(`${netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, pageWidth - 14, summaryY, { align: 'right' });
    
    // Ukupan iznos za plaćanje - pozicioniran na kraju sekcije za ukupan iznos
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT DUE:', pageWidth / 2 + 5, summaryBoxY + 40);
    doc.text(`${netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, pageWidth - 14, summaryBoxY + 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Dodaj informacije o plaćanju - pozicionirane nakon sekcije za ukupan iznos
    const paymentInfoY = summaryBoxY + 55;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Method: Bank Transfer', 14, paymentInfoY);
    doc.text('Payment Due: 15 days from invoice issue date', 14, paymentInfoY + 7);

    // VAT Note - New Position
    let yPosForVatNote = paymentInfoY + 7 + 9; // After "Payment Due" text (approx 7pt height) + 9pt spacing
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100); // Grey color for the note
    const vatNoteText = "VAT is not included in accordance with Article 27, act 1, paragraph 1 of the Law of Value Added Taxation and article 39, act 1 of the Value Added Tax application requirements.";
    const vatNoteLines = doc.splitTextToSize(vatNoteText, pageWidth - 28); // pageWidth - leftMargin - rightMargin
    doc.text(vatNoteLines, 14, yPosForVatNote);
    
    // Estimate height of VAT note text block
    // For 8pt font, using a factor for line height relative to font size (e.g., 8pt font * 0.7 line height factor)
    const heightOfVatNoteBlock = vatNoteLines.length * (doc.getFontSize() * 0.5 + 1); // Adjusted for tighter packing of small font
    let yPosAfterVatNote = yPosForVatNote + heightOfVatNoteBlock;
    doc.setTextColor(0, 0, 0); // Reset text color

    // Dodaj bankovne podatke - pozicionirane nakon VAT note
    const bankInfoY = yPosAfterVatNote + 10; // 10pt spacing before bank details box
    doc.setFontSize(9);
    doc.setFillColor(245, 245, 255);
    doc.rect(14, bankInfoY, pageWidth - 28, 35, 'F');
    
    doc.setTextColor(0, 51, 102);
    doc.text('PAYMENT DETAILS:', 16, bankInfoY + 7);
    
    doc.setTextColor(0, 0, 0);
    doc.text('Reference No.: ' + invoiceNumber, pageWidth - 16, bankInfoY + 7, { align: 'right' });
    
    // Add bank account details in the payment details box
    const bankFontSize = 7;
    doc.setFontSize(bankFontSize);
    
    // First column of bank accounts
    let bankY = bankInfoY + 14;
    const bankColWidth = (pageWidth - 28) / 3;
    
    doc.text('Unicredit banka DD Mostar', 16, bankY);
    doc.text('3385502203296597', 16 + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('Raiffeisen Bank DD Sarajevo', 16, bankY);
    doc.text('1610000055460052', 16 + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('NLB Razojna banka AD Banja Luka', 16, bankY);
    doc.text('5620068100579520', 16 + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('Bosna Bank International DD Sarajevo', 16, bankY);
    doc.text('1410010012321008', 16 + bankColWidth - 5, bankY, { align: 'right' });
    
    // Second column of bank accounts
    bankY = bankInfoY + 14;
    const col2X = 16 + bankColWidth;
    
    doc.text('Intesa Sanpaolo banka Sarajevo', col2X, bankY);
    doc.text('1542602004690547', col2X + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('Privredna banka Sarajevo dd Sarajevo', col2X, bankY);
    doc.text('1011040053464252', col2X + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('ZiraatBank Bank BH dd Sarajevo', col2X, bankY);
    doc.text('1861440310884661', col2X + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('NLB Tuzlanska banka DD Tuzla', col2X, bankY);
    doc.text('1322602004200445', col2X + bankColWidth - 5, bankY, { align: 'right' });
    
    // Third column of bank accounts
    bankY = bankInfoY + 14;
    const col3X = 16 + 2 * bankColWidth;
    
    doc.text('Sparkasse banka DD Sarajevo', col3X, bankY);
    doc.text('1990490086998668', col3X + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('ASA Banka DD Sarajevo', col3X, bankY);
    doc.text('1346651006886807', col3X + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('Union banka DD Sarajevo', col3X, bankY);
    doc.text('1020320000019213', col3X + bankColWidth - 5, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    
    doc.text('Nova banka AD Banja Luka', col3X, bankY);
    doc.text('5556000036056073', col3X + bankColWidth - 5, bankY, { align: 'right' });
    
    // IBAN and SWIFT at the bottom
    bankY += bankFontSize * 1.2;
    doc.text('IBAN: BA393389104805286885', 16, bankY);
    doc.text('Addiko Bank d.d. Sarajevo: 3060003143014340', pageWidth - 16, bankY, { align: 'right' });
    bankY += bankFontSize * 0.9;
    doc.text('SWIFT: UNCRBA22', 16, bankY);
    
    // Dodaj podnožje - pozicionirano na dnu stranice ili nakon bankovnih podataka
    const footerY = Math.max(bankY + 10, 275); // Uzimamo veću vrijednost da izbjegnemo preklapanje
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(14, footerY, pageWidth - 14, footerY);
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    
    // Razdvojiti footer u više redova da se izbjegne sasiječeni tekst
    doc.text('HIFA-PETROL d.o.o. Sarajevo', pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text('71320 Vogosca, Hotonj bb', pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text('Phone: 033 584 370 | Fax: 033 584 382 | www.hifapetrol.ba | info@hifapetrol.ba', pageWidth / 2, footerY + 15, { align: 'center' });
    
    // Dodaj napomenu o PDV-u
    doc.setFontSize(7);
    doc.text('Note: Prices are shown without VAT. VAT is calculated according to applicable regulations.', 14, footerY + 20);
    doc.text(`Invoice generated: ${new Date().toLocaleString('en-US')}`, pageWidth - 14, footerY + 20, { align: 'right' });
    
    // Save the PDF
    doc.save(`Invoice-${invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
