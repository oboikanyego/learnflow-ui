import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  styleUrl: './about.component.css',
  template: `
    <section class="public-info-page page-enter">
      <div class="public-info-hero">
        <span class="eyebrow">About LearnFlow</span>
        <h1>Turn learning plans into visible, accountable progress.</h1>
        <p>LearnFlow is a personal learning operations workspace for people who want more structure than a checklist and less complexity than a full project-management platform.</p>
        <div class="hero-actions">
          <a mat-flat-button routerLink="/register" class="primary-cta">Start learning</a>
          <a mat-stroked-button routerLink="/contact">Contact us</a>
        </div>
      </div>

      <div class="public-info-grid">
        <article><span>01</span><h3>Plan</h3><p>Create learning paths manually, import a spreadsheet, or generate a structured plan with AI.</p></article>
        <article><span>02</span><h3>Schedule</h3><p>Turn lessons into real sessions with dates, durations, reminders and clear priorities.</p></article>
        <article><span>03</span><h3>Execute</h3><p>Move lessons across the board, comment on work items and keep blockers or learning notes visible.</p></article>
        <article><span>04</span><h3>Measure</h3><p>Use completion, scheduled workload, streak and missed-session analytics to understand consistency.</p></article>
      </div>

      <section class="public-info-band">
        <div><span class="eyebrow light">Designed for real learning</span><h2>Built around the way structured work actually gets done.</h2></div>
        <p>Learning Path → Phase → Module → Lesson gives each goal a clear hierarchy, while the board keeps daily execution simple and visible.</p>
      </section>
    </section>
  `
})
export class AboutComponent {}
