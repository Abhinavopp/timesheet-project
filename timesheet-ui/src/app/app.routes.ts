// import { Routes } from '@angular/router';
// import { PlannerDashboardComponent } from './components/planner-dashboard/planner-dashboard.component';
// import { authGuard } from './guards/auth.guard';

// export const routes: Routes = [
//   { path: '', redirectTo: '/login', pathMatch: 'full' },
//   {
//     path: 'login',
//     loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
//   },
//   {
//     path: 'plan-today',
//     component: PlannerDashboardComponent,
//     canActivate: [authGuard]
//   },
//   {
//     path: 'my-work',
//     loadComponent: () => import('./components/my-work/my-work.component').then(m => m.MyWorkComponent),
//     canActivate: [authGuard]
//   },
//   {
//     path: 'my-timesheet',
//     loadComponent: () => import('./components/my-timesheet/my-timesheet.component').then(m => m.MyTimesheetComponent),
//     canActivate: [authGuard]
//   },
//   {
//     path: 'my-board',
//     loadComponent: () => import('./components/my-board/my-board.component').then(m => m.MyBoardComponent),
//     canActivate: [authGuard]
//   },
//   {
//     path: 'milestone',
//     loadComponent: () => import('./components/milestone/milestone.component').then(m => m.MilestoneComponent),
//     canActivate: [authGuard]
//   },
//   {
//     path: 'workload',
//     loadComponent: () => import('./components/workload/workload.component').then(m => m.WorkloadComponent),
//     canActivate: [authGuard]
//   },
//   {
//     path: 'projects',
//     loadComponent: () => import('./components/projects/projects.component').then(m => m.ProjectsComponent),
//     canActivate: [authGuard]
//   },
//   {
//     path: 'project/:id',
//     loadComponent: () => import('./components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
//     canActivate: [authGuard]
//   }
// ];
import { Routes } from '@angular/router';
import { PlannerDashboardComponent } from './components/planner-dashboard/planner-dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'plan-today',
    component: PlannerDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'my-work',
    loadComponent: () =>
      import('./components/my-work/my-work.component').then(m => m.MyWorkComponent),
    canActivate: [authGuard]
  },
  {
    path: 'schedule',
    loadComponent: () =>
      import('./components/my-timesheet/my-timesheet.component').then(m => m.MyTimesheetComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-board',
    loadComponent: () =>
      import('./components/my-board/my-board.component').then(m => m.MyBoardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'milestone',
    loadComponent: () =>
      import('./components/milestone/milestone.component').then(m => m.MilestoneComponent),
    canActivate: [authGuard]
  },
  {
    path: 'workload',
    loadComponent: () =>
      import('./components/workload/workload.component').then(m => m.WorkloadComponent),
    canActivate: [authGuard]
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./components/projects/projects.component').then(m => m.ProjectsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'leave',
    loadComponent: () =>
      import('./components/leave-management/leave-management').then(m => m.LeaveManagement),
    canActivate: [authGuard]
  },
  {
    path: 'attendance',
    loadComponent: () =>
      import('./components/leave-management/attendance/attendance').then(m => m.Attendance),
    canActivate: [authGuard]
  },
  {
    path: 'employee',
    loadComponent: () =>
      import('./components/employee-management/employee-management').then(m => m.EmployeeManagement),
    canActivate: [authGuard]
  },
  {
    path: 'shift',
    loadComponent: () =>
      import('./components/shift/shift').then(m => m.Shift),
    canActivate: [authGuard]
  },
  {
    path: 'role',
    loadComponent: () =>
      import('./components/roles/roles').then(m => m.Roles),
    canActivate: [authGuard]
  },
  {
    path: 'project/:id',
    loadComponent: () =>
      import('./components/project-detail/project-detail.component').then(
        m => m.ProjectDetailComponent
      ),
    canActivate: [authGuard]
  }
];
