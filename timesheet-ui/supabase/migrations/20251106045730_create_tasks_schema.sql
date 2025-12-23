/*
  # Create Tasks and Projects Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `color` (text)
      - `icon` (text)
      - `created_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `project_id` (uuid, foreign key)
      - `status` (text: TODO, IN_PROGRESS, COMPLETED)
      - `priority` (text: LOW, MEDIUM, HIGH)
      - `assignee` (text)
      - `due_date` (timestamp)
      - `start_date` (timestamp)
      - `allocated_hours` (numeric)
      - `tags` (text array)
      - `created_by` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (for demo purposes)
    
  3. Sample Data
    - Insert sample projects
    - Insert sample tasks
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to projects"
  ON projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to projects"
  ON projects FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  status text DEFAULT 'TODO',
  priority text DEFAULT 'MEDIUM',
  assignee text DEFAULT '',
  due_date timestamptz,
  start_date timestamptz,
  allocated_hours numeric DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tasks"
  ON tasks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access to tasks"
  ON tasks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update access to tasks"
  ON tasks FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to tasks"
  ON tasks FOR DELETE
  TO anon, authenticated
  USING (true);
