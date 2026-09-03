import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { NotificationCenterService } from '../../core/notifications/notification-center.service';

type Notification = {_id:string;type:string;title:string;message:string;actionUrl?:string;readAt?:string;createdAt:string};
type Filter = 'ALL' | 'UNREAD' | 'AI' | 'LEARNING';

@Component({
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <section class="page-enter notifications-page">
      <div class="page-head notifications-head">
        <div><span class="eyebrow">Activity centre</span><h1>Notifications</h1><p class="muted">A clear record of reminders, learning activity and background work that needs your attention.</p></div>
        <button mat-stroked-button (click)="load()">Refresh activity</button>
      </div>

      <section class="notification-summary">
        <article><span class="summary-icon unread-icon">●</span><div><strong>{{ unreadCount() }}</strong><span>Unread</span></div></article>
        <article><span class="summary-icon ai-icon">✦</span><div><strong>{{ aiCount() }}</strong><span>AI updates</span></div></article>
        <article><span class="summary-icon learning-icon">◷</span><div><strong>{{ learningCount() }}</strong><span>Learning alerts</span></div></article>
      </section>

      <div class="notification-toolbar">
        <div class="filter-tabs" role="tablist" aria-label="Notification filters">
          <button type="button" [class.active]="filter() === 'ALL'" (click)="setFilter('ALL')">All <span>{{ items().length }}</span></button>
          <button type="button" [class.active]="filter() === 'UNREAD'" (click)="setFilter('UNREAD')">Unread <span>{{ unreadCount() }}</span></button>
          <button type="button" [class.active]="filter() === 'AI'" (click)="setFilter('AI')">AI</button>
          <button type="button" [class.active]="filter() === 'LEARNING'" (click)="setFilter('LEARNING')">Learning</button>
        </div>
        <span class="toolbar-note">Showing {{rangeStart()}}–{{rangeEnd()}} of {{filtered().length}}</span>
      </div>

      <section class="activity-list">
        @for (n of paged(); track n._id) {
          <article class="activity-card" [class.unread]="!n.readAt">
            <div class="activity-rail"><span class="activity-icon" [class.ai]="isAi(n.type)" [class.warning]="n.type === 'MISSED' || n.type === 'AI_PLAN_FAILED'">{{ icon(n.type) }}</span><span class="rail-line"></span></div>
            <div class="activity-body">
              <div class="activity-meta"><span class="notification-type">{{ label(n.type) }}</span><span>{{ relativeTime(n.createdAt) }}</span>@if (!n.readAt) { <span class="new-badge">New</span> }</div>
              <h3>{{ n.title }}</h3><p>{{ n.message }}</p>
              <div class="activity-footer"><span class="absolute-time">{{ formatDateTime(n.createdAt) }}</span><div class="notification-actions">@if (n.actionUrl) { <button mat-flat-button class="primary-cta" (click)="open(n)">Open</button> }@if (!n.readAt) { <button mat-stroked-button (click)="read(n._id)">Mark as read</button> }</div></div>
            </div>
          </article>
        } @empty {
          <div class="empty-state notification-empty"><span class="empty-icon">◎</span><strong>{{ filter() === 'UNREAD' ? 'You are all caught up' : 'Nothing to show here yet' }}</strong><p>{{ filter() === 'UNREAD' ? 'There are no unread notifications waiting for you.' : 'Learning reminders, AI results and progress alerts will appear here as they happen.' }}</p>@if (filter() !== 'ALL') { <button mat-stroked-button (click)="setFilter('ALL')">View all activity</button> }</div>
        }
      </section>
      @if(pageCount()>1){<footer class="pager"><button mat-stroked-button type="button" (click)="setPage(page()-1)" [disabled]="page()===1">Previous</button><span>Page {{page()}} of {{pageCount()}}</span><button mat-stroked-button type="button" (click)="setPage(page()+1)" [disabled]="page()===pageCount()">Next</button></footer>}
    </section>
  `,
  styles: [`
    .notifications-page{max-width:1040px;margin:0 auto}.notifications-head{align-items:flex-end}.notification-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px}.notification-summary article{padding:16px 18px;border:1px solid #e4e7ec;border-radius:12px;background:#fff;display:flex;align-items:center;gap:12px}.summary-icon{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-size:.78rem;font-weight:900}.unread-icon{background:#eff4ff;color:#175cd3}.ai-icon{background:#f4f3ff;color:#6938ef}.learning-icon{background:#ecfdf3;color:#027a48}.notification-summary article>div{display:flex;flex-direction:column}.notification-summary strong{font-size:1.18rem;color:#101828}.notification-summary article span:last-child{font-size:.68rem;color:#667085}.notification-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}.filter-tabs{display:flex;align-items:center;gap:4px;padding:4px;border-radius:10px;background:#f2f4f7;flex-wrap:wrap}.filter-tabs button{border:0;background:transparent;padding:7px 10px;border-radius:7px;color:#667085;font-size:.72rem;font-weight:750;cursor:pointer}.filter-tabs button.active{background:#fff;color:#175cd3;box-shadow:0 1px 3px rgba(16,24,40,.1)}.filter-tabs button span{margin-left:4px;color:#98a2b3}.toolbar-note{font-size:.68rem;color:#98a2b3}.activity-list{display:grid}.activity-card{display:grid;grid-template-columns:42px minmax(0,1fr);gap:12px;padding:0;background:#fff}.activity-card.unread .activity-body{background:linear-gradient(90deg,#f9fbff,transparent 34%)}.activity-rail{display:flex;flex-direction:column;align-items:center}.activity-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#f2f4f7;color:#475467;font-size:.75rem;font-weight:850;border:1px solid #e4e7ec}.activity-icon.ai{background:#f4f3ff;color:#6938ef}.activity-icon.warning{background:#fff4ed;color:#b54708}.rail-line{width:1px;flex:1;min-height:30px;background:#eaecf0}.activity-body{padding:0 0 24px;border-bottom:1px solid #eaecf0;min-width:0}.activity-card+.activity-card{padding-top:18px}.activity-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#98a2b3;font-size:.64rem}.notification-type{color:#475467;font-size:.6rem;font-weight:850;text-transform:uppercase}.new-badge{padding:2px 6px;border-radius:999px;background:#eff4ff;color:#175cd3!important}.activity-body h3{margin:5px 0;color:#101828;font-size:.95rem;overflow-wrap:anywhere}.activity-body p{margin:0;color:#667085;font-size:.8rem;line-height:1.6;overflow-wrap:anywhere}.activity-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:13px}.absolute-time{color:#98a2b3;font-size:.64rem}.notification-actions{display:flex;gap:7px;flex-wrap:wrap}.pager{display:flex;justify-content:flex-end;align-items:center;gap:10px;padding-top:16px}.pager span{color:#667085;font-size:.72rem}.empty-icon{width:46px;height:46px;border-radius:13px;margin:0 auto 12px;display:grid;place-items:center;background:#f2f4f7}@media(max-width:700px){.notification-summary{grid-template-columns:1fr}.notification-toolbar{align-items:flex-start;flex-direction:column}.filter-tabs{width:100%;box-sizing:border-box}.toolbar-note{display:block}.activity-card{grid-template-columns:34px minmax(0,1fr);gap:9px}.activity-icon{width:30px;height:30px}.activity-footer{align-items:flex-start;flex-direction:column}.notification-actions{width:100%}.notification-actions button{flex:1}.pager{justify-content:space-between}}
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(ApiService); private readonly router = inject(Router); private readonly center = inject(NotificationCenterService);
  readonly items = signal<Notification[]>([]); readonly filter = signal<Filter>('ALL'); readonly page=signal(1); readonly pageSize=10;
  readonly unreadCount = computed(() => this.items().filter(item => !item.readAt).length);
  readonly aiCount = computed(() => this.items().filter(item => this.isAi(item.type)).length);
  readonly learningCount = computed(() => this.items().filter(item => this.isLearning(item.type)).length);
  readonly filtered = computed(() => {const f=this.filter();if(f==='UNREAD')return this.items().filter(x=>!x.readAt);if(f==='AI')return this.items().filter(x=>this.isAi(x.type));if(f==='LEARNING')return this.items().filter(x=>this.isLearning(x.type));return this.items();});
  readonly paged=computed(()=>{const start=(this.page()-1)*this.pageSize;return this.filtered().slice(start,start+this.pageSize);});
  ngOnInit(): void { this.load(); }
  load(): void { this.api.get<Notification[]>('/api/v1/notifications').subscribe(value => { this.items.set(value); this.setPage(1); this.center.refresh(); }); }
  setFilter(value:Filter):void{this.filter.set(value);this.page.set(1);} pageCount():number{return Math.max(1,Math.ceil(this.filtered().length/this.pageSize));} setPage(value:number):void{this.page.set(Math.min(Math.max(1,value),this.pageCount()));} rangeStart():number{return this.filtered().length?(this.page()-1)*this.pageSize+1:0;} rangeEnd():number{return Math.min(this.page()*this.pageSize,this.filtered().length);}
  read(id: string): void { this.api.patch(`/api/v1/notifications/${id}/read`, {}).subscribe(() => this.load()); }
  open(notification: Notification): void {if (!notification.readAt) this.api.patch(`/api/v1/notifications/${notification._id}/read`, {}).subscribe(() => this.center.refresh());if (notification.actionUrl) void this.router.navigateByUrl(notification.actionUrl);}
  isAi(type: string): boolean { return type.startsWith('AI_'); } isLearning(type: string): boolean { return type === 'REMINDER' || type === 'MISSED'; }
  icon(type: string): string {if (type === 'AI_PLAN_READY') return '✦';if (type === 'AI_PLAN_FAILED') return '!';if (type === 'REMINDER') return '◷';if (type === 'MISSED') return '!';return '•';}
  label(type: string): string { const text=type.replaceAll('_',' ').toLowerCase(); return text.charAt(0).toUpperCase()+text.slice(1); }
  formatDateTime(value: string): string {const date = new Date(value);return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { weekday:'short', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(date);}
  relativeTime(value: string): string {const date=new Date(value);const diff=Date.now()-date.getTime();if(Number.isNaN(diff))return'';const minutes=Math.floor(diff/60000);if(minutes<1)return'Just now';if(minutes<60)return`${minutes}m ago`;const hours=Math.floor(minutes/60);if(hours<24)return`${hours}h ago`;const days=Math.floor(hours/24);return days<7?`${days}d ago`:this.formatDateTime(value);}
}
