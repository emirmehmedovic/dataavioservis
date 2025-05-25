import dayjs from 'dayjs';
import jsPDF from 'jspdf';
// Import jsPDF-AutoTable
import autoTable from 'jspdf-autotable';
import { FuelingOperation } from '../types';
import { formatDate } from './helpers';
import { notoSansRegularBase64 } from '@/lib/fonts';
import { notoSansBoldBase64 } from '@/lib/notoSansBoldBase64';

// VAT rate for domestic traffic (17%)
const VAT_RATE = 0.17;
// Excise tax (akcize) per liter in KM
const EXCISE_TAX_PER_LITER = 0.30;
// Font name to use throughout the document
const FONT_NAME = 'NotoSans';

/**
 * Register custom font for proper special character support (č, ć, ž, đ, š)
 */
const registerFont = (doc: jsPDF): void => {
  const stripPrefix = (base64String: string): string => {
    const prefix = 'data:font/ttf;base64,';
    if (base64String.startsWith(prefix)) {
      return base64String.substring(prefix.length);
    }
    return base64String;
  };

  if (notoSansRegularBase64) {
    const cleanedRegular = stripPrefix(notoSansRegularBase64);
    doc.addFileToVFS('NotoSans-Regular.ttf', cleanedRegular);
    doc.addFont('NotoSans-Regular.ttf', FONT_NAME, 'normal');
  } else {
    console.error('Noto Sans Regular font data not loaded.');
    // Fallback to helvetica
    doc.setFont('helvetica', 'normal');
  }

  if (notoSansBoldBase64) {
    const cleanedBold = stripPrefix(notoSansBoldBase64);
    doc.addFileToVFS('NotoSans-Bold.ttf', cleanedBold);
    doc.addFont('NotoSans-Bold.ttf', FONT_NAME, 'bold');
  } else {
    console.error('Noto Sans Bold font data not loaded.');
    // Fallback to helvetica
    doc.setFont('helvetica', 'bold');
  }
  
  // Set language to Croatian which supports Bosnian special characters
  doc.setLanguage('hr');
  
  // Set font size
  doc.setFontSize(10);
};

/**
 * Generate a domestic PDF invoice for a fueling operation with VAT calculation
 */
