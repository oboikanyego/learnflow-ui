import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone:true,
  imports:[FormsModule,MatButtonModule,MatFormFieldModule,MatInputModule,MatSelectModule],
  template:`
  <section class="page-enter support-page">
    <header class="page-head"><div><span class="eyebrow">Support</span><h1>How can I help?</h1><p class="muted">Describe the problem clearly. Your request is saved and sent to the LearnFlow administrator with your signed-in account details.</p></div></header>
    <div class="support-grid">
      <form class="support-card" (ngSubmit)="submit()">
        <mat-form-field appearance="outline"><mat-label>Area</mat-label><mat-select name="category" [(ngModel)]="category"><mat-option value="ACCOUNT">Account</mat-option><mat-option value="BILLING">Billing</mat-option><mat-option value="AI">AI features</mat-option><mat-option value="LEARNING">Learning workflow</mat-option><mat-option value="VIDEO">Video Finder</mat-option><mat-option value="TECHNICAL">Technical issue</mat-option><mat-option value="OTHER">Other</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Subject</mat-label><input matInput name="subject" [(ngModel)]="subject" maxlength="160" required></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>What happened?</mat-label><textarea matInput name="message" rows="8" [(ngModel)]="message" maxlength="5000" placeholder="What were you trying to do? What did you expect? What happened instead?" required></textarea></mat-form-field>
        <button mat-flat-button class="primary-cta" type="submit" [disabled]="sending() || subject.trim().length<2 || message.trim().length<5">{{sending()?'Sending…':'Send support request'}}</button>
        @if(success()){<div class="success-box">{{success()}}</div>}
        @if(error()){<div class="error-box">{{error()}}</div>}
      </form>
      <aside class="support-tips"><h2>Include these details</h2><ul><li>The page or feature you were using</li><li>What you expected to happen</li><li>What actually happened</li><li>Any error message you saw</li><li>Whether the issue happens repeatedly</li></ul></aside>
    </div>
  </section>`,
  styles:[`.support-page{max-width:1050px;margin:auto}.support-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px}.support-card,.support-tips{background:#fff;border:1px solid #e4e7ec;border-radius:18px;padding:22px}.support-card{display:grid;gap:12px}.support-tips h2{margin-top:0;font-size:1rem}.support-tips ul{padding-left:18px;color:#667085;line-height:1.8;font-size:.86rem}.success-box,.error-box{padding:12px 14px;border-radius:10px}.success-box{background:#ecfdf3;color:#027a48}.error-box{background:#fff1f0;color:#b42318}@media(max-width:820px){.support-grid{grid-template-columns:1fr}.support-tips{order:-1}}`]
})
export class SupportComponent{
  private api=inject(ApiService);category='TECHNICAL';subject='';message='';readonly sending=signal(false);readonly success=signal('');readonly error=signal('');
  submit(){if(this.sending())return;this.sending.set(true);this.success.set('');this.error.set('');this.api.post('/api/v1/messages/support',{category:this.category,subject:this.subject.trim(),message:this.message.trim()}).subscribe({next:(r:any)=>{this.sending.set(false);this.success.set(r?.message??'Your support request has been received.');this.subject='';this.message='';},error:e=>{this.sending.set(false);this.error.set(e?.error?.message??'Unable to send your support request right now.');}});}
}
