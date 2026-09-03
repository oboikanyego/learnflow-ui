import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

type Stage='SAVED'|'APPLIED'|'SCREENING'|'INTERVIEW'|'TECHNICAL'|'OFFER'|'REJECTED'|'WITHDRAWN';
type DetailTab='overview'|'notes'|'prep';
type App={id:string;title:string;company:string;stage:Stage;source?:string;applicationUrl?:string;jobAnalysisId?:string|null;appliedAt?:string;nextFollowUpAt?:string;recruiterName?:string;recruiterEmail?:string;notes:Array<{body:string;createdAt:string}>};
type Pipeline={counts:Record<string,number>;applications:App[]};
type Job={id:string;title:string;company?:string};
type Prep={application:{id:string;title:string;company:string;stage:Stage;recruiterName?:string;nextFollowUpAt?:string};talkingPoints:string[];interviewQuestions:string[];preparationChecklist:string[];hasJobAnalysis:boolean};

@Component({
  standalone:true,
  imports:[FormsModule,RouterLink,MatButtonModule],
  template:`
<section class="apps page-enter">
  <header class="workspace-head">
    <div class="title-block">
      <span class="eyebrow">Career workspace</span>
      <div class="title-line"><h1>Applications & interviews</h1><span class="total-pill">{{pipeline().applications.length}} total</span></div>
      <p>Keep the pipeline actionable without turning it into a long page.</p>
    </div>
    <div class="head-actions">
      <a mat-stroked-button routerLink="/career/jobs">Job matching</a>
      <button mat-flat-button class="primary-cta" type="button" (click)="openAdd()">+ Add opportunity</button>
    </div>
  </header>

  <section class="control-strip">
    <div class="search-box">
      <span aria-hidden="true">⌕</span>
      <input [(ngModel)]="query" (ngModelChange)="resetStagePages()" placeholder="Search role, company, recruiter or source" aria-label="Search applications">
      @if(query){<button type="button" (click)="query='';resetStagePages()" aria-label="Clear search">×</button>}
    </div>
    <div class="metric-strip" aria-label="Pipeline summary">
      <div><span>Applied</span><strong>{{pipeline().counts['APPLIED']||0}}</strong></div>
      <div><span>Interviews</span><strong>{{(pipeline().counts['SCREENING']||0)+(pipeline().counts['INTERVIEW']||0)+(pipeline().counts['TECHNICAL']||0)}}</strong></div>
      <div><span>Offers</span><strong>{{pipeline().counts['OFFER']||0}}</strong></div>
      <div [class.attention]="followUpsDue()>0"><span>Follow-ups due</span><strong>{{followUpsDue()}}</strong></div>
      @if(query){<div><span>Matches</span><strong>{{filteredApplications().length}}</strong></div>}
    </div>
  </section>

  @if(error()){<div class="error-banner"><span>!</span><strong>{{error()}}</strong><button type="button" (click)="error.set('')">×</button></div>}

  <section class="pipeline-shell">
    <div class="pipeline-board">
      @for(stage of stages;track stage){
        <section class="column" [attr.data-stage]="stage">
          <header class="column-head">
            <div><span class="stage-dot"></span><strong>{{label(stage)}}</strong></div>
            <span class="count">{{byStage(stage).length}}</span>
          </header>

          <div class="cards">
            @for(item of pagedByStage(stage);track item.id){
              <article class="app-card" [class.selected]="selected()?.id===item.id" (click)="select(item)" tabindex="0" (keydown.enter)="select(item)">
                <div class="card-top">
                  <div class="card-title"><strong>{{item.title}}</strong><small>{{item.company}}</small></div>
                  @if(item.jobAnalysisId){<span class="analysis-dot" title="Job analysis linked">●</span>}
                </div>
                <div class="card-meta">
                  @if(item.source){<span>{{item.source}}</span>}
                  @if(item.recruiterName){<span>{{item.recruiterName}}</span>}
                </div>
                @if(item.nextFollowUpAt){<div class="follow-up" [class.due]="isDue(item.nextFollowUpAt)"><span>◷</span>{{isDue(item.nextFollowUpAt)?'Due':'Follow up'}} {{date(item.nextFollowUpAt)}}</div>}
                <select [ngModel]="item.stage" (ngModelChange)="move(item,$event)" (click)="$event.stopPropagation()" aria-label="Application stage">
                  @for(option of stages;track option){<option [value]="option">{{label(option)}}</option>}
                </select>
              </article>
            } @empty {
              <div class="empty-column"><span>○</span><strong>{{query?'No matches':'No applications'}}</strong><small>{{query?'Try another search.':'Nothing in this stage yet.'}}</small></div>
            }
          </div>

          @if(pageCount(stage)>1){
            <footer class="column-pager">
              <button type="button" (click)="setStagePage(stage,stagePage(stage)-1)" [disabled]="stagePage(stage)<=1" aria-label="Previous page">‹</button>
              <span>{{stagePage(stage)}} / {{pageCount(stage)}}</span>
              <button type="button" (click)="setStagePage(stage,stagePage(stage)+1)" [disabled]="stagePage(stage)>=pageCount(stage)" aria-label="Next page">›</button>
            </footer>
          } @else {
            <footer class="column-pager single"><span>Up to {{cardsPerStage}} shown per page</span></footer>
          }
        </section>
      }
    </div>
  </section>

  @if(addOpen()){
    <div class="overlay" (click)="closeAdd()">
      <aside class="side-panel add-panel" (click)="$event.stopPropagation()">
        <header class="panel-head"><div><span class="mini-label">New opportunity</span><h2>Add to pipeline</h2><p>Capture the essentials now. You can enrich the application later.</p></div><button class="icon-close" type="button" (click)="closeAdd()">×</button></header>
        <div class="panel-body form-grid">
          <label class="wide"><span>Role title</span><input [(ngModel)]="draft.title" placeholder="e.g. Senior Angular Developer"></label>
          <label class="wide"><span>Company</span><input [(ngModel)]="draft.company" placeholder="Company name"></label>
          <label class="wide"><span>Linked job analysis</span><select [(ngModel)]="draft.jobAnalysisId"><option value="">No linked job analysis</option>@for(job of jobs();track job.id){<option [value]="job.id">{{job.title}} · {{job.company||'Unknown company'}}</option>}</select></label>
          <label><span>Source</span><input [(ngModel)]="draft.source" placeholder="LinkedIn, OfferZen..."></label>
          <label><span>Application URL</span><input [(ngModel)]="draft.applicationUrl" placeholder="https://..."></label>
          <label><span>Recruiter name</span><input [(ngModel)]="draft.recruiterName" placeholder="Optional"></label>
          <label><span>Recruiter email</span><input [(ngModel)]="draft.recruiterEmail" placeholder="Optional"></label>
        </div>
        <footer class="panel-actions"><button mat-stroked-button type="button" (click)="closeAdd()">Cancel</button><button mat-flat-button class="primary-cta" type="button" (click)="create()" [disabled]="busy()||draft.title.trim().length<2||draft.company.trim().length<2">{{busy()?'Saving…':'Add to pipeline'}}</button></footer>
      </aside>
    </div>
  }

  @if(selected();as item){
    <div class="overlay detail-overlay" (click)="selected.set(null)">
      <aside class="side-panel detail-panel" (click)="$event.stopPropagation()">
        <header class="panel-head detail-head">
          <div class="detail-title"><span class="mini-label">{{label(item.stage)}}</span><h2>{{item.title}}</h2><p>{{item.company}}</p></div>
          <button class="icon-close" type="button" (click)="selected.set(null)">×</button>
        </header>

        <nav class="detail-tabs" aria-label="Application detail tabs">
          <button type="button" [class.active]="detailTab()==='overview'" (click)="detailTab.set('overview')">Overview</button>
          <button type="button" [class.active]="detailTab()==='notes'" (click)="detailTab.set('notes')">Notes <span>{{item.notes.length}}</span></button>
          <button type="button" [class.active]="detailTab()==='prep'" (click)="detailTab.set('prep')">Interview prep</button>
        </nav>

        <div class="panel-body detail-body">
          @if(detailTab()==='overview'){
            <section class="detail-section">
              <div class="field-grid">
                <label><span>Stage</span><select [ngModel]="item.stage" (ngModelChange)="move(item,$event)">@for(option of stages;track option){<option [value]="option">{{label(option)}}</option>}</select></label>
                <label><span>Follow-up date</span><input type="date" [ngModel]="dateInput(item.nextFollowUpAt)" (ngModelChange)="setFollowUp(item,$event)"></label>
              </div>
              <div class="info-list">
                <div><span>Recruiter</span><strong>{{item.recruiterName||'Not recorded'}}</strong>@if(item.recruiterEmail){<small>{{item.recruiterEmail}}</small>}</div>
                <div><span>Source</span><strong>{{item.source||'Not recorded'}}</strong></div>
                <div><span>Job analysis</span><strong>{{item.jobAnalysisId?'Linked':'Not linked'}}</strong></div>
                <div><span>Application link</span>@if(item.applicationUrl){<a [href]="item.applicationUrl" target="_blank" rel="noopener">Open application ↗</a>}@else{<strong>Not recorded</strong>}</div>
              </div>
              @if(item.nextFollowUpAt){<div class="next-action" [class.overdue]="isDue(item.nextFollowUpAt)"><span>Next action</span><strong>{{isDue(item.nextFollowUpAt)?'Follow-up is due':'Follow up '+date(item.nextFollowUpAt)}}</strong></div>}
            </section>
          }

          @if(detailTab()==='notes'){
            <section class="detail-section notes-section">
              <div class="note-compose"><textarea [(ngModel)]="note" rows="3" placeholder="Recruiter call, salary, interview feedback, next action..."></textarea><button mat-flat-button class="primary-cta" type="button" (click)="addNote(item)" [disabled]="!note.trim()">Add note</button></div>
              <div class="note-list">@for(entry of item.notes;track entry.createdAt){<article class="note"><p>{{entry.body}}</p><small>{{dateTime(entry.createdAt)}}</small></article>}@empty{<div class="empty-panel"><strong>No notes yet</strong><span>Record recruiter calls, interview feedback and next actions here.</span></div>}</div>
            </section>
          }

          @if(detailTab()==='prep'){
            <section class="detail-section prep-section">
              <div class="prep-toolbar"><div><h3>Interview preparation</h3><p>Build preparation from evidence already stored in LearnFlow.</p></div><button mat-flat-button class="primary-cta" type="button" (click)="prepare(item)">Load prep</button></div>
              @if(prep();as p){
                @if(!p.hasJobAnalysis){<div class="warning">Link a Job Matching analysis to unlock role-specific evidence and questions.</div>}
                <div class="prep-block"><h4>Checklist</h4>@for(check of p.preparationChecklist;track check){<div class="check"><span>□</span>{{check}}</div>}</div>
                <div class="prep-block"><h4>Evidence talking points</h4>@for(point of p.talkingPoints;track point){<div class="talk"><span>✓</span>{{point}}</div>}@empty{<p class="muted">No evidence-backed talking points yet.</p>}</div>
                <div class="prep-block"><h4>Likely questions</h4>@for(q of p.interviewQuestions;track q){<div class="question">{{q}}</div>}</div>
              } @else {
                <div class="empty-panel"><strong>Prep not loaded</strong><span>Use “Load prep” when you are ready to prepare for this application.</span></div>
              }
            </section>
          }
        </div>
      </aside>
    </div>
  }
</section>`,
  styles:[`
.apps{position:relative;height:calc(100dvh - 118px);min-height:560px;max-width:none;margin:0;overflow:hidden;display:grid;grid-template-rows:auto auto auto minmax(0,1fr);gap:12px;color:#344054}.workspace-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}.title-block{min-width:0}.title-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.title-line h1{margin:2px 0 0;color:#101828;font-size:1.65rem}.title-block p{margin:5px 0 0;color:#667085;font-size:.8rem}.total-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef4ff;color:#175cd3;font-size:.68rem;font-weight:850}.head-actions{display:flex;gap:8px;flex:none}.control-strip{display:flex;align-items:center;gap:12px;min-width:0}.search-box{height:42px;min-width:280px;max-width:440px;flex:1;display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid #d7dde7;border-radius:12px;background:#fff}.search-box>span{color:#7a869a;font-size:1rem}.search-box input{flex:1;min-width:0;border:0!important;outline:0;background:transparent!important;padding:0!important;font:inherit;color:#344054}.search-box button{border:0;background:transparent;color:#7a869a;cursor:pointer;font-size:1.1rem}.metric-strip{display:flex;align-items:stretch;gap:7px;overflow-x:auto;scrollbar-width:none}.metric-strip::-webkit-scrollbar{display:none}.metric-strip>div{min-width:92px;padding:7px 10px;border:1px solid #e4e7ec;border-radius:11px;background:#fff;display:flex;flex-direction:column}.metric-strip span{font-size:.62rem;color:#667085;white-space:nowrap}.metric-strip strong{font-size:1rem;color:#101828}.metric-strip .attention{background:#fff8e8;border-color:#f0dfae}.metric-strip .attention strong{color:#9a6700}.error-banner{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid #fecdca;border-radius:10px;background:#fef3f2;color:#b42318;font-size:.75rem}.error-banner>span{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#fee4e2;font-weight:900}.error-banner button{margin-left:auto;border:0;background:transparent;color:inherit;font-size:1rem;cursor:pointer}.pipeline-shell{min-height:0;overflow:hidden}.pipeline-board{height:100%;display:grid;grid-auto-flow:column;grid-auto-columns:minmax(235px,260px);gap:10px;overflow-x:auto;overflow-y:hidden;padding:1px 2px 8px;scrollbar-width:thin;scroll-snap-type:x proximity}.column{height:100%;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:#f7f8fa;border:1px solid #e1e6ee;border-radius:14px;overflow:hidden;scroll-snap-align:start}.column-head{display:flex;justify-content:space-between;align-items:center;padding:10px 11px;border-bottom:1px solid #e6e9ee;background:#fafbfc}.column-head>div{display:flex;align-items:center;gap:7px}.column-head strong{font-size:.72rem;color:#344054}.stage-dot{width:8px;height:8px;border-radius:50%;background:#98a2b3}.column[data-stage='APPLIED'] .stage-dot{background:#2f6fed}.column[data-stage='SCREENING'] .stage-dot{background:#7f56d9}.column[data-stage='INTERVIEW'] .stage-dot,.column[data-stage='TECHNICAL'] .stage-dot{background:#f79009}.column[data-stage='OFFER'] .stage-dot{background:#12b76a}.column[data-stage='REJECTED'] .stage-dot,.column[data-stage='WITHDRAWN'] .stage-dot{background:#f04438}.count{min-width:23px;height:23px;padding:0 6px;border-radius:999px;display:grid;place-items:center;background:#e9edf3;color:#475467;font-size:.66rem;font-weight:800}.cards{min-height:0;display:grid;grid-template-rows:repeat(4,minmax(0,1fr));gap:7px;padding:8px;overflow:hidden}.app-card{min-height:0;background:#fff;border:1px solid #e0e6ef;border-radius:11px;padding:10px;display:flex;flex-direction:column;gap:6px;cursor:pointer;overflow:hidden;transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease}.app-card:hover,.app-card.selected{border-color:#9ec5ff;box-shadow:0 5px 14px rgba(16,24,40,.07);transform:translateY(-1px)}.card-top{display:flex;justify-content:space-between;gap:8px}.card-title{display:flex;flex-direction:column;min-width:0}.card-title strong{color:#101828;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.card-title small{color:#667085;font-size:.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.analysis-dot{color:#2f6fed;font-size:.55rem}.card-meta{display:flex;gap:5px;flex-wrap:wrap;min-height:20px;overflow:hidden}.card-meta span{max-width:100%;padding:3px 6px;border-radius:999px;background:#f2f4f7;color:#667085;font-size:.59rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.follow-up{display:flex;align-items:center;gap:4px;color:#667085;font-size:.62rem;white-space:nowrap}.follow-up.due{color:#b42318;font-weight:750}.app-card select{margin-top:auto;width:100%;height:32px!important;min-height:32px!important;padding-block:4px!important;font-size:.66rem!important}.empty-column{grid-row:1/-1;align-self:center;display:flex;flex-direction:column;align-items:center;text-align:center;color:#98a2b3;padding:16px}.empty-column>span{font-size:1.4rem}.empty-column strong{font-size:.72rem;color:#667085}.empty-column small{font-size:.62rem}.column-pager{height:34px;display:flex;justify-content:center;align-items:center;gap:8px;border-top:1px solid #e6e9ee;background:#fff}.column-pager button{width:25px;height:25px;border:1px solid #d0d5dd;border-radius:7px;background:#fff;color:#344054;cursor:pointer}.column-pager button:disabled{opacity:.4;cursor:default}.column-pager span{font-size:.62rem;color:#667085}.column-pager.single span{color:#98a2b3}.overlay{position:absolute;inset:0;z-index:120;display:flex;justify-content:flex-end;background:rgba(16,24,40,.26);backdrop-filter:blur(2px)}.side-panel{height:100%;width:min(540px,94vw);display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:#fff;border-left:1px solid #e4e7ec;box-shadow:-18px 0 45px rgba(16,24,40,.16);animation:panelIn .18s ease-out}.detail-panel{width:min(610px,96vw);grid-template-rows:auto auto minmax(0,1fr)}@keyframes panelIn{from{transform:translateX(24px);opacity:.65}to{transform:none;opacity:1}}.panel-head{display:flex;justify-content:space-between;gap:16px;padding:20px 22px 16px;border-bottom:1px solid #eaecf0}.panel-head h2{margin:3px 0;color:#101828;font-size:1.25rem}.panel-head p{margin:0;color:#667085;font-size:.75rem;line-height:1.45}.icon-close{width:34px;height:34px;border:1px solid #e4e7ec;border-radius:9px;background:#fff;color:#667085;font-size:1.25rem;cursor:pointer}.panel-body{min-height:0;overflow:auto;padding:18px 22px}.panel-actions{display:flex;justify-content:flex-end;gap:8px;padding:13px 22px;border-top:1px solid #eaecf0;background:#fafbfc}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid label,.field-grid label{display:flex;flex-direction:column;gap:5px}.form-grid label>span,.field-grid label>span{font-size:.68rem;font-weight:750;color:#475467}.form-grid .wide{grid-column:1/-1}.form-grid input,.form-grid select,.field-grid input,.field-grid select,.note-compose textarea{width:100%;box-sizing:border-box;border:1px solid #d0d5dd;border-radius:10px;padding:10px 11px;font:inherit;background:#fff;color:#344054}.detail-head{padding-bottom:13px}.detail-title{min-width:0}.detail-title h2,.detail-title p{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.detail-tabs{display:flex;gap:4px;padding:0 18px;border-bottom:1px solid #eaecf0;background:#fff}.detail-tabs button{position:relative;border:0;background:transparent;padding:11px 10px;color:#667085;font:750 .7rem/1.2 inherit;cursor:pointer}.detail-tabs button.active{color:#175cd3}.detail-tabs button.active::after{content:'';position:absolute;left:8px;right:8px;bottom:-1px;height:2px;background:#175cd3;border-radius:2px}.detail-tabs button span{margin-left:4px;padding:2px 5px;border-radius:999px;background:#f2f4f7;font-size:.58rem}.detail-body{padding-top:16px}.detail-section{display:grid;gap:16px}.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.info-list{display:grid;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden}.info-list>div{display:grid;grid-template-columns:120px 1fr;gap:10px;padding:12px 13px;border-top:1px solid #eaecf0}.info-list>div:first-child{border-top:0}.info-list span{font-size:.66rem;color:#667085}.info-list strong,.info-list a{font-size:.72rem;color:#344054;text-decoration:none;min-width:0;overflow-wrap:anywhere}.info-list small{grid-column:2;color:#667085;font-size:.64rem}.info-list a{color:#175cd3;font-weight:750}.next-action{padding:13px 14px;border-radius:11px;background:#eff8ff;border:1px solid #b2ddff;display:flex;justify-content:space-between;gap:12px}.next-action span{font-size:.68rem;color:#026aa2}.next-action strong{font-size:.72rem;color:#0b4a6f}.next-action.overdue{background:#fff6ed;border-color:#f9dbaf}.next-action.overdue span,.next-action.overdue strong{color:#b54708}.note-compose{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.note-compose textarea{resize:none}.note-list{display:grid;border-top:1px solid #eaecf0}.note{padding:13px 2px;border-bottom:1px solid #eaecf0}.note p{margin:0 0 5px;color:#344054;font-size:.75rem;line-height:1.5;white-space:pre-wrap}.note small{color:#98a2b3;font-size:.62rem}.prep-toolbar{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.prep-toolbar h3{margin:0;color:#101828}.prep-toolbar p{margin:4px 0 0;color:#667085;font-size:.7rem}.prep-block{border:1px solid #eaecf0;border-radius:12px;padding:13px}.prep-block h4{margin:0 0 8px;color:#344054;font-size:.75rem}.check,.talk,.question{display:flex;gap:8px;padding:8px 0;border-top:1px solid #f0f2f5;font-size:.71rem;line-height:1.45;color:#475467}.prep-block h4+.check,.prep-block h4+.talk,.prep-block h4+.question{border-top:0}.talk span{color:#12b76a}.warning{padding:10px 12px;border-radius:9px;background:#fff8e6;color:#7a5413;font-size:.7rem}.empty-panel{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#667085}.empty-panel strong{color:#344054}.empty-panel span{max-width:300px;margin-top:4px;font-size:.7rem}.mini-label{font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;font-weight:850;color:#175cd3}@media(max-width:950px){.apps{height:calc(100dvh - 104px)}.control-strip{align-items:stretch;flex-direction:column}.search-box{max-width:none;min-width:0}.metric-strip{width:100%}.pipeline-board{grid-auto-columns:minmax(220px,250px)}}@media(max-width:650px){.apps{height:calc(100dvh - 94px);gap:9px}.workspace-head{align-items:stretch}.title-block p{display:none}.title-line h1{font-size:1.25rem}.head-actions a{display:none}.control-strip{gap:7px}.metric-strip>div{min-width:84px}.cards{grid-template-rows:repeat(3,minmax(0,1fr))}.app-card:nth-child(4){display:none}.form-grid,.field-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.panel-head{padding:16px}.panel-body{padding:14px 16px}.panel-actions{padding:11px 16px}.info-list>div{grid-template-columns:95px 1fr}.note-compose{grid-template-columns:1fr}.prep-toolbar{flex-direction:column}.detail-tabs{padding-inline:8px}}
  `]
})
export class ApplicationWorkspaceComponent implements OnInit{
  private readonly api=inject(ApiService);
  readonly pipeline=signal<Pipeline>({counts:{},applications:[]});
  readonly jobs=signal<Job[]>([]);
  readonly selected=signal<App|null>(null);
  readonly prep=signal<Prep|null>(null);
  readonly error=signal('');
  readonly busy=signal(false);
  readonly addOpen=signal(false);
  readonly detailTab=signal<DetailTab>('overview');
  readonly cardsPerStage=4;
  readonly stagePages=signal<Record<Stage,number>>({SAVED:1,APPLIED:1,SCREENING:1,INTERVIEW:1,TECHNICAL:1,OFFER:1,REJECTED:1,WITHDRAWN:1});
  note='';
  query='';
  draft={title:'',company:'',jobAnalysisId:'',source:'',applicationUrl:'',recruiterName:'',recruiterEmail:''};
  readonly stages:Stage[]=['SAVED','APPLIED','SCREENING','INTERVIEW','TECHNICAL','OFFER','REJECTED','WITHDRAWN'];

