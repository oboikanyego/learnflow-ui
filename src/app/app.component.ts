import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="app-header">
      <a routerLink="/" class="brand">LearnFlow</a>
      <nav><a routerLink="/dashboard">Dashboard</a><a routerLink="/learning-paths">Learning Paths</a></nav>
    </header>
    <main class="shell"><router-outlet /></main>
  `
})
export class AppComponent {}
