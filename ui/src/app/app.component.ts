import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({ selector: 'app-root', standalone: true, imports: [CommonModule, RouterLink, RouterOutlet], templateUrl: './app.component.html' })
export class AppComponent { readonly auth=inject(AuthService);private readonly router=inject(Router);menu=false;get isAdminRoute(){return this.router.url.startsWith('/admin/');}constructor(){void this.auth.initialize();}async signOut(){this.menu=false;await this.auth.logout();await this.router.navigateByUrl('/');}}
