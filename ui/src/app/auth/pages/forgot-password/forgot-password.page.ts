import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({ selector: 'app-forgot-password-page', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './forgot-password.page.html', styleUrls: ['./forgot-password.page.scss'] })
export class ForgotPasswordPageComponent {
  readonly auth = inject(AuthService); readonly router = inject(Router);
  email = ''; loading = false; error = ''; message = '';
  async submit(): Promise<void> { this.error = ''; this.message = ''; this.loading = true; try { const result = await this.auth.forgotPassword(this.email.trim()); this.message = result.message; } catch (error) { this.error = this.auth.errorMessage(error, 'Could not request password reset.'); } finally { this.loading = false; } }
}