export const generateDomesticPDFInvoice = (operation: FuelingOperation): void => {
  try {
    if (!operation) {
      throw new Error('No operation to generate invoice for');
    }

    // Create a new PDF document
    const doc = new jsPDF({
      putOnlyUsedFonts: true,
      compress: true,
      format: 'a4'
    });
    
    // Register custom font for special characters
    registerFont(doc);
    
    // Set the font to our custom font
    doc.setFont(FONT_NAME, 'normal');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add invoice title at the top
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('FAKTURA ZA GORIVO - UNUTARNJI SAOBRAĆAJ', pageWidth / 2, 20, { align: 'center' });
    
    // Add invoice number and date at top left
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const invoiceNumber = `DOM-INV-${operation.id}-${new Date().getFullYear()}`;
    doc.text(`Broj fakture: ${invoiceNumber}`, 14, 35);
    doc.text(`Datum izdavanja: ${formatDate(operation.dateTime)}`, 14, 40);
    doc.text(`Datum isporuke: ${formatDate(operation.dateTime)}`, 14, 45);
    doc.text(`Paritet/Parity: CPT Aerodrom Tuzla`, 14, 50);
    doc.text(`Dostavnica/Delivery voucher: ${operation.delivery_note_number || 'N/A'}`, 14, 55);
    
    // Add client information on the left side
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('KUPAC:', 14, 65);
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(10);
    doc.text(`${operation.airline.name}`, 14, 70);
    doc.text(`${operation.airline.address || 'N/A'}`, 14, 75);
    doc.text(`ID/PDV: ${operation.airline.taxId || 'N/A'}`, 14, 80);
    doc.text(`Tel: ${operation.airline.contact_details || 'N/A'}`, 14, 85);
    
    // Add company information on the right side
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('PRODAVAC:', pageWidth - 90, 65);
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(10);
    doc.text('HIFA Petrol d.o.o.', pageWidth - 90, 70);
    doc.text('Međunarodni aerodrom Tuzla', pageWidth - 90, 75);
    doc.text('Tešanj, Bosna i Hercegovina', pageWidth - 90, 80);
    doc.text('ID/PDV: 4200468580006', pageWidth - 90, 85);
    doc.text('Tel: +387 33 289 100', pageWidth - 90, 90);
    
    // Add flight information
    doc.setFontSize(10);
    doc.text(`Registracija aviona: ${operation.aircraft_registration || 'N/A'}`, 14, 95);
    doc.text(`Destinacija: ${operation.destination}`, 14, 100);
    doc.text(`Broj leta: ${operation.flight_number || 'N/A'}`, 14, 105);
    
    // Izračunaj osnovnu cijenu prije rabata
    const baseAmount = (operation.quantity_kg || 0) * (operation.price_per_kg || 0);
    
    // Izračunaj rabat ako postoji
    const discountPercentage = operation.discount_percentage || 0;
    const discountAmount = baseAmount * (discountPercentage / 100);
    
    // Neto iznos nakon rabata
    const netAmount = operation.total_amount || 0;
    
    // Ensure all values are numbers
    const netAmountNum = Number(netAmount || 0);
    
    // Calculate VAT on net amount (after discount), then add excise tax
    const vatAmount = Number((netAmountNum * VAT_RATE).toFixed(5));
    const exciseTaxAmount = Number(((operation.quantity_liters || 0) * EXCISE_TAX_PER_LITER).toFixed(5));
    
    // Međuzbir je neto + PDV - round to 5 decimal places
    const subtotalWithoutExcise = Number((netAmountNum + vatAmount).toFixed(5));
    
    // Ukupan iznos je neto + PDV + akcize - round to 5 decimal places
    const grossAmount = Number((netAmountNum + vatAmount + exciseTaxAmount).toFixed(5));
    
    // Add transaction details in a table
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('DETALJI TRANSAKCIJE:', 14, 120);
    
    // Create transaction table
    const tableColumn = ['Opis', 'Količina (L)', 'Količina (kg)', 'Cijena po kg', 'Rabat (%)', 'Neto iznos', 'PDV 17%', 'Akcize (0.30 KM/L)', 'Ukupno sa PDV'];
    const tableRows = [
      [
        `Gorivo JET A-1 (${operation.aircraft_registration || 'N/A'})`,
        (operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        (operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        (operation.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 5 }),
        discountPercentage > 0 ? `${discountPercentage}%` : '0%',
        netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 }),
        vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 }),
        exciseTaxAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 }),
        grossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })
      ]
    ];
    
    // Dodaj informacije o rabatu ako postoji
    if (discountPercentage > 0) {
      doc.setFontSize(10);
      doc.text(`Osnovna cijena prije rabata: ${baseAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, 14, 110);
      doc.text(`Rabat (${discountPercentage}%): ${discountAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, 14, 115);
    }
    
    // Apply autoTable for transaction details
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 125,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: FONT_NAME },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 125 }
    });
    
    // Get the final y position after the table
    // @ts-ignore - lastAutoTable is added by the plugin but not in the types
    const finalY = (doc as any).lastAutoTable?.finalY + 10 || 150;
    
    // Add total amount with a box around it
    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 180, finalY, 165, 60, 'F');
    
    // Define columns for better alignment
    const labelX = pageWidth - 175;
    const valueX = pageWidth - 25;
    const lineHeight = 12;
    
    // Set up text formatting
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(FONT_NAME, 'normal');
    
    // First row
    doc.text('Ukupan neto iznos:', labelX, finalY + lineHeight);
    doc.text(`${netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, valueX, finalY + lineHeight, { align: 'right' });
    
    // Second row
    doc.text('PDV (17%):', labelX, finalY + 2*lineHeight);
    doc.text(`${vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, valueX, finalY + 2*lineHeight, { align: 'right' });
    
    // Third row
    doc.text('Akcize (0.30 KM/L):', labelX, finalY + 3*lineHeight);
    doc.text(`${exciseTaxAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, valueX, finalY + 3*lineHeight, { align: 'right' });
    
    // Fourth row - subtotal of net+VAT (without excise)
    doc.text('Međuzbir (bez akcize):', labelX, finalY + 4*lineHeight);
    doc.text(`${subtotalWithoutExcise.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, valueX, finalY + 4*lineHeight, { align: 'right' });
    
    // Final row
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('Ukupan iznos za plaćanje (sa PDV):', labelX, finalY + 5*lineHeight);
    doc.text(`${grossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${operation.currency || 'BAM'}`, valueX, finalY + 5*lineHeight, { align: 'right' });
    
    // Add payment information - moved lower on the page
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Informacije o plaćanju:', 14, 250);
    doc.text('Banka: UniCredit Bank d.d.', 14, 255);
    doc.text('IBAN: BA39 3386 9048 0000 0000', 14, 260);
    doc.text('SWIFT: UNCRBA22', 14, 265);
    
    // Add footer
  
    // Save the PDF
    doc.save(`Faktura-Domaca-${invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating domestic PDF:', error);
    throw error;
  }
};

/**
 * Generate a consolidated domestic PDF invoice for multiple fueling operations with VAT calculation
 */
export const generateConsolidatedDomesticPDFInvoice = (operations: FuelingOperation[], filterDescription: string): void => {
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
    
    // Register custom font for special characters
    registerFont(doc);
    
    // Set the font to our custom font
    doc.setFont(FONT_NAME, 'normal');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add invoice title
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text('ZBIRNA FAKTURA ZA GORIVO - UNUTARNJI SAOBRAĆAJ', pageWidth / 2, 20, { align: 'center' });
    
    // Add invoice number and date
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const invoiceNumber = `DOM-CONS-INV-${new Date().getTime().toString().slice(-6)}-${new Date().getFullYear()}`;
    doc.text(`Broj fakture: ${invoiceNumber}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Datum izdavanja: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 33, { align: 'center' });
    doc.text(`Period: ${filterDescription}`, pageWidth / 2, 38, { align: 'center' });
    doc.text(`Paritet/Parity: CPT Aerodrom Tuzla`, pageWidth / 2, 43, { align: 'center' });
    
    // Find the most common airline to use as the recipient
    const airlineCounts: Record<string, { count: number, airline: FuelingOperation['airline'] }> = {};
    
    operations.forEach(operation => {
      if (operation.airline && operation.airline.name) {
        const airlineName = operation.airline.name;
        if (!airlineCounts[airlineName]) {
          airlineCounts[airlineName] = { count: 0, airline: operation.airline };
        }
        airlineCounts[airlineName].count++;
      }
    });
    
    // Find the most common airline
    let mostCommonAirline: FuelingOperation['airline'] | null = null;
    let airlineMaxCount = 0;
    
    Object.keys(airlineCounts).forEach(airlineName => {
      if (airlineCounts[airlineName].count > airlineMaxCount) {
        airlineMaxCount = airlineCounts[airlineName].count;
        mostCommonAirline = airlineCounts[airlineName].airline;
      }
    });
    
    // Draw boxes for seller and buyer information
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    
    // Left box for customer (buyer) information
    doc.roundedRect(14, 55, pageWidth / 2 - 20, 50, 2, 2, 'S');
    
    // Right box for seller information
    doc.roundedRect(pageWidth / 2 + 6, 55, pageWidth / 2 - 20, 50, 2, 2, 'S');
    
    // Add client information (left side - buyer)
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('KUPAC:', 20, 62);
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(10);
    
    if (mostCommonAirline) {
      // Use type assertion to access airline properties
      const airline = mostCommonAirline as any;
      doc.text(`${airline.name || 'N/A'}`, 20, 68);
      doc.text(`ID/PDV broj: ${airline.taxId || 'N/A'}`, 20, 73);
      doc.text(`Adresa: ${airline.address || 'N/A'}`, 20, 78);
      doc.text(`Kontakt: ${airline.contact_details || 'N/A'}`, 20, 83);
    } else {
      doc.text('Nije dostupno', 20, 68);
    }
    
    // Add seller information (right side)
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('PRODAVAC:', pageWidth / 2 + 12, 62);
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(10);
    doc.text('HIFA Petrol d.o.o.', pageWidth / 2 + 12, 68);
    doc.text('ID: 4200468580006', pageWidth / 2 + 12, 73);
    doc.text('PDV: 200468580006', pageWidth / 2 + 12, 78);
    doc.text('Međunarodni aerodrom Tuzla', pageWidth / 2 + 12, 83);
    doc.text('Tešanj, Bosna i Hercegovina', pageWidth / 2 + 12, 88);
    doc.text('Tel: +387 33 289 100', pageWidth / 2 + 12, 93);
    doc.text('Email: info@hifapetrol.ba', pageWidth / 2 + 12, 98);
    
    // Calculate totals
    let totalLiters = operations.reduce((sum, op) => sum + (op.quantity_liters || 0), 0);
    let totalKg = operations.reduce((sum, op) => sum + (op.quantity_kg || 0), 0);
    
    // Izračunaj ukupnu osnovnu cijenu prije rabata - zaokruženo na 5 decimala
    const totalBaseAmount = Number(operations.reduce((sum, op) => {
      const baseAmount = (op.quantity_kg || 0) * (op.price_per_kg || 0);
      return sum + baseAmount;
    }, 0).toFixed(5));
    
    // Izračunaj ukupan rabat - zaokruženo na 5 decimala
    const totalDiscountAmount = Number(operations.reduce((sum, op) => {
      const baseAmount = (op.quantity_kg || 0) * (op.price_per_kg || 0);
      const discountAmount = baseAmount * ((op.discount_percentage || 0) / 100);
      return sum + discountAmount;
    }, 0).toFixed(5));
    
    // Neto iznos nakon rabata (osnovna cijena - rabat) - zaokruženo na 5 decimala
    // Koristimo total_amount iz operacija ako postoji, inače računamo iz osnovne cijene i rabata
    const calculatedNetAmount = Number((totalBaseAmount - totalDiscountAmount).toFixed(5));
    // Ensure we're working with numbers for all operations
    const totalNetAmount = operations.reduce((sum, op) => {
      // Ako operacija ima total_amount, koristi ga, inače izračunaj
      const netAmount = Number(op.total_amount || 0) || Number(((op.quantity_kg || 0) * (op.price_per_kg || 0)) * (1 - ((op.discount_percentage || 0) / 100)));
      return sum + netAmount;
    }, 0);
    // Ensure totalNetAmount is a number before using toFixed
    const finalTotalNetAmount = Number(Number(totalNetAmount).toFixed(5));
    
    // PDV se računa na neto iznos nakon rabata - zaokruženo na 5 decimala
    const totalVatAmount = Number((finalTotalNetAmount * VAT_RATE).toFixed(5));
    
    // Akcize se računaju na količinu u litrama - zaokruženo na 5 decimala
    const totalExciseTaxAmount = Number((totalLiters * EXCISE_TAX_PER_LITER).toFixed(5));
    
    // Count occurrences of each currency to determine the most common
    const currencyCounts: Record<string, number> = {};
    
    operations.forEach(operation => {
      const currency = operation.currency || 'BAM';
      currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;
    });
    
    // Determine the most common currency
    let mostCommonCurrency = 'BAM';
    let maxCount = 0;
    for (const [currency, count] of Object.entries(currencyCounts)) {
      if (count > maxCount) {
        mostCommonCurrency = currency;
        maxCount = count;
      }
    }
    
    // Add transaction details header
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('ZBIRNI PREGLED:', 14, 105);
    doc.setFont(FONT_NAME, 'normal');
    doc.setFontSize(10);
    
    // Format all amounts to have exactly 5 decimal places
    // Use comma as decimal separator for Bosnian format
    const totalBaseAmountFormatted = totalBaseAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    const totalDiscountAmountFormatted = totalDiscountAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    const totalNetAmountFormatted = finalTotalNetAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    const totalVatAmountFormatted = totalVatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    const totalExciseTaxAmountFormatted = totalExciseTaxAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    
    // Calculate subtotal (neto + PDV) and format - round to 5 decimal places
    const totalSubtotalWithoutExcise = Number((finalTotalNetAmount + totalVatAmount).toFixed(5));
    const totalSubtotalWithoutExciseFormatted = totalSubtotalWithoutExcise.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    
    // Calculate total (neto + PDV + akcize) and format - round to 5 decimal places
    const totalGrossAmount = Number((finalTotalNetAmount + totalVatAmount + totalExciseTaxAmount).toFixed(5));
    const totalGrossAmountFormatted = totalGrossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 });
    
    // Create summary table
    const summaryColumn = ['Opis', 'Vrijednost', 'Jedinica'];
    const summaryRows = [
      ['Ukupna količina goriva', totalLiters.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'litara'],
      ['Ukupna količina goriva', totalKg.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'kg'],
      ['Ukupna osnovna cijena', totalBaseAmountFormatted, mostCommonCurrency],
      ['Ukupan rabat', totalDiscountAmountFormatted, mostCommonCurrency],
      ['Ukupan neto iznos (nakon rabata)', totalNetAmountFormatted, mostCommonCurrency],
      ['Ukupan PDV (17%)', totalVatAmountFormatted, mostCommonCurrency],
      ['Ukupan međuzbir (neto + PDV)', totalSubtotalWithoutExciseFormatted, mostCommonCurrency],
      ['Ukupan iznos akcize', totalExciseTaxAmountFormatted, mostCommonCurrency],
      ['Ukupan iznos za plaćanje (sa PDV)', totalGrossAmountFormatted, mostCommonCurrency]
    ];
    
    // Apply autoTable for summary
    autoTable(doc, {
      head: [summaryColumn],
      body: summaryRows,
      startY: 110,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2, font: FONT_NAME },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 115 }
    });
    
    // Get the final y position after the summary table
    // @ts-ignore - lastAutoTable is added by the plugin but not in the types
    const summaryFinalY = (doc as any).lastAutoTable?.finalY + 5 || 120;
    
    // Add operations table header
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.text('PREGLED OPERACIJA:', 14, summaryFinalY);
    doc.setFont(FONT_NAME, 'normal');
    
    // Create detailed operations table
    const tableColumn = ['Datum', 'Registracija', 'Destinacija', 'Dostavnica', 'Količina (L)', 'Količina (kg)', 'Osnovna cijena', 'Rabat', 'Neto', 'PDV 17%', 'Akcize', 'Bruto', 'Valuta'];
    const tableRows = operations.map(operation => {
      // Izračunaj osnovnu cijenu prije rabata - zaokruženo na 5 decimala
      const baseAmount = Number(((operation.quantity_kg || 0) * (operation.price_per_kg || 0)).toFixed(5));
      
      // Izračunaj rabat - zaokruženo na 5 decimala
      const discountPercentage = operation.discount_percentage || 0;
      const discountAmount = Number((baseAmount * (discountPercentage / 100)).toFixed(5));
      
      // Neto iznos nakon rabata - zaokruženo na 5 decimala
      // Koristi total_amount iz operacije ako postoji, inače izračunaj
      const calculatedNetAmount = Number((baseAmount - discountAmount).toFixed(5));
      // Ensure netAmount is a number before using toFixed
      const netAmount = Number(operation.total_amount || 0) || calculatedNetAmount;
      const netAmountNum = Number(netAmount.toFixed(5));
      
      // PDV se računa na neto iznos nakon rabata - zaokruženo na 5 decimala
      const vatAmount = Number((netAmountNum * VAT_RATE).toFixed(5));
      
      // Akcize se računaju na količinu u litrama - zaokruženo na 5 decimala
      const exciseTaxAmount = Number(((operation.quantity_liters || 0) * EXCISE_TAX_PER_LITER).toFixed(5));
      
      // Međuzbir je neto + PDV (bez akcize) - zaokruženo na 5 decimala
      const subtotalWithoutExcise = Number((netAmountNum + vatAmount).toFixed(5));
      
      // Ukupan iznos je neto + PDV + akcize - zaokruženo na 5 decimala
      const grossAmount = Number((netAmountNum + vatAmount + exciseTaxAmount).toFixed(5));
      
      return [
        formatDate(operation.dateTime),
        operation.aircraft_registration || 'N/A',
        operation.destination,
        operation.delivery_note_number || 'N/A',
        (operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        (operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        baseAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 }),
        discountAmount > 0 ? discountAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : '0,00000',
        netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
        vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
        exciseTaxAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
        grossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
        operation.currency || 'BAM'
      ];
    });
    
    // Add a total row
    tableRows.push([
      'UKUPNO',
      '',
      '',
      '',
      totalLiters.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      totalKg.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      totalBaseAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5 }),
      totalDiscountAmount > 0 ? totalDiscountAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : '0,00000',
      finalTotalNetAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
      totalVatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
      totalExciseTaxAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
      totalGrossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 }),
      mostCommonCurrency
    ]);
    
    // Check if we need to add a page break before the operations table
    if (summaryFinalY > pageWidth / 2) {
      doc.addPage();
      
      // Reset the Y position for the new page
      const newPageY = 20;
      
      // Add header to the new page
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Zbirna faktura br: ${invoiceNumber} - Strana ${doc.getNumberOfPages()}`, pageWidth / 2, 10, { align: 'center' });
      
      // Add operations table header on the new page
      doc.setFontSize(11);
      doc.setFont(FONT_NAME, 'bold');
      doc.text('PREGLED OPERACIJA:', 14, newPageY);
      doc.setFont(FONT_NAME, 'normal');
      
      // Apply autoTable for operations with multi-page support
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: newPageY + 5,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, font: FONT_NAME },
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
        margin: { top: 20 },
        // Add header and footer for multi-page support
        didDrawPage: (data) => {
          // Add header to each additional page
          if (data.pageNumber > doc.getNumberOfPages() - 1) {
            // Add page header for pages after the current
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Zbirna faktura br: ${invoiceNumber} - Strana ${data.pageNumber}`, pageWidth / 2, 10, { align: 'center' });
          }
          
          // Add footer to each page
       }
      });
    } else {
      // Apply autoTable for operations with multi-page support on the same page
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: summaryFinalY + 5,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, font: FONT_NAME },
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
        margin: { top: summaryFinalY + 5 },
        // Add header and footer for multi-page support
        didDrawPage: (data) => {
          // Add header to each page
          if (data.pageNumber > 1) {
            // Add page header for pages after the first
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Zbirna faktura br: ${invoiceNumber} - Strana ${data.pageNumber}`, pageWidth / 2, 10, { align: 'center' });
          }
          
          // Add footer to each page
          doc.setFontSize(8);
          doc.text('AVIOSERVIS d.o.o. | ID: 4200468580006 | PDV: 200468580006', pageWidth / 2, 280, { align: 'center' });
          doc.text(`Faktura generisana: ${new Date().toLocaleString('hr-HR')}`, pageWidth / 2, 285, { align: 'center' });
        }
      });
    }
    
    // Get the final y position after the operations table
    // @ts-ignore - lastAutoTable is added by the plugin but not in the types
    const finalY = (doc as any).lastAutoTable?.finalY + 10 || 150;
    
    // Add total amount with a box around it
    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 180, finalY, 165, 60, 'F');
    
    // Define columns for better alignment
    const labelX = pageWidth - 175;
    const valueX = pageWidth - 25;
    const lineHeight = 12;
    
    // Set up text formatting
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(FONT_NAME, 'normal');
    
    // First row
    doc.text('Ukupan neto iznos:', labelX, finalY + lineHeight);
    doc.text(`${totalNetAmountFormatted} ${mostCommonCurrency}`, valueX, finalY + lineHeight, { align: 'right' });
    
    // Second row
    doc.text('PDV (17%):', labelX, finalY + 2*lineHeight);
    doc.text(`${totalVatAmountFormatted} ${mostCommonCurrency}`, valueX, finalY + 2*lineHeight, { align: 'right' });
    
    // Third row
    doc.text('Akcize (0.30 KM/L):', labelX, finalY + 3*lineHeight);
    doc.text(`${totalExciseTaxAmountFormatted} ${mostCommonCurrency}`, valueX, finalY + 3*lineHeight, { align: 'right' });
    
    // Fourth row - subtotal of net+VAT (without excise)
    doc.text('Međuzbir (bez akcize):', labelX, finalY + 4*lineHeight);
    doc.text(`${totalSubtotalWithoutExciseFormatted} ${mostCommonCurrency}`, valueX, finalY + 4*lineHeight, { align: 'right' });
    
    // Final row - total with PDV
    doc.setFontSize(11);
    doc.setFont(FONT_NAME, 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('Ukupan iznos za plaćanje (sa PDV):', labelX, finalY + 5*lineHeight);
    doc.text(`${totalGrossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 5, maximumFractionDigits: 5 })} ${mostCommonCurrency}`, valueX, finalY + 5*lineHeight, { align: 'right' });
    
    // Add payment information - moved lower on the page
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Informacije o plaćanju:', 14, 250);
    doc.text('Banka: UniCredit Bank d.d.', 14, 255);
    doc.text('IBAN: BA39 3386 9048 0000 0000', 14, 260);
    doc.text('SWIFT: UNCRBA22', 14, 265);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('HIFA Petrol d.o.o. | ID: 4200468580006 | PDV: 200468580006', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Faktura generisana: ${new Date().toLocaleString('hr-HR')}`, pageWidth / 2, 285, { align: 'center' });
    
    // Save the PDF
    doc.save(`Zbirna-Faktura-Domaca-${invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating consolidated domestic PDF:', error);
    throw error;
  }
};
