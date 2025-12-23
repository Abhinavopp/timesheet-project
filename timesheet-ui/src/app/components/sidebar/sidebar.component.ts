import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { AppPermissionPipe } from '../../app-permission.pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, CollapseModule, AppPermissionPipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})

export class SidebarComponent implements OnInit {
  // projects: Project[] = [];
  userName: string = '';
  userInitial: string = '';
  isLoggedIn = true;
  constructor() { }

  async ngOnInit() {
    this.loadUser();
    // await this.loadProjects();
  }

  loadUser() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.userName = user.name;
      this.userInitial = user.name?.charAt(0).toUpperCase();
    }
  }
  collapseStates: { [key: string]: boolean } = {
    time: true,
    report: true,
    leave: true,
    settings: true
  };
  toggleCollapse(menu: string) {
    this.collapseStates[menu] = !this.collapseStates[menu];
  }
  // async loadProjects() {
  //   try {
  //     this.projects = await this.supabaseService.getProjects();
  //   } catch (error) {
  //     console.error('Error loading projects:', error);
  //   }
  // }
}
