import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { MarkdownContentComponent } from '../../shared/markdown-content.component';

type ReplanChange = { lessonId: string; title: string; previousScheduledAt?: string; proposedScheduledAt: string; durationMinutes: number };
type ProposedReplan = { behindMinutes: number; changes: ReplanChange[] };
type CoachResponse = { answer: string; provider: string; proposedReplan?: ProposedReplan };
type ProviderResponse = { provider: string; configured: boolean };
type ChatItem = { role: 'user' | 'coach'; text: string; responseMs?: number; proposedReplan?: ProposedReplan; replanApplying?: boolean; replanApplied?: boolean; replanError?: string };

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MarkdownContentComponent],
  styles: [`
    .coach-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:24px}.coach-card{border:1px solid #dcdfe4;border-radius:10px;background:#fff;min-height:560px;display:flex;flex-direction:column}.coach-stream{padding:22px;display:flex;flex-direction:column;gap:14px;flex:1;max-height:58vh;overflow:auto}.coach-message{max-width:82%;padding:12px 14px;border-radius:10px}.coach-message.user{align-self:flex-end;background:#e9f2ff;color:#172b4d;white-space:pre-wrap}.coach-message.coach{align-self:flex-start;background:#f7f8f9;color:#172b4d;border:1px solid #e4e7ec;min-width:min(680px,82%)}.coach-response-time{display:block;margin-top:9px;color:#7a869a;font-size:.68rem;font-weight:700}.coach-thinking{align-self:flex-start;display:flex;align-items:center;gap:12px;min-width:190px;padding:13px 15px;border:1px solid #dce4ee;border-radius:12px;background:#f7f8f9;color:#172b4d}.thinking-dots{display:inline-flex;align-items:center;gap:4px}.thinking-dots i{width:7px;height:7px;border-radius:50%;background:#0c66e4;animation:coachDot 1.15s ease-in-out infinite}.thinking-dots i:nth-child(2){animation-delay:.16s}.thinking-dots i:nth-child(3){animation-delay:.32s}.thinking-copy{display:flex;flex-direction:column;gap:2px}.thinking-copy strong{font-size:.78rem}.thinking-copy small{color:#7a869a;font-size:.67rem}.coach-composer{border-top:1px solid #dcdfe4;padding:16px}.coach-composer mat-form-field{width:100%}.coach-actions{display:flex;justify-content:space-between;align-items:center;gap:12px}.coach-side{border:1px solid #dcdfe4;border-radius:10px;padding:18px;background:#f7f8f9;height:max-content}.provider-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#e9f2ff;color:#0c66e4;font-size:.72rem;font-weight:800}.starter-list{display:grid;gap:8px;margin-top:14px}.starter-list button{text-align:left;justify-content:flex-start}.empty-coach{margin:auto;text-align:center;max-width:440px;color:#626f86}.empty-coach strong{display:block;color:#172b4d;font-size:1.05rem;margin-bottom:6px}@keyframes coachDot{0%,60%,100%{opacity:.32;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}@media(max-width:900px){.coach-layout{grid-template-columns:1fr}.coach-side{order:-1}.coach-message{max-width:94%}.coach-message.coach{min-width:0}}@media(prefers-reduced-motion:reduce){.thinking-dots i{animation:none}.thinking-dots i:nth-child(2){opacity:.65}.thinking-dots i:nth-child(3){opacity:.35}}
    .replan-proposal{margin-top:12px;padding:14px;border:1px solid #fedf89;border-radius:10px;background:#fffaeb}.replan-proposal>strong{display:block;color:#93370d;font-size:.82rem;margin-bottom:4px}.replan-proposal>p{margin:0 0 10px;color:#7a5c1e;font-size:.76rem;line-height:1.5}.replan-changes{display:grid;gap:6px;margin-bottom:10px}.replan-changes div{padding:8px 10px;border-radius:8px;background:#fff;border:1px solid #f4e3b5;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.replan-changes strong{color:#172b4d;font-size:.78rem}.replan-changes small{color:#7a5c1e;font-size:.72rem;font-weight:700}.replan-error{margin-bottom:10px;padding:8px 10px;border-radius:8px;background:#fef3f2;color:#b42318;font-size:.74rem}.replan-actions{display:flex;justify-content:flex-end;gap:8px}.replan-confirmed{margin-top:10px;padding:10px 12px;border-radius:9px;background:#ecfdf3;color:#067647;font-size:.78rem;font-weight:700}
  `],
  template: `
    <section class="page-enter">
      <div class="page-head">
        <div><span class="eyebrow">AI assistant</span><h1>Learning coach</h1><p class="muted">Ask for explanations, study guidance, blockers and practical next steps.</p></div>
        @if (provider()) {
          <span class="provider-chip">{{ provider() }}{{ configured() ? '' : ' · not configured' }}</span>
        }
      </div>

      <div class="coach-layout">
        <div class="coach-card">
          <div class="coach-stream">
            @for (item of messages(); track $index) {
              <div class="coach-message" [class.user]="item.role === 'user'" [class.coach]="item.role === 'coach'">
                @if (item.role === 'coach') {
                  <app-markdown-content [markdown]="item.text"></app-markdown-content>
                  @if (item.responseMs !== undefined) { <small class="coach-response-time">Responded in {{ formatResponseTime(item.responseMs) }}</small> }
                  @if (item.proposedReplan) {
                    <div class="replan-proposal">
                      <strong>Suggested reschedule</strong>
                      <p>You're about {{ formatMinutes(item.proposedReplan.behindMinutes) }} behind. Here's where LearnFlow would move your missed lessons — nothing changes until you approve it.</p>
                      <div class="replan-changes">@for (change of item.proposedReplan.changes; track change.lessonId) { <div><strong>{{ change.title }}</strong><small>→ {{ formatDateTime(change.proposedScheduledAt) }}</small></div> }</div>
                      @if (item.replanError) { <div class="replan-error">{{ item.replanError }}</div> }
                      <div class="replan-actions"><button mat-stroked-button type="button" (click)="dismissReplan(item)" [disabled]="item.replanApplying">Not now</button><button mat-flat-button class="primary-cta" type="button" [disabled]="item.replanApplying" (click)="approveReplan(item)">{{ item.replanApplying ? 'Rescheduling…' : 'Approve & reschedule' }}</button></div>
                    </div>
                  } @else if (item.replanApplied) {
                    <div class="replan-confirmed">✓ Rescheduled. Your board and reminders have been updated.</div>
                  }
                } @else {
                  {{ item.text }}
                }
              </div>
            } @empty {
              <div class="empty-coach"><strong>What are you working through?</strong><span>The coach can explain a concept, break down a difficult lesson, or suggest what to learn next.</span></div>
            }
            @if (busy()) {
              <div class="coach-thinking" role="status" aria-live="polite">
                <span class="thinking-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                <span class="thinking-copy"><strong>LearnFlow Coach is thinking</strong><small>Compiling your response · {{ elapsedSeconds() }}s</small></span>
              </div>
            }
          </div>
          <div class="coach-composer">
            <mat-form-field appearance="outline"><mat-label>Ask LearnFlow</mat-label><textarea matInput rows="4" [(ngModel)]="message" (keydown.control.enter)="send()" placeholder="Example: I understand React props but state is still confusing. Explain the difference with a practical example."></textarea></mat-form-field>
            <div class="coach-actions"><small class="muted">Ctrl + Enter to send</small><button mat-flat-button class="primary-cta" (click)="send()" [disabled]="busy() || !message.trim()">{{ busy() ? 'Coach is thinking…' : 'Ask coach' }}</button></div>
          </div>
        </div>

        <aside class="coach-side"><span class="mini-label">Starter prompts</span><div class="starter-list"><button mat-stroked-button (click)="usePrompt('Explain this topic to me like I am learning it for the first time, then give me a small exercise.')">Explain a concept</button><button mat-stroked-button (click)="usePrompt('I am stuck on my current lesson. Help me identify the likely blocker and give me the next three steps.')">Unblock a lesson</button><button mat-stroked-button (click)="usePrompt('Help me decide what I should learn next and why, based on my current goal.')">What should I learn next?</button><button mat-stroked-button (click)="usePrompt('Give me a short revision checklist I can complete in 30 minutes.')">Create a revision checklist</button></div><p class="muted" style="margin-top:18px">The coach gives advice only. If you have missed lessons, it may offer a reschedule suggestion — nothing changes until you review and approve it.</p></aside>
      </div>
    </section>
  `
})
export class AiCoachComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private thinkingTimer?: ReturnType<typeof setInterval>;
  private requestStartedAt = 0;
  readonly messages = signal<ChatItem[]>([]);
  readonly busy = signal(false);
  readonly elapsedSeconds = signal(0);
  readonly provider = signal('');
  readonly configured = signal(false);
  message = '';

  constructor(){this.api.get<ProviderResponse>('/api/v1/ai/provider').subscribe({next:r=>{this.provider.set(r.provider);this.configured.set(r.configured);}});}
  ngOnDestroy():void{this.stopThinkingTimer();}
  usePrompt(value:string){this.message=value;}
  formatResponseTime(ms:number):string{return ms<1000?`${ms} ms`:`${(ms/1000).toFixed(1)}s`;}
  send(){
    const text=this.message.trim();
    if(!text||this.busy())return;
    this.messages.update(items=>[...items,{role:'user',text}]);
    this.message='';
    this.busy.set(true);
    this.startThinkingTimer();
    this.api.post<{message:string},CoachResponse>('/api/v1/ai/coach',{message:text}).subscribe({
      next:r=>{
        const responseMs=this.finishThinking();
        this.messages.update(items=>[...items,{role:'coach',text:r.answer,responseMs,proposedReplan:r.proposedReplan}]);
        this.provider.set(r.provider);
      },
      error:e=>{
        const responseMs=this.finishThinking();
        this.messages.update(items=>[...items,{role:'coach',text:e.error?.message??'The AI coach is unavailable right now.',responseMs}]);
      }
    });
  }

  private startThinkingTimer():void{
    this.stopThinkingTimer();
    this.requestStartedAt=Date.now();
    this.elapsedSeconds.set(0);
    this.thinkingTimer=setInterval(()=>this.elapsedSeconds.set(Math.floor((Date.now()-this.requestStartedAt)/1000)),250);
  }
  private finishThinking():number{
    const elapsed=Math.max(0,Date.now()-this.requestStartedAt);
    this.stopThinkingTimer();
    this.busy.set(false);
    return elapsed;
  }
  private stopThinkingTimer():void{
    if(this.thinkingTimer!==undefined){clearInterval(this.thinkingTimer);this.thinkingTimer=undefined;}
  }

  formatMinutes(minutes:number):string{return minutes>=60?`${(minutes/60).toFixed(1)}h`:`${minutes}m`;}
  formatDateTime(value:string):string{const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat(undefined,{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(date);}
  dismissReplan(item:ChatItem):void{this.messages.update(items=>items.map(i=>i===item?{...i,proposedReplan:undefined}:i));}
  approveReplan(item:ChatItem):void{
    const replan=item.proposedReplan;
    if(!replan||item.replanApplying)return;
    this.messages.update(items=>items.map(i=>i===item?{...i,replanApplying:true,replanError:undefined}:i));
    const changes=replan.changes.map(c=>({lessonId:c.lessonId,proposedScheduledAt:c.proposedScheduledAt}));
    this.api.post<{changes:typeof changes;source:string},{updated:number}>('/api/v1/intelligence/replan/apply',{changes,source:'COACH'}).subscribe({
      next:()=>this.messages.update(items=>items.map(i=>i===item?{...i,replanApplying:false,replanApplied:true,proposedReplan:undefined}:i)),
      error:e=>this.messages.update(items=>items.map(i=>i===item?{...i,replanApplying:false,replanError:e.error?.message??'Could not apply this reschedule.'}:i))
    });
  }
}
