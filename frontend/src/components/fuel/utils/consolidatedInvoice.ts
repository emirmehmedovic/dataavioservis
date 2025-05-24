import dayjs from 'dayjs';
import jsPDF from 'jspdf';
// Import jsPDF-AutoTable
import autoTable from 'jspdf-autotable';
import { FuelingOperation } from '../types';
import { formatDate } from './helpers';

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

    // Create a new PDF document with Unicode support
    const doc = new jsPDF({
      putOnlyUsedFonts: true,
      compress: true,
      format: 'a4',
      filters: ['ASCIIHexEncode']
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
    
    // Add invoice title
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text('ZBIRNA FAKTURA ZA GORIVO', pageWidth / 2, 20, { align: 'center' });
    
    // Add invoice number and date
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const invoiceNumber = `CONS-INV-${new Date().getTime().toString().slice(-6)}-${new Date().getFullYear()}`;
    doc.text(`Broj fakture: ${invoiceNumber}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Datum: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 33, { align: 'center' });
    doc.text(`Period: ${filterDescription}`, pageWidth / 2, 38, { align: 'center' });
    
    // Get client information from the first operation (assuming all operations are for the same client if filtering by airline)
    const firstOperation = operations[0];
    const airline = firstOperation.airline;
    
    // Draw boxes for seller and buyer information
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    
    // Left box for customer (buyer) information
    doc.roundedRect(14, 45, pageWidth / 2 - 20, 50, 2, 2, 'S');
    
    // Right box for seller information
    doc.roundedRect(pageWidth / 2 + 6, 45, pageWidth / 2 - 20, 50, 2, 2, 'S');
    
    // Add client information (left side - buyer)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('KUPAC:', 20, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${airline.name}`, 20, 58);
    doc.text(`ID/PDV broj: ${airline.taxId || 'N/A'}`, 20, 63);
    doc.text(`Adresa: ${airline.address || 'N/A'}`, 20, 68);
    doc.text(`Kontakt: ${airline.contact_details || 'N/A'}`, 20, 73);
    
    // Add seller information (right side)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODAVAC:', pageWidth / 2 + 12, 52);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('HIFA Petrol d.o.o.', pageWidth / 2 + 12, 58);
    doc.text('ID: 4200468580006', pageWidth / 2 + 12, 63);
    doc.text('PDV: 200468580006', pageWidth / 2 + 12, 68);
    doc.text('Međunarodni aerodrom Tuzla', pageWidth / 2 + 12, 73);
    doc.text('Tešanj, Bosna i Hercegovina', pageWidth / 2 + 12, 78);
    doc.text('Tel: +387 33 289 100', pageWidth / 2 + 12, 83);
    doc.text('Email: info@avioservis.ba', pageWidth / 2 + 12, 88);
    
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
    const totalAmount = operations
      .filter(op => (op.currency || 'BAM') === mostCommonCurrency)
      .reduce((sum, op) => sum + (op.total_amount || 0), 0);
    
    // Add fuel information
    doc.setFontSize(12);
    doc.text('Zbirni podaci o gorivu:', 14, 95);
    doc.setFontSize(10);
    doc.text(`Ukupna količina (litara): ${totalLiters.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} L`, 14, 100);
    doc.text(`Ukupna količina (kg): ${totalKg.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} kg`, 14, 105);
    doc.text(`Ukupan broj operacija: ${operations.length}`, 14, 110);
    
    // Add operations table
    doc.setFontSize(12);
    doc.text('Pregled operacija:', 14, 115);
    
    // Create table
    const tableColumn = ['Datum', 'Registracija', 'Destinacija', 'Količina (L)', 'Količina (kg)', 'Iznos', 'Valuta'];
    const tableRows = operations.map(operation => [
      formatDate(operation.dateTime),
      operation.aircraft_registration || 'N/A',
      operation.destination,
      (operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      (operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      (operation.total_amount || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 }),
      operation.currency || 'BAM'
    ]);
    
    // Apply autoTable to the document
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 120,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1, font: 'helvetica' },
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 140 },
      // No need for didDrawCell with proper font embedding
    });
    
    // Get the final y position after the table
    // @ts-ignore - lastAutoTable is added by the plugin but not in the types
    const finalY = (doc as any).lastAutoTable?.finalY + 20 || 150;
    
    // Add total amount with a box around it
    doc.setFillColor(240, 240, 240);
    doc.rect(110, finalY, 85, 25, 'F');
    doc.setFontSize(12);
    doc.text('Ukupan iznos za plaćanje:', 115, finalY + 10);
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text(`${totalAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${mostCommonCurrency}`, 115, finalY + 20);
    
    // Add payment information
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Informacije o plaćanju:', 14, finalY + 40);
    doc.text('Banka: UniCredit Bank d.d.', 14, finalY + 45);
    doc.text('IBAN: BA39 3386 9048 0000 0000', 14, finalY + 50);
    doc.text('SWIFT: UNCRBA22', 14, finalY + 55);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('HIFA Petrol d.o.o. | ID: 4200468580006 | PDV: 200468580006', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Faktura generisana: ${new Date().toLocaleString('hr-HR')}`, pageWidth / 2, 285, { align: 'center' });
    
    // Process table data to replace special characters is handled by the text override function
    
    // Save the PDF
    doc.save(`Zbirna-Faktura-${invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating consolidated PDF:', error);
    throw error;
  }
};
