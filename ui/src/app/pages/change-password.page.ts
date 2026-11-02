import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({standalone:true,imports:[CommonModule,FormsModule],template:`<section class="auth-page"><div class="auth-card change-password-card"><p class="eyebrow">SECURITY REQUIRED</p><h2>Change your password</h2><p class="subcopy">Your Admin provided a temporary password. Choose a new password before continuing.</p><div class="alert error" *ngIf="error">{{error}}</div><div class="alert success" *ngIf="message">{{message}}</div><form (ngSubmit)="save()"><label>Current password<input type="password" name="current" [(ngModel)]="current" required></label><label>New password<input type="password" name="next" [(ngModel)]="next" required minlength="8"></label><label>Confirm new password<input type="password" name="confirm" [(ngModel)]="confirm" required minlength="8"></label><button class="primary-button full" [disabled]="saving">{{saving?'Saving...':'Change password'}}</button></form></div></section>`})
export class ChangePasswordPageComponent { private readonly http=inject(HttpClient);private readonly auth=inject(AuthService);private readonly router=inject(Router);current='';next='';confirm='';saving=false;error='';message='';async save(){this.error='';if(this.next.length<8){this.error='New password must contain at least 8 characters.';return}if(this.next!==this.confirm){this.error='New passwords do not match.';return}this.saving=true;try{const session=await firstValueFrom(this.http.post<any>('/api/auth/change-password',{currentPassword:this.current,newPassword:this.next},{withCredentials:true}));this.auth.setSession(session);this.message='Password changed successfully.';setTimeout(()=>void this.router.navigateByUrl(session.accountType==='STAFF'?'/staff/my-pickups':session.accountType==='ADMIN'?'/admin/dashboard':'/dashboard'),300);}catch(e){this.error=this.auth.errorMessage(e,'Could not change password.');}finally{this.saving=false;}}
}
