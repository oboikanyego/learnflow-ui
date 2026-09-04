import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  styleUrl: './contact.component.css',
  template: `
    <section class="public-info-page contact-page page-enter">
      <div class="contact-layout">
        <div class="public-info-hero contact-copy">
          <span class="eyebrow">Contact me</span>
          <h1>Questions, feedback or ideas for LearnFlow?</h1>
          <p>Send a message directly from LearnFlow. Your message is saved securely and sent to the LearnFlow administrator.</p>
          <div class="contact-points">
            <div><strong>Product feedback</strong><span>Tell me what would make planning and learning easier.</span></div>
            <div><strong>Support</strong><span>Signed-in users can also use the dedicated support page for account or technical help.</span></div>
            <div><strong>Feature ideas</strong><span>Share workflow, dashboard or collaboration ideas.</span></div>
          </div>
        </div>

        <form class="contact-card" (ngSubmit)="submit()">
          <h2>Send a message</h2>
          <p class="muted">I’ll receive this through LearnFlow’s communication service.</p>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput name="name" [(ngModel)]="name" maxlength="80" required></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput name="email" type="email" [(ngModel)]="email" maxlength="254" required></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Subject</mat-label><input matInput name="subject" [(ngModel)]="subject" maxlength="160"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Message</mat-label><textarea matInput name="message" rows="6" [(ngModel)]="message" maxlength="5000" required></textarea></mat-form-field>
          <button mat-flat-button class="primary-cta" type="submit" [disabled]="sending() || !name.trim() || !email.trim() || message.trim().length < 5">{{ sending() ? 'Sending…' : 'Send message' }}</button>
          @if (success()) { <div class="prepared-message"><strong>Message sent</strong><p>{{ success() }}</p></div> }
          @if (error()) { <div class="error-box">{{ error() }}</div> }
        </form>
      </div>
      <div class="contact-footer-cta"><span>Ready to try the workspace?</span><a routerLink="/register">Create a free account →</a></div>
    </section>
  `
})
export class ContactComponent {
  private readonly api = inject(ApiService);
  name = '';
  email = '';
  subject = '';
  message = '';
  readonly sending = signal(false);
  readonly success = signal('');
  readonly error = signal('');

  submit(): void {
    if (this.sending()) return;
    this.error.set(''); this.success.set(''); this.sending.set(true);
    this.api.post('/api/v1/messages/contact', {
      name: this.name.trim(), email: this.email.trim(), subject: this.subject.trim() || 'LearnFlow enquiry', message: this.message.trim()
    }).subscribe({
      next: (response: any) => { this.sending.set(false); this.success.set(response?.message ?? 'Thanks — your message has been received.'); this.subject=''; this.message=''; },
      error: (e) => { this.sending.set(false); this.error.set(e?.error?.message ?? 'Unable to send your message right now. Please try again.'); }
    });
  }
}
