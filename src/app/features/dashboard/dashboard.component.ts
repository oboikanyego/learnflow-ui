import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  imports: [MatCardModule],
  template: `<section><h1>Learning dashboard</h1><p class="muted">Track scheduled, completed, missed and upcoming lessons.</p><div class="cards"><mat-card><mat-card-content><strong>0</strong><span>Completed</span></mat-card-content></mat-card><mat-card><mat-card-content><strong>0</strong><span>Scheduled</span></mat-card-content></mat-card><mat-card><mat-card-content><strong>0</strong><span>Missed</span></mat-card-content></mat-card></div></section>`
})
export class DashboardComponent {}
