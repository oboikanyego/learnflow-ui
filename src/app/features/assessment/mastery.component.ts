import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface MasteryLesson { id:string; title:string; masteryScore:number; assessmentAttempts:number; lastAssessedAt?:string; confidenceScore?:number; nextReviewAt?:string }
interface MasterySummary { assessedLessons:number; averageMastery:number; masteredLessons:number; needsReview:number; lessons:MasteryLesson[] }
type MasteryFilter='ALL'|'MASTERED'|'DEVELOPING'|'REVIEW';

@Component({
  standalone:true,
  imports:[RouterLink,MatButtonModule],
  template:`
  <section class="mastery page-enter">
    <div class="page-head"><div><span class="eyebrow">Assessment & mastery</span><h1>Evidence of what you actually know.</h1><p class="muted">Checkpoint scores complement confidence and focus-time data so LearnFlow can identify what needs another learning cycle.</p></div><a mat-stroked-button routerLink="/retention">Review queue</a></div>
    @if(summary();as data){
      <div class="stats"><article><span>Assessed</span><strong>{{data.assessedLessons}}</strong><small>Lessons with checkpoint evidence</small></article><article><span>Avg mastery</span><strong>{{data.averageMastery || '—'}}@if(data.assessedLessons){%}</strong><small>Across latest lesson scores</small></article><article><span>Mastered</span><strong>{{data.masteredLessons}}</strong><small>Lessons at 90% or above</small></article><article><span>Needs review</span><strong>{{data.needsReview}}</strong><small>Lessons below 70%</small></article></div>
      <section class="list-shell">
        <div class="section-head"><div><span class="mini-label">Mastery map</span><h3>Assessed lessons</h3></div><small>Showing {{rangeStart()}}–{{rangeEnd()}} of {{filtered().length}}</small></div>
        <div class="filters"><button type="button" [class.active]="filter()==='ALL'" (click)="setFilter('ALL')">All</button><button type="button" [class.active]="filter()==='MASTERED'" (click)="setFilter('MASTERED')">Mastered</button><button type="button" [class.active]="filter()==='DEVELOPING'" (click)="setFilter('DEVELOPING')">Developing</button><button type="button" [class.active]="filter()==='REVIEW'" (click)="setFilter('REVIEW')">Needs review</button></div>
        <div class="lesson-list">@for(item of paged();track item.id){<article><div class="score" [attr.data-score]="band(item.masteryScore)">{{item.masteryScore}}%</div><div class="copy"><strong>{{item.title}}</strong><small>{{item.assessmentAttempts}} attempt{{item.assessmentAttempts===1?'':'s'}} · confidence {{item.confidenceScore??'—'}}/5@if(item.lastAssessedAt){ · assessed {{date(item.lastAssessedAt)}}}</small><div class="bar"><span [style.width.%]="item.masteryScore"></span></div></div><a mat-stroked-button [routerLink]="['/assess',item.id]">Retest</a></article>}@empty{<div class="empty"><strong>No mastery evidence in this view.</strong><span>Try another filter or complete a checkpoint.</span></div>}</div>
        @if(pageCount()>1){<footer class="pager"><button mat-stroked-button type="button" (click)="setPage(page()-1)" [disabled]="page()===1">Previous</button><span>Page {{page()}} of {{pageCount()}}</span><button mat-stroked-button type="button" (click)="setPage(page()+1)" [disabled]="page()===pageCount()">Next</button></footer>}
      </section>
    } @else {<div class="loading">Loading mastery evidence…</div>}
  </section>`,
  styles:[`
    .mastery{max-width:1100px;margin:0 auto}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.stats article,.list-shell,.loading{padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff}.stats span,.stats small{display:block;color:#7a869a}.stats span{font-size:.68rem;font-weight:850;text-transform:uppercase}.stats strong{display:block;font-size:1.7rem;color:#10233f;margin:5px 0}.list-shell{padding:22px}.section-head{display:flex;justify-content:space-between;align-items:end;gap:12px}.section-head h3{margin:4px 0 12px;color:#10233f}.section-head small{color:#7a869a}.filters{display:flex;flex-wrap:wrap;gap:5px;padding:4px;background:#f2f4f7;border-radius:10px;width:max-content;max-width:100%;margin-bottom:10px}.filters button{border:0;background:transparent;padding:8px 10px;border-radius:8px;color:#667085;font-weight:750;cursor:pointer}.filters button.active{background:#fff;color:#175cd3;box-shadow:0 1px 3px rgba(16,24,40,.1)}.lesson-list{display:grid}.lesson-list article{display:grid;grid-template-columns:76px 1fr auto;gap:14px;align-items:center;padding:14px 0;border-top:1px solid #edf1f5}.lesson-list article:first-child{border-top:0}.score{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#eef4ff;color:#2f6fed;font-weight:900}.score[data-score="weak"]{background:#fff1f1;color:#b13b47}.score[data-score="mastered"]{background:#eaf7ef;color:#216e4e}.copy{min-width:0}.copy strong{display:block;color:#10233f;overflow-wrap:anywhere}.copy small{display:block;color:#7a869a;margin:4px 0 8px}.bar{height:6px;border-radius:999px;background:#edf1f5;overflow:hidden}.bar span{display:block;height:100%;background:#2f6fed;border-radius:inherit}.empty{padding:28px;border:1px dashed #ccd7e5;border-radius:14px;display:flex;flex-direction:column;gap:5px;color:#66758a}.empty strong{color:#10233f}.pager{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding-top:16px;border-top:1px solid #edf1f5}.pager span{color:#667085;font-size:.72rem}@media(max-width:760px){.stats{grid-template-columns:1fr 1fr}.lesson-list article{grid-template-columns:64px 1fr}.lesson-list article>a{grid-column:1/-1}.section-head{align-items:flex-start;flex-direction:column}}@media(max-width:520px){.stats{grid-template-columns:1fr}.pager{justify-content:space-between}}
  `]
})
export class MasteryComponent implements OnInit{
  private readonly api=inject(ApiService);readonly summary=signal<MasterySummary|null>(null);readonly filter=signal<MasteryFilter>('ALL');readonly page=signal(1);readonly pageSize=8;
  readonly filtered=computed(()=>{const rows=this.summary()?.lessons??[];if(this.filter()==='MASTERED')return rows.filter(x=>x.masteryScore>=90);if(this.filter()==='REVIEW')return rows.filter(x=>x.masteryScore<70);if(this.filter()==='DEVELOPING')return rows.filter(x=>x.masteryScore>=70&&x.masteryScore<90);return rows;});
  readonly paged=computed(()=>{const start=(this.page()-1)*this.pageSize;return this.filtered().slice(start,start+this.pageSize);});
  ngOnInit():void{this.api.get<MasterySummary>('/api/v1/assessments/mastery').subscribe(v=>{this.summary.set(v);this.page.set(1);});}
  setFilter(value:MasteryFilter):void{this.filter.set(value);this.page.set(1);} pageCount():number{return Math.max(1,Math.ceil(this.filtered().length/this.pageSize));} setPage(value:number):void{this.page.set(Math.min(Math.max(1,value),this.pageCount()));} rangeStart():number{return this.filtered().length?(this.page()-1)*this.pageSize+1:0;} rangeEnd():number{return Math.min(this.page()*this.pageSize,this.filtered().length);}
  band(score:number):string{return score>=90?'mastered':score<70?'weak':'developing';}date(value:string):string{return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}
}
