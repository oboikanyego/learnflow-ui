import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface MasteryLesson { id:string; title:string; masteryScore:number; assessmentAttempts:number; lastAssessedAt?:string; confidenceScore?:number; nextReviewAt?:string }
interface MasterySummary { assessedLessons:number; averageMastery:number; masteredLessons:number; needsReview:number; lessons:MasteryLesson[] }

@Component({
  standalone:true,
  imports:[RouterLink,MatButtonModule],
  template:`
  <section class="mastery page-enter">
    <div class="page-head"><div><span class="eyebrow">Assessment & mastery</span><h1>Evidence of what you actually know.</h1><p class="muted">Checkpoint scores complement confidence and focus-time data so LearnFlow can identify what needs another learning cycle.</p></div><a mat-stroked-button routerLink="/retention">Review queue</a></div>
    @if(summary();as data){
      <div class="stats"><article><span>Assessed</span><strong>{{data.assessedLessons}}</strong><small>Lessons with checkpoint evidence</small></article><article><span>Avg mastery</span><strong>{{data.averageMastery || '—'}}@if(data.assessedLessons){%}</strong><small>Across latest lesson scores</small></article><article><span>Mastered</span><strong>{{data.masteredLessons}}</strong><small>Lessons at 90% or above</small></article><article><span>Needs review</span><strong>{{data.needsReview}}</strong><small>Lessons below 70%</small></article></div>
      <section class="list-shell"><div class="section-head"><div><span class="mini-label">Mastery map</span><h3>Assessed lessons</h3></div></div><div class="lesson-list">@for(item of data.lessons;track item.id){<article><div class="score" [attr.data-score]="band(item.masteryScore)">{{item.masteryScore}}%</div><div class="copy"><strong>{{item.title}}</strong><small>{{item.assessmentAttempts}} attempt{{item.assessmentAttempts===1?'':'s'}} · confidence {{item.confidenceScore??'—'}}/5@if(item.lastAssessedAt){ · assessed {{date(item.lastAssessedAt)}}}</small><div class="bar"><span [style.width.%]="item.masteryScore"></span></div></div><a mat-stroked-button [routerLink]="['/assess',item.id]">Retest</a></article>}@empty{<div class="empty"><strong>No mastery evidence yet.</strong><span>Complete a lesson and take a checkpoint to establish the first mastery score.</span></div>}</div></section>
    } @else {<div class="loading">Loading mastery evidence…</div>}
  </section>`,
  styles:[`
    .mastery{max-width:1100px;margin:0 auto}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.stats article,.list-shell,.loading{padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff}.stats span,.stats small{display:block;color:#7a869a}.stats span{font-size:.68rem;font-weight:850;text-transform:uppercase}.stats strong{display:block;font-size:1.7rem;color:#10233f;margin:5px 0}.list-shell{padding:22px}.section-head h3{margin:4px 0 14px;color:#10233f}.lesson-list{display:grid}.lesson-list article{display:grid;grid-template-columns:76px 1fr auto;gap:14px;align-items:center;padding:14px 0;border-top:1px solid #edf1f5}.score{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#eef4ff;color:#2f6fed;font-weight:900}.score[data-score="weak"]{background:#fff1f1;color:#b13b47}.score[data-score="mastered"]{background:#eaf7ef;color:#216e4e}.copy{min-width:0}.copy strong{display:block;color:#10233f}.copy small{display:block;color:#7a869a;margin:4px 0 8px}.bar{height:6px;border-radius:999px;background:#edf1f5;overflow:hidden}.bar span{display:block;height:100%;background:#2f6fed;border-radius:inherit}.empty{padding:28px;border:1px dashed #ccd7e5;border-radius:14px;display:flex;flex-direction:column;gap:5px;color:#66758a}.empty strong{color:#10233f}@media(max-width:760px){.stats{grid-template-columns:1fr 1fr}.lesson-list article{grid-template-columns:64px 1fr}.lesson-list article>a{grid-column:1/-1}}@media(max-width:520px){.stats{grid-template-columns:1fr}}
  `]
})
export class MasteryComponent implements OnInit{private readonly api=inject(ApiService);readonly summary=signal<MasterySummary|null>(null);ngOnInit():void{this.api.get<MasterySummary>('/api/v1/assessments/mastery').subscribe(v=>this.summary.set(v));}band(score:number):string{return score>=90?'mastered':score<70?'weak':'developing';}date(value:string):string{return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}}
