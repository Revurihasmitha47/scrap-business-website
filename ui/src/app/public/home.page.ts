import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-shell">
      <div class="hero-copy">
        <p class="eyebrow">THE SMARTER WAY TO RECYCLE</p>
        <h1>Give your scrap a second life.</h1>
        <p class="hero-lead">
          ScrapFlow connects sellers, collection teams, and scrap businesses in
          one clear workspace.
        </p>
        <div class="hero-actions">
          <a class="primary-button" routerLink="/register"
            >Create seller account <span>↗</span></a
          ><a class="text-link" routerLink="/admin/register"
            >Set up Admin access</a
          >
        </div>
        <div class="trust-row">
          <span>✓ Transparent rates</span><span>✓ Doorstep pickup</span
          ><span>✓ Secure records</span>
        </div>
      </div>
      <div class="hero-art">
        <div class="art-orbit"></div>
        <div class="art-card">
          <span class="tiny-label">SCRAPFLOW</span
          ><strong>Responsible recovery.</strong
          ><small>Simple for sellers. Clear for teams.</small>
        </div>
        <span class="art-leaf leaf-a">✦</span
        ><span class="art-leaf leaf-b">✦</span>
      </div>
    </section>
    <section class="feature-strip">
      <article>
        <span>01</span>
        <h3>Register your way</h3>
        <p>Home and Bulk Sellers have a focused registration path.</p>
      </article>
      <article>
        <span>02</span>
        <h3>Keep it moving</h3>
        <p>Follow every pickup from request to collection.</p>
      </article>
      <article>
        <span>03</span>
        <h3>Know the value</h3>
        <p>See the right rates and final amount clearly.</p>
      </article>
    </section>
  `,
})
export class HomePageComponent {}
