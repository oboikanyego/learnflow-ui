import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="landing page-enter">
      <section class="landing-hero">
        <div class="hero-copy">
          <div class="hero-badge"><span></span> Built for people serious about learning</div>
          <h1>Make learning progress feel <em>visible, structured and achievable.</em></h1>
          <p>
            LearnFlow turns a goal into a working learning system — plan the path, protect study time,
            stay accountable, and see exactly what is moving forward.
          </p>
          <div class="hero-actions">
            <a mat-flat-button class="primary-cta hero-primary" routerLink="/register">Create your learning workspace</a>
            <a mat-stroked-button routerLink="/login">Sign in</a>
          </div>
          <div class="hero-proof">
            <span><b>01</b> Plan with AI or import</span>
            <span><b>02</b> Schedule realistic sessions</span>
            <span><b>03</b> Track execution</span>
          </div>
        </div>

        <div class="product-stage" aria-label="LearnFlow product preview">
          <div class="stage-glow"></div>
          <div class="product-window">
            <header class="window-bar">
              <div class="window-brand"><span>LF</span><strong>Learning workspace</strong></div>
              <div class="window-meta"><span class="live-dot"></span> This week</div>
            </header>
            <div class="window-body">
              <aside class="window-nav">
                <span class="nav-active">Overview</span><span>Board</span><span>Learning paths</span><span>AI planner</span>
              </aside>
              <main class="window-content">
                <div class="preview-head"><div><small>ACTIVE PATH</small><h3>React Foundations</h3></div><span class="health-pill">On track</span></div>
                <div class="preview-progress"><div><strong>68%</strong><span>weekly completion</span></div><div class="progress-track"><i></i></div></div>
                <div class="preview-stats"><article><strong>12</strong><span>Lessons</span></article><article><strong>8</strong><span>Completed</span></article><article><strong>5</strong><span>Day streak</span></article></div>
                <div class="next-card"><div class="next-icon">→</div><div><small>NEXT SESSION · WED 19:00</small><strong>Managing component state</strong><span>60 min focused lesson</span></div></div>
              </main>
            </div>
          </div>
        </div>
      </section>

      <section class="value-strip">
        <span>One place for your learning operations</span>
        <div><b>AI planning</b><b>Scheduling</b><b>Progress analytics</b><b>Reminders</b><b>Learning evidence</b></div>
      </section>

      <section class="landing-section">
        <div class="section-intro">
          <span class="eyebrow">A better learning loop</span>
          <h2>From “I should learn this” to a system you can actually follow.</h2>
          <p>LearnFlow removes ambiguity from self-directed learning by making every next action visible.</p>
        </div>
        <div class="capability-grid">
          <article class="capability-card featured">
            <span class="capability-icon">✦</span><div><small>PLAN</small><h3>Start with structure</h3><p>Create a path yourself, import an existing plan, or let AI build a realistic first draft around your availability.</p></div>
          </article>
          <article class="capability-card"><span class="capability-icon">◷</span><div><small>SCHEDULE</small><h3>Protect the time</h3><p>Turn lessons into real sessions with dates, times and durations that fit your week.</p></div></article>
          <article class="capability-card"><span class="capability-icon">✓</span><div><small>EXECUTE</small><h3>See the work move</h3><p>Use a focused board to move learning from backlog to completed without losing context.</p></div></article>
          <article class="capability-card"><span class="capability-icon">↗</span><div><small>IMPROVE</small><h3>Learn from your patterns</h3><p>Track completion, missed sessions, streaks and learning hours so your plan improves with you.</p></div></article>
        </div>
      </section>

      <section class="operating-band">
        <div class="band-copy"><span class="eyebrow light">Your operating rhythm</span><h2>Plan once. Know what to do next every time you return.</h2><p>LearnFlow keeps the system around the learning lightweight while still giving it enough structure to create momentum.</p></div>
        <div class="band-steps">
          <article><span>01</span><div><strong>Define the outcome</strong><p>What capability are you trying to build?</p></div></article>
          <article><span>02</span><div><strong>Break it into lessons</strong><p>Turn the outcome into achievable work.</p></div></article>
          <article><span>03</span><div><strong>Commit the time</strong><p>Schedule sessions you can realistically keep.</p></div></article>
          <article><span>04</span><div><strong>Review and adapt</strong><p>Use progress signals to adjust the plan.</p></div></article>
        </div>
      </section>

      <section class="landing-cta">
        <div><span class="eyebrow">Start with your next goal</span><h2>Build a learning system that survives a busy week.</h2><p>Your roadmap, reminders, progress and AI assistance stay together in one focused workspace.</p></div>
        <a mat-flat-button class="primary-cta" routerLink="/register">Start free</a>
      </section>
    </section>
  `,
  styles: [`
    .landing{overflow:hidden;background:#fff}.landing-hero{min-height:680px;padding:88px max(5vw,42px) 82px;display:grid;grid-template-columns:minmax(0,1.03fr) minmax(460px,.97fr);gap:76px;align-items:center;background:radial-gradient(circle at 80% 18%,rgba(47,111,237,.1),transparent 32%),linear-gradient(180deg,#fff 0%,#fbfcff 100%)}.hero-copy{max-width:780px}.hero-badge{display:inline-flex;align-items:center;gap:9px;padding:7px 11px;border:1px solid #dbe7ff;border-radius:999px;background:#f7faff;color:#344054;font-size:.73rem;font-weight:750}.hero-badge span,.live-dot{width:7px;height:7px;border-radius:50%;background:#12b76a;box-shadow:0 0 0 4px rgba(18,183,106,.1)}.hero-copy h1{margin:18px 0 22px;font-size:clamp(3.2rem,5.3vw,5.8rem);line-height:.98;letter-spacing:-.06em;color:#101828}.hero-copy h1 em{font-style:normal;color:#175cd3}.hero-copy>p{max-width:690px;color:#475467;font-size:1.13rem;line-height:1.72}.hero-actions{display:flex;gap:11px;flex-wrap:wrap;margin:30px 0 28px}.hero-primary{min-height:46px!important}.hero-proof{display:flex;gap:20px;flex-wrap:wrap;border-top:1px solid #eaecf0;padding-top:22px;color:#667085;font-size:.75rem}.hero-proof span{display:flex;gap:7px;align-items:center}.hero-proof b{color:#175cd3;font-size:.65rem;letter-spacing:.06em}.product-stage{position:relative;min-width:0}.stage-glow{position:absolute;inset:8% 4% -8% 14%;border-radius:40%;background:radial-gradient(circle,#cfe0ff 0,rgba(207,224,255,.4) 38%,transparent 72%);filter:blur(24px)}.product-window{position:relative;border:1px solid #d0d5dd;border-radius:20px;background:#fff;box-shadow:0 32px 80px rgba(16,24,40,.16);overflow:hidden;transform:perspective(1200px) rotateY(-2deg) rotateX(1deg)}.window-bar{height:54px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eaecf0;background:#fcfcfd}.window-brand{display:flex;align-items:center;gap:9px;font-size:.73rem;color:#344054}.window-brand>span{width:27px;height:27px;border-radius:7px;display:grid;place-items:center;background:#175cd3;color:#fff;font-weight:800}.window-meta{display:flex;align-items:center;gap:8px;font-size:.68rem;color:#667085}.window-body{display:grid;grid-template-columns:112px minmax(0,1fr);min-height:390px}.window-nav{padding:20px 10px;background:#f8f9fb;border-right:1px solid #eaecf0;display:flex;flex-direction:column;gap:5px}.window-nav span{padding:8px;border-radius:6px;color:#667085;font-size:.62rem;font-weight:650}.window-nav .nav-active{background:#eaf2ff;color:#175cd3}.window-content{padding:27px}.preview-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.preview-head small{font-size:.58rem;font-weight:800;letter-spacing:.1em;color:#667085}.preview-head h3{margin:3px 0 0;color:#101828}.health-pill{padding:5px 8px;border-radius:999px;background:#ecfdf3;color:#027a48;font-size:.58rem;font-weight:800}.preview-progress{margin:29px 0 18px}.preview-progress>div:first-child{display:flex;align-items:baseline;gap:9px}.preview-progress strong{font-size:2rem;color:#101828}.preview-progress span{font-size:.65rem;color:#667085}.progress-track{height:7px;margin-top:8px;background:#eaecf0;border-radius:999px;overflow:hidden}.progress-track i{display:block;width:68%;height:100%;background:linear-gradient(90deg,#175cd3,#53b1fd);border-radius:inherit}.preview-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.preview-stats article{padding:13px;border:1px solid #eaecf0;border-radius:9px;background:#fcfcfd;display:flex;flex-direction:column}.preview-stats strong{font-size:1.25rem;color:#101828}.preview-stats span{font-size:.58rem;color:#667085}.next-card{margin-top:16px;padding:14px;display:flex;gap:12px;border-radius:10px;background:#101828;color:#fff}.next-icon{width:31px;height:31px;border-radius:8px;background:#175cd3;display:grid;place-items:center}.next-card>div:last-child{display:flex;flex-direction:column}.next-card small{color:#98a2b3;font-size:.54rem;font-weight:750;letter-spacing:.06em}.next-card strong{font-size:.76rem;margin-top:3px}.next-card span{font-size:.6rem;color:#d0d5dd}.value-strip{padding:20px max(5vw,42px);display:flex;align-items:center;justify-content:space-between;gap:24px;border-top:1px solid #eaecf0;border-bottom:1px solid #eaecf0;background:#fcfcfd;color:#667085;font-size:.72rem}.value-strip>span{font-weight:750;color:#344054}.value-strip>div{display:flex;gap:24px;flex-wrap:wrap}.value-strip b{font-weight:650}.landing-section{padding:100px max(6vw,48px)}.section-intro{max-width:760px;margin-bottom:46px}.section-intro h2{margin:9px 0 14px;font-size:clamp(2.2rem,3.4vw,3.6rem);color:#101828}.section-intro p{max-width:640px;color:#667085;font-size:1.02rem}.capability-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.capability-card{min-height:205px;padding:28px;border:1px solid #e4e7ec;border-radius:16px;background:#fff;display:flex;gap:18px;transition:.22s ease}.capability-card:hover{transform:translateY(-3px);border-color:#b2ccff;box-shadow:0 16px 34px rgba(16,24,40,.08)}.capability-card.featured{background:linear-gradient(145deg,#f7faff,#fff);border-color:#c7d7fe}.capability-icon{width:42px;height:42px;flex:0 0 42px;border-radius:11px;background:#eff4ff;color:#175cd3;display:grid;place-items:center;font-weight:850}.capability-card small{color:#175cd3;font-size:.6rem;font-weight:850;letter-spacing:.1em}.capability-card h3{margin:7px 0 8px;color:#101828}.capability-card p{margin:0;color:#667085;line-height:1.65}.operating-band{margin:0 max(3vw,24px) 88px;padding:58px;display:grid;grid-template-columns:.9fr 1.1fr;gap:70px;border-radius:26px;background:radial-gradient(circle at 90% 10%,rgba(83,177,253,.2),transparent 30%),#101828;color:#fff}.band-copy h2{margin:10px 0 16px;max-width:520px;font-size:clamp(2rem,3vw,3.15rem)}.band-copy p{max-width:520px;color:#b8c0cc;line-height:1.7}.band-steps{display:grid;gap:10px}.band-steps article{padding:15px 17px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.045);display:flex;gap:15px}.band-steps>article>span{color:#84adff;font-size:.65rem;font-weight:850;letter-spacing:.08em}.band-steps strong{font-size:.82rem}.band-steps p{margin:3px 0 0;color:#98a2b3;font-size:.7rem}.landing-cta{padding:16px max(6vw,48px) 100px;display:flex;align-items:center;justify-content:space-between;gap:40px}.landing-cta>div{max-width:750px}.landing-cta h2{margin:9px 0 12px;font-size:clamp(2rem,3vw,3.1rem);color:#101828}.landing-cta p{color:#667085}.landing-cta>a{min-width:130px}@media(max-width:1050px){.landing-hero{grid-template-columns:1fr;gap:50px}.product-stage{max-width:720px}.capability-grid{grid-template-columns:1fr}.operating-band{grid-template-columns:1fr}.value-strip{align-items:flex-start;flex-direction:column}}@media(max-width:700px){.landing-hero{padding:58px 20px 55px}.hero-copy h1{font-size:clamp(2.7rem,12vw,4.2rem)}.hero-proof{gap:12px;flex-direction:column}.product-window{transform:none;border-radius:14px}.window-body{grid-template-columns:1fr}.window-nav{display:none}.window-content{padding:20px}.value-strip{padding:18px 20px}.value-strip>div{gap:13px}.landing-section{padding:72px 20px}.capability-card{padding:22px;min-height:0}.operating-band{margin:0 12px 60px;padding:34px 22px;border-radius:20px}.landing-cta{padding:10px 20px 72px;align-items:flex-start;flex-direction:column}.landing-cta>a{width:100%}}
  `]
})
export class HomeComponent {}
