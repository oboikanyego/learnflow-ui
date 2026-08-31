import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../core/services/api.service';

type LearningPath = { _id: string; title: string; description?: string; status: string };

@Component({
  standalone: true,
  imports: [MatCardModule],
  template: `<section><h1>Learning paths</h1><p class="muted">Imported and manually created plans appear here.</p>@for (path of paths(); track path._id) {<mat-card><mat-card-content><strong>{{ path.title }}</strong><div>{{ path.status }}</div></mat-card-content></mat-card>} @empty {<p>No learning paths yet.</p>}</section>`
})
export class LearningPathsComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly paths = signal<LearningPath[]>([]);
  ngOnInit(): void { this.api.get<LearningPath[]>('/api/v1/learning-paths').subscribe({ next: data => this.paths.set(data), error: () => this.paths.set([]) }); }
}
