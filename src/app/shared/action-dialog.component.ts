import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type ActionFieldType = 'text' | 'textarea' | 'number' | 'datetime-local' | 'select';

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
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="dialog-shell">
      @if (data.eyebrow) { <span class="dialog-eyebrow">{{ data.eyebrow }}</span> }
      <h2 mat-dialog-title>{{ data.title }}</h2>
      @if (data.description) { <p class="dialog-copy">{{ data.description }}</p> }

      <mat-dialog-content class="dialog-content">
        @for (field of data.fields; track field.key) {
          <mat-form-field appearance="outline" class="dialog-field">
            <mat-label>{{ field.label }}</mat-label>
            @if (field.type === 'textarea') {
              <textarea matInput rows="4" [(ngModel)]="values[field.key]" [required]="field.required ?? false"></textarea>
            } @else if (field.type === 'select') {
              <mat-select [(ngModel)]="values[field.key]" [required]="field.required ?? false">
                @for (option of field.options ?? []; track option.value) {
                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                }
              </mat-select>
            } @else {
              <input
                matInput
                [type]="field.type"
                [(ngModel)]="values[field.key]"
                [required]="field.required ?? false"
                [min]="field.min ?? null">
            }
            @if (field.hint) { <mat-hint>{{ field.hint }}</mat-hint> }
          </mat-form-field>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-flat-button type="button" [class.danger-action]="data.destructive" [disabled]="!isValid()" (click)="submit()">
          {{ data.submitLabel ?? 'Save' }}
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class ActionDialogComponent {
  values: Record<string, string | number> = {};

  constructor(
    readonly dialogRef: MatDialogRef<ActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: ActionDialogData
  ) {
    for (const field of data.fields) this.values[field.key] = field.value ?? '';
  }

  isValid(): boolean {
    return this.data.fields.every(field => !field.required || String(this.values[field.key] ?? '').trim().length > 0);
  }

  submit(): void {
    if (this.isValid()) this.dialogRef.close(this.values);
  }
}

export interface ConfirmDialogData {
  eyebrow?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
}

@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-shell confirm-dialog">
      @if (data.eyebrow) { <span class="dialog-eyebrow">{{ data.eyebrow }}</span> }
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <p class="dialog-copy">{{ data.description }}</p>
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button type="button" (click)="dialogRef.close(false)">Cancel</button>
        <button mat-flat-button type="button" [class.danger-action]="data.destructive" (click)="dialogRef.close(true)">
          {{ data.confirmLabel ?? 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `
})
export class ConfirmDialogComponent {
  constructor(
    readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmDialogData
  ) {}
}
