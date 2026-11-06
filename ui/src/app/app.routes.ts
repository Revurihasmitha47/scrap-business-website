import { Routes } from "@angular/router";
import { HomePageComponent } from "./public/home.page";
import { RegisterPageComponent } from "./auth/pages/register/register.page";
import { AdminRegisterPageComponent } from "./admin/register/admin-register.page";
import { SignInPageComponent } from "./auth/pages/sign-in/sign-in.page";
import { ForgotPasswordPageComponent } from "./auth/pages/forgot-password/forgot-password.page";
import { ResetPasswordPageComponent } from "./auth/pages/reset-password/reset-password.page";
import { DashboardPageComponent } from "./seller/legacy-dashboard/dashboard.page";
import { InviteAcceptPageComponent } from "./auth/pages/invite-accept/invite-accept.page";
import { AdminDashboardPageComponent } from "./admin/dashboard/admin-dashboard.page";
import { ProfilePageComponent } from "./admin/profile/profile.page";
import { StaffPageComponent } from "./admin/staff/staff.page";
import { AdminAddStaffPageComponent } from "./admin/add-staff/admin-add-staff.page";
import { StaffMyPickupsPageComponent } from "./staff/my-pickups/my-pickups.page";
import { StaffHistoryPageComponent as StaffHistoryFolderPageComponent } from "./staff/history/history.page";
import { StaffNotificationsPageComponent as StaffNotificationsFolderPageComponent } from "./staff/notifications/notifications.page";
import { StaffMapPageComponent } from "./staff/map/map.page";
import { StaffPickupDetailsPageComponent } from "./staff/pickup-details/pickup-details.page";
import { StaffProfilePageComponent } from "./staff/profile/profile.page";
import { ChangePasswordPageComponent } from "./auth/pages/change-password/change-password.page";
import { HomeSellerPageComponent } from "./seller/request-pickup/request-pickup.page";
import { HomeSellerDetailPageComponent } from "./seller/pickup-details/pickup-details.page";
import { HomeSellerNotificationsPageComponent } from "./seller/notifications/notifications.page";
import { SellerRatesPageComponent } from "./seller/current-rates/current-rates.page";
import { SellerRecordsPageComponent } from "./seller/my-requests/my-requests.page";
import { SellerProfilePageComponent } from "./seller/profile/profile.page";
import { ProfileRoutePageComponent } from "./shared/profile-route.page";
import { SellerDashboardPageComponent } from "./seller/dashboard/dashboard.page";
import { AdminAssignStaffPageComponent } from "./admin/assign-staff/admin-assign-staff.page";
import { PickupRequestsPageComponent } from "./admin/pickup-requests/pickup-requests.page";
import { PickupDetailsPageComponent } from "./admin/pickup-details/pickup-details.page";
import { CategoriesPageComponent } from "./admin/categories/categories.page";
import { RatesPageComponent } from "./admin/rates/rates.page";
import { SellersPageComponent } from "./admin/sellers/sellers.page";
import { EmailConfigurationPage } from "./admin/email/email-configuration/email-configuration.page";
import { EmailTemplatesPage } from "./admin/email/email-templates/email-templates.page";
import { roleGuard } from "./auth/role.guard";

