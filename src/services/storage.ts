import { CarEntry } from '../types';

const STORAGE_KEY = 'car_entry';

export const getEntries = (): CarEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addEntry = (entry: Omit<CarEntry, 'id' | 'endMileage' | 'tripEndDate'>): CarEntry => {
  const entries = getEntries();

  // Find the most recent entry (highest start date) to update its endMileage and tripEndDate
  if (entries.length > 0) {
    let latestIndex = -1;
    let maxDate = -1;

    entries.forEach((e, index) => {
      // Handle legacy data that might still have 'timestamp' instead of 'tripStartDate'
      const entryDate = e.tripStartDate || (e as any).timestamp || 0;
      
      if (entryDate > maxDate) {
        maxDate = entryDate;
        latestIndex = index;
      }
    });

    if (latestIndex !== -1) {
      // The start of the new trip marks the end of the previous trip
      entries[latestIndex].endMileage = entry.mileage;
      entries[latestIndex].tripEndDate = entry.tripStartDate;
    }
  }

  const newEntry: CarEntry = {
    ...entry,
    id: crypto.randomUUID(),
    // tripStartDate is provided in the entry argument
  };
  
  entries.push(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return newEntry;
};