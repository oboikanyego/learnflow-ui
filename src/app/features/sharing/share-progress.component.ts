import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { LearningPath } from '../../models/learning.models';

interface ShareResponse { token:string; sharePath:string; }

@Component({
  standalone:true,
  imports:[MatButtonModule],
  template:`
    <section class="share-page page-enter">
      <div class="page-head"><div><span class="eyebrow">Portfolio-ready progress</span><h1>Share learning progress</h1><p class="muted">Create an explicit public link for a learning path. You can revoke it at any time.</p></div></div>
      @if(message()){<div class="notice">{{message()}}</div>}
      <div class="path-grid">
        @for(path of paths();track path._id){
          <article><div><span class="mini-label">{{path.status}}</span><h3>{{path.title}}</h3><p>{{path.description||'Share a clean public summary of this learning path.'}}</p></div>
            @if(shares()[path._id];as url){<div class="share-box"><input [value]="url" readonly><button mat-stroked-button (click)="copy(url)">Copy</button><a mat-button [href]="url" target="_blank" rel="noopener">Preview ↗</a><button mat-button (click)="revoke(path._id)">Revoke</button></div>}@else{<button mat-flat-button class="primary-cta" (click)="enable(path._id)">Create public link</button>}
          </article>
        } @empty {<div class="empty">Create a learning path before sharing progress.</div>}
      </div>
    </section>
  `,
  styles:[`
    .share-page{max-width:1050px;margin:0 auto}.path-grid{display:grid;gap:14px}.path-grid>article{padding:20px;border:1px solid #dfe5ed;border-radius:16px;background:#fff;display:flex;justify-content:space-between;gap:22px;align-items:center}.path-grid h3{margin:5px 0;color:#10233f}.path-grid p{margin:0;color:#66758a}.share-box{display:grid;grid-template-columns:minmax(220px,1fr) auto auto auto;gap:7px;align-items:center;min-width:50%}.share-box input{width:100%;padding:10px;border:1px solid #d5deea;border-radius:8px;color:#526178}.notice{padding:12px 14px;margin-bottom:14px;border-radius:10px;background:#eef8f3;color:#176344}.empty{padding:28px;border:1px dashed #ccd7e5;border-radius:14px;color:#66758a}@media(max-width:800px){.path-grid>article{align-items:flex-start;flex-direction:column}.share-box{width:100%;min-width:0;grid-template-columns:1fr auto}.share-box input{grid-column:1/-1}}
  `]
})
export class ShareProgressComponent implements OnInit{
  private readonly api=inject(ApiService);readonly paths=signal<LearningPath[]>([]);readonly shares=signal<Record<string,string>>({});readonly message=signal('');
  ngOnInit():void{this.api.get<LearningPath[]>('/api/v1/learning-paths').subscribe(value=>this.paths.set(value));}
  enable(id:string):void{this.api.post<object,ShareResponse>(`/api/v1/share-progress/${id}`,{}).subscribe(value=>{const url=`${location.origin}${value.sharePath}`;this.shares.update(current=>({...current,[id]:url}));this.message.set('Public progress link created.');});}
  revoke(id:string):void{this.api.delete(`/api/v1/share-progress/${id}`).subscribe(()=>{this.shares.update(current=>{const next={...current};delete next[id];return next;});this.message.set('Public link revoked.');});}
  copy(url:string):void{void navigator.clipboard.writeText(url);this.message.set('Share link copied.');}
}
