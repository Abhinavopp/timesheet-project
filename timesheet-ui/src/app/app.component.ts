import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
// import { HeaderComponent } from './components/header/header.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div class="app-container" *ngIf="!isLoginPage">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <!-- <app-header></app-header> -->
        <router-outlet></router-outlet>
        
      </div>
    </div>
    <router-outlet *ngIf="isLoginPage"></router-outlet>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      background: #f8f9fa;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  `]
})
export class AppComponent implements OnInit {
  isLoginPage = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLoginPage = event.url === '/login' || event.url === '/';
      });

    this.isLoginPage = this.router.url === '/login' || this.router.url === '/';
  }

}