  ngOnInit(){
    this.refresh();
    this.api.get<Job[]>('/api/v1/career/jobs').subscribe({next:v=>this.jobs.set(v),error:()=>undefined});
  }

  refresh(){
    this.api.get<Pipeline>('/api/v1/career/applications').subscribe({
      next:v=>{this.pipeline.set(v);this.clampStagePages();},
      error:e=>this.error.set(e.error?.message??'Could not load applications.')
    });
  }

  openAdd(){this.addOpen.set(true);}
  closeAdd(){if(!this.busy())this.addOpen.set(false);}

  create(){
    this.busy.set(true);this.error.set('');
    const body={...this.draft,jobAnalysisId:this.draft.jobAnalysisId||undefined,source:this.draft.source||undefined,applicationUrl:this.draft.applicationUrl||undefined,recruiterName:this.draft.recruiterName||undefined,recruiterEmail:this.draft.recruiterEmail||undefined};
    this.api.post<typeof body,App>('/api/v1/career/applications',body).subscribe({
      next:()=>{this.draft={title:'',company:'',jobAnalysisId:'',source:'',applicationUrl:'',recruiterName:'',recruiterEmail:''};this.busy.set(false);this.addOpen.set(false);this.refresh();},
      error:e=>{this.busy.set(false);this.error.set(e.error?.message??'Could not create application.');}
    });
  }

