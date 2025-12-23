import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  description?: string;
  company?: string;
  status?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  project_id: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee: string;
  due_date: string | null;
  start_date: string | null;
  allocated_hours: number;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Project;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://heuzlvaurlyfafsuaxir.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldXpsdmF1cmx5ZmFmc3VheGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MDM5MTYsImV4cCI6MjA3Nzk3OTkxNn0.vt42-D3LQdUjnMAz1ou4znngU2HIATBoM-5QMVD_6A4'
    );
  }

  async getProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getTasks(): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*, project:projects(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert([{
        ...task,
        updated_at: new Date().toISOString()
      }])
      .select('*, project:projects(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, project:projects(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('tasks')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  getAuthStateChange() {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      return { event, session };
    });
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/my-work`
      }
    });

    if (error) throw error;
    return data;
  }
}
