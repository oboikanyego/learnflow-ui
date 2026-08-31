import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export type ActionFieldType = 'text' | 'textarea' | 'number' | 'date' | 'time' | 'datetime-local' | 'select';

export interface ActionDialogField {
  key: string;
  label: string;
  type: ActionFieldType;
  value?: string | number;
  required?: boolean;
  min?: number;
  hint?: string;
  options?: Array<{ label: string; value: string | number }>;
}

export interface ActionDialogData {
  eyebrow?: string;
  title: string;
  description?: string;
  submitLabel?: string;
  destructive?: boolean;
  fields: ActionDialogField[];
}

@Component({
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-header">
        <span class="dialog-icon" [class.destructive]="data.destructive">{{ data.destructive ? '!' : '✦' }}</span>
        <div class="dialog-heading">
          @if (data.eyebrow) { <span class="dialog-eyebrow">{{ data.eyebrow }}</span> }
          <h2 mat-dialog-title>{{ data.title }}</h2>
          @if (data.description) { <p class="dialog-copy">{{ data.description }}</p> }
        </div>
      </div>
      <mat-dialog-content class="dialog-content">
        @for (field of data.fields; track field.key) {
          @if (field.type === 'date') {
            <mat-form-field appearance="outline" class="dialog-field lf-date-field">
              <mat-label>{{ field.label }}</mat-label>
              <input
                matInput
                readonly
                [matDatepicker]="datePicker"
                [(ngModel)]="dateValues[field.key]"
                [required]="field.required ?? false"
                (dateChange)="syncDate(field.key)">
              <mat-datepicker-toggle matIconSuffix [for]="datePicker" aria-label="Open calendar"></mat-datepicker-toggle>
              <mat-datepicker #datePicker></mat-datepicker>
              @if (field.hint) { <mat-hint>{{ field.hint }}</mat-hint> }
            </mat-form-field>
          } @else if (field.type === 'datetime-local') {
            <div class="datetime-picker-group">
              <mat-form-field appearance="outline" class="dialog-field lf-date-field">
                <mat-label>{{ field.label }} · Date</mat-label>
                <input
                  matInput
                  readonly
                  [matDatepicker]="dateTimePicker"
                  [(ngModel)]="dateValues[field.key]"
                  [required]="field.required ?? false"
                  (dateChange)="syncDateTime(field.key)">
                <mat-datepicker-toggle matIconSuffix [for]="dateTimePicker" aria-label="Open calendar"></mat-datepicker-toggle>
                <mat-datepicker #dateTimePicker></mat-datepicker>
              </mat-form-field>
              <mat-form-field appearance="outline" class="dialog-field lf-time-field">
                <mat-label>Time</mat-label>
                <input
                  matInput
                  type="time"
                  [(ngModel)]="timeValues[field.key]"
                  [required]="field.required ?? false"
                  (ngModelChange)="syncDateTime(field.key)">
              </mat-form-field>
              @if (field.hint) { <p class="datetime-hint">{{ field.hint }}</p> }
            </div>
          } @else {
            <mat-form-field appearance="outline" class="dialog-field">
              <mat-label>{{ field.label }}</mat-label>
              @if (field.type === 'textarea') {
                <textarea matInput rows="4" [(ngModel)]="values[field.key]" [required]="field.required ?? false"></textarea>
              } @else if (field.type === 'select') {
                <mat-select [(ngModel)]="values[field.key]" [required]="field.required ?? false">
                  @for (option of field.options ?? []; track option.value) { <mat-option [value]="option.value">{{ option.label }}</mat-option> }
                </mat-select>
              } @else {
                <input matInput [type]="field.type" [(ngModel)]="values[field.key]" [required]="field.required ?? false" [min]="field.min ?? null">
              }
              @if (field.hint) { <mat-hint>{{ field.hint }}</mat-hint> }
            </mat-form-field>
          }
        }
      </mat-dialog-content>
      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="button" [class.danger-action]="data.destructive" [disabled]="!isValid()" (click)="submit()">{{ data.submitLabel ?? 'Save changes' }}</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .datetime-picker-group{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:12px;align-items:start}
    .datetime-hint{grid-column:1/-1;margin:-8px 4px 6px;color:#626f86;font-size:.72rem}
    .lf-date-field input[readonly]{cursor:pointer}
    @media(max-width:560px){.datetime-picker-group{grid-template-columns:1fr}}
  `]
})
export class ActionDialogComponent {
  values: Record<string, string | number> = {};
  dateValues: Record<string, Date | null> = {};
  timeValues: Record<string, string> = {};

  constructor(readonly dialogRef: MatDialogRef<ActionDialogComponent>, @Inject(MAT_DIALOG_DATA) readonly data: ActionDialogData) {
    for (const field of data.fields) {
      const initial = field.value ?? '';
      this.values[field.key] = initial;

      if (field.type === 'date') {
        this.dateValues[field.key] = this.parseDateValue(initial);
      }

      if (field.type === 'datetime-local') {
        this.dateValues[field.key] = this.parseDateValue(initial);
        this.timeValues[field.key] = this.extractTime(initial);
      }
    }
  }

  syncDate(key: string): void {
    const date = this.dateValues[key];
    this.values[key] = date ? this.toLocalDate(date) : '';
  }

  syncDateTime(key: string): void {
    const date = this.dateValues[key];
    const time = this.timeValues[key];
    this.values[key] = date && time ? `${this.toLocalDate(date)}T${time}` : '';
  }

  isValid(): boolean {
    return this.data.fields.every(field => !field.required || String(this.values[field.key] ?? '').trim().length > 0);
  }

  submit(): void {
    for (const field of this.data.fields) {
      if (field.type === 'date') this.syncDate(field.key);
      if (field.type === 'datetime-local') this.syncDateTime(field.key);
    }
    if (this.isValid()) this.dialogRef.close(this.values);
  }

  private parseDateValue(value: string | number): Date | null {
    if (!value) return null;
    const raw = String(value);
    const datePart = raw.slice(0, 10);
    const parts = datePart.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private extractTime(value: string | number): string {
    if (!value) return '';
    const match = String(value).match(/T(\d{2}:\d{2})/);
    return match?.[1] ?? '';
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export interface ConfirmDialogData { eyebrow?: string; title: string; description: string; confirmLabel?: string; destructive?: boolean; }

@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-shell confirm-dialog">
      <div class="dialog-header">
        <span class="dialog-icon" [class.destructive]="data.destructive">{{ data.destructive ? '!' : '?' }}</span>
        <div class="dialog-heading">
          @if (data.eyebrow) { <span class="dialog-eyebrow">{{ data.eyebrow }}</span> }
          <h2 mat-dialog-title>{{ data.title }}</h2>
          <p class="dialog-copy">{{ data.description }}</p>
        </div>
      </div>
      @if (data.destructive) {
        <div class="dialog-warning"><span>⚠</span><div><strong>This action cannot be undone.</strong><br>Only continue if you are sure you no longer need this item.</div></div>
      }
      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button type="button" (click)="dialogRef.close(false)">Keep it</button>
        <button mat-flat-button type="button" [class.danger-action]="data.destructive" (click)="dialogRef.close(true)">{{ data.confirmLabel ?? 'Confirm' }}</button>
      </mat-dialog-actions>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(readonly dialogRef: MatDialogRef<ConfirmDialogComponent>, @Inject(MAT_DIALOG_DATA) readonly data: ConfirmDialogData) {}
}
