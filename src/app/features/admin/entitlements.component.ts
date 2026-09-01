import { Component, OnInit, inject, signal } from '@angular/core';
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
  <div class="search-row"><mat-form-field appearance="outline"><mat-label>Search users</mat-label><input matInput [(ngModel)]="query" (keyup.enter)="load()" placeholder="Name or email"></mat-form-field><button mat-flat-button class="primary-cta" (click)="load()">Search</button></div>
  @if(error()){<div class="error-box">{{error()}}</div>}
  <div class="user-grid">
    @for(user of users();track user._id){
      <article class="user-card">
        <div class="user-head"><div><strong>{{user.name}}</strong><small>{{user.email}}</small></div><span class="plan" [class.pro]="user.entitlement.plan==='PRO'">{{user.entitlement.plan}}</span></div>
        <div class="meta"><span>Status <b>{{user.entitlement.status}}</b></span><span>Source <b>{{user.entitlement.source}}</b></span><span>Role <b>{{user.role}}</b></span></div>
        <div class="controls">
          <mat-form-field appearance="outline"><mat-label>Plan</mat-label><mat-select [(ngModel)]="drafts[user._id].plan"><mat-option value="FREE">Free</mat-option><mat-option value="PRO">Pro</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="drafts[user._id].status"><mat-option value="ACTIVE">Active</mat-option><mat-option value="GRACE">Grace</mat-option><mat-option value="INACTIVE">Inactive</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline" class="reason"><mat-label>Reason for change</mat-label><input matInput [(ngModel)]="drafts[user._id].reason" placeholder="e.g. Beta Pro access until launch"></mat-form-field>
        </div>
        <div class="actions"><button mat-flat-button class="primary-cta" [disabled]="saving()===user._id || drafts[user._id].reason.trim().length<3" (click)="save(user)">{{saving()===user._id?'Saving…':'Apply entitlement'}}</button><button mat-stroked-button (click)="toggleHistory(user)">{{historyUser()===user._id?'Hide history':'View history'}}</button></div>
        @if(historyUser()===user._id){<div class="history">@for(item of history();track item._id){<div><strong>{{item.previousPlan}} → {{item.newPlan}}</strong><span>{{item.previousStatus}} → {{item.newStatus}}</span><small>{{item.reason||'No reason'}} · {{date(item.createdAt)}}</small></div>}@empty{<p class="muted">No entitlement changes recorded yet.</p>}</div>}
      </article>
    }@empty{<div class="empty">No users matched your search.</div>}
  </div>
</section>`,styles:[`.ent-page{max-width:1200px;margin:auto}.search-row{display:flex;gap:12px;align-items:center;margin:18px 0}.search-row mat-form-field{flex:1}.user-grid{display:grid;gap:14px}.user-card{background:#fff;border:1px solid #e1e6ed;border-radius:18px;padding:20px}.user-head{display:flex;justify-content:space-between;gap:12px}.user-head div{display:flex;flex-direction:column}.user-head strong{color:#10233f}.user-head small{color:#7a869a}.plan{padding:6px 10px;border-radius:999px;background:#eef2f7;font-weight:850;font-size:.7rem}.plan.pro{background:#e8f1ff;color:#175cd3}.meta{display:flex;gap:18px;flex-wrap:wrap;margin:14px 0;color:#667085;font-size:.75rem}.meta b{color:#344054}.controls{display:grid;grid-template-columns:160px 180px 1fr;gap:10px}.actions{display:flex;gap:10px}.history{margin-top:16px;border-top:1px solid #edf0f3;padding-top:12px;display:grid;gap:8px}.history>div{display:grid;grid-template-columns:150px 160px 1fr;gap:10px;font-size:.74rem}.history span,.history small{color:#667085}.error-box{padding:12px;border-radius:10px;background:#fff1f0;color:#b42318;margin-bottom:12px}.empty{padding:30px;text-align:center;color:#667085}@media(max-width:800px){.controls{grid-template-columns:1fr}.history>div{grid-template-columns:1fr}.search-row{align-items:stretch;flex-direction:column}}` ]})
export class EntitlementsComponent implements OnInit{
  private api=inject(ApiService);readonly users=signal<AdminUser[]>([]);readonly saving=signal('');readonly error=signal('');readonly historyUser=signal('');readonly history=signal<any[]>([]);query='';drafts:Record<string,{plan:Plan;status:Status;reason:string}>={};
  ngOnInit(){this.load();}
  load(){this.error.set('');const suffix=this.query.trim()?`?q=${encodeURIComponent(this.query.trim())}`:'';this.api.get<AdminUser[]>(`/api/v1/admin/users${suffix}`).subscribe({next:rows=>{this.users.set(rows);for(const u of rows)this.drafts[u._id]={plan:u.entitlement.plan,status:u.entitlement.status,reason:''};},error:e=>this.error.set(e?.error?.message??'Unable to load users.')});}
  save(user:AdminUser){const d=this.drafts[user._id];this.saving.set(user._id);this.api.patch(`/api/v1/admin/users/${user._id}/entitlement`,d).subscribe({next:()=>{this.saving.set('');this.load();},error:e=>{this.saving.set('');this.error.set(e?.error?.message??'Unable to update entitlement.');}});}
  toggleHistory(user:AdminUser){if(this.historyUser()===user._id){this.historyUser.set('');return;}this.historyUser.set(user._id);this.api.get<any[]>(`/api/v1/admin/users/${user._id}/entitlement-history`).subscribe({next:r=>this.history.set(r),error:()=>this.history.set([])});}
  date(v:string){return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}
}
