import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FuelingOperation } from '../types';
import { formatDate } from './helpers';

// Constants
const FONT_NAME = 'helvetica'; // Konstanta za font koji se koristi u PDF-u

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
 * Generate a consolidated PDF invoice for multiple fueling operations
 */
export const generateConsolidatedPDFInvoice = (operations: FuelingOperation[], filterDescription: string): void => {
  try {
    if (!operations || operations.length === 0) {
      throw new Error('No operations to generate invoice for');
    }

    // Create a new PDF document
    const doc = new jsPDF({
      putOnlyUsedFonts: true,
      compress: true,
      format: 'a4'
    });
    
    // Add font support for special characters
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
    doc.text('AVIOSERVIS d.o.o.', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('Međunarodni aerodrom Sarajevo', 14, 28);
    doc.text('71210 Ilidža, Bosna i Hercegovina', 14, 34);
    
    // Dodaj broj fakture i datum u gornjem desnom uglu
    const invoiceNumber = `CONS-INV-${new Date().getTime().toString().slice(-6)}-${new Date().getFullYear()}`;
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.text('CONSOLIDATED FUEL INVOICE', pageWidth - 14, 15, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice No.: ${invoiceNumber}`, pageWidth - 14, 22, { align: 'right' });
    doc.text(`Issue Date: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 28, { align: 'right' });
    doc.text(`Period: ${filterDescription}`, pageWidth - 14, 34, { align: 'right' });
    
    // Dodaj liniju ispod headera
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 45, pageWidth - 14, 45);
    
    // Dodaj naslov fakture
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('CONSOLIDATED INVOICE FOR FUEL SERVICES', pageWidth / 2, 55, { align: 'center' });
    
    // Get client information from the first operation (assuming all operations are for the same client if filtering by airline)
    const firstOperation = operations[0];
    const airline = firstOperation.airline;
    
    // Dodaj informacije o prodavcu (lijevo)
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text('SELLER:', 14, 70);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('AVIOSERVIS d.o.o.', 14, 77);
    doc.text('Međunarodni aerodrom Sarajevo', 14, 83);
    doc.text('71210 Ilidža, Bosna i Hercegovina', 14, 89);
    doc.text('ID No.: 4200468210006', 14, 95);
    doc.text('VAT No.: 200468210006', 14, 101);
    doc.text('Phone: +387 33 289 100', 14, 107);
    
    // Dodaj informacije o kupcu (desno)
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text('BUYER:', pageWidth / 2 + 10, 70);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${airline?.name || 'N/A'}`, pageWidth / 2 + 10, 77);
    doc.text(`${airline?.address || 'N/A'}`, pageWidth / 2 + 10, 83);
    doc.text(`ID/VAT No.: ${airline?.taxId || 'N/A'}`, pageWidth / 2 + 10, 89);
    doc.text(`Contact: ${airline?.contact_details || 'N/A'}`, pageWidth / 2 + 10, 95);
    doc.text('Parity - CPT Tuzla Airport', pageWidth / 2 + 10, 101);
    
    // Dodaj liniju iznad tabele
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 115, pageWidth - 14, 115);
    
    // Dodaj tabelu s operacijama
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text('OPERATIONS OVERVIEW:', 14, 125);
    
    // Izračunaj ukupne vrijednosti
    const totalLiters = operations.reduce((sum, op) => sum + (op.quantity_liters || 0), 0);
    const totalKg = operations.reduce((sum, op) => sum + (op.quantity_kg || 0), 0);
    
    // Izračunaj osnovnu cijenu, rabat i neto iznos za svaku operaciju
    const operationsWithCalculations = operations.map(operation => {
      const baseAmount = Number(operation.quantity_kg || 0) * Number(operation.price_per_kg || 0);
      const discountAmount = baseAmount * (Number(operation.discount_percentage || 0) / 100);
      const netAmount = baseAmount - discountAmount;
      
      return {
        ...operation,
        baseAmount,
        discountAmount,
        netAmount
      };
    });
    
    // Izračunaj ukupne vrijednosti za sve operacije
    const totalBaseAmount = operationsWithCalculations.reduce((sum, op) => sum + op.baseAmount, 0);
    const totalDiscountAmount = operationsWithCalculations.reduce((sum, op) => sum + op.discountAmount, 0);
    const finalTotalNetAmount = operationsWithCalculations.reduce((sum, op) => sum + op.netAmount, 0);
    
    // Odredi najčešću valutu
    const currencyCounts = operations.reduce((acc, op) => {
      const currency = op.currency || 'BAM';
      acc[currency] = (acc[currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let mostCommonCurrency = 'BAM';
    let maxCount = 0;
    for (const [currency, count] of Object.entries(currencyCounts)) {
      if (count > maxCount) {
        mostCommonCurrency = currency;
        maxCount = count;
      }
    }
    
    // Kreiraj tabelu
    const tableColumn = ['Date', 'Aircraft Reg.', 'Destination', 'Delivery Note', 'Quantity (L)', 'Quantity (kg)', 'Price/kg', 'Discount', 'Amount', 'Currency'];
    const tableRows = operationsWithCalculations.map(operation => [
      formatDate(operation.dateTime),
      operation.aircraft_registration || 'N/A',
      operation.destination,
      operation.delivery_note_number || 'N/A',
      (operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      (operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      (operation.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
      operation.discount_percentage ? `${operation.discount_percentage}%` : '0%',
      operation.netAmount > 0 ? operation.netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : '0,00000',
      operation.currency || 'BAM'
    ]);
    
    // Dodaj red s ukupnim vrijednostima
    tableRows.push([
      'TOTAL',
      '',
      '',
      '',
      totalLiters.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      totalKg.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      '',
      '',
      totalDiscountAmount > 0 ? totalDiscountAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : '0,00000',
      finalTotalNetAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
      mostCommonCurrency
    ]);
    
    // Primijeni autoTable na dokument
    let finalY = 135;
    
    autoTable(doc, {
      startY: 135,
      head: [tableColumn],
      body: tableRows as any[][],
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
        0: { cellWidth: 20 },     // Datum
        1: { cellWidth: 20 },     // Registracija
        2: { cellWidth: 20 },     // Destinacija
        3: { cellWidth: 18 },     // Količina (L)
        4: { cellWidth: 18 },     // Količina (kg)
        5: { cellWidth: 20 },     // Cijena/kg
        6: { cellWidth: 12 },     // Rabat (%)
        7: { cellWidth: 20 },     // Rabat iznos
        8: { cellWidth: 20 },     // Neto iznos
        9: { cellWidth: 12 }      // Valuta
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Spremamo poziciju nakon tabele, provjeravamo da li je cursor definiran
        finalY = data.cursor?.y || finalY + 30; // Ako cursor nije definiran, dodajemo 30 jedinica na početnu poziciju
      }
    });
    
    // Sekcija za ukupan iznos - pozicionirana nakon tabele
    finalY += 10; // Dodajemo malo prostora nakon tabele
    doc.setFillColor(245, 245, 255);
    doc.rect(pageWidth / 2, finalY, pageWidth / 2 - 14, 50, 'F');
    
    // Linija iznad ukupnog iznosa
    doc.setDrawColor(200, 200, 220);
    doc.line(pageWidth / 2, finalY, pageWidth - 14, finalY);
    
    // Ukupan iznos i detalji
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    let summaryY = finalY + 10;
    
    // Prikaži osnovnu cijenu i rabat
    doc.text('Base Amount:', pageWidth / 2 + 5, summaryY);
    doc.text(`${totalBaseAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${mostCommonCurrency}`, pageWidth - 14, summaryY, { align: 'right' });
    summaryY += 7;
    
    doc.text(`Discount:`, pageWidth / 2 + 5, summaryY);
    doc.text(`-${totalDiscountAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${mostCommonCurrency}`, pageWidth - 14, summaryY, { align: 'right' });
    summaryY += 7;
    
    // Neto iznos
    doc.text('Net Amount:', pageWidth / 2 + 5, summaryY);
    doc.text(`${finalTotalNetAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${mostCommonCurrency}`, pageWidth - 14, summaryY, { align: 'right' });
    
    // Ukupan iznos za plaćanje - pozicioniran na kraju sekcije za ukupan iznos
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT DUE:', pageWidth / 2 + 5, finalY + 40);
    doc.text(`${finalTotalNetAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${mostCommonCurrency}`, pageWidth - 14, finalY + 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    
    // Dodaj informacije o plaćanju - pozicionirane nakon sekcije za ukupan iznos
    const paymentInfoY = finalY + 55;
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
    const heightOfVatNoteBlock = vatNoteLines.length * (doc.getFontSize() * 0.5 + 1); // Adjusted for tighter packing of small font
    let yPosAfterVatNote = yPosForVatNote + heightOfVatNoteBlock;
    doc.setTextColor(0, 0, 0); // Reset text color

    // Dodaj bankovne podatke - pozicionirane nakon VAT note
    const bankInfoY = yPosAfterVatNote + 10; // 10pt spacing before bank details box
    doc.setFontSize(9);
    doc.setFillColor(245, 245, 255);
    doc.rect(14, bankInfoY, pageWidth - 28, 25, 'F');
    
    doc.setTextColor(0, 51, 102);
    doc.text('PAYMENT DETAILS:', 16, bankInfoY + 7);
    
    doc.setTextColor(0, 0, 0);
    doc.text('Bank: UniCredit Bank d.d.', 16, bankInfoY + 14);
    doc.text('IBAN: BA39 3389 0022 0000 0000', 16, bankInfoY + 21);
    doc.text('SWIFT: UNCRBA22', pageWidth / 2 + 10, bankInfoY + 14);
    doc.text('Reference No.: ' + invoiceNumber, pageWidth / 2 + 10, bankInfoY + 21);
    
    // Dodaj podnožje - pozicionirano na dnu stranice ili nakon bankovnih podataka
    const footerY = Math.max(bankInfoY + 35, 275); // Uzimamo veću vrijednost da izbjegnemo preklapanje
    doc.setDrawColor(200, 200, 220);
    doc.setLineWidth(0.5);
    doc.line(14, footerY, pageWidth - 14, footerY);
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    
    // Razdvojiti footer u više redova da se izbjegne sasiječeni tekst
    doc.text('AVIOSERVIS d.o.o.', pageWidth / 2, footerY + 5, { align: 'center' });
    doc.text('Međunarodni aerodrom Sarajevo', pageWidth / 2, footerY + 10, { align: 'center' });
    doc.text('Phone: +387 33 289 100 | www.avioservis.ba | info@avioservis.ba', pageWidth / 2, footerY + 15, { align: 'center' });
    
    // Stara napomena o PDV-u je uklonjena odavde i premještena gore.
    doc.setFontSize(7); // Font size for generation date
    doc.text(`Invoice generated: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, footerY + 20, { align: 'center' });
    
    // Sačuvaj PDF
    doc.save(`Consolidated-Invoice-${invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating consolidated PDF:', error);
    throw error;
  }
};
