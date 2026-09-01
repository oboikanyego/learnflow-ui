import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { Analytics } from '../../models/learning.models';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="page-enter dashboard-page">
      <div class="page-head dashboard-head">
        <div>
          <span class="eyebrow">Learning intelligence</span>
          <h1>Your learning dashboard</h1>
          <p class="muted">See momentum, consistency and where your attention should go next.</p>
        </div>
        @if (stats(); as s) {
          <div class="health-chip"><span></span>{{ s.completionRate >= 70 ? 'Healthy progress' : s.completionRate >= 40 ? 'Building momentum' : 'Needs attention' }}</div>
        }
      </div>

      @if (stats(); as s) {
        <section class="kpi-grid">
          <article class="kpi-card kpi-primary"><span>Completion</span><strong>{{ animatedCompletion() }}%</strong><small>{{ s.completedLessons }} of {{ s.totalLessons }} lessons completed</small></article>
          <article class="kpi-card"><span>Completed hours</span><strong>{{ animatedHours().toFixed(1) }}</strong><small>Hours invested in completed lessons</small></article>
          <article class="kpi-card"><span>Current streak</span><strong>{{ animatedStreak() }}</strong><small>Consecutive learning days</small></article>
          <article class="kpi-card"><span>Learning paths</span><strong>{{ animatedPaths() }}</strong><small>Active learning outcomes</small></article>
        </section>

        <section class="dashboard-grid">
          <article class="analytics-card trend-card">
            <div class="card-head"><div><span class="mini-label">8 week trend</span><h3>Lessons completed</h3></div><strong>{{ s.completedLessons }}</strong></div>
            <div class="bar-chart" role="img" aria-label="Lessons completed over the last eight weeks">
              @for (week of s.weeklyCompletions; track week.weekStart) {
                <div class="bar-item"><div class="bar-track"><span [style.height.%]="barHeight(week.completed)"></span></div><strong>{{ week.completed }}</strong><small>{{ week.label }}</small></div>
              }
            </div>
          </article>

          <article class="analytics-card distribution-card">
            <div class="card-head"><div><span class="mini-label">Work distribution</span><h3>Lesson status</h3></div></div>
            <div class="donut-wrap">
              <div class="donut" [style.--progress]="s.completionRate + '%' "><div><strong>{{ s.completionRate }}%</strong><span>complete</span></div></div>
              <div class="status-list">
                @for (item of s.statusBreakdown; track item.status) {
                  <div><span class="status-dot" [attr.data-status]="item.status"></span><span>{{ label(item.status) }}</span><strong>{{ item.count }}</strong></div>
                }
              </div>
            </div>
          </article>

          <article class="analytics-card attention-card">
            <div class="card-head"><div><span class="mini-label">Attention</span><h3>Momentum signals</h3></div></div>
            <div class="signal-grid">
              <div><span>Scheduled</span><strong>{{ s.scheduledLessons }}</strong><small>Committed lessons ahead</small></div>
              <div><span>Missed</span><strong>{{ s.missedLessons }}</strong><small>{{ s.missedLessons ? 'Reschedule these to recover momentum' : 'Nothing currently needs recovery' }}</small></div>
              <div><span>Total workload</span><strong>{{ s.totalLessons }}</strong><small>Lessons across all learning paths</small></div>
            </div>
            <a mat-flat-button routerLink="/board" class="primary-cta">Open learning board</a>
          </article>

          <article class="analytics-card upcoming-card">
            <div class="card-head"><div><span class="mini-label">Next up</span><h3>Upcoming sessions</h3></div><a routerLink="/board">View board →</a></div>
            <div class="upcoming-list">
              @for (lesson of s.nextLessons; track lesson._id) {
                <div class="upcoming-item"><span class="date-tile"><strong>{{ day(lesson.scheduledAt) }}</strong><small>{{ month(lesson.scheduledAt) }}</small></span><div><strong>{{ lesson.title }}</strong><small>{{ formatSchedule(lesson.scheduledAt) }} · {{ lesson.durationMinutes }} min</small></div></div>
              } @empty {
                <div class="empty-mini"><strong>No upcoming sessions</strong><span>Schedule a lesson to create your next learning commitment.</span></div>
              }
            </div>
          </article>
        </section>
      } @else {
        <div class="dashboard-skeleton"><div></div><div></div><div></div><div></div></div>
      }
    </section>
  `,
  styles: [`
    .dashboard-page{max-width:1320px;margin:0 auto}.dashboard-head{align-items:flex-end}.health-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid #d8e1ec;border-radius:999px;background:#fff;color:#40516a;font-size:.78rem;font-weight:800}.health-chip span{width:8px;height:8px;border-radius:50%;background:#16805c;box-shadow:0 0 0 5px rgba(22,128,92,.11)}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px}.kpi-card{position:relative;overflow:hidden;padding:22px;border:1px solid #dfe5ed;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(16,35,63,.045)}.kpi-card>span{display:block;color:#66758a;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.kpi-card strong{display:block;margin:8px 0 4px;font-size:2.35rem;letter-spacing:-.05em;color:#10233f}.kpi-card small{color:#7a869a}.kpi-primary{background:linear-gradient(145deg,#10233f,#183d69);border-color:#10233f}.kpi-primary>span,.kpi-primary small{color:#c5d4e8}.kpi-primary strong{color:#fff}.dashboard-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:18px}.analytics-card{border:1px solid #dfe5ed;border-radius:20px;background:#fff;padding:22px;box-shadow:0 12px 32px rgba(16,35,63,.045)}.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px}.card-head h3{margin:4px 0 0;color:#10233f}.card-head>a{font-size:.78rem;color:#2f6fed;font-weight:800;text-decoration:none}.bar-chart{height:260px;display:grid;grid-template-columns:repeat(8,1fr);gap:10px;align-items:end;padding-top:15px}.bar-item{height:100%;display:grid;grid-template-rows:1fr auto auto;align-items:end;text-align:center;gap:5px}.bar-track{height:100%;min-height:150px;display:flex;align-items:end;justify-content:center;background:linear-gradient(180deg,#f8fafc,#eef3f8);border-radius:10px;padding:5px}.bar-track span{display:block;width:100%;min-height:6px;border-radius:7px;background:linear-gradient(180deg,#2f6fed,#20a4c7);transition:height .7s cubic-bezier(.2,.8,.2,1)}.bar-item strong{font-size:.74rem;color:#40516a}.bar-item small{font-size:.65rem;color:#7a869a}.donut-wrap{display:grid;grid-template-columns:180px 1fr;gap:24px;align-items:center}.donut{--progress:0%;width:172px;height:172px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#2f6fed var(--progress),#e9eef4 0);position:relative}.donut:after{content:"";position:absolute;width:125px;height:125px;background:#fff;border-radius:50%}.donut>div{position:relative;z-index:1;text-align:center}.donut strong{display:block;font-size:1.8rem;color:#10233f}.donut span{color:#7a869a;font-size:.72rem}.status-list{display:grid;gap:10px}.status-list>div{display:grid;grid-template-columns:10px 1fr auto;align-items:center;gap:9px;font-size:.78rem;color:#59687d}.status-list strong{color:#10233f}.status-dot{width:9px;height:9px;border-radius:50%;background:#94a3b8}.status-dot[data-status="COMPLETED"]{background:#16805c}.status-dot[data-status="SCHEDULED"]{background:#2f6fed}.status-dot[data-status="IN_PROGRESS"]{background:#20a4c7}.status-dot[data-status="MISSED"]{background:#bb3f4b}.status-dot[data-status="SKIPPED"]{background:#b56a12}.signal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}.signal-grid>div{padding:14px;border-radius:13px;background:#f7f9fc;border:1px solid #e6ebf1}.signal-grid span{display:block;font-size:.68rem;color:#7a869a;font-weight:800;text-transform:uppercase}.signal-grid strong{display:block;font-size:1.35rem;margin:5px 0;color:#10233f}.signal-grid small{font-size:.69rem;color:#66758a}.upcoming-list{display:grid;gap:9px}.upcoming-item{display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #edf1f5}.upcoming-item:last-child{border-bottom:0}.date-tile{height:48px;border-radius:12px;background:#eef4ff;color:#2f6fed;display:grid;place-items:center;align-content:center;line-height:1}.date-tile strong{font-size:1rem}.date-tile small{font-size:.62rem;text-transform:uppercase;margin-top:3px}.upcoming-item>div{display:flex;flex-direction:column}.upcoming-item>div strong{color:#10233f;font-size:.85rem}.upcoming-item>div small{color:#7a869a;font-size:.72rem;margin-top:3px}.empty-mini{padding:22px;border:1px dashed #d5dce6;border-radius:14px;display:flex;flex-direction:column;gap:4px}.empty-mini strong{color:#10233f}.empty-mini span{color:#7a869a;font-size:.76rem}.dashboard-skeleton{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.dashboard-skeleton div{height:130px;border-radius:18px;background:linear-gradient(90deg,#f1f4f8,#f8fafc,#f1f4f8);background-size:200% 100%;animation:shimmer 1.4s infinite}@keyframes shimmer{to{background-position:-200% 0}}@media(max-width:1000px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.dashboard-grid{grid-template-columns:1fr}}@media(max-width:620px){.kpi-grid{grid-template-columns:1fr}.bar-chart{gap:5px}.donut-wrap{grid-template-columns:1fr;justify-items:center}.status-list{width:100%}.signal-grid{grid-template-columns:1fr}.dashboard-skeleton{grid-template-columns:1fr 1fr}}
  `]
})
export class DashboardComponent implements OnInit,OnDestroy {
  private readonly api=inject(ApiService);private frame=0;
  readonly stats=signal<Analytics|null>(null);readonly animatedCompletion=signal(0);readonly animatedHours=signal(0);readonly animatedStreak=signal(0);readonly animatedPaths=signal(0);
  readonly maxWeekly=computed(()=>Math.max(1,...(this.stats()?.weeklyCompletions.map(item=>item.completed)??[1])));
  ngOnInit():void{this.api.get<Analytics>('/api/v1/analytics').subscribe(value=>{this.stats.set(value);this.animate(value);});}
  ngOnDestroy():void{cancelAnimationFrame(this.frame);}
  animate(value:Analytics){const started=performance.now();const duration=850;const step=(now:number)=>{const p=Math.min(1,(now-started)/duration);const eased=1-Math.pow(1-p,3);this.animatedCompletion.set(Math.round(value.completionRate*eased));this.animatedHours.set(Number((value.completedHours*eased).toFixed(1)));this.animatedStreak.set(Math.round(value.currentStreakDays*eased));this.animatedPaths.set(Math.round(value.learningPaths*eased));if(p<1)this.frame=requestAnimationFrame(step);};this.frame=requestAnimationFrame(step);}
  barHeight(count:number){return Math.max(4,Math.round(count/this.maxWeekly()*100));}
  label(status:string){return status.replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase());}
  day(value?:string){if(!value)return'--';return new Intl.DateTimeFormat(undefined,{day:'2-digit'}).format(new Date(value));}
  month(value?:string){if(!value)return'--';return new Intl.DateTimeFormat(undefined,{month:'short'}).format(new Date(value));}
  formatSchedule(value?:string){if(!value)return'Not scheduled';return new Intl.DateTimeFormat(undefined,{weekday:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
}
