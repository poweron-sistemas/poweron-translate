import { Injectable } from '@angular/core';
import { POTSettings } from '../models/settings';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private subject: Subject<POTSettings> = new Subject();

  public setSettings(settings: POTSettings): boolean {
    try {
      localStorage.setItem('POTSettings', JSON.stringify(settings));
      this.subject.next(settings);
      return true;
    } catch (e) {
      return false;
    }
  }

  public observeSettings(): Observable<POTSettings> {
    return this.subject.asObservable();
  }

  public extractSettings(): POTSettings {
    const stored = localStorage.getItem('POTSettings');
    let settings!: POTSettings | undefined;
    try {
      if (stored && stored !== 'null' && stored !== 'undefined') {
        settings = JSON.parse(stored);
      }
    } catch (e) {}

    return settings || {
      splitters: {
        main: [30, 70],
        content: [75, 25]
      },
      theme: 'light',
      translationProviders: undefined,
      webhook: undefined
    };
  }
}
