import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

type ImportResponse = { learningPathId: string; importedLessons: number; timezone: string };
type ImportState = 'idle' | 'ready' | 'uploading' | 'success' | 'error';

@Component({
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  template: `
    <section class="import-page page-enter">
      <div class="page-head import-head">
        <div>
          <span class="eyebrow">Structured import</span>
          <h1>Import a learning plan</h1>
          <p class="muted">Bring an existing Excel or CSV roadmap into LearnFlow and turn every row into a trackable lesson.</p>
        </div>
        <div class="import-badge">Excel · CSV · up to 5 MB</div>
      </div>

      <div class="import-layout">
        <main class="import-main">
          <section class="import-card upload-card">
            <div class="step-heading">
              <span class="step-number">1</span>
              <div><strong>Select your plan file</strong><p>Use the LearnFlow column structure shown below.</p></div>
            </div>

            <label class="drop-zone" [class.dragging]="dragging()" [class.has-file]="selectedFile()" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
              <input #fileInput type="file" accept=".xlsx,.xls,.csv" (change)="pick($event)" hidden>
              @if (selectedFile(); as file) {
                <div class="file-icon">✓</div>
                <div class="drop-copy"><strong>{{ file.name }}</strong><span>{{ formatFileSize(file.size) }} · Ready to import</span></div>
                <button type="button" class="replace-file" (click)="$event.preventDefault(); fileInput.click()">Replace</button>
              } @else {
                <div class="upload-icon">⇧</div>
                <div class="drop-copy"><strong>Drop your spreadsheet here</strong><span>or click to browse from your computer</span></div>
                <span class="browse-chip">Choose file</span>
              }
            </label>

            @if (state() === 'error') {
              <div class="import-alert error-alert"><span>!</span><div><strong>We could not import this file</strong><p>{{ message() }}</p></div></div>
            }

            <div class="import-actions">
              <div class="privacy-note"><span>⌁</span><span>Your file is processed only to create your learning path.</span></div>
              <button mat-flat-button class="primary-cta import-button" type="button" (click)="upload()" [disabled]="!selectedFile() || state() === 'uploading'">
                {{ state() === 'uploading' ? 'Importing your plan…' : 'Import learning plan' }}
              </button>
            </div>
          </section>

          @if (state() === 'success') {
            <section class="import-card success-card">
              <div class="success-mark">✓</div>
              <div>
                <span class="eyebrow">Import complete</span>
                <h2>Your learning plan is ready</h2>
                <p>{{ message() }}</p>
                <div class="success-actions">
                  @if (learningPathId()) { <a mat-flat-button class="primary-cta" [routerLink]="['/learning-paths', learningPathId()]">Open learning path</a> }
                  <button mat-stroked-button type="button" (click)="reset()">Import another file</button>
                </div>
              </div>
            </section>
          }

          <section class="import-card structure-card">
            <div class="step-heading">
              <span class="step-number">2</span>
              <div><strong>Check the spreadsheet structure</strong><p>The first row must use these column names exactly.</p></div>
            </div>
            <div class="column-table" role="table" aria-label="Required import columns">
              @for (column of columns; track column.name) {
                <div class="column-row" role="row"><span class="column-name">{{ column.name }}</span><span>{{ column.description }}</span><em>{{ column.required ? 'Required' : 'Optional' }}</em></div>
              }
            </div>
          </section>
        </main>

        <aside class="import-sidebar">
          <section class="guide-card">
            <span class="mini-label">Before you upload</span>
            <h3>A clean file imports cleanly.</h3>
            <div class="guide-list">
              <div><span>01</span><p><strong>One lesson per row</strong><small>Repeat the path, phase and module values when needed.</small></p></div>
              <div><span>02</span><p><strong>Use real dates</strong><small>Dates and times create scheduled lessons automatically.</small></p></div>
              <div><span>03</span><p><strong>Keep names consistent</strong><small>Matching phase and module names are grouped together.</small></p></div>
            </div>
          </section>

          <section class="example-card">
            <span class="mini-label">Example row</span>
            <div class="example-preview">
              <div><small>Learning Path</small><strong>React Foundations</strong></div>
              <div><small>Phase</small><strong>Core concepts</strong></div>
              <div><small>Module</small><strong>Components</strong></div>
              <div><small>Lesson</small><strong>Props and state</strong></div>
              <div><small>Date / Time</small><strong>2026-09-02 · 19:00</strong></div>
              <div><small>Duration</small><strong>60 min</strong></div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .import-page{max-width:1180px;margin:0 auto}.import-head{align-items:flex-end}.import-head>div:first-child{max-width:720px}.import-head h1{margin:7px 0 8px}.import-badge{padding:8px 12px;border:1px solid #d8e1ee;border-radius:999px;background:#f8fbff;color:#52627a;font-size:.75rem;font-weight:800}
    .import-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start}.import-main{display:grid;gap:20px}.import-card,.guide-card,.example-card{background:#fff;border:1px solid #dde4ee;border-radius:20px;box-shadow:0 10px 30px rgba(23,43,77,.05)}.import-card{padding:24px}.step-heading{display:flex;align-items:flex-start;gap:13px;margin-bottom:20px}.step-heading strong{display:block;color:#172b4d;font-size:1rem}.step-heading p{margin:3px 0 0;color:#6b778c;font-size:.84rem}.step-number{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:#e9f2ff;color:#0c66e4;font-size:.74rem;font-weight:900;flex:0 0 auto}
    .drop-zone{min-height:238px;border:1.5px dashed #b8c7db;border-radius:18px;background:linear-gradient(180deg,#fbfdff,#f7faff);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px;cursor:pointer;transition:.2s ease;position:relative}.drop-zone:hover,.drop-zone.dragging{border-color:#0c66e4;background:#f2f7ff;box-shadow:inset 0 0 0 1px rgba(12,102,228,.08)}.drop-zone.has-file{min-height:150px;flex-direction:row;text-align:left;justify-content:flex-start;gap:16px;border-style:solid}.upload-icon,.file-icon{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;font-size:1.5rem;font-weight:900}.upload-icon{background:#e9f2ff;color:#0c66e4}.file-icon{background:#e8f7f1;color:#16805c}.drop-copy{display:flex;flex-direction:column;gap:3px}.drop-copy strong{color:#172b4d;font-size:.95rem}.drop-copy span{color:#7a869a;font-size:.78rem}.browse-chip{margin-top:14px;padding:8px 13px;border-radius:8px;background:#fff;border:1px solid #cdd8e6;color:#0c66e4;font-size:.75rem;font-weight:800}.replace-file{margin-left:auto;border:0;background:#f1f5fb;color:#0c66e4;padding:8px 12px;border-radius:8px;font-weight:800;cursor:pointer}
    .import-actions{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:18px}.privacy-note{display:flex;align-items:center;gap:7px;color:#7a869a;font-size:.74rem}.import-button{min-width:180px}.import-alert{display:flex;gap:11px;margin-top:16px;padding:13px 15px;border-radius:12px}.error-alert{background:#fff1f0;border:1px solid #f4c7c3;color:#8f2d25}.import-alert>span{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#c9372c;color:#fff;font-weight:900}.import-alert p{margin:2px 0 0;font-size:.78rem}.import-alert strong{font-size:.82rem}
    .success-card{display:grid;grid-template-columns:58px minmax(0,1fr);gap:18px;border-color:#cce9dc;background:linear-gradient(135deg,#f8fffb,#fff)}.success-mark{width:58px;height:58px;border-radius:17px;display:grid;place-items:center;background:#16805c;color:#fff;font-size:1.4rem;font-weight:900}.success-card h2{font-size:1.35rem;margin:5px 0 6px}.success-card p{color:#66758a}.success-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
    .column-table{border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}.column-row{display:grid;grid-template-columns:150px minmax(0,1fr) 80px;gap:14px;align-items:center;padding:12px 14px;border-bottom:1px solid #edf1f6;font-size:.78rem}.column-row:last-child{border-bottom:0}.column-name{font-weight:850;color:#172b4d}.column-row>span:nth-child(2){color:#66758a}.column-row em{font-style:normal;text-align:right;font-size:.66rem;font-weight:800;color:#7a869a;text-transform:uppercase;letter-spacing:.05em}
    .import-sidebar{display:grid;gap:18px;position:sticky;top:82px}.guide-card,.example-card{padding:20px}.guide-card h3{margin:8px 0 18px;color:#172b4d}.guide-list{display:grid;gap:14px}.guide-list>div{display:grid;grid-template-columns:30px 1fr;gap:10px}.guide-list>div>span{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#f1f5fb;color:#0c66e4;font-size:.65rem;font-weight:900}.guide-list p{margin:0;display:flex;flex-direction:column}.guide-list strong{font-size:.79rem;color:#172b4d}.guide-list small{color:#7a869a;line-height:1.45;margin-top:2px}.example-preview{display:grid;gap:10px;margin-top:14px}.example-preview>div{padding:10px 11px;border-radius:10px;background:#f7f9fc;border:1px solid #edf1f5;display:flex;flex-direction:column}.example-preview small{color:#7a869a;font-size:.64rem;text-transform:uppercase;letter-spacing:.04em}.example-preview strong{color:#172b4d;font-size:.76rem;margin-top:2px}
    @media(max-width:980px){.import-layout{grid-template-columns:1fr}.import-sidebar{position:static;grid-template-columns:1fr 1fr}.column-row{grid-template-columns:130px minmax(0,1fr) 72px}}
    @media(max-width:680px){.import-head{align-items:flex-start}.import-layout{display:block}.import-main{gap:14px}.import-card{padding:18px}.drop-zone{min-height:210px}.drop-zone.has-file{align-items:flex-start}.replace-file{margin-left:0}.import-actions{align-items:stretch;flex-direction:column}.import-button{width:100%}.import-sidebar{display:grid;grid-template-columns:1fr;margin-top:14px}.column-table{overflow-x:auto}.column-row{min-width:620px}.success-card{grid-template-columns:1fr}.success-mark{width:48px;height:48px}}
  `]
})
export class ImportComponent {
  private readonly api = inject(ApiService);
  readonly selectedFile = signal<File | null>(null);
  readonly state = signal<ImportState>('idle');
  readonly message = signal('');
  readonly learningPathId = signal('');
  readonly dragging = signal(false);