  filteredApplications(){
    const term=this.query.trim().toLowerCase();
    if(!term)return this.pipeline().applications;
    return this.pipeline().applications.filter(item=>[item.title,item.company,item.recruiterName,item.recruiterEmail,item.source].some(value=>value?.toLowerCase().includes(term)));
  }

  byStage(stage:Stage){return this.filteredApplications().filter(x=>x.stage===stage);}
  stagePage(stage:Stage){return this.stagePages()[stage]??1;}
  pageCount(stage:Stage){return Math.max(1,Math.ceil(this.byStage(stage).length/this.cardsPerStage));}
  pagedByStage(stage:Stage){const start=(this.stagePage(stage)-1)*this.cardsPerStage;return this.byStage(stage).slice(start,start+this.cardsPerStage);}
  setStagePage(stage:Stage,page:number){const next=Math.min(Math.max(1,page),this.pageCount(stage));this.stagePages.update(current=>({...current,[stage]:next}));}
  resetStagePages(){this.stagePages.set({SAVED:1,APPLIED:1,SCREENING:1,INTERVIEW:1,TECHNICAL:1,OFFER:1,REJECTED:1,WITHDRAWN:1});}
  private clampStagePages(){for(const stage of this.stages)if(this.stagePage(stage)>this.pageCount(stage))this.setStagePage(stage,this.pageCount(stage));}

