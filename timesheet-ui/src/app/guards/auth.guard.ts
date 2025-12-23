// import { inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { SupabaseService } from '../services/supabase.service';

// export const authGuard = async () => {
//   const supabaseService = inject(SupabaseService);
//   const router = inject(Router);

//   try {
//     const user = await supabaseService.getCurrentUser();
//     if (user) {
//       return true;
//     } else {
//       router.navigate(['/login']);
//       return false;
//     }
//   } catch (error) {
//     console.error('Auth guard error:', error);
//     router.navigate(['/login']);
//     return false;
//   }
// };
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const user = localStorage.getItem('user');

  if (user) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
