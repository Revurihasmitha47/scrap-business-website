import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { BusinessService } from '../core/business.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="staff-shell">
    <aside class="staff-sidebar">
      <a routerLink="/admin/dashboard" class="staff-brand"><span>♻</span><div><strong>Scrap<span>Flow</span></strong><small>Admin Panel</small></div></a>
      <nav>
        <a routerLink="/admin/dashboard">⌂ <span>Dashboard</span></a>
        <a routerLink="/admin/dashboard">▣ <span>Pickup Requests</span></a>
        <a routerLink="/admin/dashboard">▱ <span>Scrap Categories</span></a>
        <a routerLink="/admin/dashboard">▥ <span>Scrap Rates</span></a>
        <a routerLink="/admin/staff" class="active">♙ <span>Staff</span></a>
        <a routerLink="/admin/dashboard">♤ <span>Sellers</span></a>
        <a routerLink="/admin/dashboard">▤ <span>Reports</span></a>
      </nav>
      <button class="staff-logout" (click)="logout()">↪ <span>Logout</span></button>
    </aside>
    <main class="staff-main">
      <header class="staff-header"><div></div><div class="staff-header-actions"><button class="staff-bell">♧<i></i></button><button class="staff-admin-chip"><b>{{ initials }}</b> Admin⌄</button></div></header>
      <section class="staff-content">
        <div class="staff-title-row"><div><p class="staff-eyebrow">TEAM MANAGEMENT</p><h1>Staff Management</h1><p>Manage your pickup team</p></div><span class="staff-date">▣ &nbsp; {{ todayLabel }}</span></div>
        <div class="staff-stats">
          <div class="staff-stat stat-green"><span>♙</span><small>Total Staff</small><strong>{{ staff.length }}</strong></div>
          <div class="staff-stat stat-green"><span>✓</span><small>Active Today</small><strong>{{ activeCount }}</strong></div>
          <div class="staff-stat stat-orange"><span>▣</span><small>Pickups Assigned</small><strong>{{ assignedCount }}</strong></div>
          <div class="staff-stat stat-red"><span>▣</span><small>On Leave</small><strong>{{ leaveCount }}</strong></div>
        </div>
        <section class="staff-card">
          <div class="staff-card-title"><div><h2>Staff List</h2><p>View and manage your field operations team</p></div><button class="staff-primary" (click)="addStaff()">＋ Add Staff</button></div>
          <div class="staff-toolbar"><label class="staff-search">⌕ <input [(ngModel)]="search" placeholder="Search by name, email or mobile..." /></label><select [(ngModel)]="status"><option value="">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
          <div class="staff-table-wrap"><div class="staff-table staff-table-head"><span>Name</span><span>Email</span><span>Mobile</span><span>Assigned<br>Pickups</span><span>Status</span><span>Actions</span></div>
          <div class="staff-table" *ngFor="let member of filteredStaff"><span class="staff-person"><b>{{ initialsFor(member.full_name) }}</b><strong>{{ member.full_name || 'Pending Staff' }}</strong></span><span>{{ member.email }}</span><span>{{ member.phone || '—' }}</span><span>{{ member.assigned_pickups || 0 }}</span><span><em [class]="statusClass(member)"></em><label class="staff-status">{{ displayStatus(member) }}</label></span><span class="staff-actions"><button (click)="view(member)">View</button><button (click)="edit(member)">Edit</button><button class="danger" (click)="toggle(member)">{{ member.account_status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}</button><b>⋮</b></span></div></div>
          <p class="staff-empty" *ngIf="!filteredStaff.length">No staff found.</p>
          <div class="staff-table-footer"><span>Showing {{ filteredStaff.length }} of {{ staff.length }} staff</span><div><button disabled>‹</button><button class="current">1</button><button disabled>›</button></div></div>
        </section>
      </section>
    </main>
  </div>`
})
export class AdminStaffPageComponent {
  private readonly api = inject(BusinessService); private readonly auth = inject(AuthService); private readonly router = inject(Router);
  staff: any[] = []; search = ''; status = ''; error = '';
  get initials() { return (this.auth.session?.fullName || 'Admin').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
  get todayLabel() { return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  get filteredStaff() { const q = this.search.trim().toLowerCase(); return this.staff.filter(s => (!this.status || s.account_status === this.status) && (!q || [s.full_name, s.email, s.phone].some(v => String(v || '').toLowerCase().includes(q)))); }
  get activeCount() { return this.staff.filter(s => s.account_status === 'ACTIVE' && s.availability_status !== 'ON_LEAVE').length; }
  get assignedCount() { return this.staff.reduce((total, s) => total + Number(s.assigned_pickups || 0), 0); }
  get leaveCount() { return this.staff.filter(s => s.availability_status === 'ON_LEAVE').length; }
  async ngOnInit() { try { this.staff = await this.api.staff(); } catch { this.error = 'Could not load Staff.'; } }
  initialsFor(name: string) { return (name || 'S').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
  displayStatus(s: any) { if (s.account_status !== 'ACTIVE') return 'Inactive'; if (s.availability_status === 'ON_LEAVE') return 'On Leave'; if (s.availability_status === 'ON_PICKUP') return 'On Pickup'; return 'Available'; }
  statusClass(s: any) { return this.displayStatus(s).toLowerCase().replace(' ', '-'); }
  addStaff() { void this.router.navigateByUrl('/admin/staff/add'); }
  view(member: any) { void this.router.navigate(['/admin/staff', member.id]); }
  edit(member: any) { void this.router.navigate(['/admin/staff', member.id, 'edit']); }
  toggle(member: any) { this.error = 'Staff activation is being connected to the secured Admin API.'; }
  async logout() { await this.auth.logout(); void this.router.navigateByUrl('/'); }
}
