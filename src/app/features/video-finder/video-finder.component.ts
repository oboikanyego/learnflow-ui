import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { Lesson } from '../../models/learning.models';

interface VideoLesson {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduledAt?: string;
  durationMinutes: number;
  learningPathId?: string;
}

interface LessonVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  watchUrl: string;
  embedUrl: string;
}

interface VideoSearchResponse {
  lesson: VideoLesson;
  requestedQuery: string;
  searchQuery: string;
  aiEnhanced: boolean;
  provider: string | null;
  videos: LessonVideo[];
}

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="video-page page-enter">
      <header class="page-head video-head">
        <div>
          <span class="eyebrow">Learning library</span>
          <h1>Find lesson videos</h1>
          <p class="muted">Choose one of your lessons, let AI improve the search, then watch relevant YouTube tutorials without leaving LearnFlow.</p>
        </div>
        <span class="youtube-badge">YouTube · AI assisted</span>
      </header>

      <div class="finder-shell">
        <aside class="lesson-browser">
          <div class="panel-title">
            <div><span class="mini-label">Step 1</span><h2>Choose a lesson</h2></div>
            <span>{{lessons().length}} shown</span>
          </div>

          <div class="lesson-search-row">
            <mat-form-field appearance="outline">
              <mat-label>Search your lessons</mat-label>
              <input matInput [(ngModel)]="lessonQuery" (keyup.enter)="searchLessons()" placeholder="e.g. RxJS operators">
            </mat-form-field>
            <button mat-stroked-button type="button" (click)="searchLessons()" [disabled]="loadingLessons()">{{loadingLessons()?'Searching…':'Search'}}</button>
          </div>

          <div class="lesson-list">
            @for(item of lessons();track item.id){
              <button type="button" class="lesson-option" [class.selected]="selectedLesson()?.id===item.id" (click)="selectLesson(item)">
                <span class="lesson-dot"></span>
                <span class="lesson-option-copy">
                  <strong>{{item.title}}</strong>
                  <small>{{statusLabel(item.status)}} · {{item.durationMinutes}} min</small>
                </span>
                <span class="lesson-arrow">›</span>
              </button>
            } @empty {
              <div class="empty-small">{{loadingLessons()?'Loading lessons…':'No lessons matched your search.'}}</div>
            }
          </div>
        </aside>

        <main class="video-workspace">
          @if(selectedLesson();as lesson){
            <section class="selected-lesson-card">
              <div>
                <span class="mini-label">Selected lesson</span>
                <h2>{{lesson.title}}</h2>
                <p>{{lesson.description || 'AI will use the lesson title to find practical learning material.'}}</p>
              </div>
              <span class="duration-pill">{{lesson.durationMinutes}} min</span>
            </section>

            <section class="discovery-card">
              <div class="discovery-copy">
                <span class="mini-label">Step 2</span>
                <h3>What kind of video do you need?</h3>
                <p>Optional. Add a refinement such as “beginner explanation”, “Angular example”, “interview prep” or “deep dive”.</p>
              </div>
              <div class="video-search-row">
                <mat-form-field appearance="outline">
                  <mat-label>Refine the search</mat-label>
                  <input matInput [(ngModel)]="videoQuery" (keyup.enter)="findVideos()" placeholder="Optional refinement">
                </mat-form-field>
                <button mat-flat-button class="find-button" type="button" (click)="findVideos()" [disabled]="searchingVideos()">
                  {{searchingVideos()?'Finding videos…':'Find with AI'}}
                </button>
              </div>
              @if(searchMeta();as meta){
                <div class="ai-query"><span>AI search</span><strong>{{meta.searchQuery}}</strong>@if(meta.aiEnhanced){<em>{{providerLabel(meta.provider)}}</em>}</div>
              }
            </section>

            @if(error()){
              <div class="error-card"><strong>Video search unavailable</strong><span>{{error()}}</span></div>
            }

            @if(selectedVideo();as video){
              <section class="player-card">
                <div class="player-frame">
                  <iframe
                    [src]="selectedEmbedUrl()"
                    [title]="video.title"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen>
                  </iframe>
                </div>
                <div class="player-info">
                  <div><span class="mini-label">Now playing</span><h2>{{video.title}}</h2><p>{{video.channelTitle}}</p></div>
                  <a [href]="video.watchUrl" target="_blank" rel="noopener">Open on YouTube ↗</a>
                </div>
              </section>
            }

            @if(videos().length){
              <section class="results-section">
                <div class="results-head"><div><span class="mini-label">Step 3</span><h2>Recommended videos</h2></div><span>{{videos().length}} results</span></div>
                <div class="video-grid">
                  @for(video of videos();track video.videoId){
                    <button type="button" class="video-card" [class.active]="selectedVideo()?.videoId===video.videoId" (click)="play(video)">
                      <span class="thumbnail-wrap">
                        <img [src]="video.thumbnailUrl" [alt]="video.title" loading="lazy">
                        <span class="play-mark">▶</span>
                      </span>
                      <span class="video-copy">
                        <strong>{{video.title}}</strong>
                        <small>{{video.channelTitle}}</small>
                        <span>{{truncate(video.description,110)}}</span>
                      </span>
                    </button>
                  }
                </div>
              </section>
            } @else if(!searchingVideos()) {
              <section class="video-empty">
                <div class="empty-icon">▶</div>
                <h3>Ready to find a lesson video</h3>
                <p>Use “Find with AI” to search YouTube for this lesson. Results will appear here and can be played inside LearnFlow.</p>
              </section>
            }
          } @else {
            <section class="video-empty choose-empty">
              <div class="empty-icon">⌕</div>
              <h2>Select a lesson first</h2>
              <p>Search your learning plan on the left, then choose the lesson you want to study with video.</p>
            </section>
          }
        </main>
      </div>
    </section>
  `,
  styles: [`
    .video-page{max-width:1480px;margin:0 auto;overflow-x:hidden}.video-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.video-head h1{margin-bottom:7px}.youtube-badge{flex:0 0 auto;padding:8px 11px;border-radius:999px;background:#fff1f0;color:#b42318;border:1px solid #fecdca;font-size:.7rem;font-weight:850}.finder-shell{display:grid;grid-template-columns:minmax(280px,340px) minmax(0,1fr);gap:18px;align-items:start}.lesson-browser,.selected-lesson-card,.discovery-card,.player-card,.results-section,.video-empty{background:#fff;border:1px solid #e4e7ec;border-radius:18px;box-shadow:0 1px 2px rgba(16,24,40,.03)}.lesson-browser{position:sticky;top:88px;padding:18px;max-height:calc(100vh - 110px);display:flex;flex-direction:column}.panel-title,.results-head,.selected-lesson-card,.player-info{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.panel-title h2,.results-head h2,.selected-lesson-card h2,.player-info h2{margin:4px 0;color:#101828}.panel-title>span,.results-head>span{font-size:.68rem;color:#667085}.lesson-search-row,.video-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start}.lesson-search-row{margin-top:12px}.lesson-search-row mat-form-field,.video-search-row mat-form-field{width:100%}.lesson-search-row button,.find-button{min-height:56px}.lesson-list{display:flex;flex-direction:column;gap:5px;overflow-y:auto;padding-right:2px;min-height:0}.lesson-option{width:100%;display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px;border:1px solid transparent;border-radius:12px;background:#fafbfc;text-align:left;cursor:pointer;color:#344054}.lesson-option:hover{background:#f2f4f7}.lesson-option.selected{background:#eef4ff;border-color:#b2ccff}.lesson-dot{width:7px;height:7px;border-radius:50%;background:#98a2b3}.lesson-option.selected .lesson-dot{background:#175cd3}.lesson-option-copy{min-width:0}.lesson-option-copy strong{display:block;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lesson-option-copy small{display:block;margin-top:4px;color:#667085;font-size:.64rem}.lesson-arrow{color:#98a2b3;font-size:1.2rem}.empty-small{padding:20px 8px;text-align:center;color:#667085;font-size:.75rem}.video-workspace{min-width:0;display:flex;flex-direction:column;gap:14px}.selected-lesson-card{padding:20px}.selected-lesson-card p{margin:5px 0 0;color:#667085;line-height:1.55;font-size:.78rem;max-width:760px}.duration-pill{padding:6px 9px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:.68rem;font-weight:800}.discovery-card{padding:20px}.discovery-copy h3{margin:4px 0;color:#101828}.discovery-copy p{margin:0 0 13px;color:#667085;font-size:.76rem;line-height:1.5}.find-button{background:#175cd3!important;color:#fff!important}.ai-query{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;padding:10px 12px;border-radius:10px;background:#f8fafc;border:1px solid #eaecf0}.ai-query span{color:#667085;font-size:.65rem;font-weight:800;text-transform:uppercase}.ai-query strong{color:#344054;font-size:.74rem}.ai-query em{margin-left:auto;padding:3px 7px;border-radius:999px;background:#ecfdf3;color:#027a48;font-size:.62rem;font-style:normal;font-weight:800}.error-card{padding:13px 15px;border:1px solid #fecdca;background:#fef3f2;border-radius:12px;color:#b42318;display:flex;gap:7px;flex-direction:column;font-size:.76rem}.player-card{overflow:hidden}.player-frame{position:relative;width:100%;aspect-ratio:16/9;background:#101828;min-height:200px}.player-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.player-info{padding:17px 19px}.player-info h2{font-size:1.05rem}.player-info p{margin:4px 0 0;color:#667085;font-size:.73rem}.player-info a{flex:0 0 auto;color:#175cd3;text-decoration:none;font-size:.72rem;font-weight:800}.results-section{padding:18px}.video-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.video-card{min-width:0;display:grid;grid-template-columns:145px minmax(0,1fr);gap:11px;padding:9px;border:1px solid #eaecf0;border-radius:13px;background:#fff;text-align:left;cursor:pointer}.video-card:hover,.video-card.active{border-color:#84adff;background:#f5f8ff}.thumbnail-wrap{position:relative;display:block;aspect-ratio:16/9;border-radius:9px;overflow:hidden;background:#101828}.thumbnail-wrap img{width:100%;height:100%;object-fit:cover;display:block}.play-mark{position:absolute;left:8px;bottom:7px;width:29px;height:29px;border-radius:50%;display:grid;place-items:center;background:rgba(16,24,40,.82);color:#fff;font-size:.65rem}.video-copy{min-width:0}.video-copy strong{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#101828;font-size:.78rem;line-height:1.35}.video-copy small{display:block;margin:6px 0;color:#475467;font-size:.65rem;font-weight:750}.video-copy>span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:#667085;font-size:.66rem;line-height:1.45}.video-empty{padding:48px 24px;text-align:center}.choose-empty{min-height:430px;display:flex;flex-direction:column;justify-content:center}.empty-icon{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;margin:0 auto 13px;background:#eef4ff;color:#175cd3;font-weight:900}.video-empty h2,.video-empty h3{margin:0;color:#101828}.video-empty p{max-width:560px;margin:8px auto 0;color:#667085;line-height:1.6;font-size:.78rem}@media(max-width:1180px){.video-grid{grid-template-columns:1fr}.video-card{grid-template-columns:180px minmax(0,1fr)}}@media(max-width:900px){.finder-shell{grid-template-columns:1fr}.lesson-browser{position:static;max-height:none}.lesson-list{max-height:340px}.video-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.video-card{grid-template-columns:1fr}.thumbnail-wrap{width:100%}.player-frame{min-height:0}}@media(max-width:640px){.video-head{flex-direction:column}.finder-shell{gap:12px}.lesson-browser,.selected-lesson-card,.discovery-card,.results-section{border-radius:14px}.lesson-search-row,.video-search-row{grid-template-columns:1fr}.lesson-search-row button,.find-button{width:100%;min-height:44px}.selected-lesson-card,.player-info{flex-direction:column}.video-grid{grid-template-columns:1fr}.video-card{grid-template-columns:120px minmax(0,1fr)}.video-copy>span{display:none}.player-info a{width:100%}.youtube-badge{align-self:flex-start}}@media(max-width:420px){.video-card{grid-template-columns:1fr}.video-copy>span{display:-webkit-box}.lesson-browser,.selected-lesson-card,.discovery-card,.results-section{padding:15px}.video-empty{padding:36px 18px}}
  `]
})
export class VideoFinderComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly lessons = signal<VideoLesson[]>([]);
  readonly selectedLesson = signal<VideoLesson | null>(null);
  readonly videos = signal<LessonVideo[]>([]);
  readonly selectedVideo = signal<LessonVideo | null>(null);
  readonly selectedEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const video = this.selectedVideo();
    return video
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}?rel=0`)
      : null;
  });
  readonly searchMeta = signal<VideoSearchResponse | null>(null);
  readonly loadingLessons = signal(false);
  readonly searchingVideos = signal(false);
  readonly error = signal('');
  lessonQuery = '';
  videoQuery = '';

  ngOnInit(): void {
    const lessonId = this.route.snapshot.queryParamMap.get('lessonId');
    this.searchLessons();
    if (lessonId) {
      this.api.get<Lesson>(`/api/v1/lessons/${lessonId}`).subscribe({
        next: lesson => this.selectLesson({
          id: lesson._id,
          title: lesson.title,
          description: lesson.description ?? '',
          status: lesson.status,
          scheduledAt: lesson.scheduledAt,
          durationMinutes: lesson.durationMinutes
        }),
        error: () => undefined
      });
    }
  }

  searchLessons(): void {
    this.loadingLessons.set(true);
    const query = this.lessonQuery.trim();
    const path = `/api/v1/videos/lessons${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    this.api.get<VideoLesson[]>(path).subscribe({
      next: lessons => { this.lessons.set(lessons); this.loadingLessons.set(false); },
      error: () => { this.lessons.set([]); this.loadingLessons.set(false); }
    });
  }

  selectLesson(lesson: VideoLesson): void {
    if (this.selectedLesson()?.id === lesson.id) return;
    this.selectedLesson.set(lesson);
    this.videos.set([]);
    this.selectedVideo.set(null);
    this.searchMeta.set(null);
    this.videoQuery = '';
    this.error.set('');
  }

  findVideos(): void {
    const lesson = this.selectedLesson();
    if (!lesson || this.searchingVideos()) return;
    this.searchingVideos.set(true);
    this.error.set('');
    this.api.post<{ lessonId: string; query?: string }, VideoSearchResponse>('/api/v1/videos/search', {
      lessonId: lesson.id,
      ...(this.videoQuery.trim() ? { query: this.videoQuery.trim() } : {})
    }).subscribe({
      next: response => {
        this.searchMeta.set(response);
        this.videos.set(response.videos);
        this.selectedVideo.set(response.videos[0] ?? null);
        this.searchingVideos.set(false);
      },
      error: event => {
        this.videos.set([]);
        this.selectedVideo.set(null);
        this.error.set(event.error?.message ?? 'Could not find YouTube videos for this lesson.');
        this.searchingVideos.set(false);
      }
    });
  }

  play(video: LessonVideo): void { this.selectedVideo.set(video); }
  statusLabel(value: string): string { return value.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, char => char.toUpperCase()); }
  providerLabel(provider: string | null): string { return provider ? `${provider.charAt(0).toUpperCase()}${provider.slice(1)} assisted` : 'AI assisted'; }
  truncate(value: string, length: number): string { const text = value.trim(); return text.length > length ? `${text.slice(0, length).trim()}…` : text; }
}