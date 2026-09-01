import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

type Level='FOUNDATION'|'WORKING'|'STRONG';
type Requirement={name:string;targetLevel:Level;importance:'REQUIRED'|'PREFERRED';currentLevel:Level|null;met:boolean;evidence:Array<{title:string;type:string;url?:string;masteryScore?:number}>};
type Analysis={id:string;title:string;company?:string;createdAt:string;match:{score:number;matched:Requirement[];gaps:Requirement[];requirements:Requirement[]};talkingPoints:string[];interviewQuestions:string[];learningPlanBrief:string};
type History={id:string;title:string;company?:string;requirementCount:number;createdAt:string};
type AnalyseRequest={title:string;company?:string;jobDescription:string};

@Component({
  standalone:true,
  imports:[FormsModule,RouterLink,MatButtonModule],
  template:`
  <section class="jobs page-enter">
    <div class="page-head"><div><span class="eyebrow">Career intelligence</span><h1>Match learning evidence to a real job.</h1><p class="muted">Paste a job description and LearnFlow compares its requirements with mastery-backed skills, projects and certificates already in your career profile.</p></div><a mat-stroked-button routerLink="/career">Career readiness</a></div>
    @if(error()){<div class="error">{{error()}}</div>}
    <div class="layout">
      <article class="card analyser"><span class="mini-label">New analysis</span><h2>Job description</h2><div class="form"><input [(ngModel)]="title" placeholder="Role title"><input [(ngModel)]="company" placeholder="Company (optional)"><textarea [(ngModel)]="jobDescription" rows="14" placeholder="Paste the full job description here..."></textarea><button mat-flat-button class="primary-cta" (click)="analyse()" [disabled]="busy() || title.trim().length<2 || jobDescription.trim().length<80">{{busy()?'Analysing…':'Analyse job match'}}</button></div><small>Analysis uses your existing AI Coach allowance and never claims experience that is not supported by your LearnFlow evidence.</small></article>
      <article class="card history"><span class="mini-label">Recent roles</span><h2>Saved analyses</h2>@for(item of history();track item.id){<button type="button" class="history-row" (click)="load(item.id)"><span><strong>{{item.title}}</strong><small>{{item.company||'Company not specified'}} · {{item.requirementCount}} requirements</small></span><em>{{date(item.createdAt)}}</em></button>}@empty{<div class="empty">Your analysed roles will appear here.</div>}</article>
    </div>
    @if(result();as data){
      <section class="result">
        <div class="result-head"><div><span class="mini-label">Match result</span><h2>{{data.title}} @if(data.company){<small>at {{data.company}}</small>}</h2></div><div class="score" [attr.data-band]="scoreBand(data.match.score)"><strong>{{data.match.score}}%</strong><span>evidence match</span></div></div>
        <div class="stats"><article><span>Matched</span><strong>{{data.match.matched.length}}</strong><small>Requirements evidenced</small></article><article><span>Gaps</span><strong>{{data.match.gaps.length}}</strong><small>Need learning or stronger evidence</small></article><article><span>Requirements</span><strong>{{data.match.requirements.length}}</strong><small>Extracted from the role</small></article></div>
        <div class="columns">
          <article class="card"><span class="mini-label">Requirement map</span><h3>Evidence vs role</h3>@for(item of data.match.requirements;track item.name){<div class="req"><span class="state" [class.met]="item.met">{{item.met?'✓':'!'}}</span><div><strong>{{item.name}}</strong><small>{{item.importance}} · target {{item.targetLevel}} · current {{item.currentLevel||'NO EVIDENCE'}}</small>@if(item.evidence.length){<span class="evidence">{{item.evidence.length}} evidence item{{item.evidence.length===1?'':'s'}}@if(item.evidence[0]?.masteryScore!==undefined){ · best mastery {{item.evidence[0].masteryScore}}%}</span>}</div></div>}</article>
          <article class="card"><span class="mini-label">Application evidence</span><h3>CV / recruiter talking points</h3>@for(point of data.talkingPoints;track point){<div class="point">✓ {{point}}</div>}@empty{<p class="muted">Add stronger skill evidence in Career Readiness to generate grounded talking points.</p>}<span class="mini-label block">Likely interview questions</span>@for(question of data.interviewQuestions;track question){<div class="question">{{question}}</div>}</article>
        </div>
        @if(data.match.gaps.length){<article class="card plan"><div><span class="mini-label">Targeted learning plan</span><h3>Close only the gaps that matter for this role.</h3><p class="muted">Copy this gap brief into AI Planner to generate a focused path instead of relearning skills you already evidence.</p></div><textarea readonly rows="6">{{data.learningPlanBrief}}</textarea><div class="actions"><button mat-stroked-button (click)="copyBrief(data.learningPlanBrief)">{{copied()?'Copied':'Copy learning brief'}}</button><a mat-flat-button class="primary-cta" routerLink="/ai-planner">Open AI Planner</a></div></article>}
      </section>
    }
  </section>`,
  styles:[`
    .jobs{max-width:1180px;margin:0 auto}.layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.75fr);gap:16px}.card,.result{background:#fff;border:1px solid #dfe5ed;border-radius:18px;padding:20px}.form{display:grid;gap:10px}.form input,.form textarea,.plan textarea{border:1px solid #d7dde7;border-radius:10px;padding:11px;font:inherit;resize:vertical}.analyser small{display:block;color:#7a869a;margin-top:10px}.history-row{width:100%;border:0;border-top:1px solid #edf1f5;background:transparent;padding:13px 0;text-align:left;display:flex;justify-content:space-between;gap:12px;cursor:pointer}.history-row span{display:flex;flex-direction:column}.history-row small,.history-row em{color:#7a869a;font-size:.72rem;font-style:normal}.result{margin-top:18px}.result-head{display:flex;justify-content:space-between;align-items:center;gap:16px}.result-head h2 small{font-weight:500;color:#66758a}.score{width:112px;height:112px;border-radius:50%;display:grid;place-items:center;align-content:center;background:#eef4ff;color:#2f6fed}.score strong{font-size:1.55rem}.score span{font-size:.65rem;text-transform:uppercase;font-weight:800}.score[data-band="strong"]{background:#eaf7ef;color:#216e4e}.score[data-band="weak"]{background:#fff1f1;color:#b13b47}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.stats article{padding:15px;border:1px solid #e5eaf1;border-radius:14px}.stats span,.stats small{display:block;color:#7a869a}.stats strong{display:block;font-size:1.55rem;margin:3px 0;color:#10233f}.columns{display:grid;grid-template-columns:1fr 1fr;gap:16px}.req{display:grid;grid-template-columns:32px 1fr;gap:9px;padding:12px 0;border-top:1px solid #edf1f5}.req div{display:flex;flex-direction:column}.req small,.evidence{color:#7a869a;font-size:.72rem}.state{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#fff1f1;color:#b13b47;font-weight:900}.state.met{background:#eaf7ef;color:#216e4e}.point,.question{padding:10px 0;border-top:1px solid #edf1f5;color:#33445d}.question{counter-increment:q}.block{display:block;margin-top:20px}.plan{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}.plan textarea{width:100%;box-sizing:border-box;background:#f7f9fc}.actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px}.error,.empty{padding:14px;border-radius:12px}.error{background:#fff1f0;color:#a61b1b;margin-bottom:14px}.empty{background:#f7f9fc;color:#66758a}@media(max-width:860px){.layout,.columns,.plan{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}.result-head{align-items:flex-start}}@media(max-width:540px){.stats{grid-template-columns:1fr}.result-head{flex-direction:column}.score{width:90px;height:90px}.actions{justify-content:stretch;flex-direction:column}}
  `]
})
export class JobMatchComponent implements OnInit{
  private readonly api=inject(ApiService);
  readonly result=signal<Analysis|null>(null);readonly history=signal<History[]>([]);readonly error=signal('');readonly busy=signal(false);readonly copied=signal(false);
  title='';company='';jobDescription='';
  ngOnInit(){this.refreshHistory();}
  analyse(){this.error.set('');this.busy.set(true);const body:AnalyseRequest={title:this.title.trim(),jobDescription:this.jobDescription.trim(),...(this.company.trim()?{company:this.company.trim()}:{})};this.api.post<AnalyseRequest,Analysis>('/api/v1/career/jobs/analyse',body).subscribe({next:value=>{this.result.set(value);this.busy.set(false);this.refreshHistory();},error:e=>{this.error.set(e.error?.message??'Could not analyse this job.');this.busy.set(false);}});}
  load(id:string){this.error.set('');this.api.get<Analysis>(`/api/v1/career/jobs/${id}`).subscribe({next:value=>this.result.set(value),error:e=>this.error.set(e.error?.message??'Could not load analysis.')});}
  refreshHistory(){this.api.get<History[]>('/api/v1/career/jobs').subscribe({next:value=>this.history.set(value),error:()=>undefined});}
  copyBrief(value:string){if(!navigator.clipboard)return;navigator.clipboard.writeText(value).then(()=>{this.copied.set(true);setTimeout(()=>this.copied.set(false),1600);}).catch(()=>undefined);}
  date(value:string){return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short'}).format(new Date(value));}
  scoreBand(score:number){return score>=75?'strong':score<50?'weak':'developing';}
}
