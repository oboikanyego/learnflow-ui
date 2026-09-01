import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

interface ReviewLesson {
  _id:string;
  title:string;
  description?:string;
  resourceUrl?:string;
  confidenceScore?:number;
  reviewStage?:number;
  nextReviewAt?:string;
  lastReviewedAt?:string;
  reviewCount?:number;
}
interface ReviewQueue { generatedAt:string; dueCount:number; weakCount:number; averageConfidence:number; due:ReviewLesson[]; upcoming:ReviewLesson[]; }

@Component({
  standalone:true,
  imports:[RouterLink,MatButtonModule],
  template:`
    <section class="retention page-enter">
      <div class="page-head"><div><span class="eyebrow">Adaptive retention</span><h1>Review what is starting to fade.</h1><p class="muted">LearnFlow schedules completed lessons back into your attention based on confidence and previous review performance.</p></div><a mat-stroked-button routerLink="/ai-coach">Ask coach about weak topics</a></div>

      @if(queue();as data){
        <section class="summary-grid"><article><span>Due now</span><strong>{{data.dueCount}}</strong><small>Reviews ready for attention</small></article><article><span>Weak topics</span><strong>{{data.weakCount}}</strong><small>Confidence rated 1–2</small></article><article><span>Avg confidence</span><strong>{{data.averageConfidence || '—'}}<em>@if(data.averageConfidence){/5}</em></strong><small>Across scheduled reviews</small></article><article><span>Upcoming</span><strong>{{data.upcoming.length}}</strong><small>Reviews scheduled ahead</small></article></section>

        <section class="review-shell">
          <div class="section-head"><div><span class="mini-label">Review queue</span><h3>Due for review</h3></div><small>Rate recall after a quick review. Lower confidence returns the lesson sooner.</small></div>
          <div class="review-list">
            @for(item of data.due;track item._id){
              <article class="review-card">
                <div class="review-copy"><span class="confidence" [attr.data-score]="item.confidenceScore??3">Confidence {{item.confidenceScore??3}} / 5</span><h3>{{item.title}}</h3><p>{{item.description || 'Revisit the important ideas, examples or commands from this lesson.'}}</p><div class="meta"><span>{{item.reviewCount??0}} previous reviews</span>@if(item.lastReviewedAt){<span>Last reviewed {{formatDate(item.lastReviewedAt)}}</span>}</div>@if(item.resourceUrl){<a [href]="item.resourceUrl" target="_blank" rel="noopener">Open learning resource ↗</a>}</div>
                <div class="rating"><span>How well did you recall it?</span><div>@for(score of ratings;track score){<button type="button" (click)="review(item,score)" [disabled]="savingId()===item._id"><strong>{{score}}</strong><small>{{label(score)}}</small></button>}</div></div>
              </article>
            } @empty {<div class="empty"><strong>You are caught up.</strong><span>No reviews are due right now. LearnFlow will bring completed lessons back when their review date arrives.</span></div>}
          </div>
        </section>

        @if(data.upcoming.length){<section class="upcoming"><div class="section-head"><div><span class="mini-label">Later</span><h3>Upcoming reviews</h3></div></div><div class="upcoming-list">@for(item of data.upcoming;track item._id){<article><div><strong>{{item.title}}</strong><small>Confidence {{item.confidenceScore??3}}/5 · stage {{item.reviewStage??0}}</small></div><time>{{formatDate(item.nextReviewAt)}}</time></article>}</div></section>}
      } @else {<div class="loading">Building your review queue…</div>}
    </section>
  `,
  styles:[`
    .retention{max-width:1180px;margin:0 auto}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.summary-grid article{padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff}.summary-grid span{display:block;color:#7a869a;font-size:.68rem;font-weight:800;text-transform:uppercase}.summary-grid strong{display:block;color:#10233f;font-size:1.65rem;margin:5px 0}.summary-grid em{font-style:normal;font-size:.8rem;color:#7a869a}.summary-grid small{color:#66758a}.review-shell,.upcoming{padding:22px;border:1px solid #dfe5ed;border-radius:18px;background:#fff;margin-bottom:18px}.section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:14px}.section-head h3{margin:4px 0 0;color:#10233f}.section-head>small{color:#7a869a;max-width:420px;text-align:right}.review-list{display:grid;gap:12px}.review-card{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;padding:18px;border:1px solid #e2e8f0;border-radius:15px;background:#fbfcfe}.review-copy h3{margin:7px 0;color:#10233f}.review-copy p{color:#66758a;margin:0 0 10px}.confidence{display:inline-flex;padding:5px 8px;border-radius:999px;background:#eef4ff;color:#2f6fed;font-size:.65rem;font-weight:850}.confidence[data-score="1"],.confidence[data-score="2"]{background:#fff1f1;color:#b13b47}.meta{display:flex;gap:12px;flex-wrap:wrap;color:#7a869a;font-size:.68rem}.review-copy a{display:inline-flex;margin-top:10px;color:#2f6fed;text-decoration:none;font-weight:800;font-size:.75rem}.rating{display:flex;flex-direction:column;justify-content:center;padding:13px;border-radius:12px;background:#fff;border:1px solid #e5e9ef}.rating>span{color:#526178;font-size:.72rem;font-weight:800;margin-bottom:8px}.rating>div{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.rating button{border:1px solid #dbe3ed;border-radius:9px;background:#fff;padding:7px 3px;cursor:pointer;color:#526178}.rating button:hover{border-color:#2f6fed;background:#edf4ff}.rating button strong,.rating button small{display:block}.rating button small{font-size:.52rem}.empty,.loading{padding:30px;border:1px dashed #cdd7e4;border-radius:14px;display:flex;flex-direction:column;gap:5px;color:#66758a}.empty strong{color:#10233f}.upcoming-list{display:grid}.upcoming-list article{display:flex;justify-content:space-between;gap:16px;padding:11px 0;border-top:1px solid #edf1f5}.upcoming-list div{display:flex;flex-direction:column}.upcoming-list strong{color:#10233f}.upcoming-list small,.upcoming-list time{color:#7a869a;font-size:.7rem}@media(max-width:900px){.summary-grid{grid-template-columns:1fr 1fr}.review-card{grid-template-columns:1fr}.section-head{align-items:flex-start;flex-direction:column}.section-head>small{text-align:left}}@media(max-width:560px){.summary-grid{grid-template-columns:1fr}.rating>div{grid-template-columns:repeat(3,1fr)}}
  `]
})
export class RetentionComponent implements OnInit{
  private readonly api=inject(ApiService);readonly queue=signal<ReviewQueue|null>(null);readonly savingId=signal('');readonly ratings=[1,2,3,4,5];
  ngOnInit():void{this.load();}
  load():void{this.api.get<ReviewQueue>('/api/v1/retention/queue').subscribe(value=>this.queue.set(value));}
  review(item:ReviewLesson,confidenceScore:number):void{this.savingId.set(item._id);this.api.post<{confidenceScore:number},ReviewLesson>(`/api/v1/retention/lessons/${item._id}/review`,{confidenceScore}).subscribe({next:()=>{this.savingId.set('');this.load();},error:()=>this.savingId.set('')});}
  label(score:number):string{return ['','Forgot','Hard','Okay','Good','Easy'][score];}
  formatDate(value?:string):string{return value?new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short',year:'numeric'}).format(new Date(value)):'—';}
}
