import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

interface OfficialLeave {
  id?: number;
  date: string;
  day: string;
  name: string;
  year?: number;
  month?: number;
}

@Component({
  selector: 'app-official-leave-list',
  imports: [CommonModule],
  standalone: true, 
  templateUrl: './official-leave-list.html',
  styleUrl: './official-leave-list.css'
})
export class OfficialLeaveList implements OnInit {
  officialLeaves: OfficialLeave[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.fetchOfficialLeaves();
  }

  async fetchOfficialLeaves(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      
      const response: any = await this.apiService.get('leave/officialleaves/');
      
      let rawData: any[] = [];
      if (Array.isArray(response)) {
        rawData = response;
      }
    
      
      this.officialLeaves = rawData.map(item => ({
        date: item.onDate || item.date,
        day: item.onDay || item.day,
        name: item.reason || item.name,
        id: item.id,
        year: item.year,
        month: item.month
      }));
      
    } catch (err: any) {
      console.error('Error fetching official leaves:', err);
      this.error = err?.message || 'Failed to load official leaves';
      this.officialLeaves = [];
    } finally {
      this.loading = false;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  formatDay(dayString: string): string {
    if (!dayString) {
      return '';
    }
    return dayString.toUpperCase();
  }
}
