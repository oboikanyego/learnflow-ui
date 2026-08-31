import { Component,OnInit,inject,signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { NotificationCenterService } from '../../core/notifications/notification-center.service';

type Notification={_id:string;type:string;title:string;message:string;actionUrl?:string;readAt?:string;createdAt:string};

@Component({
  standalone:true,
  imports:[MatButtonModule],
  template:`
    <section class="page-enter notifications-page">
      <div class="page-head"><div><span class="eyebrow">Activity centre</span><h1>Notifications</h1><p class="muted">Learning reminders, missed sessions and completed background work.</p></div><button mat-stroked-button (click)="load()">Refresh</button></div>
      @for(n of items();track n._id){
        <article class="notification" [class.unread]="!n.readAt">
          <div class="notification-copy"><div class="notification-title"><span class="notification-type">{{label(n.type)}}</span><strong>{{n.title}}</strong></div><p>{{n.message}}</p><small>{{formatDateTime(n.createdAt)}}</small></div>
          <div class="notification-actions">@if(n.actionUrl){<button mat-flat-button class="primary-cta" (click)="open(n)">View</button>}@if(!n.readAt){<button mat-stroked-button (click)="read(n._id)">Mark read</button>}</div>
        </article>
      }@empty{<div class="empty-state"><strong>No notifications yet</strong><p>Your reminders and completed background tasks will appear here.</p></div>}
    </section>
  `,
  styles:[`.notifications-page{max-width:980px;margin:0 auto}.notification{align-items:center}.notification-copy{min-width:0;flex:1}.notification-title{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.notification-title strong{color:#172b4d}.notification-type{padding:3px 7px;border-radius:999px;background:#e9f2ff;color:#0c66e4;font-size:.62rem;font-weight:850;text-transform:uppercase;letter-spacing:.04em}.notification-copy p{margin:6px 0;color:#626f86}.notification-copy small{color:#7a869a}.notification-actions{display:flex;gap:8px;flex-wrap:wrap}.empty-state{padding:42px;text-align:center;border:1px dashed #cfd6df;border-radius:14px;color:#626f86}.empty-state strong{color:#172b4d}.empty-state p{margin:5px 0 0}@media(max-width:650px){.notification{align-items:flex-start;flex-direction:column}.notification-actions{width:100%}}`]
})
export class NotificationsComponent implements OnInit{
  private api=inject(ApiService);private router=inject(Router);private center=inject(NotificationCenterService);items=signal<Notification[]>([]);
  ngOnInit(){this.load();}
  load(){this.api.get<Notification[]>('/api/v1/notifications').subscribe(v=>{this.items.set(v);this.center.refresh();});}
  read(id:string){this.api.patch(`/api/v1/notifications/${id}/read`,{}).subscribe(()=>this.load());}
  open(n:Notification){if(!n.readAt)this.api.patch(`/api/v1/notifications/${n._id}/read`,{}).subscribe(()=>this.center.refresh());if(n.actionUrl)void this.router.navigateByUrl(n.actionUrl);}
  label(type:string){return type.replaceAll('_',' ').toLowerCase()}
  formatDateTime(value:string){const d=new Date(value);return Number.isNaN(d.getTime())?value:new Intl.DateTimeFormat(undefined,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)}
}
