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
  <div class="staff-setup-page"><header class="setup-top"><a routerLink="/admin/staff" class="setup-brand"><span>♻</span> Scrap<span>Flow</span></a><div>Admin &nbsp;•&nbsp; Staff Management</div></header>
    <div class="setup-layout"><section class="setup-hero"><div><p class="staff-eyebrow">TEAM MANAGEMENT</p><h1>Create your<br><span>Staff account</span></h1><p>Invite a trusted pickup team member and give them everything they need to start managing collections.</p><i></i></div><div class="setup-hero-note">♻ <span>Staff accounts are created only by Admin.<br>Staff cannot self-register.</span></div></section>
    <section class="setup-card"><a routerLink="/admin/staff" class="setup-back">← Back to Staff</a><div class="setup-icon">♙</div><h2>Add Staff</h2><p class="setup-subtitle">Create a new staff account for your pickup team.</p><div class="alert error" *ngIf="error">{{ error }}</div><div class="alert success" *ngIf="token">Invitation created. Development token: {{ token }}</div>
      <form (ngSubmit)="submit()"><label>Full Name <b>*</b><input name="name" [(ngModel)]="form.fullName" required placeholder="Enter full name"></label><label>Work Email <b>*</b><input type="email" name="email" [(ngModel)]="form.email" required placeholder="name@scrapflow.in"></label><div class="setup-grid"><label>Mobile Number <b>*</b><input name="mobile" [(ngModel)]="form.mobile" required placeholder="+91 98765 43210"></label><label>Service Area <b>*</b><input name="area" [(ngModel)]="form.serviceArea" required placeholder="Koramangala, Bengaluru"></label></div><div class="account-choice"><strong>Account setup</strong><label><input type="radio" name="setup" value="invite" [(ngModel)]="form.setup"> Send invite link <small>Staff creates a password securely.</small></label><label><input type="radio" name="setup" value="temporary" [(ngModel)]="form.setup"> Temporary password <small>Staff must change it on first login.</small></label><label *ngIf="form.setup === 'temporary'" class="temporary-password">Temporary Password <b>*</b><input type="password" name="temporaryPassword" [(ngModel)]="form.temporaryPassword" minlength="8" required placeholder="Minimum 8 characters"><small>This password is stored as a hash and never logged.</small></label></div><label class="checkbox-label"><input type="checkbox" name="active" [(ngModel)]="form.active"> <span><strong>Active account</strong><small>Staff member can log in and receive pickup assignments.</small></span></label><button class="setup-submit" [disabled]="saving">{{ saving ? 'Creating...' : (form.setup === 'temporary' ? 'Create Staff Account  →' : 'Create Staff Invitation  →') }}</button></form></section></div>
  </div>`
})
export class AdminAddStaffPageComponent {
  private readonly api = inject(BusinessService); private readonly auth = inject(AuthService); private readonly router = inject(Router);
  form: any = { fullName: '', email: '', mobile: '', serviceArea: '', setup: 'invite', temporaryPassword: '', active: true }; saving = false; error = ''; token = '';
  async submit() { this.saving = true; this.error = ''; this.token = ''; try { const result = await this.api.inviteStaff(this.form.email, { fullName: this.form.fullName, mobileNumber: this.form.mobile, serviceArea: this.form.serviceArea, setupMode: this.form.setup, temporaryPassword: this.form.temporaryPassword }); this.token = result.token || ''; if (result.accountCreated) this.error = ''; } catch (e) { this.error = this.auth.errorMessage(e, 'Could not create Staff account.'); } finally { this.saving = false; } }
}
