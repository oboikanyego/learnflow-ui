import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';

interface Goal {
  _id: string;
  title: string;
  description?: string;
  targetDate?: string;
  weeklyMinutesTarget: number;
  status: 'ACTIVE'|'COMPLETED'|'ARCHIVED';
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="goals-page page-enter">
      <div class="page-head">
        <div><span class="eyebrow">Outcomes</span><h1>Learning goals</h1><p class="muted">Turn study time into measurable outcomes with a weekly commitment and target date.</p></div>
        <button mat-flat-button class="primary-cta" (click)="showCreate.set(!showCreate())">{{ showCreate() ? 'Close' : 'New goal' }}</button>
      </div>

      @if (showCreate()) {
        <section class="create-card">
          <mat-form-field appearance="outline"><mat-label>Goal</mat-label><input matInput [(ngModel)]="title" placeholder="Complete React fundamentals"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Weekly minutes</mat-label><input matInput type="number" [(ngModel)]="weeklyMinutes"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Target date</mat-label><input matInput type="date" [(ngModel)]="targetDate"></mat-form-field>
          <button mat-flat-button class="primary-cta" (click)="create()" [disabled]="saving() || title.trim().length < 3">{{ saving() ? 'Creating…' : 'Create goal' }}</button>
        </section>
      }

      @if (error()) { <div class="error">{{ error() }}</div> }

      <div class="goal-grid">
        @for (goal of goals(); track goal._id) {
          <article class="goal-card" [class.done]="goal.status==='COMPLETED'">
            <div class="goal-head"><span class="status">{{ goal.status }}</span><span>{{ goal.weeklyMinutesTarget }} min / week</span></div>
            <h3>{{ goal.title }}</h3>
            @if (goal.description) { <p>{{ goal.description }}</p> }
            <div class="progress"><span [style.width.%]="goal.progress"></span></div>
            <div class="progress-meta"><strong>{{ goal.progress }}%</strong><span>{{ goal.completedLessons }} / {{ goal.totalLessons }} linked lessons</span></div>
            <div class="goal-footer"><span>{{ goal.targetDate ? ('Target ' + formatDate(goal.targetDate)) : 'No target date' }}</span><div><button mat-button (click)="mark(goal,'COMPLETED')" [disabled]="goal.status==='COMPLETED'">Complete</button><button mat-button (click)="remove(goal)">Delete</button></div></div>
          </article>
        } @empty {
          <div class="empty"><strong>No goals yet</strong><span>Use onboarding or create your first measurable learning outcome here.</span></div>
        }
      </div>
    </section>
  `,
  styles: [`
    .goals-page{max-width:1200px;margin:0 auto}.create-card{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:12px;align-items:start;padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff;margin-bottom:20px}.goal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.goal-card{padding:20px;border:1px solid #dfe5ed;border-radius:18px;background:#fff}.goal-card.done{background:#f4fbf7}.goal-head,.progress-meta,.goal-footer{display:flex;justify-content:space-between;align-items:center;gap:12px}.goal-head{color:#7a869a;font-size:.7rem;font-weight:800;text-transform:uppercase}.status{padding:4px 7px;border-radius:999px;background:#eaf2ff;color:#175bbd}.goal-card.done .status{background:#ddf5e8;color:#12633f}.goal-card h3{margin:14px 0 6px;color:#10233f}.goal-card p{color:#66758a}.progress{height:9px;border-radius:999px;background:#edf1f5;overflow:hidden;margin:20px 0 8px}.progress span{display:block;height:100%;background:linear-gradient(90deg,#2f6fed,#20a4c7)}.progress-meta strong{color:#10233f}.progress-meta span,.goal-footer>span{color:#7a869a;font-size:.72rem}.goal-footer{margin-top:18px;padding-top:12px;border-top:1px solid #edf1f5}.empty{grid-column:1/-1;padding:34px;border:1px dashed #ccd7e5;border-radius:16px;display:flex;flex-direction:column;gap:5px;color:#66758a}.empty strong{color:#10233f}.error{padding:12px;border-radius:10px;background:#fff1f1;color:#a8323e;margin-bottom:14px}@media(max-width:850px){.create-card{grid-template-columns:1fr 1fr}.goal-grid{grid-template-columns:1fr}}@media(max-width:560px){.create-card{grid-template-columns:1fr}.goal-footer{align-items:flex-start;flex-direction:column}}
  `]
})
export class GoalsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly goals = signal<Goal[]>([]);
  readonly showCreate = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  title = '';
  weeklyMinutes = 240;
  targetDate = '';

  ngOnInit(): void { this.load(); }
  load(): void { this.api.get<Goal[]>('/api/v1/goals').subscribe({ next: value => this.goals.set(value), error: err => this.error.set(err?.error?.message ?? 'Could not load goals') }); }
  create(): void {
    if (this.title.trim().length < 3) return;
    this.saving.set(true); this.error.set('');
    this.api.post<object,Goal>('/api/v1/goals',{ title:this.title.trim(), weeklyMinutesTarget:this.weeklyMinutes, targetDate:this.targetDate || null }).subscribe({ next: goal => { this.goals.update(items => [goal,...items]); this.title=''; this.targetDate=''; this.showCreate.set(false); this.saving.set(false); }, error: err => { this.saving.set(false); this.error.set(err?.error?.message ?? 'Could not create goal'); } });
  }
  mark(goal: Goal, status: Goal['status']): void { this.api.patch<object,Goal>(`/api/v1/goals/${goal._id}`,{status}).subscribe(updated => this.goals.update(items => items.map(item => item._id===updated._id ? updated : item))); }
  remove(goal: Goal): void { this.api.delete(`/api/v1/goals/${goal._id}`).subscribe(() => this.goals.update(items => items.filter(item => item._id!==goal._id))); }
  formatDate(value:string):string{return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}
}
