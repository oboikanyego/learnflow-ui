import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';

interface OnboardingResponse {
  completed: boolean;
  onboarding?: {
    learningGoal?: string;
    weeklyMinutesTarget?: number;
    preferredDays?: string[];
    preferredTime?: string;
    targetDate?: string;
  } | null;
}

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="onboarding page-enter">
      <div class="intro">
        <span class="eyebrow">Guided learning setup</span>
        <h1>Build a learning week you can actually keep.</h1>
        <p>Tell LearnFlow what you want to learn and when you can realistically study. We will turn it into your first goal and pre-configure AI Planner.</p>
      </div>

      <div class="wizard-card">
        <div class="stepper"><span class="active">1</span><i></i><span class="active">2</span><i></i><span class="active">3</span></div>
        <div class="field-grid">
          <mat-form-field appearance="outline" class="wide">
            <mat-label>What do you want to learn?</mat-label>
            <input matInput [(ngModel)]="goal" placeholder="Example: Become productive with React and Next.js">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Weekly target (minutes)</mat-label>
            <input matInput type="number" min="30" [(ngModel)]="weeklyMinutes">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Preferred study time</mat-label>
            <input matInput type="time" [(ngModel)]="time">
          </mat-form-field>

          <mat-form-field appearance="outline" class="wide">
            <mat-label>Target date</mat-label>
            <input matInput type="date" [(ngModel)]="targetDate">
          </mat-form-field>
        </div>

        <div class="days-block">
          <span class="mini-label">Preferred learning days</span>
          <div class="days">
            @for (day of allDays; track day) {
              <button type="button" [class.selected]="days.includes(day)" (click)="toggleDay(day)">{{ day.slice(0,3) }}</button>
            }
          </div>
        </div>

        <div class="summary">
          <div><span>Weekly commitment</span><strong>{{ weeklyHours() }}</strong></div>
          <div><span>Sessions</span><strong>{{ days.length }} / week</strong></div>
          <div><span>Suggested session</span><strong>{{ sessionMinutes() }} min</strong></div>
        </div>

        @if (error()) { <div class="error">{{ error() }}</div> }

        <div class="actions">
          <button mat-stroked-button type="button" (click)="finish(false)" [disabled]="saving()">Save setup</button>
          <button mat-flat-button class="primary-cta" type="button" (click)="finish(true)" [disabled]="saving() || !canSubmit()">{{ saving() ? 'Setting up…' : 'Create goal & plan with AI' }}</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .onboarding{max-width:1000px;margin:0 auto}.intro{max-width:720px;margin-bottom:26px}.intro h1{margin:10px 0;color:#10233f}.intro p{color:#66758a;font-size:1rem}.wizard-card{padding:28px;border:1px solid #dfe5ed;border-radius:22px;background:#fff;box-shadow:0 18px 45px rgba(16,35,63,.07)}.stepper{display:flex;align-items:center;max-width:340px;margin:0 auto 28px}.stepper span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:2px solid #d6deea;color:#7a869a;font-weight:800}.stepper span.active{border-color:#2f6fed;background:#2f6fed;color:#fff}.stepper i{height:2px;flex:1;background:#cfd8e6}.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.wide{grid-column:1/-1}.days-block{margin:8px 0 24px}.days{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.days button{border:1px solid #d8e1ec;background:#f8fafc;color:#526178;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}.days button.selected{background:#eaf2ff;border-color:#82aef7;color:#175bbd}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px;border-radius:14px;background:#f7f9fc;margin-bottom:20px}.summary div{display:flex;flex-direction:column}.summary span{font-size:.68rem;color:#7a869a;text-transform:uppercase;font-weight:800}.summary strong{color:#10233f;margin-top:4px}.actions{display:flex;justify-content:flex-end;gap:10px}.error{margin:0 0 16px;padding:12px;border-radius:10px;background:#fff1f1;color:#a8323e}@media(max-width:680px){.field-grid,.summary{grid-template-columns:1fr}.wide{grid-column:auto}.actions{flex-direction:column}.actions button{width:100%}}
  `]
})
export class OnboardingComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly allDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  goal = '';
  weeklyMinutes = 240;
  time = '19:00';
  targetDate = this.defaultTargetDate();
  days = ['Monday','Wednesday','Sunday'];
  readonly saving = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    this.api.get<OnboardingResponse>('/api/v1/onboarding').subscribe({ next: value => {
      const saved = value.onboarding;
      if (!saved) return;
      this.goal = saved.learningGoal ?? this.goal;
      this.weeklyMinutes = saved.weeklyMinutesTarget ?? this.weeklyMinutes;
      this.days = saved.preferredDays?.length ? [...saved.preferredDays] : this.days;
      this.time = saved.preferredTime ?? this.time;
      this.targetDate = saved.targetDate ? saved.targetDate.slice(0,10) : this.targetDate;
    }});
  }

  toggleDay(day: string): void { this.days = this.days.includes(day) ? this.days.filter(item => item !== day) : [...this.days, day]; }
  weeklyHours(): string { return `${(this.weeklyMinutes / 60).toFixed(this.weeklyMinutes % 60 ? 1 : 0)} hrs / week`; }
  sessionMinutes(): number { return Math.max(15, Math.round(this.weeklyMinutes / Math.max(1, this.days.length))); }
  canSubmit(): boolean { return this.goal.trim().length >= 3 && this.days.length > 0 && this.weeklyMinutes >= 30; }

  finish(openPlanner: boolean): void {
    if (!this.canSubmit()) { this.error.set('Add a learning goal, weekly target and at least one study day.'); return; }
    this.saving.set(true); this.error.set('');
    const payload = { learningGoal: this.goal.trim(), weeklyMinutesTarget: this.weeklyMinutes, preferredDays: this.days, preferredTime: this.time, targetDate: this.targetDate || null };
    this.api.put<object,OnboardingResponse>('/api/v1/onboarding', payload).subscribe({
      next: () => {
        this.api.post('/api/v1/goals', { title: this.goal.trim(), targetDate: this.targetDate || null, weeklyMinutesTarget: this.weeklyMinutes }).subscribe({
          next: () => this.goNext(openPlanner),
          error: () => this.goNext(openPlanner)
        });
      },
      error: err => { this.saving.set(false); this.error.set(err?.error?.message ?? 'Could not save your learning setup.'); }
    });
  }

  private goNext(openPlanner: boolean): void {
    this.saving.set(false);
    if (!openPlanner) { void this.router.navigateByUrl('/dashboard'); return; }
    const weeks = Math.max(1, Math.ceil((new Date(this.targetDate).getTime() - Date.now()) / 604800000));
    void this.router.navigate(['/ai-planner'], { queryParams: { topic: this.goal.trim(), weeks: Math.min(52, weeks), days: this.days.join(','), time: this.time, startDate: new Date().toISOString().slice(0,10), onboarding: 1 } });
  }

  private defaultTargetDate(): string { const d = new Date(); d.setDate(d.getDate() + 42); return d.toISOString().slice(0,10); }
}
