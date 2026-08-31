import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';

type LearningPath = { _id: string; title: string; description?: string; status: 'BACKLOG' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' };

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule],
  template: `<section class="page"><header><div><h1>Learning paths</h1><p class="muted">Create a path now; Excel/AI imports will feed this same board later.</p></div></header><mat-card class="create-card"><mat-card-content><h2>New learning path</h2><form [formGroup]="form" (ngSubmit)="create()"><mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput formControlName="title" placeholder="e.g. React Fundamentals"></mat-form-field><mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput rows="3" formControlName="description"></textarea></mat-form-field><button mat-flat-button type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Creating…' : 'Create learning path' }}</button></form></mat-card-content></mat-card>@if (error()) {<p class="error">{{ error() }}</p>}<div class="grid">@for (path of paths(); track path._id) {<mat-card><mat-card-content><div class="row"><div><strong>{{ path.title }}</strong><p>{{ path.description || 'No description yet.' }}</p><small>{{ path.status }}</small></div><button mat-button type="button" (click)="remove(path._id)">Delete</button></div></mat-card-content></mat-card>} @empty {<p>No learning paths yet. Create your first one above.</p>}</div></section>`,
  styles: [`.page{display:grid;gap:20px}.create-card{max-width:720px}form{display:grid;gap:8px}mat-form-field{width:100%}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.row{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.muted,small{opacity:.7}.error{color:#b3261e}`]
})
export class LearningPathsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly paths = signal<LearningPath[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]], description: ['', Validators.maxLength(1000)] });

  ngOnInit(): void { this.load(); }
  load() { this.api.get<LearningPath[]>('/api/v1/learning-paths').subscribe({ next: data => this.paths.set(data), error: () => this.error.set('Unable to load learning paths.') }); }
  create() { if (this.form.invalid) return; this.saving.set(true); this.error.set(''); const value = this.form.getRawValue(); this.api.post<typeof value, LearningPath>('/api/v1/learning-paths', value).subscribe({ next: path => { this.paths.update(items => [path, ...items]); this.form.reset(); this.saving.set(false); }, error: () => { this.error.set('Unable to create learning path.'); this.saving.set(false); } }); }
  remove(id: string) { this.api.delete(`/api/v1/learning-paths/${id}`).subscribe({ next: () => this.paths.update(items => items.filter(item => item._id !== id)), error: () => this.error.set('Unable to delete learning path.') }); }
}
