import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_INITIALIZER } from '@angular/core';
import { AppConfigService } from './app/core/services/app-config.service';
import { AuthService } from './app/auth/auth.service';
import { authInterceptor } from './app/auth/auth.interceptor';

function initializeApplication(config: AppConfigService, auth: AuthService): () => Promise<void> {
  return async () => { await config.load(); await auth.initialize(); };
}

bootstrapApplication(AppComponent, { providers: [provideHttpClient(withInterceptors([authInterceptor])), provideRouter(routes), provideAnimations(), { provide: APP_INITIALIZER, multi: true, useFactory: initializeApplication, deps: [AppConfigService, AuthService] }] }).catch(console.error);
