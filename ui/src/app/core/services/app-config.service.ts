import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
export interface PublicAppConfig { auth: string; database: string; }
@Injectable({ providedIn: 'root' })
export class AppConfigService { private config?: PublicAppConfig; constructor(private readonly http: HttpClient) {} async load():Promise<void>{this.config=await firstValueFrom(this.http.get<PublicAppConfig>('/api/config'));} get value():PublicAppConfig{if(!this.config)throw new Error('Application configuration has not loaded');return this.config;} }
