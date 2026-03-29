-- RSBSA MAO Livestock Management System - Complete Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FARMERS TABLE
CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rsbsa_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  birthdate DATE,
  gender TEXT DEFAULT 'Male',
  address TEXT,
  barangay TEXT,
  contact TEXT,
  civil_status TEXT DEFAULT 'Single',
  education TEXT DEFAULT 'Elementary',
  household_size INTEGER DEFAULT 1,
  is_ar_beneficiary BOOLEAN DEFAULT false,
  is_ip BOOLEAN DEFAULT false,
  farm_area_sqm NUMERIC DEFAULT 0,
  farm_type TEXT DEFAULT 'Backyard',
  livestock_count INTEGER DEFAULT 0,
  latitude DOUBLE PRECISION DEFAULT 0,
  longitude DOUBLE PRECISION DEFAULT 0,
  status TEXT DEFAULT 'Healthy', -- Healthy, Alert, Warning
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LIVESTOCK TABLE
CREATE TABLE IF NOT EXISTS livestock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id TEXT UNIQUE,
  farmer_name TEXT, -- Linked by name for simplicity in some views
  owner_id UUID REFERENCES farmers(id) ON DELETE CASCADE,
  species TEXT NOT NULL, -- Cattle, Swine, Goat, Poultry, etc.
  breed TEXT,
  color TEXT,
  weight_kg NUMERIC,
  purpose TEXT, -- Breeding, Fattening, Dairy
  age TEXT,
  sex TEXT,
  date_acquired DATE,
  health_status TEXT DEFAULT 'Healthy',
  vaccination_status TEXT DEFAULT 'Not Vaccinated',
  source_of_animal TEXT,
  is_insured BOOLEAN DEFAULT false,
  insurance_id TEXT,
  status TEXT DEFAULT 'Healthy',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HEALTH SERVICES TABLE
CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  farmer_name TEXT,
  livestock_tag TEXT,
  species TEXT,
  type TEXT, -- Vaccination, Deworming, Treatment, Artificial Insemination
  description TEXT,
  dosage TEXT,
  next_schedule DATE,
  remarks TEXT,
  cost NUMERIC DEFAULT 0,
  technician TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PROGRAM DISTRIBUTION TABLE
CREATE TABLE IF NOT EXISTS distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_name TEXT NOT NULL,
  funding_source TEXT,
  item_type TEXT, -- Seeds, Fertilizers, Animals, Tools
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  date DATE DEFAULT CURRENT_DATE,
  location TEXT,
  distributor_name TEXT,
  beneficiaries_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. FIELD INSPECTION TABLE
CREATE TABLE IF NOT EXISTS field_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  farmer_name TEXT,
  location TEXT,
  inspector TEXT,
  purpose TEXT,
  findings TEXT,
  recommendations TEXT,
  farm_condition_rating INTEGER DEFAULT 5, -- 1 to 5
  next_inspection_date DATE,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  category TEXT, -- Vaccines, Medicines, Tools, Feeds
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  reorder_level NUMERIC DEFAULT 10,
  expiration_date DATE,
  supplier TEXT,
  batch_number TEXT,
  status TEXT DEFAULT 'In Stock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. USER MANAGEMENT TABLE
CREATE TABLE IF NOT EXISTS users_management (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'Staff', -- Admin, Technician, Staff, Encoder
  status TEXT DEFAULT 'Active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  program_type TEXT,
  status TEXT DEFAULT 'Upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info', -- info, warning, success, error
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow all for authenticated users for development)
CREATE POLICY "Allow all for authenticated users" ON farmers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON livestock FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON health_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON distributions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON field_inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON users_management FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);
