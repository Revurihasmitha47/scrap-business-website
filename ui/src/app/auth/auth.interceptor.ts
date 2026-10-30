import { HttpInterceptorFn } from '@angular/common/http';
export const authInterceptor: HttpInterceptorFn = (request, next) => request.url.startsWith('/api/') ? next(request.clone({ withCredentials: true })) : next(request);
