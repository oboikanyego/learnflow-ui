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
        <div><span class="eyebrow">Today</span><h1>Your next learning move</h1><p class="muted">One place to see what matters now, protect your schedule and recover momentum.</p></div>
        <a mat-stroked-button routerLink="/goals">Review goals</a>
      </div>

      @if(stats();as s){
        @if(nextLesson(s);as lesson){
          <section class="hero-card">
            <div class="hero-copy"><span class="mini-label">Next scheduled session</span><h2>{{lesson.title}}</h2><p>{{formatFull(lesson.scheduledAt)}} · {{lesson.durationMinutes}} minutes</p><div class="hero-actions"><a mat-flat-button class="primary-cta" routerLink="/board">Open learning board</a><button mat-stroked-button (click)="downloadIcs(lesson)">Download .ics</button></div></div>
            <div class="calendar-card"><strong>Add to calendar</strong><a [href]="googleCalendarUrl(lesson)" target="_blank" rel="noopener">Google Calendar ↗</a><a [href]="outlookCalendarUrl(lesson)" target="_blank" rel="noopener">Outlook ↗</a><small>Keep LearnFlow and your real calendar aligned.</small></div>
          </section>
        } @else {
          <section class="empty-hero"><strong>Your calendar is clear.</strong><span>Schedule your next lesson or let AI Planner build a realistic week.</span><div><a mat-flat-button class="primary-cta" routerLink="/ai-planner">Plan with AI</a><a mat-stroked-button routerLink="/board">Open board</a></div></section>
        }

        <section class="signal-grid">
          <article><span>Learning health</span><strong>{{healthLabel(s)}}</strong><small>{{healthCopy(s)}}</small></article>
          <article><span>Current streak</span><strong>{{s.currentStreakDays}} days</strong><small>{{s.currentStreakDays ? 'Protect the habit with the next scheduled session.' : 'Complete one lesson to restart momentum.'}}</small></article>
          <article [class.alert]="s.missedLessons>0"><span>Recovery queue</span><strong>{{s.missedLessons}}</strong><small>{{s.missedLessons ? 'Missed lessons need a new date.' : 'Nothing is currently overdue.'}}</small></article>
          <article><span>Completion</span><strong>{{s.completionRate}}%</strong><small>{{s.completedLessons}} of {{s.totalLessons}} lessons complete.</small></article>
        </section>

        <section class="week-card">
          <div class="week-head"><div><span class="mini-label">Coming up</span><h3>Your next sessions</h3></div><a routerLink="/board">Manage schedule →</a></div>
          <div class="lesson-list">
            @for(lesson of s.nextLessons;track lesson._id){
              <article><div class="date"><strong>{{day(lesson.scheduledAt)}}</strong><span>{{month(lesson.scheduledAt)}}</span></div><div class="lesson-copy"><strong>{{lesson.title}}</strong><small>{{formatFull(lesson.scheduledAt)}} · {{lesson.durationMinutes}} min</small></div><button mat-button (click)="downloadIcs(lesson)">.ics</button></article>
            } @empty { <div class="empty-row">No upcoming sessions yet.</div> }
          </div>
        </section>
      } @else { <div class="loading-card">Preparing your learning day…</div> }
    </section>
  `,
  styles:[`
    .today{max-width:1180px;margin:0 auto}.hero-card{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,.7fr);gap:20px;padding:28px;border-radius:22px;background:linear-gradient(135deg,#10233f,#193f6d);color:#fff;margin-bottom:18px;box-shadow:0 18px 44px rgba(16,35,63,.16)}.hero-copy h2{font-size:2rem;margin:8px 0}.hero-copy p{color:#c8d6e8}.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.hero-actions .mat-mdc-outlined-button{color:#fff;border-color:#7087a7}.calendar-card{display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16)}.calendar-card a{color:#fff;text-decoration:none;padding:9px 10px;border-radius:9px;background:rgba(255,255,255,.1);font-weight:700}.calendar-card small{color:#c8d6e8}.signal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.signal-grid article{padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff}.signal-grid article.alert{border-color:#f0b8bd;background:#fff8f8}.signal-grid span{display:block;color:#7a869a;font-size:.68rem;font-weight:800;text-transform:uppercase}.signal-grid strong{display:block;color:#10233f;font-size:1.45rem;margin:6px 0}.signal-grid small{color:#66758a}.week-card{padding:22px;border:1px solid #dfe5ed;border-radius:18px;background:#fff}.week-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.week-head h3{margin:3px 0}.week-head a{color:#2f6fed;font-weight:800;text-decoration:none;font-size:.76rem}.lesson-list article{display:grid;grid-template-columns:52px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #edf1f5}.date{width:50px;height:50px;border-radius:12px;background:#eef4ff;color:#2f6fed;display:grid;place-items:center;align-content:center}.date strong{line-height:1}.date span{font-size:.62rem;text-transform:uppercase}.lesson-copy{display:flex;flex-direction:column}.lesson-copy strong{color:#10233f}.lesson-copy small{color:#7a869a;margin-top:3px}.empty-hero,.loading-card{padding:34px;border:1px dashed #ccd7e5;border-radius:18px;background:#fff;margin-bottom:18px;display:flex;flex-direction:column;gap:8px}.empty-hero>div{display:flex;gap:10px;margin-top:8px}.empty-row{padding:18px;color:#7a869a}@media(max-width:900px){.hero-card{grid-template-columns:1fr}.signal-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.signal-grid{grid-template-columns:1fr}.lesson-list article{grid-template-columns:52px 1fr}.lesson-list button{grid-column:2}.hero-actions,.empty-hero>div{flex-direction:column}}
  `]
})
export class TodayComponent implements OnInit{
  private readonly api=inject(ApiService);readonly stats=signal<Analytics|null>(null);
  ngOnInit():void{this.api.get<Analytics>('/api/v1/analytics').subscribe(value=>this.stats.set(value));}
  nextLesson(stats:Analytics):LessonLike|null{return (stats.nextLessons?.[0] as LessonLike|undefined)??null;}
  healthLabel(s:Analytics):string{return s.missedLessons>2?'Needs recovery':s.completionRate>=70?'On track':s.completionRate>=40?'Building momentum':'Getting started';}
  healthCopy(s:Analytics):string{return s.missedLessons>2?'Reschedule missed work before adding more.':s.scheduledLessons?'Your upcoming schedule is protecting momentum.':'Add a scheduled lesson to turn intent into a commitment.';}
  formatFull(value?:string):string{if(!value)return'Not scheduled';return new Intl.DateTimeFormat(undefined,{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
  day(value?:string):string{return value?new Intl.DateTimeFormat(undefined,{day:'2-digit'}).format(new Date(value)):'--';}
  month(value?:string):string{return value?new Intl.DateTimeFormat(undefined,{month:'short'}).format(new Date(value)):'--';}
  downloadIcs(lesson:LessonLike):void{if(!lesson.scheduledAt)return;const start=new Date(lesson.scheduledAt);const end=new Date(start.getTime()+lesson.durationMinutes*60000);const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LearnFlow//Learning Session//EN','BEGIN:VEVENT',`UID:${lesson._id}@learnflow`,`DTSTAMP:${this.icsDate(new Date())}`,`DTSTART:${this.icsDate(start)}`,`DTEND:${this.icsDate(end)}`,`SUMMARY:${this.escapeIcs(lesson.title)}`,'DESCRIPTION:Scheduled learning session from LearnFlow','END:VEVENT','END:VCALENDAR'].join('\r\n');const blob=new Blob([body],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${lesson.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'learnflow-session'}.ics`;a.click();URL.revokeObjectURL(url);}
  googleCalendarUrl(lesson:LessonLike):string{if(!lesson.scheduledAt)return'#';const start=new Date(lesson.scheduledAt),end=new Date(start.getTime()+lesson.durationMinutes*60000);return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(lesson.title)}&dates=${this.icsDate(start)}/${this.icsDate(end)}&details=${encodeURIComponent('LearnFlow learning session')}`;}
  outlookCalendarUrl(lesson:LessonLike):string{if(!lesson.scheduledAt)return'#';const start=new Date(lesson.scheduledAt),end=new Date(start.getTime()+lesson.durationMinutes*60000);return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(lesson.title)}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${encodeURIComponent('LearnFlow learning session')}`;}
  private icsDate(date:Date):string{return date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}private escapeIcs(value:string):string{return value.replace(/([,;])/g,'\\$1').replace(/\n/g,'\\n');}
}
