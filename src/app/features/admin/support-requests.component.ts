import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';

interface SupportRequest {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface SupportResponse {
  items: SupportRequest[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  counts: Partial<Record<'OPEN' | 'IN_PROGRESS' | 'RESOLVED', number>>;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page-enter support-admin-page">
      <header class="page-head">
        <div><span class="eyebrow">Administration</span><h1>Support requests</h1><p class="muted">Review user issues, move work through the support queue and notify the user in-app when a request is resolved.</p></div>
        <button mat-stroked-button type="button" (click)="load()">Refresh</button>
      </header>

      @if (data(); as d) {
        <div class="summary-grid">
          <article><span>Open</span><strong>{{d.counts.OPEN || 0}}</strong></article>
          <article><span>In progress</span><strong>{{d.counts.IN_PROGRESS || 0}}</strong></article>
          <article><span>Resolved</span><strong>{{d.counts.RESOLVED || 0}}</strong></article>
          <article><span>Total</span><strong>{{d.total}}</strong></article>
        </div>

        <div class="filters">
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [(ngModel)]="status" (selectionChange)="setPage(1)"><mat-option value="">All</mat-option><mat-option value="OPEN">Open</mat-option><mat-option value="IN_PROGRESS">In progress</mat-option><mat-option value="RESOLVED">Resolved</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Search</mat-label><input matInput [(ngModel)]="query" (keyup.enter)="setPage(1)" placeholder="Name, email, subject..."></mat-form-field>
          <button mat-flat-button type="button" (click)="setPage(1)">Apply</button>
        </div>

        <div class="request-list">
          @for (item of d.items; track item._id) {
            <article class="request-card">
              <div class="request-head"><div><span class="status" [attr.data-status]="item.status">{{label(item.status)}}</span><h2>{{item.subject}}</h2><p>{{item.name}} · {{item.email}} · {{item.category || 'Other'}} · {{item.createdAt | date:'medium'}}</p></div></div>
              <p class="message">{{item.message}}</p>
              @if (item.status === 'RESOLVED' && item.resolutionNote) {<div class="resolution"><strong>Resolution</strong><span>{{item.resolutionNote}}</span></div>}
              <div class="actions">
                @if (item.status !== 'IN_PROGRESS') {<button mat-stroked-button type="button" (click)="updateStatus(item, 'IN_PROGRESS')">Mark in progress</button>}
                @if (item.status !== 'RESOLVED') {<button mat-flat-button type="button" (click)="resolve(item)">Resolve</button>}
                @if (item.status === 'RESOLVED') {<button mat-stroked-button type="button" (click)="updateStatus(item, 'OPEN')">Reopen</button>}
              </div>
            </article>
          } @empty {<div class="empty">No support requests match these filters.</div>}
        </div>

        @if (d.totalPages > 1) {<footer class="pager"><button mat-stroked-button (click)="setPage(d.page - 1)" [disabled]="d.page <= 1">Previous</button><span>Page {{d.page}} of {{d.totalPages}}</span><button mat-stroked-button (click)="setPage(d.page + 1)" [disabled]="d.page >= d.totalPages">Next</button></footer>}
      } @else if (error()) {<div class="error">{{error()}}</div>} @else {<div class="loading">Loading support requests…</div>}
    </section>
  `,
  styles: [`
    .support-admin-page{max-width:1180px;margin:0 auto}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}.summary-grid article{padding:18px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}.summary-grid span{display:block;color:#667085;font-size:.72rem}.summary-grid strong{display:block;margin-top:5px;font-size:1.6rem;color:#101828}.filters{display:grid;grid-template-columns:220px minmax(0,1fr) auto;gap:12px;align-items:start;margin-bottom:16px}.request-list{display:grid;gap:12px}.request-card{padding:20px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}.request-head h2{margin:8px 0 5px;font-size:1.05rem}.request-head p{margin:0;color:#667085;font-size:.76rem;overflow-wrap:anywhere}.status{display:inline-flex;padding:5px 8px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:.65rem;font-weight:800}.status[data-status="OPEN"]{background:#fff4e5;color:#b54708}.status[data-status="IN_PROGRESS"]{background:#eff4ff;color:#1849a9}.status[data-status="RESOLVED"]{background:#ecfdf3;color:#027a48}.message{margin:16px 0;color:#344054;line-height:1.65;white-space:pre-wrap}.resolution{padding:12px;border-radius:10px;background:#f6fef9;display:flex;flex-direction:column;gap:4px;color:#027a48}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.pager{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-top:18px}.empty,.error,.loading{padding:28px;border:1px dashed #d0d5dd;border-radius:14px;text-align:center;color:#667085}@media(max-width:760px){.summary-grid{grid-template-columns:repeat(2,1fr)}.filters{grid-template-columns:1fr}.actions button{width:100%}}
  `]
})
export class SupportRequestsComponent {
  private readonly api = inject(ApiService);
  readonly data = signal<SupportResponse | null>(null);
  readonly error = signal('');
  page = 1;
  status = '';
  query = '';

  constructor() { this.load(); }

  load(): void {
    this.error.set('');
    const params = new URLSearchParams({ page: String(this.page), pageSize: '12' });
    if (this.status) params.set('status', this.status);
    if (this.query.trim()) params.set('q', this.query.trim());
    this.api.get<SupportResponse>(`/admin/support-requests?${params.toString()}`).subscribe({ next: value => this.data.set(value), error: err => this.error.set(err?.error?.message || 'Unable to load support requests.') });
  }

  setPage(page: number): void { this.page = Math.max(1, page); this.load(); }
  label(value: string): string { return value.replace('_', ' ').toLowerCase().replace(/^./, char => char.toUpperCase()); }

  updateStatus(item: SupportRequest, status: SupportRequest['status'], resolutionNote?: string): void {
    this.api.patch(`/admin/support-requests/${item._id}/status`, { status, ...(resolutionNote ? { resolutionNote } : {}) }).subscribe({ next: () => this.load(), error: err => this.error.set(err?.error?.message || 'Unable to update support request.') });
  }

  resolve(item: SupportRequest): void {
    const note = window.prompt('Optional resolution note to include in the user notification:', '') ?? '';
    this.updateStatus(item, 'RESOLVED', note.trim());
  }
}
