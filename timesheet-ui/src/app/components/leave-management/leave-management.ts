import { Component, OnInit, signal } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { OfficialLeaveList } from './official-leave-list/official-leave-list';

interface LeaveDetails {
  team: Array<{ _id: string; name: string; displayName: string; role: string }>;
  leaveBalance: {
    CL: number;
    SL: number;
    EL: number;
    permission: number;
    upl: number;
    CL_SL: number;
    CL_EL: number;
    SL_EL: number;
    CL_SL_EL: number;
  };
  officialleaves: string[];
  userWeekOffs: { [key: string]: string[] };
  AppliedLeaves: string[];
  WfHDates: string[];
  ShiftTiming: Array<any>;
  Permission: Array<{ date: string; startTime: string; endTime: string; hours: string }>;
  hierarchy: string[];
}

interface DayDetail {
  date: string;
  halfDay: 'fullday' | 'firsthalf' | 'secondhalf';
}

interface MailUser {
  id: string;
  name: string;
  email: string;
  photo: string;
  department: string;
}

@Component({
  selector: 'app-leave-management',
  imports: [
    NgSelectModule, 
    FontAwesomeModule, 
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    TabsModule, 
    BsDatepickerModule,
    OfficialLeaveList
  ],
  templateUrl: './leave-management.html',
  styleUrl: './leave-management.css'
})
export class LeaveManagement implements OnInit {
  leaveHistory: any[] = [];
  isLoading = false;
  userId: string = '';
  currentUser: any;
  leaveForm!: FormGroup;
  
  leaveDetails: LeaveDetails | null = null;
  userTeam: string = '';
  userImage: string = '';
  imageBaseUrl = "https://d386sc5j3a9jwt.cloudfront.net/img/user-images/";
  defaultImage = this.imageBaseUrl + "user.png";
  bsConfig = {
    dateInputFormat: 'YYYY-MM-DD',
    containerClass: 'theme-default',
    showWeekNumbers: false
  };

  categoryOptions = [
    { label: 'Leave', value: 'LEAVE' },
    { label: 'Work From Home', value: 'WFH' },
    { label: 'Permission', value: 'PERMISSION' }
  ];

  requestTypeOptions: Array<{ label: string; value: string }> = [];

  mailList: MailUser[] = [];

  leaveStats = [
    { label: 'CL', value: 0 },
    { label: 'SL', value: 0 },
    { label: 'EL', value: 0 },
    { label: 'UPL', value: 0 },
    { label: 'PER', value: 0 }
  ];

  requestedDays: number = 0;
  selectedDates: string[] = [];
  firstHalfChecked = false;
  secondHalfChecked = false;

  showRegenerateWarning = false;
  regenerateMessage = '';
  showApprovedDateConfirmation = false;
  approvedDateMessage = '';
  pendingRegenerateData: any = null;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.createForm();
    
