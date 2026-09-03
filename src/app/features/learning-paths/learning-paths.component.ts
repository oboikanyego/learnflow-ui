import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { LearningPath } from '../../models/learning.models';
import { ActionDialogComponent, ConfirmDialogComponent } from '../../shared/action-dialog.component';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatDialogModule],
  template: `
    <section class="page-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow">Learning / Curriculum</span>
          <h1>Learning paths</h1>
          <p class="muted">Review the overall curriculum, structure and progress for each long-term learning outcome.</p>
        </div>
        <button mat-flat-button class="primary-cta" (click)="openCreateDialog()">New learning path</button>
      </div>

      <div class="card-grid stagger-group">
        @for (path of paths(); track path._id) {
          <mat-card>
            <mat-card-content>
              <div class="page-head" style="margin-bottom:12px">
                <span class="status-pill status-active">{{ path.status }}</span>
                <span class="mini-label">Curriculum</span>
              </div>
              <h3>{{ path.title }}</h3>
              <p class="muted">{{ path.description || 'No description added yet.' }}</p>
              <div class="lesson-actions" style="margin-top:18px;flex-wrap:wrap">
                <a mat-flat-button [routerLink]="['/learning-paths', path._id]">View curriculum</a>
                <a mat-stroked-button routerLink="/backlog" [queryParams]="{ path: path._id }">Open backlog</a>
                <button mat-button class="danger-action" (click)="confirmRemove(path)">Delete plan</button>
              </div>
            </mat-card-content>
          </mat-card>
        } @empty {
          <div class="module">
            <span class="eyebrow">Start here</span>
            <h3>No learning paths yet</h3>
            <p class="muted">Create your first curriculum or import a structured plan from Excel.</p>
            <button mat-flat-button class="primary-cta" (click)="openCreateDialog()">Create first path</button>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`.danger-action{color:#ae2e24!important;font-weight:800}`]
})
export class LearningPathsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  readonly paths = signal<LearningPath[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.get<LearningPath[]>('/api/v1/learning-paths').subscribe(value => this.paths.set(value));
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ActionDialogComponent, {
      width: '560px',
      data: {
        eyebrow: 'New learning path',
        title: 'Create a learning path',
        description: 'Define the long-term outcome. You can build the curriculum with phases, modules and lessons after creation.',
        submitLabel: 'Create path',
        fields: [
          { key: 'title', label: 'Path title', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea', hint: 'Describe the outcome or capability you want to build.' }
        ]
      }
    });

    ref.afterClosed().subscribe(values => {
      if (!values) return;
      this.api.post('/api/v1/learning-paths', {
        title: String(values.title).trim(),
        description: String(values.description ?? '').trim()
      }).subscribe(() => this.load());
    });
  }

  confirmRemove(path: LearningPath): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        eyebrow: 'Delete learning plan',
        title: `Delete “${path.title}”?`,
        description: 'This permanently removes the learning plan, whether it was created in LearnFlow or imported, together with its phases, modules and lessons.',
        confirmLabel: 'Delete plan',
        destructive: true
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.api.delete(`/api/v1/learning-paths/${path._id}`).subscribe(() => this.load());
    });
  }
}
