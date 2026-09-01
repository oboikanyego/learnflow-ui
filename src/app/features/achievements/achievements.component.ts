import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { Analytics } from '../../models/learning.models';

interface Achievement { title:string; description:string; icon:string; current:number; target:number; unit:string; }

@Component({
  standalone:true,
  imports:[RouterLink,MatButtonModule],
  template:`
    <section class="achievements page-enter">
      <div class="page-head"><div><span class="eyebrow">Accountability</span><h1>Learning milestones</h1><p class="muted">Achievements reflect work you actually completed: focused sessions, learning time, lessons and consistency.</p></div><a mat-flat-button class="primary-cta" routerLink="/today">Keep learning</a></div>
      @if(stats();as s){
        <section class="achievement-summary"><div><strong>{{unlockedCount()}}</strong><span>Unlocked</span></div><div><strong>{{achievements.length}}</strong><span>Total milestones</span></div><div><strong>{{s.trackedStudyHours ?? 0}}h</strong><span>Tracked focus</span></div></section>
        <section class="achievement-grid">
          @for(item of achievements;track item.title){
            <article [class.unlocked]="isUnlocked(item)">
              <div class="badge">{{item.icon}}</div>
              <div class="copy"><span class="state">{{isUnlocked(item)?'Unlocked':'In progress'}}</span><h3>{{item.title}}</h3><p>{{item.description}}</p><div class="meter"><span [style.width.%]="progress(item)"></span></div><small>{{Math.min(item.current,item.target)}} / {{item.target}} {{item.unit}}</small></div>
            </article>
          }
        </section>
      } @else {<div class="loading">Calculating your milestones…</div>}
    </section>
  `,
  styles:[`
    .achievements{max-width:1120px;margin:0 auto}.achievement-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}.achievement-summary div{padding:18px;border:1px solid #dfe5ed;border-radius:16px;background:#fff;display:flex;flex-direction:column}.achievement-summary strong{font-size:1.7rem;color:#10233f}.achievement-summary span{color:#7a869a;font-size:.7rem;text-transform:uppercase;font-weight:800}.achievement-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.achievement-grid article{display:grid;grid-template-columns:60px 1fr;gap:16px;padding:20px;border:1px solid #dfe5ed;border-radius:18px;background:#fff;opacity:.78}.achievement-grid article.unlocked{border-color:#b7dfcc;background:linear-gradient(135deg,#f6fffa,#fff);opacity:1;box-shadow:0 12px 32px rgba(22,128,92,.06)}.badge{width:56px;height:56px;border-radius:16px;background:#eef2f7;display:grid;place-items:center;font-size:1.5rem}.unlocked .badge{background:#e7f6ee}.copy h3{margin:4px 0;color:#10233f}.copy p{margin:0 0 12px;color:#66758a;font-size:.78rem;line-height:1.5}.state{color:#7a869a;font-size:.62rem;text-transform:uppercase;font-weight:850}.unlocked .state{color:#16805c}.meter{height:7px;background:#e8eef5;border-radius:999px;overflow:hidden}.meter span{display:block;height:100%;background:linear-gradient(90deg,#2f6fed,#20a4c7);border-radius:inherit}.unlocked .meter span{background:#16805c}.copy small{display:block;margin-top:6px;color:#7a869a}.loading{padding:28px;border:1px dashed #ccd7e5;border-radius:18px;background:#fff}@media(max-width:720px){.achievement-summary,.achievement-grid{grid-template-columns:1fr}}
  `]
})
export class AchievementsComponent implements OnInit{
  readonly Math=Math;private readonly api=inject(ApiService);readonly stats=signal<Analytics|null>(null);achievements:Achievement[]=[];
  ngOnInit():void{this.api.get<Analytics>('/api/v1/analytics').subscribe(value=>{this.stats.set(value);this.achievements=[
    {title:'First Focus',description:'Complete your first tracked Focus Mode session.',icon:'◉',current:value.sessionsCompleted??0,target:1,unit:'session'},
    {title:'Momentum Five',description:'Complete five tracked learning sessions.',icon:'⑤',current:value.sessionsCompleted??0,target:5,unit:'sessions'},
    {title:'Deep Work Hour',description:'Invest one full hour in tracked focus time.',icon:'◷',current:value.trackedStudyHours??0,target:1,unit:'hours'},
    {title:'Ten Focus Hours',description:'Build ten hours of measured learning effort.',icon:'✦',current:value.trackedStudyHours??0,target:10,unit:'hours'},
    {title:'Three-Day Rhythm',description:'Maintain learning activity for three consecutive days.',icon:'↗',current:value.currentStreakDays,target:3,unit:'days'},
    {title:'Seven-Day Streak',description:'Protect a full seven-day learning streak.',icon:'◆',current:value.currentStreakDays,target:7,unit:'days'},
    {title:'25 Lessons Done',description:'Complete twenty-five lessons across your learning paths.',icon:'✓',current:value.completedLessons,target:25,unit:'lessons'},
    {title:'Century Learner',description:'Complete one hundred lessons in LearnFlow.',icon:'★',current:value.completedLessons,target:100,unit:'lessons'}
  ];});}
  isUnlocked(item:Achievement):boolean{return item.current>=item.target;}progress(item:Achievement):number{return Math.min(100,Math.round(item.current/item.target*100));}unlockedCount():number{return this.achievements.filter(item=>this.isUnlocked(item)).length;}
}
