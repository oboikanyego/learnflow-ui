import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { Lesson, Phase, LessonStatus } from '../../models/learning.models';
import { ActionDialogComponent, ConfirmDialogComponent } from '../../shared/action-dialog.component';

@Component({
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatDialogModule],
  template: `
    <section class="page-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow">Path workspace</span>
          <h1>Learning path</h1>
          <p class="muted">Structure phases, modules and lessons, then schedule the work you intend to complete.</p>
        </div>
        <div class="lesson-actions">
          <button mat-stroked-button (click)="load()">Refresh</button>
          <button mat-flat-button class="primary-cta" (click)="openPhaseDialog()">Add phase</button>
        </div>
      </div>

      @for (phase of phases(); track phase._id) {
        <mat-card class="phase-card">
          <mat-card-header>
            <mat-card-title>{{ phase.title }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="page-head" style="margin:12px 0 8px">
              <p class="muted">{{ phase.modules.length }} module{{ phase.modules.length === 1 ? '' : 's' }}</p>
              <button mat-stroked-button (click)="openModuleDialog(phase._id)">Add module</button>
            </div>

            @for (module of phase.modules; track module._id) {
              <div class="module">
                <div class="page-head" style="margin-bottom:8px">
                  <div>
                    <span class="mini-label">Module</span>
                    <h3>{{ module.title }}</h3>
                  </div>
                  <button mat-button (click)="openLessonDialog(module._id)">Add lesson</button>
                </div>

                @for (lesson of module.lessons; track lesson._id) {
                  <div class="lesson">
                    <div>
                      <strong>{{ lesson.title }}</strong>
                      <small>{{ lesson.scheduledAt ? (lesson.scheduledAt | date:'medium') : 'Not scheduled' }} · {{ lesson.durationMinutes }} min</small>
                    </div>
                    <div class="lesson-actions">
                      <span class="status-pill">{{ lesson.status }}</span>
                      <button mat-button (click)="openScheduleDialog(lesson)">Schedule</button>
                      <button mat-button (click)="openStatusDialog(lesson)">Update status</button>
                      <button mat-button (click)="confirmRemoveLesson(lesson)">Remove</button>
                    </div>
                  </div>
                } @empty {
                  <p class="muted">No lessons yet. Add the first lesson for this module.</p>
                }
              </div>
            } @empty {
              <p class="muted">No modules yet. Add a module to begin structuring this phase.</p>
            }
          </mat-card-content>
        </mat-card>
      } @empty {
        <div class="module">
          <span class="eyebrow">Start building</span>
          <h3>No phases yet</h3>
          <p class="muted">A phase groups related modules into a meaningful milestone.</p>
          <button mat-flat-button class="primary-cta" (click)="openPhaseDialog()">Add first phase</button>
        </div>
      }
    </section>
  `
})
export class LearningPathDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly phases = signal<Phase[]>([]);
  readonly statuses: LessonStatus[] = ['BACKLOG', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED'];

  get pathId(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  ngOnInit(): void { this.load(); }

  load(): void {
    if (!this.pathId) return;
    this.api.get<Phase[]>(`/api/v1/learning-paths/${this.pathId}/hierarchy`).subscribe(phases => this.phases.set(phases));
  }

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
        eyebrow: 'New lesson',
        title: 'Add a lesson',
        description: 'Create a focused unit of work with an expected study duration.',
        submitLabel: 'Add lesson',
        fields: [
          { key: 'title', label: 'Lesson title', type: 'text', required: true },
          { key: 'durationMinutes', label: 'Duration (minutes)', type: 'number', value: 60, required: true, min: 15 }
        ]
      }
    });
    ref.afterClosed().subscribe(values => {
      if (!values) return;
      this.api.post(`/api/v1/modules/${moduleId}/lessons`, {
        title: String(values.title).trim(), durationMinutes: Number(values.durationMinutes)
      }).subscribe(() => this.load());
    });
  }

  openScheduleDialog(lesson: Lesson): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '520px',
      data: {
        eyebrow: 'Lesson schedule',
        title: `Schedule “${lesson.title}”`,
        description: 'Choose when this learning session should start.',
        submitLabel: 'Save schedule',
        fields: [{ key: 'scheduledAt', label: 'Date and time', type: 'datetime-local', value: this.toLocalInput(lesson.scheduledAt), required: true }]
      }
    });
    ref.afterClosed().subscribe(values => {
      if (!values?.scheduledAt) return;
      this.api.patch(`/api/v1/lessons/${lesson._id}`, {
        scheduledAt: new Date(String(values.scheduledAt)).toISOString(), status: 'SCHEDULED'
      }).subscribe(() => this.load());
    });
  }

  openStatusDialog(lesson: Lesson): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '500px',
      data: {
        eyebrow: 'Lesson update',
        title: `Update “${lesson.title}”`,
        description: 'Move the lesson to the status that best represents its current state.',
        submitLabel: 'Update status',
        fields: [{
          key: 'status', label: 'Status', type: 'select', value: lesson.status, required: true,
          options: this.statuses.map(status => ({ label: status.replaceAll('_', ' '), value: status }))
        }]
      }
    });
    ref.afterClosed().subscribe(values => {
      if (!values?.status) return;
      this.api.patch(`/api/v1/lessons/${lesson._id}`, { status: values.status }).subscribe(() => this.load());
    });
  }

  confirmRemoveLesson(lesson: Lesson): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '470px',
      data: {
        eyebrow: 'Remove lesson', title: `Remove “${lesson.title}”?`,
        description: 'This lesson will be removed from the module.', confirmLabel: 'Remove lesson', destructive: true
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.api.delete(`/api/v1/lessons/${lesson._id}`).subscribe(() => this.load());
    });
  }

  private openTitleDialog(eyebrow: string, title: string, description: string, submitLabel: string, onSubmit: (title: string) => void): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '520px',
      data: { eyebrow, title, description, submitLabel, fields: [{ key: 'title', label: 'Title', type: 'text', required: true }] }
    });
    ref.afterClosed().subscribe(values => { if (values?.title) onSubmit(String(values.title).trim()); });
  }

  toLocalInput(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
}
