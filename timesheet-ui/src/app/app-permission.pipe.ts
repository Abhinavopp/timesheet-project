import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appPermission',
  standalone: true
})
export class AppPermissionPipe implements PipeTransform {

  // Allowed permission values
  private allowedValues = [3, 5, 7, 9, 11, 15, 17];

  transform(feature: string): boolean {
    if (!feature) return false;

    // Get permissions from localStorage
    const permissionsRaw = localStorage.getItem('permissions');
    if (!permissionsRaw) return false;

    const permissions = Array.isArray(JSON.parse(permissionsRaw))
      ? JSON.parse(permissionsRaw)[0] // use first object if array
      : JSON.parse(permissionsRaw);

    if (!permissions || typeof permissions !== 'object') return false;

    // Try exact match or lowercase match for keys
    const key = Object.keys(permissions).find(k => k.toLowerCase() === feature.toLowerCase());
    if (!key) return false;

    const value = Number(permissions[key]);
    const allowed = this.allowedValues.includes(value);

    // console.log(`[AppPermissionPipe] feature: ${feature}, key: ${key}, value: ${value}, allowed: ${allowed}`);

    return allowed;
  }
}
