/*
  # Add project fields for grid and list view

  1. Changes
    - Add `status` column (TEXT) - values: 'ACTIVE', 'ARCHIVED'
    - Add `company` column (TEXT) - company/organization name
    - Add `description` column (TEXT) - project description
    
  2. Data Migration
    - Set default status to 'ACTIVE' for existing projects
    - Set default company to 'Sci-Tech' for existing projects
    - Add sample descriptions for existing projects
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'status'
  ) THEN
    ALTER TABLE projects ADD COLUMN status TEXT DEFAULT 'ACTIVE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'company'
  ) THEN
    ALTER TABLE projects ADD COLUMN company TEXT DEFAULT 'Sci-Tech';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'description'
  ) THEN
    ALTER TABLE projects ADD COLUMN description TEXT;
  END IF;
END $$;

-- Update existing projects with sample data
UPDATE projects
SET 
  status = 'ACTIVE',
  company = 'Sci-Tech',
  description = CASE 
    WHEN name = 'Timesheet management' THEN 'A design is the concept or proposal for an object, process, or system. The word design refers to something that is or has been intentionally'
    WHEN name = 'Creative Request' THEN 'This creative request template makes it easy to streamline your process for managing incoming requests, prioritizing and assigning work'
    ELSE 'A design is the concept or proposal for an object, process, or system. The word design refers to something that is or has been intentionally'
  END
WHERE status IS NULL OR description IS NULL;
