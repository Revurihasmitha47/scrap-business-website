import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home.page';
import { RegisterPageComponent } from './pages/register.page';
import { AdminRegisterPageComponent } from './pages/admin-register.page';
import { SignInPageComponent } from './pages/sign-in.page';
import { DashboardPageComponent } from './pages/dashboard.page';
import { InviteAcceptPageComponent } from './pages/invite-accept.page';
import { AdminDashboardPageComponent } from './pages/admin-dashboard.page';
import { ProfilePageComponent } from './pages/profile.page';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'ScrapFlow' },
  { path: 'register', component: RegisterPageComponent, title: 'Register | ScrapFlow' },
  { path: 'admin/register', component: AdminRegisterPageComponent, title: 'Admin Registration | ScrapFlow' },
  { path: 'sign-in', component: SignInPageComponent, title: 'Sign In | ScrapFlow' },
  { path: 'dashboard', component: DashboardPageComponent, title: 'Dashboard | ScrapFlow' },
  { path: 'admin/dashboard', component: AdminDashboardPageComponent, title: 'Admin Dashboard | ScrapFlow' },
  { path: 'staff/accept-invite', component: InviteAcceptPageComponent, title: 'Accept Staff Invitation | ScrapFlow' },
  { path: 'profile', component: ProfilePageComponent, title: 'Profile | ScrapFlow' },
  { path: '**', redirectTo: '' }
];
