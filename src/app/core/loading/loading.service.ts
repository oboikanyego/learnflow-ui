import { Injectable, computed, signal } from '@angular/core';

const SHOW_DELAY_MS = 180;
const MIN_VISIBLE_MS = 450;

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly activeRequests = signal(0);
  private readonly visible = signal(false);
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;
  private shownAt = 0;

  readonly isLoading = computed(() => this.visible());

  start(): void {
    this.activeRequests.update(value => value + 1);
    if (this.activeRequests() !== 1 || this.visible()) return;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }

    this.showTimer = setTimeout(() => {
      if (this.activeRequests() === 0) return;
      this.visible.set(true);
      this.shownAt = Date.now();
      this.showTimer = undefined;
    }, SHOW_DELAY_MS);
  }

  stop(): void {
    this.activeRequests.update(value => Math.max(0, value - 1));
    if (this.activeRequests() > 0) return;

    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = undefined;
    }

    if (!this.visible()) return;

    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - this.shownAt));
    this.hideTimer = setTimeout(() => {
      if (this.activeRequests() === 0) this.visible.set(false);
      this.hideTimer = undefined;
    }, remaining);
  }
}
