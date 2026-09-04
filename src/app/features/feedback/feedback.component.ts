import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page-enter feedback-page">
      <header class="page-head"><div><span class="eyebrow">Feedback</span><h1>Rate your LearnFlow experience</h1><p class="muted">Your feedback is saved and sent directly to the LearnFlow administrator.</p></div></header>
      <div class="feedback-card">
        <div class="rating-wrap"><span>Overall rating</span><div class="stars" aria-label="Choose a rating from 1 to 5">@for(star of [1,2,3,4,5];track star){<button type="button" [class.active]="rating>=star" (click)="rating=star" [attr.aria-label]="star + ' stars'">★</button>}</div><small>{{rating ? rating + '/5' : 'Select a rating'}}</small></div>
        <mat-form-field appearance="outline"><mat-label>Feedback area</mat-label><mat-select [(ngModel)]="category"><mat-option value="GENERAL">General</mat-option><mat-option value="USABILITY">Usability</mat-option><mat-option value="AI">AI features</mat-option><mat-option value="LEARNING">Learning workflow</mat-option><mat-option value="VIDEO">Video Finder</mat-option><mat-option value="OTHER">Other</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Subject</mat-label><input matInput [(ngModel)]="subject" maxlength="160"></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tell me more</mat-label><textarea matInput rows="7" [(ngModel)]="message" maxlength="5000" placeholder="What worked well? What should improve?"></textarea></mat-form-field>
        <button mat-flat-button class="primary-cta" [disabled]="sending() || !rating || message.trim().length<5" (click)="submit()">{{sending()?'Sending…':'Send feedback'}}</button>
        @if(success()){<div class="success-box">{{success()}}</div>}
        @if(error()){<div class="error-box">{{error()}}</div>}
      </div>
    </section>
  `,
  styles:[`.feedback-page{max-width:880px;margin:auto}.feedback-card{display:grid;gap:14px;background:#fff;border:1px solid #e4e7ec;border-radius:18px;padding:24px}.rating-wrap{display:flex;flex-direction:column;gap:6px}.rating-wrap>span{font-weight:750}.stars{display:flex;gap:5px}.stars button{border:0;background:transparent;font-size:2rem;line-height:1;color:#d0d5dd;cursor:pointer;padding:2px}.stars button.active{color:#f79009}.rating-wrap small{color:#667085}.success-box,.error-box{padding:12px 14px;border-radius:10px}.success-box{background:#ecfdf3;color:#027a48}.error-box{background:#fff1f0;color:#b42318}@media(max-width:640px){.feedback-card{padding:16px}.stars button{font-size:1.75rem}}`]
})
export class FeedbackComponent{
  private api=inject(ApiService);rating=0;category='GENERAL';subject='LearnFlow feedback';message='';readonly sending=signal(false);readonly success=signal('');readonly error=signal('');
  submit(){if(this.sending())return;this.sending.set(true);this.success.set('');this.error.set('');this.api.post('/api/v1/messages/feedback',{rating:this.rating,category:this.category,subject:this.subject.trim()||'LearnFlow feedback',message:this.message.trim()}).subscribe({next:(r:any)=>{this.sending.set(false);this.success.set(r?.message??'Thanks for your feedback.');this.message='';},error:e=>{this.sending.set(false);this.error.set(e?.error?.message??'Unable to send feedback right now.');}});}
}
