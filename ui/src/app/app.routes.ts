import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home.page';
import { RegisterPageComponent } from './pages/register.page';
import { AdminRegisterPageComponent } from './pages/admin-register.page';
import { SignInPageComponent } from './pages/sign-in.page';
import { DashboardPageComponent } from './pages/dashboard.page';
import { InviteAcceptPageComponent } from './pages/invite-accept.page';
import { AdminDashboardPageComponent } from './pages/admin-dashboard.page';
import { ProfilePageComponent } from './pages/profile.page';
import { AdminStaffPageComponent } from './pages/admin-staff.page';
import { AdminAddStaffPageComponent } from './pages/admin-add-staff.page';
import { StaffPickupsPageComponent } from './pages/staff-pickups.page';
import { StaffPickupDetailPageComponent } from './pages/staff-pickup-detail.page';
import { StaffHistoryPageComponent } from './pages/staff-history.page';
import { StaffNotificationsPageComponent } from './pages/staff-notifications.page';
import { ChangePasswordPageComponent } from './pages/change-password.page';
import { HomeSellerPageComponent } from './pages/home-seller.page';
import { HomeSellerDetailPageComponent } from './pages/home-seller-detail.page';
import { HomeSellerNotificationsPageComponent } from './pages/home-seller-notifications.page';
import { SellerRatesPageComponent } from './pages/seller-rates.page';
import { SellerRecordsPageComponent } from './pages/seller-records.page';
import { SellerProfilePageComponent } from './pages/seller-profile.page';
import { ProfileRoutePageComponent } from './pages/profile-route.page';
import { SellerDashboardPageComponent } from './pages/seller-dashboard.page';
import { AdminAssignStaffPageComponent } from './pages/admin-assign-staff.page';
import { roleGuard } from './auth/role.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'ScrapFlow' },
  { path: 'register', component: RegisterPageComponent, title: 'Register | ScrapFlow' },
  { path: 'admin/register', component: AdminRegisterPageComponent, title: 'Admin Registration | ScrapFlow' },
  { path: 'sign-in', component: SignInPageComponent, title: 'Sign In | ScrapFlow' },
  { path: 'change-password', component: ChangePasswordPageComponent, title: 'Change Password | ScrapFlow' },
  { path: 'seller/dashboard', component: SellerDashboardPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Seller Dashboard | ScrapFlow' },
  { path: 'seller/rates', component: SellerRatesPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Current Rates | ScrapFlow' },
  { path: 'seller/request', component: HomeSellerPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Request Pickup | ScrapFlow' },
  { path: 'seller/requests', component: SellerRecordsPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'My Requests | ScrapFlow' },
  { path: 'seller/requests/:id', component: HomeSellerDetailPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Pickup Details | ScrapFlow' },
  { path: 'seller/history', component: SellerRecordsPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Pickup History | ScrapFlow' },
  { path: 'seller/notifications', component: HomeSellerNotificationsPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Notifications | ScrapFlow' },
  { path: 'seller/profile', component: SellerProfilePageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Seller Profile | ScrapFlow' },
  { path: 'dashboard', component: DashboardPageComponent, canActivate: [roleGuard('HOME_SELLER','BULK_SELLER')], title: 'Dashboard | ScrapFlow' },
  { path: 'admin/dashboard', component: AdminDashboardPageComponent, canActivate: [roleGuard('ADMIN')], title: 'Admin Dashboard | ScrapFlow' },
  { path: 'admin/staff', component: AdminStaffPageComponent, canActivate: [roleGuard('ADMIN')], title: 'Staff Management | ScrapFlow' },
  { path: 'admin/staff/add', component: AdminAddStaffPageComponent, canActivate: [roleGuard('ADMIN')], title: 'Add Staff | ScrapFlow' },
  { path: 'admin/pickups/:id/assign', component: AdminAssignStaffPageComponent, canActivate: [roleGuard('ADMIN')], title: 'Assign Staff | ScrapFlow' },
  { path: 'staff/my-pickups', component: StaffPickupsPageComponent, canActivate: [roleGuard('STAFF')], title: 'My Pickups | ScrapFlow' },
  { path: 'staff/pickups/:id', component: StaffPickupDetailPageComponent, canActivate: [roleGuard('STAFF')], title: 'Pickup Details | ScrapFlow' },
  { path: 'staff/map', component: StaffPickupsPageComponent, canActivate: [roleGuard('STAFF')], title: 'Staff Map | ScrapFlow' },
  { path: 'staff/history', component: StaffHistoryPageComponent, canActivate: [roleGuard('STAFF')], title: 'Pickup History | ScrapFlow' },
  { path: 'staff/notifications', component: StaffNotificationsPageComponent, canActivate: [roleGuard('STAFF')], title: 'Notifications | ScrapFlow' },
  { path: 'staff/accept-invite', component: InviteAcceptPageComponent, title: 'Accept Staff Invitation | ScrapFlow' },
  { path: 'profile', component: ProfileRoutePageComponent, title: 'Profile | ScrapFlow' },
  { path: 'profile/details', component: ProfilePageComponent, title: 'Profile | ScrapFlow' },
  { path: '**', redirectTo: '' }
];
