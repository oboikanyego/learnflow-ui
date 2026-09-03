import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { LearningPath, Lesson, Phase, LessonStatus } from '../../models/learning.models';
import { ActionDialogComponent, ConfirmDialogComponent } from '../../shared/action-dialog.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatDialogModule],
  template: `
    <section class="page-enter path-page">
      <div class="page-head path-head">
        <div>
          <span class="eyebrow">Learning / Curriculum</span>
          <h1>{{ path()?.title || 'Learning path' }}</h1>
          <p class="muted">Understand the full curriculum and progress here. Use Board for active work and Backlog for upcoming lessons.</p>
        </div>
        <div class="lesson-actions">
          <a mat-stroked-button routerLink="/board">Active board</a>
          <a mat-stroked-button routerLink="/backlog" [queryParams]="{ path: pathId }">Backlog</a>
          <button mat-flat-button class="primary-cta" (click)="openPhaseDialog()">Add phase</button>
        </div>
      </div>

      <section class="path-summary" aria-label="Learning path progress">
        <article><span>Progress</span><strong>{{ completionRate() }}%</strong><small>{{ completedLessons() }} of {{ totalLessons() }} lessons completed</small></article>
        <article><span>Curriculum</span><strong>{{ phases().length }} phases</strong><small>{{ totalModules() }} modules · {{ totalLessons() }} lessons</small></article>
        <article><span>Active</span><strong>{{ activeLessons() }}</strong><small>Scheduled, in progress or missed</small></article>
        <article><span>Upcoming</span><strong>{{ backlogLessons() }}</strong><small>Lessons still waiting in backlog</small></article>
      </section>

      <section class="progress-track" aria-label="Completion progress"><span [style.width.%]="completionRate()"></span></section>

      <div class="curriculum-head">
        <div><span class="mini-label">Curriculum structure</span><h2>Phases and modules</h2></div>
        <span class="curriculum-note">Expand only what you need to inspect or edit.</span>
      </div>

      @for (phase of phases(); track phase._id; let first = $first) {
        <details class="phase-outline" [open]="first">
          <summary>
            <div class="phase-summary-main"><span class="phase-marker">{{ $index + 1 }}</span><div><small>Phase</small><strong>{{ phase.title }}</strong></div></div>
            <div class="phase-summary-meta"><span>{{ phase.modules.length }} modules</span><span>{{ phaseLessonCount(phase) }} lessons</span><span>{{ phaseCompletionRate(phase) }}% complete</span></div>
          </summary>
          <div class="phase-body">
            <div class="phase-actions"><button mat-stroked-button (click)="openModuleDialog(phase._id)">Add module</button></div>

            @for (module of phase.modules; track module._id) {
              <details class="module-outline">
                <summary>
                  <div><small>Module</small><strong>{{ module.title }}</strong></div>
                  <div class="module-summary-meta"><span>{{ module.lessons.length }} lessons</span><span>{{ moduleCompletionRate(module.lessons) }}% complete</span></div>
                </summary>
                <div class="module-body">
                  <div class="module-actions"><button mat-button (click)="openLessonDialog(module._id)">+ Add lesson</button></div>
                  @for (lesson of module.lessons; track lesson._id) {
                    <div class="curriculum-lesson">
                      <div class="lesson-main">
                        <span class="lesson-status-dot status-{{ lesson.status.toLowerCase() }}"></span>
                        <div><strong>{{ lesson.title }}</strong><small>{{ lesson.scheduledAt ? (lesson.scheduledAt | date:'medium') : 'Not scheduled' }} · {{ lesson.durationMinutes }} min</small></div>
                      </div>
                      <div class="lesson-actions lesson-actions-compact">
                        <span class="status-pill">{{ statusLabel(lesson.status) }}</span>
                        <button mat-button (click)="openScheduleDialog(lesson)">Schedule</button>
                        <button mat-button (click)="openStatusDialog(lesson)">Status</button>
                        <button mat-button class="danger-action" (click)="confirmRemoveLesson(lesson)">Remove</button>
                      </div>
                    </div>
                  } @empty {
                    <div class="empty-module">No lessons yet. Add a lesson when this module is ready to be defined.</div>
                  }
                </div>
              </details>
            } @empty {
              <div class="empty-module">No modules yet. Add a module to structure this phase.</div>
            }
          </div>
        </details>
      } @empty {
        <div class="empty-path">
          <span class="eyebrow">Start building</span>
          <h3>No phases yet</h3>
          <p class="muted">A phase groups related modules into a meaningful milestone.</p>
          <button mat-flat-button class="primary-cta" (click)="openPhaseDialog()">Add first phase</button>
        </div>
      }
    </section>
  `,
  styles: [`
    .path-page{max-width:1180px;margin:0 auto}.path-head{align-items:flex-end}.path-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px}.path-summary article{padding:17px;border:1px solid #e4e7ec;border-radius:10px;background:#fff}.path-summary span{display:block;color:#667085;font-size:.66rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.path-summary strong{display:block;margin:5px 0;color:#101828;font-size:1.2rem}.path-summary small{color:#667085;line-height:1.4}.progress-track{height:7px;border-radius:999px;background:#eaecf0;overflow:hidden;margin-bottom:26px}.progress-track span{display:block;height:100%;border-radius:inherit;background:#22a06b;transition:width .2s ease}.curriculum-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:10px}.curriculum-head h2{margin:4px 0 0;font-size:1.1rem}.curriculum-note{color:#667085;font-size:.72rem}.phase-outline,.module-outline{border:1px solid #e4e7ec;border-radius:10px;background:#fff;margin-bottom:10px;overflow:hidden}.phase-outline>summary,.module-outline>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:16px}.phase-outline>summary::-webkit-details-marker,.module-outline>summary::-webkit-details-marker{display:none}.phase-outline>summary{padding:16px 18px;background:#fff}.phase-outline[open]>summary{border-bottom:1px solid #eaecf0;background:#f9fafb}.phase-summary-main{display:flex;align-items:center;gap:12px}.phase-marker{width:30px;height:30px;border-radius:8px;background:#172b4d;color:#fff;display:grid;place-items:center;font-size:.7rem;font-weight:800}.phase-summary-main small,.module-outline summary small{display:block;color:#667085;font-size:.62rem;text-transform:uppercase;font-weight:800;letter-spacing:.04em}.phase-summary-main strong,.module-outline summary strong{display:block;color:#101828;margin-top:2px}.phase-summary-meta,.module-summary-meta{display:flex;align-items:center;gap:12px;color:#667085;font-size:.7rem}.phase-body{padding:12px}.phase-actions,.module-actions{display:flex;justify-content:flex-end;margin-bottom:8px}.module-outline{margin:0 0 8px;border-radius:8px}.module-outline>summary{padding:13px 14px}.module-outline[open]>summary{border-bottom:1px solid #eaecf0;background:#fcfcfd}.module-body{padding:6px 14px 10px}.curriculum-lesson{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;border-top:1px solid #f0f1f3}.lesson-main{display:flex;align-items:center;gap:10px;min-width:0}.lesson-main>div{display:flex;flex-direction:column;min-width:0}.lesson-main strong{font-size:.82rem;color:#101828}.lesson-main small{margin-top:3px;color:#667085;font-size:.68rem}.lesson-status-dot{width:8px;height:8px;border-radius:50%;background:#98a2b3;flex:0 0 auto}.status-completed{background:#22a06b}.status-scheduled{background:#0c66e4}.status-in_progress{background:#f5a623}.status-missed{background:#c9372c}.status-backlog{background:#6554c0}.status-skipped{background:#98a2b3}.lesson-actions-compact{align-items:center;flex-wrap:wrap;justify-content:flex-end}.lesson-actions-compact button{font-size:.7rem}.danger-action{color:#ae2e24!important}.empty-module{padding:16px;color:#667085;font-size:.76rem;background:#f9fafb;border-radius:7px}.empty-path{padding:28px;border:1px dashed #d0d5dd;border-radius:12px;background:#fff}@media(max-width:900px){.path-summary{grid-template-columns:1fr 1fr}.phase-outline>summary,.module-outline>summary{align-items:flex-start;flex-direction:column}.phase-summary-meta,.module-summary-meta{flex-wrap:wrap}.curriculum-lesson{align-items:flex-start;flex-direction:column}.lesson-actions-compact{justify-content:flex-start}}@media(max-width:560px){.path-summary{grid-template-columns:1fr}.path-head{align-items:flex-start}.lesson-actions{width:100%}.curriculum-head{align-items:flex-start;flex-direction:column}.curriculum-note{display:none}}
  `]
})
export class LearningPathDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly path = signal<LearningPath | null>(null);
  readonly phases = signal<Phase[]>([]);
  readonly statuses: LessonStatus[] = ['BACKLOG', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED'];

  get pathId(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  ngOnInit(): void {
    this.api.get<LearningPath[]>('/api/v1/learning-paths').subscribe(paths => this.path.set(paths.find(path => path._id === this.pathId) ?? null));
    this.load();
  }

  load(): void {
    if (!this.pathId) return;
    this.api.get<Phase[]>(`/api/v1/learning-paths/${this.pathId}/hierarchy`).subscribe(phases => this.phases.set(phases));
  }

  allLessons(): Lesson[] { return this.phases().flatMap(phase => phase.modules.flatMap(module => module.lessons)); }
  totalLessons(): number { return this.allLessons().length; }
  completedLessons(): number { return this.allLessons().filter(lesson => lesson.status === 'COMPLETED').length; }
  backlogLessons(): number { return this.allLessons().filter(lesson => lesson.status === 'BACKLOG').length; }
  activeLessons(): number { return this.allLessons().filter(lesson => ['SCHEDULED', 'IN_PROGRESS', 'MISSED'].includes(lesson.status)).length; }
  totalModules(): number { return this.phases().reduce((total, phase) => total + phase.modules.length, 0); }
  completionRate(): number { return this.totalLessons() ? Math.round((this.completedLessons() / this.totalLessons()) * 100) : 0; }
  phaseLessonCount(phase: Phase): number { return phase.modules.reduce((total, module) => total + module.lessons.length, 0); }
  phaseCompletionRate(phase: Phase): number {
    const lessons = phase.modules.flatMap(module => module.lessons);
    return this.moduleCompletionRate(lessons);
  }
  moduleCompletionRate(lessons: Lesson[]): number {
    if (!lessons.length) return 0;
    return Math.round((lessons.filter(lesson => lesson.status === 'COMPLETED').length / lessons.length) * 100);
  }
  statusLabel(status: LessonStatus): string { return status.replaceAll('_', ' ').toLowerCase(); }

  openPhaseDialog(): void {
    this.openTitleDialog('New phase', 'Add a phase', 'Phases represent major milestones in this learning path.', 'Add phase', title => {
      this.api.post(`/api/v1/learning-paths/${this.pathId}/phases`, { title }).subscribe(() => this.load());
    });
  }

  openModuleDialog(phaseId: string): void {
    this.openTitleDialog('New module', 'Add a module', 'Group related lessons into a focused topic or capability.', 'Add module', title => {
      this.api.post(`/api/v1/phases/${phaseId}/modules`, { title }).subscribe(() => this.load());
    });
  }

  openLessonDialog(moduleId: string): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '560px',
      data: {
        eyebrow: 'New lesson', title: 'Add a lesson', description: 'Create a focused unit of work with an expected study duration.', submitLabel: 'Add lesson',
        fields: [
          { key: 'title', label: 'Lesson title', type: 'text', required: true },
          { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number', value: 60, required: true, min: 15 }
        ]
      }
    });
    ref.afterClosed().subscribe(values => {
      if (!values) return;
      this.api.post(`/api/v1/modules/${moduleId}/lessons`, { title: String(values.title).trim(), durationMinutes: Number(values.durationMinutes) }).subscribe(() => this.load());
    });
  }

  openScheduleDialog(lesson: Lesson): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '520px',
      data: { eyebrow: 'Lesson schedule', title: `Schedule “${lesson.title}”`, description: 'Choose when this learning session should start.', submitLabel: 'Save schedule', fields: [{ key: 'scheduledAt', label: 'Date and time', type: 'datetime-local', value: this.toLocalInput(lesson.scheduledAt), required: true }] }
    });
    ref.afterClosed().subscribe(values => {
      if (!values?.scheduledAt) return;
      this.api.patch(`/api/v1/lessons/${lesson._id}`, { scheduledAt: new Date(String(values.scheduledAt)).toISOString(), status: 'SCHEDULED' }).subscribe(() => this.load());
    });
  }

  openStatusDialog(lesson: Lesson): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '500px',
      data: { eyebrow: 'Lesson update', title: `Update “${lesson.title}”`, description: 'Move the lesson to the status that best represents its current state.', submitLabel: 'Update status', fields: [{ key: 'status', label: 'Status', type: 'select', value: lesson.status, required: true, options: this.statuses.map(status => ({ label: status.replaceAll('_', ' '), value: status })) }] }
    });
    ref.afterClosed().subscribe(values => { if (values?.status) this.api.patch(`/api/v1/lessons/${lesson._id}`, { status: values.status }).subscribe(() => this.load()); });
  }

  confirmRemoveLesson(lesson: Lesson): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '470px',
      data: { eyebrow: 'Remove lesson', title: `Remove “${lesson.title}”?`, description: 'This lesson will be removed from the module.', confirmLabel: 'Remove lesson', destructive: true }
    });
    ref.afterClosed().subscribe(confirmed => { if (confirmed) this.api.delete(`/api/v1/lessons/${lesson._id}`).subscribe(() => this.load()); });
  }

  private openTitleDialog(eyebrow: string, title: string, description: string, submitLabel: string, onSubmit: (title: string) => void): void {
    const ref = this.dialog.open(ActionDialogComponent, { width: '520px', data: { eyebrow, title, description, submitLabel, fields: [{ key: 'title', label: 'Title', type: 'text', required: true }] } });
    ref.afterClosed().subscribe(values => { if (values?.title) onSubmit(String(values.title).trim()); });
  }

  toLocalInput(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
}
