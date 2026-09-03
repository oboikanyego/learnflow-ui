import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface ServiceHealth { status:string; [key:string]:unknown; }
interface HealthResponse { status:string; checkedAt:string; services:Record<string,ServiceHealth>; }
type HealthFilter = 'ALL' | 'ATTENTION';
type HealthTone = 'healthy' | 'warning' | 'critical' | 'neutral';

@Component({
  standalone:true,
  imports:[MatButtonModule],
  template:`
    <section class="health page-enter">
      <div class="page-head health-head">
        <div>
          <span class="eyebrow">Operations</span>
          <h1>System health</h1>
          <p class="muted">Monitor the services LearnFlow depends on without exposing credentials or sensitive infrastructure details.</p>
        </div>
        <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">
          {{ loading() ? 'Refreshing…' : 'Refresh health' }}
        </button>
      </div>

      @if(error()){
        <div class="health-error">
          <span>!</span>
          <div><strong>Health check unavailable</strong><p>{{error()}}</p></div>
          <button mat-stroked-button type="button" (click)="load()">Retry</button>
        </div>
      }

      @if(health();as h){
        <section class="status-hero" [attr.data-tone]="tone(h.status)">
          <div class="hero-status">
            <span class="status-orb"><i></i></span>
            <div>
              <span class="mini-label">Platform status</span>
              <h2>{{friendlyStatus(h.status)}}</h2>
              <p>{{overallMessage(h)}}</p>
            </div>
          </div>
          <div class="hero-time">
            <span>Last checked</span>
            <strong>{{format(h.checkedAt)}}</strong>
            <small>{{relative(h.checkedAt)}}</small>
          </div>
        </section>

        <section class="health-kpis">
          <article>
            <span class="kpi-icon healthy">✓</span>
            <div><strong>{{healthyCount(h)}}</strong><span>Healthy services</span></div>
          </article>
          <article>
            <span class="kpi-icon warning">!</span>
            <div><strong>{{attentionCount(h)}}</strong><span>Needs attention</span></div>
          </article>
          <article>
            <span class="kpi-icon neutral">◎</span>
            <div><strong>{{serviceCount(h)}}</strong><span>Total services</span></div>
          </article>
        </section>

        <section class="services-shell">
          <div class="services-head">
            <div>
              <span class="mini-label">Service checks</span>
              <h3>Infrastructure dependencies</h3>
              <p>Review connectivity and configuration signals for each platform dependency.</p>
            </div>
            <div class="filter-tabs" role="tablist" aria-label="System health filters">
              <button type="button" [class.active]="filter()==='ALL'" (click)="setFilter('ALL')">All <span>{{serviceCount(h)}}</span></button>
              <button type="button" [class.active]="filter()==='ATTENTION'" (click)="setFilter('ATTENTION')">Needs attention <span>{{attentionCount(h)}}</span></button>
            </div>
          </div>

          <div class="service-grid">
            @for(item of pagedServices(h);track item[0]){
              <article class="service-card" [attr.data-tone]="tone(item[1].status)">
                <header>
                  <div class="service-name">
                    <span class="service-dot"></span>
                    <div><strong>{{friendlyLabel(item[0])}}</strong><small>{{serviceDescription(item[0])}}</small></div>
                  </div>
                  <span class="status-pill">{{friendlyStatus(item[1].status)}}</span>
                </header>

                @if(detailEntries(item[1]).length){
                  <div class="detail-list">
                    @for(detail of detailEntries(item[1]);track detail[0]){
                      <div class="detail-row">
                        <span>{{friendlyLabel(detail[0])}}</span>
                        <strong [title]="displayValue(detail[1])">{{displayValue(detail[1])}}</strong>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="no-details">No additional diagnostic information reported.</div>
                }
              </article>
            } @empty {
              <div class="empty-state">
                <span>✓</span>
                <strong>No services need attention</strong>
                <p>All reported dependencies are currently healthy.</p>
                <button mat-stroked-button type="button" (click)="setFilter('ALL')">View all services</button>
              </div>
            }
          </div>

          @if(filteredServices(h).length > pageSize){
            <div class="pagination">
              <span>{{rangeLabel(h)}}</span>
              <div class="page-controls">
                <button mat-stroked-button type="button" (click)="previousPage()" [disabled]="page()===1">Previous</button>
                <strong>Page {{page()}} of {{pageCount(h)}}</strong>
                <button mat-stroked-button type="button" (click)="nextPage(h)" [disabled]="page()===pageCount(h)">Next</button>
              </div>
            </div>
          }
        </section>
      } @else if(!error()) {
        <div class="health-loading">
          <span></span><span></span><span></span>
        </div>
      }
    </section>
  `,
  styles:[`
    .health{max-width:1180px;margin:0 auto}.health-head{align-items:flex-end}.status-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px;margin-bottom:14px;border:1px solid #cfe8db;border-radius:20px;background:linear-gradient(135deg,#f3fbf6,#fff);box-shadow:0 8px 28px rgba(16,24,40,.04)}.status-hero[data-tone="warning"]{border-color:#f1d7a7;background:linear-gradient(135deg,#fff9ed,#fff)}.status-hero[data-tone="critical"]{border-color:#f1c4c8;background:linear-gradient(135deg,#fff5f5,#fff)}.status-hero[data-tone="neutral"]{border-color:#dce3ec;background:linear-gradient(135deg,#f7f9fc,#fff)}.hero-status{display:flex;align-items:center;gap:16px;min-width:0}.status-orb{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#dff4e8}.status-orb i{width:13px;height:13px;border-radius:50%;background:#1f8f5f;box-shadow:0 0 0 6px rgba(31,143,95,.12)}.status-hero[data-tone="warning"] .status-orb{background:#fff0cf}.status-hero[data-tone="warning"] .status-orb i{background:#c47700;box-shadow:0 0 0 6px rgba(196,119,0,.12)}.status-hero[data-tone="critical"] .status-orb{background:#ffe4e6}.status-hero[data-tone="critical"] .status-orb i{background:#c73845;box-shadow:0 0 0 6px rgba(199,56,69,.12)}.hero-status h2{margin:3px 0;color:#10233f;font-size:1.55rem}.hero-status p{margin:0;color:#66758a;font-size:.78rem}.hero-time{text-align:right;display:flex;flex-direction:column;gap:2px}.hero-time span{font-size:.64rem;text-transform:uppercase;font-weight:850;color:#8a97a8}.hero-time strong{color:#344054;font-size:.8rem}.hero-time small{color:#8a97a8}.health-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.health-kpis article{display:flex;align-items:center;gap:12px;padding:16px 18px;border:1px solid #e1e6ed;border-radius:16px;background:#fff}.health-kpis article>div{display:flex;flex-direction:column}.health-kpis strong{font-size:1.35rem;color:#10233f}.health-kpis article>div span{font-size:.7rem;color:#7a869a}.kpi-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-weight:900}.kpi-icon.healthy{background:#e8f7ef;color:#207a54}.kpi-icon.warning{background:#fff3db;color:#a86400}.kpi-icon.neutral{background:#edf3fb;color:#42658f}.services-shell{border:1px solid #dfe5ed;border-radius:20px;background:#fff;padding:22px}.services-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px}.services-head h3{margin:4px 0;color:#10233f}.services-head p{margin:0;color:#7a869a;font-size:.76rem}.filter-tabs{display:flex;gap:4px;padding:4px;border-radius:10px;background:#f2f4f7;flex-wrap:wrap}.filter-tabs button{border:0;background:transparent;border-radius:7px;padding:7px 10px;color:#667085;font-size:.7rem;font-weight:800;cursor:pointer}.filter-tabs button.active{background:#fff;color:#175cd3;box-shadow:0 1px 3px rgba(16,24,40,.1)}.filter-tabs button span{margin-left:4px;color:#98a2b3}.service-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.service-card{min-width:0;border:1px solid #dfe5ed;border-radius:15px;background:#fbfcfe;padding:16px}.service-card[data-tone="warning"]{border-color:#efd8aa;background:#fffdfa}.service-card[data-tone="critical"]{border-color:#efc8cc;background:#fffafa}.service-card header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:13px;border-bottom:1px solid #e8edf2}.service-name{display:flex;align-items:flex-start;gap:9px;min-width:0}.service-name>div{display:flex;flex-direction:column;min-width:0}.service-name strong{color:#10233f;overflow-wrap:anywhere}.service-name small{color:#8a97a8;font-size:.67rem;margin-top:2px}.service-dot{width:9px;height:9px;border-radius:50%;margin-top:4px;background:#22a06b;box-shadow:0 0 0 4px rgba(34,160,107,.1);flex:0 0 auto}.service-card[data-tone="warning"] .service-dot{background:#d28b0b;box-shadow:0 0 0 4px rgba(210,139,11,.1)}.service-card[data-tone="critical"] .service-dot{background:#c9372c;box-shadow:0 0 0 4px rgba(201,55,44,.1)}.service-card[data-tone="neutral"] .service-dot{background:#7a869a;box-shadow:0 0 0 4px rgba(122,134,154,.1)}.status-pill{white-space:nowrap;padding:5px 8px;border-radius:999px;background:#e7f6ee;color:#137253;font-size:.62rem;font-weight:850}.service-card[data-tone="warning"] .status-pill{background:#fff1d6;color:#925a00}.service-card[data-tone="critical"] .status-pill{background:#fff0f1;color:#a8323e}.service-card[data-tone="neutral"] .status-pill{background:#eef2f6;color:#59687d}.detail-list{display:grid;margin-top:6px}.detail-row{display:grid;grid-template-columns:minmax(120px,.8fr) minmax(0,1.2fr);gap:12px;align-items:center;padding:9px 0;border-top:1px solid #edf1f5}.detail-row:first-child{border-top:0}.detail-row span{color:#7a869a;font-size:.68rem}.detail-row strong{min-width:0;color:#44546f;font-size:.72rem;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.no-details{padding:16px 0 2px;color:#8a97a8;font-size:.72rem}.pagination{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;padding-top:16px;border-top:1px solid #edf1f5;color:#7a869a;font-size:.7rem}.page-controls{display:flex;align-items:center;gap:10px}.page-controls strong{color:#526178;font-size:.7rem}.empty-state{grid-column:1/-1;padding:36px;text-align:center;border:1px dashed #cfd8e3;border-radius:15px;color:#66758a}.empty-state>span{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;margin:0 auto 10px;background:#e8f7ef;color:#207a54;font-weight:900}.empty-state strong{display:block;color:#10233f}.empty-state p{margin:4px 0 14px}.health-error{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:12px;align-items:center;padding:16px 18px;margin-bottom:16px;border:1px solid #efc8cc;border-radius:14px;background:#fff7f7;color:#8f2e37}.health-error>span{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#ffe9eb;font-weight:900}.health-error p{margin:3px 0 0}.health-loading{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.health-loading span{height:150px;border-radius:16px;background:#f1f4f8}@media(max-width:780px){.status-hero,.services-head{align-items:flex-start;flex-direction:column}.hero-time{text-align:left}.health-kpis{grid-template-columns:1fr}.service-grid{grid-template-columns:1fr}.pagination{align-items:flex-start;flex-direction:column}.page-controls{width:100%;justify-content:space-between}.health-loading{grid-template-columns:1fr}}@media(max-width:520px){.services-shell{padding:16px}.filter-tabs{width:100%}.filter-tabs button{flex:1}.health-error{grid-template-columns:34px 1fr}.health-error button{grid-column:1/-1}.detail-row{grid-template-columns:1fr;gap:3px}.detail-row strong{text-align:left}.page-controls{display:grid;grid-template-columns:1fr 1fr}.page-controls strong{grid-column:1/-1;grid-row:1;text-align:center}}
  `]
})
export class SystemHealthComponent implements OnInit{
  private readonly api=inject(ApiService);
  readonly health=signal<HealthResponse|null>(null);
  readonly loading=signal(false);
  readonly error=signal('');
  readonly filter=signal<HealthFilter>('ALL');
  readonly page=signal(1);
  readonly pageSize=6;

