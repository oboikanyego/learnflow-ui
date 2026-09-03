import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';

type TimezoneOption = { value: string; label: string };

const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'Africa/Johannesburg', label: 'Johannesburg, South Africa' },
  { value: 'UTC', label: 'UTC · Coordinated Universal Time' },
  { value: 'Europe/London', label: 'London, United Kingdom' },
  { value: 'Europe/Paris', label: 'Paris, France' },
  { value: 'America/New_York', label: 'New York, United States' },
  { value: 'America/Chicago', label: 'Chicago, United States' },
  { value: 'America/Denver', label: 'Denver, United States' },
  { value: 'America/Los_Angeles', label: 'Los Angeles, United States' },
  { value: 'Asia/Dubai', label: 'Dubai, United Arab Emirates' },
  { value: 'Asia/Kolkata', label: 'Kolkata, India' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Japan' },
  { value: 'Australia/Sydney', label: 'Sydney, Australia' }
];

@Component({
  standalone:true,
  imports:[FormsModule,MatButtonModule,MatFormFieldModule,MatInputModule,MatSelectModule],
  template:`
    <section class="page-enter profile-page">
      <div class="page-head"><div><span class="eyebrow">Account</span><h1>Profile & security</h1><p class="muted">Manage your identity, learning timezone, password and current LearnFlow plan.</p></div></div>
      <div class="profile-grid">
        <article class="profile-card identity-card">
          <div class="card-head"><div><span class="mini-label">Profile</span><h3>Personal information</h3><p>Used across your workspace, reminders and account experience.</p></div></div>

          <div class="profile-photo-editor">
            <div class="profile-photo-shell">
              @if(auth.user()?.profileImageUrl){
                <img [src]="auth.user()?.profileImageUrl" [alt]="(auth.user()?.name || name || 'User') + ' profile picture'">
              } @else {
                <span>{{initials()}}</span>
              }
            </div>
            <div class="profile-photo-copy">
              <strong>Profile picture</strong>
              <span>JPG, PNG or WebP. Maximum 5 MB. LearnFlow stores the image securely in Cloudinary.</span>
              <div class="photo-actions">
                <input #photoInput class="file-input" type="file" accept="image/jpeg,image/png,image/webp" (change)="onProfileImageSelected($event)">
                <button mat-stroked-button type="button" [disabled]="uploadingImage()" (click)="photoInput.click()">{{uploadingImage()?'Uploading…':(auth.user()?.profileImageUrl?'Replace picture':'Upload picture')}}</button>
                @if(auth.user()?.profileImageUrl){<button mat-button type="button" class="remove-photo" [disabled]="uploadingImage()" (click)="removeProfileImage()">Remove</button>}
              </div>
            </div>
          </div>

          <mat-form-field appearance="outline"><mat-label>Full name</mat-label><input matInput [(ngModel)]="name"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput [value]="email" disabled><mat-hint>Email changes will require verification in a later phase.</mat-hint></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Timezone</mat-label>
            <mat-select [(ngModel)]="timezone" placeholder="Select your timezone">
              @for(zone of timezones;track zone.value){<mat-option [value]="zone.value">{{zone.label}}</mat-option>}
            </mat-select>
            <mat-hint>Controls lesson times, reminders and weekly activity reporting.</mat-hint>
          </mat-form-field>
          @if(profileMessage()){<div class="feedback success">{{profileMessage()}}</div>}@if(profileError()){<div class="feedback error">{{profileError()}}</div>}
          <div class="actions"><button mat-flat-button class="primary-cta" [disabled]="savingProfile()" (click)="saveProfile()">{{savingProfile()?'Saving…':'Save profile'}}</button></div>
        </article>

        <article class="profile-card plan-card">
          <div class="plan-top"><span class="mini-label">Entitlement</span><span class="plan-pill">{{auth.user()?.entitlement?.plan||'FREE'}}</span></div>
          <h3>{{auth.user()?.entitlement?.plan==='PRO'?'LearnFlow Pro':'LearnFlow Free'}}</h3>
          <p>Your entitlement controls access and future plan-specific AI allowances. Billing is not enabled yet, so upgrades cannot be purchased from this screen.</p>
          <div class="entitlement-list"><div><span>Plan status</span><strong>{{auth.user()?.entitlement?.status||'ACTIVE'}}</strong></div><div><span>Account role</span><strong>{{auth.user()?.role||'learner'}}</strong></div><div><span>Managed by</span><strong>{{auth.user()?.entitlement?.source||'SYSTEM'}}</strong></div></div>
          <div class="plan-note">Free and Pro currently share the same AI limits while LearnFlow validates real usage. The entitlement layer is now ready for billing and plan-specific limits later.</div>
        </article>

        <article class="profile-card security-card">
          <div class="card-head"><div><span class="mini-label">Security</span><h3>Change password</h3><p>Confirm your current password before choosing a new one.</p></div></div>
          <mat-form-field appearance="outline"><mat-label>Current password</mat-label><input matInput [type]="showCurrent?'text':'password'" [(ngModel)]="currentPassword"><button mat-button matSuffix type="button" (click)="showCurrent=!showCurrent">{{showCurrent?'Hide':'Show'}}</button></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>New password</mat-label><input matInput [type]="showNew?'text':'password'" [(ngModel)]="newPassword"><button mat-button matSuffix type="button" (click)="showNew=!showNew">{{showNew?'Hide':'Show'}}</button><mat-hint>Use at least 8 characters.</mat-hint></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Confirm new password</mat-label><input matInput [type]="showNew?'text':'password'" [(ngModel)]="confirmPassword"></mat-form-field>
          @if(passwordMessage()){<div class="feedback success">{{passwordMessage()}}</div>}@if(passwordError()){<div class="feedback error">{{passwordError()}}</div>}
          <div class="actions"><button mat-stroked-button [disabled]="savingPassword()||!passwordValid()" (click)="changePassword()">{{savingPassword()?'Updating…':'Update password'}}</button></div>
        </article>
      </div>
    </section>
  `,
  styles:[`
    .profile-page{max-width:1180px;margin:0 auto}.profile-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:18px}.profile-card{background:#fff;border:1px solid #e4e7ec;border-radius:18px;padding:24px;box-shadow:0 1px 2px rgba(16,24,40,.03)}.identity-card,.security-card{display:flex;flex-direction:column;gap:8px}.security-card{grid-column:1/-1}.card-head,.plan-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.card-head h3,.plan-card h3{margin:4px 0 5px;color:#101828}.card-head p,.plan-card p{margin:0 0 12px;color:#667085;line-height:1.55;font-size:.83rem}.profile-photo-editor{display:grid;grid-template-columns:76px minmax(0,1fr);gap:16px;align-items:center;padding:14px;margin:2px 0 8px;border:1px solid #e4e7ec;border-radius:14px;background:#fcfcfd}.profile-photo-shell{width:72px;height:72px;border-radius:18px;overflow:hidden;display:grid;place-items:center;background:#eff4ff;color:#175cd3;font-weight:850;font-size:1.05rem;border:1px solid #dbe5ff}.profile-photo-shell img{width:100%;height:100%;object-fit:cover;display:block}.profile-photo-copy{min-width:0;display:flex;flex-direction:column;gap:5px}.profile-photo-copy>strong{font-size:.82rem;color:#101828}.profile-photo-copy>span{font-size:.72rem;color:#667085;line-height:1.45}.photo-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:3px}.file-input{display:none}.remove-photo{color:#b42318!important}.identity-card mat-form-field,.security-card mat-form-field{width:100%}.actions{display:flex;justify-content:flex-end;margin-top:4px}.plan-card{background:linear-gradient(160deg,#101828,#173b68);color:#fff}.plan-card .mini-label{color:#b2ccff}.plan-card h3{color:#fff;font-size:1.35rem}.plan-card p{color:#d0d5dd}.plan-pill{padding:6px 9px;border-radius:999px;background:#d1e9ff;color:#0b4a6f;font-size:.68rem;font-weight:850}.entitlement-list{display:grid;gap:8px;margin:18px 0}.entitlement-list div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:.78rem}.entitlement-list span{color:#98a2b3}.entitlement-list strong{color:#fff}.plan-note{padding:13px;border-radius:12px;background:rgba(255,255,255,.08);color:#d0d5dd;font-size:.74rem;line-height:1.55}.feedback{padding:10px 12px;border-radius:10px;font-size:.78rem}.feedback.success{background:#ecfdf3;color:#067647;border:1px solid #abefc6}.feedback.error{background:#fef3f2;color:#b42318;border:1px solid #fecdca}@media(max-width:850px){.profile-grid{grid-template-columns:1fr}.security-card{grid-column:auto}}@media(max-width:560px){.profile-card{padding:18px}.profile-photo-editor{grid-template-columns:1fr;text-align:center}.profile-photo-shell{margin:0 auto}.photo-actions{justify-content:center}}
  `]
})
export class ProfileComponent implements OnInit{
  readonly auth=inject(AuthService);name='';email='';timezone='UTC';currentPassword='';newPassword='';confirmPassword='';showCurrent=false;showNew=false;
  readonly savingProfile=signal(false);readonly savingPassword=signal(false);readonly uploadingImage=signal(false);readonly profileMessage=signal('');readonly profileError=signal('');readonly passwordMessage=signal('');readonly passwordError=signal('');
  readonly timezones: TimezoneOption[] = [...TIMEZONE_OPTIONS];

