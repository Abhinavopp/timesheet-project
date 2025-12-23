import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BsDatepickerModule, BsDatepickerConfig } from 'ngx-bootstrap/datepicker';

interface Task {
  id: string;
  name: string;
  hours: string;
  project: string;
  projectColor: string;
  allocatedDate?: string;
  workedDate?: string;
  project_id?: string;
  plannedTaskId?: string;
  assignedBy?: string;
  assignedById?: string;
  assignedTo?: string;
}

interface TaskGroup {
  name: string;
  taskCount: string;
  tasks: Task[];
  expanded?: boolean;
}

interface PlannedTaskGroup {
  project: string;
  projectColor: string;
  tasks: Task[];
}

@Component({
  selector: 'app-planner-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BsDatepickerModule],
  templateUrl: './planner-dashboard.component.html',
  styleUrls: ['./planner-dashboard.component.css']
})
export class PlannerDashboardComponent implements OnInit {
  allocatedTasks: TaskGroup[] = [];
  plannedTasks: PlannedTaskGroup[] = [];
  actualTasks: TaskGroup[] = [];
  isDraggingOver = false;
  draggedTask: Task | null = null;
  editingTaskId: string | null = null;
  editingHours: string = '';
  currentWeekStart: Date = new Date();
  userId = 'YOUR_USER_ID';
  currentDate = new Date();
  userName = 'User';
  bsValue: Date = new Date();
  bsConfig: Partial<BsDatepickerConfig>;

  loadingAllocated = false;
  loadingActual = false;
  loadingPlanned = false;
  bsModalRef?: BsModalRef;
  confirmResolve?: (value: boolean) => void;
  modalTitle: string = '';
  modalMessage: string = '';
  isModalProcessing = false;

  @ViewChild('confirmModal') confirmModal!: TemplateRef<any>;

