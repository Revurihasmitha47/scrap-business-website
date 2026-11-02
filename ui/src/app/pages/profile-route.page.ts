import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({standalone:true,template:''})
export class ProfileRoutePageComponent {
  private readonly auth=inject(AuthService); private readonly router=inject(Router);
  ngOnInit(){const role=this.auth.session?.accountType;void this.router.navigateByUrl(role==='HOME_SELLER'||role==='BULK_SELLER'?'/seller/profile':'/profile/details');}
}
