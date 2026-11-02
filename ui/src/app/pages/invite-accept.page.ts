import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({ standalone: true, imports: [CommonModule, FormsModule, RouterLink], template: `
  <section class="auth-page"><div class="auth-layout"><div class="auth-visual admin-visual"><p class="eyebrow light">STAFF ACCESS</p><h1>Your collection workspace is ready.</h1><p>Activate the invitation from your Admin and start managing assigned pickups.</p></div><div class="auth-card"><p class="eyebrow">ACCEPT INVITATION</p><h2>Set up Staff access</h2><p class="subcopy">Create your name and password to activate this account.</p><div class="alert error" *ngIf="error">{{error}}</div><form (ngSubmit)="submit(form)" #form="ngForm"><label>Invitation token<input name="token" [(ngModel)]="token" required placeholder="Paste invitation token"></label><label>Full name<input name="fullName" [(ngModel)]="fullName" required placeholder="Your full name"></label><label>Password<input name="password" type="password" [(ngModel)]="password" required minlength="8" placeholder="At least 8 characters"></label><button class="primary-button full" [disabled]="busy||form.invalid">{{busy?'Activating…':'Activate Staff account'}}</button></form><div class="auth-footer"><a routerLink="/sign-in">Already activated? Sign in</a><a class="back-link" routerLink="/">← Back home</a></div></div></div></section>
` })
export class InviteAcceptPageComponent {
  private readonly auth=inject(AuthService); private readonly router=inject(Router); private readonly route=inject(ActivatedRoute); token=this.route.snapshot.queryParamMap.get('token')||'';fullName='';password='';busy=false;error='';
  async submit(form:NgForm){if(form.invalid||this.busy)return;this.busy=true;this.error='';try{await this.auth.acceptInvite(this.token,this.fullName,this.password);await this.router.navigateByUrl('/dashboard');}catch(e){this.error=this.auth.errorMessage(e,'Invitation could not be accepted.');}finally{this.busy=false;}}
}
