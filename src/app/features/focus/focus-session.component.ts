import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { Lesson } from '../../models/learning.models';

interface StudySession {
  _id:string;
  lessonId:string;
  status:'ACTIVE'|'PAUSED'|'COMPLETED'|'ABANDONED';
  startedAt:string;
  endedAt?:string;
  elapsedSeconds:number;
  pauseCount:number;
  reflection?:string;
}

@Component({
  standalone:true,
  imports:[FormsModule,RouterLink,MatButtonModule,MatFormFieldModule,MatInputModule],
  template:`
    <section class="focus page-enter">
      <div class="focus-head">
        <a routerLink="/today">← Back to Today</a>
        <span class="session-state" [attr.data-state]="session()?.status??'READY'">{{ stateLabel() }}</span>
      </div>

      @if(lesson();as item){
        <section class="focus-shell">
          <div class="lesson-pane">
            <span class="eyebrow">Focus session</span>
            <h1>{{item.title}}</h1>
            <p class="description">{{item.description || 'Stay with one learning objective. LearnFlow will track the time you actually invest.'}}</p>
            <div class="lesson-meta"><span>Planned {{item.durationMinutes}} min</span><span>{{item.status.replaceAll('_',' ')}}</span></div>
            @if(item.resourceUrl){<a class="resource" [href]="item.resourceUrl" target="_blank" rel="noopener">Open lesson resource ↗</a>}

            <mat-form-field appearance="outline" class="notes-field">
              <mat-label>Working notes</mat-label>
              <textarea matInput rows="7" [(ngModel)]="notes" placeholder="Capture key ideas, questions, commands, or examples while you learn."></textarea>
            </mat-form-field>
            <button mat-stroked-button (click)="saveNotes()" [disabled]="savingNotes()">{{savingNotes()?'Saving…':'Save notes'}}</button>
          </div>

          <aside class="timer-pane">
            <span class="mini-label">Actual focus time</span>
            <div class="timer" aria-live="polite">{{ formatElapsed(elapsed()) }}</div>
            <div class="progress-track"><span [style.width.%]="progressPercent(item.durationMinutes)"></span></div>
            <small>{{ focusCopy(item.durationMinutes) }}</small>

            <div class="timer-actions">
              @if(!session()){
                <button mat-flat-button class="primary-cta" (click)="start()">Start focus session</button>
              } @else if(session()?.status==='ACTIVE') {
                <button mat-flat-button class="primary-cta" (click)="pause()">Pause</button>
              } @else if(session()?.status==='PAUSED') {
                <button mat-flat-button class="primary-cta" (click)="resume()">Resume</button>
              }
            </div>

            @if(session()){
              <div class="session-facts"><div><span>Started</span><strong>{{formatStarted(session()!.startedAt)}}</strong></div><div><span>Pauses</span><strong>{{session()!.pauseCount}}</strong></div></div>

              <mat-form-field appearance="outline" class="reflection-field">
                <mat-label>Session reflection</mat-label>
                <textarea matInput rows="4" [(ngModel)]="reflection" placeholder="What did you understand? What should you revisit?"></textarea>
              </mat-form-field>
              <button mat-flat-button class="complete" (click)="complete()" [disabled]="finishing()">{{finishing()?'Completing…':'Complete lesson'}}</button>
              <button mat-button class="abandon" (click)="abandon()" [disabled]="finishing()">End session without completing</button>
            }
          </aside>
        </section>
      } @else if(error()) {
        <div class="error-card"><strong>Could not open focus session</strong><span>{{error()}}</span><a routerLink="/today">Return to Today</a></div>
      } @else {
        <div class="loading-card">Preparing your focus session…</div>
      }
    </section>
  `,
  styles:[`
    .focus{max-width:1180px;margin:0 auto}.focus-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.focus-head>a{color:#526178;text-decoration:none;font-weight:800}.session-state{padding:7px 10px;border-radius:999px;background:#eef2f7;color:#526178;font-size:.68rem;font-weight:850;letter-spacing:.06em}.session-state[data-state="ACTIVE"]{background:#e7f6ee;color:#137253}.session-state[data-state="PAUSED"]{background:#fff4d8;color:#8b6300}.focus-shell{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:18px}.lesson-pane,.timer-pane{border:1px solid #dfe5ed;border-radius:22px;background:#fff;box-shadow:0 16px 40px rgba(16,35,63,.055)}.lesson-pane{padding:30px}.lesson-pane h1{margin:10px 0;color:#10233f;font-size:2.35rem}.description{color:#66758a;line-height:1.7;max-width:760px}.lesson-meta{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.lesson-meta span{padding:6px 9px;border-radius:999px;background:#f1f5f9;color:#526178;font-size:.7rem;font-weight:800}.resource{display:inline-flex;margin-bottom:20px;color:#2f6fed;font-weight:800;text-decoration:none}.notes-field{display:block;width:100%;margin-top:12px}.timer-pane{padding:28px;display:flex;flex-direction:column;align-items:stretch;position:sticky;top:92px;height:max-content}.timer{text-align:center;font-size:4rem;letter-spacing:-.06em;font-variant-numeric:tabular-nums;color:#10233f;font-weight:900;margin:18px 0}.progress-track{height:8px;background:#e8eef5;border-radius:999px;overflow:hidden}.progress-track span{display:block;height:100%;background:linear-gradient(90deg,#2f6fed,#20a4c7);border-radius:inherit;transition:width .4s}.timer-pane>small{text-align:center;color:#7a869a;margin:10px 0 20px}.timer-actions{display:grid;gap:8px}.session-facts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:20px 0}.session-facts div{padding:12px;border-radius:12px;background:#f7f9fc}.session-facts span{display:block;color:#7a869a;font-size:.65rem;text-transform:uppercase;font-weight:800}.session-facts strong{display:block;color:#10233f;margin-top:4px}.reflection-field{width:100%}.complete{background:#16805c!important;color:#fff!important;width:100%}.abandon{margin-top:5px;color:#7a869a}.error-card,.loading-card{padding:28px;border:1px dashed #ccd7e5;border-radius:18px;background:#fff;display:flex;flex-direction:column;gap:8px}.error-card a{color:#2f6fed;font-weight:800}@media(max-width:860px){.focus-shell{grid-template-columns:1fr}.timer-pane{position:static;order:-1}.timer{font-size:3.2rem}}@media(max-width:520px){.lesson-pane,.timer-pane{padding:20px}.lesson-pane h1{font-size:1.8rem}.timer{font-size:2.8rem}}
  `]
})
export class FocusSessionComponent implements OnInit,OnDestroy{
  private readonly api=inject(ApiService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);private ticker?:number;
  readonly lesson=signal<Lesson|null>(null);readonly session=signal<StudySession|null>(null);readonly elapsed=signal(0);readonly error=signal('');readonly savingNotes=signal(false);readonly finishing=signal(false);
  notes='';reflection='';private lessonId='';
  ngOnInit():void{this.lessonId=this.route.snapshot.paramMap.get('lessonId')??'';if(!this.lessonId){this.error.set('Lesson id is missing.');return;}this.api.get<Lesson>(`/api/v1/lessons/${this.lessonId}`).subscribe({next:item=>{this.lesson.set(item);this.notes=item.notes??'';this.loadActive();},error:e=>this.error.set(e.error?.message??'Lesson could not be loaded.')});this.ticker=window.setInterval(()=>{if(this.session()?.status==='ACTIVE')this.elapsed.update(v=>v+1);},1000);}
  ngOnDestroy():void{if(this.ticker)window.clearInterval(this.ticker);}
  private loadActive():void{this.api.get<StudySession|null>(`/api/v1/study-sessions/lesson/${this.lessonId}/active`).subscribe(active=>{this.session.set(active);this.elapsed.set(active?.elapsedSeconds??0);this.reflection=active?.reflection??'';});}
  start():void{this.api.post<object,StudySession>(`/api/v1/study-sessions/lesson/${this.lessonId}/start`,{}).subscribe({next:value=>{this.session.set(value);this.elapsed.set(value.elapsedSeconds??0);this.lesson.update(item=>item?{...item,status:'IN_PROGRESS'}:item);},error:e=>this.error.set(e.error?.message??'Could not start focus session.')});}
  pause():void{const id=this.session()?._id;if(!id)return;this.api.post<object,StudySession>(`/api/v1/study-sessions/${id}/pause`,{}).subscribe(value=>{this.session.set(value);this.elapsed.set(value.elapsedSeconds);});}
  resume():void{const id=this.session()?._id;if(!id)return;this.api.post<object,StudySession>(`/api/v1/study-sessions/${id}/resume`,{}).subscribe(value=>{this.session.set(value);this.elapsed.set(value.elapsedSeconds);});}
  saveNotes():void{this.savingNotes.set(true);this.api.patch<{notes:string},Lesson>(`/api/v1/lessons/${this.lessonId}`,{notes:this.notes}).subscribe({next:item=>{this.lesson.set(item);this.savingNotes.set(false);},error:()=>this.savingNotes.set(false)});}
  complete():void{const id=this.session()?._id;if(!id)return;this.finishing.set(true);this.api.patch<{notes:string},Lesson>(`/api/v1/lessons/${this.lessonId}`,{notes:this.notes}).subscribe({next:()=>this.finishSession(id),error:()=>this.finishSession(id)});}
  private finishSession(id:string):void{this.api.post<{reflection:string},StudySession>(`/api/v1/study-sessions/${id}/complete`,{reflection:this.reflection}).subscribe({next:()=>void this.router.navigate(['/study-history'],{queryParams:{completed:1}}),error:e=>{this.finishing.set(false);this.error.set(e.error?.message??'Could not complete the session.');}});}
  abandon():void{const id=this.session()?._id;if(!id)return;this.finishing.set(true);this.api.post<object,StudySession>(`/api/v1/study-sessions/${id}/abandon`,{}).subscribe({next:()=>void this.router.navigateByUrl('/today'),error:()=>this.finishing.set(false)});}
  stateLabel():string{return this.session()?.status==='ACTIVE'?'FOCUSING':this.session()?.status==='PAUSED'?'PAUSED':'READY';}
  formatElapsed(seconds:number):string{const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  progressPercent(minutes:number):number{return Math.min(100,Math.round(this.elapsed()/Math.max(1,minutes*60)*100));}
  focusCopy(minutes:number):string{const left=Math.max(0,minutes*60-this.elapsed());return left?`${Math.ceil(left/60)} planned minutes remaining`:'Planned focus target reached — finish when the learning objective is clear.';}
  formatStarted(value:string):string{return new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
}
