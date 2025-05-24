import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FuelingOperation, AirlineFE } from '../types';

// Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

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
    
    // Add company logo/header
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('AVIOSERVIS d.o.o.', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Međunarodni aerodrom Sarajevo', pageWidth / 2, 28, { align: 'center' });
    doc.text('71210 Ilidža, Bosna i Hercegovina', pageWidth / 2, 34, { align: 'center' });
    
    // Add invoice title
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('FAKTURA ZA GORIVO', pageWidth / 2, 45, { align: 'center' });
    
    // Add invoice number and date
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const invoiceNumber = `INV-${operation.id}-${new Date().getFullYear()}`;
    doc.text(`Broj fakture: ${invoiceNumber}`, 14, 55);
    doc.text(`Datum: ${formatDate(operation.dateTime)}`, 14, 60);
    
    // Add client information
    doc.setFontSize(12);
    doc.text('Podaci o klijentu:', 14, 70);
    doc.setFontSize(10);
    doc.text(`Avio kompanija: ${operation.airline.name}`, 14, 75);
    doc.text(`ID/PDV broj: ${operation.airline.taxId || 'N/A'}`, 14, 80);
    doc.text(`Adresa: ${operation.airline.address || 'N/A'}`, 14, 85);
    doc.text(`Kontakt: ${operation.airline.contact_details || 'N/A'}`, 14, 90);
    doc.text(`Registracija aviona: ${operation.aircraft_registration || 'N/A'}`, 14, 95);
    doc.text(`Destinacija: ${operation.destination}`, 14, 100);
    doc.text(`Broj leta: ${operation.flight_number || 'N/A'}`, 14, 105);
    
    // Add fuel information
    doc.setFontSize(12);
    doc.text('Detalji o gorivu:', 14, 115);
    doc.setFontSize(10);
    doc.text(`Tip goriva: ${operation.tank?.fuel_type || 'JET A-1'}`, 14, 120);
    doc.text(`Količina (litara): ${(operation.quantity_liters || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} L`, 14, 125);
    doc.text(`Specifična gustoća: ${(operation.specific_density || 0).toLocaleString('hr-HR', { minimumFractionDigits: 3 })}`, 14, 130);
    doc.text(`Količina (kg): ${(operation.quantity_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} kg`, 14, 135);
    
    // Add pricing information
    doc.setFontSize(12);
    doc.text('Informacije o cijeni:', 14, 145);
    doc.setFontSize(10);
    doc.text(`Cijena po kg: ${(operation.price_per_kg || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${operation.currency || 'BAM'}`, 14, 150);
    doc.text(`Tip saobraćaja: ${operation.tip_saobracaja || 'N/A'}`, 14, 155);
    
    // Add total amount with a box around it
    doc.setFillColor(240, 240, 240);
    doc.rect(110, 165, 85, 25, 'F');
    doc.setFontSize(12);
    doc.text('Ukupan iznos za plaćanje:', 115, 175);
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text(`${(operation.total_amount || 0).toLocaleString('hr-HR', { minimumFractionDigits: 2 })} ${operation.currency || 'BAM'}`, 115, 185);
    
    // Add payment information
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Informacije o plaćanju:', 14, 200);
    doc.text('Banka: UniCredit Bank d.d.', 14, 205);
    doc.text('IBAN: BA39 3386 9048 0000 0000', 14, 210);
    doc.text('SWIFT: UNCRBA22', 14, 215);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('AVIOSERVIS d.o.o. | ID: 4200468580006 | PDV: 200468580006', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Faktura generisana: ${new Date().toLocaleString('hr-HR')}`, pageWidth / 2, 285, { align: 'center' });
    
    // Save the PDF
    doc.save(`Faktura-${invoiceNumber}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
