import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
export interface LocalSession { user: { email: string }; userId: string; }
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject=new BehaviorSubject<LocalSession|null>(null); readonly session$=this.sessionSubject.asObservable();
  constructor(private readonly http:HttpClient){}
  async initialize():Promise<void>{try{const v=await firstValueFrom(this.http.get<{userId:string;email:string}>('/api/auth/session',{withCredentials:true}));this.sessionSubject.next({user:{email:v.email},userId:v.userId});}catch{this.sessionSubject.next(null);}}
  get currentUser():{email:string}|null{return this.sessionSubject.value?.user??null;}
  async signIn(email:string,password:string):Promise<void>{const v=await firstValueFrom(this.http.post<{userId:string;email:string}>('/api/auth/login',{email,password},{withCredentials:true}));this.sessionSubject.next({user:{email:v.email},userId:v.userId});}
  async signUp(email:string,password:string,accountType:'HOME_SELLER'|'BULK_SELLER',fullName:string):Promise<void>{const v=await firstValueFrom(this.http.post<{userId:string;email:string}>('/api/auth/register',{email,password,accountType,fullName},{withCredentials:true}));this.sessionSubject.next({user:{email:v.email},userId:v.userId});}
  async signOut():Promise<void>{await firstValueFrom(this.http.post('/api/auth/logout',{}, {withCredentials:true}));this.sessionSubject.next(null);}
}
