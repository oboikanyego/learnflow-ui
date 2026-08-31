import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Analytics } from '../../models/learning.models';

@Component({
  standalone: true,
  template: `
    <section class="page-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow">Performance overview</span>
          <h1>Dashboard</h1>
          <p class="muted">A clear view of learning momentum, delivery and missed commitments.</p>
        </div>
        @if (stats(); as s) {
          <div class="status-pill status-active">{{ s.completionRate >= 70 ? 'Healthy progress' : 'Building momentum' }}</div>
        }
      </div>

      @if (stats(); as s) {
        <div class="stats stagger-group">
          <article><span class="mini-label">Portfolio</span><strong>{{ s.learningPaths }}</strong><span>Learning paths</span></article>
          <article><span class="mini-label">Workload</span><strong>{{ s.totalLessons }}</strong><span>Total lessons</span></article>
          <article><span class="mini-label">Delivery</span><strong>{{ s.completionRate }}%</strong><span>Completion rate</span></article>
          <article><span class="mini-label">Investment</span><strong>{{ s.completedHours }}h</strong><span>Completed hours</span></article>
          <article><span class="mini-label">Consistency</span><strong>{{ s.currentStreakDays }}</strong><span>Day streak</span></article>
          <article><span class="mini-label">Attention</span><strong>{{ s.missedLessons }}</strong><span>Missed lessons</span></article>
        </div>

        <div class="feature-grid" style="padding:28px 0 0">
          <article class="feature-card">
            <span class="feature-index">SCHEDULED</span>
            <h3>{{ s.scheduledLessons }} lessons committed</h3>
            <p>Your scheduled workload represents the lessons with a protected date and time.</p>
          </article>
          <article class="feature-card">
            <span class="feature-index">COMPLETED</span>
            <h3>{{ s.completedLessons }} lessons delivered</h3>
            <p>Completed lessons are the strongest indicator that your learning plan is turning into real progress.</p>
          </article>
          <article class="feature-card">
            <span class="feature-index">REVIEW</span>
            <h3>{{ s.missedLessons ? 'Recover missed work' : 'No missed work' }}</h3>
            <p>{{ s.missedLessons ? 'Use the board to reschedule missed sessions and protect the next commitment.' : 'Your current plan has no missed sessions requiring attention.' }}</p>
          </article>
        </div>
      } @else {
        <div class="module"><p class="muted">Loading your learning analytics…</p></div>
      }
    </section>
  `
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly stats = signal<Analytics | null>(null);
  ngOnInit(): void { this.api.get<Analytics>('/api/v1/analytics').subscribe(value => this.stats.set(value)); }
}
