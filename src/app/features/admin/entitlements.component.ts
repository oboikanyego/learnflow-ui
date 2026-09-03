import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';

type Plan='FREE'|'PRO'; type Status='ACTIVE'|'INACTIVE'|'GRACE';
interface AdminUser{_id:string;name:string;email:string;role:string;timezone:string;createdAt:string;lastSeenAt?:string;entitlement:{plan:Plan;status:Status;source:string;startsAt?:string;endsAt?:string};capabilities:Record<string,unknown>}

@Component({standalone:true,imports:[FormsModule,MatButtonModule,MatFormFieldModule,MatInputModule,MatSelectModule],template:`
<section class="page-enter ent-page">
  <div class="page-head"><div><span class="eyebrow">Administration</span><h1>Entitlements</h1><p class="muted">Assign or revoke Pro access with a reason. Every change is written to the entitlement audit history.</p></div><button mat-stroked-button (click)="load()">Refresh</button></div>
  <div class="search-row"><mat-form-field appearance="outline"><mat-label>Search users</mat-label><input matInput [(ngModel)]="query" (keyup.enter)="search()" placeholder="Name or email"></mat-form-field><button mat-flat-button class="primary-cta" (click)="search()">Search</button></div>
  @if(error()){<div class="error-box">{{error()}}</div>}
  <div class="list-head"><small>Showing {{rangeStart()}}–{{rangeEnd()}} of {{users().length}} users</small></div>
  <div class="user-grid">
    @for(user of paged();track user._id){
      <article class="user-card">
        <div class="user-head"><div><strong>{{user.name}}</strong><small>{{user.email}}</small></div><span class="plan" [class.pro]="user.entitlement.plan==='PRO'">{{user.entitlement.plan==='PRO'?'Pro':'Free'}}</span></div>
        <div class="meta"><span>Status <b>{{friendly(user.entitlement.status)}}</b></span><span>Source <b>{{friendly(user.entitlement.source)}}</b></span><span>Role <b>{{friendly(user.role)}}</b></span></div>
        <div class="controls">
          <mat-form-field appearance="outline"><mat-label>Plan</mat-label><mat-select [(ngModel)]="drafts[user._id].plan"><mat-option value="FREE">Free</mat-option><mat-option value="PRO">Pro</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="drafts[user._id].status"><mat-option value="ACTIVE">Active</mat-option><mat-option value="GRACE">Grace</mat-option><mat-option value="INACTIVE">Inactive</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline" class="reason"><mat-label>Reason for change</mat-label><input matInput [(ngModel)]="drafts[user._id].reason" placeholder="e.g. Beta Pro access until launch"></mat-form-field>
        </div>
        <div class="actions"><button mat-flat-button class="primary-cta" [disabled]="saving()===user._id || drafts[user._id].reason.trim().length<3" (click)="save(user)">{{saving()===user._id?'Saving…':'Apply entitlement'}}</button><button mat-stroked-button (click)="toggleHistory(user)">{{historyUser()===user._id?'Hide history':'View history'}}</button></div>
        @if(historyUser()===user._id){<div class="history">@for(item of history().slice(0,6);track item._id){<div><strong>{{friendly(item.previousPlan)}} → {{friendly(item.newPlan)}}</strong><span>{{friendly(item.previousStatus)}} → {{friendly(item.newStatus)}}</span><small>{{item.reason||'No reason'}} · {{date(item.createdAt)}}</small></div>}@empty{<p class="muted">No entitlement changes recorded yet.</p>}@if(history().length>6){<small class="history-note">Showing latest 6 of {{history().length}} changes.</small>}</div>}
      </article>
    }@empty{<div class="empty">No users matched your search.</div>}
  </div>
  @if(pageCount()>1){<footer class="pager"><button mat-stroked-button type="button" (click)="setPage(page()-1)" [disabled]="page()===1">Previous</button><span>Page {{page()}} of {{pageCount()}}</span><button mat-stroked-button type="button" (click)="setPage(page()+1)" [disabled]="page()===pageCount()">Next</button></footer>}
</section>`,styles:[`.ent-page{max-width:1200px;margin:auto}.search-row{display:flex;gap:12px;align-items:center;margin:18px 0}.search-row mat-form-field{flex:1}.list-head{display:flex;justify-content:flex-end;margin-bottom:8px}.list-head small{color:#7a869a}.user-grid{display:grid;gap:14px}.user-card{background:#fff;border:1px solid #e1e6ed;border-radius:18px;padding:20px;overflow:hidden}.user-head{display:flex;justify-content:space-between;gap:12px}.user-head div{display:flex;flex-direction:column;min-width:0}.user-head strong,.user-head small{overflow-wrap:anywhere}.user-head strong{color:#10233f}.user-head small{color:#7a869a}.plan{padding:6px 10px;border-radius:999px;background:#eef2f7;font-weight:850;font-size:.7rem;height:max-content}.plan.pro{background:#e8f1ff;color:#175cd3}.meta{display:flex;gap:18px;flex-wrap:wrap;margin:14px 0;color:#667085;font-size:.75rem}.meta b{color:#344054}.controls{display:grid;grid-template-columns:160px 180px minmax(0,1fr);gap:10px}.actions{display:flex;gap:10px;flex-wrap:wrap}.history{margin-top:16px;border-top:1px solid #edf0f3;padding-top:12px;display:grid;gap:8px}.history>div{display:grid;grid-template-columns:150px 160px minmax(0,1fr);gap:10px;font-size:.74rem}.history span,.history small{color:#667085;overflow-wrap:anywhere}.history-note{padding-top:4px}.error-box{padding:12px;border-radius:10px;background:#fff1f0;color:#b42318;margin-bottom:12px}.empty{padding:30px;text-align:center;color:#667085}.pager{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding-top:16px}.pager span{font-size:.72rem;color:#667085}@media(max-width:800px){.controls{grid-template-columns:1fr}.history>div{grid-template-columns:1fr}.search-row{align-items:stretch;flex-direction:column}.pager{justify-content:space-between}}` ]})
export class EntitlementsComponent implements OnInit{
  private api=inject(ApiService);readonly users=signal<AdminUser[]>([]);readonly saving=signal('');readonly error=signal('');readonly historyUser=signal('');readonly history=signal<any[]>([]);readonly page=signal(1);readonly pageSize=6;readonly paged=computed(()=>{const start=(this.page()-1)*this.pageSize;return this.users().slice(start,start+this.pageSize);});query='';drafts:Record<string,{plan:Plan;status:Status;reason:string}>={};
  ngOnInit(){this.load();}
  search(){this.page.set(1);this.historyUser.set('');this.load();}
  load(){this.error.set('');const suffix=this.query.trim()?`?q=${encodeURIComponent(this.query.trim())}`:'';this.api.get<AdminUser[]>(`/api/v1/admin/users${suffix}`).subscribe({next:rows=>{this.users.set(rows);this.setPage(this.page());for(const u of rows)this.drafts[u._id]={plan:u.entitlement.plan,status:u.entitlement.status,reason:''};},error:e=>this.error.set(e?.error?.message??'Unable to load users.')});}
  save(user:AdminUser){const d=this.drafts[user._id];this.saving.set(user._id);this.api.patch(`/api/v1/admin/users/${user._id}/entitlement`,d).subscribe({next:()=>{this.saving.set('');this.load();},error:e=>{this.saving.set('');this.error.set(e?.error?.message??'Unable to update entitlement.');}});}
  toggleHistory(user:AdminUser){if(this.historyUser()===user._id){this.historyUser.set('');return;}this.historyUser.set(user._id);this.api.get<any[]>(`/api/v1/admin/users/${user._id}/entitlement-history`).subscribe({next:r=>this.history.set(r),error:()=>this.history.set([])});}
  pageCount(){return Math.max(1,Math.ceil(this.users().length/this.pageSize));}setPage(v:number){this.page.set(Math.min(Math.max(1,v),this.pageCount()));}rangeStart(){return this.users().length?(this.page()-1)*this.pageSize+1:0;}rangeEnd(){return Math.min(this.page()*this.pageSize,this.users().length);}friendly(v:string){const text=(v||'').toLowerCase().replaceAll('_',' ');return text.charAt(0).toUpperCase()+text.slice(1);}date(v:string){return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}
}
