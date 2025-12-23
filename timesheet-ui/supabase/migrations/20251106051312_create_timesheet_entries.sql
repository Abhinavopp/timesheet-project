/*
  # Create Timesheet Entries Schema

  1. New Tables
    - `timesheet_entries`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `date` (date)
      - `hours` (numeric)
      - `minutes` (numeric)
      - `user_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on timesheet_entries table
    - Add policies for public access (for demo purposes)
    
  3. Indexes
    - Add index on date and task_id for efficient querying
*/

CREATE TABLE IF NOT EXISTS timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours numeric DEFAULT 0,
  minutes numeric DEFAULT 0,
  user_id text DEFAULT 'sriramk',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to timesheet_entries"
  ON timesheet_entries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to timesheet_entries"
  ON timesheet_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to timesheet_entries"
  ON timesheet_entries FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to timesheet_entries"
  ON timesheet_entries FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_date ON timesheet_entries(date);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_task_id ON timesheet_entries(task_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timesheet_entries_task_date 
  ON timesheet_entries(task_id, date);
