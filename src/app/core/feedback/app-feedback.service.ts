import { Injectable, signal } from '@angular/core';

export type FeedbackTone = 'error' | 'warning' | 'info';
export interface AppFeedback { message: string; tone: FeedbackTone; }

@Injectable({ providedIn: 'root' })
export class AppFeedbackService {
  readonly current = signal<AppFeedback | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string, tone: FeedbackTone = 'error'): void {
    this.current.set({ message, tone });
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.current.set(null), 6000);
  }

  dismiss(): void {
    if (this.timer) clearTimeout(this.timer);
    this.current.set(null);
  }
}
