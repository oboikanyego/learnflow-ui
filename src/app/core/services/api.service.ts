import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({providedIn:'root'})
export class ApiService{
 private readonly http=inject(HttpClient);private readonly baseUrl=environment.apiUrl;
 get<T>(path:string):Observable<T>{return this.http.get<T>(`${this.baseUrl}${path}`);}
 post<TBody,TResponse>(path:string,body:TBody):Observable<TResponse>{return this.http.post<TResponse>(`${this.baseUrl}${path}`,body);}
 put<TBody,TResponse>(path:string,body:TBody):Observable<TResponse>{return this.http.put<TResponse>(`${this.baseUrl}${path}`,body);}
 patch<TBody,TResponse>(path:string,body:TBody):Observable<TResponse>{return this.http.patch<TResponse>(`${this.baseUrl}${path}`,body);}
 delete(path:string):Observable<void>{return this.http.delete<void>(`${this.baseUrl}${path}`);}
 postFile<T>(path:string,file:File):Observable<T>{const form=new FormData();form.append('file',file);return this.http.post<T>(`${this.baseUrl}${path}`,form);}
}
