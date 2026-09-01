import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface StudySessionItem { _id:string; lessonId:string; lessonTitle:string; status:'ACTIVE'|'PAUSED'|'COMPLETED'|'ABANDONED'; startedAt:string; endedAt?:string; elapsedSeconds:number; pauseCount:number; reflection?:string; }

@Component({
  standalone:true,
  imports:[RouterLink,MatButtonModule],
  template:`
    <section class="history page-enter">
      <div class="page-head"><div><span class="eyebrow">Study history</span><h1>Your real learning time</h1><p class="muted">Review completed focus sessions, actual time invested and session reflections.</p></div><a mat-flat-button class="primary-cta" routerLink="/today">Start from Today</a></div>
      <section class="summary-grid"><article><span>Completed sessions</span><strong>{{completedCount()}}</strong></article><article><span>Tracked time</span><strong>{{trackedHours()}}</strong></article><article><span>Total pauses</span><strong>{{pauseCount()}}</strong></article></section>
      <section class="session-list">
        @for(item of sessions();track item._id){
          <article><div class="session-main"><span class="state" [attr.data-state]="item.status">{{item.status}}</span><strong>{{item.lessonTitle}}</strong><small>{{formatDate(item.startedAt)}} · {{formatDuration(item.elapsedSeconds)}}</small>@if(item.reflection){<p>{{item.reflection}}</p>}</div><div class="session-actions"><a mat-stroked-button [routerLink]="['/focus',item.lessonId]">Open lesson</a></div></article>
        } @empty { <div class="empty"><strong>No tracked study sessions yet.</strong><span>Start a lesson from Today to begin measuring actual focus time.</span></div> }
      </section>
    </section>
  `,
  styles:[`
    .history{max-width:1100px;margin:0 auto}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.summary-grid article{padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff}.summary-grid span{display:block;color:#7a869a;font-size:.68rem;text-transform:uppercase;font-weight:800}.summary-grid strong{display:block;color:#10233f;font-size:1.6rem;margin-top:6px}.session-list{display:grid;gap:10px}.session-list article{display:flex;justify-content:space-between;gap:16px;padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff}.session-main{display:flex;flex-direction:column;gap:4px}.session-main>strong{color:#10233f}.session-main small{color:#7a869a}.session-main p{margin:8px 0 0;color:#526178;max-width:760px}.state{width:max-content;padding:4px 7px;border-radius:999px;background:#eef2f7;color:#526178;font-size:.62rem;font-weight:850}.state[data-state="COMPLETED"]{background:#e7f6ee;color:#137253}.state[data-state="ABANDONED"]{background:#fff1f1;color:#a8323e}.empty{padding:28px;border:1px dashed #ccd7e5;border-radius:18px;background:#fff;display:flex;flex-direction:column;gap:5px}.empty span{color:#7a869a}@media(max-width:650px){.summary-grid{grid-template-columns:1fr}.session-list article{flex-direction:column}.session-actions a{width:100%}}
  `]
})
export class StudyHistoryComponent implements OnInit{
  private readonly api=inject(ApiService);readonly sessions=signal<StudySessionItem[]>([]);
  ngOnInit():void{this.api.get<StudySessionItem[]>('/api/v1/study-sessions').subscribe(value=>this.sessions.set(value));}
  completedCount():number{return this.sessions().filter(item=>item.status==='COMPLETED').length;}
  trackedHours():string{return `${(this.sessions().filter(item=>item.status==='COMPLETED').reduce((sum,item)=>sum+item.elapsedSeconds,0)/3600).toFixed(1)} h`;}
  pauseCount():number{return this.sessions().reduce((sum,item)=>sum+item.pauseCount,0);}
  formatDate(value:string):string{return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
  formatDuration(seconds:number):string{const minutes=Math.round(seconds/60);return minutes>=60?`${Math.floor(minutes/60)}h ${minutes%60}m`:`${Math.max(1,minutes)} min`;}
}
