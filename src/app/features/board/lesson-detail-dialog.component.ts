import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { Lesson, LessonComment } from '../../models/learning.models';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  styleUrl: './lesson-detail-dialog.component.css',
  template: `
    <div class="issue-detail-shell">
      <header class="issue-detail-head">
        <div><span class="issue-key">LF-{{ shortId(data.lesson._id) }}</span><h2>{{ data.lesson.title }}</h2><p>{{ data.lesson.description || 'No lesson description has been added yet.' }}</p></div>
        <button mat-button type="button" (click)="dialogRef.close(changed())">Close</button>
      </header>
      <div class="issue-detail-grid">
        <section class="issue-main-panel">
          <div class="issue-section">
            <span class="section-label">Activity</span><h3>Comments</h3>
            <div class="comment-composer"><mat-form-field appearance="outline"><mat-label>Add a comment</mat-label><textarea matInput rows="3" [(ngModel)]="comment" placeholder="Share a note, blocker or learning insight..."></textarea></mat-form-field><button mat-flat-button type="button" (click)="addComment()" [disabled]="!comment.trim() || posting()">{{ posting() ? 'Posting…' : 'Comment' }}</button></div>
            <div class="comment-list">
              @for (item of comments(); track item._id) { <article class="comment-item"><div class="comment-avatar">{{ initials(item.authorName) }}</div><div><div class="comment-meta"><strong>{{ item.authorName }}</strong><span>{{ item.createdAt | date:'medium' }}</span></div><p>{{ item.body }}</p></div></article> }
              @empty { <div class="comment-empty">No comments yet. Add the first note for this lesson.</div> }
            </div>
          </div>
        </section>
        <aside class="issue-side-panel"><div class="issue-section compact"><span class="section-label">Details</span><dl class="issue-details-list"><div><dt>Status</dt><dd><span class="status-chip status-{{ data.lesson.status.toLowerCase() }}">{{ pretty(data.lesson.status) }}</span></dd></div><div><dt>Duration</dt><dd>{{ data.lesson.durationMinutes }} min</dd></div><div><dt>Scheduled</dt><dd>{{ data.lesson.scheduledAt ? (data.lesson.scheduledAt | date:'medium') : 'Not scheduled' }}</dd></div><div><dt>Reminder</dt><dd>{{ data.lesson.reminderMinutes }} min before</dd></div>@if (data.lesson.resourceUrl) { <div><dt>Resource</dt><dd><a [href]="data.lesson.resourceUrl" target="_blank" rel="noopener">Open resource</a></dd></div> }@if (data.lesson.notes) { <div><dt>Notes</dt><dd>{{ data.lesson.notes }}</dd></div> }</dl></div></aside>
      </div>
    </div>
  `
})
export class LessonDetailDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly comments = signal<LessonComment[]>([]);
  readonly posting = signal(false);
  readonly changed = signal(false);
  comment = '';
  constructor(readonly dialogRef: MatDialogRef<LessonDetailDialogComponent>, @Inject(MAT_DIALOG_DATA) readonly data: { lesson: Lesson }) {}
  ngOnInit(): void { this.loadComments(); }
  loadComments(): void { this.api.get<LessonComment[]>(`/api/v1/lessons/${this.data.lesson._id}/comments`).subscribe(value => this.comments.set(value)); }
  addComment(): void { const body=this.comment.trim(); if(!body)return; this.posting.set(true); this.api.post<{body:string},LessonComment>(`/api/v1/lessons/${this.data.lesson._id}/comments`,{body}).subscribe({next:item=>{this.comments.update(items=>[...items,item]);this.comment='';this.posting.set(false);this.changed.set(true);},error:()=>this.posting.set(false)}); }
  shortId(id:string):string{return id.slice(-6).toUpperCase();}
  pretty(value:string):string{return value.replaceAll('_',' ').toLowerCase();}
  initials(name:string):string{return name.split(/\s+/).slice(0,2).map(part=>part[0]??'').join('').toUpperCase();}
}
