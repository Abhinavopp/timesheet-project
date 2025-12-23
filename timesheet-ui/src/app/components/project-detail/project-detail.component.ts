import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService, Project, Task } from '../../services/supabase.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  tasks: Task[] = [];
  activeTab = 'list';
  statusFilter = 'all';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      await this.loadProjectData(projectId);
    }
  }

  async loadProjectData(projectId: string) {
    try {
      const projects = await this.supabaseService.getProjects();
      this.project = projects.find(p => p.id === projectId) || null;

      const allTasks = await this.supabaseService.getTasks();
      this.tasks = allTasks.filter(t => t.project_id === projectId);

      this.loading = false;
    } catch (error) {
      console.error('Error loading project:', error);
      this.loading = false;
    }
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  setStatusFilter(status: string) {
    this.statusFilter = status;
  }

  getFilteredTasks(): Task[] {
    if (this.statusFilter === 'all') {
      return this.tasks;
    }
    return this.tasks.filter(task => task.status.toLowerCase() === this.statusFilter.toLowerCase());
  }

  getStatusClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'status-completed';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'TODO':
        return 'status-todo';
      case 'REVIEW':
        return 'status-review';
      default:
        return 'status-todo';
    }
  }

  getPriorityIcon(priority: string): string {
    return priority === 'HIGH' ? '🔴' : priority === 'MEDIUM' ? '🟡' : '⚪';
  }

  formatDate(date: string | null): string {
    if (!date) return 'No date range';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateRange(startDate: string | null, dueDate: string | null): string {
    if (!startDate && !dueDate) return 'No date range';
    if (startDate && dueDate) {
      const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${start} → ${end}`;
    }
    if (dueDate) {
      return this.formatDate(dueDate);
    }
    return 'No date range';
  }
}
