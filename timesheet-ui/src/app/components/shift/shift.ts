import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

// Shift interface for basic shift data
export interface Shift {
  _id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  lunch: boolean;
  lunchStartTime: string;
  lunchEndTime: string;
  break: boolean;
  breakStartTime: string;
  breakEndTime: string;
}

// Team interface
interface Team {
  _id: string;
  name: string;
  displayName: string;
  role: string;
}

// User interface
interface User {
  userId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  userImage: string;
  team: Team[];
  startDate: string;
  endDate: string | null;
  isStatus: string;
}

// Shift with users interface
interface ShiftWithUsers {
  shift_id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  lunch: string;
  lunchStartTime: string;
  lunchEndTime: string;
  break: string;
  breakStartTime: string;
  breakEndTime: string;
  users: User[];
}

@Component({
  selector: 'app-shift',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift.html',
  styleUrl: './shift.css'
})
export class Shift implements OnInit {
  shifts: Shift[] = [];
  shiftsWithUsers: ShiftWithUsers[] = [];
  loading = false;
  error = '';
  imageBaseUrl = 'https://d386sc5j3a9jwt.cloudfront.net/img/user-images/';
  userTeamName: string = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getUserTeam();
    this.loadShifts();
  }

  getUserTeam(): void {
    // Hardcoded team name
    this.userTeamName = 'AUTOMATION QUALITY RELEASE';
    console.log('User team:', this.userTeamName);
  }

  async loadShifts() {
    this.loading = true;
    this.error = '';

    try {
      // First, get all shifts
      this.shifts = await this.apiService.get<Shift[]>('shift/');
      
      // Then, get shifts with users for the logged-in user's team
      if (this.userTeamName) {
        this.shiftsWithUsers = await this.apiService.get<ShiftWithUsers[]>('shift/', {
          team: this.userTeamName
        });
      } else {
        console.warn('No team found for user');
      }

      console.log('Shifts:', this.shifts);
      console.log('Shifts with users:', this.shiftsWithUsers);
    } catch (err: any) {
      this.error = err.message || 'Failed to load shifts';
      console.error('Error loading shifts:', err);
    } finally {
      this.loading = false;
    }
  }

  getFullName(user: User): string {
    return user.firstName + ' ' + (user.middleName ? user.middleName + ' ' : '') + user.lastName;
  }

  getUserImage(user: User): string {
    return user.userImage ? this.imageBaseUrl + user.userImage : 'assets/default-avatar.png';
  }

  getUserRole(user: User): string {
    if (user.team && user.team.length > 0) {
      return user.team[0].role;
    }
    return '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  getShiftUsers(shiftId: string): User[] {
    const shift = this.shiftsWithUsers.find(s => s.shift_id === shiftId);
    return shift?.users || [];
  }
}
