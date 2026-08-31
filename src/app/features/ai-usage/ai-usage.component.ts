import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface UsageBucket { used:number; limit:number; remaining:number; }
interface AiUsageStatus {
  resetsAt:{ daily:string; monthly:string };
  plan:{ daily:UsageBucket; monthly:UsageBucket };
  coach:{ daily:UsageBucket; monthly:UsageBucket };
}

@Component({
  standalone:true,
  imports:[MatButtonModule],
  template:`
    <section class="page-enter usage-page">
      <div class="page-head">
        <div><span class="eyebrow">AI & limits</span><h1>AI usage</h1><p class="muted">See how much AI capacity you have used and when your allowances reset.</p></div>
        <button mat-stroked-button (click)="load()">Refresh usage</button>
      </div>
      @if(data();as d){
        <div class="usage-grid">
          <article class="usage-card">
            <div class="usage-card-head"><span class="usage-icon">✦</span><div><span class="mini-label">Planner</span><h3>AI learning plans</h3></div></div>
            <div class="quota-block"><div class="quota-label"><span>Today</span><strong>{{d.plan.daily.used}} / {{d.plan.daily.limit}}</strong></div><div class="quota-track"><span [style.width.%]="percent(d.plan.daily)"></span></div><small>{{d.plan.daily.remaining}} requests remaining · resets {{resetLabel(d.resetsAt.daily)}}</small></div>
            <div class="quota-block"><div class="quota-label"><span>This month</span><strong>{{d.plan.monthly.used}} / {{d.plan.monthly.limit}}</strong></div><div class="quota-track"><span [style.width.%]="percent(d.plan.monthly)"></span></div><small>{{d.plan.monthly.remaining}} requests remaining · resets {{resetLabel(d.resetsAt.monthly)}}</small></div>
          </article>
          <article class="usage-card">
            <div class="usage-card-head"><span class="usage-icon coach">✺</span><div><span class="mini-label">Coach</span><h3>AI coach requests</h3></div></div>
            <div class="quota-block"><div class="quota-label"><span>Today</span><strong>{{d.coach.daily.used}} / {{d.coach.daily.limit}}</strong></div><div class="quota-track"><span [style.width.%]="percent(d.coach.daily)"></span></div><small>{{d.coach.daily.remaining}} requests remaining · resets {{resetLabel(d.resetsAt.daily)}}</small></div>
            <div class="quota-block"><div class="quota-label"><span>This month</span><strong>{{d.coach.monthly.used}} / {{d.coach.monthly.limit}}</strong></div><div class="quota-track"><span [style.width.%]="percent(d.coach.monthly)"></span></div><small>{{d.coach.monthly.remaining}} requests remaining · resets {{resetLabel(d.resetsAt.monthly)}}</small></div>
          </article>
        </div>
        <section class="usage-note"><strong>How limits work</strong><p>Each new planner generation, manual retry, or coach request uses one allowance. Automatic BullMQ retries do not consume extra user quota. Limits reset automatically.</p></section>
      }@else if(error()){<div class="usage-error"><strong>Unable to load AI usage</strong><p>{{error()}}</p></div>}@else{<div class="usage-loading"><span></span><span></span></div>}
    </section>
  `,
  styles:[`
    .usage-page{max-width:1100px;margin:0 auto}.usage-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.usage-card{padding:24px;border:1px solid #e0e5ec;border-radius:20px;background:linear-gradient(180deg,#fff,#fbfcff);box-shadow:0 10px 30px rgba(16,24,40,.05)}.usage-card-head{display:flex;align-items:center;gap:13px;margin-bottom:24px}.usage-card-head h3{margin:3px 0 0;color:#10233f}.usage-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#eaf1ff;color:#2f6fed;font-weight:900}.usage-icon.coach{background:#f1ecff;color:#6554c0}.quota-block{padding:16px 0;border-top:1px solid #edf1f5}.quota-label{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:8px;color:#66758a;font-size:.78rem}.quota-label strong{color:#10233f}.quota-track{height:10px;border-radius:999px;background:#edf1f5;overflow:hidden}.quota-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2f6fed,#20a4c7)}.quota-block small{display:block;margin-top:8px;color:#8a97a8}.usage-note{margin-top:18px;padding:18px 20px;border:1px solid #dbe6f5;border-radius:16px;background:#f7faff;color:#44546f}.usage-note strong{color:#10233f}.usage-note p{margin:5px 0 0;line-height:1.6}.usage-error{padding:22px;border:1px solid #f1c5c9;border-radius:16px;background:#fff7f7;color:#8f2e37}.usage-loading{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.usage-loading span{height:270px;border-radius:20px;background:#f1f4f8}@media(max-width:760px){.usage-grid,.usage-loading{grid-template-columns:1fr}}
  `]
})
export class AiUsageComponent implements OnInit{
  private readonly api=inject(ApiService);readonly data=signal<AiUsageStatus|null>(null);readonly error=signal('');
  ngOnInit(){this.load();}
  load(){this.error.set('');this.api.get<AiUsageStatus>('/api/v1/ai/usage').subscribe({next:v=>this.data.set(v),error:e=>this.error.set(e?.error?.message??'AI usage is unavailable.')});}
  percent(bucket:UsageBucket){return bucket.limit?Math.min(100,Math.round(bucket.used/bucket.limit*100)):0;}
  resetLabel(value:string){return new Intl.DateTimeFormat(undefined,{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
}
