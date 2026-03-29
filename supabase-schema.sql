-- Run this in your Supabase SQL Editor to create the necessary tables

CREATE TABLE farmers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rsbsa_id TEXT,
  name TEXT,
  birthdate DATE,
  gender TEXT,
  address TEXT,
  contact TEXT,
  farm_area_sqm NUMERIC,
  farm_type TEXT,
  livestock_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE livestock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_id TEXT,
  farmer_name TEXT,
  species TEXT,
  breed TEXT,
  color TEXT,
  weight_kg NUMERIC,
  purpose TEXT,
  age TEXT,
  sex TEXT,
  date_acquired DATE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE,
  farmer_name TEXT,
  livestock_tag TEXT,
  species TEXT,
  type TEXT,
  description TEXT,
  dosage TEXT,
  next_schedule DATE,
  remarks TEXT,
  cost NUMERIC,
  technician TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name TEXT,
  funding_source TEXT,
  item_type TEXT,
  quantity INTEGER,
  unit TEXT,
  date DATE,
  location TEXT,
  distributor_name TEXT,
  beneficiaries_count INTEGER,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE,
  farmer_name TEXT,
  location TEXT,
  inspector TEXT,
  purpose TEXT,
  findings TEXT,
  recommendations TEXT,
  farm_condition_rating INTEGER,
  next_inspection_date DATE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  message TEXT,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users_management (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  department TEXT,
  phone_number TEXT,
  role TEXT,
  status TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT,
  category TEXT,
  quantity INTEGER,
  unit TEXT,
  reorder_level INTEGER,
  expiration_date DATE,
  supplier TEXT,
  batch_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
