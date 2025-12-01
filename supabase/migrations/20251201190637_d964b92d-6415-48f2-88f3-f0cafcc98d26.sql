-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'teacher');

-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL UNIQUE,
  subject_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert 5 subjects
INSERT INTO subjects (subject_name, subject_code) VALUES
  ('Mathematics', 'maths'),
  ('Data Structures and Algorithms', 'dsa'),
  ('Logic Design and Computer Organization', 'ldco'),
  ('Operating Systems', 'os'),
  ('Basket Course', 'basket');

-- Create profiles table for additional user data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  roll_number TEXT,
  subject_id UUID REFERENCES subjects(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create teachers with fixed credentials
-- Note: Passwords will be hashed by Supabase Auth
-- Teachers: maths/Maths@123, dsa/Dsa@123, ldco/Ldco@123, os/Os@123, basket/Basket@123

-- Create student_images table
CREATE TABLE student_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  encoding FLOAT8[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  marked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, subject_id, marked_at)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for subjects (public read)
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for student_images
CREATE POLICY "Students can view their own images"
  ON student_images FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own images"
  ON student_images FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete their own images"
  ON student_images FOR DELETE
  USING (auth.uid() = student_id);

-- RLS Policies for attendance
CREATE POLICY "Students can view their own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view attendance for their subject"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND profiles.subject_id = attendance.subject_id
    )
  );

CREATE POLICY "System can insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, roll_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    NEW.raw_user_meta_data->>'roll_number'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to check image count limit
CREATE OR REPLACE FUNCTION check_image_limit()
RETURNS TRIGGER AS $$
DECLARE
  image_count INT;
BEGIN
  SELECT COUNT(*) INTO image_count
  FROM student_images
  WHERE student_id = NEW.student_id;
  
  IF image_count >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 images allowed per student';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce image limit
CREATE TRIGGER enforce_image_limit
  BEFORE INSERT ON student_images
  FOR EACH ROW
  EXECUTE FUNCTION check_image_limit();

-- Function to prevent duplicate attendance within 2 minutes
CREATE OR REPLACE FUNCTION check_attendance_duplicate()
RETURNS TRIGGER AS $$
DECLARE
  last_attendance TIMESTAMPTZ;
BEGIN
  SELECT MAX(marked_at) INTO last_attendance
  FROM attendance
  WHERE student_id = NEW.student_id
  AND subject_id = NEW.subject_id
  AND marked_at > NOW() - INTERVAL '2 minutes';
  
  IF last_attendance IS NOT NULL THEN
    RAISE EXCEPTION 'Attendance already marked within last 2 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent duplicate attendance
CREATE TRIGGER prevent_duplicate_attendance
  BEFORE INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION check_attendance_duplicate();

-- Create storage bucket for student images
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student photos
CREATE POLICY "Students can upload their own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Students can view their own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "System can access all photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-photos');
