import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { TripData } from './dashboardTypes';

/**
 * Formats a date to a readable string
 */
export const formatDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};

/**
 * Formats time range between start and end times
 */
export const formatTime = (startTime: Date, endTime: Date): string => {
  const formatTimeOnly = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  return `${formatTimeOnly(startTime)} - ${formatTimeOnly(endTime)}`;
};

/**
 * Converts a Firestore timestamp to a Date object
 */
export const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date();
};

/**
 * Returns a display name for transport mode
 */
export const getTransportModeDisplayName = (mode: string): string => {
  const displayNames: Record<string, string> = {
    'walking': 'Walking',
    'cycling': 'Cycling',
    'publicTransport': 'Public Transport',
    'rideShare': 'Ride Share',
    'ownVehicle': 'Own Vehicle',
    'unknown': 'Unknown Mode',
  };
  
  return displayNames[mode] || mode;
};

/**
 * Truncates text with ellipsis if it exceeds max length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Calculates carbon credit totals by transportation mode from trip data
 */
export const calculateTransportModeBreakdown = (trips: TripData[]): Record<string, number> => {
  const breakdown: Record<string, number> = {};
  
  trips.forEach(trip => {
    if (breakdown[trip.transportMode]) {
      breakdown[trip.transportMode] += trip.carbonCredits;
    } else {
      breakdown[trip.transportMode] = trip.carbonCredits;
    }
  });
  
  return breakdown;
};

/**
 * Creates an avatar string from a name (initials)
 */
export const getAvatarInitials = (name: string): string => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

/**
 * Formats a number as currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Gets a color for a given index (cycles through colors)
 */
export const getColorForIndex = (index: number, colors: string[]): string => {
  return colors[index % colors.length];
}; 