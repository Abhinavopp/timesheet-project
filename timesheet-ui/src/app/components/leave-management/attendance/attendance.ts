import { Component, ViewChild, OnInit } from '@angular/core';
import { NgSelectComponent } from "@ng-select/ng-select";
import { BsDatepickerModule, BsDatepickerConfig, BsDatepickerDirective } from 'ngx-bootstrap/datepicker';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

interface Employee {
  userId: string;
  name: string;
  avatar?: string;
  presentDays: number;
  totalDays: number;
  leaveDays: number;
  officialHolidays: number;
  leaveBalance: number;
  attendance: DayAttendance[];
}

interface DayAttendance {
  date: string;
  day: string;
  dayNum: number;
  status: 'present' | 'leave' | 'week-off' | 'holiday' | 'comp-off' | 'half-day' | 'wfh' | 'maternity' | 'paternity' | '';
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [NgSelectComponent, FormsModule, BsDatepickerModule, CommonModule],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css']
})
export class Attendance implements OnInit {
  @ViewChild('bsDatepicker', { static: false }) bsDatepicker?: BsDatepickerDirective;

  selectedMonth: Date = new Date();
  formattedMonth = '';
  employees: Employee[] = [];
  loading = true;
  error: string | null = null;
  selectedEmployee: string | null = null;
  employeeList: {id: string, name: string}[] = [];
  daysInMonth: {dayNum: number, dayName: string}[] = [];
  selectedTeam = 'APPLICATIONS DEVELOPMENT';
  isDeveloper = false;
  isTeamLead = false;
  isManager = false;
  currentUserId: string | null = null;
  currentUserRole: string | null = null;
  allEmployeesData: any[] = [];

  bsConfig: Partial<BsDatepickerConfig> = {
    minMode: 'month',
    dateInputFormat: 'MMMM YYYY'
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.checkUserRole();
    this.updateFormattedMonth();
    this.generateDaysInMonth();
    this.fetchAttendance();
  }

