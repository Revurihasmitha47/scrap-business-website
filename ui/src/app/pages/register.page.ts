import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="register-page">
      <div class="register-shell">
        <div class="register-intro">
          <p class="eyebrow">CREATE YOUR SELLER ACCOUNT</p>
          <h1>Make room for what comes next.</h1>
          <p class="register-lead">Create a ScrapFlow workspace to request pickups, follow progress, and keep your scrap records in one place.</p>
          <div class="register-benefits">
            <div><span>01</span><p><strong>Start simply</strong><small>Your pickup address is collected only when you make a request.</small></p></div>
            <div><span>02</span><p><strong>Choose your path</strong><small>Register as a Home Seller or Bulk Seller today.</small></p></div>
            <div><span>03</span><p><strong>Stay in control</strong><small>Secure sign-in keeps your workspace private.</small></p></div>
          </div>
        </div>

        <div class="register-card">
          <div class="register-card-heading"><div><h2>Set up your account</h2><p>It only takes a minute to get started.</p></div><span class="register-step">1 / 1</span></div>
          <div class="register-alert register-alert-error" *ngIf="error" role="alert"><span>!</span><p>{{ error }}</p></div>
          <div class="register-alert register-alert-success" *ngIf="success" role="status"><span>✓</span><p>{{ success }}</p></div>

          <form (ngSubmit)="submit(form)" #form="ngForm" novalidate>
            <div class="register-grid">
              <div class="field field-wide" [class.field-invalid]="nameModel.invalid && (nameModel.touched || form.submitted)">
                <label for="fullName">Full name <span>*</span></label>
                <input id="fullName" name="fullName" [(ngModel)]="fullName" #nameModel="ngModel" required minlength="2" autocomplete="name" placeholder="e.g. Ananya Rao" [attr.aria-invalid]="nameModel.invalid && (nameModel.touched || form.submitted)">
                <small class="field-error" *ngIf="nameModel.invalid && (nameModel.touched || form.submitted)">Please enter your full name.</small>
              </div>
              <div class="field field-wide" [class.field-invalid]="emailModel.invalid && (emailModel.touched || form.submitted)">
                <label for="email">Email address <span>*</span></label>
                <input id="email" name="email" type="email" [(ngModel)]="email" #emailModel="ngModel" required email autocomplete="email" placeholder="you@example.com" [attr.aria-invalid]="emailModel.invalid && (emailModel.touched || form.submitted)">
                <small class="field-error" *ngIf="emailModel.invalid && (emailModel.touched || form.submitted)">Enter a valid email address.</small>
              </div>
            </div>

            <div class="field" [class.field-invalid]="passwordModel.invalid && (passwordModel.touched || form.submitted)">
              <label for="password">Password <span>*</span></label>
              <div class="password-control"><input id="password" name="password" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" #passwordModel="ngModel" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters" [attr.aria-invalid]="passwordModel.invalid && (passwordModel.touched || form.submitted)"><button type="button" class="password-toggle" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">{{ showPassword ? 'Hide' : 'Show' }}</button></div>
              <div class="password-hint"><span class="strength-bars"><i [class.on]="password.length >= 1"></i><i [class.on]="password.length >= 6"></i><i [class.on]="password.length >= 8"></i></span><span>{{ passwordHint }}</span></div>
              <small class="field-error" *ngIf="passwordModel.invalid && (passwordModel.touched || form.submitted)">Use at least 8 characters.</small>
            </div>

            <div class="field" [class.field-invalid]="confirmPassword && password !== confirmPassword">
              <label for="confirmPassword">Confirm password <span>*</span></label>
              <div class="password-control"><input id="confirmPassword" name="confirmPassword" [type]="showConfirmPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword" #confirmModel="ngModel" required autocomplete="new-password" placeholder="Re-enter your password" [attr.aria-invalid]="confirmPassword && password !== confirmPassword"><button type="button" class="password-toggle" (click)="showConfirmPassword = !showConfirmPassword" [attr.aria-label]="showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'">{{ showConfirmPassword ? 'Hide' : 'Show' }}</button></div>
              <small class="field-error" *ngIf="confirmPassword && password !== confirmPassword">Passwords do not match.</small>
            </div>

            <fieldset class="account-choice"><legend>Account type <span>*</span></legend><div class="account-options"><label class="account-option" [class.selected]="accountType === 'HOME_SELLER'"><input type="radio" name="accountType" value="HOME_SELLER" [(ngModel)]="accountType"><span><strong>Home Seller</strong><small>For occasional household scrap pickups.</small></span><b>✓</b></label><label class="account-option" [class.selected]="accountType === 'BULK_SELLER'"><input type="radio" name="accountType" value="BULK_SELLER" [(ngModel)]="accountType"><span><strong>Bulk Seller</strong><small>For regular or larger-volume collections.</small></span><b>✓</b></label></div></fieldset>
            <div class="bulk-note" *ngIf="accountType === 'BULK_SELLER'"><span>i</span><p><strong>Bulk profile details come later.</strong><br>Business name, GSTIN, and estimated quantity are not saved by the current registration API. You can create your account now; those fields will be added when backend support is available.</p></div>

            <button class="button full register-submit" type="submit" [disabled]="busy || form.invalid || password !== confirmPassword">{{ busy ? 'Creating your account…' : 'Create seller account' }}<span *ngIf="busy" class="button-spinner" aria-hidden="true"></span></button>
            <p class="form-footnote">By continuing, you agree to use ScrapFlow responsibly and keep your account details accurate.</p>
          </form>
          <div class="register-links"><span>Already have an account?</span><a routerLink="/" fragment="sign-in">Sign in</a><a routerLink="/" class="home-link">← Back to home</a></div>
        </div>
      </div>
    </section>
  `
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  fullName = ''; email = ''; password = ''; confirmPassword = '';
  accountType: 'HOME_SELLER' | 'BULK_SELLER' = 'HOME_SELLER';
  showPassword = false; showConfirmPassword = false; busy = false; error = ''; success = '';
  get passwordHint(): string { if (!this.password) return 'Use 8 or more characters'; if (this.password.length < 6) return 'A little more length will help'; if (this.password.length < 8) return 'Almost there — add a few more'; return 'Good password length'; }
  async submit(form: NgForm): Promise<void> {
    if (form.invalid || this.password !== this.confirmPassword || this.busy) { form.control.markAllAsTouched(); return; }
    this.busy = true; this.error = ''; this.success = '';
    try { await this.auth.signUp(this.email.trim(), this.password, this.accountType, this.fullName.trim()); this.success = 'Account created successfully. Your workspace is ready.'; }
    catch (e) { this.error = e instanceof Error ? e.message : 'Registration failed. Please check your details and try again.'; }
    finally { this.busy = false; }
  }
}
