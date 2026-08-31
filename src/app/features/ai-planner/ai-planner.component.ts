import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { ActionDialogComponent } from '../../shared/action-dialog.component';

interface GeneratedLesson {
  title: string;
  description?: string;
  date: string;
  time: string;
  durationMinutes: number;
  resourceUrl?: string;
}

interface GeneratedModule {
  title: string;
  lessons: GeneratedLesson[];
}

interface GeneratedPhase {
  title: string;
  modules: GeneratedModule[];
}

interface GeneratedPlan {
  learningPath: {
    title: string;
    description?: string;
  };
  phases: GeneratedPhase[];
}

type GeneratedResponse = { plan: GeneratedPlan; learningPathId?: string };

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatDialogModule],
  template: `
    <section class="page-enter ai-planner-page">
      <div class="page-head planner-head">
        <div>
          <span class="eyebrow">AI-assisted planning</span>
          <h1>AI learning planner</h1>
          <p class="muted">Turn a learning goal and preferred schedule into a structured path you can understand and execute.</p>
        </div>
        <div class="lesson-actions">
          <button mat-stroked-button (click)="openPlanner(false)" [disabled]="busy()">Preview plan</button>
          <button mat-flat-button class="primary-cta" (click)="openPlanner(true)" [disabled]="busy()">{{ busy() ? 'Generating…' : 'Generate & save' }}</button>
        </div>
      </div>

      <section class="planner-config-card">
        <div>
          <span class="mini-label">Current learning goal</span>
          <h3>{{ topic }}</h3>
        </div>
        <div class="config-chips">
          <span>{{ weeks }} weeks</span>
          <span>{{ days }}</span>
          <span>{{ time }}</span>
          <span>Starts {{ formatDate(startDate) }}</span>
        </div>
      </section>

      @if (busy()) {
        <section class="planner-loading" aria-live="polite">
          <span class="loading-orb">✦</span>
          <div><strong>Building your learning roadmap…</strong><p>Organising phases, modules and realistic study sessions.</p></div>
        </section>
      }

      @if (error()) { <div class="notification unread"><strong>Planner error</strong><span>{{ error() }}</span></div> }
      @if (savedId()) { <div class="notification save-notice"><strong>Plan saved successfully.</strong><a [routerLink]="['/learning-paths', savedId()]">Open learning path →</a></div> }

      @if (plan(); as generatedPlan) {
        <section class="roadmap-shell">
          <div class="roadmap-hero">
            <div class="roadmap-copy">
              <span class="eyebrow">Generated learning roadmap</span>
              <h2>{{ generatedPlan.learningPath.title }}</h2>
              <p>{{ generatedPlan.learningPath.description || 'A structured learning path generated around your preferred study schedule.' }}</p>
            </div>
            <div class="roadmap-stats">
              <article><strong>{{ generatedPlan.phases.length }}</strong><span>Phases</span></article>
              <article><strong>{{ moduleCount(generatedPlan) }}</strong><span>Modules</span></article>
              <article><strong>{{ lessonCount(generatedPlan) }}</strong><span>Lessons</span></article>
              <article><strong>{{ totalHours(generatedPlan) }}</strong><span>Study hours</span></article>
            </div>
          </div>

          <div class="roadmap-timeline">
            @for (phase of generatedPlan.phases; track phase.title; let phaseIndex = $index) {
              <section class="phase-block">
                <div class="phase-marker"><span>{{ phaseIndex + 1 }}</span><div></div></div>
                <div class="phase-content">
                  <div class="phase-heading">
                    <div><span class="phase-kicker">Phase {{ phaseIndex + 1 }}</span><h3>{{ phase.title }}</h3></div>
                    <span class="phase-meta">{{ phase.modules.length }} module{{ phase.modules.length === 1 ? '' : 's' }} · {{ phaseLessonCount(phase) }} lessons</span>
                  </div>

                  <div class="module-grid">
                    @for (module of phase.modules; track module.title; let moduleIndex = $index) {
                      <article class="generated-module">
                        <div class="module-heading">
                          <div><span class="module-number">{{ phaseIndex + 1 }}.{{ moduleIndex + 1 }}</span><h4>{{ module.title }}</h4></div>
                          <span class="lesson-count">{{ module.lessons.length }} lesson{{ module.lessons.length === 1 ? '' : 's' }}</span>
                        </div>

                        <div class="generated-lessons">
                          @for (lesson of module.lessons; track lesson.title; let lessonIndex = $index) {
                            <div class="generated-lesson">
                              <div class="lesson-index">{{ lessonIndex + 1 }}</div>
                              <div class="lesson-main">
                                <div class="lesson-title-row">
                                  <strong>{{ lesson.title }}</strong>
                                  <span class="duration-badge">{{ formatDuration(lesson.durationMinutes) }}</span>
                                </div>
                                @if (lesson.description) { <p>{{ lesson.description }}</p> }
                                <div class="lesson-schedule">
                                  <span>📅 {{ formatDate(lesson.date) }}</span>
                                  <span>🕒 {{ formatTime(lesson.time) }}</span>
                                  @if (lesson.resourceUrl) {
                                    <a [href]="lesson.resourceUrl" target="_blank" rel="noopener noreferrer">Open resource ↗</a>
                                  }
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      </article>
                    }
                  </div>
                </div>
              </section>
            }
          </div>

          <div class="roadmap-footer">
            <div><strong>Does this roadmap fit your schedule?</strong><span>You can regenerate it with different study days, duration or start date before saving.</span></div>
            <div class="lesson-actions">
              <button mat-stroked-button (click)="openPlanner(false)">Adjust & regenerate</button>
              @if (!savedId()) { <button mat-flat-button class="primary-cta" (click)="saveCurrentPlan()" [disabled]="busy()">Generate & save</button> }
              @if (savedId()) { <a mat-flat-button class="primary-cta" [routerLink]="['/learning-paths', savedId()]">Open saved path</a> }
            </div>
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .ai-planner-page{max-width:1280px;margin:0 auto}.planner-head{align-items:flex-end}.planner-config-card{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 22px;margin-bottom:24px;border:1px solid #dcdfe4;border-radius:12px;background:linear-gradient(135deg,#f8faff,#fff)}.planner-config-card h3{margin:4px 0 0;font-size:1.15rem;color:#172b4d}.config-chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.config-chips span{padding:6px 10px;border-radius:999px;background:#e9f2ff;color:#0c4a9c;font-size:.75rem;font-weight:750}.planner-loading{display:flex;align-items:center;gap:16px;margin:22px 0;padding:20px;border:1px solid #cfe1ff;border-radius:12px;background:#f5f9ff;color:#172b4d}.loading-orb{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#0c66e4,#6554c0);color:#fff;font-size:1.2rem;animation:pulse 1.4s ease-in-out infinite}.planner-loading strong{display:block}.planner-loading p{margin:3px 0 0;color:#626f86}.save-notice a{color:#0c66e4;font-weight:800;text-decoration:none}.roadmap-shell{margin-top:30px;border:1px solid #dcdfe4;border-radius:18px;background:#fff;overflow:hidden;box-shadow:0 16px 42px rgba(9,30,66,.08)}.roadmap-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:34px;padding:32px;background:linear-gradient(135deg,#f7faff 0%,#fff 58%,#f7f3ff 100%);border-bottom:1px solid #dcdfe4}.roadmap-copy{max-width:700px}.roadmap-copy h2{margin:8px 0 10px;color:#172b4d;font-size:clamp(1.7rem,3vw,2.5rem)}.roadmap-copy p{margin:0;color:#626f86;font-size:1rem;line-height:1.65}.roadmap-stats{display:grid;grid-template-columns:repeat(2,110px);gap:10px}.roadmap-stats article{padding:14px;border:1px solid #dfe5ee;border-radius:10px;background:rgba(255,255,255,.9);display:flex;flex-direction:column}.roadmap-stats strong{font-size:1.45rem;color:#172b4d}.roadmap-stats span{font-size:.7rem;color:#626f86;font-weight:700;text-transform:uppercase;letter-spacing:.04em}.roadmap-timeline{padding:28px 30px 10px}.phase-block{display:grid;grid-template-columns:42px minmax(0,1fr);gap:14px}.phase-marker{display:flex;flex-direction:column;align-items:center}.phase-marker>span{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#0c66e4,#6554c0);color:#fff;font-weight:850;box-shadow:0 6px 18px rgba(12,102,228,.2)}.phase-marker>div{width:2px;flex:1;min-height:30px;background:#e2e8f0}.phase-block:last-child .phase-marker>div{background:linear-gradient(#e2e8f0,transparent)}.phase-content{padding:2px 0 30px}.phase-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:16px}.phase-kicker{display:block;color:#0c66e4;font-size:.68rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em}.phase-heading h3{margin:3px 0 0;color:#172b4d;font-size:1.2rem}.phase-meta{white-space:nowrap;color:#7a869a;font-size:.73rem;font-weight:700}.module-grid{display:grid;gap:14px}.generated-module{border:1px solid #dcdfe4;border-radius:12px;background:#fafbfc;overflow:hidden}.module-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border-bottom:1px solid #e5e7eb;background:#fff}.module-heading>div{display:flex;align-items:center;gap:10px}.module-number{padding:4px 7px;border-radius:6px;background:#e9f2ff;color:#0c66e4;font-size:.68rem;font-weight:850}.module-heading h4{margin:0;color:#172b4d;font-size:.92rem}.lesson-count{color:#7a869a;font-size:.68rem;font-weight:700}.generated-lessons{padding:4px 16px}.generated-lesson{display:grid;grid-template-columns:30px minmax(0,1fr);gap:11px;padding:14px 0;border-bottom:1px solid #e8eaed}.generated-lesson:last-child{border-bottom:0}.lesson-index{width:25px;height:25px;border-radius:7px;background:#f1f2f4;color:#44546f;display:grid;place-items:center;font-size:.68rem;font-weight:800}.lesson-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.lesson-title-row strong{color:#172b4d;font-size:.86rem}.duration-badge{white-space:nowrap;padding:3px 7px;border-radius:999px;background:#e6f4ea;color:#216e4e;font-size:.65rem;font-weight:800}.lesson-main p{margin:5px 0 9px;color:#626f86;font-size:.76rem;line-height:1.5}.lesson-schedule{display:flex;gap:14px;align-items:center;flex-wrap:wrap;color:#626f86;font-size:.69rem;font-weight:650}.lesson-schedule a{color:#0c66e4;font-weight:800;text-decoration:none}.lesson-schedule a:hover{text-decoration:underline}.roadmap-footer{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 30px;background:#f7f8f9;border-top:1px solid #dcdfe4}.roadmap-footer>div:first-child{display:flex;flex-direction:column}.roadmap-footer strong{color:#172b4d}.roadmap-footer span{color:#626f86;font-size:.78rem;margin-top:2px}@keyframes pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(12,102,228,.18)}50%{transform:scale(1.04);box-shadow:0 0 0 9px rgba(12,102,228,0)}}@media(max-width:850px){.planner-config-card,.roadmap-footer,.phase-heading{align-items:flex-start;flex-direction:column}.config-chips{justify-content:flex-start}.roadmap-hero{grid-template-columns:1fr}.roadmap-stats{grid-template-columns:repeat(4,minmax(75px,1fr))}.roadmap-timeline{padding:22px 16px 8px}.phase-meta{white-space:normal}.roadmap-footer{padding:20px}.roadmap-footer .lesson-actions{width:100%}}@media(max-width:580px){.roadmap-hero{padding:22px}.roadmap-stats{grid-template-columns:repeat(2,1fr)}.phase-block{grid-template-columns:30px minmax(0,1fr);gap:9px}.phase-marker>span{width:28px;height:28px;border-radius:8px;font-size:.72rem}.module-heading{align-items:flex-start}.module-heading>div{align-items:flex-start}.generated-lessons{padding:2px 12px}.lesson-title-row{flex-direction:column;gap:5px}.lesson-schedule{gap:8px 12px}}
  `]
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
  readonly plan = signal<GeneratedPlan | null>(null);
  readonly savedId = signal('');

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

  saveCurrentPlan(): void {
    this.generate(true);
  }

  moduleCount(plan: GeneratedPlan): number {
    return plan.phases.reduce((total, phase) => total + phase.modules.length, 0);
  }

  lessonCount(plan: GeneratedPlan): number {
    return plan.phases.reduce((total, phase) => total + this.phaseLessonCount(phase), 0);
  }

  phaseLessonCount(phase: GeneratedPhase): number {
    return phase.modules.reduce((total, module) => total + module.lessons.length, 0);
  }

  totalHours(plan: GeneratedPlan): string {
    const minutes = plan.phases.reduce((phaseTotal, phase) => phaseTotal + phase.modules.reduce((moduleTotal, module) => moduleTotal + module.lessons.reduce((lessonTotal, lesson) => lessonTotal + (lesson.durationMinutes || 0), 0), 0), 0);
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
  }

  formatDate(value: string): string {
    if (!value) return 'Date to be confirmed';
    const parts = value.split('-').map(Number);
    const date = parts.length === 3 ? new Date(parts[0]!, parts[1]! - 1, parts[2]!) : new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  formatTime(value: string): string {
    const [hour, minute] = value.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
    const date = new Date();
    date.setHours(hour!, minute!, 0, 0);
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
  }

  private generate(save: boolean): void {
    this.busy.set(true);
    this.error.set('');
    if (save) this.savedId.set('');
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
