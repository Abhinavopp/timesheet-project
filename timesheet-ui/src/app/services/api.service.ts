import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly baseUrl = 'http://3.209.80.69/timesheet/api';
  private readonly apiKey = 'c809RdojIv2V1YtkRiXqJ54NaY4owgYk5uNia24K';

  constructor(private http: HttpClient) {}

  // ----------------------------------------------------
  // 🔹 COMMON HEADERS
  // ----------------------------------------------------
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }

  // ----------------------------------------------------
  // 🔹 Helper Build URL
  // ----------------------------------------------------
  private buildUrl(endpoint: string): string {
    return endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
  }

  // ----------------------------------------------------
  // 🔹 GET (with params support)
  // ----------------------------------------------------
  get<T>(endpoint: string, params?: Record<string, any>) {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return firstValueFrom(
      this.http.get<T>(this.buildUrl(endpoint), {
        headers: this.getHeaders(),
        params: httpParams
      })
    );
  }

  // ----------------------------------------------------
  // 🔹 POST
  // ----------------------------------------------------
  post<T>(endpoint: string, body: any) {
    return firstValueFrom(
      this.http.post<T>(this.buildUrl(endpoint), body, {
        headers: this.getHeaders()
      })
    );
  }

  // ----------------------------------------------------
  // 🔹 PUT
  // ----------------------------------------------------
  put<T>(endpoint: string, body: any) {
    return firstValueFrom(
      this.http.put<T>(this.buildUrl(endpoint), body, {
        headers: this.getHeaders()
      })
    );
  }

  // ----------------------------------------------------
  // 🔹 DELETE
  // ----------------------------------------------------
  delete<T>(endpoint: string) {
    return firstValueFrom(
      this.http.delete<T>(this.buildUrl(endpoint), {
        headers: this.getHeaders()
      })
    );
  }


  
}
