import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { ActionDialogComponent } from '../../shared/action-dialog.component';

type GeneratedResponse = { plan: unknown; learningPathId?: string };

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatDialogModule],
  template: `
    <section class="page-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow">AI-assisted planning</span>
          <h1>AI learning planner</h1>
          <p class="muted">Turn a learning goal and preferred schedule into a structured path you can execute.</p>
        </div>
        <div class="lesson-actions">
          <button mat-stroked-button (click)="openPlanner(false)" [disabled]="busy()">Preview plan</button>
          <button mat-flat-button class="primary-cta" (click)="openPlanner(true)" [disabled]="busy()">{{ busy() ? 'Generating…' : 'Generate & save' }}</button>
        </div>
      </div>

      <div class="module">
        <span class="mini-label">Current configuration</span>
        <h3>{{ topic }}</h3>
        <p class="muted">{{ weeks }} weeks · {{ days }} · {{ time }} · starting {{ startDate }}</p>
      </div>

      @if (error()) { <div class="notification unread"><strong>Planner error</strong><span>{{ error() }}</span></div> }
      @if (savedId()) { <div class="notification"><strong>Plan saved successfully.</strong><a [routerLink]="['/learning-paths', savedId()]">Open learning path</a></div> }
      @if (plan()) {
        <div class="section-heading" style="margin-top:30px"><span class="eyebrow">Generated structure</span><h2>Plan preview</h2></div>
        <pre>{{ json() }}</pre>
      }
    </section>
  `
})
export class AiPlannerComponent {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  topic = 'React';
  weeks = 6;
  startDate = new Date().toISOString().slice(0, 10);
  time = '19:00';
  days = 'Monday, Wednesday, Sunday';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly plan = signal<unknown>(null);
  readonly savedId = signal('');

  json(): string { return JSON.stringify(this.plan(), null, 2); }

  openPlanner(save: boolean): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '620px',
      data: {
        eyebrow: save ? 'Generate learning path' : 'Preview learning path',
        title: 'Configure your learning plan',
        description: 'Describe what you want to learn and the weekly rhythm you can realistically maintain.',
        submitLabel: save ? 'Generate & save' : 'Generate preview',
        fields: [
          { key: 'topic', label: 'Topic or learning goal', type: 'text', value: this.topic, required: true },
          { key: 'weeks', label: 'Number of weeks', type: 'number', value: this.weeks, required: true, min: 1 },
          { key: 'startDate', label: 'Start date', type: 'date', value: this.startDate, required: true },
          { key: 'time', label: 'Study time', type: 'time', value: this.time, required: true },
          { key: 'days', label: 'Study days', type: 'text', value: this.days, required: true, hint: 'Example: Monday, Wednesday, Sunday' }
        ]
      }
    });

    ref.afterClosed().subscribe(values => {
      if (!values) return;
      this.topic = String(values.topic).trim();
      this.weeks = Number(values.weeks);
      this.startDate = String(values.startDate);
      this.time = String(values.time);
      this.days = String(values.days);
      this.generate(save);
    });
  }

  private generate(save: boolean): void {
    this.busy.set(true);
    this.error.set('');
    this.savedId.set('');
    this.api.post<object, GeneratedResponse>('/api/v1/ai/generate-plan', {
      topic: this.topic,
      weeks: this.weeks,
      startDate: this.startDate,
      time: this.time,
      days: this.days.split(',').map(day => day.trim()).filter(Boolean),
      durationMinutes: 60,
      save
    }).subscribe({
      next: response => {
        this.plan.set(response.plan);
        this.savedId.set(response.learningPathId ?? '');
        this.busy.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Could not generate a plan');
        this.busy.set(false);
      }
    });
  }
}