  private checkUserRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserRole = user?.userRole?.toLowerCase() || null;
    // this.isDeveloper = this.currentUserRole === 'developer';
    this.isTeamLead = this.currentUserRole === 'team lead';
    this.isManager = this.currentUserRole === 'manager';
    this.isDeveloper = !this.isTeamLead && !this.isManager;
    this.currentUserId = user?.id || null;
  }

  onMonthChange(date: Date | null) {
    if (date) {
      this.selectedMonth = date;
      this.updateFormattedMonth();
      this.generateDaysInMonth();
      this.fetchAttendance();
    }
  }

  private updateFormattedMonth() {
    this.formattedMonth = this.selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  private generateDaysInMonth() {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();
    
    this.daysInMonth = [];
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day);
      this.daysInMonth.push({
        dayNum: day,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
  }

  async fetchAttendance() {
    try {
      this.loading = true;
      this.error = null;

      const year = this.selectedMonth.getFullYear();
      const month = this.selectedMonth.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const params: any = {
        st: this.formatDate(startDate),
        ed: this.formatDate(endDate),
        tm: this.selectedTeam
      };

      if (this.isDeveloper && this.currentUserId) {
        params.userId = this.currentUserId;
      }

      const response: any = await this.apiService.get('attendance/', params);
      
      console.log('Attendance API response:', response);
      console.log('Sample employee data:', response?.[0]);
      console.log('Team data in employee:', response?.[0]?.team);
      
      this.processAttendanceData(response);
      
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      this.error = err?.message || 'Failed to load attendance data';
      this.employees = [];
    } finally {
      this.loading = false;
    }
  }

  private processAttendanceData(response: any) {
    // Response is an array of employee objects
    const teamData = Array.isArray(response) ? response : [];
    
    console.log('Team data:', teamData);
    
    this.employees = teamData.map((emp: any) => {
      const monthData = emp.month && emp.month.length > 0 ? emp.month[0] : null;
      const attendance = this.mapAttendanceData(monthData);
      
      // Construct full name
      const firstName = emp.firstName || '';
      const middleName = emp.middleName || '';
      const lastName = emp.lastName || '';
      const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
      
      return {
        userId: emp.userId || '',
        name: fullName || emp.email || 'Unknown',
        avatar: emp.userImage ? `https://d386sc5j3a9jwt.cloudfront.net/img/user-images/${emp.userImage}` : '',
        presentDays: monthData?.presentDays || 0,
        totalDays: monthData?.totalWorkingDays || this.daysInMonth.length,
        leaveDays: monthData?.nonPresentDays || 0,
        officialHolidays: monthData?.officalLeaveDays || 0,
        leaveBalance: parseFloat(monthData?.leaveBalance || '0'),
        attendance: attendance
      };
    });

    // Store all employees data for filtering
    this.allEmployeesData = teamData;

    // Filter by selected employee if one is selected
    if (this.selectedEmployee) {
      this.employees = this.employees.filter(emp => emp.userId === this.selectedEmployee);
    } else if (this.isManager && this.currentUserId) {
      // Manager: show their own attendance by default
      this.employees = this.employees.filter(emp => emp.userId === this.currentUserId);
    } else if (this.isTeamLead && this.currentUserId) {
      // Team lead: show their own attendance by default
      this.employees = this.employees.filter(emp => emp.userId === this.currentUserId);
    } else if (this.isDeveloper && this.currentUserId) {
      // Developer: only show their own attendance
      this.employees = this.employees.filter(emp => emp.userId === this.currentUserId);
    }

    // Build employee list for dropdown
    if (this.isDeveloper) {
      // Developer: no dropdown needed (hidden in UI)
      this.employeeList = [];
    } else if (this.isTeamLead) {
      // Team lead: only show developers
      this.fetchUsersForDropdown(teamData, ['developer']);
    } else if (this.isManager) {
      // Manager: show team leads and developers (not other managers)
      this.fetchUsersForDropdown(teamData, ['developer', 'team lead']);
    } else {
      // Super Admin: show all employees
      this.employeeList = teamData.map((emp: any) => {
        const firstName = emp.firstName || '';
        const middleName = emp.middleName || '';
        const lastName = emp.lastName || '';
        const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
        
        return {
          id: emp.userId,
          name: fullName || emp.email || 'Unknown'
        };
      });
    }
  }

  private async fetchUsersForDropdown(teamData: any[], allowedRoles: string[]) {
    try {
      const users: any = await this.apiService.get('users', { team: this.selectedTeam });
      
      // Filter by allowed roles
      const filteredUserIds = users
        .filter((u: any) => {
          const role = u.team?.[0]?.role?.toLowerCase();
          return allowedRoles.includes(role);
        })
        .map((u: any) => u._id);

      // Build dropdown list from attendance data, filtered by allowed user IDs
      this.employeeList = teamData
        .filter((emp: any) => filteredUserIds.includes(emp.userId))
        .map((emp: any) => {
          const firstName = emp.firstName || '';
          const middleName = emp.middleName || '';
          const lastName = emp.lastName || '';
          const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
          
          return {
            id: emp.userId,
            name: fullName || emp.email || 'Unknown'
          };
        });
    } catch (err) {
      console.error('Error fetching users for dropdown:', err);
      // Fallback: show all employees
      this.employeeList = teamData.map((emp: any) => {
        const firstName = emp.firstName || '';
        const middleName = emp.middleName || '';
        const lastName = emp.lastName || '';
        const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim();
        
        return {
          id: emp.userId,
          name: fullName || emp.email || 'Unknown'
        };
      });
    }
  }

  private mapAttendanceData(monthData: any): DayAttendance[] {
    const attendance: DayAttendance[] = [];
    
    if (!monthData || !monthData.days || monthData.days.length === 0) {
      // No data available, return empty status for all days
      for (const dayInfo of this.daysInMonth) {
        attendance.push({
          date: this.getDateKey(dayInfo.dayNum),
          day: dayInfo.dayName,
          dayNum: dayInfo.dayNum,
          status: ''
        });
      }
      return attendance;
    }

    // monthData.days is an array with a single object where keys are day numbers (1-31)
    const daysObject = monthData.days[0] || {};

    for (const dayInfo of this.daysInMonth) {
      const statusCode = daysObject[dayInfo.dayNum] || '';
      
      attendance.push({
        date: this.getDateKey(dayInfo.dayNum),
        day: dayInfo.dayName,
        dayNum: dayInfo.dayNum,
        status: this.mapStatusCode(statusCode)
      });
    }

    return attendance;
  }

  private mapStatusCode(code: string): DayAttendance['status'] {
    if (!code) return '';
    
    const codeUpper = code.toUpperCase();
    
    switch (codeUpper) {
      case 'P':
        return 'present';
      case 'A':
        return 'leave';
      case 'W':
        return 'week-off';
      case 'O':
        return 'holiday';
      case 'C':
        return 'comp-off';
      case 'HL':
        return 'half-day';
      case 'WFH':
        return 'wfh';
      case 'M':
        return 'maternity';
      case 'PT':
        return 'paternity';
      default:
        return '';
    }
  }

  private getDateKey(day: number): string {
    const year = this.selectedMonth.getFullYear();
    const month = String(this.selectedMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getStatusClass(status: string): string {
    return status || 'empty';
  }

  onEmployeeChange() {
    this.fetchAttendance();
  }
}