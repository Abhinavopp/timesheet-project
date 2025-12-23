import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <nav class="nav-links">
        <a href="/plan-today" class="nav-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 8.33333L2.5 13C2.5 13.5523 2.94771 14 3.5 14H6.33333C6.88562 14 7.33333 13.5523 7.33333 13V11C7.33333 10.4477 7.78105 10 8.33333 10H9.66667C10.2189 10 10.6667 10.4477 10.6667 11V13C10.6667 13.5523 11.1144 14 11.6667 14H14.5C15.0523 14 15.5 13.5523 15.5 13V8.33333M5 14V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 7.5L7.79289 1.70711C8.18342 1.31658 8.81658 1.31658 9.20711 1.70711L16 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Home
        </a>
        <a routerLink="/my-work" routerLinkActive="active" class="nav-link">My work</a>
        <a routerLink="/my-timesheet" routerLinkActive="active" class="nav-link">My timesheet</a>
        <a routerLink="/my-board" routerLinkActive="active" class="nav-link">My board</a>
        <a routerLink="/milestone" routerLinkActive="active" class="nav-link">Milestone</a>
        <a routerLink="/workload" routerLinkActive="active" class="nav-link">Workload</a>
      </nav>

      <div class="header-right">
        <a href="#" class="my-tasks-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 8L7 11L12 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          My tasks
        </a>
        <div class="task-badges">
          <span class="badge badge-late">
            <span class="badge-dot" style="background: #ef4444;"></span>
            0 Late
          </span>
          <span class="badge badge-today">
            <span class="badge-dot" style="background: #10b981;"></span>
            0 Today
          </span>
          <span class="badge badge-upcoming">
            <span class="badge-dot" style="background: #3b82f6;"></span>
            0 Upcoming
          </span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      flex-shrink: 0;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-link {
      padding: 8px 14px;
      color: #64748b;
      text-decoration: none;
      font-size: 14px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .nav-link:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .nav-link.active {
      color: #3b82f6;
      font-weight: 500;
      border-bottom: 2px solid #3b82f6;
      border-radius: 0;
      margin-bottom: -1px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .my-tasks-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      color: #64748b;
      text-decoration: none;
      font-size: 14px;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .my-tasks-link:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .task-badges {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #475569;
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  `]
})
export class HeaderComponent {}
