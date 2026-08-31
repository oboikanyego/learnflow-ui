import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';

type Provider='UNCONFIGURED'|'PAYSTACK'|'PEACH'|'YOCO'|'OZOW'|'STRIPE';
interface BillingSettings{provider:Provider;currency:string;proMonthlyPriceMinor:number;proYearlyPriceMinor:number;graceDays:number;enabled:boolean;updatedAt?:string}
interface Ops{total:number;active:number;pastDue:number;cancelAtPeriodEnd:number;cancelled:number;expired:number;pending:number;recent:any[]}

@Component({standalone:true,imports:[FormsModule,MatButtonModule,MatFormFieldModule,MatInputModule,MatSelectModule,MatSlideToggleModule],template:`
<section class="page-enter billing-admin">
  <div class="page-head"><div><span class="eyebrow">Administration</span><h1>Billing operations</h1><p class="muted">Control pricing and provider readiness, then monitor subscription lifecycle state.</p></div><button mat-stroked-button (click)="load()">Refresh</button></div>
  @if(error()){<div class="error-box">{{error()}}</div>} @if(success()){<div class="success-box">{{success()}}</div>}
  <div class="grid">
    <article class="panel"><div class="panel-head"><div><span class="mini-label">Runtime configuration</span><h2>Billing settings</h2></div><span class="readiness" [class.ready]="settings.enabled&&settings.provider!=='UNCONFIGURED'">{{settings.enabled?'Enabled':'Disabled'}}</span></div>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Provider</mat-label><mat-select [(ngModel)]="settings.provider"><mat-option value="UNCONFIGURED">Unconfigured</mat-option><mat-option value="PAYSTACK">Paystack</mat-option><mat-option value="PEACH">Peach Payments</mat-option><mat-option value="YOCO">Yoco</mat-option><mat-option value="OZOW">Ozow</mat-option><mat-option value="STRIPE">Stripe</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Currency</mat-label><input matInput maxlength="3" [(ngModel)]="settings.currency"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Pro monthly (minor units)</mat-label><input matInput type="number" min="0" [(ngModel)]="settings.proMonthlyPriceMinor"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Pro yearly (minor units)</mat-label><input matInput type="number" min="0" [(ngModel)]="settings.proYearlyPriceMinor"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Grace period (days)</mat-label><input matInput type="number" min="0" max="30" [(ngModel)]="settings.graceDays"></mat-form-field>
        <div class="toggle-field"><mat-slide-toggle [(ngModel)]="settings.enabled">Enable checkout</mat-slide-toggle><small>Keep disabled until provider credentials and webhook setup are ready.</small></div>
      </div>
      <div class="provider-state"><strong>Provider readiness</strong><span>Selected: {{settings.provider}}</span><span>Checkout: {{settings.enabled?'Enabled':'Disabled'}}</span><span>Credentials/webhook health will become live once a provider adapter is connected.</span></div>
      <button mat-flat-button class="primary-cta" (click)="save()" [disabled]="saving()">{{saving()?'Saving…':'Save billing settings'}}</button>
    </article>
    <article class="panel"><span class="mini-label">Subscription operations</span><h2>Lifecycle snapshot</h2><div class="metrics"><div><b>{{ops()?.total??0}}</b><span>Total</span></div><div><b>{{ops()?.active??0}}</b><span>Active</span></div><div><b>{{ops()?.pastDue??0}}</b><span>Past due</span></div><div><b>{{ops()?.cancelAtPeriodEnd??0}}</b><span>Ending</span></div><div><b>{{ops()?.cancelled??0}}</b><span>Cancelled</span></div><div><b>{{ops()?.expired??0}}</b><span>Expired</span></div></div></article>
  </div>
  <article class="panel recent"><div class="panel-head"><div><span class="mini-label">Recent activity</span><h2>Subscriptions</h2></div></div>@for(item of ops()?.recent??[];track item._id){<div class="sub-row"><div><strong>{{item.userId?.name||'User'}}</strong><small>{{item.userId?.email||''}}</small></div><span>{{item.provider}}</span><span>{{item.status}}</span><span>{{money(item.amountMinor,item.currency)}}</span><span>{{item.billingInterval}}</span></div>}@empty{<p class="muted">No subscription records yet.</p>}</article>
  <article class="panel"><span class="mini-label">Configuration audit</span><h2>Recent changes</h2>@for(item of audit();track item._id){<div class="audit-row"><span>{{item.previous.provider}} → {{item.next.provider}}</span><span>{{money(item.previous.proMonthlyPriceMinor,item.previous.currency)}} → {{money(item.next.proMonthlyPriceMinor,item.next.currency)}}</span><span>{{item.changedBy?.name||'Admin'}}</span><small>{{date(item.createdAt)}}</small></div>}@empty{<p class="muted">No billing settings changes recorded yet.</p>}</article>
</section>`,styles:[`.billing-admin{max-width:1250px;margin:auto}.grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.panel{background:#fff;border:1px solid #e1e6ed;border-radius:18px;padding:20px;margin-bottom:18px}.panel h2{margin:5px 0 16px;color:#10233f}.panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.toggle-field{padding:12px;border:1px solid #e4e7ec;border-radius:12px;display:flex;flex-direction:column;gap:6px}.toggle-field small,.provider-state span{color:#667085;font-size:.75rem}.provider-state{display:grid;gap:5px;padding:12px;background:#f8fafc;border-radius:12px;margin:5px 0 16px}.readiness{font-size:.72rem;font-weight:800;background:#f2f4f7;padding:6px 9px;border-radius:999px}.readiness.ready{background:#ecfdf3;color:#027a48}.metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.metrics div{padding:16px;border:1px solid #edf0f3;border-radius:12px}.metrics b{font-size:1.45rem;display:block;color:#10233f}.metrics span{font-size:.75rem;color:#667085}.sub-row,.audit-row{display:grid;grid-template-columns:2fr repeat(4,1fr);gap:12px;padding:11px 0;border-top:1px solid #edf0f3;align-items:center;font-size:.76rem}.sub-row div{display:flex;flex-direction:column}.sub-row small,.audit-row small{color:#667085}.error-box,.success-box{padding:12px;border-radius:10px;margin-bottom:12px}.error-box{background:#fff1f0;color:#b42318}.success-box{background:#ecfdf3;color:#027a48}@media(max-width:900px){.grid,.form-grid{grid-template-columns:1fr}.sub-row,.audit-row{grid-template-columns:1fr 1fr}.metrics{grid-template-columns:repeat(3,1fr)}}` ]})
export class BillingSettingsComponent implements OnInit{
  private api=inject(ApiService);readonly ops=signal<Ops|null>(null);readonly audit=signal<any[]>([]);readonly saving=signal(false);readonly error=signal('');readonly success=signal('');settings:BillingSettings={provider:'UNCONFIGURED',currency:'ZAR',proMonthlyPriceMinor:9900,proYearlyPriceMinor:99000,graceDays:3,enabled:false};
  ngOnInit(){this.load();}
  load(){this.error.set('');this.api.get<BillingSettings>('/api/v1/admin/billing-settings').subscribe({next:r=>this.settings={...r},error:e=>this.error.set(e?.error?.message??'Unable to load billing settings.')});this.api.get<Ops>('/api/v1/admin/subscription-operations').subscribe({next:r=>this.ops.set(r)});this.api.get<any[]>('/api/v1/admin/billing-settings/audit').subscribe({next:r=>this.audit.set(r)});}
  save(){this.saving.set(true);this.error.set('');this.success.set('');this.api.patch('/api/v1/admin/billing-settings',this.settings).subscribe({next:()=>{this.saving.set(false);this.success.set('Billing settings updated.');this.load();},error:e=>{this.saving.set(false);this.error.set(e?.error?.message??'Unable to update billing settings.');}});}
  money(value:number,currency:string){return new Intl.NumberFormat(undefined,{style:'currency',currency:currency||'ZAR'}).format((value||0)/100);}
  date(v:string){return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));}
}
