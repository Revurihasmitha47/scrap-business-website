import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({ selector: 'app-root', standalone: true, imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet], templateUrl: './app.component.html' })
export class AppComponent {
  readonly auth = inject(AuthService);
  menuOpen = false;
  async signOut(): Promise<void> { await this.auth.signOut(); this.menuOpen = false; }
}
