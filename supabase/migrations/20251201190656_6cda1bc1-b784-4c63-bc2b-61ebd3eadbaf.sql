-- Fix security warnings by setting search_path for functions using CREATE OR REPLACE

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION check_image_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION check_attendance_duplicate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;