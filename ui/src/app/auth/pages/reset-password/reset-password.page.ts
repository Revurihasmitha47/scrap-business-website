import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({ selector: 'app-reset-password-page', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './reset-password.page.html', styleUrls: ['./reset-password.page.scss'] })
export class ResetPasswordPageComponent implements OnInit {
  readonly auth = inject(AuthService); readonly route = inject(ActivatedRoute); readonly router = inject(Router);
  token = ''; password = ''; confirm = ''; showPassword = false; showConfirmPassword = false; loading = false; error = ''; message = '';
  ngOnInit(): void { this.token = this.route.snapshot.queryParamMap.get('token') || ''; }
  async submit(): Promise<void> { this.error = ''; if (!this.token) { this.error = 'Reset token is missing.'; return; } if (this.password.length < 8) { this.error = 'Password must contain at least 8 characters.'; return; } if (this.password !== this.confirm) { this.error = 'Passwords do not match.'; return; } this.loading = true; try { const result = await this.auth.resetPassword(this.token, this.password); this.message = result.message; setTimeout(() => void this.router.navigateByUrl('/sign-in'), 1000); } catch (error) { this.error = this.auth.errorMessage(error, 'Could not reset password.'); } finally { this.loading = false; } }
}
