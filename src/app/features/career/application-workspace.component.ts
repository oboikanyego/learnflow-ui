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
      <p>Move vertically through each stage without horizontal scrolling or long pages.</p>
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
    <div class="metric-grid" aria-label="Pipeline summary">
      <div><span>Applied</span><strong>{{pipeline().counts['APPLIED']||0}}</strong></div>
      <div><span>Interviews</span><strong>{{(pipeline().counts['SCREENING']||0)+(pipeline().counts['INTERVIEW']||0)+(pipeline().counts['TECHNICAL']||0)}}</strong></div>
      <div><span>Offers</span><strong>{{pipeline().counts['OFFER']||0}}</strong></div>
      <div [class.attention]="followUpsDue()>0"><span>Follow-ups</span><strong>{{followUpsDue()}}</strong></div>
    </div>
  </section>

  @if(error()){<div class="error-banner"><span>!</span><strong>{{error()}}</strong><button type="button" (click)="error.set('')">×</button></div>}

  <section class="pipeline-shell">
    <aside class="stage-rail" aria-label="Application stages">
      <div class="stage-rail-head"><span>Pipeline stages</span><small>Select one stage</small></div>
      <nav>
        @for(stage of stages;track stage){
          <button type="button" [class.active]="activeStage()===stage" [attr.data-stage]="stage" (click)="setActiveStage(stage)">
            <span class="stage-dot"></span>
            <span class="stage-copy"><strong>{{label(stage)}}</strong><small>{{stageHint(stage)}}</small></span>
            <span class="stage-count">{{byStage(stage).length}}</span>
          </button>
        }
      </nav>
    </aside>

    <main class="stage-workspace">
      <div class="mobile-stage-select">
        <label for="career-stage">Stage</label>
        <select id="career-stage" [ngModel]="activeStage()" (ngModelChange)="setActiveStage($event)">
          @for(stage of stages;track stage){<option [value]="stage">{{label(stage)}} · {{byStage(stage).length}}</option>}
        </select>
      </div>

      <header class="stage-header">
        <div>
          <div class="stage-title"><span class="stage-dot" [attr.data-stage]="activeStage()"></span><h2>{{label(activeStage())}}</h2><span class="count-pill">{{byStage(activeStage()).length}}</span></div>
          <p>{{stageDescription(activeStage())}}</p>
        </div>
        @if(query){<span class="matches-pill">{{filteredApplications().length}} total matches</span>}
      </header>

      <section class="application-grid">
        @for(item of pagedByStage(activeStage());track item.id){
          <article class="app-card" [class.selected]="selected()?.id===item.id" (click)="select(item)" tabindex="0" (keydown.enter)="select(item)">
            <div class="card-top">
              <div class="card-title"><strong>{{item.title}}</strong><small>{{item.company}}</small></div>
              @if(item.jobAnalysisId){<span class="analysis-chip">Analysis</span>}
            </div>

            <div class="card-meta">
              @if(item.source){<span>{{item.source}}</span>}
              @if(item.recruiterName){<span>{{item.recruiterName}}</span>}
              @if(!item.source&&!item.recruiterName){<span>Details can be added later</span>}
            </div>

            @if(item.nextFollowUpAt){
              <div class="follow-up" [class.due]="isDue(item.nextFollowUpAt)">
                <span>◷</span><strong>{{isDue(item.nextFollowUpAt)?'Follow-up due':'Follow up'}}</strong><small>{{date(item.nextFollowUpAt)}}</small>
              </div>
            } @else {
              <div class="follow-up neutral"><span>○</span><strong>No follow-up set</strong></div>
            }

            <div class="card-footer" (click)="$event.stopPropagation()">
              <select [ngModel]="item.stage" (ngModelChange)="move(item,$event)" aria-label="Application stage">
                @for(option of stages;track option){<option [value]="option">{{label(option)}}</option>}
              </select>
              <button type="button" (click)="select(item)">View details →</button>
            </div>
          </article>
        } @empty {
          <div class="empty-stage">
            <span>○</span>
            <strong>{{query?'No matching applications':'No applications in '+label(activeStage())}}</strong>
            <p>{{query?'Try another search term or select another stage.':'Applications moved here will appear in this focused workspace.'}}</p>
            @if(!query){<button mat-flat-button class="primary-cta" type="button" (click)="openAdd()">Add opportunity</button>}
          </div>
        }
      </section>

      <footer class="workspace-pager">
        <div>
          @if(byStage(activeStage()).length){
            <span>Showing {{pageStart(activeStage())}}–{{pageEnd(activeStage())}} of {{byStage(activeStage()).length}}</span>
          } @else { <span>No items to show</span> }
        </div>
        <div class="pager-actions">
          <button type="button" (click)="setStagePage(activeStage(),stagePage(activeStage())-1)" [disabled]="stagePage(activeStage())<=1">Previous</button>
          <span>Page {{stagePage(activeStage())}} of {{pageCount(activeStage())}}</span>
          <button type="button" (click)="setStagePage(activeStage(),stagePage(activeStage())+1)" [disabled]="stagePage(activeStage())>=pageCount(activeStage())">Next</button>
        </div>
      </footer>
    </main>
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
.apps{position:relative;height:calc(100dvh - 118px);min-height:560px;width:100%;max-width:none;margin:0;overflow:hidden;display:grid;grid-template-rows:auto auto auto minmax(0,1fr);gap:12px;color:#344054;box-sizing:border-box}.workspace-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;min-width:0}.title-block{min-width:0}.title-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.title-line h1{margin:2px 0 0;color:#101828;font-size:1.65rem}.title-block p{margin:5px 0 0;color:#667085;font-size:.8rem}.total-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#eef4ff;color:#175cd3;font-size:.68rem;font-weight:850}.head-actions{display:flex;gap:8px;flex:none}.control-strip{display:grid;grid-template-columns:minmax(260px,1fr) minmax(390px,520px);align-items:center;gap:12px;min-width:0}.search-box{height:42px;min-width:0;display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid #d7dde7;border-radius:12px;background:#fff}.search-box>span{color:#7a869a;font-size:1rem}.search-box input{flex:1;min-width:0;border:0!important;outline:0;background:transparent!important;padding:0!important;font:inherit;color:#344054}.search-box button{border:0;background:transparent;color:#7a869a;cursor:pointer;font-size:1.1rem}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;min-width:0}.metric-grid>div{min-width:0;padding:7px 10px;border:1px solid #e4e7ec;border-radius:11px;background:#fff;display:flex;flex-direction:column}.metric-grid span{font-size:.62rem;color:#667085;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric-grid strong{font-size:1rem;color:#101828}.metric-grid .attention{background:#fff8e8;border-color:#f0dfae}.metric-grid .attention strong{color:#9a6700}.error-banner{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid #fecdca;border-radius:10px;background:#fef3f2;color:#b42318;font-size:.75rem}.error-banner>span{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#fee4e2;font-weight:900}.error-banner button{margin-left:auto;border:0;background:transparent;color:inherit;font-size:1rem;cursor:pointer}.pipeline-shell{min-height:0;min-width:0;display:grid;grid-template-columns:220px minmax(0,1fr);gap:12px;overflow:hidden}.stage-rail{min-height:0;overflow:hidden;border:1px solid #e4e7ec;border-radius:14px;background:#fff;display:grid;grid-template-rows:auto minmax(0,1fr)}.stage-rail-head{padding:12px 13px;border-bottom:1px solid #eaecf0;display:flex;flex-direction:column}.stage-rail-head span{font-size:.7rem;font-weight:850;color:#344054}.stage-rail-head small{font-size:.6rem;color:#98a2b3}.stage-rail nav{padding:7px;display:grid;grid-template-rows:repeat(8,minmax(0,1fr));gap:5px;min-height:0}.stage-rail button{min-height:0;width:100%;border:1px solid transparent;border-radius:10px;background:transparent;padding:7px 8px;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;text-align:left;cursor:pointer;color:#475467}.stage-rail button:hover{background:#f7f9fc}.stage-rail button.active{background:#eef4ff;border-color:#c9dcff;color:#175cd3}.stage-dot{width:9px;height:9px;border-radius:50%;background:#98a2b3;flex:none}.stage-rail button[data-stage='APPLIED'] .stage-dot,.stage-dot[data-stage='APPLIED']{background:#2f6fed}.stage-rail button[data-stage='SCREENING'] .stage-dot,.stage-dot[data-stage='SCREENING']{background:#7f56d9}.stage-rail button[data-stage='INTERVIEW'] .stage-dot,.stage-rail button[data-stage='TECHNICAL'] .stage-dot,.stage-dot[data-stage='INTERVIEW'],.stage-dot[data-stage='TECHNICAL']{background:#f79009}.stage-rail button[data-stage='OFFER'] .stage-dot,.stage-dot[data-stage='OFFER']{background:#12b76a}.stage-rail button[data-stage='REJECTED'] .stage-dot,.stage-rail button[data-stage='WITHDRAWN'] .stage-dot,.stage-dot[data-stage='REJECTED'],.stage-dot[data-stage='WITHDRAWN']{background:#f04438}.stage-copy{min-width:0;display:flex;flex-direction:column}.stage-copy strong{font-size:.67rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stage-copy small{font-size:.56rem;color:#98a2b3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stage-count{min-width:24px;height:22px;padding:0 5px;border-radius:999px;display:grid;place-items:center;background:#f2f4f7;color:#475467;font-size:.61rem;font-weight:850}.stage-rail button.active .stage-count{background:#dbe9ff;color:#175cd3}.stage-workspace{min-height:0;min-width:0;overflow:hidden;border:1px solid #e4e7ec;border-radius:14px;background:#fff;display:grid;grid-template-rows:auto minmax(0,1fr) auto}.mobile-stage-select{display:none}.stage-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 14px;border-bottom:1px solid #eaecf0;background:#fafbfc}.stage-title{display:flex;align-items:center;gap:8px}.stage-title h2{margin:0;color:#101828;font-size:1rem}.count-pill,.matches-pill{padding:4px 7px;border-radius:999px;background:#eef2f6;color:#475467;font-size:.62rem;font-weight:800}.matches-pill{background:#eef4ff;color:#175cd3}.stage-header p{margin:3px 0 0;color:#667085;font-size:.67rem}.application-grid{min-height:0;padding:10px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:9px;overflow:hidden}.app-card{min-width:0;min-height:0;background:#fff;border:1px solid #e0e6ef;border-radius:12px;padding:11px;display:flex;flex-direction:column;gap:7px;cursor:pointer;overflow:hidden;transition:border-color .15s ease,box-shadow .15s ease,transform .15s ease}.app-card:hover,.app-card.selected{border-color:#9ec5ff;box-shadow:0 5px 14px rgba(16,24,40,.07);transform:translateY(-1px)}.card-top{display:flex;justify-content:space-between;gap:8px;min-width:0}.card-title{display:flex;flex-direction:column;min-width:0}.card-title strong{color:#101828;font-size:.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.card-title small{color:#667085;font-size:.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.analysis-chip{flex:none;padding:3px 6px;border-radius:999px;background:#eef4ff;color:#175cd3;font-size:.56rem;font-weight:800}.card-meta{display:flex;gap:5px;flex-wrap:wrap;min-height:22px;max-height:44px;overflow:hidden}.card-meta span{max-width:100%;padding:3px 6px;border-radius:999px;background:#f2f4f7;color:#667085;font-size:.59rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.follow-up{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:4px;color:#667085;font-size:.62rem}.follow-up small{justify-self:end;color:#98a2b3;white-space:nowrap}.follow-up.due{padding:6px 7px;border-radius:8px;background:#fff1f0;color:#b42318}.follow-up.due small{color:#b42318}.follow-up.neutral{grid-template-columns:auto 1fr;color:#98a2b3}.card-footer{margin-top:auto;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center}.card-footer select{width:100%;height:34px!important;min-height:34px!important;font-size:.65rem!important}.card-footer button{border:0;background:transparent;color:#175cd3;font-size:.62rem;font-weight:800;cursor:pointer;white-space:nowrap}.empty-stage{grid-column:1/-1;grid-row:1/-1;align-self:center;justify-self:center;max-width:420px;display:flex;flex-direction:column;align-items:center;text-align:center;color:#98a2b3}.empty-stage>span{font-size:2rem}.empty-stage strong{color:#475467;font-size:.82rem}.empty-stage p{margin:5px 0 12px;font-size:.68rem;line-height:1.45}.workspace-pager{min-height:42px;padding:7px 11px;border-top:1px solid #eaecf0;background:#fafbfc;display:flex;justify-content:space-between;align-items:center;gap:12px}.workspace-pager>div>span{font-size:.62rem;color:#667085}.pager-actions{display:flex;align-items:center;gap:8px}.pager-actions button{min-height:30px;padding:0 10px;border:1px solid #d0d5dd;border-radius:8px;background:#fff;color:#344054;font-size:.64rem;font-weight:750;cursor:pointer}.pager-actions button:disabled{opacity:.4;cursor:default}.overlay{position:absolute;inset:0;z-index:120;display:flex;justify-content:flex-end;background:rgba(16,24,40,.26);backdrop-filter:blur(2px);overflow:hidden}.side-panel{height:100%;width:min(540px,94vw);display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:#fff;border-left:1px solid #e4e7ec;box-shadow:-18px 0 45px rgba(16,24,40,.16);animation:panelIn .18s ease-out;overflow:hidden}.detail-panel{width:min(610px,96vw);grid-template-rows:auto auto minmax(0,1fr)}@keyframes panelIn{from{transform:translateX(24px);opacity:.65}to{transform:none;opacity:1}}.panel-head{display:flex;justify-content:space-between;gap:16px;padding:20px 22px 16px;border-bottom:1px solid #eaecf0}.panel-head h2{margin:3px 0;color:#101828;font-size:1.25rem}.panel-head p{margin:0;color:#667085;font-size:.75rem;line-height:1.45}.icon-close{width:34px;height:34px;border:1px solid #e4e7ec;border-radius:9px;background:#fff;color:#667085;font-size:1.25rem;cursor:pointer}.panel-body{min-height:0;overflow-y:auto;overflow-x:hidden;padding:18px 22px}.panel-actions{display:flex;justify-content:flex-end;gap:8px;padding:13px 22px;border-top:1px solid #eaecf0;background:#fafbfc}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid label,.field-grid label{display:flex;flex-direction:column;gap:5px}.form-grid label>span,.field-grid label>span{font-size:.68rem;font-weight:750;color:#475467}.form-grid .wide{grid-column:1/-1}.form-grid input,.form-grid select,.field-grid input,.field-grid select,.note-compose textarea{width:100%;box-sizing:border-box;border:1px solid #d0d5dd;border-radius:10px;padding:10px 11px;font:inherit;background:#fff;color:#344054}.detail-head{padding-bottom:13px}.detail-title{min-width:0}.detail-title h2,.detail-title p{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.detail-tabs{display:flex;gap:4px;padding:0 18px;border-bottom:1px solid #eaecf0;background:#fff}.detail-tabs button{position:relative;border:0;background:transparent;padding:11px 10px;color:#667085;font:750 .7rem/1.2 inherit;cursor:pointer}.detail-tabs button.active{color:#175cd3}.detail-tabs button.active::after{content:'';position:absolute;left:8px;right:8px;bottom:-1px;height:2px;background:#175cd3;border-radius:2px}.detail-tabs button span{margin-left:4px;padding:2px 5px;border-radius:999px;background:#f2f4f7;font-size:.58rem}.detail-body{padding-top:16px}.detail-section{display:grid;gap:16px}.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.info-list{display:grid;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden}.info-list>div{display:grid;grid-template-columns:120px 1fr;gap:10px;padding:12px 13px;border-top:1px solid #eaecf0}.info-list>div:first-child{border-top:0}.info-list span{font-size:.66rem;color:#667085}.info-list strong,.info-list a{font-size:.72rem;color:#344054;text-decoration:none;min-width:0;overflow-wrap:anywhere}.info-list small{grid-column:2;color:#667085;font-size:.64rem}.info-list a{color:#175cd3;font-weight:750}.next-action{padding:13px 14px;border-radius:11px;background:#eff8ff;border:1px solid #b2ddff;display:flex;justify-content:space-between;gap:12px}.next-action span{font-size:.68rem;color:#026aa2}.next-action strong{font-size:.72rem;color:#0b4a6f}.next-action.overdue{background:#fff6ed;border-color:#f9dbaf}.next-action.overdue span,.next-action.overdue strong{color:#b54708}.note-compose{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.note-compose textarea{resize:none}.note-list{display:grid;border-top:1px solid #eaecf0}.note{padding:13px 2px;border-bottom:1px solid #eaecf0}.note p{margin:0 0 5px;color:#344054;font-size:.75rem;line-height:1.5;white-space:pre-wrap}.note small{color:#98a2b3;font-size:.62rem}.prep-toolbar{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.prep-toolbar h3{margin:0;color:#101828}.prep-toolbar p{margin:4px 0 0;color:#667085;font-size:.7rem}.prep-block{border:1px solid #eaecf0;border-radius:12px;padding:13px}.prep-block h4{margin:0 0 8px;color:#344054;font-size:.75rem}.check,.talk,.question{display:flex;gap:8px;padding:8px 0;border-top:1px solid #f0f2f5;font-size:.71rem;line-height:1.45;color:#475467}.prep-block h4+.check,.prep-block h4+.talk,.prep-block h4+.question{border-top:0}.talk span{color:#12b76a}.warning{padding:10px 12px;border-radius:9px;background:#fff8e6;color:#7a5413;font-size:.7rem}.empty-panel{min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#667085}.empty-panel strong{color:#344054}.empty-panel span{max-width:300px;margin-top:4px;font-size:.7rem}.mini-label{font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;font-weight:850;color:#175cd3}@media(max-width:1050px){.control-strip{grid-template-columns:1fr}.metric-grid{grid-template-columns:repeat(4,1fr)}.pipeline-shell{grid-template-columns:190px minmax(0,1fr)}.application-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr))}}@media(max-width:760px){.apps{height:calc(100dvh - 94px);gap:9px}.workspace-head{align-items:stretch}.title-block p{display:none}.title-line h1{font-size:1.25rem}.head-actions a{display:none}.control-strip{gap:7px}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pipeline-shell{grid-template-columns:1fr}.stage-rail{display:none}.mobile-stage-select{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #eaecf0}.mobile-stage-select label{font-size:.64rem;font-weight:800;color:#475467}.mobile-stage-select select{flex:1}.stage-workspace{grid-template-rows:auto auto minmax(0,1fr) auto}.application-grid{grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,minmax(0,1fr));padding:8px}.card-meta{display:none}.form-grid,.field-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.panel-head{padding:16px}.panel-body{padding:14px 16px}.panel-actions{padding:11px 16px}.info-list>div{grid-template-columns:95px 1fr}.note-compose{grid-template-columns:1fr}.prep-toolbar{flex-direction:column}.detail-tabs{padding-inline:8px}.workspace-pager{padding-inline:8px}.workspace-pager>div:first-child{display:none}}@media(max-width:520px){.metric-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.metric-grid>div{padding:5px}.metric-grid span{font-size:.52rem}.metric-grid strong{font-size:.85rem}.application-grid{grid-template-columns:1fr;grid-template-rows:repeat(3,minmax(0,1fr))}.app-card:nth-child(n+4){display:none}.card-footer{grid-template-columns:1fr}.card-footer button{display:none}.stage-header p{display:none}.matches-pill{display:none}.pager-actions{width:100%;justify-content:space-between}}
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
  readonly activeStage=signal<Stage>('APPLIED');
  readonly cardsPerStage=6;
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
      next:created=>{this.draft={title:'',company:'',jobAnalysisId:'',source:'',applicationUrl:'',recruiterName:'',recruiterEmail:''};this.busy.set(false);this.addOpen.set(false);this.activeStage.set(created.stage);this.refresh();},
      error:e=>{this.busy.set(false);this.error.set(e.error?.message??'Could not create application.');}
    });
  }

  filteredApplications(){
    const term=this.query.trim().toLowerCase();
    if(!term)return this.pipeline().applications;
    return this.pipeline().applications.filter(item=>[item.title,item.company,item.recruiterName,item.recruiterEmail,item.source].some(value=>value?.toLowerCase().includes(term)));
  }

  setActiveStage(stage:Stage){this.activeStage.set(stage);this.selected.set(null);}
  byStage(stage:Stage){return this.filteredApplications().filter(x=>x.stage===stage);}
  stagePage(stage:Stage){return this.stagePages()[stage]??1;}
  pageCount(stage:Stage){return Math.max(1,Math.ceil(this.byStage(stage).length/this.cardsPerStage));}
  pagedByStage(stage:Stage){const start=(this.stagePage(stage)-1)*this.cardsPerStage;return this.byStage(stage).slice(start,start+this.cardsPerStage);}
  pageStart(stage:Stage){return this.byStage(stage).length?((this.stagePage(stage)-1)*this.cardsPerStage)+1:0;}
  pageEnd(stage:Stage){return Math.min(this.stagePage(stage)*this.cardsPerStage,this.byStage(stage).length);}
  setStagePage(stage:Stage,page:number){const next=Math.min(Math.max(1,page),this.pageCount(stage));this.stagePages.update(current=>({...current,[stage]:next}));}
  resetStagePages(){this.stagePages.set({SAVED:1,APPLIED:1,SCREENING:1,INTERVIEW:1,TECHNICAL:1,OFFER:1,REJECTED:1,WITHDRAWN:1});}
  private clampStagePages(){for(const stage of this.stages)if(this.stagePage(stage)>this.pageCount(stage))this.setStagePage(stage,this.pageCount(stage));}

  move(item:App,stage:Stage){
    this.api.patch<{stage:Stage},App>(`/api/v1/career/applications/${item.id}`,{stage}).subscribe({
      next:updated=>{if(this.selected()?.id===item.id)this.selected.set(updated);this.activeStage.set(stage);this.refresh();},
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

  stageHint(stage:Stage){return ({SAVED:'Roles to consider',APPLIED:'Applications sent',SCREENING:'Recruiter stage',INTERVIEW:'Interview process',TECHNICAL:'Assessments',OFFER:'Offers received',REJECTED:'Closed roles',WITHDRAWN:'Exited roles'})[stage];}
  stageDescription(stage:Stage){return ({SAVED:'Keep promising roles here until you are ready to apply.',APPLIED:'Track submitted applications and set the next follow-up.',SCREENING:'Manage recruiter conversations and screening calls.',INTERVIEW:'Keep active interview opportunities focused and prepared.',TECHNICAL:'Track coding challenges, take-homes and technical rounds.',OFFER:'Compare offers and capture decision-critical details.',REJECTED:'Keep closed opportunities for learning and future reference.',WITHDRAWN:'Store roles you intentionally chose not to continue.'})[stage];}
  followUpsDue(){const now=Date.now();return this.pipeline().applications.filter(x=>x.nextFollowUpAt&&new Date(x.nextFollowUpAt).getTime()<=now&&!['REJECTED','WITHDRAWN','OFFER'].includes(x.stage)).length;}
  isDue(v:string){return new Date(v).getTime()<=Date.now();}
  label(s:Stage){return s.charAt(0)+s.slice(1).toLowerCase().replaceAll('_',' ');}
  date(v:string){return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(v));}
  dateTime(v:string){return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v));}
  dateInput(v?:string){return v?new Date(v).toISOString().slice(0,10):'';}
}
