import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { LearningPath, Phase, Lesson, LessonStatus } from '../../models/learning.models';
import { ActionDialogComponent } from '../../shared/action-dialog.component';

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule],
  template: `
    <section class="page-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow">Execution workspace</span>
          <h1>Learning board</h1>
          <p class="muted">Move lessons through a clear Jira-inspired workflow and keep scheduled work visible.</p>
        </div>
        <select [(ngModel)]="selectedPath" (change)="loadBoard()" aria-label="Select learning path">
          <option value="">Select learning path</option>
          @for (path of paths(); track path._id) { <option [value]="path._id">{{ path.title }}</option> }
        </select>
      </div>

      <div class="board">
        @for (status of statuses; track status) {
          <div class="column">
            <h3>{{ label(status) }} <span>{{ byStatus(status).length }}</span></h3>
            @for (lesson of byStatus(status); track lesson._id) {
              <article class="ticket">
                <span class="mini-label">{{ label(lesson.status) }}</span>
                <strong>{{ lesson.title }}</strong>
                <small>{{ lesson.durationMinutes }} min</small>
                @if (lesson.scheduledAt) { <small>{{ lesson.scheduledAt }}</small> }
                <div class="lesson-actions">
                  <button mat-button (click)="openStatusDialog(lesson)">Update</button>
                  <button mat-button (click)="openScheduleDialog(lesson)">{{ lesson.status === 'MISSED' ? 'Reschedule' : 'Schedule' }}</button>
                </div>
              </article>
            } @empty {
              <p class="muted">No lessons</p>
            }
          </div>
        }
      </div>
    </section>
  `
})
export class BoardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  readonly paths = signal<LearningPath[]>([]);
  readonly phases = signal<Phase[]>([]);
  selectedPath = '';
  readonly statuses: LessonStatus[] = ['BACKLOG', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED'];

  ngOnInit(): void {
    this.api.get<LearningPath[]>('/api/v1/learning-paths').subscribe(value => {
      this.paths.set(value);
      if (value[0]) { this.selectedPath = value[0]._id; this.loadBoard(); }
    });
  }

  loadBoard(): void {
    if (!this.selectedPath) { this.phases.set([]); return; }
    this.api.get<Phase[]>(`/api/v1/learning-paths/${this.selectedPath}/hierarchy`).subscribe(value => this.phases.set(value));
  }

  allLessons(): Lesson[] { return this.phases().flatMap(phase => phase.modules.flatMap(module => module.lessons)); }
  byStatus(status: LessonStatus): Lesson[] { return this.allLessons().filter(lesson => lesson.status === status); }
  label(status: LessonStatus): string { return status.replaceAll('_', ' ').toLowerCase(); }

  openStatusDialog(lesson: Lesson): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '500px',
      data: {
        eyebrow: 'Lesson update', title: `Update “${lesson.title}”`,
        description: 'Choose the workflow state that best represents this lesson.', submitLabel: 'Update lesson',
        fields: [{
          key: 'status', label: 'Status', type: 'select', value: lesson.status, required: true,
          options: this.statuses.map(status => ({ label: status.replaceAll('_', ' '), value: status }))
        }]
      }
    });
    ref.afterClosed().subscribe(values => {
      if (values?.status) this.api.patch(`/api/v1/lessons/${lesson._id}`, { status: values.status }).subscribe(() => this.loadBoard());
    });
  }

  openScheduleDialog(lesson: Lesson): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '520px',
      data: {
        eyebrow: lesson.status === 'MISSED' ? 'Reschedule lesson' : 'Lesson schedule',
        title: `${lesson.status === 'MISSED' ? 'Reschedule' : 'Schedule'} “${lesson.title}”`,
        description: 'Choose the date and time you intend to complete this lesson.', submitLabel: 'Save schedule',
        fields: [{ key: 'scheduledAt', label: 'Date and time', type: 'datetime-local', value: this.toLocalInput(lesson.scheduledAt), required: true }]
      }
    });
    ref.afterClosed().subscribe(values => {
      if (!values?.scheduledAt) return;
      this.api.patch(`/api/v1/lessons/${lesson._id}`, {
        scheduledAt: new Date(String(values.scheduledAt)).toISOString(), status: 'SCHEDULED'
      }).subscribe(() => this.loadBoard());
    });
  }

  private toLocalInput(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }
}