  ngOnInit(){this.auth.loadProfile().subscribe({next:user=>{this.name=user.name;this.email=user.email;this.timezone=user.timezone;if(!this.timezones.some(zone=>zone.value===user.timezone))this.timezones.unshift({value:user.timezone,label:this.friendlyTimezone(user.timezone)});}});}
  initials(){return(this.auth.user()?.name||this.name||'LF').split(/\s+/).slice(0,2).map(v=>v[0]??'').join('').toUpperCase();}
  saveProfile(){if(this.savingProfile())return;this.profileMessage.set('');this.profileError.set('');this.savingProfile.set(true);this.auth.updateProfile({name:this.name.trim(),timezone:this.timezone}).subscribe({next:()=>{this.profileMessage.set('Profile updated successfully.');this.savingProfile.set(false);},error:e=>{this.profileError.set(e.error?.message??'Unable to update profile.');this.savingProfile.set(false);}});}
  onProfileImageSelected(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];input.value='';if(!file)return;this.profileMessage.set('');this.profileError.set('');if(!['image/jpeg','image/png','image/webp'].includes(file.type)){this.profileError.set('Choose a JPG, PNG or WebP image.');return;}if(file.size>5*1024*1024){this.profileError.set('Profile pictures must be 5 MB or smaller.');return;}this.uploadingImage.set(true);this.auth.uploadProfileImage(file).subscribe({next:r=>{this.profileMessage.set(r.message);this.uploadingImage.set(false);},error:e=>{this.profileError.set(e.error?.message??'Unable to upload profile picture.');this.uploadingImage.set(false);}});}
  removeProfileImage(){if(this.uploadingImage())return;this.profileMessage.set('');this.profileError.set('');this.uploadingImage.set(true);this.auth.removeProfileImage().subscribe({next:r=>{this.profileMessage.set(r.message);this.uploadingImage.set(false);},error:e=>{this.profileError.set(e.error?.message??'Unable to remove profile picture.');this.uploadingImage.set(false);}});}
  passwordValid(){return this.currentPassword.length>=8&&this.newPassword.length>=8&&this.newPassword===this.confirmPassword;}
  changePassword(){if(!this.passwordValid()||this.savingPassword())return;this.passwordMessage.set('');this.passwordError.set('');this.savingPassword.set(true);this.auth.changePassword({currentPassword:this.currentPassword,newPassword:this.newPassword}).subscribe({next:r=>{this.passwordMessage.set(r.message);this.currentPassword='';this.newPassword='';this.confirmPassword='';this.savingPassword.set(false);},error:e=>{this.passwordError.set(e.error?.message??'Unable to change password.');this.savingPassword.set(false);}});}

  private friendlyTimezone(value:string):string{
    if(value==='UTC')return'UTC · Coordinated Universal Time';
    const parts=value.split('/');
    const city=(parts.at(-1)??value).replaceAll('_',' ');
    const region=parts.length>1?parts[0].replaceAll('_',' '):'';
    return region?`${city} · ${region}`:city;
  }
}
