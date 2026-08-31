import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { Phase, LessonStatus } from '../../models/learning.models';

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section>
      <div class="page-head">
        <div>
          <h1>Learning path</h1>
          <p class="muted">Build, schedule and complete lessons in order.</p>
        </div>
        <button mat-stroked-button (click)="load()">Refresh</button>
      </div>

      <div class="create-row">
        <mat-form-field>
          <mat-label>New phase</mat-label>
          <input matInput [(ngModel)]="phaseTitle">
        </mat-form-field>
        <button mat-flat-button (click)="addPhase()" [disabled]="!phaseTitle.trim()">Add phase</button>
      </div>

      @for (phase of phases(); track phase._id) {
        <mat-card class="phase-card">
          <mat-card-header>
            <mat-card-title>{{ phase.title }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="create-row">
              <mat-form-field>
                <mat-label>New module</mat-label>
                <input matInput #moduleInput>
              </mat-form-field>
              <button mat-stroked-button (click)="addModule(phase._id, moduleInput.value); moduleInput.value = ''">
                Add module
              </button>
            </div>

            @for (module of phase.modules; track module._id) {
              <div class="module">
                <h3>{{ module.title }}</h3>
                <div class="create-row">
                  <mat-form-field>
                    <mat-label>New lesson</mat-label>
                    <input matInput #lessonInput>
                  </mat-form-field>
                  <button mat-stroked-button (click)="addLesson(module._id, lessonInput.value); lessonInput.value = ''">
                    Add lesson
                  </button>
                </div>

                @for (lesson of module.lessons; track lesson._id) {
                  <div class="lesson">
                    <div>
                      <strong>{{ lesson.title }}</strong>
                      <small>{{ lesson.scheduledAt || 'Not scheduled' }} · {{ lesson.durationMinutes }} min</small>
                    </div>
                    <div class="lesson-actions">
                      <input type="datetime-local" #scheduleInput [value]="toLocalInput(lesson.scheduledAt)">
                      <button mat-button (click)="schedule(lesson._id, scheduleInput.value)">Schedule</button>
                      <mat-form-field class="status">
                        <mat-label>Status</mat-label>
                        <mat-select [ngModel]="lesson.status" (ngModelChange)="setStatus(lesson._id, $event)">
                          @for (status of statuses; track status) {
                            <mat-option [value]="status">{{ status }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                      <button mat-button (click)="deleteLesson(lesson._id)">Delete</button>
                    </div>
                  </div>
                } @empty {
                  <p class="muted">No lessons yet.</p>
                }
              </div>
            } @empty {
              <p class="muted">No modules yet.</p>
            }
          </mat-card-content>
        </mat-card>
      } @empty {
        <p>No phases yet. Add the first phase above.</p>
      }
    </section>
  `
})
export class LearningPathDetailComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly phases = signal<Phase[]>([]);
  readonly statuses: LessonStatus[] = ['BACKLOG', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED'];
  phaseTitle = '';

  get pathId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.pathId) return;
    this.api.get<Phase[]>(`/api/v1/learning-paths/${this.pathId}/hierarchy`).subscribe(phases => this.phases.set(phases));
  }

  addPhase(): void {
    if (!this.phaseTitle.trim()) return;
    this.api.post(`/api/v1/learning-paths/${this.pathId}/phases`, { title: this.phaseTitle }).subscribe(() => {
      this.phaseTitle = '';
      this.load();
    });
  }

  addModule(phaseId: string, title: string): void {
    if (!title.trim()) return;
    this.api.post(`/api/v1/phases/${phaseId}/modules`, { title }).subscribe(() => this.load());
  }

  addLesson(moduleId: string, title: string): void {
    if (!title.trim()) return;
    this.api.post(`/api/v1/modules/${moduleId}/lessons`, { title, durationMinutes: 60 }).subscribe(() => this.load());
  }

  setStatus(id: string, status: LessonStatus): void {
    this.api.patch(`/api/v1/lessons/${id}`, { status }).subscribe(() => this.load());
  }

  schedule(id: string, value: string): void {
    if (!value) return;
    this.api.patch(`/api/v1/lessons/${id}`, { scheduledAt: new Date(value).toISOString(), status: 'SCHEDULED' }).subscribe(() => this.load());
  }

  toLocalInput(value?: string): string {
    if (!value) return '';
    const date = new Date(value);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 16);
  }

  deleteLesson(id: string): void {
    this.api.delete(`/api/v1/lessons/${id}`).subscribe(() => this.load());
  }
}
