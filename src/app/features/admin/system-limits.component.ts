import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';

interface SystemLimit {
  _id: string;
  key: string;
  category: 'AI' | 'YOUTUBE' | 'ACCOUNT';
  label: string;
  description: string;
  value: number;
  minValue: number;
  maxValue: number;
  unit: string;
  enabled: boolean;
  updatedAt: string;
}

type LimitFilter = 'ALL' | SystemLimit['category'];

@Component({
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="limits-page page-enter">
      <header class="page-head limits-head">
        <div>
          <span class="eyebrow">Operations</span>
          <h1>System limits</h1>
          <p class="muted">Manage runtime usage quotas and age-safety thresholds without redeploying the API.</p>
        </div>
        <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">{{loading() ? 'Refreshing…' : 'Refresh'}}</button>
      </header>

      <section class="summary-grid">
        <article><span>Total limits</span><strong>{{limits().length}}</strong><small>Seeded in MongoDB</small></article>
        <article><span>AI quotas</span><strong>{{countCategory('AI')}}</strong><small>Free and Pro usage</small></article>
        <article><span>YouTube limits</span><strong>{{countCategory('YOUTUBE')}}</strong><small>Search quota protection</small></article>
        <article><span>Age policies</span><strong>{{countCategory('ACCOUNT')}}</strong><small>Registration and content safety</small></article>
      </section>

      <nav class="filter-row" aria-label="System limit categories">
        @for(option of filters;track option.value){
          <button type="button" [class.active]="filter()===option.value" (click)="setFilter(option.value)">{{option.label}}</button>
        }
      </nav>

      @if(error()) { <div class="state-card error-state"><strong>Could not load system limits</strong><span>{{error()}}</span></div> }
      @if(success()) { <div class="state-card success-state">{{success()}}</div> }

      @if(loading() && !limits().length) {
        <div class="state-card">Loading database-managed limits…</div>
      } @else {
        <div class="limit-grid">
          @for(limit of pagedLimits();track limit.key){
            <article class="limit-card">
              <div class="card-top">
                <div><span class="category-badge">{{categoryLabel(limit.category)}}</span><h2>{{limit.label}}</h2></div>
                <span class="unit-pill">{{limit.unit}}</span>
              </div>
              <p>{{limit.description}}</p>
              <code>{{limit.key}}</code>

              <div class="edit-row">
                <mat-form-field appearance="outline">
                  <mat-label>Current value</mat-label>
                  <input matInput type="number" [min]="limit.minValue" [max]="limit.maxValue" [ngModel]="draftValue(limit)" (ngModelChange)="setDraft(limit.key,$event)">
                </mat-form-field>
                <button mat-flat-button type="button" (click)="save(limit)" [disabled]="savingKey()===limit.key || !isDraftValid(limit)">
                  {{savingKey()===limit.key ? 'Saving…' : 'Save'}}
                </button>
              </div>
              <div class="limit-meta"><span>Allowed range: {{limit.minValue}}–{{limit.maxValue}}</span><span>Updated {{formatDate(limit.updatedAt)}}</span></div>
            </article>
          } @empty {
            <div class="state-card empty-state">No limits match this category.</div>
          }
        </div>

        @if(filteredLimits().length > pageSize){
          <footer class="pager">
            <span>Showing {{rangeStart()}}–{{rangeEnd()}} of {{filteredLimits().length}}</span>
            <div><button type="button" (click)="setPage(page()-1)" [disabled]="page()===1">Previous</button><strong>Page {{page()}} of {{pageCount()}}</strong><button type="button" (click)="setPage(page()+1)" [disabled]="page()===pageCount()">Next</button></div>
          </footer>
        }
      }
    </section>
  `,
  styles: [`
    .limits-page{max-width:1380px;margin:0 auto;overflow-x:hidden}.limits-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.summary-grid article{padding:16px;border:1px solid #e4e7ec;border-radius:15px;background:#fff}.summary-grid span,.summary-grid small{display:block;color:#667085;font-size:.7rem}.summary-grid strong{display:block;margin:5px 0;color:#101828;font-size:1.6rem}.filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.filter-row button,.pager button{border:1px solid #d0d5dd;background:#fff;color:#475467;border-radius:999px;padding:8px 12px;font-weight:750;cursor:pointer}.filter-row button.active{background:#101828;color:#fff;border-color:#101828}.state-card{padding:16px;border:1px solid #e4e7ec;border-radius:14px;background:#fff;color:#475467;margin:12px 0}.state-card span{display:block;margin-top:5px}.error-state{border-color:#fecdca;background:#fef3f2;color:#b42318}.success-state{border-color:#abefc6;background:#ecfdf3;color:#067647}.limit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.limit-card{min-width:0;padding:18px;border:1px solid #e4e7ec;border-radius:16px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.03)}.card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.category-badge,.unit-pill{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:.63rem;font-weight:850}.category-badge{background:#eef4ff;color:#175cd3}.unit-pill{background:#f2f4f7;color:#475467}.limit-card h2{margin:6px 0 0;color:#101828;font-size:1rem}.limit-card p{color:#667085;line-height:1.55;font-size:.75rem;min-height:46px}.limit-card code{display:block;max-width:100%;overflow-wrap:anywhere;padding:7px 9px;background:#f8fafc;border-radius:8px;color:#475467;font-size:.65rem}.edit-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:start;margin-top:14px}.edit-row mat-form-field{width:100%}.edit-row button{min-height:56px}.limit-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#667085;font-size:.65rem}.pager{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;color:#667085;font-size:.7rem}.pager>div{display:flex;align-items:center;gap:8px}.pager button:disabled{opacity:.45;cursor:not-allowed}.empty-state{grid-column:1/-1;text-align:center}@media(max-width:1000px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.limits-head{flex-direction:column}.limit-grid{grid-template-columns:1fr}.pager{flex-direction:column;align-items:stretch}.pager>div{justify-content:space-between}}@media(max-width:520px){.summary-grid{grid-template-columns:1fr}.edit-row{grid-template-columns:1fr}.edit-row button{min-height:44px;width:100%}.card-top{flex-direction:column}.limits-page{padding:0 2px}}
  `]
})
export class SystemLimitsComponent {
  private readonly api = inject(ApiService);
  readonly limits = signal<SystemLimit[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly savingKey = signal('');
  readonly filter = signal<LimitFilter>('ALL');
  readonly page = signal(1);
  readonly pageSize = 8;
  readonly drafts = signal<Record<string, number>>({});
  readonly filters: Array<{value:LimitFilter;label:string}> = [
    {value:'ALL',label:'All'}, {value:'AI',label:'AI'}, {value:'YOUTUBE',label:'YouTube'}, {value:'ACCOUNT',label:'Account & age'}
  ];
  readonly filteredLimits = computed(() => this.filter()==='ALL' ? this.limits() : this.limits().filter(item => item.category===this.filter()));
  readonly pageCount = computed(() => Math.max(1,Math.ceil(this.filteredLimits().length/this.pageSize)));
  readonly pagedLimits = computed(() => this.filteredLimits().slice((this.page()-1)*this.pageSize,this.page()*this.pageSize));

  constructor(){ this.load(); }

  load():void{
    this.loading.set(true);this.error.set('');
    this.api.get<SystemLimit[]>('/api/v1/admin/system-limits').subscribe({
      next: rows => { this.limits.set(rows);this.drafts.set(Object.fromEntries(rows.map(row=>[row.key,row.value])));this.page.set(1);this.loading.set(false); },
      error: event => { this.error.set(event.error?.message ?? 'Unable to load system limits.');this.loading.set(false); }
    });
  }
  countCategory(category:SystemLimit['category']):number{return this.limits().filter(item=>item.category===category).length;}
  categoryLabel(category:SystemLimit['category']):string{return category==='YOUTUBE'?'YouTube':category==='AI'?'AI':'Account';}
  setFilter(value:LimitFilter):void{this.filter.set(value);this.page.set(1);}
  setPage(value:number):void{this.page.set(Math.min(this.pageCount(),Math.max(1,value)));}
  rangeStart():number{return this.filteredLimits().length?(this.page()-1)*this.pageSize+1:0;}
  rangeEnd():number{return Math.min(this.page()*this.pageSize,this.filteredLimits().length);}
  draftValue(limit:SystemLimit):number{return this.drafts()[limit.key] ?? limit.value;}
  setDraft(key:string,value:number|string):void{const parsed=Number(value);this.drafts.update(current=>({...current,[key]:parsed}));this.success.set('');}
  isDraftValid(limit:SystemLimit):boolean{const value=this.draftValue(limit);return Number.isInteger(value)&&value>=limit.minValue&&value<=limit.maxValue;}
  save(limit:SystemLimit):void{
    if(!this.isDraftValid(limit))return;
    this.savingKey.set(limit.key);this.error.set('');this.success.set('');
    this.api.patch<{value:number},SystemLimit>(`/api/v1/admin/system-limits/${encodeURIComponent(limit.key)}`,{value:this.draftValue(limit)}).subscribe({
      next: updated => { this.limits.update(rows=>rows.map(row=>row.key===updated.key?updated:row));this.drafts.update(current=>({...current,[updated.key]:updated.value}));this.success.set(`${updated.label} updated to ${updated.value} ${updated.unit}.`);this.savingKey.set(''); },
      error: event => { this.error.set(event.error?.message ?? 'Unable to update this limit.');this.savingKey.set(''); }
    });
  }
  formatDate(value:string):string{return value?new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—';}
}
