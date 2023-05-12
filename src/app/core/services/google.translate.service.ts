import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GoogleObj } from '../models/google.obj';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleTranslateService {
  private url: string = 'https://translation.googleapis.com/language/translate/v2?key=';
  private key: string = '';

  constructor(private http: HttpClient) {
    this.key = localStorage.getItem('POTGTKey') as string;
  }

  public setKey(key: string): void {
    this.key = key;
    localStorage.setItem('POTGTKey', key);
  }

  public getKey(): string {
    return this.key;
  }

  public translate(obj: GoogleObj): Observable<any> {
    return this.http.post<any>(this.url + this.key, obj);
  }

}
