import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../core/services/api.service';

type Plan='FREE'|'PRO'; type Status='ACTIVE'|'INACTIVE'|'GRACE'; type Filter='ALL'|'ONLINE'|'INACTIVE'|'CLEANUP';
interface AdminUser{
  _id:string;name:string;email:string;role:string;timezone:string;createdAt:string;lastSeenAt?:string;
  entitlement:{plan:Plan;status:Status;source:string;startsAt?:string;endsAt?:string};capabilities:Record<string,unknown>;
  presence:{isOnline:boolean;lastSeenAt?:string|null};
  inactivity:{days:number;cleanupThresholdDays:number;eligible:boolean};
  aiUsage:{month:{total:number;succeeded:number;plans:number;coach:number;rejectedQuota:number}};
  subscription:{durationDays:number|null;daysRemaining:number|null;progressPercent:number|null};
}

@Component({standalone:true,imports:[FormsModule,MatButtonModule,MatFormFieldModule,MatInputModule,MatSelectModule],template:`
<section class="page-enter users-page">
  <div class="page-head"><div><span class="eyebrow">Administration</span><h1>User management</h1><p class="muted">Monitor presence, AI usage, subscription progress and inactivity, then manage access or clear eligible inactive accounts.</p></div><button mat-stroked-button (click)="load()">Refresh</button></div>

  <section class="summary-grid">
    <article><span>Total users</span><strong>{{users().length}}</strong></article>
    <article><span>Online now</span><strong>{{onlineCount()}}</strong><small>Active in last 5 minutes</small></article>
    <article><span>Cleanup eligible</span><strong>{{cleanupCount()}}</strong><small>{{cleanupThreshold()}} day policy</small></article>
    <article><span>AI requests this month</span><strong>{{aiRequests()}}</strong></article>
  </section>

  <div class="toolbar">
    <mat-form-field appearance="outline"><mat-label>Search users</mat-label><input matInput [(ngModel)]="query" (keyup.enter)="search()" placeholder="Name or email"></mat-form-field>
    <mat-form-field appearance="outline" class="filter"><mat-label>Show</mat-label><mat-select [(ngModel)]="filter" (selectionChange)="page.set(1)"><mat-option value="ALL">All users</mat-option><mat-option value="ONLINE">Online now</mat-option><mat-option value="INACTIVE">Inactive</mat-option><mat-option value="CLEANUP">Cleanup eligible</mat-option></mat-select></mat-form-field>
    <button mat-flat-button class="primary-cta" (click)="search()">Search</button>
  </div>

  @if(error()){<div class="state error">{{error()}}</div>}
  @if(message()){<div class="state success">{{message()}}</div>}

  <section class="user-table" aria-label="User management table">
    <header class="table-head"><span>User</span><span>Presence</span><span>AI this month</span><span>Subscription</span><span>Last active</span><span>Inactivity</span><span>Actions</span></header>
    @for(user of paged();track user._id){
      <article class="user-row">
        <div class="cell user-cell" data-label="User"><strong>{{user.name}}</strong><small>{{user.email}}</small><em>{{friendly(user.role)}}</em></div>
        <div class="cell" data-label="Presence"><span class="presence" [class.online]="user.presence.isOnline"><i></i>{{user.presence.isOnline?'Online':'Offline'}}</span></div>
        <div class="cell ai-cell" data-label="AI this month"><strong>{{user.aiUsage.month.total}}</strong><small>{{user.aiUsage.month.plans}} plans · {{user.aiUsage.month.coach}} coach</small>@if(user.aiUsage.month.rejectedQuota){<em>{{user.aiUsage.month.rejectedQuota}} quota blocked</em>}</div>
        <div class="cell subscription-cell" data-label="Subscription"><div><span class="plan" [class.pro]="user.entitlement.plan==='PRO'">{{user.entitlement.plan}}</span><small>{{friendly(user.entitlement.status)}}</small></div>@if(user.subscription.progressPercent!==null){<div class="progress"><span [style.width.%]="user.subscription.progressPercent"></span></div><small>{{user.subscription.daysRemaining}} days remaining</small>}@else{<small>No fixed end date</small>}</div>
        <div class="cell" data-label="Last active"><strong>{{lastActive(user)}}</strong><small>{{dateTime(user.lastSeenAt||user.createdAt)}}</small></div>
        <div class="cell inactivity-cell" data-label="Inactivity"><strong>{{user.inactivity.days}} days</strong><small>Threshold {{user.inactivity.cleanupThresholdDays}}</small>@if(user.inactivity.eligible){<span class="cleanup-badge">Eligible</span>}</div>
        <div class="cell actions-cell" data-label="Actions"><button mat-stroked-button (click)="toggleManage(user)">{{manageUser()===user._id?'Close':'Manage'}}</button>@if(user.inactivity.eligible){<button mat-stroked-button class="danger" [disabled]="deleting()===user._id" (click)="clearUser(user)">{{deleting()===user._id?'Clearing…':'Clear account'}}</button>}</div>
      </article>
      @if(manageUser()===user._id){
        <div class="manage-panel">
          <div class="controls">
            <mat-form-field appearance="outline"><mat-label>Plan</mat-label><mat-select [(ngModel)]="drafts[user._id].plan"><mat-option value="FREE">Free</mat-option><mat-option value="PRO">Pro</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="drafts[user._id].status"><mat-option value="ACTIVE">Active</mat-option><mat-option value="GRACE">Grace</mat-option><mat-option value="INACTIVE">Inactive</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Reason for change</mat-label><input matInput [(ngModel)]="drafts[user._id].reason" placeholder="Reason for entitlement change"></mat-form-field>
          </div>
          <div class="manage-actions"><button mat-flat-button class="primary-cta" [disabled]="saving()===user._id||drafts[user._id].reason.trim().length<3" (click)="save(user)">{{saving()===user._id?'Saving…':'Apply entitlement'}}</button><button mat-stroked-button (click)="toggleHistory(user)">{{historyUser()===user._id?'Hide history':'Entitlement history'}}</button></div>
          @if(historyUser()===user._id){<div class="history">@for(item of history().slice(0,6);track item._id){<div><strong>{{friendly(item.previousPlan)}} → {{friendly(item.newPlan)}}</strong><span>{{friendly(item.previousStatus)}} → {{friendly(item.newStatus)}}</span><small>{{item.reason||'No reason'}} · {{dateTime(item.createdAt)}}</small></div>}@empty{<p>No entitlement history yet.</p>}</div>}
        </div>
      }
    }@empty{<div class="empty">No users match this view.</div>}
  </section>

  @if(pageCount()>1){<footer class="pager"><span>Showing {{rangeStart()}}–{{rangeEnd()}} of {{filtered().length}}</span><div><button mat-stroked-button (click)="setPage(page()-1)" [disabled]="page()===1">Previous</button><strong>Page {{page()}} of {{pageCount()}}</strong><button mat-stroked-button (click)="setPage(page()+1)" [disabled]="page()===pageCount()">Next</button></div></footer>}
</section>`,styles:[`
.users-page{max-width:1500px;margin:auto;overflow-x:hidden}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.summary-grid article{padding:16px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}.summary-grid span,.summary-grid small{display:block;color:#667085;font-size:.68rem}.summary-grid strong{display:block;margin:4px 0;color:#101828;font-size:1.5rem}.toolbar{display:grid;grid-template-columns:minmax(0,1fr) 190px auto;gap:10px;align-items:start;margin:16px 0}.toolbar mat-form-field{width:100%}.toolbar button{min-height:56px}.state{padding:12px;border-radius:10px;margin:10px 0}.state.error{background:#fef3f2;color:#b42318}.state.success{background:#ecfdf3;color:#067647}.user-table{border:1px solid #e4e7ec;border-radius:16px;background:#fff;overflow:hidden}.table-head,.user-row{display:grid;grid-template-columns:1.45fr .75fr .9fr 1.15fr 1fr .8fr 1fr;gap:12px;align-items:center}.table-head{padding:11px 14px;background:#f8fafc;color:#667085;font-size:.64rem;font-weight:850;text-transform:uppercase;border-bottom:1px solid #e4e7ec}.user-row{padding:14px;border-bottom:1px solid #eef1f4}.cell{min-width:0;display:flex;flex-direction:column;gap:3px;color:#344054;font-size:.72rem}.cell strong,.cell small{overflow-wrap:anywhere}.cell small{color:#667085}.user-cell strong{color:#101828}.user-cell em{font-style:normal;color:#667085;font-size:.62rem}.presence{display:inline-flex;align-items:center;gap:6px;width:max-content}.presence i{width:8px;height:8px;border-radius:50%;background:#98a2b3}.presence.online{color:#067647;font-weight:800}.presence.online i{background:#12b76a}.ai-cell>strong{font-size:1.05rem}.ai-cell em{font-style:normal;color:#b54708;font-size:.61rem}.subscription-cell>div:first-child{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.plan{padding:3px 6px;border-radius:999px;background:#f2f4f7;font-size:.61rem;font-weight:850}.plan.pro{background:#eef4ff;color:#175cd3}.progress{height:5px;border-radius:999px;background:#eaecf0;overflow:hidden;margin-top:3px}.progress span{display:block;height:100%;background:#175cd3}.cleanup-badge{width:max-content;padding:3px 6px;border-radius:999px;background:#fff4ed;color:#b93815;font-size:.59rem;font-weight:850}.actions-cell{flex-direction:row;flex-wrap:wrap}.actions-cell button{font-size:.68rem}.danger{color:#b42318!important;border-color:#fda29b!important}.manage-panel{padding:16px;background:#fcfcfd;border-bottom:1px solid #e4e7ec}.controls{display:grid;grid-template-columns:160px 180px minmax(0,1fr);gap:10px}.controls mat-form-field{width:100%}.manage-actions{display:flex;gap:8px;flex-wrap:wrap}.history{margin-top:12px;border-top:1px solid #eaecf0;padding-top:10px;display:grid;gap:7px}.history>div{display:grid;grid-template-columns:150px 160px minmax(0,1fr);gap:10px;font-size:.7rem}.history span,.history small{color:#667085}.empty{padding:36px;text-align:center;color:#667085}.pager{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:14px;color:#667085;font-size:.7rem}.pager>div{display:flex;align-items:center;gap:8px}.pager strong{color:#344054}@media(max-width:1100px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.table-head{display:none}.user-table{border:0;background:transparent;display:grid;gap:12px}.user-row{grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid #e4e7ec;border-radius:14px;background:#fff}.cell:before{content:attr(data-label);font-size:.58rem;text-transform:uppercase;font-weight:850;color:#98a2b3}.manage-panel{margin-top:-12px;border:1px solid #e4e7ec;border-top:0;border-radius:0 0 14px 14px}.actions-cell{grid-column:1/-1}.controls{grid-template-columns:1fr 1fr}.controls mat-form-field:last-child{grid-column:1/-1}}@media(max-width:680px){.summary-grid{grid-template-columns:1fr 1fr}.toolbar{grid-template-columns:1fr}.toolbar button{min-height:44px}.user-row{grid-template-columns:1fr}.actions-cell{grid-column:auto}.controls{grid-template-columns:1fr}.controls mat-form-field:last-child{grid-column:auto}.pager{flex-direction:column;align-items:stretch}.pager>div{justify-content:space-between}}@media(max-width:420px){.summary-grid{grid-template-columns:1fr}}
` ]})
export class EntitlementsComponent implements OnInit{
  private api=inject(ApiService);private http=inject(HttpClient);readonly users=signal<AdminUser[]>([]);readonly saving=signal('');readonly deleting=signal('');readonly error=signal('');readonly message=signal('');readonly historyUser=signal('');readonly manageUser=signal('');readonly history=signal<any[]>([]);readonly page=signal(1);readonly pageSize=10;query='';filter:Filter='ALL';drafts:Record<string,{plan:Plan;status:Status;reason:string}>={};
  readonly filtered=computed(()=>this.users().filter(user=>this.filter==='ALL'||(this.filter==='ONLINE'&&user.presence.isOnline)||(this.filter==='INACTIVE'&&!user.presence.isOnline)||(this.filter==='CLEANUP'&&user.inactivity.eligible)));
  readonly paged=computed(()=>{const start=(this.page()-1)*this.pageSize;return this.filtered().slice(start,start+this.pageSize);});readonly onlineCount=computed(()=>this.users().filter(u=>u.presence.isOnline).length);readonly cleanupCount=computed(()=>this.users().filter(u=>u.inactivity.eligible).length);readonly aiRequests=computed(()=>this.users().reduce((sum,u)=>sum+u.aiUsage.month.total,0));readonly cleanupThreshold=computed(()=>this.users()[0]?.inactivity.cleanupThresholdDays??90);
  ngOnInit(){this.load();}
  search(){this.page.set(1);this.load();}
  load(){this.error.set('');this.message.set('');const suffix=this.query.trim()?`?q=${encodeURIComponent(this.query.trim())}`:'';this.api.get<AdminUser[]>(`/api/v1/admin/users${suffix}`).subscribe({next:rows=>{this.users.set(rows);for(const u of rows)this.drafts[u._id]={plan:u.entitlement.plan,status:u.entitlement.status,reason:''};this.setPage(this.page());},error:e=>this.error.set(e?.error?.message??'Unable to load users.')});}
  toggleManage(user:AdminUser){this.manageUser.set(this.manageUser()===user._id?'':user._id);this.historyUser.set('');}
  save(user:AdminUser){const d=this.drafts[user._id];this.saving.set(user._id);this.api.patch(`/api/v1/admin/users/${user._id}/entitlement`,d).subscribe({next:()=>{this.saving.set('');this.message.set('Entitlement updated.');this.load();},error:e=>{this.saving.set('');this.error.set(e?.error?.message??'Unable to update entitlement.');}});}
  toggleHistory(user:AdminUser){if(this.historyUser()===user._id){this.historyUser.set('');return;}this.historyUser.set(user._id);this.api.get<any[]>(`/api/v1/admin/users/${user._id}/entitlement-history`).subscribe({next:r=>this.history.set(r),error:()=>this.history.set([])});}
  clearUser(user:AdminUser){if(!user.inactivity.eligible)return;const reason=window.prompt(`Reason for clearing ${user.name}'s inactive account:`)?.trim();if(!reason||reason.length<5)return;if(!window.confirm(`Permanently clear ${user.name}'s account and owned LearnFlow data? This cannot be undone.`))return;this.deleting.set(user._id);this.error.set('');this.http.delete<{message:string}>(`${environment.apiUrl}/api/v1/admin/users/${user._id}`,{body:{reason,confirmation:'DELETE'}}).subscribe({next:r=>{this.deleting.set('');this.message.set(r.message);this.load();},error:e=>{this.deleting.set('');this.error.set(e?.error?.message??'Unable to clear this account.');}});}
  pageCount(){return Math.max(1,Math.ceil(this.filtered().length/this.pageSize));}setPage(v:number){this.page.set(Math.min(Math.max(1,v),this.pageCount()));}rangeStart(){return this.filtered().length?(this.page()-1)*this.pageSize+1:0;}rangeEnd(){return Math.min(this.page()*this.pageSize,this.filtered().length);}friendly(v:string){const t=(v||'').toLowerCase().replaceAll('_',' ');return t.charAt(0).toUpperCase()+t.slice(1);}dateTime(v:string){return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}lastActive(user:AdminUser){if(user.presence.isOnline)return'Now';if(!user.lastSeenAt)return'Never signed in';const ms=Date.now()-new Date(user.lastSeenAt).getTime();const d=Math.floor(ms/86400000);if(d)return`${d}d ago`;const h=Math.floor(ms/3600000);if(h)return`${h}h ago`;return`${Math.max(1,Math.floor(ms/60000))}m ago`;}
}
