import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SignInComponent } from './sign-in.component';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SignInComponent],
  template: `
    <section class="hero home-hero">
      <div class="hero-copy"><p class="eyebrow">THE SMARTER WAY TO RECYCLE</p><h1>Give your scrap a second life.</h1><p class="lead">Schedule a pickup, follow every step, and get a fair value from trusted local businesses.</p><div class="hero-actions"><a class="button" routerLink="/home-seller">Request a pickup <span>↗</span></a><a class="text-link" href="#how-it-works">See how it works ↓</a></div><div class="trust-row"><span>✓ Transparent rates</span><span>✓ Doorstep pickup</span><span>✓ Secure records</span></div></div>
      <div class="hero-visual"><div class="sun"></div><div class="hero-stat"><span class="tiny-label">YOUR IMPACT</span><strong>♻</strong><b>Small steps.<br>Big change.</b><span>Every pickup keeps material in motion.</span></div><div class="leaf leaf-one">✦</div><div class="leaf leaf-two">✦</div></div>
    </section>
    <section class="section rates-section"><div class="section-heading"><div><p class="eyebrow">CURRENT SCRAP RATES</p><h2>Know what your material is worth.</h2></div><span class="muted-chip">Live rates from your selected business</span></div><div class="empty-rate"><div class="empty-icon">◎</div><div><h3>Rates will appear here</h3><p>Choose a scrap business or sign in to see its latest approved rates. No sample prices are shown as real data.</p></div><span class="status-badge">Awaiting API</span></div></section>
    <section class="section how-section" id="how-it-works"><div class="section-heading"><div><p class="eyebrow">HOW IT WORKS</p><h2>From clutter to clean, in three steps.</h2></div><p class="section-note">A simple experience for sellers and the teams who serve them.</p></div><div class="steps"><article><span class="step-no">01</span><h3>Tell us what you have</h3><p>Select a material, estimate its quantity, and share your preferred pickup time.</p></article><article><span class="step-no">02</span><h3>We collect responsibly</h3><p>Your pickup team confirms the details, weighs the material, and records the collection.</p></article><article><span class="step-no">03</span><h3>See the final value</h3><p>Once the actual weight is confirmed, your final amount appears in your history.</p></article></div></section>
    <section class="cta-band"><div><p class="eyebrow light">READY WHEN YOU ARE</p><h2>Make space. Make an impact.</h2></div><a class="button button-light" routerLink="/home-seller">Start a pickup <span>↗</span></a></section>
    <section class="signin-section" id="sign-in"><app-sign-in></app-sign-in></section>
  `
})
export class HomePageComponent {}
