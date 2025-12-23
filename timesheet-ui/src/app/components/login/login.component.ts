import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  isLoading = false;
  errorMessage = '';

  constructor(private router: Router, private http: HttpClient, private toastr: ToastrService) {}

  ngAfterViewInit() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: '849459575441-mub2qm7cuffnuo05v4vr8ljag5cebthg.apps.googleusercontent.com',
        callback: this.handleCredentialResponse.bind(this),
      });

      google.accounts.id.renderButton(
        document.getElementById('googleSignInDiv')!,
        { theme: 'outline', size: 'large', width: '250' }
      );

      google.accounts.id.prompt();
    } else {
      console.error('Google script not loaded');
    }
  }
  async handleCredentialResponse(response: any) {
    const credential = response?.credential;
    if (!credential) return;
  
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]));
      const userEmail = payload.email;
  
      // Fetch user details from your API
      const apiUrl = `http://localhost:3536/timesheet/api/users?email=${encodeURIComponent(userEmail)}`;
      const result: any = await this.http.get(apiUrl).toPromise();
      const userData = Array.isArray(result) ? result[0] : result;
  
      // Check if user exists
      if (!userData?._id) {
        this.errorMessage = 'Access Denied: You are not authorized.';
        console.warn('User not found:', userEmail);
        this.toastr.error('Access Denied: You are not authorized.', 'Error');
        return; // Stop login
      }
  
      // If user exists, build user object
      const user = {
        id: userData._id,
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email,
        empId: userData.empId,
        siteRole: userData.siteRole,
        userRole: userData.team?.[0]?.role,
        status: userData.status,
        image: userData.userImage,
        team: userData.team,
        meta: userData
      };
  
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
  
      // 🔹 Fetch permissions
      const permissionApi = `http://localhost:3536/timesheet/api/sitepermisssion/?siteRole=${encodeURIComponent(user.siteRole)}&userRole=${encodeURIComponent(user.userRole)}`;
      const permissions: any = await this.http.get(permissionApi).toPromise();
  
      localStorage.setItem('permissions', JSON.stringify(permissions));
  
      console.log('User fetched:', user);
      console.log('Permissions fetched:', permissions);
  
      // Navigate to dashboard or main page
      this.router.navigate(['/my-work']);
    } catch (error) {
      console.error('Error during login:', error);
      this.errorMessage = 'An error occurred during login. Please try again.';
    }
  }
  
}
