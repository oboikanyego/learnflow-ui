import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface Goal { _id:string; title:string; description?:string; targetDate?:string; weeklyMinutesTarget:number; status:string; progress:number; completedLessons:number; totalLessons:number; learningPathId?:string }
interface Path { _id:string; title:string }
interface Overview { week:{start:string;end:string;completed:number;missed:number;studiedMinutes:number;completionRate:number;weeklyTargetMinutes:number;targetProgress:number};consistency:{currentStreakDays:number;longestStreakDays:number;activeLearningDays:number};strongestPath?:{title:string;completionRate:number}|null;weakestModules:Array<{title:string;completionRate:number;missed:number}>;upcoming:Array<{id:string;title:string;scheduledAt:string;durationMinutes:number}>;missedLessons:number;achievements:Array<{key:string;title:string;unlocked:boolean}> }
interface CalendarItem { id:string; title:string; status:string; scheduledAt:string; durationMinutes:number }
interface Replan { behindMinutes:number; changes:Array<{lessonId:string;title:string;previousScheduledAt?:string;proposedScheduledAt:string;durationMinutes:number}> }

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,MatButtonModule],
  template:`
  <section class="page-enter progress-page">
    <div class="page-head"><div><span class="eyebrow">Learning intelligence</span><h1>Progress & consistency</h1><p class="muted">Review what happened, protect your momentum and rebalance the plan when life gets in the way.</p></div><button mat-flat-button class="primary-cta" (click)="loadAll()">Refresh</button></div>
    @if(error()){<div class="error">{{error()}}</div>}
    @if(overview();as o){
      <div class="stats">
        <article><span>This week</span><strong>{{o.week.completed}}</strong><small>lessons completed</small></article>
        <article><span>Study time</span><strong>{{hours(o.week.studiedMinutes)}}</strong><small>{{o.week.targetProgress}}% of weekly target</small></article>
        <article><span>Completion</span><strong>{{o.week.completionRate}}%</strong><small>{{o.week.missed}} missed</small></article>
        <article><span>Current streak</span><strong>🔥 {{o.consistency.currentStreakDays}}</strong><small>best {{o.consistency.longestStreakDays}} days</small></article>
      </div>
      <div class="grid two">
        <article class="card"><div class="card-head"><div><span class="mini">Weekly review</span><h2>What your activity says</h2></div><button mat-stroked-button (click)="coach()" [disabled]="coachBusy()">{{coachBusy()?'Reviewing…':'AI review'}}</button></div>
          <p>{{o.strongestPath?'Strongest path: '+o.strongestPath.title+' ('+o.strongestPath.completionRate+'%).':'Complete lessons to build your first progress signal.'}}</p>
          @if(o.weakestModules.length){<h3>Needs attention</h3><ul>@for(m of o.weakestModules;track m.title){<li><strong>{{m.title}}</strong> · {{m.completionRate}}% complete · {{m.missed}} missed</li>}</ul>}
          @if(coachAnswer()){<div class="coach-answer">{{coachAnswer()}}</div>}
        </article>
        <article class="card"><span class="mini">Achievements</span><h2>Consistency milestones</h2><div class="achievements">@for(a of o.achievements;track a.key){<div [class.unlocked]="a.unlocked"><span>{{a.unlocked?'✓':'○'}}</span><strong>{{a.title}}</strong></div>}</div></article>
      </div>
    }

    <div class="grid two">
      <article class="card"><span class="mini">Goals</span><h2>Learning outcomes</h2>
        <div class="goal-form"><input [(ngModel)]="goalTitle" placeholder="e.g. Become React interview-ready"><input type="date" [(ngModel)]="goalDate"><input type="number" min="30" [(ngModel)]="goalMinutes" placeholder="Weekly minutes"><select [(ngModel)]="goalPathId"><option value="">No linked path</option>@for(p of paths();track p._id){<option [value]="p._id">{{p.title}}</option>}</select><button mat-flat-button class="primary-cta" (click)="createGoal()" [disabled]="!goalTitle.trim()">Add goal</button></div>
        <div class="goal-list">@for(g of goals();track g._id){<div class="goal"><div><strong>{{g.title}}</strong><small>{{g.progress}}% · {{g.completedLessons}}/{{g.totalLessons}} lessons · {{g.weeklyMinutesTarget}} min/week</small></div><div class="goal-actions"><button mat-stroked-button (click)="completeGoal(g)">Complete</button><button mat-button (click)="deleteGoal(g)">Remove</button></div></div>}@empty{<p class="muted">No goals yet. Create an outcome and optionally connect it to a learning path.</p>}</div>
      </article>
      <article class="card"><div class="card-head"><div><span class="mini">Smart replanning</span><h2>Recover missed work</h2></div><button mat-stroked-button (click)="propose()">Build proposal</button></div>
        @if(replan();as r){<p>You are approximately <strong>{{hours(r.behindMinutes)}}</strong> behind across {{r.changes.length}} missed lesson(s).</p><div class="replan-list">@for(c of r.changes;track c.lessonId){<div><strong>{{c.title}}</strong><small>{{dateTime(c.previousScheduledAt)}} → {{dateTime(c.proposedScheduledAt)}}</small></div>}</div>@if(r.changes.length){<button mat-flat-button class="primary-cta" (click)="applyReplan()">Approve & rebalance</button>}@else{<div class="success">No missed lessons need replanning.</div>}}
      </article>
    </div>

    <article class="card calendar"><span class="mini">Calendar</span><h2>Upcoming learning agenda</h2><div class="calendar-list">@for(item of calendar();track item.id){<div><time>{{dateTime(item.scheduledAt)}}</time><section><strong>{{item.title}}</strong><small>{{item.durationMinutes}} min · {{item.status}}</small></section></div>}@empty{<p class="muted">No scheduled lessons in the current calendar window.</p>}</div></article>
  </section>`,
  styles:[`
    .progress-page{max-width:1180px;margin:0 auto}.page-head,.card-head,.goal,.goal-actions{display:flex;justify-content:space-between;gap:16px;align-items:center}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:20px 0}.stats article,.card{background:#fff;border:1px solid #dfe5ed;border-radius:18px;padding:20px}.stats span,.stats small,.mini,.goal small,.calendar-list small{display:block;color:#718096}.stats strong{display:block;font-size:1.75rem;color:#10233f;margin:5px 0}.grid.two{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:18px 0}.card h2{margin:5px 0 14px;color:#10233f}.card h3{font-size:.9rem}.coach-answer,.success,.error{padding:14px;border-radius:12px;margin-top:14px;white-space:pre-wrap}.coach-answer,.success{background:#eef7ff;color:#174ea6}.error{background:#fff1f0;color:#a61b1b}.achievements{display:grid;gap:8px}.achievements div{display:flex;gap:10px;padding:10px;border-radius:10px;background:#f7f8fa;color:#7a869a}.achievements .unlocked{background:#eaf7ef;color:#216e4e}.goal-form{display:grid;grid-template-columns:1.5fr 1fr 1fr 1.2fr;gap:8px;margin:12px 0 16px}.goal-form input,.goal-form select{border:1px solid #d7dde7;border-radius:9px;padding:10px;min-width:0}.goal{border-top:1px solid #edf1f5;padding:12px 0}.goal-actions{justify-content:flex-end}.replan-list{display:grid;gap:8px;margin:12px 0}.replan-list div{padding:10px;background:#f7f8fa;border-radius:10px}.replan-list small{display:block;color:#718096;margin-top:3px}.calendar{margin-bottom:30px}.calendar-list>div{display:grid;grid-template-columns:190px 1fr;gap:16px;padding:12px 0;border-top:1px solid #edf1f5}.calendar-list time{color:#174ea6;font-weight:700}@media(max-width:900px){.stats{grid-template-columns:1fr 1fr}.grid.two{grid-template-columns:1fr}.goal-form{grid-template-columns:1fr 1fr}}@media(max-width:600px){.stats,.goal-form{grid-template-columns:1fr}.calendar-list>div{grid-template-columns:1fr}}
  `]
})
export class ProgressComponent implements OnInit{
  private api=inject(ApiService);overview=signal<Overview|null>(null);goals=signal<Goal[]>([]);paths=signal<Path[]>([]);calendar=signal<CalendarItem[]>([]);replan=signal<Replan|null>(null);error=signal('');coachAnswer=signal('');coachBusy=signal(false);goalTitle='';goalDate='';goalMinutes=360;goalPathId='';
  ngOnInit(){this.loadAll();}
  loadAll(){this.error.set('');this.api.get<Overview>('/api/v1/intelligence/overview').subscribe({next:v=>this.overview.set(v),error:e=>this.error.set(e?.error?.message??'Unable to load learning intelligence.')});this.api.get<Goal[]>('/api/v1/goals').subscribe(v=>this.goals.set(v));this.api.get<Path[]>('/api/v1/learning-paths').subscribe(v=>this.paths.set(v));this.api.get<CalendarItem[]>('/api/v1/intelligence/calendar').subscribe(v=>this.calendar.set(v));}
  createGoal(){const body={title:this.goalTitle.trim(),targetDate:this.goalDate||undefined,weeklyMinutesTarget:Number(this.goalMinutes)||360,learningPathId:this.goalPathId||undefined};this.api.post<typeof body,Goal>('/api/v1/goals',body).subscribe({next:()=>{this.goalTitle='';this.goalDate='';this.goalPathId='';this.loadAll();},error:e=>this.error.set(e?.error?.message??'Unable to create goal.')});}
  completeGoal(g:Goal){this.api.patch(`/api/v1/goals/${g._id}`,{status:'COMPLETED'}).subscribe(()=>this.loadAll());}
  deleteGoal(g:Goal){this.api.delete(`/api/v1/goals/${g._id}`).subscribe(()=>this.loadAll());}
  coach(){this.coachBusy.set(true);this.api.post<{}, {answer:string}>('/api/v1/intelligence/coach',{}).subscribe({next:r=>{this.coachAnswer.set(r.answer);this.coachBusy.set(false);},error:e=>{this.error.set(e?.error?.message??'AI review unavailable.');this.coachBusy.set(false);}});}
  propose(){this.api.get<Replan>('/api/v1/intelligence/replan').subscribe({next:v=>this.replan.set(v),error:e=>this.error.set(e?.error?.message??'Unable to build replan proposal.')});}
  applyReplan(){const r=this.replan();if(!r?.changes.length)return;this.api.post('/api/v1/intelligence/replan/apply',{changes:r.changes.map(c=>({lessonId:c.lessonId,proposedScheduledAt:c.proposedScheduledAt}))}).subscribe({next:()=>{this.replan.set(null);this.loadAll();},error:e=>this.error.set(e?.error?.message??'Unable to apply replan proposal.')});}
  hours(minutes:number){const h=Math.floor(minutes/60),m=minutes%60;return h?`${h}h ${m?m+'m':''}`:`${m}m`;}
  dateTime(value?:string){return value?new Intl.DateTimeFormat(undefined,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'Unscheduled';}
}
