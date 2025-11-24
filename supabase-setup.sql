-- Supabase Table Setup for MileTracker AI
-- Run this SQL in your Supabase SQL Editor to create the car_entries table

CREATE TABLE IF NOT EXISTS car_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  mileage NUMERIC NOT NULL,
  end_mileage NUMERIC,
  message TEXT NOT NULL,
  trip_start_date BIGINT NOT NULL,
  trip_end_date BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on trip_start_date for faster queries
CREATE INDEX IF NOT EXISTS idx_trip_start_date ON car_entries(trip_start_date DESC);

-- Create an index on user_name for filtering by user
CREATE INDEX IF NOT EXISTS idx_user_name ON car_entries(user_name);

-- Enable Row Level Security (RLS) - adjust policies based on your needs
ALTER TABLE car_entries ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow all authenticated users to read and insert
-- You may want to customize this based on your authentication setup
CREATE POLICY "Allow public read access" ON car_entries
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON car_entries
  FOR INSERT WITH CHECK (true);

-- Optional: If you want to allow updates/deletes, uncomment below:
-- CREATE POLICY "Allow public update access" ON car_entries
--   FOR UPDATE USING (true);
-- 
-- CREATE POLICY "Allow public delete access" ON car_entries
--   FOR DELETE USING (true);

