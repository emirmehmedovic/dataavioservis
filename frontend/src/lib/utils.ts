import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { VehicleStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Privremeno rješenje dok se ne sredi problem s Prisma tipovima na frontendu
export const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('hr-HR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Error';
  }
};

export const formatDateTime = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('hr-HR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Error';
  }
}

export function getStatusColor(status: VehicleStatus): string {
  switch (status) {
    case VehicleStatus.ACTIVE:
      return "bg-green-500 hover:bg-green-600"; // Green for active
    case VehicleStatus.INACTIVE:
      return "bg-gray-500 hover:bg-gray-600";    // Gray for inactive
    case VehicleStatus.MAINTENANCE:
      return "bg-orange-500 hover:bg-orange-600"; // Orange for maintenance
    case VehicleStatus.OUT_OF_SERVICE:
      return "bg-red-500 hover:bg-red-600";       // Red for out of service
    default:
      return "bg-gray-400 hover:bg-gray-500";     // Default gray
  }
}

export function getInitials(name?: string | null): string {
  if (!name) {
    return "?";
  }

  const parts = name.split(" ").filter(Boolean); // Filter out empty strings from multiple spaces

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    // If single word, take first two letters, or one if it's a single letter word
    return parts[0].substring(0, 2).toUpperCase();
  }

  // For multiple words, take the first letter of the first two words
  const firstInitial = parts[0][0];
  const secondInitial = parts[1][0];
  
  return `${firstInitial}${secondInitial}`.toUpperCase();
}

/**
 * Formatira broj s dvije decimale i dodaje tisuću separator (točku)
 * Koristi se za prikaz količina goriva u litrama
 * 
 * @param value Broj koji treba formatirati
 * @returns Formatirani broj s dvije decimalne znamenke i tisućama odvojenima s točkom
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0,00';
  }
  
  return new Intl.NumberFormat('hr-HR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