export const routes: Routes = [
  { path: "", component: HomePageComponent, title: "ScrapFlow" },
  {
    path: "register",
    component: RegisterPageComponent,
    title: "Register | ScrapFlow",
  },
  {
    path: "admin/register",
    component: AdminRegisterPageComponent,
    title: "Admin Registration | ScrapFlow",
  },
  {
    path: "sign-in",
    component: SignInPageComponent,
    title: "Sign In | ScrapFlow",
  },
  { path: "forgot-password", component: ForgotPasswordPageComponent, title: "Forgot Password | ScrapFlow" },
  { path: "reset-password", component: ResetPasswordPageComponent, title: "Reset Password | ScrapFlow" },
  {
    path: "change-password",
    component: ChangePasswordPageComponent,
    title: "Change Password | ScrapFlow",
  },
  {
    path: "seller/dashboard",
    component: SellerDashboardPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Seller Dashboard | ScrapFlow",
  },
  {
    path: "seller/rates",
    component: SellerRatesPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Current Rates | ScrapFlow",
  },
  {
    path: "seller/request",
    component: HomeSellerPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Request Pickup | ScrapFlow",
  },
  {
    path: "seller/requests",
    component: SellerRecordsPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "My Requests | ScrapFlow",
  },
  {
    path: "seller/requests/:id",
    component: HomeSellerDetailPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Pickup Details | ScrapFlow",
  },
  {
    path: "seller/history",
    component: SellerRecordsPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Pickup History | ScrapFlow",
  },
  {
    path: "seller/notifications",
    component: HomeSellerNotificationsPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Notifications | ScrapFlow",
  },
  {
    path: "seller/profile",
    component: SellerProfilePageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Seller Profile | ScrapFlow",
  },
  {
    path: "dashboard",
    component: DashboardPageComponent,
    canActivate: [roleGuard("HOME_SELLER", "BULK_SELLER")],
    title: "Dashboard | ScrapFlow",
  },
  {
    path: "admin/dashboard",
    component: AdminDashboardPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Admin Dashboard | ScrapFlow",
  },
  {
    path: "admin/pickups",
    component: PickupRequestsPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Pickup Requests | ScrapFlow",
  },
  {
    path: "admin/pickups/:id/view",
    component: PickupDetailsPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Pickup Details | ScrapFlow",
  },
  {
    path: "admin/categories",
    component: CategoriesPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Scrap Categories | ScrapFlow",
  },
  {
    path: "admin/rates",
    component: RatesPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Scrap Rates | ScrapFlow",
  },
  {
    path: "admin/staff",
    component: StaffPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Staff Management | ScrapFlow",
  },
  {
    path: "admin/sellers",
    component: SellersPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Sellers | ScrapFlow",
  },
  { path: "admin/email/configuration", component: EmailConfigurationPage, canActivate: [roleGuard("ADMIN")], title: "Email Configuration | ScrapFlow" },
  { path: "admin/email/templates", component: EmailTemplatesPage, canActivate: [roleGuard("ADMIN")], title: "Email Templates | ScrapFlow" },
  {
    path: "admin/staff/add",
    component: AdminAddStaffPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Add Staff | ScrapFlow",
  },
  {
    path: "admin/pickups/:id/assign",
    component: AdminAssignStaffPageComponent,
    canActivate: [roleGuard("ADMIN")],
    title: "Assign Staff | ScrapFlow",
  },
  {
    path: "staff/my-pickups",
    component: StaffMyPickupsPageComponent,
    canActivate: [roleGuard("STAFF")],
    title: "My Pickups | ScrapFlow",
  },
  {
    path: "staff/pickups/:id",
    component: StaffPickupDetailsPageComponent,
    canActivate: [roleGuard("STAFF")],
    title: "Pickup Details | ScrapFlow",
  },
  {
    path: "staff/map",
    component: StaffMapPageComponent,
    canActivate: [roleGuard("STAFF")],
    title: "Staff Map | ScrapFlow",
  },
  {
    path: "staff/history",
    component: StaffHistoryFolderPageComponent,
    canActivate: [roleGuard("STAFF")],
    title: "Pickup History | ScrapFlow",
  },
  {
    path: "staff/notifications",
    component: StaffNotificationsFolderPageComponent,
    canActivate: [roleGuard("STAFF")],
    title: "Notifications | ScrapFlow",
  },
  {
    path: "staff/profile",
    component: StaffProfilePageComponent,
    canActivate: [roleGuard("STAFF")],
    title: "Staff Profile | ScrapFlow",
  },
  {
    path: "staff/accept-invite",
    component: InviteAcceptPageComponent,
    title: "Accept Staff Invitation | ScrapFlow",
  },
  {
    path: "profile",
    component: ProfileRoutePageComponent,
    title: "Profile | ScrapFlow",
  },
  {
    path: "profile/details",
    component: ProfilePageComponent,
    title: "Profile | ScrapFlow",
  },
  { path: "**", redirectTo: "" },
];
