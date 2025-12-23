import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

interface User {
  id: string;
  name: string;
  avatar: string;
  totalHours: number;
  availableHours: number;
  availability: number;
}

interface DayColumn {
  dayName: string;
  date: Date;
  dateNum: number;
  isToday: boolean;
}

@Component({
  selector: 'app-workload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workload.component.html',
  styleUrls: ['./workload.component.css']
})
export class WorkloadComponent implements OnInit {
  users: User[] = [
    {
      id: '1',
      name: 'John Suryaprakash',
      avatar: 'JS',
      totalHours: 30.4,
      availableHours: 40,
      availability: 34
    },
    {
      id: '2',
      name: 'kathiresan P',
      avatar: 'K',
      totalHours: 30.4,
      availableHours: 40,
      availability: 34
    },
    {
      id: '3',
      name: 'sriramk',
      avatar: 'S',
      totalHours: 33.34,
      availableHours: 40,
      availability: 16.1
    }
  ];

  weekDays: DayColumn[] = [];
  weekRange: string = '';
  currentWeekStart: Date = new Date();

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    this.setCurrentWeek();
  }

  setCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const wednesday = new Date(today);
    wednesday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -4 : 3));
    wednesday.setHours(0, 0, 0, 0);

    this.currentWeekStart = wednesday;
    this.generateWeekDays();
    this.updateWeekRange();
  }

  generateWeekDays() {
    this.weekDays = [];
    const dayNames = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      this.weekDays.push({
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
    this.generateWeekDays();
    this.updateWeekRange();
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 14);
    this.generateWeekDays();
    this.updateWeekRange();
  }

  getAvailabilityClass(availability: number): string {
    if (availability <= 20) return 'low';
    if (availability <= 40) return 'medium';
    return 'high';
  }

  getAvatarColor(index: number): string {
    const colors = ['#f59e0b', '#06b6d4', '#eab308'];
    return colors[index % colors.length];
  }
}
