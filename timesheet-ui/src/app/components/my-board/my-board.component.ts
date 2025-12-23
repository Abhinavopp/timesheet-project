import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, Task, Project } from '../../services/supabase.service';

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  tasks: Task[];
}

@Component({
  selector: 'app-my-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-board.component.html',
  styleUrls: ['./my-board.component.css']
})
export class MyBoardComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  draggedTask: Task | null = null;
  draggedFromColumn: string | null = null;
  dragOverColumn: string | null = null;

  columns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', status: 'TODO', tasks: [] },
    { id: 'in_progress', title: 'In Progress', status: 'IN_PROGRESS', tasks: [] },
    { id: 'review', title: 'Review', status: 'REVIEW', tasks: [] },
    { id: 'completed', title: 'Completed', status: 'COMPLETED', tasks: [] }
  ];

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      [this.projects, this.tasks] = await Promise.all([
        this.supabaseService.getProjects(),
        this.supabaseService.getTasks()
      ]);

      this.organizeTasksIntoColumns();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  organizeTasksIntoColumns() {
    this.columns.forEach(column => {
      column.tasks = this.tasks.filter(task => task.status === column.status);
    });
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.find(p => p.id === projectId);
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  onDragStart(event: DragEvent, task: Task, columnId: string) {
    this.draggedTask = task;
    this.draggedFromColumn = columnId;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }

    const target = event.target as HTMLElement;
    setTimeout(() => {
      target.classList.add('dragging');
    }, 0);
  }

  onDragEnd(event: DragEvent) {
    const target = event.target as HTMLElement;
    target.classList.remove('dragging');
    this.dragOverColumn = null;
  }

  onDragOver(event: DragEvent, columnId: string) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverColumn = columnId;
  }

  onDragLeave(event: DragEvent, columnId: string) {
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (!target.contains(relatedTarget)) {
      if (this.dragOverColumn === columnId) {
        this.dragOverColumn = null;
      }
    }
  }

  async onDrop(event: DragEvent, targetColumnId: string) {
    event.preventDefault();
    this.dragOverColumn = null;

    if (!this.draggedTask || !this.draggedFromColumn) return;

    if (this.draggedFromColumn === targetColumnId) {
      this.draggedTask = null;
      this.draggedFromColumn = null;
      return;
    }

    const targetColumn = this.columns.find(col => col.id === targetColumnId);
    if (!targetColumn) return;

    const newStatus = targetColumn.status as 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW';

    try {
      await this.supabaseService.updateTaskStatus(this.draggedTask.id, newStatus);

      this.draggedTask.status = newStatus;

      this.organizeTasksIntoColumns();

      this.draggedTask = null;
      this.draggedFromColumn = null;
    } catch (error) {
      console.error('Error updating task status:', error);
      this.draggedTask = null;
      this.draggedFromColumn = null;
    }
  }
}