  ngOnInit():void{this.load();}

  load():void{
    this.loading.set(true);
    this.error.set('');
    this.api.get<HealthResponse>('/api/v1/admin/system-health').subscribe({
      next:value=>{this.health.set(value);this.page.set(1);this.loading.set(false);},
      error:e=>{this.error.set(e?.error?.message??'LearnFlow could not retrieve the latest service health snapshot.');this.loading.set(false);}
    });
  }

  entries(value:HealthResponse['services']):Array<[string,ServiceHealth]>{return Object.entries(value);}
  serviceCount(h:HealthResponse):number{return this.entries(h.services).length;}
  healthyCount(h:HealthResponse):number{return this.entries(h.services).filter(([,service])=>this.tone(service.status)==='healthy').length;}
  attentionCount(h:HealthResponse):number{return this.entries(h.services).filter(([,service])=>['warning','critical'].includes(this.tone(service.status))).length;}
  filteredServices(h:HealthResponse):Array<[string,ServiceHealth]>{const rows=this.entries(h.services);return this.filter()==='ATTENTION'?rows.filter(([,service])=>['warning','critical'].includes(this.tone(service.status))):rows;}
  pagedServices(h:HealthResponse):Array<[string,ServiceHealth]>{const start=(this.page()-1)*this.pageSize;return this.filteredServices(h).slice(start,start+this.pageSize);}
  pageCount(h:HealthResponse):number{return Math.max(1,Math.ceil(this.filteredServices(h).length/this.pageSize));}
  setFilter(filter:HealthFilter):void{this.filter.set(filter);this.page.set(1);}
  previousPage():void{this.page.update(value=>Math.max(1,value-1));}
  nextPage(h:HealthResponse):void{this.page.update(value=>Math.min(this.pageCount(h),value+1));}
  rangeLabel(h:HealthResponse):string{const total=this.filteredServices(h).length;if(!total)return '0 services';const start=(this.page()-1)*this.pageSize+1;const end=Math.min(total,this.page()*this.pageSize);return `Showing ${start}–${end} of ${total} services`;}

