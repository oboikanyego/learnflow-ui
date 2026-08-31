import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface DeliveryFailure{_id:string;eventType:string;channel:string;recipient?:string;attemptCount:number;errorMessage?:string;lastAttemptAt?:string;nextAttemptAt?:string;updatedAt:string}
interface AdminOverview {
  totalUsers:number;activeNow:number;active24h:number;totalPaths:number;totalLessons:number;
  registrationTrend:Array<{date:string;count:number}>;
  recentUsers:Array<{_id:string;name:string;email:string;role:string;createdAt:string;lastSeenAt?:string}>;
  notificationHealth:{sent:number;failed:number;pending:number;skipped:number;retryBacklog:number;deliveryRate:number;recentFailures:DeliveryFailure[];windowHours:number};
}

@Component({
  standalone:true,
  imports:[MatButtonModule],
  template:`
    <section class="page-enter admin-page">
      <div class="page-head">
        <div><span class="eyebrow">Administration</span><h1>Product overview</h1><p class="muted">Understand adoption, activity and whether critical LearnFlow notifications are being delivered reliably.</p></div>
        <button mat-stroked-button (click)="load()">Refresh data</button>
      </div>
      @if(data();as d){
        <div class="admin-kpis">
          <article><span>Registered users</span><strong>{{d.totalUsers}}</strong><small>All accounts created</small></article>
          <article class="live"><span>Active now</span><strong>{{d.activeNow}}</strong><small>Seen in the last 5 minutes</small></article>
          <article><span>Active 24h</span><strong>{{d.active24h}}</strong><small>Seen during the last day</small></article>
          <article><span>Learning paths</span><strong>{{d.totalPaths}}</strong><small>Created across the platform</small></article>
          <article><span>Total lessons</span><strong>{{d.totalLessons}}</strong><small>Learning items being managed</small></article>
        </div>

        <div class="admin-grid">
          <article class="admin-card growth-card">
            <div class="card-head"><div><span class="mini-label">Acquisition</span><h3>Registrations — last 30 days</h3></div><strong>{{newUsers(d)}}</strong></div>
            <div class="growth-chart">@for(day of d.registrationTrend;track day.date){<div class="growth-bar" [title]="day.date + ': ' + day.count"><span [style.height.%]="growthHeight(day.count)"></span></div>}</div>
            <div class="axis"><span>{{d.registrationTrend[0]?.date}}</span><span>Today</span></div>
          </article>

          <article class="admin-card usage-card">
            <div class="card-head"><div><span class="mini-label">Usage health</span><h3>Engagement snapshot</h3></div></div>
            <div class="usage-row"><span>Active now</span><div><i [style.width.%]="percent(d.activeNow,d.totalUsers)"></i></div><strong>{{percent(d.activeNow,d.totalUsers)}}%</strong></div>
            <div class="usage-row"><span>Active in 24h</span><div><i [style.width.%]="percent(d.active24h,d.totalUsers)"></i></div><strong>{{percent(d.active24h,d.totalUsers)}}%</strong></div>
            <div class="usage-note">“Active now” is based on authenticated product activity within the last five minutes.</div>
          </article>

          <article class="admin-card delivery-card">
            <div class="card-head"><div><span class="mini-label">Notification operations</span><h3>Reminder delivery — last {{d.notificationHealth.windowHours}} hours</h3></div><span class="health-pill" [class.unhealthy]="d.notificationHealth.deliveryRate<95">{{d.notificationHealth.deliveryRate}}% delivered</span></div>
            <div class="delivery-kpis">
              <div><strong>{{d.notificationHealth.sent}}</strong><span>Sent</span></div>
              <div><strong>{{d.notificationHealth.failed}}</strong><span>Failed</span></div>
              <div><strong>{{d.notificationHealth.retryBacklog}}</strong><span>Retry backlog</span></div>
              <div><strong>{{d.notificationHealth.skipped}}</strong><span>Skipped</span></div>
            </div>
            <div class="delivery-meter"><i [style.width.%]="d.notificationHealth.deliveryRate"></i></div>
            <p class="delivery-copy">Failed email deliveries are retried automatically up to three attempts. Skipped includes disabled channels or environments without an email provider configured.</p>
          </article>

          <article class="admin-card failure-card">
            <div class="card-head"><div><span class="mini-label">Attention required</span><h3>Recent delivery failures</h3></div><span class="failure-count">{{d.notificationHealth.recentFailures.length}}</span></div>
            @for(item of d.notificationHealth.recentFailures;track item._id){
              <div class="failure-row"><span class="failure-icon">!</span><div><strong>{{item.eventType}} · {{item.channel}}</strong><small>{{item.errorMessage||'Delivery failed without provider detail'}}</small></div><div class="failure-meta"><span>Attempt {{item.attemptCount}}/3</span><small>{{relative(item.lastAttemptAt||item.updatedAt)}}</small></div></div>
            }@empty{<div class="healthy-empty"><span>✓</span><div><strong>No recent delivery failures</strong><small>The reminder pipeline currently has no failures requiring attention.</small></div></div>}
          </article>

          <article class="admin-card users-card">
            <div class="card-head"><div><span class="mini-label">People</span><h3>Recent users</h3></div></div>
            <div class="user-table">
              <div class="user-row table-head"><span>User</span><span>Role</span><span>Joined</span><span>Last active</span></div>
              @for(user of d.recentUsers;track user._id){<div class="user-row"><span class="user-cell"><b>{{initials(user.name)}}</b><span><strong>{{user.name}}</strong><small>{{user.email}}</small></span></span><span><em>{{user.role}}</em></span><span>{{shortDate(user.createdAt)}}</span><span>{{relative(user.lastSeenAt)}}</span></div>}
            </div>
          </article>
        </div>
      }@else if(error()){<div class="admin-error"><strong>Unable to load admin analytics</strong><p>{{error()}}</p></div>}@else{<div class="admin-loading"><span></span><span></span><span></span></div>}
    </section>
  `,
  styles:[`
    .admin-page{max-width:1380px;margin:0 auto}.admin-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}.admin-kpis article{padding:20px;border:1px solid #dfe5ed;border-radius:17px;background:#fff}.admin-kpis span{display:block;color:#66758a;font-size:.7rem;font-weight:800;text-transform:uppercase}.admin-kpis strong{display:block;font-size:2rem;color:#10233f;margin:6px 0}.admin-kpis small{color:#7a869a}.admin-kpis .live{background:linear-gradient(145deg,#10233f,#173c67);border-color:#10233f}.admin-kpis .live span,.admin-kpis .live small{color:#c6d5e8}.admin-kpis .live strong{color:#fff}.admin-grid{display:grid;grid-template-columns:1.35fr .85fr;gap:18px}.admin-card{border:1px solid #dfe5ed;border-radius:20px;background:#fff;padding:22px}.card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:20px}.card-head h3{margin:4px 0 0;color:#10233f}.card-head>strong{font-size:1.8rem;color:#10233f}.growth-chart{height:250px;display:grid;grid-template-columns:repeat(30,1fr);gap:4px;align-items:end;padding:8px 0;border-bottom:1px solid #e5eaf0;background:linear-gradient(180deg,#fff,#fbfcfe)}.growth-bar{height:100%;display:flex;align-items:end}.growth-bar span{display:block;width:100%;min-height:3px;background:linear-gradient(180deg,#2f6fed,#20a4c7);border-radius:4px 4px 1px 1px}.axis{display:flex;justify-content:space-between;color:#8a97a8;font-size:.67rem;margin-top:7px}.usage-card{display:flex;flex-direction:column}.usage-row{display:grid;grid-template-columns:110px 1fr 42px;gap:10px;align-items:center;margin:12px 0;font-size:.76rem;color:#59687d}.usage-row>div,.delivery-meter{height:9px;border-radius:999px;background:#edf1f5;overflow:hidden}.usage-row i,.delivery-meter i{display:block;height:100%;background:linear-gradient(90deg,#2f6fed,#20a4c7);border-radius:inherit}.usage-row strong{color:#10233f;text-align:right}.usage-note{margin-top:auto;padding:13px;border-radius:12px;background:#f7f9fc;color:#6b778c;font-size:.72rem;line-height:1.55}.delivery-card,.failure-card,.users-card{grid-column:1/-1}.health-pill{padding:6px 9px;border-radius:999px;background:#e6f4ea;color:#216e4e;font-size:.68rem;font-weight:850}.health-pill.unhealthy{background:#ffebe6;color:#ae2a19}.delivery-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.delivery-kpis div{padding:15px;border:1px solid #e4e8ee;border-radius:12px;background:#fafbfc}.delivery-kpis strong{display:block;font-size:1.45rem;color:#10233f}.delivery-kpis span{color:#7a869a;font-size:.7rem}.delivery-copy{margin:12px 0 0;color:#697586;font-size:.74rem}.failure-count{min-width:28px;height:28px;padding:0 8px;border-radius:999px;display:grid;place-items:center;background:#ffebe6;color:#ae2a19;font-size:.7rem;font-weight:850}.failure-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #edf0f3}.failure-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:#ffebe6;color:#ae2a19;font-weight:900}.failure-row>div:nth-child(2){display:flex;flex-direction:column;min-width:0}.failure-row strong{color:#10233f;font-size:.78rem}.failure-row small{color:#7a869a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.failure-meta{text-align:right;display:flex;flex-direction:column;color:#59687d;font-size:.7rem}.healthy-empty{display:flex;align-items:center;gap:12px;padding:18px;border-radius:12px;background:#f3fbf6;color:#216e4e}.healthy-empty>span{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#dff5e8;font-weight:900}.healthy-empty div{display:flex;flex-direction:column}.healthy-empty small{color:#5d7467}.user-table{overflow-x:auto}.user-row{min-width:760px;display:grid;grid-template-columns:2fr .7fr .8fr .9fr;gap:16px;align-items:center;padding:11px 8px;border-bottom:1px solid #edf1f5;color:#5f6d80;font-size:.76rem}.table-head{font-size:.65rem;font-weight:850;text-transform:uppercase;color:#8a97a8;background:#fafbfc;border-radius:9px}.user-cell{display:flex;align-items:center;gap:10px}.user-cell>b{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#eaf1ff;color:#2f6fed;font-size:.7rem}.user-cell>span{display:flex;flex-direction:column}.user-cell strong{color:#10233f}.user-cell small{color:#8a97a8}.user-row em{font-style:normal;padding:4px 7px;border-radius:999px;background:#eef3f8;color:#44546f;font-weight:800;font-size:.66rem}.admin-error{padding:24px;border:1px solid #f1c5c9;background:#fff7f7;border-radius:16px;color:#8f2e37}.admin-loading{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.admin-loading span{height:120px;border-radius:16px;background:#f1f4f8}@media(max-width:1050px){.admin-kpis{grid-template-columns:repeat(2,1fr)}.admin-grid{grid-template-columns:1fr}.delivery-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.admin-kpis,.delivery-kpis{grid-template-columns:1fr}.growth-chart{gap:2px}.failure-row{grid-template-columns:34px 1fr}.failure-meta{grid-column:2;text-align:left}}
  `]
})
export class AdminComponent implements OnInit{
  private api=inject(ApiService);readonly data=signal<AdminOverview|null>(null);readonly error=signal('');
  ngOnInit(){this.load();}
  load(){this.error.set('');this.api.get<AdminOverview>('/api/v1/admin/overview').subscribe({next:value=>this.data.set(value),error:err=>this.error.set(err?.error?.message??'Admin analytics are unavailable.')});}
  maxRegistrations(){return Math.max(1,...(this.data()?.registrationTrend.map(x=>x.count)??[1]));}
  growthHeight(count:number){return Math.max(3,Math.round(count/this.maxRegistrations()*100));}
  newUsers(d:AdminOverview){return d.registrationTrend.reduce((sum,item)=>sum+item.count,0);}
  percent(value:number,total:number){return total?Math.round(value/total*100):0;}
  initials(name:string){return name.split(/\s+/).slice(0,2).map(v=>v[0]??'').join('').toUpperCase();}
  shortDate(value:string){return new Intl.DateTimeFormat(undefined,{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));}
  relative(value?:string){if(!value)return'Never';const ms=Date.now()-new Date(value).getTime();const min=Math.floor(ms/60000);if(min<1)return'Now';if(min<60)return`${min}m ago`;const h=Math.floor(min/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`;}
}
