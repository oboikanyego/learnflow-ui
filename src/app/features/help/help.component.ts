import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page-enter help-page">
      <header class="page-head help-hero">
        <div><span class="eyebrow">LearnFlow guide</span><h1>Learn the product in a few minutes.</h1><p class="muted">Start with the core workflow, then explore the areas you need. This guide is written around real tasks rather than feature names.</p></div>
        <a routerLink="/today" class="lf-btn lf-btn-primary">Go to Today</a>
      </header>

      <div class="help-grid">
        <article class="help-card help-card-featured"><span class="help-step">01</span><div><h2>Plan what you want to learn</h2><p>Create a learning goal, import a plan, or use the AI planner to turn a topic into scheduled lessons.</p><div class="help-actions"><a routerLink="/goals">Set a goal</a><a routerLink="/ai-planner">Open planner</a><a routerLink="/import">Import a plan</a></div></div></article>
        <article class="help-card"><span class="help-step">02</span><div><h2>Work from Today</h2><p>Use Today as your starting point. It shows what is next, what needs recovery, and your current learning health.</p><a routerLink="/today">Open Today →</a></div></article>
        <article class="help-card"><span class="help-step">03</span><div><h2>Study in Focus Mode</h2><p>Start a lesson, track real study time, pause when needed, save notes, reflect, and complete the session.</p><a routerLink="/study-history">See study history →</a></div></article>
        <article class="help-card"><span class="help-step">04</span><div><h2>Review and prove mastery</h2><p>Use the review queue for spaced repetition and checkpoints for objective mastery rather than confidence alone.</p><div class="help-actions"><a routerLink="/retention">Review queue</a><a routerLink="/mastery">Mastery</a></div></div></article>
        <article class="help-card"><span class="help-step">05</span><div><h2>Turn learning into career evidence</h2><p>Attach projects, certificates and mastered lessons to skills, then compare your profile with target roles.</p><div class="help-actions"><a routerLink="/career">Career readiness</a><a routerLink="/career/jobs">Job matching</a></div></div></article>
        <article class="help-card"><span class="help-step">06</span><div><h2>Track the opportunity</h2><p>Manage applications, interviews, offers and feedback, then turn interview gaps back into targeted learning.</p><div class="help-actions"><a routerLink="/career/applications">Applications</a><a routerLink="/career/outcomes">Offers & outcomes</a></div></div></article>
      </div>

      <section class="help-section help-contact">
        <div class="section-heading"><span class="eyebrow">Need help or want to shape LearnFlow?</span><h2>Support and feedback</h2><p>Both forms are connected to LearnFlow’s communications flow and are sent to the administrator.</p></div>
        <div class="contact-actions"><a routerLink="/support" class="contact-action"><strong>Get support</strong><span>Account, billing, AI, learning, video or technical problems.</span><b>Open support →</b></a><a routerLink="/feedback" class="contact-action"><strong>Rate LearnFlow</strong><span>Give a 1–5 rating and tell me what should improve.</span><b>Send feedback →</b></a></div>
      </section>

      <section class="help-section">
        <div class="section-heading"><span class="eyebrow">Recommended routine</span><h2>A simple weekly rhythm</h2><p>LearnFlow works best when the app supports your routine instead of becoming another task to manage.</p></div>
        <div class="routine-list"><div><strong>Start of week</strong><span>Check Goals and Today. Adjust anything unrealistic before the week gets busy.</span></div><div><strong>Study sessions</strong><span>Use Focus Mode so actual effort is measured instead of estimated lesson duration.</span></div><div><strong>After learning</strong><span>Rate confidence honestly, complete due reviews and take checkpoints on important topics.</span></div><div><strong>End of week</strong><span>Open Progress and Career Readiness. Decide what should continue, change or become evidence.</span></div></div>
      </section>

      <section class="help-section help-faq"><div class="section-heading"><span class="eyebrow">Where things live</span><h2>Quick orientation</h2></div><div class="orientation-grid"><div><strong>Today</strong><span>Your daily command centre.</span></div><div><strong>Learning</strong><span>Goals, paths, board and progress.</span></div><div><strong>Plan</strong><span>AI planning, imports and coaching.</span></div><div><strong>Review</strong><span>Retention, mastery and study history.</span></div><div><strong>Career</strong><span>Skills, jobs, applications and outcomes.</span></div><div><strong>Account</strong><span>Profile, billing and settings.</span></div></div></section>
    </section>
  `,
  styles: [`
    .help-page{max-width:1120px;margin:0 auto}.help-hero{padding:10px 0 8px}.help-hero h1{max-width:760px;font-size:clamp(2rem,4vw,3.3rem);margin-bottom:12px}.help-hero p{max-width:680px;font-size:1rem}.help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.help-card{display:grid;grid-template-columns:44px 1fr;gap:16px;padding:24px;border:1px solid var(--lf-line);border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.03)}.help-card-featured{grid-column:1/-1;background:#f8fbff;border-color:#c7d7fe}.help-step{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#f2f4f7;color:#344054;font-size:.72rem;font-weight:800}.help-card-featured .help-step{background:#e8f1ff;color:#1849a9}.help-card h2{font-size:1.05rem;margin:0 0 7px;color:#101828}.help-card p{margin:0 0 14px;color:#667085}.help-card a{color:#175cd3;text-decoration:none;font-weight:700}.help-actions{display:flex;gap:14px;flex-wrap:wrap}.help-section{margin-top:44px;padding-top:36px;border-top:1px solid #eaecf0}.contact-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.contact-action{padding:22px;border:1px solid #e4e7ec;border-radius:14px;background:#fff;text-decoration:none;display:flex;flex-direction:column;gap:7px}.contact-action strong{color:#101828;font-size:1rem}.contact-action span{color:#667085;line-height:1.5}.contact-action b{color:#175cd3;margin-top:4px}.routine-list{display:grid;gap:0;border:1px solid #eaecf0;border-radius:14px;background:#fff;overflow:hidden}.routine-list>div{display:grid;grid-template-columns:180px 1fr;gap:22px;padding:18px 20px;border-top:1px solid #eaecf0}.routine-list>div:first-child{border-top:0}.routine-list strong{color:#101828}.routine-list span,.orientation-grid span{color:#667085}.orientation-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.orientation-grid>div{padding:18px;border:1px solid #eaecf0;border-radius:12px;background:#fff;display:flex;flex-direction:column;gap:5px}.orientation-grid strong{color:#101828}@media(max-width:760px){.help-grid,.orientation-grid,.contact-actions{grid-template-columns:1fr}.help-card-featured{grid-column:auto}.routine-list>div{grid-template-columns:1fr;gap:5px}}
  `]
})
export class HelpComponent {}
