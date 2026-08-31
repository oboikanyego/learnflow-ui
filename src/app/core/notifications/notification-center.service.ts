import { Injectable, signal } from '@angular/core';
import { ApiService } from '../services/api.service';

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  readonly unreadCount = signal(0);
  readonly toast = signal<AppNotification | null>(null);
  private timer?: ReturnType<typeof setInterval>;
  private initialized = false;
  private seen = new Set<string>();

  constructor(private readonly api: ApiService) {}

  start(): void {
    if (this.timer) return;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 10_000);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.initialized = false;
    this.seen.clear();
    this.unreadCount.set(0);
    this.toast.set(null);
  }

  refresh(): void {
    this.api.get<AppNotification[]>('/api/v1/notifications').subscribe({
      next: items => {
        this.unreadCount.set(items.filter(item => !item.readAt).length);
        if (this.initialized) {
          const latest = items.find(item => !this.seen.has(item._id) && (item.type === 'AI_PLAN_READY' || item.type === 'AI_PLAN_FAILED'));
          if (latest) this.toast.set(latest);
        }
        this.seen = new Set(items.map(item => item._id));
        this.initialized = true;
      }
    });
  }

  dismissToast(): void { this.toast.set(null); }
}
