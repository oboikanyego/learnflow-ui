import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { Analytics } from '../../models/learning.models';

interface LessonLike { _id:string; title:string; scheduledAt?:string; durationMinutes:number; }

@Component({
  standalone:true,
  imports:[RouterLink,MatButtonModule],
  template:`
    <section class="today page-enter">
      <div class="page-head">
        <div><span class="eyebrow">Today</span><h1>Keep learning moving.</h1><p class="muted">Start with the next session. Use the rest of the page only when you need it.</p></div>
        <div class="head-actions"><a mat-stroked-button routerLink="/study-history">Study history</a><a mat-stroked-button routerLink="/goals">Goals</a></div>
      </div>

      @if(stats();as s){
        @if(nextLesson(s);as lesson){
          <section class="next-panel">
            <div class="next-main">
              <span class="next-label">Next session</span>
              <h2>{{lesson.title}}</h2>
              <p class="next-meta">{{formatFull(lesson.scheduledAt)}} <span>•</span> {{lesson.durationMinutes}} minutes</p>
              <div class="next-actions"><a mat-flat-button [routerLink]="['/focus',lesson._id]">Start session</a><a mat-stroked-button routerLink="/board">View board</a></div>
            </div>
            <aside class="schedule-tools">
              <span class="schedule-label">Schedule tools</span>
              <button type="button" class="schedule-action" (click)="downloadIcs(lesson)"><span>Download calendar file</span><small>.ics</small></button>
              <a class="schedule-action" [href]="googleCalendarUrl(lesson)" target="_blank" rel="noopener"><span>Add to Google Calendar</span><small>↗</small></a>
              <a class="schedule-action" [href]="outlookCalendarUrl(lesson)" target="_blank" rel="noopener"><span>Add to Outlook</span><small>↗</small></a>
            </aside>
          </section>
        } @else {
          <section class="empty-next"><div><span class="next-label">Nothing scheduled</span><h2>Your learning calendar is clear.</h2><p>Choose an existing lesson from the board or create a realistic plan for the week.</p></div><div class="next-actions"><a mat-flat-button routerLink="/ai-planner">Create plan</a><a mat-stroked-button routerLink="/board">Open board</a></div></section>
        }

        <section class="signal-grid" aria-label="Learning summary">
          <article><span>Learning health</span><strong>{{healthLabel(s)}}</strong><small>{{healthCopy(s)}}</small></article>
          <article><span>Focus this week</span><strong>{{s.focusMinutesThisWeek ?? 0}} min</strong><small>{{s.sessionsCompleted ?? 0}} completed sessions</small></article>
          <article [class.alert]="s.missedLessons>0"><span>Needs rescheduling</span><strong>{{s.missedLessons}}</strong><small>{{s.missedLessons ? 'Missed lessons are waiting for a new date.' : 'Nothing is overdue.'}}</small></article>
          <article><span>Current streak</span><strong>{{s.currentStreakDays}} days</strong><small>{{s.currentStreakDays ? 'Keep the next commitment realistic.' : 'Complete one lesson to start again.'}}</small></article>
        </section>

        <section class="week-card">
          <div class="week-head"><div><span class="mini-label">Schedule</span><h3>Coming up</h3></div><a routerLink="/board">Manage schedule</a></div>
          <div class="lesson-list">
            @for(lesson of s.nextLessons;track lesson._id){
              <article><div class="date"><strong>{{day(lesson.scheduledAt)}}</strong><span>{{month(lesson.scheduledAt)}}</span></div><div class="lesson-copy"><strong>{{lesson.title}}</strong><small>{{formatFull(lesson.scheduledAt)}} · {{lesson.durationMinutes}} min</small></div><div class="row-actions"><a mat-button [routerLink]="['/focus',lesson._id]">Start</a><button mat-button (click)="downloadIcs(lesson)">Calendar</button></div></article>
            } @empty { <div class="empty-row">No upcoming sessions. Add one from your board when you are ready.</div> }
          </div>
        </section>
      } @else { <div class="loading-card">Loading your day…</div> }
    </section>
  `,
  styles:[`
    .today{max-width:1160px;margin:0 auto}.head-actions{display:flex;gap:8px;flex-wrap:wrap}.next-panel{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(250px,.65fr);border:1px solid #e4e7ec;border-radius:12px;background:#fff;margin-bottom:14px;box-shadow:0 1px 2px rgba(16,24,40,.04);overflow:hidden}.next-main{padding:28px}.next-label,.schedule-label{display:block;color:#667085;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.next-main h2{font-size:1.6rem;margin:8px 0 7px;color:#101828}.next-meta{margin:0;color:#667085}.next-meta span{padding:0 3px;color:#b0b7c3}.next-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.schedule-tools{padding:18px;border-left:1px solid #eaecf0;background:#f9fafb}.schedule-label{margin:3px 8px 10px}.schedule-action{width:100%;min-height:40px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;border:0;border-radius:7px;background:transparent;color:#344054;text-decoration:none;text-align:left;font:inherit;font-weight:650;cursor:pointer}.schedule-action:hover{background:#fff}.schedule-action small{color:#98a2b3}.signal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.signal-grid article{padding:17px;border:1px solid #e4e7ec;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.025)}.signal-grid article.alert{border-color:#fecdca;background:#fffafa}.signal-grid span{display:block;color:#667085;font-size:.66rem;font-weight:760;text-transform:uppercase;letter-spacing:.035em}.signal-grid strong{display:block;color:#101828;font-size:1.2rem;margin:5px 0}.signal-grid small{color:#667085;line-height:1.45}.week-card{padding:20px;border:1px solid #e4e7ec;border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.03)}.week-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.week-head h3{margin:3px 0;font-size:1rem}.week-head a{color:#175cd3;font-weight:700;text-decoration:none;font-size:.74rem}.lesson-list article{display:grid;grid-template-columns:46px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #eaecf0}.date{width:44px;height:44px;border-radius:8px;background:#f2f4f7;color:#344054;display:grid;place-items:center;align-content:center}.date strong{line-height:1}.date span{font-size:.58rem;text-transform:uppercase;color:#667085}.lesson-copy{display:flex;flex-direction:column}.lesson-copy strong{color:#101828;font-size:.86rem}.lesson-copy small{color:#667085;margin-top:3px}.row-actions{display:flex;gap:1px}.empty-next,.loading-card{padding:28px;border:1px dashed #d0d5dd;border-radius:12px;background:#fff;margin-bottom:14px}.empty-next{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.empty-next h2{margin:6px 0 5px;font-size:1.3rem}.empty-next p{margin:0;color:#667085}.empty-row{padding:18px 4px;color:#667085}@media(max-width:900px){.next-panel{grid-template-columns:1fr}.schedule-tools{border-left:0;border-top:1px solid #eaecf0}.signal-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.signal-grid{grid-template-columns:1fr}.lesson-list article{grid-template-columns:46px 1fr}.row-actions{grid-column:2}.head-actions{width:100%}.empty-next{align-items:flex-start;flex-direction:column}.next-actions{width:100%}.next-actions a{flex:1}}
  `]
})
export class TodayComponent implements OnInit{
  private readonly api=inject(ApiService);readonly stats=signal<Analytics|null>(null);
  ngOnInit():void{this.api.get<Analytics>('/api/v1/analytics').subscribe(value=>this.stats.set(value));}
  nextLesson(stats:Analytics):LessonLike|null{return (stats.nextLessons?.[0] as LessonLike|undefined)??null;}
  healthLabel(s:Analytics):string{return s.missedLessons>2?'Needs attention':s.completionRate>=70?'On track':s.completionRate>=40?'Building momentum':'Getting started';}
  healthCopy(s:Analytics):string{return s.missedLessons>2?'Reschedule missed work before adding more.':s.scheduledLessons?'Your upcoming schedule is protecting momentum.':'Schedule one lesson to turn intent into a commitment.';}
  formatFull(value?:string):string{if(!value)return'Not scheduled';return new Intl.DateTimeFormat(undefined,{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
  day(value?:string):string{return value?new Intl.DateTimeFormat(undefined,{day:'2-digit'}).format(new Date(value)):'--';}
  month(value?:string):string{return value?new Intl.DateTimeFormat(undefined,{month:'short'}).format(new Date(value)):'--';}
  downloadIcs(lesson:LessonLike):void{if(!lesson.scheduledAt)return;const start=new Date(lesson.scheduledAt);const end=new Date(start.getTime()+lesson.durationMinutes*60000);const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LearnFlow//Learning Session//EN','BEGIN:VEVENT',`UID:${lesson._id}@learnflow`,`DTSTAMP:${this.icsDate(new Date())}`,`DTSTART:${this.icsDate(start)}`,`DTEND:${this.icsDate(end)}`,`SUMMARY:${this.escapeIcs(lesson.title)}`,'DESCRIPTION:Scheduled learning session from LearnFlow','END:VEVENT','END:VCALENDAR'].join('\r\n');const blob=new Blob([body],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${lesson.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'learnflow-session'}.ics`;a.click();URL.revokeObjectURL(url);}
  googleCalendarUrl(lesson:LessonLike):string{if(!lesson.scheduledAt)return'#';const start=new Date(lesson.scheduledAt),end=new Date(start.getTime()+lesson.durationMinutes*60000);return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(lesson.title)}&dates=${this.icsDate(start)}/${this.icsDate(end)}&details=${encodeURIComponent('LearnFlow learning session')}`;}
  outlookCalendarUrl(lesson:LessonLike):string{if(!lesson.scheduledAt)return'#';const start=new Date(lesson.scheduledAt),end=new Date(start.getTime()+lesson.durationMinutes*60000);return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(lesson.title)}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${encodeURIComponent('LearnFlow learning session')}`;}
  private icsDate(date:Date):string{return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}private escapeIcs(value:string):string{return value.replace(/([,;])/g,'\\$1').replace(/\n/g,'\\n');}
}