  move(item:App,stage:Stage){
    this.api.patch<{stage:Stage},App>(`/api/v1/career/applications/${item.id}`,{stage}).subscribe({
      next:updated=>{if(this.selected()?.id===item.id)this.selected.set(updated);this.refresh();},
      error:e=>this.error.set(e.error?.message??'Could not move application.')
    });
  }

  select(item:App){this.selected.set(item);this.detailTab.set('overview');this.prep.set(null);this.note='';}

  addNote(item:App){
    const body=this.note.trim();if(!body)return;
    this.api.post<{body:string},Array<{body:string;createdAt:string}>>(`/api/v1/career/applications/${item.id}/notes`,{body}).subscribe({
      next:notes=>{const updated={...item,notes};this.selected.set(updated);this.note='';this.refresh();},
      error:e=>this.error.set(e.error?.message??'Could not save note.')
    });
  }

  prepare(item:App){this.api.get<Prep>(`/api/v1/career/applications/${item.id}/interview-prep`).subscribe({next:v=>this.prep.set(v),error:e=>this.error.set(e.error?.message??'Could not load interview prep.')});}

  setFollowUp(item:App,value:string){
    this.api.patch<{nextFollowUpAt?:string},App>(`/api/v1/career/applications/${item.id}`,{nextFollowUpAt:value||undefined}).subscribe({
      next:v=>{this.selected.set(v);this.refresh();},
      error:e=>this.error.set(e.error?.message??'Could not update follow-up.')
    });
  }

  followUpsDue(){const now=Date.now();return this.pipeline().applications.filter(x=>x.nextFollowUpAt&&new Date(x.nextFollowUpAt).getTime()<=now&&!['REJECTED','WITHDRAWN','OFFER'].includes(x.stage)).length;}
  isDue(v:string){return new Date(v).getTime()<=Date.now();}
  label(s:Stage){return s.charAt(0)+s.slice(1).toLowerCase().replaceAll('_',' ');}
  date(v:string){return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(v));}
  dateTime(v:string){return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v));}
  dateInput(v?:string){return v?new Date(v).toISOString().slice(0,10):'';}
}