  readonly columns = [
    { name: 'Learning Path', description: 'The overall roadmap or learning goal.', required: true },
    { name: 'Phase', description: 'A major stage in the learning journey.', required: true },
    { name: 'Module', description: 'A grouped topic inside the phase.', required: true },
    { name: 'Lesson', description: 'The individual learning activity.', required: true },
    { name: 'Description', description: 'Extra context or lesson outcome.', required: false },
    { name: 'Date', description: 'Schedule date in YYYY-MM-DD format.', required: false },
    { name: 'Time', description: 'Schedule time in HH:mm format.', required: false },
    { name: 'Duration', description: 'Planned lesson duration in minutes.', required: false },
    { name: 'Priority', description: 'Optional priority or emphasis.', required: false },
    { name: 'Resource', description: 'Link to a course, video, article or exercise.', required: false }
  ];

  pick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.useFile(file);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.dragging.set(true); }
  onDragLeave(event: DragEvent): void { event.preventDefault(); this.dragging.set(false); }
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    this.useFile(event.dataTransfer?.files?.[0] ?? null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file || this.state() === 'uploading') return;
    this.state.set('uploading');
    this.message.set('');
    this.api.postFile<ImportResponse>('/api/v1/imports/learning-plans', file).subscribe({
      next: response => {
        this.learningPathId.set(response.learningPathId);
        this.message.set(`${response.importedLessons} lessons were added successfully and scheduled using your ${response.timezone} timezone.`);
        this.state.set('success');
      },
      error: error => {
        this.message.set(error.error?.message ?? 'Please check the spreadsheet columns and try again.');
        this.state.set('error');
      }
    });
  }

  reset(): void {
    this.selectedFile.set(null);
    this.learningPathId.set('');
    this.message.set('');
    this.state.set('idle');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private useFile(file: File | null): void {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
      this.selectedFile.set(null);
      this.message.set('Choose an Excel (.xlsx, .xls) or CSV (.csv) file.');
      this.state.set('error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.selectedFile.set(null);
      this.message.set('The file is larger than 5 MB. Please reduce the file size and try again.');
      this.state.set('error');
      return;
    }
    this.selectedFile.set(file);
    this.message.set('');
    this.learningPathId.set('');
    this.state.set('ready');
  }
}
