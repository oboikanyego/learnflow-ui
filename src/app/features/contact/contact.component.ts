import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterLink],
  styleUrl: './contact.component.css',
  template: `
    <section class="public-info-page contact-page page-enter">
      <div class="contact-layout">
        <div class="public-info-hero contact-copy">
          <span class="eyebrow">Contact us</span>
          <h1>Questions, feedback or ideas for LearnFlow?</h1>
          <p>Use the form to prepare your message. We keep this page public so visitors can understand the product and share feedback before creating an account.</p>
          <div class="contact-points">
            <div><strong>Product feedback</strong><span>Tell us what would make planning and learning easier.</span></div>
            <div><strong>Support</strong><span>Describe what you were trying to do and what happened.</span></div>
            <div><strong>Feature ideas</strong><span>Share workflow, dashboard or collaboration ideas.</span></div>
          </div>
        </div>

        <div class="contact-card">
          <h2>Send a message</h2>
          <p class="muted">Complete the form and copy the prepared message into your preferred email or support channel.</p>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" [(ngModel)]="email"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Subject</mat-label><input matInput [(ngModel)]="subject"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Message</mat-label><textarea matInput rows="6" [(ngModel)]="message"></textarea></mat-form-field>
          <button mat-flat-button class="primary-cta" type="button" (click)="prepare()" [disabled]="!name.trim() || !email.trim() || !message.trim()">Prepare message</button>

          @if (prepared()) {
            <div class="prepared-message">
              <strong>Your message is ready</strong>
              <pre>{{ prepared() }}</pre>
              <p>Copy this message into the contact channel you prefer.</p>
            </div>
          }
        </div>
      </div>

      <div class="contact-footer-cta"><span>Ready to try the workspace?</span><a routerLink="/register">Create a free account →</a></div>
    </section>
  `
})
export class ContactComponent {
  name = '';
  email = '';
  subject = '';
  message = '';
  readonly prepared = signal('');

  prepare(): void {
    this.prepared.set(`Name: ${this.name.trim()}\nEmail: ${this.email.trim()}\nSubject: ${this.subject.trim() || 'LearnFlow enquiry'}\n\n${this.message.trim()}`);
  }
}