  detailEntries(value:ServiceHealth):Array<[string,unknown]>{return Object.entries(value).filter(([key])=>key!=='status');}
  displayValue(value:unknown):string{if(value===null||value===undefined||value==='')return 'Not reported';if(typeof value==='boolean')return value?'Yes':'No';if(Array.isArray(value))return value.map(item=>String(item)).join(', ')||'None';if(typeof value==='object'){try{return JSON.stringify(value);}catch{return 'Available';}}return String(value);}
  friendlyLabel(value:string):string{return value.replace(/([a-z0-9])([A-Z])/g,'$1 $2').replaceAll('_',' ').replaceAll('-',' ').trim().toLowerCase().replace(/\b\w/g,char=>char.toUpperCase()).replace(/\b(Api|Ai|Db|Url|Id|Cpu|Tls|Smtp|Http|Https)\b/g,word=>word.toUpperCase());}
  friendlyStatus(value:string):string{return this.friendlyLabel(value||'Unknown');}
  serviceDescription(name:string):string{const key=name.toLowerCase();if(key.includes('mongo')||key.includes('database')||key==='db')return 'Primary data storage';if(key.includes('redis')||key.includes('queue'))return 'Background jobs and caching';if(key.includes('email')||key.includes('smtp')||key.includes('resend'))return 'Email delivery';if(key.includes('ai')||key.includes('gemini')||key.includes('groq'))return 'AI generation provider';if(key.includes('api'))return 'Application service';return 'Platform dependency';}
  tone(status:string):HealthTone{const normalized=(status||'').trim().toUpperCase();if(['HEALTHY','OK','UP','READY','CONNECTED','CONFIGURED','AVAILABLE','OPERATIONAL','PASSING','ACTIVE'].includes(normalized))return 'healthy';if(['DEGRADED','WARNING','WARN','PARTIAL','DELAYED'].includes(normalized))return 'warning';if(['UNHEALTHY','FAILED','FAIL','DOWN','ERROR','UNAVAILABLE','DISCONNECTED','NOT_CONFIGURED','INACTIVE'].includes(normalized))return 'critical';return 'neutral';}
  overallMessage(h:HealthResponse):string{const attention=this.attentionCount(h);if(this.tone(h.status)==='healthy'&&attention===0)return 'All reported LearnFlow dependencies are operating normally.';if(attention===1)return 'One platform dependency needs attention.';if(attention>1)return `${attention} platform dependencies need attention.`;return 'Review the service checks below for the latest diagnostic state.';}
  format(v:string):string{const d=new Date(v);return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(d);}
  relative(v:string):string{const d=new Date(v);if(Number.isNaN(d.getTime()))return '';const diff=Math.max(0,Date.now()-d.getTime());const minutes=Math.floor(diff/60000);if(minutes<1)return 'Just now';if(minutes<60)return `${minutes}m ago`;const hours=Math.floor(minutes/60);if(hours<24)return `${hours}h ago`;return `${Math.floor(hours/24)}d ago`;}
}
