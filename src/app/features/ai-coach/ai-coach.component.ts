import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { MarkdownContentComponent } from '../../shared/markdown-content.component';

type CoachResponse = { answer: string; provider: string };
type ProviderResponse = { provider: string; configured: boolean };
type ChatItem = { role: 'user' | 'coach'; text: string };

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MarkdownContentComponent],
  styles: [`
    .coach-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:24px}.coach-card{border:1px solid #dcdfe4;border-radius:10px;background:#fff;min-height:560px;display:flex;flex-direction:column}.coach-stream{padding:22px;display:flex;flex-direction:column;gap:14px;flex:1;max-height:58vh;overflow:auto}.coach-message{max-width:82%;padding:12px 14px;border-radius:10px}.coach-message.user{align-self:flex-end;background:#e9f2ff;color:#172b4d;white-space:pre-wrap}.coach-message.coach{align-self:flex-start;background:#f7f8f9;color:#172b4d;border:1px solid #e4e7ec;min-width:min(680px,82%)}.coach-composer{border-top:1px solid #dcdfe4;padding:16px}.coach-composer mat-form-field{width:100%}.coach-actions{display:flex;justify-content:space-between;align-items:center;gap:12px}.coach-side{border:1px solid #dcdfe4;border-radius:10px;padding:18px;background:#f7f8f9;height:max-content}.provider-chip{display:inline-flex;padding:5px 8px;border-radius:999px;background:#e9f2ff;color:#0c66e4;font-size:.72rem;font-weight:800}.starter-list{display:grid;gap:8px;margin-top:14px}.starter-list button{text-align:left;justify-content:flex-start}.empty-coach{margin:auto;text-align:center;max-width:440px;color:#626f86}.empty-coach strong{display:block;color:#172b4d;font-size:1.05rem;margin-bottom:6px}@media(max-width:900px){.coach-layout{grid-template-columns:1fr}.coach-side{order:-1}.coach-message{max-width:94%}.coach-message.coach{min-width:0}}
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
                } @else {
                  {{ item.text }}
                }
              </div>
            } @empty {
              <div class="empty-coach"><strong>What are you working through?</strong><span>The coach can explain a concept, break down a difficult lesson, or suggest what to learn next.</span></div>
            }
          </div>
          <div class="coach-composer">
            <mat-form-field appearance="outline"><mat-label>Ask LearnFlow</mat-label><textarea matInput rows="4" [(ngModel)]="message" (keydown.control.enter)="send()" placeholder="Example: I understand React props but state is still confusing. Explain the difference with a practical example."></textarea></mat-form-field>
            <div class="coach-actions"><small class="muted">Ctrl + Enter to send</small><button mat-flat-button class="primary-cta" (click)="send()" [disabled]="busy() || !message.trim()">{{ busy() ? 'Thinking…' : 'Ask coach' }}</button></div>
          </div>
        </div>

        <aside class="coach-side"><span class="mini-label">Starter prompts</span><div class="starter-list"><button mat-stroked-button (click)="usePrompt('Explain this topic to me like I am learning it for the first time, then give me a small exercise.')">Explain a concept</button><button mat-stroked-button (click)="usePrompt('I am stuck on my current lesson. Help me identify the likely blocker and give me the next three steps.')">Unblock a lesson</button><button mat-stroked-button (click)="usePrompt('Help me decide what I should learn next and why, based on my current goal.')">What should I learn next?</button><button mat-stroked-button (click)="usePrompt('Give me a short revision checklist I can complete in 30 minutes.')">Create a revision checklist</button></div><p class="muted" style="margin-top:18px">The coach gives advice only. It does not change lesson status, schedules or learning paths without an explicit product action.</p></aside>
      </div>
    </section>
  `
})
export class AiCoachComponent {
  private readonly api = inject(ApiService);
  readonly messages = signal<ChatItem[]>([]);
  readonly busy = signal(false);
  readonly provider = signal('');
  readonly configured = signal(false);
  message = '';

  constructor(){this.api.get<ProviderResponse>('/api/v1/ai/provider').subscribe({next:r=>{this.provider.set(r.provider);this.configured.set(r.configured);}});}
  usePrompt(value:string){this.message=value;}
  send(){const text=this.message.trim();if(!text||this.busy())return;this.messages.update(items=>[...items,{role:'user',text}]);this.message='';this.busy.set(true);this.api.post<{message:string},CoachResponse>('/api/v1/ai/coach',{message:text}).subscribe({next:r=>{this.messages.update(items=>[...items,{role:'coach',text:r.answer}]);this.provider.set(r.provider);this.busy.set(false);},error:e=>{this.messages.update(items=>[...items,{role:'coach',text:e.error?.message??'The AI coach is unavailable right now.'}]);this.busy.set(false);}});}
}
