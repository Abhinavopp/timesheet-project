import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, Task, Project } from '../../services/supabase.service';

interface TimelineDay {
  dayName: string;
  date: Date;
  dateNum: number;
  isToday: boolean;
}

@Component({
  selector: 'app-milestone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './milestone.component.html',
  styleUrls: ['./milestone.component.css']
})
export class MilestoneComponent implements OnInit {
  projects: Project[] = [];
  tasks: Task[] = [];
  timelineDays: TimelineDay[] = [];
  weekRange: string = '';
  currentWeekStart: Date = new Date();

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    this.setCurrentWeek();
    await this.loadData();
  }

  setCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const thursday = new Date(today);
    thursday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -3 : 4));
    thursday.setHours(0, 0, 0, 0);

    this.currentWeekStart = thursday;
    this.generateTimelineDays();
    this.updateWeekRange();
  }

  generateTimelineDays() {
    this.timelineDays = [];
    const dayNames = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      this.timelineDays.push({
        dayName: dayNames[i],
        date: date,
        dateNum: date.getDate(),
        isToday: date.getTime() === today.getTime()
      });
    }
  }

  updateWeekRange() {
    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(this.currentWeekStart.getDate() + 13);

    const startDay = this.currentWeekStart.getDate();
    const endDay = endDate.getDate();

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = monthNames[this.currentWeekStart.getMonth()];
    const endMonth = monthNames[endDate.getMonth()];

    if (startMonth === endMonth) {
      this.weekRange = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endDate.getFullYear()}`;
    } else {
      this.weekRange = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${endDate.getFullYear()}`;
    }
  }

  previousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 14);
    this.generateTimelineDays();
    this.updateWeekRange();
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 14);
    this.generateTimelineDays();
    this.updateWeekRange();
  }

  async loadData() {
    try {
      [this.projects, this.tasks] = await Promise.all([
        this.supabaseService.getProjects(),
        this.supabaseService.getTasks()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  getProjectTasks(projectId: string): Task[] {
    return this.tasks.filter(t => t.project_id === projectId);
  }

  getTaskCount(projectId: string): number {
    return this.getProjectTasks(projectId).length;
  }
}
