import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service'; 

interface Task {
  id: string;
  title: string;
  project_id: string;
  allocated_hours?: number;
  project?: { name?: string; id?: string };
}

interface Project {
  id: string;
  name: string;
  isCollapsed?: boolean; // Add collapse state
}

interface TimesheetEntry {
  id?: string;
  task_id: string;
  date: string;
  hours: number;
  minutes: number;
  user_id: string;
}

interface DayColumn {
  dayName: string;
  date: Date;
  dateNum: number;
  month: string;
  isToday: boolean;
  isFutureDate: boolean; // Add this property
}

@Component({
  selector: 'app-my-timesheet',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './my-timesheet.component.html',
  styleUrls: ['./my-timesheet.component.css']
})
export class MyTimesheetComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  timesheetEntries: Map<string, TimesheetEntry> = new Map();

  currentWeekStart: Date = new Date();
  weekDays: DayColumn[] = [];
  weekRange: string = '';

  editingCell: string | null = null;
  tempHours: { [key: string]: number } = {};
  tempMinutes: { [key: string]: number } = {};

  allocatedHours: { [key: string]: number } = {};
  allocatedMinutes: { [key: string]: number } = {};
  actualHours: { [key: string]: number } = {};
  actualMinutes: { [key: string]: number } = {};

  private userId = ''; 

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef, private apiService: ApiService) {}

  async ngOnInit() {
    this.setCurrentWeek();

    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.userId = user.id;
    }

    await this.loadData();
    this.loadTimesheetEntries();
  }

  setCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);

    this.currentWeekStart = monday;
    this.generateWeekDays();
    this.updateWeekRange();
  }

  generateWeekDays() {
    this.weekDays = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      this.weekDays.push({
        dayName: dayNames[i],
        date: date,
        dateNum: date.getDate(),
        month: monthNames[date.getMonth()],
        isToday: date.getTime() === today.getTime(),
        isFutureDate: date.getTime() > today.getTime() // Check if date is in future
      });
    }
  }

  updateWeekRange() {
    const start = new Date(this.currentWeekStart);
    const end = new Date(this.currentWeekStart);
    end.setDate(end.getDate() + 6);
  
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    this.weekRange = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  
    this.weekDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
  
      this.weekDays.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        dateNum: date.getDate(),
        isToday: date.toDateString() === today.toDateString(),
        isFutureDate: date.getTime() > today.getTime() // Check if date is in future
      });
    }
  }

  goToThisWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    this.currentWeekStart = new Date(today.setDate(diff));
  
    this.updateWeekRange();
    this.loadData();
  }

  isCurrentWeek() {
    const today = new Date();
    const weekStart = new Date(this.currentWeekStart);
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return today >= weekStart && today <= weekEnd;
  }

  previousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.updateWeekRange();
    this.loadData();
  }
  
  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.updateWeekRange();
    this.loadData(); 
  }

  thisWeek() {
    this.setCurrentWeek();
    this.loadTimesheetEntries();
  }

  // Add method to check if date is editable
  isDateEditable(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() <= today.getTime();
  }

  // Add method to toggle project collapse
  toggleProject(projectId: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.isCollapsed = !project.isCollapsed;
    }
  }

  // Check if project is collapsed
  isProjectCollapsed(projectId: string): boolean {
    const project = this.projects.find(p => p.id === projectId);
    return project?.isCollapsed || false;
  }

  async loadData() {
    try {
      const url = `/tasks/${this.userId}`;
      const tasksResponse: any[] = await this.apiService.get<any[]>(url);
      
      const weekStart = new Date(this.currentWeekStart);
      const weekEnd = new Date(this.currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
  
      const projectsMap = new Map<string, Project>();
      const filteredTasks: Task[] = [];
  
      for (const task of tasksResponse) {
        const projectId = task.project?.id || '';
        const projectName = task.project?.name || '';
  
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
  
        if (startDate <= weekEnd && endDate >= weekStart) {
          if (projectId && !projectsMap.has(projectId)) {
            projectsMap.set(projectId, { 
              id: projectId, 
              name: projectName,
              isCollapsed: true // Initialize collapse state
            });
          }
  
          filteredTasks.push({
            id: task._id,
            title: task.title,
            project_id: projectId,
            allocated_hours: task.allocatedHours,
            project: { id: projectId, name: projectName }
          });
        }
      }
  
      this.projects = Array.from(projectsMap.values());
      this.tasks = filteredTasks;

      await this.loadTimesheetEntries();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
  
  async loadTimesheetEntries() {
    try {
      const startDate = this.formatDate(this.currentWeekStart);
      const endDate = new Date(this.currentWeekStart);
      endDate.setDate(this.currentWeekStart.getDate() + 6);
      const endDateStr = this.formatDate(endDate);
  
      const url = `/planner/calendardetail/?userId=${this.userId}&start=${startDate}&end=${endDateStr}`;
      const data: any[] = await this.apiService.get<any[]>(url);
  
      this.timesheetEntries.clear();
  
      (data ?? []).forEach((item) => {
        const taskId = item.taskId;
  
        if (item.time && item.time.length > 0) {
          item.time.forEach((t: any) => {
            const dateStr = t.workedDate ? t.workedDate.split('T')[0] : null;
            if (dateStr) {
              const key = `${taskId}_${dateStr}`;
        
              let hours = t.workedhours ?? t.manualhours ?? 0;
        
              if (hours > 24) {
                hours = hours / 60;
              }
        
              this.timesheetEntries.set(key, {
                task_id: taskId,
                date: dateStr,
                hours,
                minutes: 0,
                user_id: this.userId,
              });
            }
          });
        }
  
        if (item.allocation && item.allocation.length > 0) {
          item.allocation.forEach((a: any) => {
            const dateStr = a.date;
            if (dateStr) {
              const key = `${taskId}_${dateStr}`;
  
              let hours = a.allocatedHrs || 0;
              if (hours > 24) {
                hours = hours / 60;
              }
  
              if (!this.timesheetEntries.has(key)) {
                this.timesheetEntries.set(key, {
                  task_id: taskId,
                  date: dateStr,
                  hours,
                  minutes: 0,
                  user_id: this.userId,
                });
              }
            }
          });
        }
      });
  
      localStorage.setItem(
        'timesheetEntries',
        JSON.stringify([...this.timesheetEntries])
      );
  
      console.log('Timesheet entries loaded:', this.timesheetEntries);
    } catch (error) {
      console.error('Error loading timesheet entries:', error);
    }
  }

  get tasksByProject() {
    const projectMap = new Map<string, Task[]>();
    this.projects.forEach(project => {
      const projectTasks = this.tasks.filter(t => t.project_id === project.id);
      if (projectTasks.length > 0) {
        projectMap.set(project.id, projectTasks);
      }
    });
    return projectMap;
  }

  getTimeEntry(taskId: string, date: Date): TimesheetEntry | null {
    const dateStr = this.formatDate(date);
    const key = `${taskId}_${dateStr}`;
    return this.timesheetEntries.get(key) || null;
  }

  getDisplayTime(taskId: string, date: Date): string {
    const key = this.getCellKey(taskId, date);
    const entry = this.timesheetEntries.get(key);
  
    if (entry && (entry.hours > 0 || entry.minutes > 0)) {
      const totalHours = entry.hours + entry.minutes / 60;
      return this.formatHours(totalHours);
    }
    return '';
  }
  
  startEditing(taskId: string, date: Date) {
    // Check if date is editable before opening editor
    if (!this.isDateEditable(date)) {
      return;
    }

    if (this.editingCell) return;
  
    const key = this.getCellKey(taskId, date);
    this.editingCell = key;
  
    const entry = this.getTimeEntry(taskId, date);
    this.tempHours[key] = entry?.hours || 0;
    this.tempMinutes[key] = entry?.minutes || 0;
  }

  cancelEditing() {
    this.editingCell = null;
  }
  
  async saveTimeEntry(taskId: string, date: Date) {
    const key = this.getCellKey(taskId, date);
  
    const allocatedHrs = this.allocatedHours[key] || 0;
    const allocatedMins = this.allocatedMinutes[key] || 0;
    const allocatedTotalMinutes = allocatedHrs * 60 + allocatedMins;
    const allocatedHoursFinal = allocatedTotalMinutes / 60;
  
    const actualHrs = this.actualHours[key] || 0;
    const actualMins = this.actualMinutes[key] || 0;
    const actualTotalMinutes = actualHrs * 60 + actualMins;
    const actualHoursFinal = actualTotalMinutes / 60;
  
    try {
      const allocatedPayload = [
        {
          taskId,
          subTaskId: null,
          isParent: true,
          userId: this.userId,
          estimatedTime: 0,
          allocation: [
            {
              allocatedHrs: allocatedHoursFinal,
              date: this.formatDate(date),
              allocatedDate: this.formatDate(date),
            },
          ],
          title: '',
          startDate: this.formatDate(date),
          endDate: this.formatDate(date),
          allocatedHours: allocatedHoursFinal,
          assignerId: this.userId,
        },
      ];
  
      const allocatedResponse = await this.apiService.post<any>('/planner/create/scheduled/', allocatedPayload);
      const scheduledId = allocatedResponse?.[0]?._id || allocatedResponse?._id;
  
      const task = this.tasks.find((t) => t.id === taskId);
      const projectId = task?.project?.id || '';
      const taskTitle = task?.title || '';
  
      const actualPayload = {
        taskId,
        taskTitle,
        userId: this.userId,
        projectId,
        teamId: '',
        displayTeamName: '',
        roleId: '',
        clients: [],
        tags: [],
        workFrom: 'office',
        workedhours: actualHoursFinal,
        workedDate: this.formatDate(date),
        status: 'active',
        description: '',
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        leave: 0,
        removed: 0,
        approved: 'New',
        approverId: '',
        approvedDate: new Date().toISOString(),
        approvalComment: '',
        taskTime: [{ startTime: null, isStart: false }],
        systemhours: 0,
        manualhours: actualHoursFinal,
        subTaskId: null,
        sheduledTaskId: scheduledId,
        dispalyTeamName: '',
      };
  
      const actualResponse = await this.apiService.post<any>('/timeEntry/', actualPayload);
    
      this.timesheetEntries.set(key, {
        task_id: taskId,
        date: this.formatDate(date),
        hours: actualHrs,
        minutes: actualMins,
        id: actualResponse._id,
        user_id: this.userId,
      });
  
      localStorage.setItem(
        'timesheetEntries',
        JSON.stringify(Array.from(this.timesheetEntries.entries()))
      );
  
      this.cdRef.detectChanges?.();
      this.cancelEditing();
  
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  }
  
  convertTo24Hour(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`;
  }

  isEditing(taskId: string, date: Date): boolean {
    const dateStr = this.formatDate(date);
    const key = `${taskId}_${dateStr}`;
    return this.editingCell === key;
  }

  getCellKey(taskId: string, date: Date): string {
    const dateStr = this.formatDate(date);
    return `${taskId}_${dateStr}`;
  }

  getDayTotal(date: Date): number {
    let total = 0;
    this.tasks.forEach(task => {
      const entry = this.getTimeEntry(task.id, date);
      if (entry) total += entry.hours + (entry.minutes / 60);
    });
    return total;
  }

  getWeekTotal(): number {
    return this.weekDays.reduce((sum, d) => sum + this.getDayTotal(d.date), 0);
  }

  getTaskWeekTotal(taskId: string): number {
    return this.weekDays.reduce((sum, d) => {
      const entry = this.getTimeEntry(taskId, d.date);
      return sum + (entry ? entry.hours + (entry.minutes / 60) : 0);
    }, 0);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
}