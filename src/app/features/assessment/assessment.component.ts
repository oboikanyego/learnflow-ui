import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { Lesson } from '../../models/learning.models';

interface AssessmentQuestion { index:number; prompt:string; options:string[] }
interface Assessment { _id:string; lessonId:string; questions:AssessmentQuestion[]; createdAt:string }
interface AssessmentResult { score:number; correctAnswers:number; totalQuestions:number; passed:boolean; masteryBand:'MASTERED'|'DEVELOPING'|'NEEDS_REVIEW'; results:Array<{index:number;correct:boolean;selectedIndex:number;correctIndex:number;explanation:string}> }

@Component({
  standalone:true,
  imports:[FormsModule,RouterLink,MatButtonModule],
  template:`
  <section class="assessment page-enter">
    <div class="page-head"><div><span class="eyebrow">Mastery checkpoint</span><h1>{{lesson()?.title || 'Lesson assessment'}}</h1><p class="muted">Test what you can recall and apply without relying only on confidence.</p></div><a mat-stroked-button routerLink="/mastery">Mastery overview</a></div>
    @if(error()){<div class="error">{{error()}}</div>}
    @if(!assessment()&&!loading()){
      <article class="generate-card"><strong>Generate a short checkpoint</strong><p>LearnFlow will create 3–5 multiple-choice questions from the lesson title, description and your notes.</p><button mat-flat-button class="primary-cta" (click)="generate()">Generate checkpoint</button></article>
    }
    @if(loading()){<div class="loading">Preparing your mastery checkpoint…</div>}
    @if(assessment();as quiz){
      <form class="quiz" (ngSubmit)="submit()">
        @for(q of quiz.questions;track q.index){
          <article class="question"><span>Question {{q.index+1}}</span><h3>{{q.prompt}}</h3><div class="options">@for(option of q.options;track $index){<label [class.selected]="answers[q.index]===$index"><input type="radio" [name]="'q'+q.index" [value]="$index" [(ngModel)]="answers[q.index]"> <strong>{{letter($index)}}</strong><em>{{option}}</em></label>}</div>
          @if(result();as r){@if(r.results[q.index];as row){<div class="feedback" [class.good]="row.correct"><strong>{{row.correct?'Correct':'Review this one'}}</strong><span>{{row.explanation}}</span></div>}}
          </article>
        }
        @if(!result()){<button mat-flat-button class="primary-cta submit" type="submit" [disabled]="submitting()||!allAnswered()">{{submitting()?'Scoring…':'Submit checkpoint'}}</button>}
      </form>
    }
    @if(result();as r){<section class="result" [attr.data-band]="r.masteryBand"><span>{{r.masteryBand.replaceAll('_',' ')}}</span><strong>{{r.score}}%</strong><p>{{r.correctAnswers}} of {{r.totalQuestions}} correct. {{resultCopy(r.score)}}</p><div><button mat-flat-button class="primary-cta" (click)="generate()">Try a fresh checkpoint</button><a mat-stroked-button routerLink="/retention">Review queue</a></div></section>}
  </section>`,
  styles:[`
    .assessment{max-width:940px;margin:0 auto}.generate-card,.question,.result,.loading,.error{border:1px solid #dfe5ed;border-radius:18px;background:#fff;padding:22px;margin-bottom:16px}.generate-card p,.question>span,.feedback span,.result p{color:#66758a}.question>span{font-size:.68rem;font-weight:850;text-transform:uppercase}.question h3{color:#10233f;margin:8px 0 14px}.options{display:grid;gap:8px}.options label{display:flex;gap:10px;align-items:flex-start;border:1px solid #dfe5ed;border-radius:12px;padding:12px;cursor:pointer}.options label.selected{border-color:#2f6fed;background:#eef4ff}.options input{margin-top:3px}.options strong{color:#2f6fed}.options em{font-style:normal;color:#33445d}.submit{width:100%;margin:8px 0 24px}.feedback{display:flex;flex-direction:column;gap:4px;margin-top:12px;padding:12px;border-radius:10px;background:#fff2f2;color:#a23c47}.feedback.good{background:#eaf7ef;color:#216e4e}.result{text-align:center}.result>span{font-size:.7rem;font-weight:900;letter-spacing:.08em;color:#7a869a}.result>strong{display:block;font-size:3.2rem;color:#10233f;margin:8px}.result>div{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.error{background:#fff1f0;color:#a61b1b}.loading{color:#66758a}
  `]
})
export class AssessmentComponent implements OnInit{
  private readonly api=inject(ApiService);private readonly route=inject(ActivatedRoute);readonly lesson=signal<Lesson|null>(null);readonly assessment=signal<Assessment|null>(null);readonly result=signal<AssessmentResult|null>(null);readonly loading=signal(false);readonly submitting=signal(false);readonly error=signal('');answers:number[]=[];private lessonId='';
  ngOnInit():void{this.lessonId=this.route.snapshot.paramMap.get('lessonId')??'';if(!this.lessonId){this.error.set('Lesson id is missing.');return;}this.api.get<Lesson>(`/api/v1/lessons/${this.lessonId}`).subscribe(v=>this.lesson.set(v));this.api.get<Assessment>(`/api/v1/assessments/lessons/${this.lessonId}/latest`).subscribe({next:v=>this.setAssessment(v),error:()=>undefined});}
  generate():void{this.loading.set(true);this.error.set('');this.result.set(null);this.api.post<object,Assessment>(`/api/v1/assessments/lessons/${this.lessonId}/generate`,{}).subscribe({next:v=>{this.setAssessment(v);this.loading.set(false);},error:e=>{this.loading.set(false);this.error.set(e.error?.message??'Could not generate the checkpoint.');}});}
  submit():void{const quiz=this.assessment();if(!quiz||!this.allAnswered())return;this.submitting.set(true);this.api.post<{answers:number[]},AssessmentResult>(`/api/v1/assessments/${quiz._id}/submit`,{answers:this.answers}).subscribe({next:v=>{this.result.set(v);this.submitting.set(false);},error:e=>{this.submitting.set(false);this.error.set(e.error?.message??'Could not score the checkpoint.');}});}
  allAnswered():boolean{return !!this.assessment()&&this.answers.length===this.assessment()!.questions.length&&this.answers.every(value=>value!==undefined&&value!==null);}
  letter(i:number):string{return String.fromCharCode(65+i);}
  resultCopy(score:number):string{return score>=90?'Strong evidence of mastery. Keep the spaced reviews going.':score>=70?'You are developing solid understanding. Review the missed concepts before the next checkpoint.':'This topic needs another review cycle before moving on confidently.';}
  private setAssessment(value:Assessment){this.assessment.set(value);this.answers=Array(value.questions.length).fill(undefined);}
}
