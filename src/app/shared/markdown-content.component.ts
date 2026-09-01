import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-markdown-content',
  standalone: true,
  template: `<div class="markdown-body" [innerHTML]="rendered"></div>`,
  styles: [`
    .markdown-body{font-size:.88rem;line-height:1.65;color:#172b4d;overflow-wrap:anywhere}
    .markdown-body :where(h1,h2,h3,h4){margin:1em 0 .45em;color:#10233f;line-height:1.3;font-weight:780}
    .markdown-body h1{font-size:1.25rem}.markdown-body h2{font-size:1.12rem}.markdown-body h3{font-size:1rem}.markdown-body h4{font-size:.92rem}
    .markdown-body p{margin:.55em 0}.markdown-body ul,.markdown-body ol{margin:.55em 0;padding-left:1.35rem}.markdown-body li{margin:.24em 0}
    .markdown-body blockquote{margin:.75em 0;padding:.55em .8em;border-left:3px solid #8fb8f4;background:#f7f9fc;color:#475467;border-radius:0 8px 8px 0}
    .markdown-body code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:#eef2f7;border:1px solid #e1e6ec;border-radius:5px;padding:.1em .34em;font-size:.82em;color:#17365d}
    .markdown-body pre{margin:.8em 0;padding:12px 14px;overflow:auto;background:#101828;color:#e6edf5;border-radius:10px;border:1px solid #253348}.markdown-body pre code{padding:0;border:0;background:transparent;color:inherit;font-size:.8rem;white-space:pre}
    .markdown-body a{color:#175cd3;font-weight:650;text-decoration:none}.markdown-body a:hover{text-decoration:underline}.markdown-body strong{color:#101828}.markdown-body hr{border:0;border-top:1px solid #e4e7ec;margin:1em 0}
    .markdown-body table{width:100%;border-collapse:collapse;margin:.8em 0;font-size:.82rem}.markdown-body th,.markdown-body td{padding:8px 10px;border:1px solid #e4e7ec;text-align:left}.markdown-body th{background:#f7f9fc;color:#344054}
  `]
})
export class MarkdownContentComponent {
  rendered: SafeHtml = '';
  private source = '';
  constructor(private readonly sanitizer: DomSanitizer) {}

  @Input() set markdown(value: string) {
    this.source = value ?? '';
    this.rendered = this.sanitizer.bypassSecurityTrustHtml(this.renderMarkdown(this.source));
  }

  private escape(value: string): string {
    return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  private inline(value: string): string {
    let out = this.escape(value);
    out = out.replace(/`([^`]+)`/g,'<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>').replace(/(^|[^_])_([^_]+)_/g,'$1<em>$2</em>');
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return out;
  }

  private renderMarkdown(markdown: string): string {
    const lines = markdown.replace(/\r\n?/g,'\n').split('\n');
    const html: string[] = [];
    let inCode = false; let code: string[] = []; let list: 'ul'|'ol'|null = null; let tableRows: string[][] = [];
    const closeList=()=>{if(list){html.push(`</${list}>`);list=null;}};
    const flushTable=()=>{if(!tableRows.length)return;const [head,...rows]=tableRows;html.push('<table><thead><tr>'+head!.map(c=>`<th>${this.inline(c.trim())}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>`<td>${this.inline(c.trim())}</td>`).join('')+'</tr>').join('')+'</tbody></table>');tableRows=[];};
    for (let i=0;i<lines.length;i++) {
      const line=lines[i]!;
      if (/^```/.test(line.trim())) { closeList(); flushTable(); if(inCode){html.push(`<pre><code>${this.escape(code.join('\n'))}</code></pre>`);code=[];inCode=false;}else inCode=true; continue; }
      if(inCode){code.push(line);continue;}
      const table = /^\|(.+)\|$/.exec(line.trim());
      if(table){closeList();const cells=table[1]!.split('|');const next=lines[i+1]?.trim()??'';if(!tableRows.length&&/^\|(?:\s*:?-+:?\s*\|)+$/.test(next)){tableRows.push(cells);i++;continue;}if(tableRows.length){tableRows.push(cells);continue;}}
      flushTable();
      if(!line.trim()){closeList();continue;}
      if(/^---+$/.test(line.trim())){closeList();html.push('<hr>');continue;}
      const heading=/^(#{1,4})\s+(.+)$/.exec(line);if(heading){closeList();const n=heading[1]!.length;html.push(`<h${n}>${this.inline(heading[2]!)}</h${n}>`);continue;}
      const quote=/^>\s?(.*)$/.exec(line);if(quote){closeList();html.push(`<blockquote>${this.inline(quote[1]!)}</blockquote>`);continue;}
      const ul=/^\s*[-*+]\s+(.+)$/.exec(line);if(ul){if(list!=='ul'){closeList();list='ul';html.push('<ul>');}html.push(`<li>${this.inline(ul[1]!)}</li>`);continue;}
      const ol=/^\s*\d+[.)]\s+(.+)$/.exec(line);if(ol){if(list!=='ol'){closeList();list='ol';html.push('<ol>');}html.push(`<li>${this.inline(ol[1]!)}</li>`);continue;}
      closeList();html.push(`<p>${this.inline(line)}</p>`);
    }
    closeList();flushTable();if(inCode)html.push(`<pre><code>${this.escape(code.join('\n'))}</code></pre>`);
    return html.join('');
  }
}
