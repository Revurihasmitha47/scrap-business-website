import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({ standalone: true, imports: [CommonModule, FormsModule, RouterLink], template: `
  <section class="auth-page"><div class="auth-layout"><div class="auth-visual login-visual"><p class="eyebrow light">WELCOME BACK</p><h1>Pick up where you left off.</h1><p>Sign in to manage pickups, follow progress, and keep your ScrapFlow workspace organized.</p></div><div class="auth-card"><p class="eyebrow">SECURE SIGN IN</p><h2>Welcome back</h2><p class="subcopy">Your role decides which workspace opens next.</p><div class="alert error" *ngIf="error">{{ error }}</div><form (ngSubmit)="submit(form)" #form="ngForm" novalidate><label>Email address<input name="email" type="email" [(ngModel)]="email" required email autocomplete="email" placeholder="you@example.com"></label><label>Password<div class="password-wrap"><input name="password" [type]="showPassword?'text':'password'" [(ngModel)]="password" required minlength="8" autocomplete="current-password" placeholder="Your password"><button type="button" (click)="showPassword=!showPassword">{{showPassword?'Hide':'Show'}}</button></div></label><button class="primary-button full" [disabled]="busy || form.invalid">{{busy?'Signing in…':'Sign in securely'}}</button></form><div class="auth-footer">New to ScrapFlow? <a routerLink="/register">Create seller account</a><a class="back-link" routerLink="/">← Back home</a></div></div></div></section>
` })
export class SignInPageComponent {
  private readonly auth=inject(AuthService); private readonly router=inject(Router); email='';password='';showPassword=false;busy=false;error='';
  async submit(form:NgForm):Promise<void>{if(form.invalid||this.busy){form.control.markAllAsTouched();return;}this.busy=true;this.error='';try{await this.auth.login(this.email.trim(),this.password);await this.router.navigateByUrl(this.auth.session?.accountType==='ADMIN'?'/admin/dashboard':'/dashboard');}catch(e){this.error=this.auth.errorMessage(e,'Sign-in failed. Please check your credentials.');}finally{this.busy=false;}}
}
