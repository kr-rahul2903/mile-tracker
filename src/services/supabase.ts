import { createClient } from '@supabase/supabase-js';
import { CarEntry } from '../types';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Table name - you can change this to match your Supabase table name
const TABLE_NAME = 'car_entries';

export interface SupabaseCarEntry {
  id?: string;
  user_name: string;
  mileage: number;
  end_mileage?: number | null;
  message: string;
  trip_start_date: number;
  trip_end_date?: number | null;
  created_at?: string;
}

// Convert CarEntry to Supabase format
const toSupabaseFormat = (entry: CarEntry): SupabaseCarEntry => {
  return {
    id: entry.id, // Include ID if it exists (for updates or consistency)
    user_name: entry.userName,
    mileage: Number(entry.mileage), // Ensure mileage is a number
    end_mileage: entry.endMileage ? Number(entry.endMileage) : null,
    message: entry.message,
    trip_start_date: Number(entry.tripStartDate), // Ensure trip_start_date is a number
    trip_end_date: entry.tripEndDate ? Number(entry.tripEndDate) : null,
  };
};

// Save entry to Supabase and update previous entry's endMileage
export const saveEntryToSupabase = async (entry: Omit<CarEntry, 'id' | 'endMileage' | 'tripEndDate'>): Promise<CarEntry> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured. Skipping database save.');
      throw new Error('Supabase not configured');
    }

    // Find the most recent entry to update its endMileage
    const { data: existingEntries, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('trip_start_date', { ascending: false })
      .limit(1);

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching previous entry:', fetchError);
    }

    // Update the previous entry's endMileage if it exists
    // The start of the new trip marks the end of the previous trip (same logic as local storage)
    if (existingEntries && existingEntries.length > 0) {
      const previousEntry = existingEntries[0];
      // Always update the previous entry's endMileage to the new entry's mileage
      // This ensures consistency with the calculation logic
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({
          end_mileage: Number(entry.mileage), // The new entry's mileage becomes the previous entry's endMileage
          trip_end_date: Number(entry.tripStartDate), // The new entry's start date becomes the previous entry's end date
        })
        .eq('id', previousEntry.id);

      if (updateError) {
        console.error('Error updating previous entry:', updateError);
        // Don't throw - continue with creating new entry
      } else {
        console.log('Previous entry updated with endMileage:', entry.mileage);
      }
    }

    // Create the new entry
    const newEntry: CarEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };

    const supabaseEntry = toSupabaseFormat(newEntry);
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([supabaseEntry])
      .select()
      .single();

    if (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }

    console.log('Entry saved to Supabase successfully');
    
    // Return the created entry with the ID from Supabase
    return {
      id: data.id || newEntry.id,
      userName: newEntry.userName,
      mileage: Number(data.mileage), // Ensure mileage is preserved as number
      endMileage: data.end_mileage ? Number(data.end_mileage) : undefined,
      message: newEntry.message,
      tripStartDate: Number(data.trip_start_date),
      tripEndDate: data.trip_end_date ? Number(data.trip_end_date) : undefined,
    };
  } catch (error) {
    console.error('Failed to save entry to Supabase:', error);
    throw error;
  }
};

// Calculate endMileage and tripEndDate based on the next entry (same logic as local storage)
// Entry N's endMileage = Entry N+1's mileage (where N+1 is the next entry chronologically)
// This matches the original local storage logic where the start of a new trip marks the end of the previous trip
const calculateEndMileageFromEntries = (entries: CarEntry[]): CarEntry[] => {
  if (entries.length === 0) return entries;

  // Sort entries by tripStartDate ascending (oldest first) to process in chronological order
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.tripStartDate || (a as any).timestamp || 0;
    const dateB = b.tripStartDate || (b as any).timestamp || 0;
    return dateA - dateB;
  });

  // For each entry, set its endMileage to the next entry's mileage
  // This is the same logic as the original local storage: 
  // "The start of the new trip marks the end of the previous trip"
  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const currentEntry = sortedEntries[i];
    const nextEntry = sortedEntries[i + 1];
    
    // The start of the next trip marks the end of the current trip
    currentEntry.endMileage = nextEntry.mileage;
    currentEntry.tripEndDate = nextEntry.tripStartDate;
  }

  // The last entry (most recent) doesn't have an endMileage yet (trip is in progress)
  // This is correct - it will be set when the next entry is created

  // Return entries sorted by tripStartDate descending (newest first) for display
  return sortedEntries.sort((a, b) => {
    const dateA = a.tripStartDate || (a as any).timestamp || 0;
    const dateB = b.tripStartDate || (b as any).timestamp || 0;
    return dateB - dateA;
  });
};

// Get all entries from Supabase
export const getEntriesFromSupabase = async (): Promise<CarEntry[]> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured. Returning empty array.');
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('trip_start_date', { ascending: false });

    if (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }

    // Convert Supabase format back to CarEntry format
    const entries: CarEntry[] = (data || []).map((entry: SupabaseCarEntry) => ({
      id: entry.id || crypto.randomUUID(),
      userName: entry.user_name,
      mileage: Number(entry.mileage), // Ensure it's a number
      endMileage: entry.end_mileage ? Number(entry.end_mileage) : undefined,
      message: entry.message,
      tripStartDate: Number(entry.trip_start_date), // Ensure it's a number
      tripEndDate: entry.trip_end_date ? Number(entry.trip_end_date) : undefined,
    }));

    // Calculate endMileage based on the next entry's mileage (same logic as local storage)
    // This ensures consistency even if the DB values are not set correctly
    return calculateEndMileageFromEntries(entries);
  } catch (error) {
    console.error('Failed to fetch entries from Supabase:', error);
    return [];
  }
};

// Get the last entry from Supabase (for validation)
export const getLastEntryFromSupabase = async (): Promise<CarEntry | null> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('trip_start_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching last entry from Supabase:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id || crypto.randomUUID(),
      userName: data.user_name,
      mileage: Number(data.mileage),
      endMileage: data.end_mileage ? Number(data.end_mileage) : undefined,
      message: data.message,
      tripStartDate: Number(data.trip_start_date),
      tripEndDate: data.trip_end_date ? Number(data.trip_end_date) : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch last entry from Supabase:', error);
    return null;
  }
};

