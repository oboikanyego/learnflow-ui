import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface AiPlanJob {
  _id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  input: {
    topic: string;
    weeks: number;
    days: string[];
    time: string;
    durationMinutes: number;
    startDate: string;
    save: boolean;
  };
  learningPathId?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface RetryResponse {
  jobId: string;
  status: string;
  message: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="page-enter requests-page">
      <div class="page-head">
        <div>
          <span class="eyebrow">AI operations</span>
          <h1>AI requests</h1>
          <p class="muted">Track every learning-plan generation, reopen successful results and retry only the requests that failed.</p>
        </div>
        <div class="lesson-actions">
          <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">Refresh</button>
          <a mat-flat-button class="primary-cta" routerLink="/ai-planner">New AI plan</a>
        </div>
      </div>

      <div class="summary-grid">
        <article><strong>{{ count('COMPLETED') }}</strong><span>Completed</span></article>
        <article><strong>{{ count('FAILED') }}</strong><span>Failed</span></article>
        <article><strong>{{ count('PROCESSING') + count('QUEUED') }}</strong><span>In progress</span></article>
        <article><strong>{{ jobs().length }}</strong><span>Total requests</span></article>
      </div>

      @if (notice()) { <div class="notification"><strong>{{ notice() }}</strong></div> }
      @if (error()) { <div class="notification unread"><strong>{{ error() }}</strong></div> }

      <section class="table-card">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Learning goal</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Requested</th>
                <th>Finished</th>
                <th class="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (job of jobs(); track job._id) {
                <tr>
                  <td>
                    <div class="goal-cell">
                      <strong>{{ job.input.topic }}</strong>
                      <span>{{ job.input.weeks }} weeks · {{ job.input.durationMinutes }} min sessions</span>
                      @if (job.status === 'FAILED' && job.errorMessage) { <small>{{ friendlyError(job.errorMessage) }}</small> }
                    </div>
                  </td>
                  <td><span class="status-chip" [class]="'status-chip ' + statusClass(job.status)">{{ statusLabel(job.status) }}</span></td>
                  <td><span class="schedule-copy">{{ job.input.days.join(', ') }}<br><small>{{ job.input.time }}</small></span></td>
                  <td>{{ formatDateTime(job.createdAt) }}</td>
                  <td>{{ job.completedAt ? formatDateTime(job.completedAt) : '—' }}</td>
                  <td class="actions-col">
                    <div class="row-actions">
                      @if (job.status === 'COMPLETED') {
                        <button mat-stroked-button type="button" (click)="view(job)">View</button>
                      } @else if (job.status === 'FAILED') {
                        <button mat-flat-button class="primary-cta compact" type="button" (click)="retry(job)" [disabled]="retryingId() === job._id">
                          {{ retryingId() === job._id ? 'Retrying…' : 'Retry' }}
                        </button>
                      } @else {
                        <span class="working-label">Working…</span>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-cell">No AI generation requests yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .requests-page{max-width:1280px;margin:0 auto}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 22px}.summary-grid article{padding:18px;border:1px solid #dcdfe4;border-radius:12px;background:#fff;display:flex;flex-direction:column;box-shadow:0 4px 14px rgba(9,30,66,.04)}.summary-grid strong{font-size:1.55rem;color:#172b4d}.summary-grid span{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#626f86;font-weight:800}.table-card{border:1px solid #dcdfe4;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 10px 28px rgba(9,30,66,.06)}.table-scroll{overflow:auto}table{width:100%;border-collapse:collapse;min-width:920px}th{padding:12px 14px;text-align:left;background:#f7f8f9;color:#626f86;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #dcdfe4}td{padding:14px;border-bottom:1px solid #eceff3;color:#44546f;font-size:.78rem;vertical-align:middle}tbody tr:hover{background:#fafbfc}.goal-cell{display:flex;flex-direction:column;gap:3px;max-width:340px}.goal-cell strong{color:#172b4d;font-size:.84rem}.goal-cell span{color:#626f86;font-size:.7rem}.goal-cell small{color:#ae2e24;font-size:.68rem;line-height:1.35;margin-top:3px}.status-chip{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:.65rem;font-weight:850}.status-completed{background:#dcfff1;color:#216e4e}.status-failed{background:#ffebe6;color:#ae2e24}.status-processing{background:#e9f2ff;color:#0c66e4}.status-queued{background:#f3f0ff;color:#5e4db2}.schedule-copy{line-height:1.45}.schedule-copy small{color:#7a869a}.actions-col{text-align:right}.row-actions{display:flex;justify-content:flex-end;align-items:center}.compact{min-height:32px!important;padding-inline:12px!important}.working-label{color:#7a869a;font-size:.7rem;font-weight:750}.empty-cell{text-align:center!important;padding:36px!important;color:#7a869a!important}@media(max-width:820px){.summary-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.summary-grid{grid-template-columns:1fr 1fr}.page-head{align-items:flex-start;flex-direction:column}}
  `]
})
export class AiRequestsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly jobs = signal<AiPlanJob[]>([]);
  readonly loading = signal(false);
  readonly retryingId = signal('');
  readonly notice = signal('');
  readonly error = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get<AiPlanJob[]>('/api/v1/ai/plan-jobs').subscribe({
      next: jobs => { this.jobs.set(jobs); this.loading.set(false); },
      error: err => { this.error.set(err?.error?.message ?? 'Could not load AI requests.'); this.loading.set(false); }
    });
  }

  retry(job: AiPlanJob): void {
    if (job.status !== 'FAILED') return;
    this.retryingId.set(job._id);
    this.notice.set('');
    this.error.set('');
    this.api.post<object, RetryResponse>(`/api/v1/ai/plan-jobs/${job._id}/retry`, {}).subscribe({
      next: response => {
        this.retryingId.set('');
        this.notice.set(response.message);
        this.load();
      },
      error: err => {
        this.retryingId.set('');
        this.error.set(err?.error?.message ?? 'Could not retry this AI request.');
      }
    });
  }

  view(job: AiPlanJob): void {
    if (job.status !== 'COMPLETED') return;
    void this.router.navigate(['/ai-planner'], { queryParams: { job: job._id } });
  }

  count(status: AiPlanJob['status']): number { return this.jobs().filter(job => job.status === status).length; }
  statusLabel(status: AiPlanJob['status']): string { return ({ QUEUED: 'Queued', PROCESSING: 'Processing', COMPLETED: 'Completed', FAILED: 'Failed' })[status]; }
  statusClass(status: AiPlanJob['status']): string { return `status-${status.toLowerCase()}`; }
  formatDateTime(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date); }
  friendlyError(value: string): string { return value.length > 140 ? `${value.slice(0, 137)}…` : value; }
}
