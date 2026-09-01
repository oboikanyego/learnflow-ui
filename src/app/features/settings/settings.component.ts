import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AuthService, type NotificationPreferences } from '../../core/auth/auth.service';

const DEFAULTS: NotificationPreferences = {
  inAppReminders: true,
  emailReminders: true,
  reminderMinutes: 30,
  missedSessionEmails: true,
  celebrationEmails: true,
  weeklyReviewEmails: false
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatSelectModule],
  template: `
    <section class="settings-page page-enter">
      <div class="page-head">
        <div>
          <span class="eyebrow">Personal preferences</span>
          <h1>Notification settings</h1>
          <p class="muted">Choose how LearnFlow keeps you accountable without becoming noisy.</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card class="settings-card">
          <mat-card-content>
            <div class="setting-group-head"><div><span class="mini-label">Lesson reminders</span><h3>Upcoming learning sessions</h3><p>Control where reminders appear and how early LearnFlow should send them.</p></div></div>
            <div class="setting-row"><div><strong>In-app reminders</strong><span>Show an unread LearnFlow notification before scheduled lessons.</span></div><mat-checkbox formControlName="inAppReminders" aria-label="Enable in-app reminders"></mat-checkbox></div>
            <div class="setting-row"><div><strong>Email reminders</strong><span>Send a branded reminder email before each scheduled lesson.</span></div><mat-checkbox formControlName="emailReminders" aria-label="Enable email reminders"></mat-checkbox></div>
            <div class="setting-select"><div><strong>Remind me before a lesson</strong><span>This timing applies to both enabled reminder channels.</span></div><mat-form-field appearance="outline"><mat-label>Reminder time</mat-label><mat-select formControlName="reminderMinutes"><mat-option [value]="5">5 minutes before</mat-option><mat-option [value]="15">15 minutes before</mat-option><mat-option [value]="30">30 minutes before</mat-option><mat-option [value]="60">1 hour before</mat-option><mat-option [value]="120">2 hours before</mat-option><mat-option [value]="1440">1 day before</mat-option></mat-select></mat-form-field></div>
          </mat-card-content>
        </mat-card>

        <mat-card class="settings-card">
          <mat-card-content>
            <div class="setting-group-head"><div><span class="mini-label">Email preferences</span><h3>Progress and encouragement</h3><p>Keep the useful messages and switch off the ones you do not need.</p></div></div>
            <div class="setting-row"><div><strong>Missed-session emails</strong><span>Receive a gentle email with a direct route back to reschedule a missed lesson.</span></div><mat-checkbox formControlName="missedSessionEmails" aria-label="Enable missed session emails"></mat-checkbox></div>
            <div class="setting-row"><div><strong>Celebration emails</strong><span>Receive a confirmation when a new manual, imported, or AI-generated learning plan is ready.</span></div><mat-checkbox formControlName="celebrationEmails" aria-label="Enable celebration emails"></mat-checkbox></div>
            <div class="setting-row"><div><strong>Weekly learning review</strong><span>Receive a Monday summary of study time, completion, streaks and focus areas. Delivery requires an active Pro entitlement.</span></div><mat-checkbox formControlName="weeklyReviewEmails" aria-label="Enable weekly learning review emails"></mat-checkbox></div>
          </mat-card-content>
        </mat-card>

        <div class="settings-note"><span>ⓘ</span><p><strong>Account and security emails stay enabled.</strong> Password resets and important account-security messages are transactional and are not controlled by these preferences.</p></div>
        @if (error()) { <div class="notification unread"><strong>Could not save settings</strong><span>{{ error() }}</span></div> }
        @if (success()) { <div class="notification"><strong>Preferences saved</strong><span>Your future LearnFlow notifications will use these settings.</span></div> }
        <div class="settings-actions"><button mat-stroked-button type="button" (click)="resetDefaults()" [disabled]="saving()">Restore defaults</button><button mat-flat-button class="primary-cta" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving…' : 'Save preferences' }}</button></div>
      </form>
    </section>
  `,
  styles: [`
    .settings-page{max-width:900px;margin:0 auto}.settings-page form{display:grid;gap:18px}.settings-card{border:1px solid #dcdfe4!important;border-radius:14px!important;box-shadow:0 8px 24px rgba(9,30,66,.05)!important}.settings-card mat-card-content{padding:24px!important}.setting-group-head{padding-bottom:18px;border-bottom:1px solid #e7e9ec}.setting-group-head h3{margin:5px 0 4px;color:#172b4d}.setting-group-head p{margin:0;color:#626f86;font-size:.84rem}.setting-row,.setting-select{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:24px;padding:18px 0;border-bottom:1px solid #edf0f2}.setting-row:last-child,.setting-select:last-child{border-bottom:0;padding-bottom:0}.setting-row>div,.setting-select>div{display:flex;flex-direction:column;gap:4px}.setting-row strong,.setting-select strong{color:#172b4d;font-size:.9rem}.setting-row span,.setting-select span{color:#626f86;font-size:.76rem;line-height:1.45}.setting-select mat-form-field{width:210px;margin-bottom:-22px}.settings-note{display:flex;align-items:flex-start;gap:12px;padding:15px 17px;border:1px solid #cfe1ff;border-radius:11px;background:#f5f9ff;color:#44546f}.settings-note>span{color:#0c66e4;font-weight:900}.settings-note p{margin:0;font-size:.78rem;line-height:1.55}.settings-actions{display:flex;justify-content:flex-end;gap:10px;padding-top:4px}@media(max-width:650px){.setting-row,.setting-select{grid-template-columns:1fr;gap:10px}.setting-select mat-form-field{width:100%;margin-bottom:-18px}.settings-actions{flex-direction:column-reverse}.settings-actions button{width:100%}}
  `]
})
export class SettingsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal(false);
  readonly form = this.fb.nonNullable.group({
    inAppReminders: [DEFAULTS.inAppReminders],
    emailReminders: [DEFAULTS.emailReminders],
    reminderMinutes: [DEFAULTS.reminderMinutes, [Validators.required, Validators.min(5), Validators.max(1440)]],
    missedSessionEmails: [DEFAULTS.missedSessionEmails],
    celebrationEmails: [DEFAULTS.celebrationEmails],
    weeklyReviewEmails: [DEFAULTS.weeklyReviewEmails]
  });

  ngOnInit(): void {
    const existing = this.auth.user()?.notificationPreferences;
    if (existing) this.form.setValue({ ...DEFAULTS, ...existing });
    else this.auth.loadProfile().subscribe({ next: user => this.form.setValue({ ...DEFAULTS, ...(user.notificationPreferences ?? {}) }) });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true); this.error.set(''); this.success.set(false);
    this.auth.updateNotificationPreferences(this.form.getRawValue()).subscribe({
      next: response => { this.form.setValue({ ...DEFAULTS, ...response.notificationPreferences }); this.saving.set(false); this.success.set(true); },
      error: err => { this.error.set(err?.error?.message ?? 'Unable to update notification preferences'); this.saving.set(false); }
    });
  }

  resetDefaults(): void {
    this.form.setValue(DEFAULTS);
    this.success.set(false);
  }
}
