import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface EmailConfig { id?: string; name: string; environment: string; provider: string; smtp_host: string; smtp_port: number; smtp_username: string; smtp_password?: string; from_email: string; from_name?: string; smtp_auth: boolean; smtp_start_tls: boolean; smtp_ssl: boolean; enabled: boolean; notes?: string; }
export interface EmailTemplateType { id?: string; type_key: string; name: string; description?: string; active: boolean; }
export interface EmailTemplate { id?: string; template_type_id?: string; template_type_key?: string; template_type_name?: string; template_key: string; name: string; description?: string; version: number; subject: string; html_content: string; text_content?: string; variables_json?: string; active: boolean; }

@Injectable({providedIn:'root'})
export class EmailAdminService {
  private readonly http=inject(HttpClient); private readonly base='/api/admin/email';
  configs(){return firstValueFrom(this.http.get<EmailConfig[]>(`${this.base}/configurations`,{withCredentials:true}));}
  saveConfig(value: EmailConfig){return firstValueFrom(this.http.post<EmailConfig>(`${this.base}/configurations`,value,{withCredentials:true}));}
  toggleConfig(id:string,enabled:boolean){return firstValueFrom(this.http.patch<EmailConfig>(`${this.base}/configurations/${id}/status`,{enabled},{withCredentials:true}));}
  deleteConfig(id:string){return firstValueFrom(this.http.delete(`${this.base}/configurations/${id}`,{withCredentials:true}));}
  templates(){return firstValueFrom(this.http.get<EmailTemplate[]>(`${this.base}/templates`,{withCredentials:true}));}
  templateTypes(){return firstValueFrom(this.http.get<EmailTemplateType[]>(`${this.base}/template-types`,{withCredentials:true}));}
  saveTemplateType(value: EmailTemplateType){return firstValueFrom(this.http.post<EmailTemplateType>(`${this.base}/template-types`,value,{withCredentials:true}));}
  saveTemplate(value: EmailTemplate){return firstValueFrom(this.http.post<EmailTemplate>(`${this.base}/templates`,value,{withCredentials:true}));}
  toggleTemplate(id:string,active:boolean){return firstValueFrom(this.http.patch<EmailTemplate>(`${this.base}/templates/${id}/status`,{active},{withCredentials:true}));}
  deleteTemplate(id:string){return firstValueFrom(this.http.delete(`${this.base}/templates/${id}`,{withCredentials:true}));}
}
