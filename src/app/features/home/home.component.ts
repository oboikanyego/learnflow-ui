import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="home-page page-enter">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Learning accountability, simplified</span>
          <h1>Turn ambitious learning goals into work you actually complete.</h1>
          <p class="hero-lead">
            LearnFlow gives professionals a structured workspace to plan lessons, schedule focused study sessions,
            track progress and stay accountable without the complexity of a traditional project-management tool.
          </p>
          <div class="hero-actions">
            <a mat-flat-button routerLink="/register" class="primary-cta">Start learning with structure</a>
            <a mat-stroked-button routerLink="/login">Sign in</a>
          </div>
          <div class="trust-row">
            <span>Structured plans</span><span>Smart scheduling</span><span>Progress visibility</span>
          </div>
        </div>

        <div class="hero-product-card float-in">
          <div class="product-card-head">
            <div><span class="mini-label">CURRENT PATH</span><strong>React Fundamentals</strong></div>
            <span class="status-pill status-active">On track</span>
          </div>
          <div class="progress-panel">
            <div class="progress-copy"><span>Weekly progress</span><strong>68%</strong></div>
            <div class="progress-track"><span style="width:68%"></span></div>
          </div>
          <div class="preview-grid">
            <article><span>12</span><small>Lessons</small></article>
            <article><span>8</span><small>Completed</small></article>
            <article><span>5</span><small>Day streak</small></article>
          </div>
          <div class="next-session">
            <span class="mini-label">NEXT SESSION</span>
            <strong>Managing component state</strong>
            <small>Wednesday · 19:00 · 60 min</small>
          </div>
        </div>
      </div>

      <div class="section-heading centered">
        <span class="eyebrow">One focused workflow</span>
        <h2>From learning intention to measurable progress.</h2>
        <p>Everything is designed around making your next learning action obvious.</p>
      </div>

      <div class="feature-grid stagger-group">
        <article class="feature-card"><span class="feature-index">01</span><h3>Plan clearly</h3><p>Create learning paths with phases, modules and lessons, or import a structured Excel plan in seconds.</p></article>
        <article class="feature-card"><span class="feature-index">02</span><h3>Schedule intentionally</h3><p>Give lessons a date, time and duration so learning becomes protected work rather than an open-ended goal.</p></article>
        <article class="feature-card"><span class="feature-index">03</span><h3>Work the board</h3><p>Move lessons through backlog, scheduled, in progress and completed states in a familiar Jira-inspired view.</p></article>
        <article class="feature-card"><span class="feature-index">04</span><h3>Stay accountable</h3><p>Use reminders, missed-session tracking, streaks and completion analytics to see whether the plan is working.</p></article>
        <article class="feature-card"><span class="feature-index">05</span><h3>Plan with AI</h3><p>Generate structured learning plans from a goal and schedule, then save them directly into your workspace.</p></article>
        <article class="feature-card"><span class="feature-index">06</span><h3>Build evidence</h3><p>Keep resources and progress close to the lesson so learning can translate into portfolio-ready proof of work.</p></article>
      </div>

      <section class="workflow-band">
        <div><span class="eyebrow light">How LearnFlow works</span><h2>A simple operating rhythm for continuous learning.</h2></div>
        <div class="workflow-steps">
          <div><span>1</span><p><strong>Create or import</strong><small>Define the learning outcome.</small></p></div>
          <div><span>2</span><p><strong>Schedule sessions</strong><small>Commit time to the plan.</small></p></div>
          <div><span>3</span><p><strong>Execute lessons</strong><small>Move work through the board.</small></p></div>
          <div><span>4</span><p><strong>Review progress</strong><small>Use analytics to adjust.</small></p></div>
        </div>
      </section>

      <section class="home-cta">
        <div><span class="eyebrow">Build consistency</span><h2>Your learning plan should behave like a real project.</h2><p>Give it milestones, deadlines, visibility and a system that keeps you moving.</p></div>
        <a mat-flat-button routerLink="/register" class="primary-cta">Create your workspace</a>
      </section>
    </section>
  `
})
export class HomeComponent {}
