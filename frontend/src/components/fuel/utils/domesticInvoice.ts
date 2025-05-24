import dayjs from 'dayjs';
import jsPDF from 'jspdf';
// Import jsPDF-AutoTable
import autoTable from 'jspdf-autotable';
import { FuelingOperation } from '../types';
import { formatDate } from './helpers';

// VAT rate for domestic traffic (17%)
const VAT_RATE = 0.17;

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
    
    // Add client information on the left side
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('KUPAC:', 14, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${operation.airline.name}`, 14, 60);
    doc.text(`${operation.airline.address || 'N/A'}`, 14, 65);
    doc.text(`ID/PDV: ${operation.airline.taxId || 'N/A'}`, 14, 70);
    doc.text(`Tel: ${operation.airline.contact_details || 'N/A'}`, 14, 75);
    
    // Add company information on the right side
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODAVAC:', pageWidth - 90, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('AVIOSERVIS d.o.o.', pageWidth - 90, 60);
    doc.text('Međunarodni aerodrom Sarajevo', pageWidth - 90, 65);
    doc.text('71210 Ilidža, Bosna i Hercegovina', pageWidth - 90, 70);
    doc.text('ID/PDV: 4200468580006', pageWidth - 90, 75);
    doc.text('Tel: +387 33 289 100', pageWidth - 90, 80);
    
    // Add flight information
    doc.setFontSize(10);
    doc.text(`Registracija aviona: ${operation.aircraft_registration || 'N/A'}`, 14, 85);
    doc.text(`Destinacija: ${operation.destination}`, 14, 90);
    doc.text(`Broj leta: ${operation.flight_number || 'N/A'}`, 14, 95);
    
    // Calculate VAT amounts
    const netAmount = operation.total_amount || 0;
    const vatAmount = netAmount * VAT_RATE;
    const grossAmount = netAmount + vatAmount;
    
    // Add transaction details in a table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALJI TRANSAKCIJE:', 14, 110);
    
    // Create transaction table
    const tableColumn = ['Opis', 'Količina (L)', 'Količina (kg)', 'Cijena po kg', 'Iznos bez PDV', 'PDV 17%', 'Ukupno sa PDV'];
    const tableRows = [
      [
        `${operation.tank?.fuel_type || 'JET A-1'} gorivo`,
        (operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        (operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        (operation.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        grossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })
      ]
    ];
    
    // Apply autoTable for transaction details
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 115,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 115 }
    });
    
    // Get the final y position after the table
    // @ts-ignore - lastAutoTable is added by the plugin but not in the types
    const finalY = (doc as any).lastAutoTable?.finalY + 10 || 150;
    
    // Add total amount with a box around it
    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 100, finalY, 85, 25, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Ukupno bez PDV: ${netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${operation.currency || 'BAM'}`, pageWidth - 95, finalY + 8);
    doc.text(`PDV 17%: ${vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${operation.currency || 'BAM'}`, pageWidth - 95, finalY + 15);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text(`ZA UPLATU: ${grossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${operation.currency || 'BAM'}`, pageWidth - 95, finalY + 22);
    
    // Add payment information
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Informacije o plaćanju:', 14, 210);
    doc.text('Banka: UniCredit Bank d.d.', 14, 215);
    doc.text('IBAN: BA39 3386 9048 0000 0000', 14, 220);
    doc.text('SWIFT: UNCRBA22', 14, 225);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('AVIOSERVIS d.o.o. | ID: 4200468580006 | PDV: 200468580006', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Faktura generisana: ${new Date().toLocaleString('hr-HR')}`, pageWidth / 2, 285, { align: 'center' });
    
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
    
    // Add invoice title at the top
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('ZBIRNA FAKTURA ZA GORIVO - UNUTARNJI SAOBRAĆAJ', pageWidth / 2, 20, { align: 'center' });
    
    // Add invoice number and date at top left
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const invoiceNumber = `DOM-CONS-INV-${new Date().getTime().toString().slice(-6)}-${new Date().getFullYear()}`;
    doc.text(`Broj fakture: ${invoiceNumber}`, 14, 35);
    doc.text(`Datum izdavanja: ${formatDate(new Date().toISOString())}`, 14, 40);
    doc.text(`Datum isporuke: ${formatDate(new Date().toISOString())}`, 14, 45);
    doc.text(`Period: ${filterDescription}`, 14, 50);
    
    // Get client information from the first operation
    const firstOperation = operations[0];
    const airline = firstOperation.airline;
    
    // Add client information on the left side
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('KUPAC:', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${airline.name}`, 14, 65);
    doc.text(`${airline.address || 'N/A'}`, 14, 70);
    doc.text(`ID/PDV: ${airline.taxId || 'N/A'}`, 14, 75);
    doc.text(`Tel: ${airline.contact_details || 'N/A'}`, 14, 80);
    
    // Add company information on the right side
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODAVAC:', pageWidth - 90, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('AVIOSERVIS d.o.o.', pageWidth - 90, 65);
    doc.text('Međunarodni aerodrom Sarajevo', pageWidth - 90, 70);
    doc.text('71210 Ilidža, Bosna i Hercegovina', pageWidth - 90, 75);
    doc.text('ID/PDV: 4200468580006', pageWidth - 90, 80);
    doc.text('Tel: +387 33 289 100', pageWidth - 90, 85);
    
    // Calculate totals
    const totalLiters = operations.reduce((sum, op) => sum + (op.quantity_liters || 0), 0);
    const totalKg = operations.reduce((sum, op) => sum + (op.quantity_kg || 0), 0);
    
    // Determine the most common currency
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
    
    // Calculate total amount in the most common currency
    // This is simplified - in a real app, you might need currency conversion
    const totalNetAmount = operations
      .filter(op => (op.currency || 'BAM') === mostCommonCurrency)
      .reduce((sum, op) => sum + (op.total_amount || 0), 0);
    
    // Calculate VAT and gross amount
    const totalVatAmount = totalNetAmount * VAT_RATE;
    const totalGrossAmount = totalNetAmount + totalVatAmount;
    
    // Add transaction details header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALJI TRANSAKCIJA:', 14, 100);
    doc.setFont('helvetica', 'normal');
    
    // Create summary table first
    const summaryColumn = ['Ukupna količina (L)', 'Ukupna količina (kg)', 'Broj operacija', 'Valuta'];
    const summaryRows = [
      [
        totalLiters.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        totalKg.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        operations.length.toString(),
        mostCommonCurrency
      ]
    ];
    
    // Apply autoTable for summary
    autoTable(doc, {
      head: [summaryColumn],
      body: summaryRows,
      startY: 105,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 105 }
    });
    
    // Get the final y position after the summary table
    // @ts-ignore - lastAutoTable is added by the plugin but not in the types
    const summaryFinalY = (doc as any).lastAutoTable?.finalY + 10 || 125;
    
    // Add operations table header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PREGLED OPERACIJA:', 14, summaryFinalY);
    doc.setFont('helvetica', 'normal');
    
    // Create detailed operations table
    const tableColumn = ['Datum', 'Registracija', 'Destinacija', 'Količina (L)', 'Količina (kg)', 'Neto', 'PDV 17%', 'Bruto', 'Valuta'];
    const tableRows = operations.map(operation => {
      const netAmount = operation.total_amount || 0;
      const vatAmount = netAmount * VAT_RATE;
      const grossAmount = netAmount + vatAmount;
      
      return [
        formatDate(operation.dateTime),
        operation.aircraft_registration || 'N/A',
        operation.destination,
        (operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        (operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        netAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        grossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
        operation.currency || 'BAM'
      ];
    });
    
    // Add a total row
    tableRows.push([
      'UKUPNO',
      '',
      '',
      totalLiters.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      totalKg.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      totalNetAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      totalVatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      totalGrossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      mostCommonCurrency
    ]);
    
    // Apply autoTable for operations
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: summaryFinalY + 5,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold' },
      margin: { top: summaryFinalY + 5 }
    });
    
    // Get the final y position after the operations table
    // @ts-ignore - lastAutoTable is added by the plugin but not in the types
    const finalY = (doc as any).lastAutoTable?.finalY + 10 || 150;
    
    // Add total amount with a box around it
    doc.setFillColor(240, 240, 240);
    doc.rect(110, finalY, 85, 35, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Ukupan neto iznos:', 115, finalY + 10);
    doc.text(`${totalNetAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${mostCommonCurrency}`, 115, finalY + 15);
    doc.text('PDV (17%):', 115, finalY + 20);
    doc.text(`${totalVatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${mostCommonCurrency}`, 115, finalY + 25);
    doc.setFontSize(12);
    doc.setTextColor(0, 51, 102);
    doc.text('Ukupan iznos za plaćanje (sa PDV):', 115, finalY + 30);
    doc.setFontSize(14);
    doc.text(`${totalGrossAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${mostCommonCurrency}`, 115, finalY + 35);
    
    // Add payment information
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Informacije o plaćanju:', 14, finalY + 40);
    doc.text('Banka: UniCredit Bank d.d.', 14, finalY + 45);
    doc.text('IBAN: BA39 3386 9048 0000 0000', 14, finalY + 50);
    doc.text('SWIFT: UNCRBA22', 14, finalY + 55);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('AVIOSERVIS d.o.o. | ID: 4200468580006 | PDV: 200468580006', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Faktura generisana: ${new Date().toLocaleString('hr-HR')}`, pageWidth / 2, 285, { align: 'center' });
    
    // Save the PDF
    doc.save(`Zbirna-Faktura-Domaca-${invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating consolidated domestic PDF:', error);
    throw error;
  }
};
