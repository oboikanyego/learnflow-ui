import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';

interface BillingCatalog {
  configured:boolean;
  enabled:boolean;
  provider:string;
  currency:string;
  graceDays:number;
  plans:{FREE:{monthlyAmountMinor:number;yearlyAmountMinor:number};PRO:{monthlyAmountMinor:number;yearlyAmountMinor:number}};
}
interface Subscription {
  status:string;
  billingInterval:'MONTHLY'|'YEARLY';
  amountMinor:number;
  currency:string;
  currentPeriodEnd?:string;
  nextBillingAt?:string;
  cancelAtPeriodEnd:boolean;
  provider:string;
}
interface BillingResponse{
  catalog:BillingCatalog;
  subscription:Subscription|null;
  effectivePlan:'FREE'|'PRO';
  entitlementStatus:'ACTIVE'|'INACTIVE'|'GRACE';
  entitlementSource:'SYSTEM'|'ADMIN'|'BILLING';
  entitlementEndsAt?:string;
}
interface CheckoutResponse{provider:string;checkoutUrl:string;reference:string;interval:'MONTHLY'|'YEARLY'}

@Component({
  standalone:true,
  imports:[MatButtonModule],
  template:`
    <section class="page-enter billing-page">
      <div class="page-head"><div><span class="eyebrow">Account</span><h1>Billing & subscription</h1><p class="muted">Review your LearnFlow plan, billing state and upgrade options.</p></div></div>
      @if(data();as d){
        <div class="billing-grid">
          <article class="plan-card current"><div class="plan-head"><div><span class="mini-label">Current plan</span><h2>{{d.effectivePlan}}</h2></div><span class="status-pill">{{d.entitlementStatus}}</span></div>
            <p>{{d.effectivePlan==='PRO'?'Higher AI allowances and Pro capabilities are enabled while your entitlement is active.':'Core learning planning, reminders, board and standard AI allowances are included.'}}</p>
            @if(d.subscription){<dl><div><dt>Subscription status</dt><dd>{{d.subscription.status}}</dd></div><div><dt>Provider</dt><dd>{{d.subscription.provider}}</dd></div><div><dt>Billing interval</dt><dd>{{d.subscription.billingInterval}}</dd></div><div><dt>Amount</dt><dd>{{money(d.subscription.amountMinor,d.subscription.currency)}}</dd></div><div><dt>Next billing</dt><dd>{{date(d.subscription.nextBillingAt||d.subscription.currentPeriodEnd)}}</dd></div></dl>}
          </article>
          <article class="plan-card pro"><div class="plan-head"><div><span class="mini-label">Upgrade option</span><h2>LearnFlow Pro</h2></div><strong>{{money(d.catalog.plans.PRO.monthlyAmountMinor,d.catalog.currency)}}<small>/month</small></strong></div>
            <ul><li>20 AI planner generations per day</li><li>100 AI coach requests per day</li><li>Advanced analytics entitlement</li><li>Priority AI queue capability</li><li>Weekly progress email capability</li></ul>
            @if(d.effectivePlan!=='PRO'){
              <div class="billing-actions"><button mat-flat-button class="primary-cta" (click)="checkout('MONTHLY')" [disabled]="busy()||!d.catalog.enabled">Upgrade monthly</button><button mat-stroked-button (click)="checkout('YEARLY')" [disabled]="busy()||!d.catalog.enabled">Yearly · {{money(d.catalog.plans.PRO.yearlyAmountMinor,d.catalog.currency)}}</button></div>
            }@else if(canCancel(d.subscription)){
              <button mat-stroked-button (click)="cancel()" [disabled]="busy()">Cancel at period end</button>
            }
            @if(d.subscription?.status==='PENDING'){
              <div class="provider-note"><strong>Payment confirmation pending</strong><span>Your plan remains {{d.effectivePlan}} until Paystack confirms the subscription.</span></div>
            }
            @if(!d.catalog.configured||!d.catalog.enabled){<div class="provider-note"><strong>Checkout is not available yet</strong><span>Billing must be fully configured and enabled by LearnFlow before upgrades can start.</span></div>}
          </article>
        </div>
        @if(message()){<div class="billing-message">{{message()}}</div>}
      }@else if(error()){<div class="billing-error">{{error()}}</div>}
    </section>
  `,
  styles:[`
    .billing-page{max-width:1100px;margin:0 auto}.billing-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.plan-card{background:#fff;border:1px solid #dfe5ed;border-radius:20px;padding:24px}.plan-card.pro{background:linear-gradient(145deg,#f8fbff,#fff)}.plan-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.plan-head h2{margin:4px 0 8px;color:#10233f;font-size:1.65rem}.plan-head>strong{color:#10233f;font-size:1.35rem}.plan-head small{font-size:.68rem;color:#7a869a}.status-pill{padding:6px 9px;border-radius:999px;background:#e6f4ea;color:#216e4e;font-size:.68rem;font-weight:850}.plan-card p,.plan-card li{color:#66758a;line-height:1.6}.plan-card ul{padding-left:20px}.plan-card dl{margin:22px 0 0}.plan-card dl div{display:flex;justify-content:space-between;padding:10px 0;border-top:1px solid #edf1f5}.plan-card dt{color:#7a869a}.plan-card dd{margin:0;color:#10233f;font-weight:750}.billing-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.provider-note,.billing-message,.billing-error{margin-top:18px;padding:14px;border-radius:12px}.provider-note{display:flex;flex-direction:column;background:#fff7e6;color:#7a4d00}.provider-note span{font-size:.76rem;margin-top:3px}.billing-message{background:#eaf3ff;color:#174ea6}.billing-error{background:#fff1f0;color:#a61b1b}@media(max-width:800px){.billing-grid{grid-template-columns:1fr}}
  `]
})
export class BillingComponent implements OnInit{
  private readonly api=inject(ApiService);readonly data=signal<BillingResponse|null>(null);readonly error=signal('');readonly message=signal('');readonly busy=signal(false);
  ngOnInit(){this.load();}
  load(){this.error.set('');this.api.get<BillingResponse>('/api/v1/billing/subscription').subscribe({next:v=>this.data.set(v),error:e=>this.error.set(e?.error?.message??'Unable to load billing details.')});}
  checkout(interval:'MONTHLY'|'YEARLY'){this.busy.set(true);this.message.set('');this.api.post<{interval:'MONTHLY'|'YEARLY'},CheckoutResponse>('/api/v1/billing/checkout',{interval}).subscribe({next:r=>{this.busy.set(false);window.location.assign(r.checkoutUrl);},error:e=>{this.busy.set(false);this.message.set(e?.error?.message??'Checkout is unavailable.');}});}
  cancel(){this.busy.set(true);this.message.set('');this.api.post('/api/v1/billing/cancel',{}).subscribe({next:()=>{this.busy.set(false);this.load();},error:e=>{this.busy.set(false);this.message.set(e?.error?.message??'Cancellation is unavailable.');}});}
  canCancel(subscription:Subscription|null){return !!subscription&&['ACTIVE','PAST_DUE'].includes(subscription.status)&&!subscription.cancelAtPeriodEnd;}
  money(minor:number,currency:string){return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(minor/100);}
  date(value?:string){return value?new Intl.DateTimeFormat(undefined,{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)):'—';}
}
