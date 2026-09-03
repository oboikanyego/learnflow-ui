import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { LearningPath, Phase, Lesson, LessonStatus } from '../../models/learning.models';
import { ActionDialogComponent } from '../../shared/action-dialog.component';
import { LessonDetailDialogComponent } from './lesson-detail-dialog.component';

@Component({
  standalone: true,
  imports: [FormsModule, DragDropModule, MatButtonModule, MatDialogModule, RouterLink],
  styleUrl: './board.component.css',
  template: `
    <section class="page-enter board-page">
      <div class="page-head board-toolbar">
        <div>
          <span class="eyebrow">Learning / Board</span>
          <h1>Board</h1>
          <p class="muted">Keep the board focused on the work closest to you. The full plan stays organised in Backlog.</p>
        </div>
        <div class="board-controls">
          <span class="board-count">{{ allLessons().length }} total items</span>
          <select [(ngModel)]="selectedPath" (change)="loadBoard()" aria-label="Select learning path">
            <option value="">Select learning path</option>
            @for (path of paths(); track path._id) { <option [value]="path._id">{{ path.title }}</option> }
          </select>
          <a class="backlog-button" routerLink="/backlog" [queryParams]="{ path: selectedPath }">Open backlog</a>
        </div>
      </div>

      <div class="board-actions-row">
        <div class="quick-filter"><button type="button" class="filter-active">All</button><button type="button">My lessons</button><button type="button">Scheduled</button></div>
        <span class="board-view-note">Showing up to {{ boardItemLimit }} items per stage · Drag cards to update status</span>
      </div>

      <div class="board-scroll-shell">
        <div class="board vibrant-board">
          @for (status of statuses; track status) {
            <div class="column column-{{ status.toLowerCase() }}">
              <div class="column-head">
                <div class="column-title"><h3>{{ label(status) }}</h3><span class="column-count">{{ byStatus(status).length }}</span></div>
              </div>
              <div
                class="column-items"
                cdkDropList
                [id]="dropListId(status)"
                [cdkDropListData]="status"
                [cdkDropListConnectedTo]="dropListIds"
                (cdkDropListDropped)="drop($event)">
                @for (lesson of visibleByStatus(status); track lesson._id) {
                  <article
                    class="ticket issue-ticket"
                    tabindex="0"
                    cdkDrag
                    [cdkDragData]="lesson"
                    (cdkDragStarted)="dragging.set(true)"
                    (cdkDragEnded)="finishDrag()"
                    (click)="openLesson(lesson)"
                    (keydown.enter)="openLesson(lesson)">
                    <span class="card-color-strip" aria-hidden="true"></span>
                    <strong>{{ lesson.title }}</strong>
                    @if (lesson.description) { <p>{{ lesson.description }}</p> }
                    <div class="ticket-meta-row">
                      <div class="ticket-type-meta"><span class="issue-type-icon">✓</span><span class="issue-id">LF-{{ shortId(lesson._id) }}</span></div>
                      <div class="ticket-secondary-meta"><span class="priority-dot">●</span><span>{{ lesson.durationMinutes }} min</span><span class="avatar-mini">{{ userInitials() }}</span></div>
                    </div>
                    @if (lesson.scheduledAt) { <span class="due-label">Scheduled {{ formatDate(lesson.scheduledAt) }}</span> }
                    @else { <span class="due-label due-label-muted">Not scheduled</span> }
                    <div class="ticket-actions" (click)="$event.stopPropagation()"><button mat-button (click)="openStatusDialog(lesson)">Status</button><button mat-button (click)="openScheduleDialog(lesson)">{{ lesson.status === 'MISSED' ? 'Reschedule' : 'Schedule' }}</button></div>
                  </article>
                } @empty { <div class="column-empty"><p>No work items</p></div> }
              </div>
              @if (hiddenCount(status) > 0) {
                <a class="column-overflow-link" routerLink="/backlog" [queryParams]="{ path: selectedPath, status: status }">
                  <span>+{{ hiddenCount(status) }} more</span><strong>View in backlog →</strong>
                </a>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class BoardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  readonly paths = signal<LearningPath[]>([]);
  readonly phases = signal<Phase[]>([]);
  readonly dragging = signal(false);
  readonly boardItemLimit = 6;
  selectedPath = '';
  readonly statuses: LessonStatus[] = ['BACKLOG', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED'];
  readonly dropListIds = this.statuses.map(status => this.dropListId(status));

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
  visibleByStatus(status: LessonStatus): Lesson[] { return this.byStatus(status).slice(0, this.boardItemLimit); }
  hiddenCount(status: LessonStatus): number { return Math.max(0, this.byStatus(status).length - this.boardItemLimit); }
  label(status: LessonStatus): string { return status.replaceAll('_', ' ').toLowerCase(); }
  shortId(id: string): string { return id.slice(-6).toUpperCase(); }
  dropListId(status: LessonStatus): string { return `lesson-status-${status.toLowerCase()}`; }
  userInitials(): string { return 'LF'; }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(value));
  }

  drop(event: CdkDragDrop<LessonStatus>): void {
    const lesson = event.item.data as Lesson;
    const status = event.container.data;
    if (!lesson || !status || lesson.status === status) return;
    this.api.patch(`/api/v1/lessons/${lesson._id}`, { status }).subscribe({
      next: () => this.loadBoard(),
      error: () => this.loadBoard()
    });
  }

  finishDrag(): void { setTimeout(() => this.dragging.set(false), 0); }

  openLesson(lesson: Lesson): void {
    if (this.dragging()) return;
    this.dialog.open(LessonDetailDialogComponent, {
      width: '760px', maxWidth: '92vw', height: '100vh', maxHeight: '100vh', position: { top: '0', right: '0' },
      panelClass: 'issue-detail-dialog', data: { lesson }
    });
  }

  openStatusDialog(lesson: Lesson): void {
    const ref=this.dialog.open(ActionDialogComponent,{width:'500px',data:{eyebrow:'Lesson update',title:`Update “${lesson.title}”`,description:'Choose the workflow state that best represents this lesson.',submitLabel:'Update lesson',fields:[{key:'status',label:'Status',type:'select',value:lesson.status,required:true,options:this.statuses.map(status=>({label:status.replaceAll('_',' '),value:status}))}]}});
    ref.afterClosed().subscribe(values=>{if(values?.status)this.api.patch(`/api/v1/lessons/${lesson._id}`,{status:values.status}).subscribe(()=>this.loadBoard());});
  }

  openScheduleDialog(lesson: Lesson): void {
    const ref=this.dialog.open(ActionDialogComponent,{width:'520px',data:{eyebrow:lesson.status==='MISSED'?'Reschedule lesson':'Lesson schedule',title:`${lesson.status==='MISSED'?'Reschedule':'Schedule'} “${lesson.title}”`,description:'Choose the date and time you intend to complete this lesson.',submitLabel:'Save schedule',fields:[{key:'scheduledAt',label:'Date and time',type:'datetime-local',value:this.toLocalInput(lesson.scheduledAt),required:true}]}});
    ref.afterClosed().subscribe(values=>{if(!values?.scheduledAt)return;this.api.patch(`/api/v1/lessons/${lesson._id}`,{scheduledAt:new Date(String(values.scheduledAt)).toISOString(),status:'SCHEDULED'}).subscribe(()=>this.loadBoard());});
  }

  private toLocalInput(value?: string): string {
    if (!value) return '';
    const date=new Date(value);
    const localDate=new Date(date.getTime()-date.getTimezoneOffset()*60_000);
    return localDate.toISOString().slice(0,16);
  }
}
