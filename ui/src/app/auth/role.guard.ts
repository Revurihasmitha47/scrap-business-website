import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, AccountType } from './auth.service';

export const roleGuard = (...allowed: AccountType[]): CanActivateFn => async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.session) await auth.initialize();
  const role = auth.session?.accountType;
  if (role && allowed.includes(role)) return true;
  return router.createUrlTree(['/sign-in']);
};