  constructor(
    private apiService: ApiService, 
    private toastr: ToastrService,
    private modalService: BsModalService
  ) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.userId = user.id;
      this.userName = user.name || 'User';
    }

    // Configure datepicker - allow till tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    this.bsConfig = {
      dateInputFormat: 'DD MMM YYYY',
      containerClass: 'theme-green',
      showWeekNumbers: false,
      maxDate: tomorrow
    };
  }

  ngOnInit() {
    this.currentDate.setHours(0, 0, 0, 0);
    this.bsValue = new Date(this.currentDate);
    this.loadAllTasks();
  }

  // Get date string in YYYY-MM-DD format for API calls
  private getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Compare two dates (ignoring time)
  private isSameDate(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  // Format date for display
  getFormattedDate(): string {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return this.currentDate.toLocaleDateString('en-GB', options);
  }

  // Navigate to previous day
  previousDay(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 1);
    newDate.setHours(0, 0, 0, 0);
    this.currentDate = newDate;
    this.bsValue = new Date(newDate);
    this.loadAllTasks();
  }

  // Navigate to next day
  nextDay(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(this.currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);

    if (nextDate.getTime() <= tomorrow.getTime()) {
      this.currentDate = nextDate;
      this.bsValue = new Date(nextDate);
      this.loadAllTasks();
    } else {
      this.toastr.warning('Cannot select dates beyond tomorrow', 'Date Restriction');
    }
  }

  // Handle date picker change
  onDateChange(value: Date): void {
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(0, 0, 0, 0);
      this.currentDate = newDate;
      this.bsValue = new Date(newDate);
      
      console.log('Date changed to:', this.getDateString(this.currentDate));
      this.loadAllTasks();
    }
  }

  // Load all tasks for the selected date
  loadAllTasks(): void {
    const dateStr = this.getDateString(this.currentDate);
    console.log('=== Loading all tasks for date:', dateStr, '===');
    
    // Clear existing data
    this.allocatedTasks = [];
    this.plannedTasks = [];
    this.actualTasks = [];
    
    // Load tasks sequentially
    this.loadPlannedTasks();
    this.loadAllocatedTasks();
    this.loadActualTasks();
  }

  toggleGroup(section: string, groupName: string) {
    if (section === 'allocated') {
      const group = this.allocatedTasks.find(g => g.name === groupName);
      if (group) {
        group.expanded = !group.expanded;
      }
    }
  }

  onDragStart(event: DragEvent, task: Task) {
    this.draggedTask = task;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', task.id);
    }

    const target = event.target as HTMLElement;
    target.classList.add('dragging');
  }

  onDragEnd(event: DragEvent) {
    const target = event.target as HTMLElement;
    target.classList.remove('dragging');
    this.isDraggingOver = false;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.isDraggingOver = true;
  }
  private refreshActualTaskColors(): void {
    this.actualTasks.forEach(group => {
      group.tasks.forEach(task => {
        // Recalculate the color for each actual task
        const indicatorColor = this.getActualTaskIndicatorColor(task.id, task.hours);
        task.projectColor = indicatorColor;
      });
    });
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDraggingOver = false;
  
    if (!this.draggedTask) {
      return;
    }
  
    const taskAlreadyPlanned = this.plannedTasks.some(group =>
      group.tasks.some(t => t.id === this.draggedTask!.id)
    );
  
    if (taskAlreadyPlanned) {
      this.toastr.warning('This task is already in your planned list.', 'Duplicate Task');
      this.draggedTask = null;
      return;
    }
  
    let totalPlannedHours = 0;
    this.plannedTasks.forEach(group => {
      group.tasks.forEach(task => {
        const match = task.hours.match(/(\d+(\.\d+)?)/g);
        if (match) {
          totalPlannedHours += parseFloat(match[0]);
        }
      });
    });
  
    const draggedTaskHoursMatch = this.draggedTask.hours.match(/(\d+(\.\d+)?)/g);
    const draggedTaskHours = draggedTaskHoursMatch ? parseFloat(draggedTaskHoursMatch[0]) : 0;
  
    const newTotalHours = totalPlannedHours + draggedTaskHours;
  
    if (newTotalHours > 16) {
      this.toastr.error(
        `Cannot add task. Total planned hours would exceed 16 hrs. Current: ${totalPlannedHours.toFixed(1)} hrs, Available: ${(16 - totalPlannedHours).toFixed(1)} hrs`,
        'Hours Limit Exceeded'
      );
      this.draggedTask = null;
      return;
    }
  
    const newPlannedTask: Task = {
      ...this.draggedTask,
      assignedBy: this.userName,
      assignedById: this.userId,
      assignedTo: this.userName
    };
  
    try {
      await this.createPlannedTask(newPlannedTask);
      await this.loadPlannedTasks();
      
      // Refresh actual task colors after adding to planned
      this.refreshActualTaskColors();
      
      this.toastr.success('Task added to planned list successfully!', 'Success');
    } catch (error: any) {
      console.error('Error adding task to planned:', error);
      const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
      this.toastr.error(`Failed to add task: ${errorMessage}`, 'Error');
    }
  
    this.draggedTask = null;
  }
  
  
  async createPlannedTask(task: Task): Promise<any> {
    const dateStr = this.getDateString(this.currentDate);
    
    const existingTasks = this.plannedTasks.flatMap(group => 
      group.tasks.map(t => ({
        taskId: t.id,
        title: t.name,
        hours: t.hours,
        project: t.project,
        projectColor: t.projectColor,
        assignedBy: t.assignedBy || this.userName,
        assignedById: t.assignedById || this.userId,
        assignedTo: t.assignedTo || this.userName
      }))
    );
  
    const allTasks = [
      ...existingTasks,
      {
        taskId: task.id,
        title: task.name,
        hours: task.hours,
        project: task.project,
        projectColor: task.projectColor,
        assignedBy: task.assignedBy || this.userName,
        assignedById: task.assignedById || this.userId,
        assignedTo: task.assignedTo || this.userName
      }
    ];
    
    const payload = {
      userId: this.userId,
      date: dateStr,
      tasks: allTasks
    };
  
    console.log('Creating planned task:', payload);
    
    const response = await this.apiService.post('planned/', payload);
    return response;
  }

  async removeFromPlanned(taskId: string) {
    let taskToRemove: Task | null = null;
    
    for (const group of this.plannedTasks) {
      const task = group.tasks.find(t => t.id === taskId);
      if (task) {
        taskToRemove = task;
        break;
      }
    }
  
    if (!taskToRemove) {
      this.toastr.error('Unable to find task to remove.', 'Error');
      return;
    }
  
    try {
      const dateStr = this.getDateString(this.currentDate);
      
      const remainingTasks = this.plannedTasks.flatMap(group => 
        group.tasks
          .filter(t => t.id !== taskId)
          .map(t => ({
            taskId: t.id,
            title: t.name,
            hours: t.hours,
            project: t.project,
            projectColor: t.projectColor,
            assignedBy: t.assignedBy || this.userName,
            assignedById: t.assignedById || this.userId,
            assignedTo: t.assignedTo || this.userName
          }))
      );
      
      const payload = {
        userId: this.userId,
        date: dateStr,
        tasks: remainingTasks
      };
  
      await this.apiService.post('planned/', payload);
      
      this.plannedTasks.forEach(group => {
        group.tasks = group.tasks.filter(t => t.id !== taskId);
      });
      this.plannedTasks = this.plannedTasks.filter(group => group.tasks.length > 0);
      
      // Refresh actual task colors after removing from planned
      this.refreshActualTaskColors();
      
      this.toastr.success('Task removed successfully!', 'Success');
      
    } catch (error: any) {
      console.error('Error removing task:', error);
      const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
      this.toastr.error(`Failed to remove task: ${errorMessage}`, 'Error');
    }
  }

  getAllocatedHours(): string {
    return this.sumTaskHours(this.allocatedTasks);
  }

  getPlannedHours(): string {
    return this.sumPlannedHours();
  }

  private sumTaskHours(groups: TaskGroup[]): string {
    let total = 0;
    groups.forEach(group => {
      group.tasks.forEach(task => {
        const match = task.hours.match(/(\d+(\.\d+)?)/g);
        if (match) {
          total += parseFloat(match[0]);
        }
      });
    });
    return this.formatWorkedHours(total);
  }

  private sumPlannedHours(): string {
    let total = 0;
    this.plannedTasks.forEach(group => {
      group.tasks.forEach(task => {
        const match = task.hours.match(/(\d+(\.\d+)?)/g);
        if (match) {
          total += parseFloat(match[0]);
        }
      });
    });
    return this.formatWorkedHours(total);
  }

  calculateGroupHours(tasks: Task[]): string {
    let total = 0;
    tasks.forEach(task => {
      const match = task.hours.match(/(\d+(\.\d+)?)/g);
      if (match) {
        total += parseFloat(match[0]);
      }
    });
    return this.formatWorkedHours(total);
  }

  startEditingHours(taskId: string, currentHours: string) {
    let taskToEdit: Task | null = null;
    
    for (const group of this.plannedTasks) {
      const task = group.tasks.find(t => t.id === taskId);
      if (task) {
        taskToEdit = task;
        break;
      }
    }

    if (taskToEdit && taskToEdit.assignedById !== this.userId) {
      this.toastr.warning('You can only edit tasks that you created.', 'Permission Denied');
      return;
    }

    this.editingTaskId = taskId;
    const match = currentHours.match(/(\d+(\.\d+)?)/g);
    this.editingHours = match ? match[0] : '0';
  }

  async saveHours(taskId: string) {
    if (!this.editingHours || isNaN(parseFloat(this.editingHours))) {
      this.cancelEdit();
      return;
    }
  
    const newHoursValue = parseFloat(this.editingHours);
    const newHours = `${this.editingHours}hrs`;
  
    if (newHoursValue > 16) {
      this.toastr.error('Hours cannot exceed 16', 'Invalid Hours');
      return;
    }
  
    if (newHoursValue <= 0) {
      this.toastr.error('Hours must be greater than 0', 'Invalid Hours');
      return;
    }
  
    let totalPlannedHours = 0;
    let currentTaskHours = 0;
  
    this.plannedTasks.forEach(group => {
      group.tasks.forEach(task => {
        const match = task.hours.match(/(\d+(\.\d+)?)/g);
        if (match) {
          const hours = parseFloat(match[0]);
          if (task.id === taskId) {
            currentTaskHours = hours;
          } else {
            totalPlannedHours += hours;
          }
        }
      });
    });
  
    const newTotalHours = totalPlannedHours + newHoursValue;
  
    if (newTotalHours > 16) {
      this.toastr.error(
        `Total planned hours cannot exceed 16. Current total (excluding this task): ${totalPlannedHours.toFixed(1)} hrs. Maximum you can set: ${(16 - totalPlannedHours).toFixed(1)} hrs`,
        'Hours Limit Exceeded'
      );
      return;
    }
  
    if (newTotalHours >= 8 && newTotalHours <= 16) {
      const proceed = await this.showConfirmModal(
        'Confirm Hours Update',
        `Total planned hours will be ${newTotalHours.toFixed(1)} hrs. Do you want to continue?`
      );
      
      if (!proceed) {
        this.cancelEdit();
        return;
      }
    }
  
    let taskToUpdate: Task | null = null;
    let groupIndex = -1;
    let taskIndex = -1;
  
    for (let i = 0; i < this.plannedTasks.length; i++) {
      const idx = this.plannedTasks[i].tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        taskToUpdate = this.plannedTasks[i].tasks[idx];
        groupIndex = i;
        taskIndex = idx;
        break;
      }
    }
  
    if (!taskToUpdate || !taskToUpdate.plannedTaskId) {
      this.toastr.error('Unable to find task to update.', 'Error');
      this.cancelEdit();
      return;
    }
  
    try {
      const payload = {
        taskId: taskToUpdate.id,
        title: taskToUpdate.name,
        plannedHours: newHours,
        projectName: taskToUpdate.project,
        projectColor: taskToUpdate.projectColor,
        assignedBy: taskToUpdate.assignedBy || this.userName,
        assignedById: taskToUpdate.assignedById || this.userId,
        assignedTo: taskToUpdate.assignedTo || this.userName
      };
      
      await this.apiService.put(`planned/${taskToUpdate.plannedTaskId}`, payload);
  
      this.plannedTasks[groupIndex].tasks[taskIndex].hours = newHours;
      
      // Refresh actual task colors after editing hours
      this.refreshActualTaskColors();
      
      this.toastr.success('Task hours updated successfully!', 'Updated');
      this.cancelEdit();
    } catch (error) {
      console.error('Error updating hours:', error);
      this.toastr.error('Failed to update hours. Please try again.', 'Error');
    }
  }

  showConfirmModal(title: string, message: string): Promise<boolean> {
    if (this.isModalProcessing || this.bsModalRef) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.isModalProcessing = true;
      this.modalTitle = title;
      this.modalMessage = message;
      this.confirmResolve = resolve;

      this.bsModalRef = this.modalService.show(this.confirmModal, {
        class: 'modal-dialog-centered',
        backdrop: 'static',
        keyboard: false
      });

      this.bsModalRef.onHidden?.subscribe(() => {
        this.cleanupModal();
      });
    });
  }

  onConfirmModal(): void {
    if (!this.isModalProcessing || !this.confirmResolve) {
      return;
    }

    const resolve = this.confirmResolve;
    this.confirmResolve = undefined;
    
    this.bsModalRef?.hide();
    
    setTimeout(() => {
      resolve(true);
    }, 100);
  }

  onCancelModal(): void {
    if (!this.isModalProcessing || !this.confirmResolve) {
      return;
    }

    const resolve = this.confirmResolve;
    this.confirmResolve = undefined;
    
    this.bsModalRef?.hide();
    
    setTimeout(() => {
      resolve(false);
    }, 100);
  }

  private cleanupModal(): void {
    this.isModalProcessing = false;
    this.confirmResolve = undefined;
    this.bsModalRef = undefined;
    this.modalTitle = '';
    this.modalMessage = '';
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editingHours = '';
  }

  handleKeyPress(event: KeyboardEvent, taskId: string) {
    if (event.key === 'Enter') {
      this.saveHours(taskId);
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  async loadPlannedTasks() {
    try {
      this.loadingPlanned = true;
      this.plannedTasks = [];

      const dateStr = this.getDateString(this.currentDate);
      console.log('Loading PLANNED tasks for:', dateStr);

      const params = { userId: this.userId, date: dateStr };
      const response: any[] = await this.apiService.get('planned/', params);

      console.log('Planned API response:', response);

      if (!response || !Array.isArray(response) || response.length === 0) {
        console.log('No planned tasks found');
        return;
      }

      const plannedMap = new Map<string, Task[]>();

      response.forEach((task: any) => {
        console.log('Processing planned task:', task);
        
        const plannedTask: Task = {
          id: task.taskId,
          name: task.title,
          hours: task.plannedHours || task.hours || '0hrs',
          project: task.projectName || task.project || 'General',
          projectColor: task.projectColor || '#3b82f6',
          plannedTaskId: task._id,
          assignedBy: task.assignedBy,
          assignedById: task.assignedById,
          assignedTo: task.assignedTo
        };

        if (!plannedMap.has(plannedTask.project)) {
          plannedMap.set(plannedTask.project, []);
        }
        plannedMap.get(plannedTask.project)!.push(plannedTask);
      });

      this.plannedTasks = Array.from(plannedMap.entries()).map(([project, tasks]) => ({
        project,
        projectColor: tasks[0].projectColor,
        tasks
      }));

      console.log('Planned tasks loaded:', this.plannedTasks.length, 'groups');
    } catch (err) {
      console.error('Error loading planned tasks:', err);
      this.plannedTasks = [];
    } finally {
      this.loadingPlanned = false;
    }
  }

  async loadAllocatedTasks() {
    try {
      this.loadingAllocated = true;
      this.allocatedTasks = [];

      const dateStr = this.getDateString(this.currentDate);
      console.log('Loading ALLOCATED tasks for:', dateStr);

      const params = { userId: this.userId, start: dateStr, end: dateStr };
      const entries: any[] = await this.apiService.get<any[]>('planner/calendardetail', params);

      console.log('Allocated API response:', entries?.length || 0, 'entries');

      if (!entries || entries.length === 0) {
        console.log('No calendar entries found');
        return;
      }

      const allocatedMap = new Map<string, Task[]>();

      entries.forEach((entry: any) => {
        if (!entry.allocation || entry.allocation.length === 0) {
          return;
        }

        console.log('Processing entry:', entry.taskId, 'with', entry.allocation.length, 'allocations');

        entry.allocation.forEach((alloc: any) => {
          const allocDate = alloc.allocatedDate || alloc.date;
          console.log('Checking allocation:', {
            taskId: entry.taskId,
            allocDate: allocDate,
            targetDate: dateStr,
            match: this.isSameDate(allocDate, this.currentDate)
          });

          if (!this.isSameDate(allocDate, this.currentDate)) {
            return;
          }

          const allocHrs = Number(alloc.allocatedHrs || 0);
          if (allocHrs <= 0) {
            console.log('Skipping - no hours allocated');
            return;
          }

          const task: Task = {
            id: entry.taskId,
            name: entry.title || entry.mainTaskTitle || 'Unnamed Task',
            hours: this.formatWorkedHours(allocHrs),
            project: entry.project?.name || 'General',
            projectColor: '#3b82f6',
            allocatedDate: allocDate,
            project_id: entry.project?.id || ''
          };

          console.log('Adding allocated task:', task.name, task.hours);

          if (!allocatedMap.has(task.project)) {
            allocatedMap.set(task.project, []);
          }
          allocatedMap.get(task.project)!.push(task);
        });
      });

      this.allocatedTasks = Array.from(allocatedMap.entries()).map(([project, tasks]) => ({
        name: project,
        taskCount: `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
        expanded: true,
        tasks
      }));

      console.log('Allocated tasks loaded:', this.allocatedTasks.length, 'groups,', 
        this.allocatedTasks.reduce((sum, g) => sum + g.tasks.length, 0), 'total tasks');

    } catch (err) {
      console.error('Error loading allocated tasks:', err);
      this.allocatedTasks = [];
    } finally {
      this.loadingAllocated = false;
    }
  }

  // Get the indicator color for an actual task based on comparison with planned tasks
  getActualTaskIndicatorColor(taskId: string, actualHours: string): string {
    // Find if this task exists in planned tasks
    let plannedTask: Task | null = null;
    
    for (const group of this.plannedTasks) {
      const found = group.tasks.find(t => t.id === taskId);
      if (found) {
        plannedTask = found;
        break;
      }
    }

    // Task not in planned list - show blue
    if (!plannedTask) {
      return '#3b82f6'; // Blue
    }

    // Extract hours from string format (e.g., "5 hrs" or "5 hrs 30 min")
    const getHoursValue = (hoursStr: string): number => {
      const match = hoursStr.match(/(\d+(\.\d+)?)/g);
      if (!match) return 0;
      
      const hours = parseFloat(match[0]);
      const minutes = match.length > 1 ? parseFloat(match[1]) : 0;
      return hours + (minutes / 60);
    };

    const plannedHours = getHoursValue(plannedTask.hours);
    const actualHoursValue = getHoursValue(actualHours);

    // Compare hours
    if (Math.abs(plannedHours - actualHoursValue) < 0.01) {
      // Hours match - show green
      return '#10b981'; // Green
    } else if (actualHoursValue > plannedHours) {
      // Exceeded - show red
      return '#ef4444'; // Red
    } else {
      // Less than planned - show yellow/orange
      return '#f59e0b'; // Orange
    }
  }

  async loadActualTasks() {
    try {
      this.loadingActual = true;
      this.actualTasks = [];

      const dateStr = this.getDateString(this.currentDate);
      console.log('Loading ACTUAL tasks for:', dateStr);

      const params = { userId: this.userId, start: dateStr, end: dateStr };
      const entries: any[] = await this.apiService.get<any[]>('planner/calendardetail', params);

      console.log('Actual API response:', entries?.length || 0, 'entries');

      if (!entries || entries.length === 0) {
        console.log('No calendar entries found');
        return;
      }

      const actualMap = new Map<string, Task[]>();

      entries.forEach((entry: any) => {
        if (!entry.time || entry.time.length === 0) {
          return;
        }

        console.log('Processing entry:', entry.taskId, 'with', entry.time.length, 'time entries');

        entry.time.forEach((timeEntry: any) => {
          const workedDate = timeEntry.workedDate;
          console.log('Checking time entry:', {
            taskId: entry.taskId,
            workedDate: workedDate,
            targetDate: dateStr,
            match: this.isSameDate(workedDate, this.currentDate)
          });

          if (!this.isSameDate(workedDate, this.currentDate)) {
            return;
          }

          const workedHrs = Number(timeEntry.workedhours || 0);
          if (workedHrs <= 0) {
            console.log('Skipping - no hours worked');
            return;
          }

          const formattedHours = this.formatWorkedHours(workedHrs);
          const indicatorColor = this.getActualTaskIndicatorColor(entry.taskId, formattedHours);

          const task: Task = {
            id: entry.taskId,
            name: entry.title || entry.mainTaskTitle || 'Unnamed Task',
            hours: formattedHours,
            project: entry.project?.name || 'General',
            projectColor: indicatorColor,
            workedDate: workedDate,
            project_id: entry.project?.id || ''
          };

          console.log('Adding actual task:', task.name, task.hours, 'indicator:', indicatorColor);

          if (!actualMap.has(task.project)) {
            actualMap.set(task.project, []);
          }
          actualMap.get(task.project)!.push(task);
        });
      });

      this.actualTasks = Array.from(actualMap.entries()).map(([project, tasks]) => ({
        name: project,
        taskCount: `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
        expanded: true,
        tasks
      }));

      console.log('Actual tasks loaded:', this.actualTasks.length, 'groups,', 
        this.actualTasks.reduce((sum, g) => sum + g.tasks.length, 0), 'total tasks');

    } catch (err) {
      console.error('Error loading actual tasks:', err);
      this.actualTasks = [];
    } finally {
      this.loadingActual = false;
    }
  }

  getActualHours(): string {
    if (!this.actualTasks || this.actualTasks.length === 0) return '0 hrs';
  
    let total = 0;
  
    this.actualTasks.forEach(group => {
      group.tasks.forEach((task: any) => {
        const match = task.hours.match(/(\d+(\.\d+)?)/g);
        if (match) {
          total += parseFloat(match[0]);
        }
      });
    });
  
    return this.formatWorkedHours(total);
  }
  
  formatWorkedHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m ? `${h} hrs ${m} min` : `${h} hrs`;
  }
}