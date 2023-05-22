import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { POTTranslationRequest } from '../models/translation.request';
import { Observable } from 'rxjs';
import { TranslationService } from './translate.interface';
import { SettingsService } from '../services/settings.service';
import { POTTranslationProvider } from '../models/translation.provider';

@Injectable({
  providedIn: 'root'
})
export class GoogleTranslationService implements TranslationService {
  private url: string = 'https://translation.googleapis.com/language/translate/v2?key=';
  private key: string = '';

  constructor(private http: HttpClient) {
    this.key = localStorage.getItem('POTGTKey') as string;
  }
  public configure(translationProvider: POTTranslationProvider): void {
    this.key = translationProvider.apiKey;
  }

  public translate(request: POTTranslationRequest): Observable<any> {
    return this.http.post<any>(this.url + this.key, request);
  }

}
