import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { LearningPath, Lesson, LessonStatus, Phase } from '../../models/learning.models';

type BacklogView = 'tree' | 'list';
type BacklogStatusFilter = 'UPCOMING' | LessonStatus;

type BacklogItem = {
  lesson: Lesson;
  phaseId: string;
  phaseTitle: string;
  phasePosition: number;
  moduleId: string;
  moduleTitle: string;
  modulePosition: number;
};

type BacklogTreePhase = {
  id: string;
  title: string;
  modules: Array<{
    id: string;
    title: string;
    lessons: BacklogItem[];
  }>;
};

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrl: './backlog.component.css',
  template: `
    <section class="page-enter backlog-page">
      <div class="page-head backlog-head">
        <div>
          <span class="eyebrow">Learning / Backlog</span>
          <h1>Backlog</h1>
          <p class="muted">See the full learning plan without turning your day-to-day board into a long scrolling page.</p>
        </div>
        <a class="board-link" routerLink="/board">← Back to board</a>
      </div>

      <section class="backlog-summary" aria-label="Backlog summary">
        <article><span>Upcoming</span><strong>{{ upcomingItems().length }}</strong><small>Active lessons in this path</small></article>
        <article><span>Scheduled</span><strong>{{ countStatus('SCHEDULED') }}</strong><small>Already placed on your calendar</small></article>
        <article><span>Unscheduled</span><strong>{{ countStatus('BACKLOG') }}</strong><small>Ready to plan when needed</small></article>
      </section>

      <section class="backlog-toolbar">
        <div class="backlog-filters">
          <label>
            <span>Learning path</span>
            <select [(ngModel)]="selectedPath" (change)="loadBacklog()">
              <option value="">Select learning path</option>
              @for (path of paths(); track path._id) { <option [value]="path._id">{{ path.title }}</option> }
            </select>
          </label>
          <label>
            <span>Status</span>
            <select [(ngModel)]="statusFilter" (change)="resetPage()">
              <option value="UPCOMING">Upcoming</option>
              <option value="BACKLOG">Backlog</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="MISSED">Missed</option>
              <option value="COMPLETED">Completed</option>
              <option value="SKIPPED">Skipped</option>
            </select>
          </label>
          <label class="search-field">
            <span>Find lesson</span>
            <input [(ngModel)]="searchQuery" (ngModelChange)="resetPage()" type="search" placeholder="Search title, phase or module">
          </label>
        </div>

        <div class="view-toggle" aria-label="Backlog view">
          <button type="button" [class.active]="viewMode === 'tree'" (click)="setView('tree')">Tree</button>
          <button type="button" [class.active]="viewMode === 'list'" (click)="setView('list')">List</button>
        </div>
      </section>

      <div class="results-meta">
        <span>{{ filteredItems().length }} matching items</span>
        <span>Showing {{ pageStart() }}–{{ pageEnd() }} · {{ pageSize }} per page</span>
      </div>

      @if (viewMode === 'tree') {
        <section class="tree-view">
          @for (phase of treePage(); track phase.id) {
            <article class="tree-phase">
              <header><span class="tree-marker">◇</span><div><small>Phase</small><strong>{{ phase.title }}</strong></div></header>
              <div class="tree-modules">
                @for (module of phase.modules; track module.id) {
                  <section class="tree-module">
                    <div class="module-head"><span class="module-line"></span><div><small>Module</small><strong>{{ module.title }}</strong></div><span class="module-count">{{ module.lessons.length }}</span></div>
                    <div class="tree-lessons">
                      @for (item of module.lessons; track item.lesson._id) {
                        <article class="backlog-row">
                          <span class="lesson-node"></span>
                          <div class="lesson-copy"><strong>{{ item.lesson.title }}</strong>@if (item.lesson.description) { <p>{{ item.lesson.description }}</p> }</div>
                          <div class="lesson-meta"><span class="status-chip status-{{ item.lesson.status.toLowerCase() }}">{{ statusLabel(item.lesson.status) }}</span><span>{{ item.lesson.durationMinutes }} min</span><span>{{ scheduleLabel(item.lesson) }}</span></div>
                        </article>
                      }
                    </div>
                  </section>
                }
              </div>
            </article>
          } @empty {
            <div class="backlog-empty"><strong>No lessons match these filters.</strong><span>Try another status, search term or learning path.</span></div>
          }
        </section>
      } @else {
        <section class="list-view">
          <header class="list-header"><span>Lesson</span><span>Location</span><span>Status</span><span>Schedule</span></header>
          @for (item of pagedItems(); track item.lesson._id) {
            <article class="list-row">
              <div class="list-title"><strong>{{ item.lesson.title }}</strong><small>{{ item.lesson.durationMinutes }} min</small></div>
              <div class="list-location"><strong>{{ item.phaseTitle }}</strong><small>{{ item.moduleTitle }}</small></div>
              <span class="status-chip status-{{ item.lesson.status.toLowerCase() }}">{{ statusLabel(item.lesson.status) }}</span>
              <span class="schedule-text">{{ scheduleLabel(item.lesson) }}</span>
            </article>
          } @empty {
            <div class="backlog-empty"><strong>No lessons match these filters.</strong><span>Try another status, search term or learning path.</span></div>
          }
        </section>
      }

      @if (totalPages() > 1) {
        <nav class="pagination" aria-label="Backlog pages">
          <button type="button" [disabled]="page === 1" (click)="previousPage()">← Previous</button>
          <span>Page <strong>{{ page }}</strong> of {{ totalPages() }}</span>
          <button type="button" [disabled]="page === totalPages()" (click)="nextPage()">Next →</button>
        </nav>
      }
    </section>
  `
})
export class BacklogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly paths = signal<LearningPath[]>([]);
  readonly phases = signal<Phase[]>([]);
  readonly pageSize = 12;
  selectedPath = '';
  statusFilter: BacklogStatusFilter = 'UPCOMING';
  viewMode: BacklogView = 'tree';
  searchQuery = '';
  page = 1;

  ngOnInit(): void {
    const requestedPath = this.route.snapshot.queryParamMap.get('path') ?? '';
    const requestedStatus = this.route.snapshot.queryParamMap.get('status');
    if (this.isBacklogFilter(requestedStatus)) this.statusFilter = requestedStatus;

    this.api.get<LearningPath[]>('/api/v1/learning-paths').subscribe(paths => {
      this.paths.set(paths);
      this.selectedPath = paths.some(path => path._id === requestedPath) ? requestedPath : (paths[0]?._id ?? '');
      this.loadBacklog();
    });
  }

  loadBacklog(): void {
    this.resetPage();
    if (!this.selectedPath) { this.phases.set([]); return; }
    this.api.get<Phase[]>(`/api/v1/learning-paths/${this.selectedPath}/hierarchy`).subscribe(phases => this.phases.set(phases));
  }

  upcomingItems(): BacklogItem[] {
    return this.flattenItems().filter(item => !['COMPLETED', 'SKIPPED'].includes(item.lesson.status));
  }

  filteredItems(): BacklogItem[] {
    const query = this.searchQuery.trim().toLowerCase();
    const statusItems = this.statusFilter === 'UPCOMING'
      ? this.upcomingItems()
      : this.flattenItems().filter(item => item.lesson.status === this.statusFilter);

    return statusItems.filter(item => {
      if (!query) return true;
      return [item.lesson.title, item.lesson.description, item.phaseTitle, item.moduleTitle]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query));
    });
  }

  pagedItems(): BacklogItem[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  }

  treePage(): BacklogTreePhase[] {
    const phases = new Map<string, BacklogTreePhase>();
    for (const item of this.pagedItems()) {
      let phase = phases.get(item.phaseId);
      if (!phase) {
        phase = { id: item.phaseId, title: item.phaseTitle, modules: [] };
        phases.set(item.phaseId, phase);
      }
      let module = phase.modules.find(value => value.id === item.moduleId);
      if (!module) {
        module = { id: item.moduleId, title: item.moduleTitle, lessons: [] };
        phase.modules.push(module);
      }
      module.lessons.push(item);
    }
    return [...phases.values()];
  }

  countStatus(status: LessonStatus): number {
    return this.flattenItems().filter(item => item.lesson.status === status).length;
  }

  totalPages(): number { return Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize)); }
  pageStart(): number { return this.filteredItems().length ? (this.page - 1) * this.pageSize + 1 : 0; }
  pageEnd(): number { return Math.min(this.page * this.pageSize, this.filteredItems().length); }
  resetPage(): void { this.page = 1; }
  setView(view: BacklogView): void { this.viewMode = view; this.resetPage(); }
  previousPage(): void { if (this.page > 1) this.page--; }
  nextPage(): void { if (this.page < this.totalPages()) this.page++; }

  statusLabel(status: LessonStatus): string { return status.replaceAll('_', ' ').toLowerCase(); }

  scheduleLabel(lesson: Lesson): string {
    if (!lesson.scheduledAt) return 'Not scheduled';
    return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(lesson.scheduledAt));
  }

  private flattenItems(): BacklogItem[] {
    return this.phases()
      .flatMap(phase => phase.modules.flatMap(module => module.lessons.map(lesson => ({
        lesson,
        phaseId: phase._id,
        phaseTitle: phase.title,
        phasePosition: phase.position,
        moduleId: module._id,
        moduleTitle: module.title,
        modulePosition: module.position
      }))))
      .sort((a, b) => a.phasePosition - b.phasePosition || a.modulePosition - b.modulePosition || a.lesson.position - b.lesson.position);
  }

  private isBacklogFilter(value: string | null): value is BacklogStatusFilter {
    return value !== null && ['UPCOMING', 'BACKLOG', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'SKIPPED'].includes(value);
  }
}