    const user = this.getUserFromLocalStorage();
    if (user?.id) {
      this.userId = user.id;
      this.currentUser = user;
      this.userImage = user.image || 'default.jpeg';
      
      if (user.meta?.team && user.meta.team.length > 0) {
        this.userTeam = user.meta.team[0].name;
      }
    } else {
      console.warn('No user found in localStorage. Please login.');
    }
  }

  private getUserFromLocalStorage(): any {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }

  activeTab = signal(1);

  setTab(tab: number) {
    this.activeTab.set(tab);
  }

  async ngOnInit() {
    if (!this.userId) {
      console.error('User not logged in. Redirecting to login...');
      return;
    }

    this.fetchLeaveHistory();
    await this.fetchLeaveBalances();
  }

  createForm() {
    this.leaveForm = this.fb.group({
      category: [null, Validators.required],
      reqType: [{ value: null, disabled: true }, Validators.required],
      fromDate: [{ value: '', disabled: true }, Validators.required],
      toDate: [{ value: '', disabled: true }, Validators.required],
      mailTo: [[], Validators.required],
      description: ['', Validators.required],
      lackPriorNotice: [false]
    });

    this.leaveForm.get('category')?.valueChanges.subscribe(value => {
      this.onCategoryChange(value);
    });

    this.leaveForm.get('fromDate')?.valueChanges.subscribe(() => {
      this.calculateRequestedDays();
    });

    this.leaveForm.get('toDate')?.valueChanges.subscribe(() => {
      this.calculateRequestedDays();
    });
  }

  async fetchLeaveHistory() {
    this.isLoading = true;
    try {
      const params = { ui: this.userId, pa: 1 };
      const response: any = await this.apiService.get('leave/leavelist/', params);
      this.leaveHistory = response[0]?.leaveList || response || [];
    } catch (error) {
      console.error('Error fetching leave history:', error);
      this.leaveHistory = [];
    } finally {
      this.isLoading = false;
    }
  }

  async fetchLeaveBalances() {
    try {
      const start = this.getCurrentMonthStartLocal();
      const end = this.getEndDateForAPI();

      const params = {
        userId: this.userId,
        start,
        end
      };

      console.log('Calling leave/leavedetails with params:', params);

      const response: any = await this.apiService.get('leave/leavedetails/', params);
      this.leaveDetails = response;

      console.log('Leave balance API response:', response);

      // Update leave stats
      this.leaveStats = [
        { label: 'CL', value: response.leaveBalance?.CL ?? 0 },
        { label: 'SL', value: response.leaveBalance?.SL ?? 0 },
        { label: 'EL', value: response.leaveBalance?.EL ?? 0 },
        { label: 'UPL', value: response.leaveBalance?.upl ?? 0 },
        { label: 'PER', value: response.leaveBalance?.permission ?? 0 }
      ];

      // Fetch all users and map with hierarchy
      await this.fetchUsersForMailList(response.hierarchy || []);

      if (response.team && response.team.length > 0) {
        this.userTeam = response.team[0].name;
      }

      // Set default mail recipients (all hierarchy emails)
      if (this.mailList.length > 0) {
        const defaultMailIds = this.mailList.map(u => u.id);
        this.leaveForm.patchValue({ mailTo: defaultMailIds });
      }

      console.log('Mapped leaveStats:', this.leaveStats);
    } catch (err) {
      console.error('Error fetching leave balances:', err);
    }
  }

  async fetchUsersForMailList(hierarchyEmails: string[]) {
    try {
      // Fetch all users from the API
      const response: any = await this.apiService.get('users/', {});
      const allUsers = response || [];

      // Map users with hierarchy emails
      this.mailList = allUsers
        .filter((user: any) => hierarchyEmails.includes(user.email))
        .map((user: any) => {
          // Get user image with fallback to default
          let photoUrl = this.defaultImage;
          if (user.image || user.userImage) {
            const imageName = user.image || user.userImage;
            photoUrl = this.imageBaseUrl + imageName;
          }

          return {
            id: user._id || user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userName || user.email,
            email: user.email,
            photo: photoUrl,
            department: user.meta?.team?.[0]?.name || 'General'
          };
        });

      console.log('Mapped mail list:', this.mailList);
    } catch (error) {
      console.error('Error fetching users for mail list:', error);
      // Fallback: create basic mail list from hierarchy emails
      this.mailList = hierarchyEmails.map((email) => ({
        id: email,
        name: email.split('@')[0],
        email: email,
        photo: this.defaultImage,
        department: 'General'
      }));
    }
  }


  onCategoryChange(category: string) {
    this.leaveForm.patchValue({
      reqType: '',
      fromDate: '',
      toDate: ''
    });
    this.requestedDays = 0;
    this.selectedDates = [];
    this.firstHalfChecked = false;
    this.secondHalfChecked = false;

    const reqTypeControl = this.leaveForm.get('reqType');
    const fromDateControl = this.leaveForm.get('fromDate');
    const toDateControl = this.leaveForm.get('toDate');

    if (!category) {
      reqTypeControl?.disable();
      fromDateControl?.disable();
      toDateControl?.disable();
      this.requestTypeOptions = [];
      return;
    }

    switch (category) {
      case 'WFH':
        this.requestTypeOptions = [{ label: 'N/A', value: 'NA' }];
        reqTypeControl?.enable();
        fromDateControl?.enable();
        toDateControl?.enable();
        this.leaveForm.patchValue({ reqType: 'NA' });
        break;

      case 'LEAVE':
        this.handleLeaveCategory();
        reqTypeControl?.enable();
        fromDateControl?.enable();
        toDateControl?.enable();
        break;

      case 'PERMISSION':
        this.requestTypeOptions = [
          { label: '0.5 Hour', value: '0.5' },
          { label: '1 Hour', value: '1' },
          { label: '1.5 Hours', value: '1.5' },
          { label: '2 Hours', value: '2' }
        ];
        reqTypeControl?.enable();
        fromDateControl?.enable();
        toDateControl?.enable();
        break;
    }
  }

  handleLeaveCategory() {
    if (!this.leaveDetails) return;

    const { CL, SL, EL } = this.leaveDetails.leaveBalance;
    const availableLeaves: Array<{ label: string; value: string }> = [];

    if (CL > 0) {
      availableLeaves.push({ label: 'Casual Leave', value: 'CL' });
    }
    if (SL > 0) {
      availableLeaves.push({ label: 'Sick Leave', value: 'SL' });
    }
    if (EL > 0) {
      availableLeaves.push({ label: 'Earned Leave', value: 'EL' });
    }

    if (availableLeaves.length === 0) {
      alert('Warning! No more paid leaves left to apply. You can opt for unpaid leave.');
      this.requestTypeOptions = [{ label: 'Unpaid Leave', value: 'UPL' }];
    } else {
      this.requestTypeOptions = availableLeaves;
    }
  }

  calculateRequestedDays() {
    const fromDate = this.leaveForm.get('fromDate')?.value;
    const toDate = this.leaveForm.get('toDate')?.value;

    if (!fromDate || !toDate || !this.leaveDetails) {
      this.requestedDays = 0;
      this.selectedDates = [];
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (start > end) {
      this.requestedDays = 0;
      this.selectedDates = [];
      return;
    }

    const dates: string[] = [];
    let count = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = this.getLocalDateString(currentDate);
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });

      const weekNumber = this.getWeekOfMonth(currentDate);
      const weekOffs = this.leaveDetails.userWeekOffs[weekNumber.toString()] || [];
      const isWeekend = weekOffs.includes(dayName);

      const isOfficialLeave = this.leaveDetails.officialleaves.includes(dateStr);

      if (!isWeekend && !isOfficialLeave) {
        dates.push(dateStr);
        count++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.selectedDates = dates;
    this.requestedDays = count;
  }

  getFormattedSelectedDates(): string {
    if (this.selectedDates.length === 0) {
      return 'None';
    }
    
    return this.selectedDates
      .map(date => this.formatDate(date))
      .join(', ');
  }

  getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const weekNumber = Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
    return weekNumber;
  }

  async checkForRegenerate(): Promise<{ needsRegenerate: boolean; isApproved: boolean; conflictDates: string[] }> {
    if (!this.leaveDetails || this.selectedDates.length === 0) {
      return { needsRegenerate: false, isApproved: false, conflictDates: [] };
    }

    const appliedLeaves = this.leaveDetails.AppliedLeaves.map(d => new Date(d).toISOString().split('T')[0]);
    const conflictDates: string[] = [];
    
    for (const date of this.selectedDates) {
      if (appliedLeaves.includes(date)) {
        conflictDates.push(date);
      }
    }

    if (conflictDates.length > 0) {
      const approvedConflicts = await this.checkIfDatesAreApproved(conflictDates);
      
      return {
        needsRegenerate: true,
        isApproved: approvedConflicts.length > 0,
        conflictDates
      };
    }

    return { needsRegenerate: false, isApproved: false, conflictDates: [] };
  }

  async checkIfDatesAreApproved(dates: string[]): Promise<string[]> {
    const approvedDates: string[] = [];
    
    for (const leave of this.leaveHistory) {
      if (leave.status?.toLowerCase().includes('approve')) {
        const leaveStart = new Date(leave.fromDate || leave.startDate);
        const leaveEnd = new Date(leave.toDate || leave.endDate);
        
        for (const date of dates) {
          const checkDate = new Date(date);
          if (checkDate >= leaveStart && checkDate <= leaveEnd) {
            approvedDates.push(date);
          }
        }
      }
    }
    
    return approvedDates;
  }

  async submitLeaveRequest() {
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      return;
    }

    const regenerateCheck = await this.checkForRegenerate();

    if (regenerateCheck.needsRegenerate) {
      if (regenerateCheck.isApproved) {
        this.approvedDateMessage = `Warning! You have already approved leave on these dates: ${regenerateCheck.conflictDates.join(', ')}. Do you want to regenerate the leave?`;
        this.showApprovedDateConfirmation = true;
        return;
      } else {
        this.regenerateMessage = `Warning! You have applied Leave on these dates: ${regenerateCheck.conflictDates.join(', ')}. This will regenerate the leave.`;
        this.showRegenerateWarning = true;
        
        setTimeout(() => {
          this.showRegenerateWarning = false;
          this.proceedWithSubmission(true);
        }, 3000);
        return;
      }
    }

    this.proceedWithSubmission(false);
  }

  handleApprovedDateConfirmation(confirmed: boolean) {
    this.showApprovedDateConfirmation = false;
    
    if (confirmed) {
      this.proceedWithSubmission(true);
    }
  }

  async proceedWithSubmission(regenerate: boolean) {
    const formValue = this.leaveForm.getRawValue();
    
    const days: DayDetail[] = this.selectedDates.map(date => ({
      date,
      halfDay: this.getHalfDayType()
    }));

    let noOfDays = days.length;
    if (this.firstHalfChecked && !this.secondHalfChecked) {
      noOfDays = days.length * 0.5;
    } else if (!this.firstHalfChecked && this.secondHalfChecked) {
      noOfDays = days.length * 0.5;
    }

    const now = new Date();
    const dateTimeStr = this.formatDateTime(now);

    const currentBalance = this.getCurrentLeaveBalance(formValue.reqType);

    // Get email addresses from selected user IDs
    const selectedEmails = this.mailList
      .filter(user => formValue.mailTo.includes(user.id))
      .map(user => user.email)
      .join(',');

    const payload = {
      markAsLeave: false,
      userId: this.userId,
      team: this.userTeam,
      leaveBalance: currentBalance,
      permissionBalance: this.leaveDetails?.leaveBalance?.permission || 0,
      hours: formValue.category === 'PERMISSION' ? parseFloat(formValue.reqType) : 0,
      status: 'Applied',
      appliedDate: dateTimeStr,
      createdDateTime: dateTimeStr,
      modifiedDateTime: dateTimeStr,
      active: 'Pending',
      statusChangedBy: null,
      isNoIntimation: formValue.lackPriorNotice,
      category: this.getCategoryLabel(formValue.category),
      reqType: formValue.reqType,
      startDate: formValue.fromDate,
      endDate: formValue.toDate,
      noOfDays,
      message: formValue.description,
      userImage: this.userImage || 'default.jpeg',
      regen: regenerate ? this.buildRegenObject() : '',
      reqDetails: {
        days,
        time: {
          startTime: '00:00',
          endTime: '00:00'
        },
        mailTo: selectedEmails,
        task: {},
        systemFlag: 0
      }
    };

    try {
      console.log('Submitting leave request:', payload);
      const response = await this.apiService.post('leave/', payload);
      console.log('Leave request submitted successfully:', response);
      
      alert('Leave request submitted successfully!');
      this.resetForm();
      this.fetchLeaveHistory();
      this.fetchLeaveBalances();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Error submitting leave request. Please try again.');
    }
  }

  buildRegenObject(): any {
    if (!this.leaveDetails) return '';

    const existingLeave = this.leaveHistory.find(leave => {
      const leaveStart = new Date(leave.fromDate || leave.startDate);
      const leaveEnd = new Date(leave.toDate || leave.endDate);
      
      for (const date of this.selectedDates) {
        const checkDate = new Date(date);
        if (checkDate >= leaveStart && checkDate <= leaveEnd) {
          return true;
        }
      }
      return false;
    });

    return {
      regenerate: 'true',
      existLeaveStatus: existingLeave?.status || 'Applied',
      alreadyApplieddate: {
        days: this.selectedDates.map(date => ({
          date,
          halfDay: 'fullday'
        }))
      },
      alreadyWFHApplieddate: {}
    };
  }

  getCategoryLabel(value: string): string {
    const category = this.categoryOptions.find(c => c.value === value);
    return category?.label || value;
  }

  getCurrentLeaveBalance(reqType: string): number {
    if (!this.leaveDetails) return 0;

    const balance = this.leaveDetails.leaveBalance;
    switch (reqType) {
      case 'CL': return balance.CL;
      case 'SL': return balance.SL;
      case 'EL': return balance.EL;
      case 'UPL': return balance.upl;
      default: return balance.CL + balance.SL + balance.EL;
    }
  }

  getHalfDayType(): 'fullday' | 'firsthalf' | 'secondhalf' {
    if (this.firstHalfChecked && !this.secondHalfChecked) {
      return 'firsthalf';
    } else if (!this.firstHalfChecked && this.secondHalfChecked) {
      return 'secondhalf';
    }
    return 'fullday';
  }

  formatDateTime(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  getLocalDateString(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getCurrentMonthStartLocal(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.getLocalDateString(start);
  }

  getEndDateForAPI(): string {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 5, 0);
    return this.getLocalDateString(end);
  }

  resetForm() {
    this.leaveForm.reset();
    this.leaveForm.patchValue({ lackPriorNotice: false });
    
    // Re-apply default mail recipients
    if (this.mailList.length > 0) {
      const defaultMailIds = this.mailList.map(u => u.id);
      this.leaveForm.patchValue({ mailTo: defaultMailIds });
    }
    
    this.requestedDays = 0;
    this.selectedDates = [];
    this.firstHalfChecked = false;
    this.secondHalfChecked = false;
    
    this.leaveForm.get('reqType')?.disable();
    this.leaveForm.get('fromDate')?.disable();
    this.leaveForm.get('toDate')?.disable();
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('approve')) return 'badge-approved';
    if (statusLower.includes('cancel') || statusLower.includes('reject')) return 'badge-cancelled';
    if (statusLower.includes('pending')) return 'badge-pending';
    return 'badge-approved';
  }

  getStatusIcon(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('approve')) return 'fa-check-circle';
    if (statusLower.includes('cancel') || statusLower.includes('reject')) return 'fa-times-circle';
    if (statusLower.includes('pending')) return 'fa-clock';
    return 'fa-check-circle';
  }

  getUserInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getLeaveUserImage(leave: any): string {
    // Check if leave has userImage or image property
    if (leave.userImage) {
      return this.imageBaseUrl + leave.userImage;
    }
    if (leave.image) {
      return this.imageBaseUrl + leave.image;
    }
    // Fallback to default image
    return this.defaultImage;
  }
}