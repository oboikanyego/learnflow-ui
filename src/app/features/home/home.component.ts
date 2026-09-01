import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="marketing-page">
      <section class="video-hero">
        <video
          class="hero-video"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          poster="https://thumbs.wbm.im/pw/medium/e944c0cd279a134ccd02e510b5f6d1fc.jpg"
          aria-hidden="true">
          <source src="https://player.vimeo.com/progressive_redirect/playback/1177752791/rendition/240p/file.mp4%20%28240p%29.mp4?loc=external&oauth2_token_id=1223210874&signature=52e0fd03dc3e0ac2ad9b5348a2b417dc8bb339e002129afd0469f590d5026a3d" type="video/mp4">
        </video>
        <div class="video-overlay"></div>
        <div class="hero-noise" aria-hidden="true"></div>

        <div class="hero-inner">
          <div class="hero-copy">
            <div class="hero-kicker"><span></span> Learning that fits around real life</div>
            <h1>Turn learning goals into <strong>work you actually finish.</strong></h1>
            <p>Plan the path, protect study time, measure real effort and turn what you learn into evidence you can use.</p>
            <div class="hero-actions">
              <a mat-flat-button class="hero-primary" routerLink="/register">Start learning free</a>
              <a class="hero-secondary" routerLink="/login">Sign in</a>
            </div>
            <div class="hero-trust" aria-label="Product benefits">
              <span>No credit card required</span>
              <span>Plan around your schedule</span>
              <span>Track real study time</span>
            </div>
          </div>

          <aside class="hero-workspace" aria-label="LearnFlow product preview">
            <header><div class="preview-brand"><span>LF</span><div><strong>Today</strong><small>Tuesday, 1 September</small></div></div><span class="preview-status">On track</span></header>
            <section class="preview-focus">
              <small>NEXT FOCUS SESSION</small>
              <h2>Managing component state</h2>
              <p>React Foundations · 45 minutes</p>
              <div class="preview-meta"><span>19:00</span><span>Intermediate</span></div>
              <button type="button" tabindex="-1">Start focus session</button>
            </section>
            <section class="preview-summary">
              <article><strong>4h 35m</strong><span>Focused this week</span></article>
              <article><strong>82%</strong><span>Weekly goal</span></article>
              <article><strong>5 days</strong><span>Current streak</span></article>
            </section>
            <footer><span>2 reviews due</span><span>Next checkpoint tomorrow</span></footer>
          </aside>
        </div>
      </section>

      <section class="proof-bar">
        <p>One workspace for the full learning cycle</p>
        <div><span>Plan</span><i></i><span>Focus</span><i></i><span>Review</span><i></i><span>Master</span><i></i><span>Prove</span></div>
      </section>

      <section class="marketing-section intro-section">
        <div class="section-label">WHY LEARNFLOW</div>
        <div class="section-split">
          <h2>Most learning tools help you collect content. LearnFlow helps you execute.</h2>
          <p>You should always know what to do next, why it matters and whether the time you are investing is producing progress. LearnFlow keeps those signals together without turning your learning into another full-time admin job.</p>
        </div>
      </section>

      <section class="feature-layout marketing-section">
        <article class="feature-story feature-story-large">
          <div class="story-copy"><span>01 · PLAN</span><h3>Build a plan around your actual week.</h3><p>Create a path yourself, import one you already have, or use the planner to turn a goal into realistic sessions.</p></div>
          <div class="mini-schedule"><div class="schedule-head"><strong>This week</strong><span>6h target</span></div><div class="schedule-row"><b>MON</b><span class="schedule-block blue">Angular Signals · 45m</span></div><div class="schedule-row"><b>WED</b><span class="schedule-block navy">System Design · 60m</span></div><div class="schedule-row"><b>SAT</b><span class="schedule-block mint">React Practice · 90m</span></div></div>
        </article>
        <article class="feature-story"><div class="story-icon">▶</div><div class="story-copy"><span>02 · FOCUS</span><h3>Measure effort, not intention.</h3><p>Focus Mode records actual study time, pauses, notes and reflection so progress is based on what happened.</p></div></article>
        <article class="feature-story"><div class="story-icon">↻</div><div class="story-copy"><span>03 · RETAIN</span><h3>Review before you forget.</h3><p>Confidence, spaced reviews and checkpoints bring weak topics back at the right time.</p></div></article>
        <article class="feature-story"><div class="story-icon">↗</div><div class="story-copy"><span>04 · PROVE</span><h3>Turn learning into career evidence.</h3><p>Connect mastered lessons, projects and certificates to target roles and job requirements.</p></div></article>
      </section>

      <section class="workflow-section">
        <div><span class="section-label light">A SIMPLE ROUTINE</span><h2>Open LearnFlow. Know what matters. Do the work.</h2><p>The product is designed around a repeatable operating rhythm rather than endless dashboards.</p></div>
        <ol>
          <li><span>01</span><div><strong>Start in Today</strong><p>See the next session, missed work and reviews due.</p></div></li>
          <li><span>02</span><div><strong>Enter Focus Mode</strong><p>Track the study session and keep useful notes in context.</p></div></li>
          <li><span>03</span><div><strong>Review and assess</strong><p>Use retention and mastery signals to decide what needs another pass.</p></div></li>
          <li><span>04</span><div><strong>Adjust the plan</strong><p>Keep the schedule realistic as your week and goals change.</p></div></li>
        </ol>
      </section>

      <section class="marketing-section final-cta">
        <div><span class="section-label">GET STARTED</span><h2>Build a learning system you can keep using.</h2><p>Start with one goal. LearnFlow will help you turn it into measurable progress.</p></div>
        <a mat-flat-button class="hero-primary" routerLink="/register">Create your workspace</a>
      </section>
    </div>
  `,
  styles: [`
    :host{display:block}.marketing-page{background:#fff;color:#101828}.video-hero{position:relative;min-height:760px;overflow:hidden;background:#0a1424}.hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 48%;filter:saturate(.78) contrast(1.03)}.video-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,14,28,.93) 0%,rgba(6,14,28,.80) 43%,rgba(6,14,28,.42) 70%,rgba(6,14,28,.66) 100%)}.hero-noise{position:absolute;inset:0;opacity:.1;background-image:radial-gradient(rgba(255,255,255,.4) .5px,transparent .5px);background-size:5px 5px}.hero-inner{position:relative;z-index:2;width:min(1440px,100%);min-height:760px;margin:auto;padding:110px clamp(24px,6vw,88px) 80px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(380px,.72fr);gap:80px;align-items:center}.hero-copy{max-width:790px}.hero-kicker{display:inline-flex;align-items:center;gap:10px;color:#dbe7f7;font-size:.78rem;font-weight:650;letter-spacing:.01em}.hero-kicker span{width:8px;height:8px;border-radius:50%;background:#68d391;box-shadow:0 0 0 5px rgba(104,211,145,.12)}.hero-copy h1{margin:20px 0 24px;color:#fff;font-family:Inter,"Segoe UI",sans-serif;font-size:clamp(3.45rem,6vw,6.5rem);line-height:.96;letter-spacing:-.065em;font-weight:560}.hero-copy h1 strong{display:block;color:#9fc5ff;font-weight:650}.hero-copy>p{max-width:700px;margin:0;color:#c8d4e5;font-size:1.16rem;line-height:1.72}.hero-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:34px 0 28px}.hero-primary{min-height:48px!important;padding:0 20px!important;border-radius:8px!important;background:#fff!important;color:#102a56!important;border:1px solid #fff!important;box-shadow:0 1px 2px rgba(0,0,0,.16)!important;font-weight:750!important}.hero-primary:hover{background:#f3f7fc!important;color:#0c244b!important}.hero-secondary{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border:1px solid rgba(255,255,255,.38);border-radius:8px;color:#fff;text-decoration:none;font-weight:700;background:rgba(255,255,255,.08);backdrop-filter:blur(8px)}.hero-secondary:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.55)}.hero-trust{display:flex;gap:20px;flex-wrap:wrap;color:#aebdd0;font-size:.72rem}.hero-trust span:before{content:'✓';margin-right:7px;color:#7be0ae}.hero-workspace{align-self:center;border:1px solid rgba(255,255,255,.28);border-radius:18px;background:rgba(250,252,255,.94);box-shadow:0 30px 90px rgba(0,0,0,.35);backdrop-filter:blur(18px);overflow:hidden;color:#101828}.hero-workspace>header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #e6e9ee}.preview-brand{display:flex;gap:10px;align-items:center}.preview-brand>span{width:32px;height:32px;border-radius:8px;background:#175cd3;color:#fff;display:grid;place-items:center;font-weight:800;font-size:.7rem}.preview-brand>div{display:flex;flex-direction:column}.preview-brand strong{font-size:.82rem}.preview-brand small{font-size:.62rem;color:#7a8493}.preview-status{padding:5px 8px;border-radius:999px;background:#ecfdf3;color:#027a48;font-size:.62rem;font-weight:750}.preview-focus{padding:26px 22px 22px}.preview-focus>small{color:#667085;font-size:.58rem;font-weight:800;letter-spacing:.09em}.preview-focus h2{margin:8px 0 5px;font-size:1.32rem;letter-spacing:-.025em}.preview-focus p{margin:0;color:#667085;font-size:.72rem}.preview-meta{display:flex;gap:8px;margin:15px 0}.preview-meta span{padding:5px 8px;border-radius:6px;background:#f2f4f7;color:#475467;font-size:.61rem;font-weight:700}.preview-focus button{width:100%;min-height:40px;border:0;border-radius:7px;background:#175cd3;color:#fff;font-weight:700}.preview-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#e6e9ee;border-top:1px solid #e6e9ee;border-bottom:1px solid #e6e9ee}.preview-summary article{padding:16px;background:#fff;display:flex;flex-direction:column}.preview-summary strong{font-size:1rem}.preview-summary span{margin-top:3px;color:#7a8493;font-size:.54rem}.hero-workspace footer{padding:13px 18px;display:flex;justify-content:space-between;gap:12px;color:#667085;font-size:.58rem;background:#f9fafb}.proof-bar{min-height:72px;padding:18px clamp(24px,6vw,88px);display:flex;align-items:center;justify-content:space-between;gap:32px;border-bottom:1px solid #eaecf0;background:#fff}.proof-bar p{margin:0;color:#475467;font-size:.8rem;font-weight:650}.proof-bar>div{display:flex;align-items:center;gap:14px;color:#344054;font-size:.72rem;font-weight:700}.proof-bar i{width:22px;height:1px;background:#d0d5dd}.marketing-section{width:min(1280px,100%);margin:0 auto;padding:110px clamp(24px,6vw,72px)}.section-label{font-size:.68rem;font-weight:800;letter-spacing:.12em;color:#175cd3}.section-label.light{color:#9fc5ff}.section-split{display:grid;grid-template-columns:minmax(0,.95fr) minmax(320px,.72fr);gap:100px;margin-top:18px;align-items:end}.section-split h2{margin:0;font-size:clamp(2.25rem,4vw,4rem);line-height:1.05;letter-spacing:-.05em;font-weight:590}.section-split p{margin:0;color:#667085;font-size:1rem;line-height:1.75}.feature-layout{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;padding-top:0}.feature-story{min-height:260px;padding:28px;border:1px solid #e4e7ec;border-radius:14px;background:#fff;display:flex;flex-direction:column;justify-content:space-between}.feature-story-large{grid-column:1/-1;min-height:380px;display:grid;grid-template-columns:.85fr 1.15fr;gap:50px;align-items:center;background:#f8fafc}.story-copy>span{color:#175cd3;font-size:.62rem;font-weight:800;letter-spacing:.1em}.story-copy h3{margin:10px 0 11px;font-size:1.55rem;letter-spacing:-.03em}.feature-story-large h3{font-size:clamp(2rem,3vw,3rem)}.story-copy p{margin:0;color:#667085;line-height:1.7}.story-icon{width:42px;height:42px;border-radius:10px;background:#f2f4f7;display:grid;place-items:center;color:#344054;font-weight:800}.mini-schedule{padding:18px;border:1px solid #e4e7ec;border-radius:12px;background:#fff;box-shadow:0 10px 32px rgba(16,24,40,.07)}.schedule-head{display:flex;justify-content:space-between;padding:4px 3px 14px;font-size:.72rem}.schedule-head span{color:#667085}.schedule-row{display:grid;grid-template-columns:42px 1fr;gap:10px;align-items:center;padding:9px 0;border-top:1px solid #f0f1f3}.schedule-row b{font-size:.58rem;color:#98a2b3}.schedule-block{padding:10px 12px;border-radius:7px;font-size:.65rem;font-weight:700}.schedule-block.blue{background:#eff4ff;color:#1849a9}.schedule-block.navy{background:#eef2f6;color:#344054}.schedule-block.mint{background:#ecfdf3;color:#027a48}.workflow-section{margin:0 clamp(14px,3vw,38px) 30px;padding:74px clamp(24px,6vw,70px);display:grid;grid-template-columns:.85fr 1.15fr;gap:80px;border-radius:20px;background:#101828;color:#fff}.workflow-section h2{margin:14px 0 16px;color:#fff;font-size:clamp(2.1rem,3.5vw,3.8rem);line-height:1.05;letter-spacing:-.045em}.workflow-section>div>p{color:#aeb8c7;line-height:1.7}.workflow-section ol{list-style:none;margin:0;padding:0;display:grid}.workflow-section li{display:grid;grid-template-columns:50px 1fr;gap:18px;padding:18px 0;border-top:1px solid rgba(255,255,255,.12)}.workflow-section li:first-child{border-top:0}.workflow-section li>span{color:#7ea7ef;font-size:.67rem;font-weight:800}.workflow-section strong{color:#fff}.workflow-section li p{margin:4px 0 0;color:#98a2b3;font-size:.76rem}.final-cta{display:flex;align-items:end;justify-content:space-between;gap:50px}.final-cta>div{max-width:800px}.final-cta h2{margin:12px 0;font-size:clamp(2.3rem,4vw,4.2rem);line-height:1.05;letter-spacing:-.05em}.final-cta p{margin:0}.final-cta .hero-primary{background:#175cd3!important;color:#fff!important;border-color:#175cd3!important;white-space:nowrap}@media(max-width:1050px){.hero-inner{grid-template-columns:1fr;gap:48px;padding-top:92px}.hero-copy{max-width:840px}.hero-workspace{max-width:620px}.section-split,.workflow-section{grid-template-columns:1fr;gap:44px}.feature-story-large{grid-template-columns:1fr}.proof-bar{align-items:flex-start;flex-direction:column;gap:12px}}@media(max-width:700px){.video-hero,.hero-inner{min-height:720px}.hero-inner{padding:66px 18px 42px;align-items:end}.hero-copy h1{font-size:clamp(2.8rem,13vw,4.6rem)}.hero-copy>p{font-size:1rem}.hero-actions{width:100%}.hero-primary,.hero-secondary{flex:1;min-width:150px}.hero-workspace{display:none}.hero-video{object-position:58% center}.video-overlay{background:linear-gradient(180deg,rgba(6,14,28,.52),rgba(6,14,28,.92) 63%,rgba(6,14,28,.98))}.proof-bar{padding:18px}.proof-bar>div{width:100%;justify-content:space-between;gap:6px;overflow:auto}.proof-bar i{width:10px}.marketing-section{padding:72px 20px}.section-split{gap:24px}.feature-layout{grid-template-columns:1fr;padding-top:0}.feature-story-large{grid-column:auto;min-height:0}.feature-story{min-height:220px;padding:22px}.workflow-section{margin:0 10px 20px;padding:48px 22px;border-radius:16px}.final-cta{align-items:flex-start;flex-direction:column}.final-cta .hero-primary{width:100%}}@media(prefers-reduced-motion:reduce){.hero-video{display:none}.video-hero{background:linear-gradient(135deg,#0a1424,#19365d)}}
  `]
})
export class HomeComponent {}
