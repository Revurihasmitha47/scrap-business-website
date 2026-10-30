import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home.page';
import { PortalPageComponent } from './pages/portal.page';
import { RegisterPageComponent } from './pages/register.page';

export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'ScrapFlow | Scrap made simple' },
  { path: 'register', component: RegisterPageComponent, title: 'Register | ScrapFlow' },
  { path: 'home-seller', component: PortalPageComponent, data: { portal: 'home-seller' }, title: 'Home Seller | ScrapFlow' },
  { path: 'bulk-seller', component: PortalPageComponent, data: { portal: 'bulk-seller' }, title: 'Bulk Seller | ScrapFlow' },
  { path: 'client-admin', component: PortalPageComponent, data: { portal: 'client-admin' }, title: 'Client Admin | ScrapFlow' },
  { path: 'pickup-staff', component: PortalPageComponent, data: { portal: 'pickup-staff' }, title: 'Pickup Staff | ScrapFlow' },
  { path: 'super-admin', component: PortalPageComponent, data: { portal: 'super-admin' }, title: 'Super Admin | ScrapFlow' },
  { path: '**', redirectTo: '' }
];
