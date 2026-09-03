import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface AiPlanJob {
  _id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  input: { topic: string; weeks: number; days: string[]; time: string; durationMinutes: number; startDate: string; save: boolean; };
  learningPathId?: string; errorMessage?: string; createdAt: string; startedAt?: string; completedAt?: string;
}
interface RetryResponse { jobId: string; status: string; message: string; }
type StatusFilter='ALL'|'QUEUED'|'PROCESSING'|'COMPLETED'|'FAILED';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="page-enter requests-page">
      <div class="page-head"><div><span class="eyebrow">AI operations</span><h1>AI requests</h1><p class="muted">Track learning-plan generations without a wide operations table.</p></div><div class="lesson-actions"><button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">Refresh</button><a mat-flat-button class="primary-cta" routerLink="/ai-planner">New AI plan</a></div></div>
      <div class="summary-grid"><article><strong>{{ count('COMPLETED') }}</strong><span>Completed</span></article><article><strong>{{ count('FAILED') }}</strong><span>Failed</span></article><article><strong>{{ count('PROCESSING') + count('QUEUED') }}</strong><span>In progress</span></article><article><strong>{{ jobs().length }}</strong><span>Total requests</span></article></div>
      @if (notice()) { <div class="notification"><strong>{{ notice() }}</strong></div> } @if (error()) { <div class="notification unread"><strong>{{ error() }}</strong></div> }
      <section class="request-shell">
        <div class="request-toolbar"><div class="filters">@for(option of statusFilters;track option){<button type="button" [class.active]="filter()===option" (click)="setFilter(option)">{{filterLabel(option)}}@if(option!=='ALL'){<span>{{count(option)}}</span>}</button>}</div><small>Showing {{rangeStart()}}–{{rangeEnd()}} of {{filtered().length}}</small></div>
        <div class="request-list">
          @for(job of paged(); track job._id){
            <article class="request-card">
              <div class="request-main"><div class="request-title"><span class="status-chip" [class]="'status-chip ' + statusClass(job.status)">{{statusLabel(job.status)}}</span><div><strong>{{job.input.topic}}</strong><small>{{job.input.weeks}} weeks · {{job.input.durationMinutes}} min sessions · {{job.input.days.join(', ')}} at {{job.input.time}}</small></div></div>@if(job.status==='FAILED'&&job.errorMessage){<p class="failure-copy">{{friendlyError(job.errorMessage)}}</p>}</div>
              <div class="request-meta"><div><span>Requested</span><strong>{{formatDateTime(job.createdAt)}}</strong></div><div><span>Finished</span><strong>{{job.completedAt?formatDateTime(job.completedAt):'—'}}</strong></div></div>
              <div class="row-actions">@if(job.status==='COMPLETED'){<button mat-stroked-button type="button" (click)="view(job)">View result</button>}@else if(job.status==='FAILED'){<button mat-flat-button class="primary-cta compact" type="button" (click)="retry(job)" [disabled]="retryingId()===job._id">{{retryingId()===job._id?'Retrying…':'Retry'}}</button>}@else{<span class="working-label">Working…</span>}</div>
            </article>
          } @empty {<div class="empty-cell">No AI generation requests in this view.</div>}
        </div>
        @if(pageCount()>1){<footer class="pager"><button mat-stroked-button type="button" (click)="setPage(page()-1)" [disabled]="page()===1">Previous</button><span>Page {{page()}} of {{pageCount()}}</span><button mat-stroked-button type="button" (click)="setPage(page()+1)" [disabled]="page()===pageCount()">Next</button></footer>}
      </section>
    </section>
  `,
  styles: [`
    .requests-page{max-width:1180px;margin:0 auto}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 18px}.summary-grid article{padding:18px;border:1px solid #dcdfe4;border-radius:12px;background:#fff;display:flex;flex-direction:column}.summary-grid strong{font-size:1.55rem;color:#172b4d}.summary-grid span{font-size:.72rem;text-transform:uppercase;color:#626f86;font-weight:800}.request-shell{border:1px solid #dcdfe4;border-radius:14px;background:#fff;padding:16px}.request-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.request-toolbar>small{color:#7a869a}.filters{display:flex;flex-wrap:wrap;gap:5px}.filters button{border:0;background:#f2f4f7;padding:8px 10px;border-radius:8px;color:#667085;font-weight:750;cursor:pointer}.filters button.active{background:#e9f2ff;color:#0c66e4}.filters span{margin-left:4px;font-size:.62rem}.request-list{display:grid}.request-card{display:grid;grid-template-columns:minmax(0,1fr) 300px auto;gap:16px;align-items:center;padding:15px 0;border-top:1px solid #eceff3}.request-card:first-child{border-top:0}.request-main{min-width:0}.request-title{display:flex;align-items:flex-start;gap:10px;min-width:0}.request-title>div{display:flex;flex-direction:column;min-width:0}.request-title strong{color:#172b4d;overflow-wrap:anywhere}.request-title small{color:#626f86;margin-top:3px;line-height:1.45}.status-chip{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:.65rem;font-weight:850;white-space:nowrap}.status-completed{background:#dcfff1;color:#216e4e}.status-failed{background:#ffebe6;color:#ae2e24}.status-processing{background:#e9f2ff;color:#0c66e4}.status-queued{background:#f3f0ff;color:#5e4db2}.failure-copy{margin:8px 0 0;color:#ae2e24;font-size:.7rem;line-height:1.4}.request-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px}.request-meta div{display:flex;flex-direction:column}.request-meta span{font-size:.62rem;text-transform:uppercase;color:#98a2b3;font-weight:800}.request-meta strong{font-size:.7rem;color:#475467;margin-top:3px}.row-actions{display:flex;justify-content:flex-end;align-items:center}.working-label{color:#7a869a;font-size:.7rem;font-weight:750}.empty-cell{text-align:center;padding:36px;color:#7a869a}.pager{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding-top:14px;border-top:1px solid #eceff3}.pager span{font-size:.72rem;color:#667085}@media(max-width:900px){.request-card{grid-template-columns:1fr}.request-meta{grid-template-columns:1fr 1fr}.row-actions{justify-content:flex-start}}@media(max-width:820px){.summary-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.request-toolbar{align-items:flex-start;flex-direction:column}.request-title{flex-direction:column}.request-meta{grid-template-columns:1fr}.pager{justify-content:space-between}.page-head{align-items:flex-start;flex-direction:column}}
  `]
})
export class AiRequestsComponent implements OnInit {
  private readonly api=inject(ApiService);private readonly router=inject(Router);readonly jobs=signal<AiPlanJob[]>([]);readonly loading=signal(false);readonly retryingId=signal('');readonly notice=signal('');readonly error=signal('');readonly filter=signal<StatusFilter>('ALL');readonly page=signal(1);readonly pageSize=10;readonly statusFilters:StatusFilter[]=['ALL','QUEUED','PROCESSING','COMPLETED','FAILED'];
  readonly filtered=computed(()=>this.filter()==='ALL'?this.jobs():this.jobs().filter(x=>x.status===this.filter()));readonly paged=computed(()=>{const start=(this.page()-1)*this.pageSize;return this.filtered().slice(start,start+this.pageSize);});
  ngOnInit():void{this.load();}
  load():void{this.loading.set(true);this.error.set('');this.api.get<AiPlanJob[]>('/api/v1/ai/plan-jobs').subscribe({next:jobs=>{this.jobs.set(jobs);this.setPage(1);this.loading.set(false);},error:err=>{this.error.set(err?.error?.message??'Could not load AI requests.');this.loading.set(false);}});}
  retry(job:AiPlanJob):void{if(job.status!=='FAILED')return;this.retryingId.set(job._id);this.notice.set('');this.error.set('');this.api.post<object,RetryResponse>(`/api/v1/ai/plan-jobs/${job._id}/retry`,{}).subscribe({next:r=>{this.retryingId.set('');this.notice.set(r.message);this.load();},error:err=>{this.retryingId.set('');this.error.set(err?.error?.message??'Could not retry this AI request.');}});}
  view(job:AiPlanJob):void{if(job.status==='COMPLETED')void this.router.navigate(['/ai-planner'],{queryParams:{job:job._id}});} count(status:AiPlanJob['status']):number{return this.jobs().filter(job=>job.status===status).length;} setFilter(value:StatusFilter):void{this.filter.set(value);this.page.set(1);} filterLabel(value:StatusFilter):string{return value==='ALL'?'All':this.statusLabel(value);} pageCount():number{return Math.max(1,Math.ceil(this.filtered().length/this.pageSize));} setPage(value:number):void{this.page.set(Math.min(Math.max(1,value),this.pageCount()));} rangeStart():number{return this.filtered().length?(this.page()-1)*this.pageSize+1:0;} rangeEnd():number{return Math.min(this.page()*this.pageSize,this.filtered().length);}
  statusLabel(status:AiPlanJob['status']):string{return({QUEUED:'Queued',PROCESSING:'Processing',COMPLETED:'Completed',FAILED:'Failed'})[status];} statusClass(status:AiPlanJob['status']):string{return`status-${status.toLowerCase()}`;} formatDateTime(value:string):string{const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat(undefined,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);} friendlyError(value:string):string{return value.length>160?`${value.slice(0,157)}…`:value;}
}
