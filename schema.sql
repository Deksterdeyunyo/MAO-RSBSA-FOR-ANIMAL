-- Supabase Schema for RSBSA MAO Livestock Management System

-- 1. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rsbsa_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  address TEXT,
  farm_type VARCHAR(255),
  farm_area_sqm NUMERIC,
  livestock_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Livestock Table
CREATE TABLE IF NOT EXISTS livestock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id VARCHAR(255) NOT NULL,
  farmer_name VARCHAR(255) NOT NULL,
  species VARCHAR(255) NOT NULL,
  breed VARCHAR(255),
  sex VARCHAR(50),
  age VARCHAR(50),
  weight_kg NUMERIC,
  status VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Health Records Table
CREATE TABLE IF NOT EXISTS health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  farmer_name VARCHAR(255) NOT NULL,
  livestock_tag VARCHAR(255) NOT NULL,
  species VARCHAR(255),
  type VARCHAR(255) NOT NULL,
  description TEXT,
  technician VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Distributions Table
CREATE TABLE IF NOT EXISTS distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(255) NOT NULL,
  quantity NUMERIC NOT NULL,
  unit VARCHAR(50),
  location VARCHAR(255),
  beneficiaries_count INTEGER DEFAULT 0,
  status VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Field Inspections Table
CREATE TABLE IF NOT EXISTS field_inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  farmer_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  inspector VARCHAR(255),
  findings TEXT,
  recommendations TEXT,
  status VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  quantity NUMERIC NOT NULL,
  unit VARCHAR(50),
  reorder_level NUMERIC,
  expiration_date DATE,
  supplier VARCHAR(255),
  batch_number VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Users Management Table
CREATE TABLE IF NOT EXISTS users_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  department VARCHAR(255),
  phone_number VARCHAR(255),
  role VARCHAR(100) NOT NULL,
  status VARCHAR(100) DEFAULT 'Active',
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(255),
  program_type VARCHAR(100),
  status VARCHAR(100) DEFAULT 'Upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add Row Level Security (RLS) policies if needed
-- For development, you might want to disable RLS or allow all operations
-- ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
-- (Repeat for all tables if you want to disable RLS during dev)
