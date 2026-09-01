import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface PublicProgress { title:string;description?:string;status:string;completionRate:number;totalLessons:number;completedLessons:number;completedHours:number;startedAt:string;lastActivityAt:string;isComplete:boolean; }

@Component({
  standalone:true,
  imports:[MatButtonModule],
  template:`
    <section class="public-progress page-enter">
      @if(progress();as p){
        <div class="record" [class.complete]="p.isComplete">
          <div class="record-head"><div><span class="eyebrow">LearnFlow learning record</span><h1>{{p.title}}</h1><p>{{p.description||'A structured learning path tracked with LearnFlow.'}}</p></div><div class="score"><strong>{{p.completionRate}}%</strong><span>complete</span></div></div>
          <div class="progress-track"><span [style.width.%]="p.completionRate"></span></div>
          <div class="stats"><article><strong>{{p.completedLessons}}</strong><span>Lessons completed</span></article><article><strong>{{p.totalLessons}}</strong><span>Total lessons</span></article><article><strong>{{p.completedHours}}</strong><span>Hours invested</span></article><article><strong>{{duration(p.startedAt,p.lastActivityAt)}}</strong><span>Learning span</span></article></div>
          <div class="record-footer"><div><span>Started</span><strong>{{formatDate(p.startedAt)}}</strong></div><div><span>Latest activity</span><strong>{{formatDate(p.lastActivityAt)}}</strong></div><div><span>Status</span><strong>{{p.isComplete?'Completed':'In progress'}}</strong></div></div>
          @if(p.isComplete){<section class="certificate"><span>Completion record</span><strong>This confirms that the learner completed the tracked LearnFlow learning path shown above.</strong><small>This is a LearnFlow activity record, not an accredited qualification or third-party certification.</small></section>}
          <div class="actions"><button mat-stroked-button (click)="print()">{{p.isComplete?'Print completion record':'Print progress summary'}}</button></div>
        </div>
      } @else if(error()){<div class="error-card"><strong>Progress link unavailable</strong><span>{{error()}}</span></div>} @else {<div class="loading">Loading shared progress…</div>}
    </section>
  `,
  styles:[`
    .public-progress{max-width:900px;margin:42px auto;padding:0 20px}.record{padding:34px;border:1px solid #dfe5ed;border-radius:24px;background:#fff;box-shadow:0 22px 60px rgba(16,35,63,.08)}.record.complete{border-color:#b8dcc9}.record-head{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start}.record-head h1{margin:8px 0;color:#10233f}.record-head p{color:#66758a}.score{width:120px;height:120px;border-radius:50%;display:grid;place-items:center;align-content:center;background:#eef4ff;color:#175bbd}.score strong{font-size:2rem}.score span{font-size:.7rem;text-transform:uppercase}.progress-track{height:11px;border-radius:999px;background:#edf1f5;overflow:hidden;margin:24px 0}.progress-track span{display:block;height:100%;background:linear-gradient(90deg,#2f6fed,#20a4c7)}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stats article{padding:16px;border-radius:14px;background:#f7f9fc}.stats strong{display:block;color:#10233f;font-size:1.45rem}.stats span,.record-footer span{color:#7a869a;font-size:.68rem;text-transform:uppercase;font-weight:800}.record-footer{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding-top:20px;margin-top:20px;border-top:1px solid #edf1f5}.record-footer div{display:flex;flex-direction:column;gap:4px}.record-footer strong{color:#40516a}.certificate{margin-top:24px;padding:20px;border:1px solid #b8dcc9;border-radius:16px;background:#f3fbf6;display:flex;flex-direction:column;gap:7px}.certificate>span{color:#16805c;font-size:.7rem;text-transform:uppercase;font-weight:900}.certificate>strong{color:#173d2d}.certificate small{color:#5f766b}.actions{display:flex;justify-content:flex-end;margin-top:20px}.error-card,.loading{padding:30px;border:1px dashed #ccd7e5;border-radius:18px;background:#fff;display:flex;flex-direction:column;gap:6px}.error-card strong{color:#10233f}@media(max-width:650px){.record-head{grid-template-columns:1fr}.score{width:92px;height:92px}.stats{grid-template-columns:1fr 1fr}.record-footer{grid-template-columns:1fr}}@media print{.public-progress{margin:0;max-width:none}.record{box-shadow:none;border:0}.actions{display:none}}
  `]
})
export class PublicProgressComponent implements OnInit{
  private readonly api=inject(ApiService);private readonly route=inject(ActivatedRoute);readonly progress=signal<PublicProgress|null>(null);readonly error=signal('');
  ngOnInit():void{const token=this.route.snapshot.paramMap.get('token');if(!token){this.error.set('This progress link is invalid.');return;}this.api.get<PublicProgress>(`/api/v1/public/progress/${token}`).subscribe({next:value=>this.progress.set(value),error:err=>this.error.set(err?.error?.message??'This public link may have been revoked.')});}
  formatDate(value:string):string{return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'long',year:'numeric'}).format(new Date(value));}
  duration(start:string,end:string):string{const days=Math.max(1,Math.ceil((new Date(end).getTime()-new Date(start).getTime())/86400000));return days<14?`${days} days`:`${Math.ceil(days/7)} weeks`;}
  print():void{window.print();}
}
